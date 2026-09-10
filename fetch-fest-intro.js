// 🎪 축제 «그 축제만의 것» 수집기 — TourAPI detailIntro2 (contentTypeId=15)
//
// 왜 만드나 (2026-09-10 애드센스 3차 반려 뒤 실측)
//   축제 상세 564장이 전부 같은 10~12개 h2 로 되어 있고, 그 축제 «자체»에 대한 내용은
//   개요 한 문단뿐이었다. 나머지는 전부 주변 정보(맛집·카페·숙소·걷기길·주차)다.
//   그런데 재료가 없어서가 아니었다 — `data/festivals_api.json` 은 제목·날짜·주소·전화·사진·좌표·개요뿐이고
//   **detailIntro2 의 축제 전용 필드를 아예 안 받고 있었다.** 오일장은 받고 있는데 축제만 빠져 있었다.
//   여기서 받는 것: 행사프로그램 · 이용요금 · 부대행사 · 관람소요시간 · 예매처 · 주최 · 행사장소 · 위치안내 · 연령 · 공연시간
//
// 🔴 `festivals_api.json` 에 쓰지 않는다 — 그건 수집기가 «만드는» 파일이라 다음 회차가 되돌린다.
//    별도 파일 `data/fest_intro.json` 에 id → {필드} 로 저장하고, build.js 는 읽기만 한다.
//
// ⚠️ 2026-08-18에 배운 것을 그대로 지킨다:
//   ① 순차 + 120ms. 동시 호출은 초당 제한에 걸리고 응답이
//      {"OpenAPI_ServiceResponse":{...LIMITED_NUMBER_OF_SERVICE_REQUESTS_PER_SECOND...}} 로 온다 → «세어서» 보고한다.
//   ② 캐시는 받은 것을 전부 물려준다. 안 그러면 재실행이 곧 삭제다.
//   ③ 값이 «없는» 것도 introDone 으로 표시한다. 안 그러면 매번 전량 조회가 된다.
//   ④ TourAPI 일일 한도는 서비스별로 따로다 — 시간 예산 인자로 나눠 받는다:
//        node fetch-fest-intro.js 480      ← 480초만 돌고 저장하고 끝낸다
'use strict';
const fs = require('fs'), path = require('path'), https = require('https');

const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const URL = 'https://apis.data.go.kr/B551011/KorService2/detailIntro2';
const SRC = path.join(__dirname, 'data', 'festivals_api.json');
const OUT = path.join(__dirname, 'data', 'fest_intro.json');
const BUDGET = (+process.argv[2] || 0) * 1000;   // 초. 0이면 끝까지

// 우리가 쓸 필드만 남긴다(응답에는 안 쓰는 것도 많다). 이름은 사람이 읽을 수 있게 바꾼다.
const MAP = {
  program: 'program',                  // 행사 프로그램
  usetimefestival: 'fee',              // 이용요금
  sponsor1: 'host', sponsor1tel: 'hostTel',
  sponsor2: 'org', sponsor2tel: 'orgTel',
  eventplace: 'place',                 // 행사장소
  agelimit: 'age',                     // 관람 가능 연령
  playtime: 'playtime',                // 공연시간
  // ⚠️ 아래 6개는 표본 110건·원문 6건을 찍어 확인한 결과 **TourAPI 가 아예 주지 않는다**(0%).
  //    필드명 오타가 아니라 응답에 키 자체가 없다 — 넣어 두면 매번 헛일이라 뺐다.
  //    subevent(부대행사) · spendtimefestival(소요시간) · bookingplace(예매처)
  //    placeinfo(위치안내) · discountinfofestival(할인) · festivalgrade(등급)
  //    progresstype·festivaltype 은 오지만 값이 전부 「선택안함」이라 쓸모가 없다.
};

// TourAPI 의 program 은 «줄바꿈 없이» 이어 붙어 온다:
//   「1. 미리미리 크리스마켓- 크리스마스 소품…2. 다양한 공연 프로그램- 재즈,오케스트라…」
// 그대로 실으면 읽을 수 없으므로 번호·하이픈 앞에서 끊어 준다. 내용은 바꾸지 않는다.
const splitProgram = s => String(s || '')
  .replace(/\s*(\d{1,2}\.\s)/g, '\n$1')
  .replace(/\s*(-\s)/g, '\n$1')
  .split('\n').map(x => x.trim()).filter(Boolean).join('\n');

