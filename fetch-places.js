// 🌏 외국어 장소 데이터 — 언어 하나를 인자로 받아 관광지·문화시설·여행코스를 받는다.
//    → data/places_{lang}.json   (fetch-en-places.js / fetch-ja-places.js 의 일반화판)
//
// 왜 (2026-09-04)
//   장남 님이 「서울·부산·제주 외국어 페이지를 5개어 전부」로 정했다. 그런데 재보니 —
//   ⚠️ **중문 간/번·서어는 «장소 데이터가 아예 없었다»**(places_zh/tw/es 미수집).
//      그 상태로 도시 페이지를 만들면 축제 몇 건짜리 «얇은 페이지»가 된다(애드센스 심사 중이라 특히 위험).
//   → 재료부터 받는다. 영문에서 쓴 방법이 그대로 통한다:
//     ⭐ 외국어 제목에 **한글 원제가 들어 있고**, 우리 한국어 데이터에 주소가 있으니
//       `match-addr-ko.js` 로 **한글 도로명주소를 돈 안 쓰고** 채울 수 있다.
//
// ⚠️ TourAPI 일일 한도는 **서비스별로 따로** 걸린다(Jpn 초과여도 Eng 은 살아 있다) — 언어별로 따로 돌린다.
// ⚠️ 개요를 못 받은 것도 `ovDone` 으로 표시한다. 안 그러면 매일 같은 것을 다시 묻는다.
// ⚠️ 한도 초과는 XML(LIMITED_NUMBER_OF_SERVICE_REQUESTS)로 온다 — 「데이터 없음」이 아니다. 즉시 멈춘다.
//
// 실행: node fetch-places.js zh 480      (언어 · 시간예산초)
const fs = require('fs'), path = require('path'), https = require('https');
const { sidoOf, validCoord } = require('./region');

const LANG = (process.argv[2] || '').toLowerCase();
const SVC = { en: 'EngService2', ja: 'JpnService2', zh: 'ChsService2', tw: 'ChtService2', es: 'SpnService2' }[LANG];
if (!SVC) { console.log('사용법: node fetch-places.js <en|ja|zh|tw|es> [시간예산초]'); process.exit(1); }
// ⚠️ 번체(tw)는 키가 다르다 — fetch-attractions.js 와 같은 규칙.
const readKey = f => { try { return fs.readFileSync(path.join(__dirname, f), 'utf8').trim(); } catch (e) { return ''; } };
const KEY = (LANG === 'tw' ? (readKey('tourapi-tw.key') || readKey('tourapi.key')) : readKey('tourapi.key'));
const B = `https://apis.data.go.kr/B551011/${SVC}/`;
const OUT = path.join(__dirname, 'data', `places_${LANG}.json`);
const BUDGET = Number(process.argv[3] || 0);

const KINDS = [{ id: 76, kind: 'spot', label: '관광지' }, { id: 78, kind: 'culture', label: '문화시설' }, { id: 75, kind: 'course', label: '여행코스' }];
const get = u => new Promise((res, rej) => {
  https.get(u, { headers: { 'User-Agent': 'chukjemoa' }, timeout: 20000 }, r => {
    r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
  }).on('error', rej).on('timeout', function () { this.destroy(new Error('timeout')); });
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const H = /[가-힣]/;

/**
 * 「Foreign Title (한글원제)」 또는 「한글원제 (Foreign)」에서 한글을 뽑는다.
 * ⭐ 「한글이 든 마지막 괄호」로 자르면 중첩 괄호에서 안쪽만 집어 외국어가 한글 쪽에 섞인다 —
 *    **첫 한글 «직전»의 마지막 여는 괄호**에서 자른다(영문에서 오염 0건으로 검증한 규칙).
 */
function splitTitle(raw) {
  let s = String(raw || '').trim();
  if (!H.test(s)) return { t: s, ko: '' };
  if (s.includes('/') && !s.includes('(')) {
    const p = s.split('/').map(x => x.trim()).filter(Boolean);
    const ko = p.filter(x => H.test(x)).join(' '), t = p.filter(x => !H.test(x)).join(' ');
    if (ko && t) return { t, ko };
  }
  const firstH = s.search(H);
  let cut = -1;
  for (let i = firstH - 1; i >= 0; i--) if (s[i] === '(' || s[i] === '（') { cut = i; break; }
  if (cut > 0) {
    const head = s.slice(0, cut).trim();
    let tail = s.slice(cut + 1).trim();
    let open = (tail.match(/[(（]/g) || []).length, close = (tail.match(/[)）]/g) || []).length;
    while (close > open) { tail = tail.replace(/[)）](?!.*[)）])/, '').trim(); close--; }
    tail = tail.replace(/[)）]+$/, '').trim();
    if (H.test(tail) && head && !H.test(head)) return { t: head, ko: tail };
  }
  const m = s.match(/^(.*[가-힣].*?)\s*[（(]([^가-힣]+)[)）]\s*$/);
  if (m) return { t: m[2].trim(), ko: m[1].trim() };
  return { t: s, ko: '' };
}

