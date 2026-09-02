// 🇬🇧 영문 장소 데이터 — 관광지·문화시설·여행코스 (EngService2) → data/places_en.json
//
// 왜 (2026-09-02)
//   일문 축제 상세는 「近くの見どころ」로 얇은 페이지 90→11개가 됐다. 영문도 11개가 얇아 noindex인데
//   그중 몇 개는 **이미 노출·클릭이 있다**(goesan-red-pepper 노출 18·클릭 1). 받을 그릇이 얇은 것뿐이다.
//   → 같은 방식으로 영문 «읽을 내용»을 만든다. 재료는 관광공사 공식 영문 번역.
//
// ⭐ 전제가 하나 틀렸었다: 인계서에 「영문 서비스는 한글 원제가 없어 좌표로 이어야 했다」고 적혀 있었는데,
//    실제로 재보니 EngService2 제목은 **「English (한글원제)」** 형식이고 2,623건 중 **2,618건**에서
//    한글 원제가 나온다. 안 재고 넘어갔으면 역지오코딩을 3,300건 더 샀을 것이다.
//
// ⚠️ TourAPI 상세는 **순차 + 120ms**. 동시 호출하면 막힌다.
// ⚠️ 개요를 못 받은 것도 `ovDone` 으로 표시한다 — 안 그러면 매주 같은 것을 다시 묻는다.
// ⚠️ 일일 한도 초과는 XML(LIMITED_NUMBER_OF_SERVICE_REQUESTS)로 온다. 「데이터 없음」이 아니다.
//    ⭐ 한도는 **서비스별로 따로** 걸린다 — 2026-09-02 실측에서 JpnService2 는 초과인데 EngService2 는 살아 있었다.
//
// 실행: node fetch-en-places.js        (키: tourapi.key)
const fs = require('fs'), path = require('path'), https = require('https');
const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const B = 'https://apis.data.go.kr/B551011/EngService2/';
const OUT = path.join(__dirname, 'data', 'places_en.json');
// ⚠️ EngService2 의 addr1 은 로마자 주소다(「17-1 Chotdaebawi-gil, Donghae-si, Gangwon-do」).
//    한글 주소 파서로는 시·도가 안 나온다 → 법정동 코드로 정한다(일문에서 겪은 것과 같은 함정).
const { sidoOf, validCoord } = require('./region');

const KINDS = [
  { id: 76, kind: 'spot', label: '관광지' },
  { id: 78, kind: 'culture', label: '문화시설' },
  { id: 75, kind: 'course', label: '여행코스' }
];

const get = u => new Promise((res, rej) => {
  https.get(u, { headers: { 'User-Agent': 'chukjemoa' }, timeout: 20000 }, r => {
    r.setEncoding('utf8'); let d = '';
    r.on('data', c => d += c); r.on('end', () => res(d));
  }).on('error', rej).on('timeout', function () { this.destroy(new Error('timeout')); });
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ')
  .replace(/\s+/g, ' ').trim();

const H = /[가-힣]/;
/**
 * 「English (한글원제)」 → { en, ko }
 * ⭐ 「한글이 든 마지막 괄호」로 자르면 중첩 괄호에서 안쪽만 집어 영문이 한글 쪽에 섞인다
 *    (「Aegibong Peak (Gimpo Section) (애기봉 (김포지구))」→ ko 가 「김포지구」가 됐다).
 *    그래서 **첫 한글 «직전»의 마지막 여는 괄호**에서 자른다. 이 규칙으로 오염 0건.
 */
function splitTitle(raw) {
  let s = String(raw || '').trim();
  if (!H.test(s)) return { en: s, ko: '' };

  // ① 「A / B」 — 한쪽만 한글이면 갈라진다 (「Damdaheon / 담다헌 체험교육관」)
  if (s.includes('/') && !s.includes('(')) {
    const p = s.split('/').map(t => t.trim()).filter(Boolean);
    const ko = p.filter(t => H.test(t)).join(' '), en = p.filter(t => !H.test(t)).join(' ');
    if (ko && en) return { en, ko };
  }

  // ② 영문 (한글) — 원본이 괄호를 안 맞춰 놓는 경우가 많아 정규식을 쓰지 않는다
  const firstH = s.search(H);
  let cut = -1;
  for (let i = firstH - 1; i >= 0; i--) if (s[i] === '(' || s[i] === '（') { cut = i; break; }
  if (cut > 0) {
    const head = s.slice(0, cut).trim();
    let tail = s.slice(cut + 1).trim();
    let open = (tail.match(/[(（]/g) || []).length, close = (tail.match(/[)）]/g) || []).length;
    while (close > open) { tail = tail.replace(/[)）](?!.*[)）])/, '').trim(); close--; }
    tail = tail.replace(/[)）]+$/, '').trim();
    if (H.test(tail) && head && !H.test(head)) return { en: head, ko: tail };
  }

  // ③ 한글 (English) — 「추암조각공원 (Chuam Sculpture Park)」
  const m = s.match(/^(.*[가-힣].*?)\s*[（(]([^가-힣]+)[)）]\s*$/);
  if (m) return { en: m[2].trim(), ko: m[1].trim() };

  return { en: s, ko: '' };   // 통째로 한글이면 영문 제목이 없는 것 — 그대로 둔다
}