const sleep = ms => new Promise(r => setTimeout(r, ms));
// ⚠️ TourAPI 텍스트에는 <br>·&nbsp;·HTML 태그가 섞여 온다. 태그를 지우되 «줄바꿈»은 살린다 —
//    프로그램·부대행사는 줄바꿈이 곧 목록이다.
const clean = s => String(s || '')
  .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li)>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .split('\n').map(x => x.replace(/[ \t]{2,}/g, ' ').trim()).filter(Boolean).join('\n').trim();

const get = u => new Promise(res => {
  const req = https.get(u, { headers: { 'User-Agent': 'chukjemoa' }, timeout: 15000 }, r => {
    r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
  });
  req.on('error', e => res('__ERR__' + e.message));
  req.on('timeout', () => { req.destroy(); res('__ERR__timeout'); });
});

(async () => {
  const fests = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  let store = {};
  try { store = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (e) {}

  const todo = fests.filter(f => f.id && !(store[f.id] && store[f.id].introDone));
  const have = Object.values(store).filter(o => o.introDone && Object.keys(o).length > 1).length;
  console.log(`축제 ${fests.length}건 · 이미 받은 것 ${Object.keys(store).length}건(내용 있는 것 ${have})`);
  console.log(`이번에 조회할 것 ${todo.length}건${BUDGET ? ` · 시간 예산 ${BUDGET / 1000}초` : ''}`);

  const t0 = Date.now();
  let got = 0, none = 0, apiErr = 0, i = 0;
  const save = () => fs.writeFileSync(OUT, JSON.stringify(store, null, 0));

  for (; i < todo.length; i++) {
    if (BUDGET && Date.now() - t0 > BUDGET) { console.log('\n⏸ 시간 예산 도달 — 여기까지 저장하고 끝냅니다'); break; }
    const f = todo[i];
    const t = await get(`${URL}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json`
      + `&numOfRows=1&pageNo=1&contentId=${f.id}&contentTypeId=15`);
    if (t.startsWith('__ERR__')) apiErr++;
    else {
      try {
        const j = JSON.parse(t);
        if (j.OpenAPI_ServiceResponse) apiErr++;              // 초당 제한 등 — 조용히 삼키지 않는다
        else {
          const it = j.response && j.response.body && j.response.body.items;
          const d = it && it.item ? (Array.isArray(it.item) ? it.item[0] : it.item) : null;
          const o = { introDone: 1 };
          let n = 0;
          if (d) for (const [k, name] of Object.entries(MAP)) {
            let v = clean(d[k]);
            if (name === 'program') v = splitProgram(v);
            // 「선택안함」처럼 «값이 아닌 값»은 버린다 — 실으면 그게 곧 빈약함이다
            if (v && !['-', '없음', '선택안함', '해당없음', '미정'].includes(v)) { o[name] = v; n++; }
          }
          store[f.id] = o;
          if (n) got++; else none++;
        }
      } catch (e) { apiErr++; }
    }
    if (i % 25 === 0 || i === todo.length - 1) {
      process.stdout.write(`\r  ${i + 1}/${todo.length} · 내용있음 ${got} · 비었음 ${none}${apiErr ? ' ⚠️API오류' + apiErr : ''}`);
      if (i % 100 === 0) save();
    }
    await sleep(120);
  }
  save();

  // 무엇이 얼마나 찼는지 — 「N건 받았다」가 아니라 «필드별로» 본다
  const vals = Object.values(store).filter(o => o.introDone);
  const cnt = {};
  Object.values(MAP).forEach(n => cnt[n] = vals.filter(o => o[n]).length);
  console.log(`\n\n저장 ${Object.keys(store).length}건 → data/fest_intro.json`);
  console.log('필드별 채움:');
  Object.entries(cnt).sort((a, b) => b[1] - a[1])
    .forEach(([k, n]) => console.log(`  ${k.padEnd(10)} ${String(n).padStart(4)}건 (${Math.round(n / vals.length * 100)}%)`));
  const left = fests.filter(f => f.id && !(store[f.id] && store[f.id].introDone)).length;
  console.log(left ? `\n⏳ 남은 것 ${left}건 — 다시 실행하면 이어서 받습니다` : '\n✅ 전부 받았습니다');
})();
