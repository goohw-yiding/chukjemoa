// 🎪 개별 축제 페이지 /festival/{slug}/
//
// ⚠️ 2026-08-09 발견: **축제 사이트인데 개별 축제 페이지가 0개였다.**
//    922개 축제가 전부 목록과 모달 안에만 있어서, "부산 바다축제"를 검색한 사람이 도착할 페이지가 없었다.
//    개별 축제명이야말로 검색 수요의 대부분인데 그걸 통째로 버리고 있었던 셈이다.
//
// ⚠️ 다만 922개를 다 만들면 '얇은 페이지 양산'이 된다(2026-08-08 노출진단 결론).
//    그래서 **개요 300자↑ · 사진 있음 · 근처 정보 3곳↑ · 2026년 이후** 인 377개만 만든다.
//
// 📏 2026-08-10 확대(400자 → 300자, 140 → 377개). 넓히기 전에 실측하고 넓힌 것:
//    · 본문 자수 — 평균 4,134자 · 중앙 4,171자 · **최소 2,316자**(3,000자 미만은 3개뿐)
//    · 페이지 간 유사도 — 최대 0.687, **0.7 이상 0건**(같은 시군구 축제끼리 근처 목록을 공유해도 안 겹친다)
//    개요는 짧아도 근처 맛집·카페·걷기길·코스·붐빔이 전부 좌표에서 나오므로 본문이 얇아지지 않는다.
//    ⚠️ 여기서 더 낮추면(250자) 444개가 되는데, 그때는 자수 하한을 다시 재고 넓힐 것.
//
// 🔬 임계값을 바꿀 때 쓰는 검증 두 가지 — 눈으로 보지 말고 숫자로 볼 것:
//    ① 본문 자수: <main> 태그 안 텍스트 길이. 2,000자 미만이 생기면 그 임계값은 너무 낮다.
//    ② 유사도: 8글자 shingle 자카드. 0.7 이상 쌍이 생기면 중복 콘텐츠로 걸릴 수 있다.
//
// 한 페이지에 들어가는 것 — 이만큼 넣을 수 있는 건 그동안 모은 데이터가 다 있기 때문이다:
//   개요 · 일정/장소/연락처 · **그 동네 붐빔 배수** · 근처 가볼 곳 · **근처 걷기길(거리·소요시간)**
//   · **근처 맛집·카페(영업시간·휴무일)** · 숙소 · **이 축제 중심 하루 코스(코스 엔진 재사용)**
//   · 그날 열리는 오일장 · 무장애/반려 · 그 지역 국가유산 · 같은 달/같은 지역 축제
const fs = require('fs'), path = require('path');
const E = require('./course/engine.js');
const R = require('./course/render.js');
const { romanizeMixed } = require('./placename.js');
const { inKorea } = require('./geo.js');
const { prose, proseLead } = require('./prose.js');
const { mapBlock, mapScript } = require('./nmap.js');   // 좌표 기반 지도 — 주소보다 좌표가 정확하다
const WX = require('./weather.js');                     // 축제 당일 날씨(예보 창 안에 있는 축제만)

const MIN_OV = 300, MIN_NEAR = 3, FROM_YEAR = '2026';

function load(f) { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { return []; } }
const num = v => { const n = Number(v); return isFinite(n) ? n : 0; };
function sgOf(addr, given) {
  if (given) return given;
  const t = String(addr || '').split(' ');
  if (t.length > 1 && /(시|군|구)$/.test(t[1])) return t[1];
  return '';
}
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function slugify(t) {
  return romanizeMixed(t).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'festival';
}
const fmtDate = s => `${s.slice(0, 4)}년 ${+s.slice(4, 6)}월 ${+s.slice(6, 8)}일`;
const dayName = s => '일월화수목금토'[new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)).getDay()];
const won = n => Math.round(n).toLocaleString('ko-KR') + '원';
function addDay(s) {
  const y = +s.slice(0, 4), m = +s.slice(4, 6) - 1, d = +s.slice(6, 8);
  const dt = new Date(y, m, d + 1);
  const mm = dt.getMonth() + 1, dd = dt.getDate();
  return `${dt.getFullYear()}${mm < 10 ? '0' : ''}${mm}${dd < 10 ? '0' : ''}${dd}`;
}

const CSS = `
.fhero{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 3px 16px rgba(31,41,55,.08);margin:14px 0}
.fhero img{width:100%;max-height:340px;object-fit:cover;display:block;background:#f6f1ea}
.finfo{display:grid;grid-template-columns:88px 1fr;gap:8px 12px;padding:16px 18px;font-size:.94rem}
.finfo dt{font-weight:800;color:#0a6c63}
.finfo dd{color:#374151}
.fbadge{display:inline-block;font-size:.78rem;font-weight:800;border-radius:999px;padding:4px 11px;margin:0 6px 6px 0}
.fbadge.hot{background:#fff1e8;color:#c2410c}
.fbadge.qt{background:#f2fbfa;color:#0a6c63}
.fbadge.d{background:#0f9d8f;color:#fff}
.fbadge.end{background:#e5e7eb;color:#6b7280}
.fbadge.pet{background:#f0fdf4;color:#15803d}
.fbadge.acc{background:#eef2ff;color:#4338ca}
.fgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:12px;margin:12px 0}
.fend{background:#fff7ed;border:1.5px solid #fed7aa;border-radius:14px;padding:16px 18px;margin:14px 0 18px}
.fend h2{font-size:1.08rem;font-weight:900;color:#9a3412;margin:0 0 8px}
.fend p{color:#7c2d12;font-size:.95rem;line-height:1.62;margin:0 0 7px}
.fend .fend-h{margin-top:11px}
.fend ul{margin:5px 0 0}
.fend li{color:#7c2d12;font-size:.93rem;line-height:1.7}
.fend a{color:#9a3412;font-weight:700;text-decoration:underline}
.fcard{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(31,41,55,.07)}
.fcard img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block;background:#f0ece6}
.fcard .noimg{width:100%;aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;background:#f4f1ec;color:#c9c2b8;font-size:1.5rem}
.fcard .b{padding:10px 12px}
.fcard h4{font-size:.93rem;font-weight:800;color:#1f2937;margin:0 0 3px}
.fcard .m{font-size:.79rem;color:#6b7280;line-height:1.5}
.fcard .h{font-size:.78rem;color:#4b5563;margin-top:4px}
.fcard .h.dim{color:#b0b7c0}
.flist{list-style:none;padding:0;margin:10px 0}
.flist li{background:#fff;border-radius:12px;padding:11px 14px;margin-bottom:8px;box-shadow:0 2px 8px rgba(31,41,55,.06);font-size:.9rem;color:#374151}
.flist li b{color:#0a6c63}
.flist li em{font-style:normal;color:#9ca3af;font-size:.9em}
.fnum{background:#f2fbfa;border-radius:16px;padding:16px 18px;margin:16px 0}
.fnum h3{font-size:1rem;font-weight:900;color:#0a6c63;margin-bottom:6px}
.fnum p{font-size:.92rem;color:#374151;line-height:1.7}
.fmap{display:inline-block;margin-top:6px;font-size:.85rem;font-weight:700;color:#0f9d8f;text-decoration:none}
.frel{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
.frel a{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.86rem;padding:8px 14px;border-radius:999px;text-decoration:none}
.frel a:hover{background:#e2f5f2}
.fnext{background:#f4faf8;border:1.5px solid #dcefeb;border-radius:14px;padding:13px 16px;margin:14px 0 18px}
.fnext-t{font-size:.85rem;font-weight:800;color:#0a6c63;margin-bottom:8px}
.fnext-row{display:flex;flex-wrap:wrap;gap:7px}
.fnext-row a{background:#fff;border:1.5px solid #cfe9e3;color:#0a6c63;font-weight:800;font-size:.9rem;padding:8px 14px;border-radius:999px;text-decoration:none}
.fnext-row a.hot{background:#0f9d8f;border-color:#0f9d8f;color:#fff}
.forg{background:#fafaf9;border:1px dashed #d6d3d1;border-radius:12px;padding:13px 16px;margin:22px 0 6px}
.forg b{display:block;font-size:.92rem;font-weight:800;color:#57534e;margin-bottom:5px}
.forg p{font-size:.87rem;color:#78716c;line-height:1.75;margin:0 0 8px}
.forg a{color:#57534e;font-weight:700}
.forg .forg-mail{display:inline-block;font-size:.85rem;font-weight:800;color:#0a6c63;text-decoration:none;border-bottom:1.5px solid #a9e5dd}
.factions{display:flex;flex-wrap:wrap;gap:9px;margin:2px 0 14px}
.fav-standalone{position:static;display:inline-flex;align-items:center;width:auto;height:auto;padding:9px 16px;border-radius:999px;font-size:1rem;font-weight:800;color:#374151;background:#fff;border:1.5px solid #e5e7eb;box-shadow:none;cursor:pointer}
.fav-standalone::after{content:'찜하기';margin-left:7px;font-size:.88rem;font-weight:800}
.fav-standalone.on{color:#ff3b6b;border-color:#ffc9d6;background:#fff5f7}
.fav-standalone.on::after{content:'찜 완료'}
.cal-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:999px;font-size:.88rem;font-weight:800;color:#0a6c63;background:#f2fbfa;border:1.5px solid #cdeae5;cursor:pointer;font-family:inherit;text-decoration:none;transition:all .15s}
.cal-btn:hover{background:#e2f5f2}
`;

