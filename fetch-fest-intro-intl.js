// 🌏 외국어 축제 «그 축제만의 것» 수집기 — EngService2 / JpnService2 detailIntro2
//
// 실행: node fetch-fest-intro-intl.js [en|ja] [초]
//       인자 없으면 en·ja 둘 다, 시간 예산 없이 끝까지.
//
// 🔴 여기서 하루를 아낀 함정 (2026-09-10)
//   외국어 서비스에서 축제의 contentTypeId 는 **15 가 아니라 85** 다.
//   15 로 부르면 오류가 아니라 `{"items":"","totalCount":0}` — 즉 «정상 응답인데 0건»으로 온다.
//   그대로 믿었으면 「외국어엔 데이터가 없다」고 결론 낼 뻔했다.
//   ⭐ 0건이 나오면 결론 내기 전에 **원문을 찍고 대조군(detailCommon2)을 같이 본다.**
//   그래서 이 수집기는 85 로 부르고, 0건이면 15 로 한 번 더 시도한다(서비스가 또 바뀔 수 있다).
//
// ⚠️ contentId 는 언어별로 다르다 — festivals_{lang}.json 의 id 를 그대로 쓴다.
// ⚠️ TourAPI 일일 한도는 **서비스별로 따로** 걸린다(Kor/Eng/Jpn 각각). 시간 예산으로 나눠 받는다.
// ⚠️ 순차 + 120ms. 동시 호출은 초당 제한에 걸리고 OpenAPI_ServiceResponse 로 온다 → 세어서 보고한다.
// 🔴 festivals_{lang}.json 에 쓰지 않는다 — 수집기가 «만드는» 파일이라 다음 회차가 되돌린다.
'use strict';
const fs = require('fs'), path = require('path'), https = require('https');

const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const SVC = { en: 'EngService2', ja: 'JpnService2' };

// 외국어 응답은 한국어보다 «키가 넓다» — 한국어엔 아예 없던 것들(예매처·소요시간·부대행사)도 키가 있다.
// 값이 실제로 오는지는 전량 받아 보고 판단한다(비어 있으면 안 싣는다).
const MAP = {
  program: 'program', usetimefestival: 'fee', subevent: 'subevent',
  spendtimefestival: 'spend', bookingplace: 'booking',
  sponsor1: 'host', sponsor1tel: 'hostTel', sponsor2: 'org', sponsor2tel: 'orgTel',
  eventplace: 'place', placeinfo: 'placeInfo', agelimit: 'age',
  playtime: 'playtime', discountinfofestival: 'discount', eventhomepage: 'hp',
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = s => String(s || '')
  .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li)>/gi, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .split('\n').map(x => x.replace(/[ \t]{2,}/g, ' ').trim()).filter(Boolean).join('\n').trim();
// 한국어와 같은 이유로 program 을 끊는다. 영문은 「1.」·「-」 외에 「•」도 온다.
const splitProgram = s => String(s || '')
  .replace(/\s*(\d{1,2}\.\s)/g, '\n$1').replace(/\s*([-•·]\s)/g, '\n$1')
  .split('\n').map(x => x.trim()).filter(Boolean).join('\n');

const get = u => new Promise(res => {
  const req = https.get(u, { headers: { 'User-Agent': 'chukjemoa' }, timeout: 15000 }, r => {
    r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
  });
  req.on('error', e => res('__ERR__' + e.message));
  req.on('timeout', () => { req.destroy(); res('__ERR__timeout'); });
});

function pick(txt) {                       // 응답 → item (없으면 null), API오류면 'ERR'
  if (txt.startsWith('__ERR__')) return 'ERR';
  try {
    const j = JSON.parse(txt);
    if (j.OpenAPI_ServiceResponse || j.resultCode === '11') return 'ERR';
    const it = j.response && j.response.body && j.response.body.items;
    if (!it || !it.item) return null;
    return Array.isArray(it.item) ? it.item[0] : it.item;
  } catch (e) { return 'ERR'; }
}

