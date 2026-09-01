// 🇯🇵 일본어 장소 데이터 — 관광지·문화시설·여행코스 (JpnService2) → data/places_ja.json
//
// 왜 (2026-09-01 실측)
//   장남 님: 「일본인이 좋아하는 관광지 리스트를 주면 좋겠다」
//   → **국적별 방문 데이터는 존재하지 않는다.** 관광공사 DataLabService 를 직접 열어 보니
//     구분이 `현지인(a)/외지인(b)/외국인(c)` 셋뿐이고 국적 필드가 없다. 공공데이터포털에도
//     국적별 «방문지» API 는 없다(데이터랩 웹에는 있지만 API 미제공).
//     → 「일본인이 많이 가는 곳」이라고 쓰면 **지어내는 것**이다. 그렇게 쓰지 않는다.
//
//   대신 정직하게 말할 수 있는 것: **한국관광공사가 일본어로 «번역해 둔» 장소**.
//   이건 일본 시장을 겨냥한 공식 큐레이션이고, 일본인 여행자에게 실제로 유용하다
//   (현장에서 일본어 안내를 기대할 수 있는 곳이라는 뜻이기도 하다).
//
// ⭐ 뜻밖의 수확: JpnService2 는 제목을 **「9.81パーク済州（9.81 파크 제주）」** 처럼 준다.
//    괄호 안에 **한글 원제가 그대로 들어 있다** — 네이버·카카오 지도에 붙여넣을 이름을
//    따로 만들 필요가 없다(영문 서비스는 이게 없어 좌표로 이어야 했다).
//
// 실행: node fetch-ja-places.js        (키: tourapi.key)
// ⚠️ TourAPI 상세는 **순차 + 120ms**. 동시 호출하면 막힌다.
// ⚠️ 개요를 못 받은 것도 `ovDone` 으로 표시해 둔다 — 안 그러면 매주 같은 것을 다시 묻는다.
const fs = require('fs'), path = require('path'), https = require('https');
const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const B = 'https://apis.data.go.kr/B551011/JpnService2/';
const OUT = path.join(__dirname, 'data', 'places_ja.json');
// ⚠️ 2026-09-01 실측: JpnService2 의 addr1 은 **가타카나로 음차된 주소**다
//    (「チェジュ特別自治道チェジュ市エウォル邑…」). region.js 의 한글 주소 파서로는 시·도가 안 나온다
//    — 처음 돌렸을 때 700건이 전부 「시도 미상」이었다.
//    → 주소가 아니라 **법정동 코드(lDongRegnCd)** 로 시·도를 정한다. 언어와 무관해서 안전하다.
const { sidoOf, validCoord } = require('./region');

const KINDS = [
  { id: 76, kind: 'spot', label: '관광지' },
  { id: 78, kind: 'culture', label: '문화시설' },
  { id: 75, kind: 'course', label: '여행코스' }
];

const get = u => new Promise((res, rej) => {
  https.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
    r.setEncoding('utf8'); let d = '';
    r.on('data', c => d += c); r.on('end', () => res(d));
  }).on('error', rej);
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ')
  .replace(/\s+/g, ' ').trim();

// 「9.81パーク済州（9.81 파크 제주）」 → { ja:'9.81パーク済州', ko:'9.81 파크 제주' }
function splitTitle(t) {
  const s = String(t || '').trim();
  const m = s.match(/^(.*?)\s*[（(]\s*([^（()）]*[가-힣][^（()）]*)\s*[)）]\s*$/);
  if (m) return { ja: m[1].trim(), ko: m[2].trim() };
  return { ja: s, ko: '' };
}