// 거리순 근처 뽑기
function near(list, x, y, maxKm, n) {
  const out = [];
  for (const o of list) {
    if (!o.x || !o.y) continue;
    const d = E.hav(x, y, +o.x, +o.y);
    if (d <= maxKm) out.push({ o, d });
  }
  out.sort((a, b) => a.d - b.d);
  return out.slice(0, n);
}

function build(ctx) {
  const { ROOT, layout, writePage, SITE_NAME, SITE, buyBox, festBuyBox, nearAiBox, TODAY, MONTH_KEYS } = ctx;
  // 축제 시작월 → 월별 페이지 키. **실제로 만드는 달일 때만** 돌려준다(없으면 링크하지 않는다).
  const MK = new Set(MONTH_KEYS || []);
  const monthKeyOf = f => { const d = String(f.start || ''); const k = d.slice(0, 4) + '-' + d.slice(4, 6); return MK.has(k) ? k : ''; };

  const fes = load('festivals_api.json');
  const nearbyRaw = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'nearby.json'), 'utf8')); } catch (e) { return {}; } })();
  const visitors = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'visitors.json'), 'utf8')); } catch (e) { return {}; } })();
  const FAME = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'fame.json'), 'utf8')); } catch (e) { return {}; } })();

  const food = load('restaurants_ko.json'), cafe = load('cafes_ko.json'), stay = load('stays_ko.json');
  // 행정안전부 전국관광지정보표준데이터(2026-09-01). TourAPI 관광지와 이름이 겹치는 건 29%뿐이고
  // **주차 「대수」·수용인원·편익시설**은 우리에게 아예 없던 정보다 —
  // 축제 FAQ의 「주차는 어떻게 하나요?」에 그동안 「축제장 안내를 따르세요」밖에 못 썼다.
  const trr = load('trrsrt.json').map(t => ({ title: t.name, x: t.x, y: t.y, kind: t.kind, park: t.park, cap: t.cap, fclty: t.fclty, intro: t.intro, tel: t.tel }));
  const spots = load('spots_ko.json'), acc = load('accessible.json'), mkts = load('markets.json');
  const walk = load('stret.json').map(w => ({ t: w.name, x: w.x, y: w.y, km: w.km, min: w.min, ov: w.intro, sg: sgOf(w.addr, w.sigungu) }))
    .concat(load('trails.json').map(w => ({ t: w.name, x: w.x, y: w.y, km: w.dist, min: w.min, lv: w.level, ov: w.summary, sg: String(w.sigun || '').split(' ').pop() })));

  // 붐빔 지표 (시군구 → 월별 배수)
  const BUSY = {}, months = (visitors.seasonByMonth && visitors.seasonByMonth.months) || {};
  Object.keys(months).forEach(m => (months[m] || []).forEach(r => {
    (BUSY[r.sido + '|' + r.name] = BUSY[r.sido + '|' + r.name] || {})[m] = r.idx;
  }));
  // ⚠️ 2026-08-31: 대표월을 [1,4,8,10]으로 박아 둬서 **9월 축제가 8월 붐빔을 보고 있었다.**
  //    수집기는 「이번 달」도 같이 받아 두는데(seasonByMonth.months) 여기서 안 쓰고 있었다.
  //    → 그 달 데이터가 있으면 그 달을 쓰고, 없을 때만 가장 가까운 달로 대체한다.
  //    (영광불갑산상사화축제 9월 x1.09가 데이터에 있는데도 화면에 안 나오던 원인)
  const REP = Object.keys(months).map(Number).filter(n => n >= 1 && n <= 12).sort((a, b) => a - b);
  const repMonth = m => REP.length
    ? (REP.includes(m) ? m : REP.reduce((a, b) => (Math.abs(b - m) < Math.abs(a - m) ? b : a), REP[0]))
    : m;

  const nb = id => { const a = nearbyRaw[id]; return Array.isArray(a) ? a : (a ? [a] : []); };
  // ⚠️ 2026-08-10 장남 님 지적: 태백 축제 페이지에 「모녀떡볶이 **부평**남부역점」「**광천**막국수」가 떠서
  //    "인천·충남 가게가 왜 여기 있냐"고 물으셨다. 확인해 보니 **둘 다 실제로 태백시**였다.
  //    프랜차이즈 지점명이 잘못 등록됐거나(부평남부역점 → 실주소 태백시 황지동) 상호에 지역명이 들어간 경우다.
  //    데이터는 맞는데 **카드에 이름과 거리만 보여줘서 확인할 방법이 없었던 게 문제**였다.
  //    같은 오해를 부를 수 있는 항목이 근처 목록 4,847건 중 45건 있다(전주식당@양구, 일산정삼계탕@울산 …).
  //    → 근처 카드에 **그 가게가 실제로 어느 시·군·구인지**를 같이 적는다. 우리 데이터로 88%가 확인된다.
  const ADDR_OF = {};
  [food, cafe, stay, spots, acc, load('mountains_ko.json'), load('valleys.json'),
   load('maple.json'), load('flower.json'), load('onsen.json'), load('pets.json')].forEach(list => {
    (list || []).forEach(x => { const t = x.title || x.name; if (t && !ADDR_OF[t]) ADDR_OF[t] = x.addr || ''; });
  });
  const sgOfTitle = t => sgOf(ADDR_OF[t] || '');


  // ── 대상 선별
  // ⚠️ inKorea 검사가 없으면 좌표가 중국 남해인 축제가 상세 페이지로 나간다(2026-08-10 실사고, geo.js 참고).
  //    좌표가 틀리면 근처 맛집·걷기길·코스·숙소가 전부 틀리므로 본문 전체가 거짓이 된다.
  const cand = fes.filter(f =>
    f.ov && f.ov.length >= MIN_OV && f.img && inKorea(f.x, f.y) &&
    nb(f.id).length >= MIN_NEAR && String(f.start).slice(0, 4) >= FROM_YEAR)
    .sort((a, b) => String(a.start).localeCompare(String(b.start)));

  const seen = {}, urls = [], index = [];
  cand.forEach(f => {
    let s = slugify(f.title);
    if (seen[s]) { let i = 2; while (seen[s + '-' + i]) i++; s = s + '-' + i; }
    seen[s] = 1; f._slug = s;
  });
  const bySlug = {}; cand.forEach(f => { bySlug[f._slug] = f; });

  // ── 끝난 축제 처리용 (2026-08-18)
  // ⚠️ 실측: 축제 상세 394개 중 246개(62%)가 「종료된 축제」인데도 "이 축제로 하루를 짠다면"을
  //    현재형으로 안내하고 있었다. 사이트의 지배적 콘텐츠(전체의 68%)가 «이미 지나간 행사»로 보이는 것이
  //    애드센스 「가치가 별로 없는 콘텐츠」의 유력 원인. → 끝난 축제는 색인에서 빼고(noindex),
  //    페이지 상단에서 «지금 갈 수 있는 곳»으로 곧장 보낸다. 링크·헤더검색은 살린다(follow).
  const TD = TODAY.replace(/-/g, '');
  const aliveBySido = {};
  cand.filter(f => String(f.end) >= TD)
    .sort((a, b) => String(a.start).localeCompare(String(b.start)))
    .forEach(f => { (aliveBySido[f.sido] = aliveBySido[f.sido] || []).push(f); });
  const noindexUrls = [];
  let wxCount = 0;                       // 날씨가 실제로 붙은 축제 수(감사용)

  cand.forEach(f => {
    const x = num(f.x), y = num(f.y), sg = f.sigungu || sgOf(f.addr);
    const mStart = +String(f.start).slice(4, 6);
    const rm = String(repMonth(mStart));
    const idx = (BUSY[f.sido + '|' + sg] || {})[rm];
    const ended = String(f.end) < TODAY.replace(/-/g, '');
    const ongoing = !ended && String(f.start) <= TODAY.replace(/-/g, '');
    const dday = (() => {
      const a = new Date(+f.start.slice(0, 4), +f.start.slice(4, 6) - 1, +f.start.slice(6, 8));
      const b = new Date(+TODAY.slice(0, 4), +TODAY.slice(5, 7) - 1, +TODAY.slice(8, 10));
      return Math.round((a - b) / 86400e3);
    })();

    // ── 근처 데이터
    const nFood = near(food, x, y, 12, 6);
    const nCafe = near(cafe, x, y, 12, 4);
    const nStay = near(stay, x, y, 15, 4);
    const nWalk = near(walk, x, y, 20, 3);
    const nTrr = near(trr, x, y, 15, 4);
    const nSpot = near(spots, x, y, 12, 6);
    const nAcc = near(acc, x, y, 8, 3);
    const nbList = nb(f.id).slice(0, 5);
    const mktHere = mkts.filter(m => m.region === f.sido && sg && String(sg).indexOf(String(m.city).slice(0, 2)) === 0);

    // ── 이 축제 중심 하루 코스 (코스 엔진의 렌더러를 그대로 쓴다 — 화면이 사이트 전체와 같아야 한다)
    const D = { sido: f.sido, busy: { [sg]: BUSY[f.sido + '|' + sg] || {} }, fgn: {}, mkt: [], c: {} };
    const mk = (o, cat, extra) => Object.assign({ cat, t: o.title || o.t, x: +o.x, y: +o.y, sg, img: o.img || '' }, extra || {});
    const items = [];
    let clock = 10 * 60;
    const push = (o, cat, stayMin, extra) => {
      const prev = items.length ? items[items.length - 1].o : null;
      const tv = prev ? { km: E.hav(prev.x, prev.y, +o.x, +o.y) * 1.35, min: 0 } : { km: 0, min: 0 };
      tv.min = tv.km / 55 * 60 + 4;
      clock += tv.min;
      const oo = mk(o, cat, extra);
      items.push({ o: oo, at: E.hhmm(clock), till: E.hhmm(clock + stayMin), move: tv, stay: stayMin, kind: cat });
      clock += stayMin;
    };
    push({ title: f.title, x, y, img: f.img }, 'fes', 150, { ov: proseLead(f.ov, 100) });
    if (nFood[0]) push(nFood[0].o, 'food', 70, { kind: nFood[0].o.kind, open: nFood[0].o.open, rest: nFood[0].o.rest, menu: nFood[0].o.menu });
    if (nSpot[0]) push(nSpot[0].o, 'nat', 90, { sub: '관광지' });
    if (nCafe[0]) push(nCafe[0].o, 'cafe', 60, { open: nCafe[0].o.open, rest: nCafe[0].o.rest });
    if (nWalk[0]) push({ title: nWalk[0].o.t, x: nWalk[0].o.x, y: nWalk[0].o.y }, 'walk', Math.min(+nWalk[0].o.min || 90, 150), { km: nWalk[0].o.km, min: nWalk[0].o.min });
    const totKm = items.reduce((a, i) => a + (i.move ? i.move.km : 0), 0);
    const PLAN = { O: {}, days: [{ date: f.start, items, km: totKm, markets: [], month: rm }], km: totKm, carCost: totKm * 142 };
    const courseHtml = R.renderPlan(D, PLAN, { static: true, nodate: true });

    // ── 붐빔 문장 (우리만 쓸 수 있는 문단)
    let busyP = '';
    if (idx) {
      busyP = idx >= 1.15
        ? `<p>축제가 열리는 <b>${esc(f.sido)} ${esc(sg)}</b>는 ${rm}월에 평소보다 <b>${idx.toFixed(2)}배</b> 붐빕니다. 한국관광공사 「한국관광 데이터랩」의 시·군·구 방문자 수를 그 지역의 평소 하루 평균과 비교한 값입니다. 숙소는 미리 잡고, 주차장은 오전에 차는 편이라고 보시면 됩니다.</p>`
        : `<p>축제가 열리는 <b>${esc(f.sido)} ${esc(sg)}</b>는 ${rm}월 기준 평소의 <b>${idx.toFixed(2)}배</b>로, 이 지역치고는 <b>한산한 편</b>입니다. 사람에 치이지 않고 축제를 보고 싶다면 유리한 조건입니다.</p>`;
      busyP += `<p class="note" style="margin-top:6px">이 숫자는 축제장 자체가 아니라 <b>${esc(sg)} 전체</b>의 방문자 기준입니다. 축제장 앞 혼잡과는 다를 수 있습니다.</p>`;
    }

    // ── 끝난 축제 안내 (2026-08-18)
    // 「종료」 배지 하나만 달아 두고 본문 전체를 현재형으로 두면, 못 가는 행사를 권하는 페이지가 된다.
    // 기록으로서의 값은 남기되 «지금 갈 수 있는 곳»을 상단에서 바로 준다.
    let endedBox = '';
    if (ended) {
      const d0 = +String(f.start).slice(6, 8);
      const when = `${mStart}월 ${d0 <= 10 ? '초' : d0 <= 20 ? '중' : '하'}순`;
      const alt = (aliveBySido[f.sido] || []).slice(0, 6);
      endedBox = `<div class="fend">
<h2>이 축제는 이미 끝났습니다</h2>
<p>${fmtDate(String(f.end))}에 종료됐습니다. 이 페이지에 정리해 둔 근처 맛집·걷기길·동선은 <b>다음 회차를 가늠할 기록</b>으로 남겨 둔 것이지, 지금 갈 수 있는 행사가 아닙니다.</p>
<p>${esc(f.title)}은 예년 기준 <b>${when}</b>에 열렸습니다. 다음 일정은 주최 측이 공지한 뒤 공공데이터에 반영되고, 이 페이지도 그때 자동으로 갱신됩니다${f.tel ? ` — 급하시면 ${esc(f.tel)}로 직접 확인하실 수 있습니다` : ''}.</p>
${alt.length ? `<p class="fend-h"><b>지금 ${esc(f.sido)}에서 갈 수 있는 축제</b></p>
<ul class="flist">${alt.map(a => `<li><a href="/festival/${a._slug}/">${esc(a.title)}</a> — ${fmtDate(String(a.start))}${String(a.start) <= TD ? ' · <b>진행 중</b>' : ' 시작'}</li>`).join('')}</ul>` : ''}
<p class="fend-h"><a href="/festival/">지금 열리거나 곧 열리는 축제 전체 보기 →</a></p>
</div>`;
    }

    // ── 국가유산
    const her = (FAME[f.sido + '|' + sg] || {}).her || {};
    const herTxt = ['국보', '보물', '사적', '명승', '국가민속문화유산'].filter(k => her[k]).map(k => `${k} ${her[k]}점`).join(' · ');

    // ── 본문
    // 사진이 없는 항목이 16% 있다. 빈 카드는 고장난 것처럼 보여서 회색 자리표를 대신 넣는다.
    const card = (title, meta, img, hours, mapx, mapy) =>
      `<div class="fcard">${img ? `<img src="${esc(img)}" alt="${esc(title)}" loading="lazy">` : '<div class="noimg">🏞</div>'}<div class="b"><h4>${esc(title)}</h4>`
      + (meta ? `<div class="m">${esc(meta)}</div>` : '')
      + (hours === null ? `<div class="h dim">🕘 영업시간 정보 없음 — 방문 전 확인</div>` : (hours ? `<div class="h">🕘 ${esc(hours)}</div>` : ''))
      + (mapx ? `<a class="fmap" target="_blank" rel="noopener" href="https://map.kakao.com/link/to/${encodeURIComponent(title)},${mapy},${mapx}">길찾기 →</a>` : '')
      + `</div></div>`;

    const faq = [
      ended
        ? [`${f.title}은 아직 열리나요?`, `아닙니다. ${fmtDate(String(f.end))}(${dayName(String(f.end))})에 이미 종료됐습니다. 예년 기준 ${mStart}월 ${+String(f.start).slice(6, 8) <= 10 ? '초' : +String(f.start).slice(6, 8) <= 20 ? '중' : '하'}순에 열렸고, 다음 회차 일정은 주최 측 공지 후 공공데이터에 반영되면 이 페이지도 갱신됩니다${f.tel ? `. 급하시면 ${f.tel}로 확인하세요` : ''}.`]
        : [`${f.title}은 언제 열리나요?`, `${fmtDate(String(f.start))}(${dayName(String(f.start))})부터 ${fmtDate(String(f.end))}(${dayName(String(f.end))})까지입니다. 일정은 주최 측 사정으로 바뀔 수 있으니 출발 전 ${f.tel ? `${f.tel}로 ` : ''}확인하시는 편이 안전합니다.`],
      [`${f.title} 근처에 뭐가 있나요?`, `${nbList.slice(0, 3).map(n => n.t).join(', ')} 등이 가까이 있습니다. 걸어서 갈 만한 거리의 식당 ${nFood.length}곳과 카페 ${nCafe.length}곳, 반경 20km 안 걷기길 ${nWalk.length}개도 이 페이지에 정리해 뒀습니다.`],
      idx ? [`축제 기간에 사람이 많은가요?`, `${sg}는 ${rm}월에 평소의 ${idx.toFixed(2)}배 붐빕니다. 이 수치는 한국관광공사 데이터랩의 시·군·구 방문자 수 기준이며, 축제장 자체의 혼잡도가 아니라 그 지역 전체의 값입니다.`] : null,
      [`주차나 숙소는 어떻게 하나요?`, `반경 15km 안 숙소 ${nStay.length}곳을 위치와 유형으로 정리해 뒀습니다. 가격과 빈방은 저희 데이터에 없어 표시하지 않습니다. 주차는 축제장 안내를 따르시고, 붐비는 축제는 오전에 도착하는 편이 안전합니다.`]
    ].filter(Boolean);

    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(f.title)}&dates=${f.start}/${addDay(String(f.end))}&location=${encodeURIComponent(f.addr || '')}&details=${encodeURIComponent(SITE + '/festival/' + f._slug + '/')}`;

    // 🌤 예보 창(오늘~16일) 안에 있는 축제만 붙는다. 파일이 오늘 것이 아니면 weather.js 가 통째로 비운다.
    const wx = WX.block(f);
    if (wx.count) wxCount++;

    const content = `<main><div class="wrap"><style>${CSS}</style>
${wx.html ? WX.CSS : ''}
<h1 style="font-size:1.55rem;font-weight:900;margin:8px 0 6px">${esc(f.title)}</h1>
<div style="margin-bottom:8px">
${ended ? `<span class="fbadge end">종료된 축제</span>` : ongoing ? `<span class="fbadge d">진행 중</span>` : dday > 0 ? `<span class="fbadge d">D-${dday}</span>` : ''}
${idx ? `<span class="fbadge ${idx >= 1.15 ? 'hot' : 'qt'}">${idx >= 1.15 ? `🔥 ${rm}월 ${esc(sg)} 평소의 ×${idx.toFixed(2)}` : `🤫 ${rm}월 ${esc(sg)} 한산한 편 ×${idx.toFixed(2)}`}</span>` : ''}
${f.pet ? `<span class="fbadge pet">🐶 반려동물 동반 가능</span>` : ''}
${nAcc.length ? `<span class="fbadge acc">♿ 근처 무장애 시설 ${nAcc.length}곳</span>` : ''}
</div>

<div class="factions">
<button class="fav fav-standalone" type="button" data-name="${esc(f.title)}" aria-label="찜하기">♡</button>
${!ended ? `<a class="cal-btn" href="${esc(gcalUrl)}" target="_blank" rel="noopener">📅 구글 캘린더에 추가</a>
<button class="cal-btn cal-ics" type="button" data-title="${esc(f.title)}" data-start="${f.start}" data-end="${f.end}" data-loc="${esc(f.addr || '')}" data-slug="${f._slug}">⬇️ 캘린더 파일(.ics)</button>` : ''}
</div>

<div class="fhero">
<img src="${esc(f.img)}" alt="${esc(f.title)}">
<dl class="finfo">
<dt>기간</dt><dd>${fmtDate(String(f.start))}(${dayName(String(f.start))}) ~ ${fmtDate(String(f.end))}(${dayName(String(f.end))})</dd>
<dt>장소</dt><dd>${esc(f.addr || '')}</dd>
${f.tel ? `<dt>문의</dt><dd>${esc(f.tel)}</dd>` : ''}
<dt>지도</dt><dd><a class="fmap" target="_blank" rel="noopener" href="https://map.kakao.com/link/to/${encodeURIComponent(f.title)},${y},${x}">카카오맵으로 길찾기 →</a></dd>
</dl>
</div>

${endedBox}

${wx.html}

${idx ? `<div class="fnum"><h3>📊 ${ended ? '이 동네는 이맘때 얼마나 붐비나' : '지금 이 동네, 얼마나 붐비나'}</h3>${busyP}</div>` : ''}

${/* 🔴 2026-09-04 신설 — 축제 상세는 **세션당 1.00~1.10장**, 사실상 막다른 길이었다.
      「같이 보면 좋은 축제」가 본문 **83% 지점**에 있어 아무도 거기까지 안 내려간다(스크롤 23%).
      → 사람이 「이 축제가 뭔지」를 읽기 «직전», 위쪽에 같은 동선을 짧게 하나 더 놓는다.
      ⚠️ 아래 83% 블록은 그대로 둔다 — 끝까지 읽은 사람에게도 출구가 있어야 한다. */''}
${(() => {
      const same = cand.filter(o => o !== f && o.sido === f.sido).slice(0, 3);
      if (!same.length) return '';
      return `<div class="fnext">
<div class="fnext-t">${esc(f.sido)}에서 같이 볼 축제</div>
<div class="fnext-row">${same.map(o => `<a href="/festival/${o._slug}/">${esc(o.title)}</a>`).join('')}
${monthKeyOf(f) ? `<a href="/${monthKeyOf(f)}/" class="hot">🎪 ${String(f.start).slice(4, 6).replace(/^0/, '')}월 축제 전체</a>` : ''}</div>
</div>`;
    })()}

<h2 class="sec">어떤 축제인가</h2>
<p class="note" style="margin:-2px 0 10px">아래 소개는 한국관광공사 TourAPI에 등록된 <b>공식 설명</b>입니다. 저희가 직접 계산해 붙인 것은 붐빔 배수·근처 영업시간·걷기길 거리·하루 동선입니다.</p>
${prose(f.ov)}

${nbList.length ? `<h2 class="sec">축제장 근처 가볼 곳</h2>
<p style="color:#6b7280;font-size:.92rem">한국관광공사가 이 축제 기준으로 알려 준 근처 목록입니다. <b>상호에 다른 지역 이름이 들어간 가게가 있어</b>, 실제로 어느 시·군·구인지 같이 적었습니다.</p>
<div class="fgrid">${nbList.map(n => { const g = sgOfTitle(n.t); return card(n.t, `${n.ty || ''}${g ? ` · ${g}` : ''}${n.d ? ` · ${n.d}km` : ''}`, n.img, '', '', ''); }).join('')}</div>` : ''}

${nFood.length ? `<h2 class="sec">근처에서 밥 먹을 곳</h2>
<p style="color:#6b7280;font-size:.92rem">축제장에서 가까운 순서입니다. 영업시간과 휴무일은 한국관광공사 공공데이터에 등록된 곳만 표시했습니다.</p>
<div class="fgrid">${nFood.map(({ o, d }) => card(o.title, `${o.kind || ''} · ${d.toFixed(1)}km${o.menu ? ` · ${o.menu}` : ''}`, o.img, o.open ? `${o.open}${o.rest ? ` · 휴무 ${o.rest}` : ''}` : null, o.x, o.y)).join('')}</div>` : ''}

${nCafe.length ? `<h2 class="sec">근처 카페</h2>
<div class="fgrid">${nCafe.map(({ o, d }) => card(o.title, `${d.toFixed(1)}km`, o.img, o.open ? `${o.open}${o.rest ? ` · 휴무 ${o.rest}` : ''}` : null, o.x, o.y)).join('')}</div>` : ''}

${nTrr.length ? `<h2 class="sec">근처 관광지 — 주차 대수까지</h2>
<p style="color:#6b7280;font-size:.92rem">행정안전부 「전국관광지정보표준데이터」에 등록된 곳입니다. <b>주차 대수·수용 인원</b>은 지자체가 직접 신고한 값이라, 축제 당일 주차를 가늠할 때 참고가 됩니다(축제장 자체의 주차와는 다릅니다).</p>
<ul class="flist">${nTrr.map(({ o, d }) => `<li><b>${esc(o.title)}</b> — 축제장에서 ${d.toFixed(1)}km${o.kind ? ` · ${esc(o.kind)}` : ''}${o.park ? ` · <b>주차 ${o.park.toLocaleString()}대</b>` : ''}${o.cap ? ` · 수용 ${o.cap.toLocaleString()}명` : ''}${o.fclty && o.fclty.length ? `<br><em>${esc(o.fclty.join(' · '))}</em>` : ''}</li>`).join('')}</ul>` : ''}

${nWalk.length ? `<h2 class="sec">축제 보고 걷기 좋은 길</h2>
<p style="color:#6b7280;font-size:.92rem">반경 20km 안의 걷기길입니다. 거리와 소요시간은 전국길관광정보 표준데이터에 등록된 값입니다.</p>
<ul class="flist">${nWalk.map(({ o, d }) => `<li><b>${esc(o.t)}</b> — 축제장에서 ${d.toFixed(1)}km · ${o.km ? `${o.km}km` : ''}${o.min ? ` · 약 ${Math.round(o.min / 60 * 10) / 10}시간` : ''}${o.lv ? ` · 난이도 ${esc(o.lv)}` : ''}${o.ov ? `<br><em>${esc(String(o.ov).replace(/^-\s*/, '').slice(0, 90))}</em>` : ''}</li>`).join('')}</ul>` : ''}

<h2 class="sec">${ended ? '다음에 열릴 때 참고할 하루 동선' : '이 축제로 하루를 짠다면'}</h2>
<p style="color:#6b7280;font-size:.92rem">${ended
  ? `이 축제가 <b>다시 열린다면</b>을 가정한 예시 동선입니다. 아래 식당·카페·걷기길은 지금도 그대로 있지만, <b>축제 자체는 열리지 않습니다.</b> 지금 갈 수 있는 곳으로 짜려면 <a href="/course/">코스 짜기</a>를 쓰세요.`
  : `축제를 오전에 두고 가까운 순서로 이어 붙인 예시입니다. 날짜와 조건을 바꿔 다시 짜려면 <a href="/course/">코스 짜기</a>에서 하시면 됩니다.`}</p>
${courseHtml}

${nStay.length ? `<h2 class="sec">근처 숙소</h2>
<p style="color:#6b7280;font-size:.92rem">위치와 유형만 표시합니다. 가격·빈방·예약 가능 여부는 저희 데이터에 없습니다.</p>
<div class="fgrid">${nStay.map(({ o, d }) => card(o.title, `${o.kind || '숙박'} · ${d.toFixed(1)}km`, o.img, o.ci ? `체크인 ${o.ci}${o.co ? ` · 체크아웃 ${o.co}` : ''}` : '', o.x, o.y)).join('')}</div>` : ''}

${mktHere.length ? `<h2 class="sec">이 지역 오일장</h2>
<ul class="flist">${mktHere.map(m => `<li>🏮 <b>${esc(m.name)}</b> — ${esc(m.days)} 개시 · ${esc(m.desc || '')}${m.famous ? ` <em>(${esc(m.famous)})</em>` : ''}</li>`).join('')}</ul>` : ''}

${herTxt ? `<div class="fnum"><h3>🏛 ${esc(sg)}가 가진 국가유산</h3><p>${esc(herTxt)}. 국가유산청 공개 자료 기준입니다. 축제만 보고 오기 아깝다면 같이 묶어 보세요.</p></div>` : ''}

${nAcc.length ? `<h2 class="sec">무장애 여행 정보</h2>
<ul class="flist">${nAcc.map(({ o, d }) => `<li>♿ <b>${esc(o.title)}</b> — ${d.toFixed(1)}km${o.acc && o.acc.length ? ` · ${esc(o.acc.join(' · '))}` : ''}</li>`).join('')}</ul>
<p class="note">한국관광공사 무장애 관광정보에 등록된 시설입니다. 축제장 자체의 접근성은 주최 측에 확인하세요.</p>` : ''}

${nearAiBox ? nearAiBox(`${f.title} 주변`, {
      place: `${f.title} (${f.sido}${sg ? ' ' + sg : ''})${idx ? ` · 이 지역은 ${rm}월에 평소의 ${idx.toFixed(2)}배` : ''}`,
      near: {
        관광지: nSpot.map(({ o, d }) => `${o.title} ${d.toFixed(1)}km`),
        맛집: nFood.map(({ o, d }) => `${o.title} ${d.toFixed(1)}km${o.kind ? ' ' + o.kind : ''}${o.open ? ` 영업 ${o.open}` : ''}${o.rest ? ` 휴무 ${o.rest}` : ''}`),
        카페: nCafe.map(({ o, d }) => `${o.title} ${d.toFixed(1)}km${o.open ? ` 영업 ${o.open}` : ''}`),
        걷기길: nWalk.map(({ o, d }) => `${o.t} ${d.toFixed(1)}km${o.km ? ` 길이 ${o.km}km` : ''}${o.min ? ` 약 ${Math.round(o.min / 60 * 10) / 10}시간` : ''}${o.lv ? ` 난이도 ${o.lv}` : ''}`),
        숙소: nStay.map(({ o, d }) => `${o.title} ${d.toFixed(1)}km${o.kind ? ' ' + o.kind : ''}`),
        무장애: nAcc.map(({ o, d }) => `${o.title} ${d.toFixed(1)}km`),
        오일장: mktHere.map(m => `${m.name} ${m.days} 개시`),
        같은지역축제: cand.filter(o => o !== f && o.sido === f.sido).slice(0, 6).map(o => `${o.title} ${String(o.start).slice(4, 6)}월`)
      }
    }, ['축제 말고 근처에 뭐가 더 있나요?', '비 오면 어디로 갈까요?', '걷기 좋은 곳부터 보고 싶어요', '아이랑 가도 괜찮을까요?']) : ''}

${festBuyBox ? festBuyBox(f.title) : (buyBox ? buyBox('festival') : '')}

<h2 class="sec">자주 묻는 것</h2>
${faq.map(([q, a]) => `<p><b>${esc(q)}</b><br>${esc(a)}</p>`).join('')}

${mapBlock({ x: f.x, y: f.y, title: f.title, lang: 'ko' })}

<h2 class="sec">같이 보면 좋은 축제</h2>
<div class="frel">
${cand.filter(o => o !== f && o.sido === f.sido).slice(0, 4).map(o => `<a href="/festival/${o._slug}/">${esc(o.title)}</a>`).join('')}
${cand.filter(o => o !== f && o.sido !== f.sido && String(o.start).slice(4, 6) === String(f.start).slice(4, 6)).slice(0, 3).map(o => `<a href="/festival/${o._slug}/">${esc(o.title)}</a>`).join('')}
</div>

${/* 🏛 2026-09-04 신설 — «자연스러운» 인바운드 접점.
      장남 님: 「광고·협업 문의가 들어왔으면 좋겠다」. 그런데 지금은 받을 자리가 없었다.
      ⭐ 우리는 이미 축제 페이지를 수백 장 갖고 있다 — **그 축제 담당자가 자기 축제를 검색하면
        우리 페이지가 나온다.** 거기에 접점을 놓는 게 가장 자연스러운 인바운드다.
      ⚠️ 일반 방문자에게는 «소음»이 되면 안 된다 → 출처 안내 옆, 작은 글씨, 맨 아래.
         관계자는 끝까지 읽고 일반 방문자는 그냥 지나친다. 광고가 아니라 «정정 창구»의 얼굴을 한다.
      ⚠️ 「정보 정정·공식 자료 반영은 무료」를 먼저 말한다 — 돈 얘기부터 꺼내면 아무도 안 쓴다. */''}
<div class="forg">
<b>🏛 ${esc(f.title)} 관계자시라면</b>
<p>일정·장소·요금이 실제와 다르거나, 공식 사진·홈페이지·예매 링크를 넣고 싶으시면 알려주세요.
<b>정보 정정과 공식 자료 반영은 무료</b>입니다 — 저희도 정확한 편이 낫습니다.
홍보 협업은 <a href="/advertise/">매체 소개</a>를 참고해 주세요.</p>
<a class="forg-mail" href="mailto:goohw593@gmail.com?subject=${encodeURIComponent('[축제모아] ' + f.title + ' 정보 관련')}">이 축제 정보 알려주기 →</a>
</div>

<p class="note" style="margin-top:18px">데이터 출처: 한국관광공사 TourAPI(축제·관광지·음식점·카페·숙박·무장애) · 전국길관광정보 표준데이터(걷기길) · 한국관광공사 「한국관광 데이터랩」(시·군·구 방문자 수) · 국가유산청. 일정·영업시간은 변경될 수 있으니 방문 전 확인하세요.</p>
${mapScript('ko')}
</div></main>`;

    const evLd = {
      '@context': 'https://schema.org', '@type': 'Event', name: f.title,
      startDate: `${f.start.slice(0, 4)}-${f.start.slice(4, 6)}-${f.start.slice(6, 8)}`,
      endDate: `${f.end.slice(0, 4)}-${f.end.slice(4, 6)}-${f.end.slice(6, 8)}`,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      description: proseLead(f.ov, 300),
      image: f.img ? [String(f.img).replace(/^http:/, 'https:')] : undefined,
      url: `${SITE}/festival/${f._slug}/`,
      location: {
        '@type': 'Place', name: f.title,
        address: { '@type': 'PostalAddress', streetAddress: f.addr, addressRegion: f.sido, addressLocality: sg || undefined, addressCountry: 'KR' },
        geo: { '@type': 'GeoCoordinates', latitude: y, longitude: x },
        // 문의 전화는 «주최자»가 아니라 «장소»에 붙는 게 맞다. Place 는 telephone 을 지원한다.
        telephone: f.tel || undefined
      },
      // ⚠️ 2026-08-11 구글 경고: "'url' 입력란이 누락되었습니다.(경로: 'organizer')" 151건.
      //    organizer 를 넣으면서 url 을 안 줬던 것. 게다가 organizer.name 에 «축제 이름»을 넣고 있었는데
      //    그건 주최자 이름이 아니다 — TourAPI 는 주최자를 안 준다.
      //    → **주최 측 공식 홈페이지가 있을 때만** organizer 를 쓴다(913개 중 290개). 없으면 아예 안 쓴다.
      //      모르는 걸 채워 넣는 것보다 비워 두는 게 맞다.
      organizer: f.hp && String(f.hp).indexOf('http') === 0
        ? { '@type': 'Organization', name: f.title, url: String(f.hp).trim(), telephone: f.tel || undefined }
        : undefined
    };
    const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
    const jsonld = `<script type="application/ld+json">${JSON.stringify(evLd)}</script>\n<script type="application/ld+json">${JSON.stringify(faqLd)}</script>`;

    const title = `${f.title} — ${fmtDate(String(f.start)).slice(5)} 일정·가는 길·근처 맛집 | ${SITE_NAME}`;
    const desc = `${f.title} ${fmtDate(String(f.start))}~${fmtDate(String(f.end)).slice(5)}. ${f.addr}. `
      + `근처 맛집 ${nFood.length}곳(영업시간 포함)·카페 ${nCafe.length}곳·걷기길 ${nWalk.length}개와 하루 코스까지 한 페이지에.`
      + (idx ? ` ${sg}는 ${rm}월에 평소의 ${idx.toFixed(2)}배 붐빕니다.` : '');

    // ⚠️ 끝난 축제는 noindex(follow) — 색인에서만 뺀다. 링크·헤더검색·내부 이동은 그대로 살린다.
    writePage('festival/' + f._slug, layout(title.slice(0, 95), desc.slice(0, 300), `/festival/${f._slug}/`, content, { jsonld, noindex: ended }));
    urls.push(`/festival/${f._slug}/`);
    if (ended) noindexUrls.push(`/festival/${f._slug}/`);
    index.push({ slug: f._slug, title: f.title, sido: f.sido, sigungu: sg, start: f.start, end: f.end, img: f.img, id: f.id });
  });

  fs.writeFileSync(path.join(ROOT, 'data', 'festival_pages.json'), JSON.stringify(index));

  // ── 유령 페이지 청소 (2026-08-18)
  // ⚠️ 빌드는 페이지를 «쓰기»만 하고 지우지 않아서, 축제가 TourAPI에서 빠지면 옛 HTML이 디스크에 남는다.
  //    그 페이지는 사이트맵에도 없고 어디서도 링크되지 않는데 구글에는 색인돼 있고, 영영 갱신되지 않는다.
  //    = 딱 「가치가 별로 없는 콘텐츠」로 셀 만한 고아 페이지. 매 빌드마다 정리한다.
  {
    const liveSlugs = new Set(index.map(r => r.slug));
    let gone = 0;
    try {
      fs.readdirSync(path.join(ROOT, 'festival'), { withFileTypes: true })
        .filter(d => d.isDirectory() && !liveSlugs.has(d.name))
        .forEach(d => {
          fs.rmSync(path.join(ROOT, 'festival', d.name), { recursive: true, force: true });
          gone++;
        });
    } catch (e) {}
    if (gone) console.log('  └ 더 이상 생성되지 않는 축제 페이지', gone, '개 삭제(고아 방지)');
  }

  // 축제명 → 슬러그 맵. 모달이 "이 축제 상세 페이지가 있나?"를 물어볼 때 쓴다.
  // ⚠️ 페이지마다 심으면 7KB씩 무거워지므로 별도 파일로 두고 모달 열 때 1회만 받아간다.
  const slugMap = {};
  index.forEach(r => { slugMap[r.title] = r.slug; });
  try { fs.mkdirSync(path.join(ROOT, 'festival'), { recursive: true }); } catch (e) {}
  fs.writeFileSync(path.join(ROOT, 'festival', 'map.json'), JSON.stringify(slugMap));

  // ── 허브 /festival/
  // ⚠️ 2026-08-10 발견: 상세 페이지 140개를 만들어 놓고 **목록 페이지를 안 만들었다.**
  //    그래서 홈에서 이 140개로 가는 링크가 0개였고("월별 축제"를 거쳐야만 도달), 장남 님이 "랜딩페이지 어디 있냐"고 물으신 것.
  //    사람이 찾을 수 없는 페이지는 만든 게 아니다.
  {
    const t0 = TODAY.replace(/-/g, '');
    const withState = index.map(r => {
      const ended = String(r.end) < t0, on = !ended && String(r.start) <= t0;
      const a = new Date(+String(r.start).slice(0, 4), +String(r.start).slice(4, 6) - 1, +String(r.start).slice(6, 8));
      const b = new Date(+TODAY.slice(0, 4), +TODAY.slice(5, 7) - 1, +TODAY.slice(8, 10));
      return Object.assign({}, r, { ended, on, dday: Math.round((a - b) / 86400e3) });
    });
    const live = withState.filter(r => r.on);
    const soon = withState.filter(r => !r.on && !r.ended).sort((a, b) => a.dday - b.dday);
    const feat = live.concat(soon).slice(0, 24);

    const card = r => `<a class="card" href="/festival/${r.slug}/">
<div class="thumb"><span class="dday ${r.on ? 'on' : ''}">${r.on ? '진행 중' : (r.dday === 0 ? '오늘 개막' : 'D-' + r.dday)}</span>
<img src="${esc(r.img)}" alt="${esc(r.title)}" loading="lazy"></div>
<div class="card-body"><h3>${esc(r.title)}</h3>
<div class="date">${fmtDate(String(r.start))} ~ ${fmtDate(String(r.end)).slice(5)}</div>
<div class="loc">📍 ${esc(r.sido)}${r.sigungu ? ' ' + esc(r.sigungu) : ''}</div></div></a>`;

    const bySido = {};
    withState.forEach(r => (bySido[r.sido] = bySido[r.sido] || []).push(r));
    const sidoOrder = Object.keys(bySido).sort((a, b) => bySido[b].length - bySido[a].length);
    const sidoBlock = sidoOrder.map(s => `<details><summary><b>${esc(s)}</b> <span>${bySido[s].length}곳</span></summary>
<ul class="flist">${bySido[s].sort((a, b) => String(a.start).localeCompare(String(b.start)))
      .map(r => `<li><a href="/festival/${r.slug}/">${esc(r.title)}</a> <span class="note">${esc(r.sigungu || '')} · ${fmtDate(String(r.start)).slice(5)}${r.ended ? ' (종료)' : ''}</span></li>`).join('')}</ul></details>`).join('');

    const mon = {};
    withState.forEach(r => { const m = +String(r.start).slice(4, 6); (mon[m] = mon[m] || []).push(r); });
    const monLine = Object.keys(mon).sort((a, b) => a - b)
      .map(m => `<b>${m}월</b> ${mon[m].length}곳`).join(' · ');

    const hub = `<main><div class="wrap">
<h1>축제 상세 페이지 ${index.length}곳</h1>
<p class="lead">일정만 적어 놓은 목록이 아닙니다. ${index.length}곳 각각에 <b>그 동네가 얼마나 붐비는지</b>, 걸어서 갈 수 있는 <b>맛집과 카페의 영업시간·휴무일</b>,
근처 <b>걷기길의 거리와 소요시간</b>, 그리고 <b>그 축제를 중심으로 짠 하루 코스</b>까지 한 페이지에 넣었습니다.
저희가 모은 축제 ${(fes || []).length.toLocaleString()}건 중 개요가 ${MIN_OV}자 넘고, 사진이 있고, 근처에 볼거리가 ${MIN_NEAR}곳 이상인 것만 골랐습니다.
나머지는 페이지를 만들어도 읽을 게 없어서 만들지 않았습니다.</p>

<h2 class="sec">지금 열리거나 곧 열리는 축제</h2>
<p>진행 중 <b>${live.length}곳</b> · 개막 대기 <b>${soon.length}곳</b>. 가까운 순으로 24곳을 먼저 보여드립니다.</p>
<div class="grid">${feat.map(card).join('')}</div>

<h2 class="sec">지역으로 찾기</h2>
<p>시·도를 누르면 그 지역 축제가 펼쳐집니다. 가장 많은 곳은 <b>${sidoOrder[0]}</b>(${bySido[sidoOrder[0]].length}곳)입니다.</p>
<div class="fnum">${sidoBlock}</div>

<h2 class="sec">달별로는 이렇게 흩어져 있습니다</h2>
<p>${monLine}</p>
<p class="note">개막일 기준입니다. 상설 전시나 연중 행사는 시작 월에 잡혀 있어 실제 관람 가능 기간과 다를 수 있습니다.</p>

<h2 class="sec">코스로 이어서 보기</h2>
<p>축제 하나만 보고 오기 아까울 때는 <a href="/course/">추천 코스</a>에서 지역·테마별로 짜 둔 일정을 보시거나,
날짜와 조건을 넣어 <b>직접 코스를 만들어</b> 보실 수 있습니다. 축제 상세 페이지 안에도 그 축제 기준 하루 코스가 들어 있습니다.</p>

<h2 class="sec">이 목록이 못 하는 것</h2>
<p>축제 정보는 한국관광공사 API를 따르기 때문에, <b>주최 측이 아직 등록하지 않은 축제는 여기 없습니다.</b>
매년 열리는 큰 축제인데 안 보인다면 대부분 그 이유입니다. 붐빔 배수도 축제장 앞이 아니라 <b>그 시·군·구 전체</b> 방문자 기준이라
실제 현장 혼잡과는 다를 수 있습니다.</p>
</div></main>`;

    writePage('festival', layout(
      `축제 상세 ${index.length}곳 — 일정·근처 맛집·걷기길·하루 코스 | ${SITE_NAME}`,
      `전국 축제 ${index.length}곳의 상세 페이지. 일정과 장소는 물론 그 동네 붐빔 정도, 근처 맛집·카페 영업시간, 걷기길 거리, 축제 중심 하루 코스까지 한 페이지에 정리했습니다.`,
      '/festival/', hub, {}));
    urls.push('/festival/');
  }

  console.log('✓ /festival/ —', urls.length, '페이지 (허브 1 + 상세', index.length, '· 개요', MIN_OV, '자↑·사진·근처', MIN_NEAR, '곳↑·', FROM_YEAR, '년~)');
  console.log(`   🌤 날씨 블록 ${wxCount}개 (예보 창 안에 있는 축제만 — 창 밖은 표시하지 않는다)`);
  console.log('  └ 끝난 축제', noindexUrls.length, '개는 noindex + 사이트맵 제외 · 색인 대상 상세', index.length - noindexUrls.length, '개');
  // 배열에 얹어 보낸다 — 호출부(build.js)가 `...FESTIVAL_URLS` 로 펼쳐 쓰고 있어 반환 타입은 바꾸지 않는다.
  urls.noindex = noindexUrls;
  return urls;
}

module.exports = { build };
