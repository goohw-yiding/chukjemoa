// 서울 문화행사 정보(서울 열린데이터광장 culturalEventInfo) → data/seoul_culture.json
//
// 왜 (2026-09-11)
//   「서울전시회」 월 88,900 · 「전시회」 55,200 인데 축제모아는 90일간 전시 노출이 «0»이었다.
//   우리 축제 데이터(TourAPI·행안부)에는 전시가 거의 없다 — 그건 «축제»가 아니라 «문화행사»다.
//
// ⚠️ 재고를 과대평가하지 말 것. 누적 19,518건 중 «아직 안 끝난 것»은 417건뿐이다(2.1%).
//    그중 전시/미술이 105건. 대량 생산할 규모가 아니라 «한 장짜리 목록»이 맞다.
//
// ⚠️ 팝업스토어는 이 데이터에 «0건»이다(누적 전체에서 제목·프로그램 검색). 공공데이터에 없다.
//
// 두 가지를 함께 저장한다.
//   live   — 아직 안 끝난 행사 (페이지에 싣는 것)
//   venue  — 누적 전체로 센 「전시가 자주 열린 공간」 (데이터로만 알 수 있는 것. 운현궁 기획전시실 107회 등)
//
// 실행: node fetch-seoul-culture.js
// 키: seoul.key (서울 열린데이터광장 인증키 · *.key 라 git 제외)
const fs = require('fs'), path = require('path'), http = require('http');
const KEY = fs.readFileSync(path.join(__dirname, 'seoul.key'), 'utf8').trim();
const OUT = path.join(__dirname, 'data', 'seoul_culture.json');

const get = u => new Promise((res, rej) => http.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
  r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
}).on('error', rej));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();

(async () => {
  const T0 = Date.now();
  let all = [], total = 0, err = 0;
  // ⚠️ 한 호출 최대 1,000건(공식 안내). 19,518건이면 20번.
  for (let s = 1; s <= 40000; s += 1000) {
    let d;
    try { d = await get(`http://openapi.seoul.go.kr:8088/${KEY}/json/culturalEventInfo/${s}/${s + 999}/`); }
    catch (e) { err++; console.log('  !! 호출 실패', s, String(e.message).slice(0, 50)); break; }
    let b;
    try { b = JSON.parse(d)[Object.keys(JSON.parse(d))[0]]; }
    catch (e) { err++; console.log('  !! JSON 아님:', d.slice(0, 160)); break; }
    if (!b || !b.row) {
      // RESULT 만 오는 경우(범위 초과 등)는 정상 종료
      if (b && b.RESULT) console.log('  종료 신호:', b.RESULT.CODE, b.RESULT.MESSAGE);
      break;
    }
    total = b.list_total_count;
    all = all.concat(b.row);
    if (all.length >= total) break;
    await sleep(120);
  }
  if (!all.length) { console.log('❌ 한 건도 못 받았다 — 기존 파일을 건드리지 않는다'); process.exit(1); }
  console.log('받음 %d/%d건 (%.0f초)', all.length, total, (Date.now() - T0) / 1000);

  const today = new Date().toISOString().slice(0, 10);
  const d10 = s => String(s || '').slice(0, 10);

  // ── 아직 안 끝난 것만 페이지에 싣는다
  const live = all
    .filter(x => d10(x.END_DATE) >= today)
    .map(x => ({
      cat: clean(x.CODENAME), gu: clean(x.GUNAME), title: clean(x.TITLE),
      start: d10(x.STRTDATE), end: d10(x.END_DATE),
      place: clean(x.PLACE), org: clean(x.ORG_NAME),
      trgt: clean(x.USE_TRGT), fee: clean(x.USE_FEE), free: x.IS_FREE === '무료',
      img: clean(x.MAIN_IMG), hp: clean(x.ORG_LINK || x.HMPG_ADDR),
      x: +x.LOT || 0, y: +x.LAT || 0, player: clean(x.PLAYER), program: clean(x.PROGRAM)
    }))
    .sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));

  // ── 누적 전체로 「전시가 자주 열린 공간」 — 이건 우리만 셀 수 있는 숫자다
  const vm = {};
  all.filter(x => /전시/.test(x.CODENAME || '')).forEach(x => {
    const p = clean(x.PLACE).split(/[(（]/)[0].trim();
    if (p.length < 2) return;
    const v = vm[p] || (vm[p] = { place: p, gu: clean(x.GUNAME), n: 0, last: '' });
    v.n++;
    const e = d10(x.END_DATE); if (e > v.last) v.last = e;
    if (!v.x && +x.LOT) { v.x = +x.LOT; v.y = +x.LAT; }
  });
  const venue = Object.values(vm).filter(v => v.n >= 3).sort((a, b) => b.n - a.n);

  const catOf = {}; live.forEach(x => catOf[x.cat] = (catOf[x.cat] || 0) + 1);
  fs.writeFileSync(OUT, JSON.stringify({
    fetched: today, total, live, venue
  }), 'utf8');
  console.log('저장 — 미종료 %d건 · 전시 자주 열린 공간 %d곳 (3회 이상) → data/seoul_culture.json',
    live.length, venue.length);
  console.log('분류:', Object.entries(catOf).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([k, v]) => k + ' ' + v).join(' · '));
})();