async function listAll(id) {
  const out = [];
  for (let p = 1; p <= 40; p++) {
    const t = await get(`${B}areaBasedList2?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa`
      + `&_type=json&numOfRows=200&pageNo=${p}&contentTypeId=${id}&arrange=A`);
    let b;
    try { b = JSON.parse(t).response.body; }
    catch (e) { console.log('  ⚠️ 목록 파싱 실패 p' + p + ' — ' + t.slice(0, 80).replace(/\s+/g, ' ')); break; }
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
  // 이전 결과를 캐시로 물려받는다 — 받은 필드 «전부» 물려줘야 매주 다시 안 묻는다
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
      const { ja, ko } = splitTitle(x.title);
      if (!ja) continue;
      const addr = clean(x.addr1 || '');
      const regnCd = String(x.lDongRegnCd || x.regnCd || '');
      const signguCd = String(x.lDongSignguCd || x.signguCd || '');
      // ⚠️ 가타카나 주소라 주소 파싱이 안 된다 → 코드12는 signguCd로 갈라야 한다
      const sido = sidoOf(regnCd, addr, signguCd);
      const okXY = x.mapx && x.mapy && validCoord(x.mapx, x.mapy);
      rows.push({
        id: String(x.contentid), kind: K.kind,
        title: ja, ko,                       // ⭐ ko = 지도에 붙여넣을 한글 원제(원본이 그냥 준다)
        addr, sido, regnCd, signguCd: String(x.lDongSignguCd || x.signguCd || ''),
        x: okXY ? String(x.mapx) : '', y: okXY ? String(x.mapy) : '',
        img: clean(x.firstimage || x.firstimage2 || ''),
        cat: clean(x.cat2 || ''),
        ov: (prev[x.contentid] || {}).ov || '',
        tel: (prev[x.contentid] || {}).tel || '',
        hp: (prev[x.contentid] || {}).hp || '',
        ovDone: !!(prev[x.contentid] || {}).ovDone
      });
    }
    await sleep(150);
  }

  const todo = rows.filter(r => !r.ovDone);
  console.log(`개요 수집 대상 ${todo.length}건 (캐시로 건너뜀 ${rows.length - todo.length}건)`);
  let done = 0, err = 0;
  for (const r of todo) {
    try {
      const t = await get(`${B}detailCommon2?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa`
        + `&_type=json&contentId=${r.id}`);
      // ⚠️ 한도 초과·장애는 XML(OpenAPI_ServiceResponse)로 온다. 「데이터 없음」으로 읽으면 안 된다.
      // ⚠️ 2026-09-01 실사고: 일일 한도를 넘긴 뒤에도 계속 돌아 **2,500번을 헛돌았다**(로그는
      //    done 이 안 올라 200단위 출력이 멈춰 겉보기엔 멈춘 것 같았다).
      //    → 한도 초과는 «재시도해도 소용없는 상태»다. 즉시 멈추고 여기까지를 저장한다.
      if (/LIMITED_NUMBER_OF_SERVICE_REQUESTS/.test(t)) {
        console.log(`  ⛔ 일일 요청 한도 초과 — ${done}건까지 저장하고 멈춥니다. 내일 다시 돌리면 이어서 받습니다.`);
        break;
      }
      if (/OpenAPI_ServiceResponse|SERVICE_ERROR/.test(t)) { err++; await sleep(400); continue; }
      const it = JSON.parse(t).response.body.items;
      const d = it && (it.item ? (Array.isArray(it.item) ? it.item[0] : it.item) : null);
      if (d) {
        r.ov = clean(d.overview).slice(0, 700);
        r.tel = clean(d.tel); r.hp = clean(d.homepage).replace(/.*?href="([^"]+)".*/, '$1');
      }
      r.ovDone = true;                       // 개요가 «없는» 곳도 표시 — 매주 다시 묻지 않게
      done++;
      if (done % 200 === 0) {
        fs.writeFileSync(OUT, JSON.stringify(rows), 'utf8');
        console.log(`  … ${done}/${todo.length} (저장)`);
      }
    } catch (e) { err++; }
    await sleep(120);
  }

  fs.writeFileSync(OUT, JSON.stringify(rows), 'utf8');
  const st = k => rows.filter(r => r.kind === k);
  console.log(`✓ data/places_ja.json — ${rows.length}건 (개요 수집 완료 ${rows.filter(r => r.ovDone).length}건)`);
  const noSido = rows.filter(r => !r.sido).length;
  if (noSido) console.log(`  ⚠️ 시·도 미상 ${noSido}건 — 법정동 코드가 비었는지 확인할 것`);
  KINDS.forEach(K => {
    const a = st(K.kind);
    console.log(`  ${K.label.padEnd(6)} ${String(a.length).padStart(5)}건 · 개요200자↑ ${a.filter(r => r.ov.length >= 200).length}`
      + ` · 한글원제 ${a.filter(r => r.ko).length} · 사진 ${a.filter(r => r.img).length} · 좌표 ${a.filter(r => r.x).length}`);
  });
  console.log(`  API 오류 ${err}건`);
})();
