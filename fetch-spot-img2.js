// ── 명소 사진 2차 보강 (searchKeyword2) ──────────────────────────────
// 실행: node fetch-spot-img2.js maple|flower|onsen
//
// 1차(detailImage2)로 못 채운 곳을 «같은 관광공사 안의 다른 레코드»에서 찾는다.
//   같은 산이 관광지(12)·레포츠(28)·문화시설(14) 등 다른 contentTypeId 로 한 번 더 등재돼 있고
//   그쪽에는 사진이 붙어 있는 경우가 있다. 출처가 같으니 저작권·표기 문제가 없다.
//
// 🔴 이름만 같으면 다 가져오면 «다른 산»이 붙는다. 실제로 내부 데이터셋 대조에서
//    「감악산(파주)」에 274km 떨어진 감악산 사진이, 「태화산(경기)」에 106km 떨어진 태화산 사진이
//    걸렸다. → **좌표 3km 이내만** 채택한다. 좌표가 없으면 버린다.
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');

const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const SEARCH = 'https://apis.data.go.kr/B551011/KorService2/searchKeyword2';
const FILES = { maple: 'maple.json', flower: 'flower.json', onsen: 'onsen.json' };
const MAX_KM = 3;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const get = u => new Promise(res => {
  const req = https.get(u, { headers: { 'User-Agent': 'chukjemoa' }, timeout: 15000 }, r => {
    r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
  });
  req.on('error', e => res('__ERR__' + e.message));
  req.on('timeout', () => { req.destroy(); res('__ERR__timeout'); });
});
const km = (x1, y1, x2, y2) => {
  const a = +x1, b = +y1, c = +x2, d = +y2;
  if (!a || !b || !c || !d) return 999;
  return Math.hypot((a - c) * 88, (b - d) * 111);
};
const bare = s => String(s || '').replace(/\([^)]*\)/g, '').replace(/\s/g, '').trim();

async function search(kw) {
  const url = `${SEARCH}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json`
    + `&numOfRows=20&pageNo=1&arrange=A&keyword=${encodeURIComponent(kw)}`;
  const txt = await get(url);
  if (txt.startsWith('__ERR__')) return { err: txt.slice(7) };
  if (/LIMITED_NUMBER_OF_SERVICE_REQUESTS/.test(txt)) return { err: 'RATE' };
  let j; try { j = JSON.parse(txt); } catch (e) { return { err: 'parse' }; }
  const body = j.response && j.response.body;
  if (!body) return { err: 'nobody' };
  let it = body.items && body.items.item;
  if (!it) return { list: [] };
  if (!Array.isArray(it)) it = [it];
  return { list: it };
}

async function run(theme) {
  const p = path.join(__dirname, 'data', FILES[theme]);
  const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
  const todo = arr.filter(r => !r.img && !r.imgTried2);
  console.log(`[${theme}] 사진없음 ${arr.filter(r => !r.img).length} · 이번에 조회 ${todo.length} (3km 이내만 채택)`);
  let ok = 0, far = 0, none = 0, err = 0;
  for (const r of todo) {
    const res = await search(bare(r.title));
    if (res.err) { err++; console.log(`  ! ${r.title} — ${res.err}`); await sleep(200); continue; }
    const cands = res.list.filter(x => x.firstimage && bare(x.title) === bare(r.title));
    const near = cands.map(x => ({ x, d: km(r.x, r.y, x.mapx, x.mapy) }))
      .filter(o => o.d <= MAX_KM).sort((a, b) => a.d - b.d);
    if (near.length) {
      r.img = String(near[0].x.firstimage).replace(/^http:/, 'https:');
      r.imgSrc = 'tourapi:' + near[0].x.contentid;
      r.imgTried2 = 1; ok++;
      console.log(`  ✓ ${r.title} ← ${near[0].x.title} (${near[0].d.toFixed(1)}km)`);
    } else if (cands.length) {
      r.imgTried2 = 1; far++;
      console.log(`  ✗ ${r.title} — 이름은 같은데 ${km(r.x, r.y, cands[0].mapx, cands[0].mapy).toFixed(0)}km 떨어짐(다른 산) → 버림`);
    } else {
      r.imgTried2 = 1; none++;
      console.log(`  · ${r.title} — 사진 붙은 동명 레코드 없음`);
    }
    await sleep(200);
  }
  fs.writeFileSync(p, JSON.stringify(arr));
  const left = arr.filter(x => !x.img).length;
  console.log(`[${theme}] 채움 ${ok} · 다른산이라 버림 ${far} · 없음 ${none} · 오류 ${err} → 남은 ${left}곳`);
}

(async () => { for (const t of (process.argv.slice(2).length ? process.argv.slice(2) : ['maple'])) await run(t); })();
