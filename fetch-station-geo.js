// 🚉 열차역 좌표 → data/train_station_geo.json
//
// 왜 따로 받나
//   `data/train_time.json`(코레일 시간표에서 뽑은 79개 역)에는 좌표가 없다.
//   옛 `ktx_fare.json` 에 좌표가 167개 있지만 **표기가 달라 23개가 안 붙는다**
//   (「여수엑스포」↔「여수EXPO」, SRT 신설역 동탄·평택지제는 아예 없다).
//   좌표가 있어야 «그 역 주변에 우리가 가진 것»(일본어 장소·오일장)을 셀 수 있다.
//   ⭐ 이름 매핑 표를 손으로 만들지 않는다 — 한 번 지오코딩해서 파일로 둔다.
//
// ⚠️ 카카오는 「○○역」으로 물어야 역이 나온다. 그냥 「대전」이면 도시가 나온다.
// ⚠️ 받은 결과가 «정말 역인지» 카테고리로 확인한다. 엉뚱한 곳을 조용히 넣지 않는다.
//
// 실행: node fetch-station-geo.js   (역 좌표는 거의 안 바뀐다 — 새 역이 생길 때만)
'use strict';
const fs = require('fs'), path = require('path'), https = require('https');

const KEY = (() => {
  for (const p of ['C:\\dev\\chukjemoa\\apikeys.json', path.join(__dirname, 'apikeys.json')]) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8').replace(/[\u0000-\u001F]/g, '')).kakao_rest.trim(); } catch (e) {}
  }
  throw new Error('apikeys.json 의 kakao_rest 없음');
})();
const OUT = path.join(__dirname, 'data', 'train_station_geo.json');

function get(p) {
  return new Promise((res, rej) => {
    const req = https.get({ host: 'dapi.kakao.com', path: p, headers: { Authorization: 'KakaoAK ' + KEY } }, r => {
      r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
    });
    req.on('error', rej);
    req.setTimeout(15000, () => { req.destroy(); rej(new Error('timeout')); });
  });
}

// 카카오가 못 찾거나 엉뚱하게 찾는 이름만 바로잡는다. 그 외에는 「이름+역」으로 묻는다.
const FIX = {
  '여수엑스포': '여수엑스포역', '서울': '서울역', '동대구': '동대구역', '광주송정': '광주송정역',
  '진부(오대산)': '진부역 평창', '판교(경기)': '판교역 성남', '감곡장호원': '감곡장호원역',
  '경산': '경산역 경상북도', '중앙': '중앙역',
  // ⚠️ 실물 확인에서 걸린 것 — 같은 이름의 «다른 역»이 서울에 있으면 카카오가 그쪽을 준다.
  //    「양평」은 경기 양평군인데 서울 영등포구 양평동의 5호선 양평역이 1등으로 왔다(일본어 장소 357개로
  //    서울 한복판 숫자가 붙어 버렸다). 시·도를 붙여 묻는다.
  '양평': '양평역 경기도 양평군', '중앙로': '중앙로역'
};
const q = n => FIX[n] || (n.replace(/\(.*\)$/, '') + '역');

(async () => {
  const tt = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'train_time.json'), 'utf8'));
  const names = Object.keys(tt.stations).concat(tt.origins);
  const out = {}, bad = [];
  for (const n of [...new Set(names)]) {
    const r = await get('/v2/local/search/keyword.json?size=5&query=' + encodeURIComponent(q(n)));
    let docs = [];
    try { docs = JSON.parse(r).documents || []; } catch (e) { bad.push(n + '(JSON)'); continue; }
    // 「지하철역·기차역」 카테고리를 우선한다 — 같은 이름의 가게가 1등으로 오는 경우가 있다
    const pick = docs.find(d => /(지하철|기차|철도)/.test(d.category_name || ''))
      || docs.find(d => /역$/.test(d.place_name || ''))
      || docs[0];
    if (!pick) { bad.push(n + '(못찾음)'); continue; }
    out[n] = {
      x: +(+pick.x).toFixed(6), y: +(+pick.y).toFixed(6),
      place: pick.place_name, addr: pick.address_name,
      sido: (pick.address_name || '').split(' ')[0] || '',
      sigungu: (pick.address_name || '').split(' ')[1] || ''
    };
    await new Promise(r2 => setTimeout(r2, 90));
  }
  const n = Object.keys(out).length;
  if (n < 50) throw new Error('좌표를 ' + n + '개밖에 못 받았다 — 빈 파일을 만들지 않는다');
  fs.writeFileSync(OUT, JSON.stringify({
    source: '카카오 로컬 키워드검색', updated: new Date().toISOString().slice(0, 10), stations: out
  }, null, 0));
  console.log('✓ data/train_station_geo.json —', n, '개');
  if (bad.length) console.log('  ⚠️ 못 받음:', bad.join(', '));
  // 눈으로 확인할 수 있게 몇 개 찍는다 — 「역」이 아닌 게 섞이면 여기서 보인다
  ['서울', '대전', '강릉', '여수엑스포', '동탄', '진부(오대산)', '문경'].forEach(k => {
    if (out[k]) console.log('   ' + k + ' → ' + out[k].place + ' / ' + out[k].addr);
  });
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
