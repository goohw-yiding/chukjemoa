// 🏮 전국 오일장·전통시장 영문판 — TourAPI EngService2 쇼핑(79) cat3=A04010100(오일장)+A04010200(전통시장) → data/markets_en.json
// ※ 한국어판(fetch-markets.js)과 달리 EngService2는 language-service 전용 contentTypeId(79)를 쓰고,
//    contentId 자체가 한국어판(KorService2)과 전혀 다른 네임스페이스다(2026-08-20 실측, 143개 중 0개 일치).
//    그래서 이 스크립트는 한국어 시장을 "번역"하는 게 아니라, 영문 서비스가 이미 큐레이션해 둔
//    오일장/전통시장 목록(cat3 두 개 합쳐 34곳, 2026-08-20 실측)을 그대로 가져온다 — 전부 정부 공식 영문 원문.
//    ⚠️ fairday 필드가 이미 "On the 2nd, 7th..." 같은 완성된 영문 문장으로 온다 — 한국어판처럼
//       정규식으로 장날을 추측할 필요가 없다. 문자열 원문을 그대로 쓴다(지어내지 않는다).
const fs = require('fs'), path = require('path'), https = require('https');
const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const B = 'https://apis.data.go.kr/B551011/EngService2';
const CAT3S = ['A04010100', 'A04010200']; // 오일장 / 전통시장

function get(u) {
  return new Promise((res, rej) => https.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
    r.setEncoding('utf8');
    let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
  }).on('error', rej));
}
const clean = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
  .replace(/&amp;/g, '&').replace(/\s{2,}/g, ' ').trim();
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const all = [];
  for (const cat3 of CAT3S) {
    const url = `${B}/areaBasedList2?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json`
      + `&numOfRows=200&pageNo=1&contentTypeId=79&cat1=A04&cat2=A0401&cat3=${cat3}&arrange=A`;
    const j = JSON.parse(await get(url));
    const items = (j.response.body.items && j.response.body.items.item) || [];
    console.log(`cat3=${cat3}:`, items.length, '곳');
    all.push(...items);
    await sleep(150);
  }
  console.log('합계(중복 포함)', all.length);

  const out = [];
  const seen = new Set();
  for (let i = 0; i < all.length; i++) {
    const it = all[i];
    if (seen.has(it.contentid)) continue;
    seen.add(it.contentid);
    let ov = '', intro = {};
    try {
      const d = await get(`${B}/detailCommon2?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${it.contentid}`);
      const j = JSON.parse(d);
      const arr = (j.response.body.items && j.response.body.items.item) || [];
      ov = clean((arr[0] || {}).overview || '');
    } catch (e) { }
    await sleep(120);
    try {
      const d2 = await get(`${B}/detailIntro2?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${it.contentid}&contentTypeId=79`);
      const j2 = JSON.parse(d2);
      const arr2 = (j2.response.body.items && j2.response.body.items.item) || [];
      intro = arr2[0] || {};
    } catch (e) { }
    out.push({
      id: it.contentid,
      name: clean(it.title).replace(/\s*\([^)]*\)\s*$/, m => /[가-힣]/.test(m) ? '' : m), // 제목 끝 한글 괄호(원문 병기)는 제거
      nameRaw: clean(it.title),
      addr: clean(it.addr1),
      x: +it.mapx || 0, y: +it.mapy || 0,
      img: it.firstimage || '',
      cat3: it.cat3 || '',
      fair: clean(intro.fairday),                 // 이미 완성된 영문 문장 — 그대로 사용
      sale: clean(intro.saleitem).slice(0, 120),
      open: clean(intro.opentime).slice(0, 100),
      rest: clean(intro.restdateshopping).slice(0, 80),
      park: clean(intro.parkingshopping).slice(0, 100),
      tel: clean(intro.infocentershopping).slice(0, 60),
      since: clean(intro.opendateshopping).slice(0, 40),
      ov
    });
    if ((i + 1) % 10 === 0) console.log('  수집', i + 1, '/', all.length);
    await sleep(120);
  }
  console.log('✓ 최종', out.length, '곳 · 장날문구', out.filter(m => m.fair).length,
    '· 개요', out.filter(m => m.ov).length, '· 좌표', out.filter(m => m.x && m.y).length, '· 사진', out.filter(m => m.img).length);
  fs.writeFileSync(path.join(__dirname, 'data', 'markets_en.json'), JSON.stringify(out));
  console.log('✓ data/markets_en.json 저장');
}
run().catch(e => { console.error('실패:', e.message); process.exit(1); });
