// ── 명소 사진 보강기 (detailImage2) ──────────────────────────────────
// 실행: node fetch-spot-img.js maple|flower|onsen   (인자 없으면 셋 다)
//
// 왜 만들었나 (2026-09-09 장남 님 지적):
//   /maple/ 카드 326곳 중 50곳(15%)이 사진이 없어 **축제 등불 야경(/img/hero.webp)** 으로
//   대체되고 있었다. 단풍 보러 온 사람에게 등불 사진을 보여 주고 있던 셈이다.
//   목록 API(areaBasedList2)의 firstimage 가 비어도 **detailImage2 에는 사진이 있는 경우가 많다.**
//   대체 이미지를 예쁘게 바꾸기 전에, «실제 그 장소 사진»부터 끝까지 찾는다.
//
// ⚠️ 이 스크립트가 채운 img 는 fetch-spots.js 의 CARRY 목록에 'img' 가 들어 있어야 살아남는다.
//    (안 넣으면 다음 수집 때 firstimage='' 로 덮여 그대로 사라진다 — 2026-08-18 카페 사고와 같은 형태)
// ⚠️ 순차 + 120ms. 동시에 던지면 LIMITED_NUMBER_OF_SERVICE_REQUESTS_PER_SECOND 가 오고,
//    그걸 조용히 삼키면 「사진이 없다」로 보인다.
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');

const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const IMG = 'https://apis.data.go.kr/B551011/KorService2/detailImage2';
const FILES = { maple: 'maple.json', flower: 'flower.json', onsen: 'onsen.json' };

const sleep = ms => new Promise(r => setTimeout(r, ms));
const get = u => new Promise(res => {
  const req = https.get(u, { headers: { 'User-Agent': 'chukjemoa' }, timeout: 15000 }, r => {
    r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
  });
  req.on('error', e => res('__ERR__' + e.message));
  req.on('timeout', () => { req.destroy(); res('__ERR__timeout'); });
});

async function images(cid) {
  const url = `${IMG}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json`
    + `&contentId=${cid}&imageYN=Y&numOfRows=10&pageNo=1`;
  const txt = await get(url);
  if (txt.startsWith('__ERR__')) return { err: txt.slice(7) };
  if (/LIMITED_NUMBER_OF_SERVICE_REQUESTS/.test(txt)) return { err: 'RATE' };
  let j; try { j = JSON.parse(txt); } catch (e) { return { err: 'parse:' + txt.slice(0, 60) }; }
  const body = j.response && j.response.body;
  if (!body) return { err: 'nobody' };
  let it = body.items && body.items.item;
  if (!it) return { list: [] };
  if (!Array.isArray(it)) it = [it];
  const list = it.map(r => String(r.originimgurl || r.smallimageurl || '').trim())
    .filter(Boolean).map(u => u.replace(/^http:/, 'https:'));
  return { list };
}

async function run(theme) {
  const rel = FILES[theme];
  if (!rel) { console.error('알 수 없는 테마:', theme); return; }
  const p = path.join(__dirname, 'data', rel);
  const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
  // imgTried: 「물어는 봤다」 표시. 관광공사에 사진이 아예 없는 곳도 있으니
  //           재실행이 매번 같은 곳을 다시 묻지 않게 한다.
  const todo = arr.filter(r => !r.img && !r.imgTried);
  console.log(`[${theme}] 전체 ${arr.length} · 사진없음 ${arr.filter(r => !r.img).length} · 이번에 조회 ${todo.length}`);
  let ok = 0, none = 0, err = 0;
  for (let i = 0; i < todo.length; i++) {
    const r = todo[i];
    const res = await images(r.id);
    if (res.err) { err++; console.log(`  ! ${r.title} — ${res.err}`); }
    else if (res.list.length) { r.img = res.list[0]; r.imgTried = 1; ok++; console.log(`  ✓ ${r.title} — ${res.list.length}장`); }
    else { r.imgTried = 1; none++; console.log(`  · ${r.title} — 관광공사에 사진 없음`); }
    await sleep(120);
  }
  fs.writeFileSync(p, JSON.stringify(arr));
  const left = arr.filter(x => !x.img).length;
  console.log(`[${theme}] 채움 ${ok} · 원본에 없음 ${none} · 오류 ${err} → 남은 사진없음 ${left}곳 (${Math.round(left / arr.length * 100)}%)`);
}

(async () => {
  const args = process.argv.slice(2);
  for (const t of (args.length ? args : Object.keys(FILES))) await run(t);
})();
