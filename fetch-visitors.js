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
      r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
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
//
// ⚠️ 통합 전환기 방어: 한 응답 안에 12(통합)와 29/46(옛 광주·전남)이 «동시에» 들어오면
//    그대로 더하면 이중 집계가 된다. 실측상 둘은 같이 오지 않지만, 어느 날 겹쳐 오면
//    숫자가 조용히 두 배가 되므로 여기서 막는다. 페이지 단위로는 못 본다(12와 29가
//    다른 페이지에 나뉠 수 있다) → **전량 모은 뒤 한 번에 판정**한다.
async function collect(op, startD, endD, onRow, quiet) {
  const buf = [];
  const emit = r => buf.push(r);
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
    for (const r of it) emit(r);
    got += it.length;
    if (!quiet) process.stdout.write('\r  ' + op + ' ' + got + '/' + total + '   ');
    if (it.length < 1000) break;
    page++; if (page > 300) break;
  }
  // ⚠️ 판정은 «수집 전체»가 아니라 «하루 단위»로 한다.
  //    2026-08 실측: 30일 구간 안에 통합 이전 날(29/46)과 이후 날(12)이 섞여 있었다.
  //    전체 기준으로 12를 버리면 통합 이후 날의 광주·전남이 통째로 빠져 «조용한 누락»이 된다.
  //    하루 안에서는 두 형태가 같이 오지 않으므로, 그 날 옛 코드가 있을 때만 그 날의 12를 버린다.
  const pre = r => String(r.signguCode || r.areaCode || '').slice(0, 2);
  const oldDays = new Set();
  for (const r of buf) if (pre(r) === '29' || pre(r) === '46') oldDays.add(String(r.baseYmd || ''));
  let dropped = 0;
  for (const r of buf) {
    if (pre(r) === '12' && oldDays.has(String(r.baseYmd || ''))) { dropped++; continue; }
    onRow(r);
  }
  if (dropped && !quiet) process.stdout.write('\n  ⚠️ 같은 날에 12(통합)와 29/46(옛 코드)이 함께 와서 12 ' + dropped + '행을 버렸습니다\n');
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
// ⚠️ 2026-08-31 정정 — 예전 주석은 「areaCode 12(전남광주통합특별시)는 레거시라 버린다」였다.
//    그때는 맞았지만 **행정구역 통합이 실제로 반영되면서 뒤집혔다.** API 실측:
//      · 2025-08-01 응답 → 29(광주) 15행 + 46(전남) 66행, 12 없음  (시도 17개)
//      · 2026-08-01 응답 → 12(전남광주통합) 81행, 29·46 없음        (시도 16개)
//    즉 12를 버리는 순간 **광주·전남이 통째로 사라진다.** 실제로 data/visitors.json 의
//    bySido 가 15개뿐이었고, 광주·전남 축제 68개에서 「붐빔 배수」가 안 나오고 있었다.
//    → 이제 12는 버리지 않고 «옛 광주(29)·전남(46)으로 되가른다»(unmerge12).
//    ⭐ 교훈: 공공데이터의 코드 체계는 바뀐다. 「레거시라 버림」 규칙은 유효기간이 있다.
// ② '청주시 흥덕구'처럼 공백이 든 일반구는 상위 '청주시'가 이미 집계돼 있어 이중 → 버림
function skipDup(code, name) {
  if (String(name || '').includes(' ')) return true;
  return false;
}

// 광주광역시 5개 자치구. code 12 안에서만 판정하므로 부산 동구·대구 서구 등과 겹치지 않는다.
const GWANGJU_GU = new Set(['동구', '서구', '남구', '북구', '광산구']);
// 통합 코드 12xxx → 옛 광주(29xxx)·전남(46xxx)으로 되돌린다.
// 뒤 3자리는 옛 코드와 다르지만(12210 동구 vs 29110 동구) 코드는 내부 그룹핑·고유키로만 쓰고
// 실제 조인은 «시도명|시군구명»으로 하므로 문제되지 않는다(festival.js BUSY 키).
function unmerge12(code, name) {
  const c = String(code);
  if (c.slice(0, 2) !== '12') return { code: c, sidoCode: c.slice(0, 2) };
  const gj = GWANGJU_GU.has(String(name || '').trim());
  return { code: (gj ? '29' : '46') + c.slice(2), sidoCode: gj ? '29' : '46' };
}
function bump(agg, key, name, sido, row) {
  if (!agg[key]) agg[key] = { code: key, name, sido, kor: 0, fgn: 0 };
  const n = +row.touNum || 0;
  if (String(row.touDivCd) === '2') agg[key].kor += n;
  else if (String(row.touDivCd) === '3') agg[key].fgn += n;
}
// 시·군·구 한 행을 집계에 더한다. 통합코드(12)는 여기서 광주/전남으로 되가른다.
// ⚠️ 시·군·구 집계는 반드시 이 함수로 할 것 — 직접 bump 하면 12가 그대로 남아 시도가 빠진다.
function bumpSg(agg, row, sidoNm) {
  if (skipDup(row.signguCode, row.signguNm)) return;
  const u = unmerge12(row.signguCode, row.signguNm);
  bump(agg, u.code, row.signguNm, (sidoNm && sidoNm[u.sidoCode]) || '', row);
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
      bumpSg(base, r);
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
    bumpSg(cur, r);
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
    bumpSg(cur, r);
  }, true);
  const mDays = mEnd.getDate();
  // 기준선: 같은 해 12개월 각 1~7일 샘플
  let baseDays = 0;
  for (let m = 1; m <= 12; m++) {
    const s = new Date(year, m - 1, 1), e = new Date(year, m - 1, 7);
    const got = await collect('locgoRegnVisitrDDList', s, e, r => {
      bumpSg(base, r);
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
  // 시도 단위 응답의 12(전남광주통합)는 **한 덩어리라 되가를 수 없다.** 그래서 여기서는 건너뛰고,
  // 아래에서 시·군·구 합으로 광주·전남을 다시 만든다.
  await collect('metcoRegnVisitrDDList', curStart, last, r => {
    if (String(r.areaCode) === '12') return;
    sidoNm[r.areaCode] = shortSido(r.areaNm);
    bump(sido, r.areaCode, shortSido(r.areaNm), '', r);
  });
  // 통합코드에서 되가른 29·46 이 이름을 못 찾으면 bySido 키가 빈 문자열이 된다 → 미리 박아 둔다.
  sidoNm['29'] = sidoNm['29'] || '광주';
  sidoNm['46'] = sidoNm['46'] || '전남';

  await collect('locgoRegnVisitrDDList', curStart, last, r => bumpSg(sg, r, sidoNm));

  // 시도 랭킹에 광주·전남이 없으면(=통합코드로만 온 경우) 시·군·구 합으로 복원한다.
  for (const [cd, nm] of [['29', '광주'], ['46', '전남']]) {
    if (sido[cd]) continue;
    const mine = Object.values(sg).filter(r => String(r.code).slice(0, 2) === cd);
    if (!mine.length) continue;
    sido[cd] = {
      code: cd, name: nm, sido: '',
      kor: mine.reduce((s, r) => s + r.kor, 0),
      fgn: mine.reduce((s, r) => s + r.fgn, 0)
    };
    console.log('  ↩ 통합코드에서 복원: ' + nm + ' (' + mine.length + '개 시군구)');
  }

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
