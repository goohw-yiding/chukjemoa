// 시외버스 터미널 수집 + 카카오 좌표 지오코딩 → data/bus_terminals.json
// 키: C:\dev\chukjemoa\apikeys.json (tago, kakao_rest). 실행: node fetch-bus-terminals.js
// TAGO 터미널 목록은 자주 안 바뀌므로 드물게 재실행.
const fs = require('fs'), path = require('path'), https = require('https');
function readKeys() {
  for (const p of ['C:\\dev\\chukjemoa\\apikeys.json', path.join(__dirname, 'apikeys.json')]) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8').replace(/[\u0000-\u001F]/g, '')); } catch (e) {}
  }
  throw new Error('apikeys.json 없음');
}
const K = readKeys(), TAGO = (K.tago || '').trim(), KAKAO = (K.kakao_rest || '').trim();
const CITY = { 11: '서울', 12: '세종', 21: '부산', 22: '대구', 23: '인천', 24: '광주', 25: '대전', 26: '울산', 31: '경기', 32: '강원', 33: '충북', 34: '충남', 35: '전북', 36: '전남', 37: '경북', 38: '경남', 39: '제주' };
function get(host, p, h) { return new Promise((res, rej) => { https.get({ host, path: p, headers: h || {} }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(d)); }).on('error', rej); }); }
async function terminals(code) {
  const j = JSON.parse(await get('apis.data.go.kr', '/1613000/SuburbsBusInfo/GetSuberbsBusTrminlList?serviceKey=' + encodeURIComponent(TAGO) + '&_type=json&numOfRows=500&cityCode=' + code));
  const it = j.response && j.response.body && j.response.body.items && j.response.body.items.item;
  return it ? (Array.isArray(it) ? it : [it]) : [];
}
async function geocode(q) {
  const r = await get('dapi.kakao.com', '/v2/local/search/keyword.json?size=1&query=' + encodeURIComponent(q), { Authorization: 'KakaoAK ' + KAKAO });
  const j = JSON.parse(r); const doc = j.documents && j.documents[0];
  return doc ? { x: +doc.x, y: +doc.y } : null;
}
(async () => {
  const all = [];
  for (const code of Object.keys(CITY)) {
    const ts = await terminals(code);
    ts.forEach(t => all.push({ id: t.terminalId, nm: t.terminalNm, city: CITY[code] }));
    process.stdout.write('\r터미널 수집 ' + all.length + ' (도시 ' + code + ')');
  }
  console.log('\n총 터미널', all.length, '— 지오코딩 시작');
  let ok = 0, miss = [];
  for (let i = 0; i < all.length; i++) {
    const t = all[i];
    // 이름 뒤에 지역·터미널 붙여 정확도↑ (예: 서울 서울남부터미널)
    let c = await geocode(t.city + ' ' + t.nm + ' 터미널');
    if (!c) c = await geocode(t.nm + ' 시외버스터미널');
    if (!c) c = await geocode(t.nm + '터미널');
    if (c) { t.x = c.x; t.y = c.y; ok++; } else miss.push(t.city + '/' + t.nm);
    if (i % 20 === 0) process.stdout.write('\r지오코딩 ' + (i + 1) + '/' + all.length + ' (성공 ' + ok + ')');
    await new Promise(r => setTimeout(r, 35));
  }
  console.log('\n성공', ok, '/ 실패', miss.length);
  if (miss.length) console.log('실패목록:', miss.join(', '));
  const out = all.filter(t => t.x);
  fs.writeFileSync(path.join(__dirname, 'data/bus_terminals.json'), JSON.stringify(out));
  console.log('✅ data/bus_terminals.json 저장:', out.length, '개(좌표 있음)');
})();