async function listAll(id) {
  const out = [];
  for (let p = 1; p <= 40; p++) {
    const t = await get(`${B}areaBasedList2?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=200&pageNo=${p}&contentTypeId=${id}&arrange=A`);
    let b; try { b = JSON.parse(t).response.body; }
    catch (e) { console.log('  ⚠️ 목록 파싱 실패 p' + p + ' — ' + t.slice(0, 90).replace(/\s+/g, ' ')); break; }
    let it = b.items && (b.items.item || b.items);
    if (!it) break;
    if (!Array.isArray(it)) it = [it];
    out.push(...it);
    if (out.length >= Number(b.totalCount || 0) || it.length < 200) break;
    await sleep(120);
  }
  return out;
}

(async () => {
  const prev = {};
  try { JSON.parse(fs.readFileSync(OUT, 'utf8')).forEach(r => { prev[r.id] = r; }); console.log('캐시', Object.keys(prev).length, '건'); } catch (e) { }

  const rows = [];
  for (const K of KINDS) {
    const list = await listAll(K.id);
    console.log(`${K.label}(${K.id}) 목록 ${list.length}건`);
    for (const x of list) {
      const { t, ko } = splitTitle(x.title);
      if (!t) continue;
      const p = prev[x.contentid] || {};
      const addr = clean(x.addr1 || '');
      const regnCd = String(x.lDongRegnCd || x.regnCd || ''), signguCd = String(x.lDongSignguCd || x.signguCd || '');
      const okXY = x.mapx && x.mapy && validCoord(x.mapx, x.mapy);
      rows.push({
        id: String(x.contentid), kind: K.kind, title: t, ko,
        // ⚠️ 외국어 주소는 음차·번역이라 주소 파서로 시·도가 안 나온다 → 법정동 코드로 정한다.
        addr, sido: sidoOf(regnCd, addr, signguCd), regnCd, signguCd,
        x: okXY ? String(x.mapx) : '', y: okXY ? String(x.mapy) : '',
        img: clean(x.firstimage || x.firstimage2 || ''), cat: clean(x.cat2 || ''),
        ov: p.ov || '', tel: p.tel || '', hp: p.hp || '', ovDone: !!p.ovDone,
        addrKo: p.addrKo || '', addrOk: !!p.addrOk, addrSrc: p.addrSrc || ''
      });
    }
    await sleep(150);
  }

  const todo = rows.filter(r => !r.ovDone);
  console.log(`개요 수집 대상 ${todo.length}건 (캐시로 건너뜀 ${rows.length - todo.length}건)`);
  const T0 = Date.now();
  let done = 0, err = 0, limited = false, ranOut = false;
  for (const r of todo) {
    if (BUDGET && (Date.now() - T0) / 1000 > BUDGET) { ranOut = true; console.log(`  ⏱ 예산 ${BUDGET}초 소진 — ${done}건까지 저장`); break; }
    try {
      const t = await get(`${B}detailCommon2?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&contentId=${r.id}`);
      if (/LIMITED_NUMBER_OF_SERVICE_REQUESTS/.test(t)) { limited = true; console.log(`  ⛔ 일일 한도 초과 — ${done}건까지 저장. 내일 이어받습니다.`); break; }
      if (/OpenAPI_ServiceResponse|SERVICE_ERROR/.test(t)) { err++; await sleep(400); continue; }
      const it = JSON.parse(t).response.body.items;
      const d = it && (it.item ? (Array.isArray(it.item) ? it.item[0] : it.item) : null);
      if (d) { r.ov = clean(d.overview).slice(0, 700); r.tel = clean(d.tel); r.hp = clean(d.homepage).replace(/.*?href="([^"]+)".*/, '$1'); }
      r.ovDone = true; done++;
      if (done % 200 === 0) { fs.writeFileSync(OUT, JSON.stringify(rows), 'utf8'); console.log(`  … ${done}/${todo.length} (저장)`); }
    } catch (e) { err++; }
    await sleep(120);
  }

  fs.writeFileSync(OUT, JSON.stringify(rows), 'utf8');
  const left = rows.filter(r => !r.ovDone).length;
  console.log(`✓ data/places_${LANG}.json — ${rows.length}건 · 개요완료 ${rows.filter(r => r.ovDone).length} · 한글원제 ${rows.filter(r => r.ko).length}`
    + `${limited ? ' · ⛔한도초과' : ''}${ranOut ? ' · ⏱예산소진' : ''}${left ? ` · 남은 ${left}건` : ''} · 오류 ${err}`);
  ['서울', '부산', '제주'].forEach(s => {
    const a = rows.filter(r => r.sido === s);
    console.log(`  ${s} ${a.length}곳 · 개요120자↑ ${a.filter(r => String(r.ov || '').length >= 120).length}`);
  });
})();