async function run(lang, budgetMs) {
  const src = path.join(__dirname, 'data', `festivals_${lang}.json`);
  const out = path.join(__dirname, 'data', `fest_intro_${lang}.json`);
  let arr;
  try { arr = JSON.parse(fs.readFileSync(src, 'utf8')); }
  catch (e) { console.log(`[${lang}] festivals_${lang}.json 없음 — 건너뜁니다`); return; }
  let store = {};
  try { store = JSON.parse(fs.readFileSync(out, 'utf8')); } catch (e) {}

  const todo = arr.filter(f => f.id && !(store[f.id] && store[f.id].introDone));
  console.log(`[${lang}] ${arr.length}건 · 이미 받은 것 ${Object.keys(store).length} · 조회할 것 ${todo.length}`);

  const t0 = Date.now();
  let got = 0, none = 0, apiErr = 0, byType15 = 0, i = 0;
  const save = () => fs.writeFileSync(out, JSON.stringify(store, null, 0));
  const base = f => `serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${f.id}`;

  for (; i < todo.length; i++) {
    if (budgetMs && Date.now() - t0 > budgetMs) { console.log(`\n[${lang}] ⏸ 시간 예산 도달 — 저장하고 끝냅니다`); break; }
    const f = todo[i];
    const U = `https://apis.data.go.kr/B551011/${SVC[lang]}/detailIntro2?`;
    let d = pick(await get(`${U}${base(f)}&contentTypeId=85`));
    if (d === null) {                    // 85 에서 0건이면 15 로 한 번 더 — 서비스가 바뀔 수 있다
      await sleep(120);
      d = pick(await get(`${U}${base(f)}&contentTypeId=15`));
      if (d && d !== 'ERR') byType15++;
    }
    if (d === 'ERR') apiErr++;
    else {
      const o = { introDone: 1 };
      let n = 0;
      if (d) for (const [k, name] of Object.entries(MAP)) {
        let v = clean(d[k]);
        if (name === 'program') v = splitProgram(v);
        if (v && !['-', '없음', '선택안함', 'N/A', 'None'].includes(v)) { o[name] = v; n++; }
      }
      store[f.id] = o;
      if (n) got++; else none++;
    }
    if (i % 20 === 0 || i === todo.length - 1) {
      process.stdout.write(`\r[${lang}] ${i + 1}/${todo.length} · 내용있음 ${got} · 비었음 ${none}${apiErr ? ' ⚠️API오류' + apiErr : ''}`);
      if (i % 100 === 0) save();
    }
    await sleep(120);
  }
  save();

  const vals = Object.values(store).filter(o => o.introDone);
  const cnt = {}; Object.values(MAP).forEach(n => cnt[n] = vals.filter(o => o[n]).length);
  console.log(`\n[${lang}] 저장 ${Object.keys(store).length}건 → data/fest_intro_${lang}.json`
    + (byType15 ? ` · ⚠️ contentTypeId=15 로 받은 것 ${byType15}건(85가 안 통한 경우)` : ''));
  Object.entries(cnt).sort((a, b) => b[1] - a[1]).forEach(([k, n]) =>
    console.log(`   ${k.padEnd(10)} ${String(n).padStart(4)}건 (${vals.length ? Math.round(n / vals.length * 100) : 0}%)`));
  const left = arr.filter(f => f.id && !(store[f.id] && store[f.id].introDone)).length;
  console.log(left ? `   ⏳ 남은 것 ${left}건` : '   ✅ 전부 받았습니다');
}

(async () => {
  const a = process.argv.slice(2);
  const langs = ['en', 'ja'].filter(l => !a.length || a.includes(l) || !a.some(x => ['en', 'ja'].includes(x)));
  const budget = (+a.find(x => /^\d+$/.test(x)) || 0) * 1000;
  for (const l of langs) { await run(l, budget); }
})();
