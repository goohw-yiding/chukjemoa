// 🧭 addrKo 가 비어 있는 외국어 장소를 «한국어 TourAPI(KorService2) 검색»으로 채운다. 돈 안 든다.
//
// 왜 (2026-09-09)
//   match-addr-ko.js 는 우리 로컬 한국어 파일 8개만 본다. 거기 없는 장소가 1,328건 남았다(대부분 일문).
//   ⚠️ 처음엔 NCP/카카오 «역지오코딩»을 사려 했는데, 프로브에서 더 나은 길이 나왔다 —
//   ⭐ 한국어 TourAPI 에 «그 장소가 등록돼 있고 addr1 이 있다». 좌표 근처 주소가 아니라 «그 장소의 주소»다.
//
// ⚠️ contentId 는 언어 서비스별로 다르다. ja 1824462 를 KorService2 에 물으면 totalCount 0 이다.
//    → contentId 로 잇지 말고 «한글 원제»로 검색한다.
// ⚠️ 동명이지(同名異地)가 실제로 있다 → 좌표가 3km 이내일 때만 채택한다. 아니면 비워 둔다(그게 정직하다).
// ⚠️ searchKeyword2 는 부분일치라 「365세이프타운」이 「태백 365세이프타운」으로 온다. 좌표 검증이 필수인 이유.
// ⚠️ 한도 초과는 XML(LIMITED_NUMBER_OF_SERVICE_REQUESTS)로 온다 — 「데이터 없음」이 아니다. 즉시 멈추고 그때까지 저장.
// ⚠️ detailCommon2 에 defaultYN/addrinfoYN 을 넣으면 INVALID_REQUEST_PARAMETER_ERROR 다. (2 세대 API)
//
// 실행: node fill-addr-ko-api.js [시간예산초]        (기본 900초)
const fs = require('fs'), path = require('path'), https = require('https');
const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const B = 'https://apis.data.go.kr/B551011/KorService2/';
const BUDGET = Number(process.argv[2] || 900) * 1000;
const T0 = Date.now();
const LANGS = ['zh', 'tw', 'es', 'ja', 'en'];
const D = f => path.join(__dirname, 'data', f);

const get = u => new Promise((res, rej) => {
  https.get(u, { headers: { 'User-Agent': 'chukjemoa' }, timeout: 20000 }, r => {
    r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
  }).on('error', rej).on('timeout', function () { this.destroy(new Error('timeout')); });
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const H = /[가-힣]/;

const R = 6371, rad = d => d * Math.PI / 180;
function km(ax, ay, bx, by) {
  const a = Math.sin(rad(by - ay) / 2) ** 2 + Math.cos(rad(ay)) * Math.cos(rad(by)) * Math.sin(rad(bx - ax) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
// 검색어 정리 — 괄호 안 외국어·기호를 떼고 한글 본체만 남긴다.
function koName(it) {
  let s = String(it.ko || '').trim();
  if (!s) { const m = String(it.title || '').match(/[가-힣][^()（）]*/); s = m ? m[0].trim() : ''; }
  s = s.replace(/[（(][^)）]*[)）]/g, ' ').replace(/[·・‧∙]/g, ' ').replace(/\s+/g, ' ').trim();
  return H.test(s) ? s : '';
}

const cache = {};        // 정규화 이름 → 결과 배열 (언어 간 중복 호출 방지)
let calls = 0, limited = false;
async function search(name) {
  const k = name.replace(/\s+/g, '');
  if (cache[k]) return cache[k];
  const u = B + 'searchKeyword2?serviceKey=' + KEY + '&MobileOS=ETC&MobileApp=chukjemoa&_type=json'
    + '&numOfRows=15&pageNo=1&arrange=A&keyword=' + encodeURIComponent(name);
  let raw = '';
  try { raw = await get(u); } catch (e) { return (cache[k] = []); }
  calls++;
  if (raw.trim().startsWith('<')) {                    // 한도 초과·장애는 XML 로 온다
    if (/LIMITED_NUMBER_OF_SERVICE_REQUESTS|SERVICE_ACCESS_DENIED/i.test(raw)) limited = true;
    return (cache[k] = []);
  }
  let items = [];
  try {
    const b = JSON.parse(raw).response.body;
    if (b && b.items && b.items.item) items = Array.isArray(b.items.item) ? b.items.item : [b.items.item];
  } catch (e) { items = []; }
  return (cache[k] = items);
}

(async () => {
  const log = [];
  for (const lang of LANGS) {
    const f = 'places_' + lang + '.json';
    let j; try { j = JSON.parse(fs.readFileSync(D(f), 'utf8')); } catch (e) { log.push(lang + ' : 파일 없음'); continue; }
    const arr = Array.isArray(j) ? j : Object.values(j).find(v => Array.isArray(v));
    const todo = arr.filter(it => !it.addrKo && it.x && it.y && koName(it));
    let ok = 0, far = 0, none = 0, noName = arr.filter(it => !it.addrKo && !koName(it)).length;
    for (const it of todo) {
      if (limited || Date.now() - T0 > BUDGET) break;
      const nm = koName(it);
      const items = await search(nm);
      await sleep(120);
      if (!items.length) { none++; continue; }
      let best = null, bd = 9e9;
      for (const r of items) {
        const x = Number(r.mapx), y = Number(r.mapy);
        if (!x || !y || !r.addr1) continue;
        const d = km(Number(it.x), Number(it.y), x, y);
        if (d < bd) { bd = d; best = r; }
      }
      if (!best) { none++; continue; }
      if (bd > 3) { far++; continue; }                  // 동명이지 — 비워 둔다
      it.addrKo = String(best.addr1).trim() + (best.addr2 ? ' ' + String(best.addr2).trim() : '');
      it.addrOk = true; it.addrSrc = 'korapi';
      ok++;
    }
    fs.writeFileSync(D(f), JSON.stringify(j), 'utf8');
    log.push(lang + ' : 대상 ' + todo.length + ' · 채움 ' + ok + ' · 3km밖(보류) ' + far
      + ' · 후보없음 ' + none + ' · 한글원제없어 제외 ' + noName);
  }
  log.push('API 호출 ' + calls + '건 · 한도초과 ' + (limited ? 'YES(중단)' : 'no')
    + ' · 경과 ' + Math.round((Date.now() - T0) / 1000) + '초');
  fs.writeFileSync(path.join(__dirname, '_fillko.txt'), log.join('\n'), 'utf8');
  console.log(log.join('\n'));
})();
