// ── 개요(overview) 범용 보강기 ────────────────────────────────────────
// 실행: node fetch-ov.js pets|accessible   (인자 없으면 둘 다)
// TourAPI contentId 만 있으면 어떤 데이터셋이든 detailCommon2 로 개요를 채운다.
//
// ⚠️ 2026-08-18에 배운 것 두 가지를 처음부터 지키고 있다.
//   ① **순차 + 120ms.** 동시 호출하면 초당 제한에 걸리고, 그 응답은
//      {"OpenAPI_ServiceResponse":{...LIMITED_NUMBER_OF_SERVICE_REQUESTS_PER_SECOND...}} 로 온다.
//      예전 코드들이 이걸 조용히 삼켜 「데이터가 없다」로 보였다 → 여기선 «세어서» 보고한다.
//   ② **캐시는 이미 받은 것을 전부 물려준다.** 안 그러면 재실행이 곧 삭제다.
// ⚠️ 개요는 «파일이 무거워지는» 작업이다. 무장애 9,398건에 300자를 붙이면 +8MB다.
//    그래서 길이를 220자로 자르고, 브라우저가 받는 data.json 에서는 build.js 가 ov 를 빼고 내보낸다.
//    (서버가 그리는 카드와 앞으로 만들 시·도별 페이지에서만 쓴다)
'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');

const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const DET = 'https://apis.data.go.kr/B551011/KorService2/detailCommon2';
const OV_MAX = 220;

const TARGETS = {
  pets: 'data/pets.json',
  accessible: 'data/accessible.json'
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s{2,}/g, ' ').trim();
const get = u => new Promise(res => {
  const req = https.get(u, { headers: { 'User-Agent': 'chukjemoa' }, timeout: 15000 }, r => {
    r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
  });
  req.on('error', e => res('__ERR__' + e.message));
  req.on('timeout', () => { req.destroy(); res('__ERR__timeout'); });
});

async function run(key) {
  const rel = TARGETS[key];
  if (!rel) { console.error('알 수 없는 대상:', key, '(pets|accessible)'); return; }
  const fpath = path.join(__dirname, rel);
  const arr = JSON.parse(fs.readFileSync(fpath, 'utf8'));

  // ovDone: 조회를 «시도했다»는 표시. 개요가 없는 곳(관광공사에 원문이 없는 경우)을
  //         매주 다시 물어보지 않기 위해 필요하다. 없으면 재실행이 매번 전량 조회가 된다.
  const todo = arr.filter(o => !o.ov && !o.ovDone);
  console.log(`[${key}] ${arr.length}건 중 조회 대상 ${todo.length}건 (이미 개요 ${arr.filter(o => o.ov).length} · 조회했지만 없음 ${arr.filter(o => !o.ov && o.ovDone).length})`);

  let got = 0, none = 0, apiErr = 0;
  for (let i = 0; i < todo.length; i++) {
    const o = todo[i];
    const t = await get(`${DET}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${o.id}`);
    if (t.startsWith('__ERR__')) { apiErr++; }
    else {
      try {
        const j = JSON.parse(t);
        if (j.OpenAPI_ServiceResponse) apiErr++;                 // ← 조용히 삼키지 않는다
        else {
          const it = j.response && j.response.body && j.response.body.items;
          const d = it && it.item ? (Array.isArray(it.item) ? it.item[0] : it.item) : null;
          const ov = clean(d && d.overview).slice(0, OV_MAX);
          if (ov) { o.ov = ov; got++; } else none++;
          o.ovDone = 1;                                          // 있든 없든 «물어봤다»고 표시
        }
      } catch (e) { apiErr++; }
    }
    if (i % 25 === 0 || i === todo.length - 1) {
      process.stdout.write(`\r[${key}] ${i + 1}/${todo.length} (개요+${got} 없음${none}${apiErr ? ' ⚠️API오류' + apiErr : ''})`);
      if (i % 200 === 0) fs.writeFileSync(fpath, JSON.stringify(arr));   // 중간에 끊겨도 이어서
    }
    await sleep(120);
  }
  console.log('');
  fs.writeFileSync(fpath, JSON.stringify(arr));
  const pct = Math.round(arr.filter(o => o.ov).length / arr.length * 100);
  const kb = Math.round(fs.statSync(fpath).size / 1024);
  console.log(`[${key}] 저장 · 개요 ${pct}% · 파일 ${kb}KB`
    + (apiErr ? `  ⚠️ API 오류 ${apiErr}회 (초당 제한이면 간격을 늘릴 것)` : ''));
}

(async () => {
  const arg = (process.argv[2] || '').trim();
  for (const k of (arg ? [arg] : Object.keys(TARGETS))) await run(k);
})();
