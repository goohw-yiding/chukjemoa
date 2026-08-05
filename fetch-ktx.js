// KTX 역 좌표 지오코딩 (일회성/드물게). data/ktx_pairs.json(역·요금쌍) + 카카오 → data/ktx_fare.json
// 키: C:\dev\chukjemoa\apikeys.json 의 kakao_rest (없으면 프로젝트 apikeys.json)
// 실행: node fetch-ktx.js   (KTX 운임표는 자주 안 바뀌므로 상시 재수집 불필요)
const fs = require('fs'), path = require('path'), https = require('https');
function readKeys() {
  for (const p of ['C:\\dev\\chukjemoa\\apikeys.json', path.join(__dirname, 'apikeys.json')]) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8').replace(/[\u0000-\u001F]/g, '')); } catch (e) {}
  }
  throw new Error('apikeys.json 없음');
}
const KAKAO = (readKeys().kakao_rest || '').trim();
const src = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/ktx_pairs.json'), 'utf8'));
function get(host, p, h) { return new Promise((res, rej) => { https.get({ host, path: p, headers: h || {} }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(d)); }).on('error', rej); }); }
// 역 이름 → 카카오 검색어 보정
function q(name) {
  const map = { '여수EXPO': '여수엑스포역', '광주송정': '광주송정역', '서울': '서울역', '센텀': '센텀역' };
  if (map[name]) return map[name];
  return name.replace(/역$/, '') + '역';
}
async function geocode(name) {
  const r = await get('dapi.kakao.com', '/v2/local/search/keyword.json?size=1&query=' + encodeURIComponent(q(name)), { Authorization: 'KakaoAK ' + KAKAO });
  const j = JSON.parse(r); const doc = j.documents && j.documents[0];
  return doc ? { x: +doc.x, y: +doc.y } : null;
}
(async () => {
  const coords = {}; let ok = 0, miss = [];
  const st = src.stations;
  for (let i = 0; i < st.length; i++) {
    const c = await geocode(st[i]);
    if (c) { coords[st[i]] = c; ok++; } else miss.push(st[i]);
    if (i % 20 === 0) process.stdout.write('\r지오코딩 ' + (i + 1) + '/' + st.length + ' (성공 ' + ok + ')');
    await new Promise(r => setTimeout(r, 40));
  }
  console.log('\n성공', ok, '/ 실패', miss.length, miss.length ? ('→ ' + miss.join(',')) : '');
  const out = { pairs: src.pairs, stations: st.map(n => ({ n, x: coords[n] ? coords[n].x : null, y: coords[n] ? coords[n].y : null })).filter(s => s.x) };
  fs.writeFileSync(path.join(__dirname, 'data/ktx_fare.json'), JSON.stringify(out));
  console.log('✅ data/ktx_fare.json 저장: 좌표 역', out.stations.length, '· 요금쌍', Object.keys(out.pairs).length);
})();
