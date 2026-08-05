// 인기 여행지 랭킹 데이터 → data/visitors.json
//  - metcoRegnVisitrDDList : 시도 단위 일별 방문자
//  - locgoRegnVisitrDDList : 시군구 단위 일별 방문자
//  touDivCd  1=현지인(제외)  2=외지인(국내 여행객)  3=외국인
//
//  ★ 이 API는 약 30일 지연 발행된다(실측). 그래서 "요즘"을 말할 때는
//     반드시 최신 가용일을 먼저 탐색해 그 구간을 쓰고, 화면에도 기간을 명시한다.
//  ★ 계절 랭킹: 작년 같은 달 실제 방문 데이터 ÷ 작년 연 평균 = "평소 대비 몇 배 붐비는가".
//     지연 데이터로 '지금'을 말하는 대신, 지난 데이터로 '이번 달'을 예고하는 방식.
//  실행: node fetch-visitors.js
const fs = require('fs'), path = require('path'), https = require('https');
const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const BASE = 'https://apis.data.go.kr/B551011/DataLabService/';

function get(u) {
  return new Promise((res, rej) => {
    https.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
    }).on('error', rej);
  });
}
function ymd(d) { return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0'); }
function shortSido(n) {
  return (n || '').replace(/(특별자치시|특별자치도|특별시|광역시|자치도|도)$/, '')
    .replace('충청', '충').replace('전라', '전').replace('경상', '경')
    .replace('라북', '북').replace('라남', '남');
}

// 한 오퍼레이션을 기간별로 전량 페이지네이션 수집 → rows 콜백
async function collect(op, startD, endD, onRow, quiet) {
  let page = 1, total = Infinity, got = 0;
  while ((page - 1) * 1000 < total) {
    const u = `${BASE}${op}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json`
      + `&numOfRows=1000&pageNo=${page}&startYmd=${ymd(startD)}&endYmd=${ymd(endD)}`;
    let j;
    try { j = JSON.parse(await get(u)); }
    catch (e) { console.error('\n  parse err ' + op + ' p' + page); break; }
    const b = j.response && j.response.body;
    if (!b) { console.error('\n  no body ' + op + ' p' + page); break; }
    total = Number(b.totalCount) || 0;
    let it = b.items && b.items.item; if (!it) break; if (!Array.isArray(it)) it = [it];
    for (const r of it) onRow(r);
    got += it.length;
    if (!quiet) process.stdout.write('\r  ' + op + ' ' + got + '/' + total + '   ');
    if (it.length < 1000) break;
    page++; if (page > 300) break;
  }
  if (!quiet) process.stdout.write('\n');
  return got;
}

// 최신 가용일 탐색(이진). 공공데이터 발행 지연이 바뀌어도 자동 추종.
async function latestDay() {
  async function has(d) {
    const s = ymd(d);
    const u = `${BASE}locgoRegnVisitrDDList?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&startYmd=${s}&endYmd=${s}`;
    try { return Number(JSON.parse(await get(u)).response.body.totalCount) > 0; } catch (e) { return false; }
  }
  let lo = new Date(); lo.setDate(lo.getDate() - 150);
  let hi = new Date();
  while ((hi - lo) > 86400000) {
    const mid = new Date((+lo + +hi) / 2); mid.setHours(12, 0, 0, 0);
    if (await has(mid)) lo = mid; else hi = mid;
  }
  lo.setHours(0, 0, 0, 0);
  return lo;
}

// ── 중복 집계 제거 ──
// ① areaCode 12 = '전남광주통합특별시' 레거시 계열. 광주(29)·전남(46)이 따로 있어 이중 집계됨 → 버림
// ② '청주시 흥덕구'처럼 공백이 든 일반구는 상위 '청주시'가 이미 집계돼 있어 이중 → 버림
function skipDup(code, name) {
  if (String(code).slice(0, 2) === '12') return true;
  if (String(name || '').includes(' ')) return true;
  return false;
}
function bump(agg, key, name, sido, row) {
  if (!agg[key]) agg[key] = { code: key, name, sido, kor: 0, fgn: 0 };
  const n = +row.touNum || 0;
  if (String(row.touDivCd) === '2') agg[key].kor += n;
  else if (String(row.touDivCd) === '3') agg[key].fgn += n;
}
function rank(list, pick) {
  return list.map(r => ({ code: r.code, name: r.name, sido: r.sido, num: Math.round(pick(r)) }))
    .filter(r => r.num > 0)
    .sort((a, b) => b.num - a.num)
    .map((r, i) => Object.assign({ rank: i + 1 }, r));
}
function fmtRange(a, b) {
  const f = s => s.slice(0, 4) + '.' + s.slice(4, 6) + '.' + s.slice(6, 8);
  return f(ymd(a)) + '~' + f(ymd(b));
}

// ── 계절 랭킹 ──
// 성수기 배수 = 대상 월 일평균 ÷ 그 해 평소 일평균.
// 기준선(12개월 표본)은 한 번만 받아서 여러 달에 재사용한다(계곡 8월·단풍 10월·봄꽃 4월·온천 1월).
async function buildBaseline(year) {
  const base = {}; let baseDays = 0;
  for (let m = 1; m <= 12; m++) {
    const st = new Date(year, m - 1, 1), en = new Date(year, m - 1, 7);
    const got = await collect('locgoRegnVisitrDDList', st, en, r => {
      if (skipDup(r.signguCode, r.signguNm)) return;
      bump(base, r.signguCode, r.signguNm, '', r);
    }, true);
    if (got > 0) baseDays += 7;
    process.stdout.write('\r  기준선 ' + year + '년 ' + m + '/12   ');
  }
  process.stdout.write('\n');
  return { base, baseDays };
}
async function monthIndex(year, month, B) {
  if (!B.baseDays) return [];
  const cur = {};
  const mStart = new Date(year, month - 1, 1), mEnd = new Date(year, month, 0);
  await collect('locgoRegnVisitrDDList', mStart, mEnd, r => {
    if (skipDup(r.signguCode, r.signguNm)) return;
    bump(cur, r.signguCode, r.signguNm, '', r);
  }, true);
  const mDays = mEnd.getDate(), out = [];
  for (const k of Object.keys(cur)) {
    const b = B.base[k]; if (!b || b.kor <= 0) continue;
    const curDaily = cur[k].kor / mDays, baseDaily = b.kor / B.baseDays;
    if (curDaily < 5000) continue;
    out.push({ code: k, name: cur[k].name, idx: +(curDaily / baseDaily).toFixed(2), num: Math.round(cur[k].kor) });
  }
  process.stdout.write('  ' + year + '-' + month + '월 성수기 ' + out.length + '곳\n');
  return out.sort((a, b) => b.idx - a.idx);
}
// (구버전 호환)
async function seasonRank(year, month) {
  const cur = {}, base = {};
  const mStart = new Date(year, month - 1, 1), mEnd = new Date(year, month, 0);
  process.stdout.write('  계절: ' + year + '-' + month + '월 수집');
  await collect('locgoRegnVisitrDDList', mStart, mEnd, r => {
    if (skipDup(r.signguCode, r.signguNm)) return;
    bump(cur, r.signguCode, r.signguNm, '', r);
  }, true);
  const mDays = mEnd.getDate();
  // 기준선: 같은 해 12개월 각 1~7일 샘플
  let baseDays = 0;
  for (let m = 1; m <= 12; m++) {
    const s = new Date(year, m - 1, 1), e = new Date(year, m - 1, 7);
    const got = await collect('locgoRegnVisitrDDList', s, e, r => {
      if (skipDup(r.signguCode, r.signguNm)) return;
      bump(base, r.signguCode, r.signguNm, '', r);
    }, true);
    if (got > 0) baseDays += 7;
    process.stdout.write('\r  계절: ' + year + '-' + month + '월 기준선 ' + m + '/12   ');
  }
  process.stdout.write('\n');
  if (!baseDays) return [];
  const out = [];
  for (const k of Object.keys(cur)) {
    const b = base[k]; if (!b || b.kor <= 0) continue;
    const curDaily = cur[k].kor / mDays, baseDaily = b.kor / baseDays;
    if (curDaily < 5000) continue;              // 규모가 너무 작은 곳 제외
    out.push({ code: k, name: cur[k].name, idx: +(curDaily / baseDaily).toFixed(2), num: Math.round(cur[k].kor) });
  }
  return out.filter(r => r.idx > 1).sort((a, b) => b.idx - a.idx);
}

async function main() {
  const last = await latestDay();
  const curStart = new Date(last); curStart.setDate(curStart.getDate() - 29);
  console.log('최신 가용일:', ymd(last), '| 집계구간', fmtRange(curStart, last));

  const sido = {}, sg = {}, sidoNm = {};
  await collect('metcoRegnVisitrDDList', curStart, last, r => {
    if (String(r.areaCode) === '12') return;
    sidoNm[r.areaCode] = shortSido(r.areaNm);
    bump(sido, r.areaCode, shortSido(r.areaNm), '', r);
  });
  await collect('locgoRegnVisitrDDList', curStart, last, r => {
    if (skipDup(r.signguCode, r.signguNm)) return;
    bump(sg, r.signguCode, r.signguNm, sidoNm[String(r.signguCode).slice(0, 2)] || '', r);
  });

  // 계절 랭킹 — 작년 같은 달
  const now = new Date(), month = now.getMonth() + 1, sYear = now.getFullYear() - 1;
  const BASE = await buildBaseline(sYear);
  const THEME_MONTHS = { valley: 8, maple: 10, flower: 4, onsen: 1 };
  const seasonByMonth = {};
  for (const m of [...new Set([month, ...Object.values(THEME_MONTHS)])]) {
    seasonByMonth[m] = (await monthIndex(sYear, m, BASE))
      .filter(r => r.idx > 1)
      .map((r, i) => ({ rank: i + 1, code: r.code, name: r.name, sido: sidoNm[String(r.code).slice(0, 2)] || '', idx: r.idx, num: r.num }));
  }
  const seasonAll = (seasonByMonth[month] || []).map((r, i) => ({
    rank: i + 1, code: r.code, name: r.name, sido: r.sido, idx: r.idx, num: r.num
  }));
  const season = seasonAll.slice(0, 25);

  const sidoArr = Object.values(sido), sgArr = Object.values(sg);
  const out = {
    period: fmtRange(curStart, last),
    latest: ymd(last),
    lagDays: Math.round((Date.now() - last) / 86400000),
    season: { year: sYear, month, list: season },
    seasonByMonth: { year: sYear, themeMonths: { valley: 8, maple: 10, flower: 4, onsen: 1 }, months: seasonByMonth },
    kor: rank(sgArr, r => r.kor).slice(0, 40),
    fgn: rank(sgArr, r => r.fgn).slice(0, 40),
    sido: rank(sidoArr, r => r.kor + r.fgn),
    ranked: rank(sidoArr, r => r.kor + r.fgn),
    bySido: {}
  };
  // ── 시도별 드릴다운: 그 시도 안의 시군구만 모아 자체 순위를 매긴다 ──
  for (const [code, nm] of Object.entries(sidoNm)) {
    const mine = sgArr.filter(r => String(r.code).slice(0, 2) === code);
    if (!mine.length) continue;
    const reRank = a => a.map((r, i) => Object.assign({}, r, { rank: i + 1 }));
    out.bySido[nm] = {
      code,
      total: mine.length,
      kor: reRank(rank(mine, r => r.kor)),
      fgn: reRank(rank(mine, r => r.fgn)),
      season: reRank(seasonAll.filter(r => String(r.code).slice(0, 2) === code)
        .map(r => ({ code: r.code, name: r.name, sido: r.sido, idx: r.idx, num: r.num })))
    };
  }
  out.updated = out.period;
  fs.writeFileSync(path.join(__dirname, 'data', 'visitors.json'), JSON.stringify(out));
  console.log('저장 완료 | 기준', out.period, '| 지연', out.lagDays, '일');
  console.log(' 한국인 TOP5 :', out.kor.slice(0, 5).map(r => r.sido + ' ' + r.name + '(' + (r.num / 10000).toFixed(0) + '만)').join('  '));
  console.log(' 외국인 TOP5 :', out.fgn.slice(0, 5).map(r => r.sido + ' ' + r.name + '(' + (r.num / 10000).toFixed(0) + '만)').join('  '));
  console.log(' 월별 성수기 :', Object.entries(seasonByMonth).map(([m, l]) => m + '월(' + l.length + ')').join(' '));
  console.log(' 시도별 그룹 :', Object.keys(out.bySido).length, '개 |', Object.entries(out.bySido).slice(0, 4).map(([k, v]) => k + '(' + v.total + '개 시군구)').join(' '));
  console.log(' ' + month + '월 성수기 TOP8 :', season.slice(0, 8).map(r => r.sido + ' ' + r.name + '(x' + r.idx + ')').join('  '));
}
main();