async function listAll(id) {
  const out = [];
  for (let p = 1; p <= 40; p++) {
    const t = await get(`${B}areaBasedList2?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa`
      + `&_type=json&numOfRows=200&pageNo=${p}&contentTypeId=${id}&arrange=A`);
    let b;
    try { b = JSON.parse(t).response.body; }
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
  try {
    JSON.parse(fs.readFileSync(OUT, 'utf8')).forEach(r => { prev[r.id] = r; });
    console.log('캐시', Object.keys(prev).length, '건');
  } catch (e) { }

  const rows = [];
  for (const K of KINDS) {
    const list = await listAll(K.id);
    console.log(`${K.label}(${K.id}) 목록 ${list.length}건`);
    for (const x of list) {
      const { en, ko } = splitTitle(x.title);
      if (!en) continue;
      const p = prev[x.contentid] || {};
      const addr = clean(x.addr1 || '');
      const regnCd = String(x.lDongRegnCd || x.regnCd || '');
      const signguCd = String(x.lDongSignguCd || x.signguCd || '');
      const okXY = x.mapx && x.mapy && validCoord(x.mapx, x.mapy);
      rows.push({
        id: String(x.contentid), kind: K.kind,
        title: en, ko,                       // ko = 지도에 붙여넣을 한글 원제
        addr, sido: sidoOf(regnCd, addr, signguCd), regnCd, signguCd,
        x: okXY ? String(x.mapx) : '', y: okXY ? String(x.mapy) : '',
        img: clean(x.firstimage || x.firstimage2 || ''),
        cat: clean(x.cat2 || ''),
        ov: p.ov || '', tel: p.tel || '', hp: p.hp || '',
        ovDone: !!p.ovDone,
        addrKo: p.addrKo || '', addrOk: !!p.addrOk, addrSrc: p.addrSrc || ''
      });
    }
    await sleep(150);
  }

  const todo = rows.filter(r => !r.ovDone);
  console.log(`개요 수집 대상 ${todo.length}건 (캐시로 건너뜀 ${rows.length - todo.length}건)`);
  // ⏱ 시간 예산 — `node fetch-en-places.js 480` 이면 480초까지만 돌고 저장한다.
  //    ⚠️ 3,299건은 한 번에 12분쯤 걸리는데, 실행 환경에 따라 그 전에 프로세스가 끊긴다.
  //       끊기면 «받아 놓고 저장 못 한» 구간이 통째로 날아간다(200건마다 저장하므로 최대 200건).
  //       나눠 돌릴 수 있게 예산을 둔다. 캐시(ovDone)가 있어 이어받는 데 비용이 안 든다.
  const BUDGET = Number(process.argv[2] || 0);
  const T0 = Date.now();
  let done = 0, err = 0, limited = false, ranOut = false;
  for (const r of todo) {
    if (BUDGET && (Date.now() - T0) / 1000 > BUDGET) {
      ranOut = true;
      console.log(`  ⏱ 시간 예산 ${BUDGET}초 소진 — ${done}건까지 저장. 다시 돌리면 이어서 받습니다.`);
      break;
    }
    try {
      const t = await get(`${B}detailCommon2?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa`
        + `&_type=json&contentId=${r.id}`);
      // 한도 초과는 «재시도해도 소용없는 상태»다. 즉시 멈추고 여기까지를 저장한다.
      if (/LIMITED_NUMBER_OF_SERVICE_REQUESTS/.test(t)) {
        limited = true;
        console.log(`  ⛔ 일일 요청 한도 초과 — ${done}건까지 저장하고 멈춥니다. 내일 이어서 받습니다.`);
        break;
      }
      if (/OpenAPI_ServiceResponse|SERVICE_ERROR/.test(t)) { err++; await sleep(400); continue; }
      const it = JSON.parse(t).response.body.items;
      const d = it && (it.item ? (Array.isArray(it.item) ? it.item[0] : it.item) : null);
      if (d) {
        r.ov = clean(d.overview).slice(0, 700);
        r.tel = clean(d.tel); r.hp = clean(d.homepage).replace(/.*?href="([^"]+)".*/, '$1');
      }
      r.ovDone = true;
      done++;
      if (done % 200 === 0) {
        fs.writeFileSync(OUT, JSON.stringify(rows), 'utf8');
        console.log(`  … ${done}/${todo.length} (저장)`);
      }
    } catch (e) { err++; }
    await sleep(120);
  }

  fs.writeFileSync(OUT, JSON.stringify(rows), 'utf8');
  console.log(`✓ data/places_en.json — ${rows.length}건 (개요 수집 완료 ${rows.filter(r => r.ovDone).length}건)`);
  const noSido = rows.filter(r => !r.sido).length;
  if (noSido) console.log(`  ⚠️ 시·도 미상 ${noSido}건 — 법정동 코드가 비었는지 확인할 것`);
  KINDS.forEach(K => {
    const a = rows.filter(r => r.kind === K.kind);
    console.log(`  ${K.label.padEnd(6)} ${String(a.length).padStart(5)}건 · 개요200자↑ ${a.filter(r => r.ov.length >= 200).length}`
      + ` · 한글원제 ${a.filter(r => r.ko).length} · 사진 ${a.filter(r => r.img).length} · 좌표 ${a.filter(r => r.x).length}`);
  });
  const left = rows.filter(r => !r.ovDone).length;
  console.log(`  API 오류 ${err}건${limited ? ' · ⛔한도초과로 중단' : ''}${ranOut ? ' · ⏱예산소진' : ''}`
    + (left ? ` · 남은 개요 ${left}건 → 다시 실행하면 이어받음` : ''));
})();
