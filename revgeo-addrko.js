// 좌표 → 한글주소(addrKo) 역지오코딩 — 카카오 로컬 coord2address (무료, 10만건/일)
// 대상: places_{lang}.json 중 addrKo 가 없고 x,y 가 있는 것
// 사용: node revgeo-addrko.js zh|tw|es|en|ja [최대건수]   ·  --probe 면 5건만 찍고 저장 안 함
// ⚠️ NCP 역지오코딩(건당 0.5원)을 사기 전에 이 무료 경로를 먼저 쓴다.
const fs = require('fs'), path = require('path'), https = require('https');
const KEYS = JSON.parse(fs.readFileSync(path.join(__dirname, 'apikeys.json'), 'utf8'));
const KAKAO = KEYS.kakao_rest;
const GAP = 40;

const sleep = ms => new Promise(r => setTimeout(r, ms));
function kakao(p) {
  return new Promise(res => {
    const req = https.get({ host: 'dapi.kakao.com', path: p, headers: { Authorization: 'KakaoAK ' + KAKAO } }, r => {
      r.setEncoding('utf8');
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => { try { res({ code: r.statusCode, j: JSON.parse(d) }); } catch (e) { res({ code: r.statusCode, j: null }); } });
    });
    req.on('error', () => res({ code: 0, j: null }));
    req.setTimeout(10000, () => { req.destroy(); res({ code: 0, j: null }); });
  });
}

// 대한민국 밖 좌표는 쓰지 않는다
const inKorea = (x, y) => x >= 124 && x <= 132 && y >= 33 && y <= 39;

async function rev(x, y) {
  const r = await kakao('/v2/local/geo/coord2address.json?x=' + x + '&y=' + y);
  if (r.code !== 200) return { err: r.code };
  const d = r.j && r.j.documents && r.j.documents[0];
  if (!d) return { addr: null };
  const road = d.road_address && d.road_address.address_name;
  const jibun = d.address && d.address.address_name;
  return { addr: road || jibun || null, src: road ? 'revgeo-road' : 'revgeo-jibun' };
}

(async () => {
  const lang = process.argv[2];
  const probe = process.argv.includes('--probe');
  const cap = Number(process.argv[3]) || 100000;
  if (!lang) { console.log('사용: node revgeo-addrko.js zh|tw|es|en|ja [최대건수] [--probe]'); return; }
  const fp = path.join(__dirname, 'data', 'places_' + lang + '.json');
  const arr = JSON.parse(fs.readFileSync(fp, 'utf8'));

  const need = arr.filter(o => !o.addrKo && o.x && o.y && inKorea(Number(o.x), Number(o.y)));
  const skipNoCoord = arr.filter(o => !o.addrKo).length - need.length;
  console.log(`places_${lang}.json ${arr.length}건 · addrKo 없음 중 좌표로 풀 수 있는 것 ${need.length}건 (좌표 없음·국외 ${skipNoCoord}건)`);

  const todo = need.slice(0, probe ? 5 : cap);
  let ok = 0, miss = 0, err = 0;
  for (let i = 0; i < todo.length; i++) {
    const o = todo[i];
    const r = await rev(Number(o.x), Number(o.y));
    if (r.err) { err++; if (err <= 3) console.log('  ⛔ HTTP ' + r.err); if (err >= 20) { console.log('  ⛔ 오류 20건 — 중단'); break; } }
    else if (r.addr) { ok++; if (!probe) { o.addrKo = r.addr; o.addrSrc = r.src; } if (probe) console.log(`  ${o.ko || o.title} → ${r.addr} (${r.src})`); }
    else { miss++; if (!probe) o.addrKo = ''; }   // 빈 문자열 = 다음 실행에 재시도 안 함
    await sleep(GAP);
    if (!probe && (i % 200 === 0 || i === todo.length - 1)) {
      fs.writeFileSync(fp, JSON.stringify(arr));
      process.stdout.write(`\r  ${i + 1}/${todo.length} 성공 ${ok} · 주소없음 ${miss} · 오류 ${err}`);
    }
  }
  if (probe) { console.log(`\n프로브 ${todo.length}건 — 성공 ${ok} · 주소없음 ${miss} · 오류 ${err} (저장 안 함)`); return; }
  fs.writeFileSync(fp, JSON.stringify(arr));
  const has = arr.filter(o => o.addrKo).length;
  console.log(`\n✓ data/places_${lang}.json — addrKo 보유 ${has}/${arr.length} · 이번 회차 성공 ${ok} · 주소없음 ${miss} · 오류 ${err}`);
})();
