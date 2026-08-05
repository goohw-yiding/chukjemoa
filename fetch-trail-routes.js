// 걷기길 노선 소개(두루누비 routeList) → data/trail_routes.json
//  코리아둘레길 4개 노선(해파랑길·남파랑길·서해랑길·DMZ 평화의 길)의 한줄소개·소개글을 가져온다.
//  ※ 제주올레는 사단법인 제주올레가 별도 운영해 공공데이터에 없음.
//  실행: node fetch-trail-routes.js  (연 1회 수준이면 충분 — 소개글은 거의 안 바뀜)
const fs = require('fs'), path = require('path'), https = require('https');
const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const URL = 'https://apis.data.go.kr/B551011/Durunubi/routeList'
  + `?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=50&pageNo=1`;

function get(u) {
  return new Promise((res, rej) => {
    https.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
    }).on('error', rej);
  });
}
// HTML 소개글 → 문단 배열
function toParas(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\t/g, ' ')
    .split('\n').map(s => s.replace(/\s+/g, ' ').trim())
    .filter(s => s.length > 10);
}
(async () => {
  const j = JSON.parse(await get(URL));
  let it = j.response.body.items.item; if (!Array.isArray(it)) it = [it];
  const out = it.map(r => ({
    idx: r.routeIdx,
    name: r.themeNm,
    line: (r.linemsg || '').trim(),
    paras: toParas(r.themedescs)
  })).filter(r => r.name);
  fs.writeFileSync(path.join(__dirname, 'data', 'trail_routes.json'), JSON.stringify(out));
  console.log('노선', out.length, '개 저장');
  out.forEach(r => console.log(' -', r.name, '|', r.line, '| 문단', r.paras.length, '개, 총', r.paras.join(' ').length, '자'));
})();
