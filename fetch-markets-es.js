// 🏮 전국 오일장·전통시장 서어(스페인어)판 — TourAPI SpnService2 쇼핑(79) cat3=A04010100(오일장)+A04010200(전통시장) → data/markets_es.json
// ※ 영문판(fetch-markets-en.js)과 같은 구조. contentTypeId=79 는 EngService2 전용이 아니라
//   Jpn/Spn/Chs 언어서비스에도 동일하게 존재한다(2026-08-27 실측).
//   region 은 1차로 lDongRegnCd(행정구역코드)를 RMAP으로 매핑한다 — fetch-festivals-es.js 와 동일 코드.
//   드물게 코드가 비어 오는 항목은 addr1(로마자 표기) 텍스트에서 지역명을 찾아 보완한다.
const fs = require('fs'), path = require('path'), https = require('https');
const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const B = 'https://apis.data.go.kr/B551011/SpnService2';
const CAT3S = ['A04010100', 'A04010200']; // 오일장 / 전통시장
const RMAP = { '11': 'Seúl', '26': 'Busan', '27': 'Daegu', '28': 'Incheon', '29': 'Gwangju', '30': 'Daejeon', '31': 'Ulsan', '36': 'Sejong', '41': 'Gyeonggi', '43': 'Chungbuk', '44': 'Chungnam', '46': 'Jeonnam', '47': 'Gyeongbuk', '48': 'Gyeongnam', '50': 'Jeju', '51': 'Gangwon', '52': 'Jeonbuk' };

function get(u) {
  return new Promise((res, rej) => https.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
    r.setEncoding('utf8');
    let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
  }).on('error', rej));
}
const clean = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
  .replace(/&amp;/g, '&').replace(/\s{2,}/g, ' ').trim();
const sleep = ms => new Promise(r => setTimeout(r, ms));
function stripTrailingParens(t) {
  t = String(t || '').trim();
  for (let guard = 0; guard < 6; guard++) {
    t = t.trim();
    const last = t[t.length - 1];
    if (last !== ')' && last !== '）') break;
    let depth = 0, i = t.length - 1, openIdx = -1;
    for (; i >= 0; i--) {
      const c = t[i];
      if (c === ')' || c === '）') depth++;
      else if (c === '(' || c === '（') { depth--; if (depth === 0) { openIdx = i; break; } }
    }
    if (openIdx < 0) break;
    t = t.slice(0, openIdx).trim();
  }
  return t || String(t || '').trim();
}
function cleanName(raw) {
  let t = stripTrailingParens(clean(raw));
  if (/[가-힣]$/.test(t)) {
    const m = t.match(/^(.*?)[\s/]+([가-힣][가-힣0-9()., \/]*)$/);
    if (m && /[^가-힣0-9()., \/]/.test(m[1])) t = stripTrailingParens(m[1]);
  }
  const opens = (t.match(/[(（]/g) || []).length, closes = (t.match(/[)）]/g) || []).length;
  if (opens !== closes) {
    const lastOpen = Math.max(t.lastIndexOf('('), t.lastIndexOf('（'));
    if (lastOpen >= 0) t = t.slice(0, lastOpen).trim();
  }
  return t.trim();
}
function regionOf(code, addr) {
  if (RMAP[code]) return RMAP[code];
  if (!addr) return '';
  const hit = Object.values(RMAP).find(v => addr.indexOf(v) >= 0);
  return hit || '';
}

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
    const addr = clean(it.addr1);
    out.push({
      id: it.contentid,
      name: cleanName(it.title),
      nameRaw: clean(it.title),
      addr,
      region: regionOf(it.lDongRegnCd, addr),
      x: +it.mapx || 0, y: +it.mapy || 0,
      img: it.firstimage || '',
      cat3: it.cat3 || '',
      fair: clean(intro.fairday),
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
    '· 개요', out.filter(m => m.ov).length, '· 좌표', out.filter(m => m.x && m.y).length, '· 사진', out.filter(m => m.img).length,
    '· region 빈 곳', out.filter(m => !m.region).length);
  fs.writeFileSync(path.join(__dirname, 'data', 'markets_es.json'), JSON.stringify(out));
  console.log('✓ data/markets_es.json 저장');
}
run().catch(e => { console.error('실패:', e.message); process.exit(1); });
