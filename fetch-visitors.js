// 인기 여행지 랭킹 데이터 → data/visitors.json
//  - metcoRegnVisitrDDList : 시도 단위 일별 방문자
//  - locgoRegnVisitrDDList : 시군구 단위 일별 방문자
//  touDivCd  1=현지인(제외)  2=외지인(국내 여행객)  3=외국인
//  최근 30일 vs 그 이전 30일을 나눠 담아 급상승률까지 계산한다. 실행: node fetch-visitors.js
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
async function collect(op, startD, endD, onRow) {
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
    process.stdout.write('\r  ' + op + ' ' + got + '/' + total);
    if (it.length < 1000) break;
    page++; if (page > 200) break;
  }
  process.stdout.write('\n');
}

// 집계 버킷: key → {name, sido, cur:{kor,fgn}, prev:{kor,fgn}}
function bump(agg, key, name, sido, win, row) {
  if (!agg[key]) agg[key] = { name, sido, cur: { kor: 0, fgn: 0 }, prev: { kor: 0, fgn: 0 } };
  const n = +row.touNum || 0;
  if (String(row.touDivCd) === '2') agg[key][win].kor += n;
  else if (String(row.touDivCd) === '3') agg[key][win].fgn += n;
}

function rank(list, pick) {
  return list.map(r => ({ name: r.name, sido: r.sido, num: Math.round(pick(r)) }))
    .filter(r => r.num > 0)
    .sort((a, b) => b.num - a.num)
    .map((r, i) => Object.assign({ rank: i + 1 }, r));
}

async function main() {
  // 관광 빅데이터는 2개월가량 지연 발행 → 오늘-70일을 기준점으로 잡는다
  const curEnd = new Date(); curEnd.setDate(curEnd.getDate() - 70);
  const curStart = new Date(curEnd); curStart.setDate(curStart.getDate() - 29);
  const prevEnd = new Date(curStart); prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - 29);

  const sido = {}, sigungu = {}, sidoNm = {}, dates = new Set();

  for (const [win, s, e] of [['cur', curStart, curEnd], ['prev', prevStart, prevEnd]]) {
    console.log(win + ': ' + ymd(s) + '~' + ymd(e));
    await collect('metcoRegnVisitrDDList', s, e, r => {
      if (win === 'cur') dates.add(r.baseYmd);
      sidoNm[r.areaCode] = shortSido(r.areaNm);
      bump(sido, r.areaCode, shortSido(r.areaNm), '', win, r);
    });
    await collect('locgoRegnVisitrDDList', s, e, r => {
      const sd = sidoNm[String(r.signguCode).slice(0, 2)] || '';
      bump(sigungu, r.signguCode, r.signguNm, sd, win, r);
    });
  }

  const sidoArr = Object.values(sido), sgArr = Object.values(sigungu);

  // 급상승: 현재 30일 외지인 방문자가 일정 규모 이상인 시군구만 대상(소규모 지역 노이즈 제거)
  const MIN = 300000;
  const hot = sgArr
    .filter(r => r.cur.kor >= MIN && r.prev.kor >= MIN)
    .map(r => ({ name: r.name, sido: r.sido, num: Math.round(r.cur.kor), pct: +(((r.cur.kor - r.prev.kor) / r.prev.kor) * 100).toFixed(1) }))
    .filter(r => r.pct > 0)
    .sort((a, b) => b.pct - a.pct)
    .map((r, i) => Object.assign({ rank: i + 1 }, r));

  const ds = [...dates].sort();
  const out = {
    updated: ds.length ? ds[0] + '~' + ds[ds.length - 1] : '',
    kor: rank(sgArr, r => r.cur.kor).slice(0, 40),      // 한국인(외지인)이 많이 가는 시군구
    fgn: rank(sgArr, r => r.cur.fgn).slice(0, 40),      // 외국인이 많이 가는 시군구
    hot: hot.slice(0, 30),                              // 급상승 시군구
    sido: rank(sidoArr, r => r.cur.kor + r.cur.fgn),    // 시도 종합
    ranked: rank(sidoArr, r => r.cur.kor + r.cur.fgn)   // 하위호환(기존 홈 섹션용)
  };
  fs.writeFileSync(path.join(__dirname, 'data', 'visitors.json'), JSON.stringify(out));
  console.log('저장 완료 | 기간', out.updated);
  console.log(' 한국인 TOP5 :', out.kor.slice(0, 5).map(r => r.name + '(' + (r.num / 10000).toFixed(0) + '만)').join(' '));
  console.log(' 외국인 TOP5 :', out.fgn.slice(0, 5).map(r => r.name + '(' + (r.num / 10000).toFixed(0) + '만)').join(' '));
  console.log(' 급상승 TOP5 :', out.hot.slice(0, 5).map(r => r.name + '(+' + r.pct + '%)').join(' '));
  console.log(' 시도   TOP5 :', out.sido.slice(0, 5).map(r => r.name).join(' '));
}
main();
