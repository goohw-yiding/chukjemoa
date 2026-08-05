const fs = require('fs'), https = require('https'), http = require('http');
const K = process.env.NK;
function get(u) {
  const lib = u.startsWith('https') ? https : http;
  return new Promise(r => {
    const q = lib.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, s => {
      s.setEncoding('utf8'); let d = ''; s.on('data', c => d += c);
      s.on('end', () => r({ sc: s.statusCode, body: d }));
    });
    q.on('error', e => r({ sc: 0, body: String(e.message) }));
    q.setTimeout(15000, () => { q.destroy(); r({ sc: 0, body: 'timeout' }); });
  });
}
const C = [
  ['① 두루누비(대조군)', `https://apis.data.go.kr/B551011/Durunubi/routeList?serviceKey=${K}&MobileOS=ETC&MobileApp=t&_type=json&numOfRows=3&pageNo=1`],
  ['② 표준-odcloud', `https://api.odcloud.kr/api/15017321/v1/uddi?page=1&perPage=3&serviceKey=${K}`],
  ['③ 표준-tn_pubr(길)', `http://api.data.go.kr/openapi/tn_pubr_public_tour_road_api?serviceKey=${K}&pageNo=1&numOfRows=3&type=json`],
  ['④ 표준-tn_pubr(둘레길)', `http://api.data.go.kr/openapi/tn_pubr_public_dulle_road_api?serviceKey=${K}&pageNo=1&numOfRows=3&type=json`],
  ['⑤ 표준-tn_pubr(관광길)', `http://api.data.go.kr/openapi/tn_pubr_public_tursm_road_api?serviceKey=${K}&pageNo=1&numOfRows=3&type=json`],
  ['⑥ 표준-1741000', `https://apis.data.go.kr/1741000/StanTourRoad/getStanTourRoadList?serviceKey=${K}&pageNo=1&numOfRows=3&type=json`]
];
(async () => {
  for (const [l, u] of C) {
    const r = await get(u);
    let b = r.body.replace(/\s+/g, ' ').slice(0, 190);
    console.log('[' + r.sc + ']', l, '\n     ', b || '(빈응답)');
  }
})();
