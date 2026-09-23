// 좌표 → 한글주소(addrKo) 역지오코딩 — NAVER Cloud Platform Maps Reverse Geocoding (유료, 건당 0.5원)
// ⚠️ 이 API를 쓰기 전에 revgeo-addrko.js(카카오, 무료)를 먼저 돌렸는지 확인할 것.
// 대상: places_{lang}.json 중 addrKo 가 없고 x,y 가 있는 것 (카카오가 못 찾은 것들)
// 사용: node revgeo-ncp.js zh|tw|es|en|ja [최대건수] [--probe]
const fs = require('fs'), path = require('path'), https = require('https');
const KEYS = JSON.parse(fs.readFileSync(path.join(__dirname, 'apikeys.json'), 'utf8'));
const NCP_ID = KEYS.ncp_client_id, NCP_KEY = KEYS.ncp_client_secret;
const GAP = 100;

const sleep = ms => new Promise(r => setTimeout(r, ms));
function ncp(x, y) {
  return new Promise(res => {
    const q = `/map-reversegeocode/v2/gc?coords=${x},${y}&sourcecrs=EPSG:4326&output=json&orders=roadaddr,addr`;
    const req = https.get({
      host: 'maps.apigw.ntruss.com', path: q,
      headers: { 'x-ncp-apigw-api-key-id': NCP_ID, 'x-ncp-apigw-api-key': NCP_KEY }
    }, r => {
      r.setEncoding('utf8');
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => { try { res({ code: r.statusCode, j: JSON.parse(d) }); } catch (e) { res({ code: r.statusCode, j: null }); } });
    });
    req.on('error', () => res({ code: 0, j: null }));
    req.setTimeout(10000, () => { req.destroy(); res({ code: 0, j: null }); });
  });
}

const inKorea = (x, y) => x >= 124 && x <= 132 && y >= 33 && y <= 39;

function pick(j) {
  if (!j || !j.status || j.status.code !== 0 || !j.results || !j.results.length) return null;
  const road = j.results.find(r => r.name === 'roadaddr');
  const jibun = j.results.find(r => r.name === 'addr');
  const mk = (r) => {
    const a = r.region || {};
    const a1 = (a.area1 && a.area1.name) || '', a2 = (a.area2 && a.area2.name) || '';
    const a3 = (a.area3 && a.area3.name) || '', a4 = (a.area4 && a.area4.name) || '';
    if (r.name === 'roadaddr') {
      const roadNm = (r.land && r.land.name) || '';
      const num = (r.land && r.land.number1) || '';
      if (!roadNm) return null;
      return [a1, a2, a3, roadNm, num].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    } else {
      const n1 = (r.land && r.land.number1) || '', n2 = (r.land && r.land.number2) || '';
      const jibunNo = (n2 && n2 !== '0') ? (n1 + '-' + n2) : n1;
      return [a1, a2, a3, a4, jibunNo].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    }
  };
  if (road) { const s = mk(road); if (s) return { addr: s, src: 'ncp-road' }; }
  if (jibun) { const s = mk(jibun); if (s) return { addr: s, src: 'ncp-jibun' }; }
  return null;
}

(async () => {
  const lang = process.argv[2];
  const probe = process.argv.includes('--probe');
  const cap = Number(process.argv[3]) || 100000;
  if (!lang) { console.log('사용: node revgeo-ncp.js zh|tw|es|en|ja [최대건수] [--probe]'); return; }
  if (!NCP_ID || !NCP_KEY) { console.log('⛔ apikeys.json 에 ncp_client_id/ncp_client_secret 없음'); return; }
  const fp = path.join(__dirname, 'data', 'places_' + lang + '.json');
  const arr = JSON.parse(fs.readFileSync(fp, 'utf8'));

  const need = arr.filter(o => !o.addrKo && o.x && o.y && inKorea(Number(o.x), Number(o.y)));
  console.log(`places_${lang}.json ${arr.length}건 · addrKo 없음 중 좌표 있는 것(NCP 대상) ${need.length}건`);

  const todo = need.slice(0, probe ? 5 : cap);
  let ok = 0, miss = 0, err = 0;
  for (let i = 0; i < todo.length; i++) {
    const o = todo[i];
    const r = await ncp(Number(o.x), Number(o.y));
    if (r.code !== 200) { err++; if (err <= 3) console.log('  ⛔ HTTP ' + r.code); if (err >= 20) { console.log('  ⛔ 오류 20건 — 중단'); break; } }
    else {
      const picked = pick(r.j);
      if (picked) { ok++; if (!probe) { o.addrKo = picked.addr; o.addrSrc = picked.src; } if (probe) console.log(`  ${o.ko || o.title} → ${picked.addr} (${picked.src})`); }
      else { miss++; if (!probe) o.addrKo = ''; }
    }
    await sleep(GAP);
    if (!probe && (i % 20 === 0 || i === todo.length - 1)) {
      fs.writeFileSync(fp, JSON.stringify(arr));
      process.stdout.write(`\r  ${i + 1}/${todo.length} 성공 ${ok} · 주소없음 ${miss} · 오류 ${err}`);
    }
  }
  if (probe) { console.log(`\n프로브 ${todo.length}건 — 성공 ${ok} · 주소없음 ${miss} · 오류 ${err} (저장 안 함)`); return; }
  fs.writeFileSync(fp, JSON.stringify(arr));
  const has = arr.filter(o => o.addrKo).length;
  console.log(`\n✓ data/places_${lang}.json — addrKo 보유 ${has}/${arr.length} · 이번 회차 성공 ${ok}(NCP 유료 약 ${(ok*0.5).toFixed(1)}원) · 주소없음 ${miss} · 오류 ${err}`);
})();
