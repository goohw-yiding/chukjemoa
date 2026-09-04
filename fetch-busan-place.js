// 🏛 부산 문화공간(공연장·전시공간) 601곳 → data/busan_places.json
//
// 왜 (2026-09-04)
//   부산 문화 4종(콘서트·전시·기타·뮤지컬) API 는 장소를 **이름(`place_nm`)으로만** 준다.
//   주소·좌표가 없어 지도도 날씨도 못 붙고, 우리 기존 부산 데이터로는 126건 중 37건밖에 못 이었다.
//   ⭐ 이 데이터셋이 그 구멍을 정확히 메운다 — `placeNm · addr · lttd · lngt · tel · seatCnt · sigungu · attech(사진)`.
//
// ⚠️ 「전시공간 목록(15063756)」과 「공연장 목록(15063754)」은 **엔드포인트만 다르고 내용이 같다**(둘 다 601곳).
//    그래서 하나만 받아도 되지만, 한쪽이 죽을 때를 대비해 순서대로 시도하고 «먼저 성공한 것»을 쓴다.
//
// 실행: node fetch-busan-place.js
const fs = require('fs'), path = require('path'), https = require('https');
const OUT = path.join(__dirname, 'data', 'busan_places.json');
let KEY = '';
try { KEY = fs.readFileSync(path.join(__dirname, 'busan.key'), 'utf8').trim(); } catch (e) { }
if (!KEY) { console.log('⛔ busan.key 없음'); process.exit(1); }

const SRC = [
  ['전시공간', 'BusanCultureExhibitPlaceService', 'getBusanCultureExhibitPlace'],
  ['공연장', 'BusanCulturePerformPlaceService', 'getBusanCulturePerformPlace']
];
const get = u => new Promise((res, rej) => {
  https.get(u, { headers: { 'User-Agent': 'chukjemoa' }, timeout: 25000 }, r => {
    r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res({ s: r.statusCode, d }));
  }).on('error', rej).on('timeout', function () { this.destroy(new Error('timeout')); });
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
const num = v => { const n = Number(v); return isFinite(n) ? n : NaN; };

function rows(j) {
  const top = j[Object.keys(j)[0]] || {}; const b = top.body || top;
  let it = b.items || b.item || []; if (it && it.item) it = it.item;
  if (!Array.isArray(it)) it = it ? [it] : [];
  return { list: it, total: Number(b.totalCount || top.totalCount || 0) };
}

(async () => {
  let all = [], used = '';
  for (const [name, svc, op] of SRC) {
    const got = [];
    let total = 0, ok = true;
    for (let p = 1; p <= 5; p++) {
      const u = `https://apis.data.go.kr/6260000/${svc}/${op}?serviceKey=${KEY}&pageNo=${p}&numOfRows=500&resultType=json`;
      let r; try { r = await get(u); } catch (e) { console.log(`  ⚠️ ${name} ${e.message}`); ok = false; break; }
      if (r.s !== 200) { console.log(`  ⚠️ ${name} HTTP ${r.s}`); ok = false; break; }
      let j; try { j = JSON.parse(r.d); } catch (e) { console.log(`  ⚠️ ${name} 파싱실패`); ok = false; break; }
      const { list, total: t } = rows(j);
      total = t || total; got.push(...list);
      if (got.length >= total || list.length < 500) break;
      await sleep(150);
    }
    console.log(`  ${name} ${got.length}/${total}`);
    if (ok && got.length) { all = got; used = name; break; }
  }
  if (!all.length) { console.log('⛔ 0곳 — 기존 파일을 덮어쓰지 않는다'); process.exit(1); }

  // ⚠️ 좌표는 쓰기 전에 거른다 — 부산은 위도 34.8~35.5 · 경도 128.7~129.4
  const out = [], seen = new Set();
  let badXY = 0;
  for (const x of all) {
    const nm = clean(x.placeNm);
    if (!nm || seen.has(nm)) continue;
    seen.add(nm);
    const y = num(x.lttd), xx = num(x.lngt);
    const ok = isFinite(xx) && isFinite(y) && xx > 128.7 && xx < 129.4 && y > 34.8 && y < 35.5;
    if (!ok && (x.lttd || x.lngt)) badXY++;
    out.push({
      id: clean(x.placeId), name: nm,
      gu: clean(x.sigungu), addr: clean(x.addr), tel: clean(x.tel),
      url: clean(x.url), img: clean(x.attech),
      seat: Number(x.seatCnt) || 0, attr: clean(x.attr),
      x: ok ? String(xx) : '', y: ok ? String(y) : ''
    });
  }

  fs.writeFileSync(OUT, JSON.stringify({
    generated: new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10),
    source: `부산광역시 ${used} 목록 서비스(공공데이터포털)`, rows: out
  }), 'utf8');
  console.log(`✓ data/busan_places.json — ${out.length}곳 · 주소 ${out.filter(r => r.addr).length}`
    + ` · 좌표 ${out.filter(r => r.x).length}${badXY ? ` (부산 밖 좌표 ${badXY}건 버림)` : ''}`
    + ` · 사진 ${out.filter(r => r.img).length} · 좌석수 ${out.filter(r => r.seat).length}`);
})();
