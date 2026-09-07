// 🏙 도시 페이지 «공통 뼈대» — 2026-09-07 신설
//
// 왜 만들었나
//   서울·부산·제주·경주를 각각 따로 쓰다 보니 4개 도시에 149KB 가 됐다.
//   카드 모양·CSS·출처 문구·게이트가 파일마다 복사돼 있어서, 한 곳을 고치면 나머지를 잊는다.
//   도시를 10개 더 만들기로 한 이상 여기서 뼈대를 뽑는 게 가장 싸다.
//
// 무엇을 공유하고 무엇을 도시에 남기나
//   ✅ 공유 — 카드·CSS·게이트·날씨·출처 표기·빵부스러기·외국어 링크·「숫자로 본」 블록
//   ✅ 도시 — «축»(어떤 검색어를 어떤 데이터로 답할 것인가) · 특색 블록(`custom`) · 안 만들 것(`skip`)
//   ⚠️ 도시마다 축이 다른 게 핵심이다. 서울은 전시회, 부산·경주는 장소·맛집, 제주는 동/서였다.
//      공통 템플릿으로 통일하면 특색이 죽는다 — 그래서 `custom` 슬롯을 구조 안에 뒀다.
//
// ⚠️ 이 파일은 서울·부산·제주를 «건드리지 않는다». 그 셋은 각자 전용 데이터(서울 문화행사·부산 5개어
//    공식번역·제주허브)가 있어 구조가 다르다. 여기 얹는 건 «전국 공통 재료로 만드는 도시»들이다.
const fs = require('fs'), path = require('path');

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MN = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const d8 = s => /^\d{8}$/.test(String(s || ''));
const fmt = s => d8(s) ? `${+s.slice(4, 6)}월 ${+s.slice(6, 8)}일` : '';
const wd = s => d8(s) ? WD[new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)).getDay()] : '';
const range = (a, b) => (!d8(a)) ? '' : (a === b || !d8(b) ? `${fmt(a)}(${wd(a)})` : `${fmt(a)}(${wd(a)}) ~ ${fmt(b)}(${wd(b)})`);
const norm = s => String(s || '').replace(/[\s()（）·・\-–—_,.'"]/g, '').toLowerCase();
const pct = (n, d) => d ? Math.round(n / d * 100) : 0;

// ⚠️ 파일마다 최상위 모양이 다르다(배열 · {rows} · {items}) — 쓰기 전에 정규화한다.
function load(ROOT, f) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));
    return Array.isArray(d) ? d : (d.rows || d.items || []);
  } catch (e) { return []; }
}

// 🔴 도시 판정 — 여기서 두 번 데였다.
//   ① 이름 매칭은 다른 지역을 삼킨다(제주에서 `본가제주밥상`(경기)을 먹었다).
//   ② 주소 첫 토큰 파싱도 안 된다 — `accessible.json` 만 전남을 「전남」·광주를 「광주」로 쓰고
//      나머지 시·도는 정식명칭을 쓴다(「전남광주」라는 값도 1건 있다). 파일마다 결과가 달라진다.
//   ⭐ 그래서 «정규화된 `sido` 필드»로 시·도를 가르고, 시·군은 주소 토큰에서 뽑는다.
//   ⭐ 광역시는 «시 전체»가 한 도시다 — 검색어가 「대구가볼만한곳」이지 「대구중구가볼만한곳」이 아니다.
const METRO = new Set(['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종']);
function makeMatcher(cfg) {
  if (METRO.has(cfg.sido)) return r => String(r.sido || '') === cfg.sido;
  const re = new RegExp(cfg.sgg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return r => String(r.sido || '') === cfg.sido && re.test(String(r.addr || ''));
}

const CSS = `<style>
.cy-h1{font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:8px 0 6px}
.cy-lead{color:#374151;font-size:1rem;line-height:1.8;margin:0 0 12px}
.cy-nav{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 18px}
.cy-nav a,.cy-nav span{display:inline-block;padding:9px 15px;border-radius:22px;font-weight:800;font-size:.92rem;text-decoration:none}
.cy-nav a{background:#fff;border:1.5px solid #e2e6ea;color:#3b4450}
.cy-nav span{background:var(--cy);color:#fff}
.cy-stat{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0 6px}
.cy-stat div{background:var(--cy-bg);border:1.5px solid var(--cy-bd);border-radius:12px;padding:10px 16px;font-size:.86rem;color:var(--cy-tx);font-weight:700}
.cy-stat b{display:block;font-size:1.25rem;color:var(--cy-tx)}
.cy-grid{display:grid;gap:13px;grid-template-columns:repeat(auto-fill,minmax(262px,1fr))}
.cy-card{background:#fff;border:1px solid #e8ebee;border-radius:14px;overflow:hidden}
.cy-img{width:100%;height:150px;object-fit:cover}
.cy-body{padding:12px 14px}
.cy-body h3{font-size:1rem;font-weight:800;margin:0 0 5px;line-height:1.45;color:#111827}
.cy-meta{font-size:.86rem;color:#6b7280;margin:0 0 4px;line-height:1.6}
.cy-desc{font-size:.88rem;color:#374151;line-height:1.7;margin:6px 0}
.cy-key{font-size:.86rem;color:#374151;background:var(--cy-bg);border-radius:8px;padding:8px 10px;margin:6px 0;line-height:1.7}
.cy-tag{display:inline-block;background:var(--cy-bd);color:var(--cy-tx);font-size:.78rem;font-weight:800;border-radius:6px;padding:2px 8px;margin-right:4px}
.cy-note{color:#9aa3af;font-size:.82rem;line-height:1.7;margin-top:16px}
.cy-line{color:#6b7280;font-size:.93rem;line-height:1.9;margin:6px 0 0}
.cy-photos{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));margin:10px 0 4px}
.cy-photos figure{margin:0;background:#fff;border:1px solid #e8ebee;border-radius:14px;overflow:hidden}
.cy-photos img{width:100%;height:210px;object-fit:cover;display:block}
.cy-photos figcaption{padding:9px 12px;font-size:.86rem;color:#374151;line-height:1.55}
.cy-photos figcaption span{display:block;color:#9aa3af;font-size:.79rem;margin-top:2px}
</style>`;

// 축 정의 — 「어떤 검색어를 어떤 데이터로 답하는가」. 도시 파일은 이 중에서 고르기만 한다.
const AXES = {
  // 📍 가볼만한 곳 — ⚠️ `spots_ko` 에는 개요가 «한 건도» 없다(부산·경주에서 확인).
  //    설명이 있는 건 `accessible.json`(무장애여행 정보)뿐이라 이걸 쓴다. 덤으로 휠체어·유모차 정보가 붙는다.
  spot: {
    file: 'accessible.json', label: '📍 가볼만한 곳', emoji: '📍', min: 30, show: 80,
    filter: r => ['관광지', '문화시설', '레포츠'].includes(r.cat) && String(r.ov || '').length >= 120 && +r.x && +r.y,
    src: `데이터 출처: 한국관광공사 <b>무장애여행 정보</b>(장소·설명) · 행정안전부 전국관광지정보표준데이터(주차·수용 인원) · Open-Meteo(날씨).
⚠️ <b>「무장애여행 정보에 등록된 곳」이라는 뜻이지, 모든 시설이 완전히 무장애라는 뜻은 아닙니다.</b>
경사·출입구·화장실 같은 실제 접근성은 방문 전 각 시설에 확인하세요.`
  },
  // 🍽 맛집 — ⚠️ 개요 0건. 대신 영업시간·휴무일·대표메뉴·주차가 있다.
  //    ⭐「○○맛집」으로 검색하는 사람이 원하는 건 설명문이 아니라 «쉬는 날»이다.
  food: {
    file: 'restaurants_ko.json', label: '🍽 맛집', emoji: '🍽', min: 30, show: 90,
    filter: r => +r.x && +r.y,
    src: `데이터 출처: 한국관광공사 TourAPI. <b>영업시간·휴무일·대표메뉴·주차는 업소가 등록한 시점의 값</b>이라 현장과 다를 수 있습니다 —
가시기 전에 전화로 확인하세요. <b>등록돼 있지 않은 항목은 비워 뒀습니다</b>(추측해서 채우지 않습니다). 맛 평가는 하지 않습니다.`
  },
  // 🛏 숙소 — 가격은 공개 데이터에 없다. 체크인/아웃·객실수·주차·종류(한옥 등)를 준다.
  stay: {
    // ⚠️ 게이트 60. 처음엔 30으로 뒀는데 **실측하니 40곳으로도 1,500자밖에 안 나왔다**
    //    (숙소 카드엔 설명이 없고 체크인·객실수뿐이라 짧다). 애드센스 얇은 페이지 기준은 2,000자다.
    //    ⭐ 게이트 숫자는 「몇 건이면 충분한가」가 아니라 **「몇 건이면 2,000자가 되는가」**로 정해야 한다.
    file: 'stays_ko.json', label: '🛏 숙소', emoji: '🛏', min: 60, show: 90,
    filter: r => +r.x && +r.y,
    src: `데이터 출처: 한국관광공사 TourAPI. <b>가격은 싣지 않습니다</b> — 공개 데이터에 없고 날짜마다 달라지는 값을 적어 두면 그게 틀린 정보가 됩니다.
체크인·체크아웃 시간과 객실 수는 등록 시점 값입니다.`
  },
  // 🐾 반려견 동반 — 전 구역/일부 구역 구분이 데이터에 있다.
  pet: {
    // ⚠️ 게이트 50 — 같은 이유(경주 36곳 = 1,874자 · 속초 32곳 = 1,307자로 둘 다 미달이었다).
    file: 'pets.json', label: '🐾 반려견 동반', emoji: '🐾', min: 50, show: 80,
    filter: r => +r.x && +r.y,
    src: `데이터 출처: 한국관광공사 반려동물 동반 여행지 정보. <b>동반 가능 범위(전 구역·일부 구역)는 등록된 값 그대로</b>이며,
목줄·케이지 규정은 시설마다 다릅니다. 방문 전 확인하세요.`
  }
};

function build(cfg, ctx) {
  const { ROOT, layout, writePage, SITE_NAME, TODAY, WX } = ctx;
  const T8 = String(TODAY).replace(/-/g, '');
  const mn = +T8.slice(4, 6);
  const urls = [];
  const base = '/' + cfg.key + '/';
  const is = makeMatcher(cfg);
  const KO = cfg.ko;

  // ── 재료
  const D = {};
  for (const k of Object.keys(AXES)) D[k] = load(ROOT, AXES[k].file).filter(is).filter(AXES[k].filter);
  const spotsKo = load(ROOT, 'spots_ko.json').filter(is);          // 사진 보충용(개요는 없다)
  const trr = load(ROOT, 'trrsrt.json').filter(r => String(r.sido || '') === cfg.sido
    && (METRO.has(cfg.sido) || new RegExp(cfg.sgg).test(String(r.addr || ''))));
  const fes = load(ROOT, 'festival_pages.json')
    .filter(f => String(f.sido || '') === cfg.sido
      && (METRO.has(cfg.sido) || String(f.sigungu || '') === cfg.sgg)
      && d8(String(f.end)) && String(f.end) >= T8)
    .sort((a, b) => String(a.start).localeCompare(String(b.start)));

  // 사진·주차 정보를 이름으로 이어 붙인다
  const imgIdx = new Map();
  spotsKo.forEach(r => { const k = norm(r.title); if (k && r.img && !imgIdx.has(k)) imgIdx.set(k, r.img); });
  const trrIdx = new Map();
  trr.forEach(r => { const k = norm(r.title || r.name); if (k && !trrIdx.has(k)) trrIdx.set(k, r); });
  const petSet = new Set(D.pet.map(r => norm(r.title)));
  D.spot = D.spot.map(r => ({ ...r, img: r.img || imgIdx.get(norm(r.title)) || '', t: trrIdx.get(norm(r.title)) || null, pet: petSet.has(norm(r.title)) }))
    .sort((a, b) => (b.img ? 1 : 0) - (a.img ? 1 : 0));
  D.food.sort((a, b) => (b.img ? 1 : 0) - (a.img ? 1 : 0) || ((b.open ? 1 : 0) - (a.open ? 1 : 0)));
  D.stay.sort((a, b) => (b.img ? 1 : 0) - (a.img ? 1 : 0) || ((b.rooms ? 1 : 0) - (a.rooms ? 1 : 0)));
  D.pet.sort((a, b) => (b.img ? 1 : 0) - (a.img ? 1 : 0));

  // ── 게이트: 축마다 재고가 모자라면 «그 축은 만들지 않는다»
  const open = cfg.axes.filter(a => D[a.slug] && D[a.slug].length >= (a.min || AXES[a.slug].min));
  const openSet = new Set(open.map(a => a.slug));

  // 🗑 정리 — ⚠️ **정적 생성기는 「없어진 항목의 폴더」를 안 지운다.**
  //    게이트를 올렸더니 통과 못 한 축(여수 숙소 등)의 옛 폴더가 그대로 남아 라이브 200을 반환했다.
  //    사이트맵엔 없으니 눈에 안 띈다 — 그래서 «만드는 곳에서 지우는 것까지» 같이 한다.
  {
    const dir = path.join(ROOT, cfg.key);
    if (fs.existsSync(dir)) for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
      if (d.isDirectory() && !openSet.has(d.name)) {
        fs.rmSync(path.join(dir, d.name), { recursive: true, force: true });
        console.log(`   🗑 ${base}${d.name}/ 삭제 — 게이트 미달로 더는 만들지 않는 축입니다`);
      }
    }
  }

  const nav = cur => `<div class="cy-nav">${[[`${cfg.emoji} ${KO} 전체`, '']]
    .concat(open.map(a => [AXES[a.slug].label, a.slug]))
    .map(([label, k]) => cur === k ? `<span>${esc(label)}</span>` : `<a href="${base}${k ? k + '/' : ''}">${esc(label)}</a>`).join('')}</div>`;

  const kindLine = (list, label) => {
    const c = {};
    list.forEach(r => { const g = r.kind || r.cat || '기타'; if (g !== '기타') c[g] = (c[g] || 0) + 1; });
    const top = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 12);
    return top.length ? `<p class="cy-line">${label}: ${top.map(([k, n]) => `${esc(k)} <b>${n}</b>`).join(' · ')}</p>` : '';
  };
  const note = s => `<p class="cy-note">${s}</p>`;
  const wxOf = r => (WX && r.x && r.y) ? WX.now(r.x, r.y) : '';
  const shortAddr = r => esc(String(r.addr || '').replace(/^\S+\s+\S+\s+/, '').slice(0, 34));
  const img = r => r.img ? `<img class="cy-img" src="${esc(String(r.img).replace(/^http:/, 'https:'))}" alt="${esc(r.title)}" loading="lazy" onerror="this.remove()">` : '';

  // ── 카드
  const CARD = {
    spot: p => `<div class="cy-card">${img(p)}<div class="cy-body"><h3>${esc(p.title)}</h3>
<p class="cy-meta">📍 ${esc(KO)}${p.cat ? ` · ${esc(p.cat)}` : ''}${wxOf(p)}</p>
${p.t && (p.t.park || p.t.cap) ? `<p class="cy-meta">${p.t.park ? `🅿️ 주차 ${esc(String(p.t.park))}대 ` : ''}${p.t.cap ? `· 수용 ${esc(String(p.t.cap))}명` : ''}</p>` : ''}
<p class="cy-desc">${esc(String(p.ov).slice(0, 190))}…</p>
<p class="cy-meta"><span class="cy-tag">♿ 무장애여행 등록</span>${p.pet ? '<span class="cy-tag">🐾 반려견 동반</span>' : ''}</p>
</div></div>`,
    food: r => {
      const b = [];
      if (r.open) b.push(`🕘 ${esc(String(r.open).slice(0, 46))}`);
      if (r.rest) b.push(`🚫 ${esc(String(r.rest).slice(0, 26))}`);
      if (r.menu) b.push(`🍽 ${esc(String(r.menu).slice(0, 40))}`);
      if (r.park) b.push(`🅿️ 주차 ${esc(String(r.park).slice(0, 18))}`);
      return `<div class="cy-card">${img(r)}<div class="cy-body"><h3>${esc(r.title)}</h3>
<p class="cy-meta">${r.kind ? `<span class="cy-tag">${esc(r.kind)}</span>` : ''}${shortAddr(r)}${wxOf(r)}</p>
${b.length ? `<div class="cy-key">${b.join('<br>')}</div>` : ''}</div></div>`;
    },
    stay: r => {
      const b = [];
      if (r.ci || r.co) b.push(`🕒 체크인 ${esc(r.ci || '-')} · 체크아웃 ${esc(r.co || '-')}`);
      if (r.rooms) b.push(`🚪 객실 ${esc(String(r.rooms))}실`);
      if (r.park) b.push(`🅿️ 주차 ${esc(String(r.park).slice(0, 18))}`);
      return `<div class="cy-card">${img(r)}<div class="cy-body"><h3>${esc(r.title)}</h3>
<p class="cy-meta">${r.kind ? `<span class="cy-tag">${esc(r.kind)}</span>` : ''}${shortAddr(r)}</p>
${b.length ? `<div class="cy-key">${b.join('<br>')}</div>` : ''}</div></div>`;
    },
    pet: r => `<div class="cy-card">${img(r)}<div class="cy-body"><h3>${esc(r.title)}</h3>
<p class="cy-meta">${r.cat ? `<span class="cy-tag">${esc(r.cat)}</span>` : ''}${shortAddr(r)}${wxOf(r)}</p>
${r.psbl ? `<div class="cy-key">🐾 동반 가능 범위: ${esc(String(r.psbl).slice(0, 60))}</div>` : ''}
${r.tel ? `<p class="cy-meta">☎️ ${esc(r.tel)}</p>` : ''}</div></div>`
  };

  const fesCard = f => `<div class="cy-card">
${f.img ? `<img class="cy-img" src="${esc(String(f.img).replace(/^http:/, 'https:'))}" alt="${esc(f.title)}" loading="lazy" onerror="this.remove()">` : ''}
<div class="cy-body"><h3><a href="/festival/${esc(f.slug)}/" style="color:#111827;text-decoration:none">${esc(f.title)}</a></h3>
<p class="cy-meta">📅 ${esc(range(String(f.start), String(f.end)))}</p>
<p class="cy-meta"><a href="/festival/${esc(f.slug)}/" style="color:var(--cy);font-weight:800">자세히 보기 →</a></p>
</div></div>`;

  // ⭐ 「숫자로 본 …」 — 카드에 설명이 없는 축(맛집·숙소)은 그대로 두면 얇아진다.
  //    지어내서 채우지 않고 «가진 값을 세어서» 말한다. 경주 첫 빌드에서 숙소가 2,693자였던 걸 이렇게 메웠다.
  const hourOpen = s => { const m = String(s || '').match(/(\d{1,2})\s*:\s*(\d{2})\s*[~-]/); return m ? +m[1] : null; };
  const hourClose = s => { const m = String(s || '').match(/[~-]\s*(\d{1,2})\s*:\s*(\d{2})/); return m ? +m[1] : null; };
  const cnt = (l, f) => l.filter(f).length;
  const FACTS = {
    food: l => {
      const n = l.length, noRest = cnt(l, r => /무휴/.test(String(r.rest || '')));
      const sun = cnt(l, r => /일요일/.test(String(r.rest || ''))), mon = cnt(l, r => /월요일/.test(String(r.rest || '')));
      const late = cnt(l, r => { const h = hourClose(r.open); return h !== null && (h >= 21 || h <= 3); });
      const early = cnt(l, r => { const h = hourOpen(r.open); return h !== null && h <= 8; });
      const park = cnt(l, r => /가능/.test(String(r.park || ''))), noPark = cnt(l, r => /불가|없음/.test(String(r.park || '')));
      const kinds = {}; l.forEach(r => { if (r.kind) kinds[r.kind] = (kinds[r.kind] || 0) + 1; });
      const top = Object.entries(kinds).sort((a, b) => b[1] - a[1])[0];
      return `<div class="cy-key" style="padding:14px 16px;margin:0 0 16px">
<b style="font-size:1.02rem">숫자로 본 ${esc(KO)} 맛집 ${n}곳</b><br>
${top ? `· 가장 많은 종류는 <b>${esc(top[0])} ${top[1]}곳(${pct(top[1], n)}%)</b>입니다.<br>` : ''}
· <b>연중무휴로 등록된 곳이 ${noRest}곳</b>입니다. 나머지는 쉬는 날이 있습니다 — 일요일 휴무 ${sun}곳, 월요일 휴무 ${mon}곳.<br>
· <b>밤 9시 이후까지 여는 곳 ${late}곳</b> · <b>아침 8시 전에 여는 곳 ${early}곳</b>. 늦게 도착하는 일정이면 앞의 ${late}곳 안에서 고르는 편이 안전합니다.<br>
· <b>주차 가능 ${park}곳</b>${noPark ? ` · 주차 불가로 명시된 곳 ${noPark}곳` : ''}.<br>
⚠️ 여기 숫자는 <b>업소가 공공데이터에 등록한 값</b>을 센 것입니다. 등록하지 않은 곳은 어느 쪽으로도 세지 않았습니다.</div>`;
    },
    stay: l => {
      const n = l.length;
      const kinds = {}; l.forEach(r => { if (r.kind) kinds[r.kind] = (kinds[r.kind] || 0) + 1; });
      const top = Object.entries(kinds).sort((a, b) => b[1] - a[1])[0];
      const ci15 = cnt(l, r => /^15/.test(String(r.ci || ''))), co11 = cnt(l, r => /^11/.test(String(r.co || '')));
      const park = cnt(l, r => /가능/.test(String(r.park || '')));
      const roomsN = cnt(l, r => +r.rooms > 0), small = cnt(l, r => +r.rooms > 0 && +r.rooms <= 5), big = cnt(l, r => +r.rooms >= 20);
      return `<div class="cy-key" style="padding:14px 16px;margin:0 0 16px">
<b style="font-size:1.02rem">숫자로 본 ${esc(KO)} 숙소 ${n}곳</b><br>
${top ? `· 가장 많은 종류는 <b>${esc(top[0])} ${top[1]}곳(${pct(top[1], n)}%)</b>입니다.<br>` : ''}
${roomsN ? `· 객실 수가 등록된 ${roomsN}곳 중 <b>5실 이하 ${small}곳 · 20실 이상 ${big}곳</b>. 작은 곳이 많으면 <b>주말·연휴에 금방 찹니다.</b><br>` : ''}
· <b>체크인 15시 ${ci15}곳 · 체크아웃 11시 ${co11}곳</b>이 가장 흔합니다.<br>
· <b>주차 가능으로 등록된 곳 ${park}곳</b>.<br>
⚠️ <b>가격은 싣지 않습니다.</b> 공개 데이터에 없고, 날짜마다 달라지는 값을 적어 두면 그게 틀린 정보가 됩니다.</div>`;
    }
  };

  // 📷 직접 촬영 사진 — 사이트가 다른 데서 가져올 수 없는 유일한 재료다.
  //    ⚠️ 얼굴이 나오는 사진은 싣지 않고, EXIF(GPS)는 변환할 때 지운다.
  //    ⚠️ 파일 이름은 «프레임을 열어 보고» 붙인다(촬영시각 추론으로 붙였다가 10개를 통째로 틀린 적이 있다).
  const photoStrip = () => {
    const P = cfg.photos; if (!P || !P.length) return '';
    return `<h2 class="sec">직접 다녀와서 찍었습니다${cfg.photoWhen ? ` — ${esc(cfg.photoWhen)}` : ''}</h2>
<p class="cy-lead">아래 <b>${P.length}장</b>은 관광공사 사진이 아니라 <b>저희가 직접 찍은 사진</b>입니다.
그날 하늘, 보도블록 상태, 안내판에 실제로 뭐라고 적혀 있는지 — 공식 사진에는 안 나오는 것들입니다.</p>
<div class="cy-photos">${P.map(p => `<figure>
<img src="/img/${p[0]}.webp" alt="${esc(p[2])}" loading="lazy" width="900" onerror="this.closest('figure').remove()">
<figcaption><b>${esc(p[2])}</b><span>${esc(p[1])}</span></figcaption></figure>`).join('')}</div>
${note('직접 촬영 · 얼굴이 나오는 사진은 싣지 않았습니다. 촬영 위치정보(EXIF)는 지웠습니다.')}`;
  };

  const VARS = `<style>:root{--cy:${cfg.color[0]};--cy-bg:${cfg.color[1]};--cy-bd:${cfg.color[2]};--cy-tx:${cfg.color[3]}}</style>`;
  const mk = (slug, title, desc, h1, lead, body) => {
    const content = `<main><div class="wrap">${VARS}${CSS}
${slug ? `<p style="font-size:.85rem;color:#9aa3af;margin:8px 0"><a href="/" style="color:var(--cy)">홈</a> › <a href="${base}" style="color:var(--cy)">${esc(KO)}</a></p>` : ''}
<h1 class="cy-h1">${h1}</h1>
<p class="cy-lead">${lead}</p>
${nav(slug)}
${body}
</div></main>`;
    writePage(cfg.key + (slug ? '/' + slug : ''), layout(title, desc, base + (slug ? slug + '/' : ''), content));
    urls.push(base + (slug ? slug + '/' : ''));
  };

  // ── 축 페이지
  const COPY = {
    spot: (n) => ({
      t: `${KO} 가볼만한 곳 ${MN[mn]} — 관광지 ${n}곳 총정리`,
      d: `${KO} 가볼만한 곳 ${n}곳을 설명·주차·오늘 날씨와 함께 정리했습니다. 한국관광공사 공개 데이터 기준.`,
      h: `📍 ${KO} 가볼만한 곳 ${n}곳`,
      l: `${KO}에서 가볼 만한 곳 <b>${n}곳</b>입니다. 설명이 등록된 <b>관광지·문화시설·레포츠</b>만 골랐고(숙박·쇼핑·음식점은 뺐습니다),
좌표가 있는 곳에는 <b>오늘 날씨</b>가 붙습니다. 한국관광공사 <b>무장애여행 정보</b>에 등록된 곳이라 <b>휠체어·유모차로 갈 만한지</b> 참고가 됩니다.`
    }),
    food: (n) => ({
      t: `${KO} 맛집 ${n}곳 — 영업시간·휴무일·대표메뉴·주차 총정리`,
      d: `${KO} 맛집 ${n}곳의 영업시간·휴무일·대표메뉴·주차 가능 여부를 한 번에. 한국관광공사 공개 데이터 기준.`,
      h: `🍽 ${KO} 맛집 ${n}곳`,
      l: `${KO} 음식점 <b>${n}곳</b>입니다. 맛 평가는 하지 않습니다 — 대신 <b>가기 전에 확인해야 하는 것</b>을 모았습니다.
⚠️ 헛걸음의 대부분은 맛이 아니라 <b>쉬는 날</b> 때문에 생깁니다.`
    }),
    stay: (n) => ({
      t: `${KO} 숙소 ${n}곳 — 종류·체크인 시간·주차 총정리`,
      d: `${KO} 숙소 ${n}곳을 종류별로 정리했습니다. 체크인·체크아웃 시간, 객실 수, 주차 정보까지.`,
      h: `🛏 ${KO} 숙소 ${n}곳`,
      l: `${KO} 숙박시설 <b>${n}곳</b>입니다. 가격은 싣지 않습니다(공개 데이터에 없고 날짜마다 달라집니다).
대신 <b>종류·체크인/체크아웃 시간·객실 수·주차</b>를 실었습니다.`
    }),
    pet: (n) => ({
      t: `${KO} 반려견 동반 여행지 ${n}곳 — 동반 가능 범위 총정리`,
      d: `${KO}에서 반려견과 함께 갈 수 있는 곳 ${n}곳. 전 구역 가능인지 일부만인지까지 등록된 값 그대로.`,
      h: `🐾 ${KO} 반려견 동반 ${n}곳`,
      l: `${KO}에서 반려견과 함께 갈 수 있는 곳 <b>${n}곳</b>입니다.
⭐ <b>「동반 가능」이 다 같은 뜻이 아닙니다</b> — 전 구역인지 일부 구역인지를 등록된 값 그대로 실었습니다.`
    })
  };

  for (const a of open) {
    const list = D[a.slug], n = list.length, C = COPY[a.slug](n), A = AXES[a.slug];
    mk(a.slug, `${C.t} | ${SITE_NAME}`, C.d, C.h, C.l,
      `${a.slug === 'spot' && cfg.photos ? photoStrip() : ''}${FACTS[a.slug] ? FACTS[a.slug](list) : ''}${kindLine(list, a.slug === 'food' ? '음식 종류별' : a.slug === 'stay' ? '종류별' : '분류별')}
<div class="cy-grid">${list.slice(0, A.show).map(CARD[a.slug]).join('')}</div>${note(A.src)}`);
  }

  // ── 외국어 링크는 «실제로 만들어진 언어»만 건다.
  // ⚠️ intl-city.js 에 게이트(장소 20곳)가 있다. 전체 언어를 찍으면 404 내부 링크가 생긴다
  //    (2026-09-04에 `/tw/seoul/` 등으로 끊긴 링크 4건을 만든 적이 있다).
  //    그래서 «같은 판정식»을 여기서 다시 돌려 통과한 언어만 링크한다.
  const LANG_NAME = { en: 'English', ja: '日本語', zh: '简体中文', tw: '繁體中文', es: 'Español' };
  const intlReady = Object.keys(LANG_NAME).filter(lang => load(ROOT, `places_${lang}.json`)
    .filter(r => String(r.sido || '') === cfg.sido && +r.x && +r.y
      && String(r.ov || '').length >= 120 && r.addrKo
      && (METRO.has(cfg.sido) || new RegExp(cfg.sgg).test(String(r.addrKo)))).length >= 20);

  // ── 허브
  const stat = open.map(a => `<div><b>${D[a.slug].length}</b>${AXES[a.slug].label.replace(/^\S+\s/, '')}</div>`).join('')
    + (fes.length ? `<div><b>${fes.length}</b>다가오는 축제</div>` : '')
    + (cfg.photos ? `<div><b>${cfg.photos.length}</b>직접 찍은 사진</div>` : '');

  const hub = `<div class="cy-stat">${stat}</div>
${cfg.photos ? photoStrip() : ''}
${cfg.intro ? `<div class="cy-key" style="padding:14px 16px;margin:14px 0"><b style="font-size:1.02rem">${esc(cfg.introT || KO + ' — 알아두면 좋은 것')}</b><br>${cfg.intro}</div>` : ''}
${fes.length ? `<h2 class="sec">다가오는 축제</h2>
<div class="cy-grid">${fes.slice(0, 9).map(fesCard).join('')}</div>
${fes.length < 15 ? note(`진행·예정인 축제만 실었습니다. ${esc(KO)}은 지금 <b>${fes.length}건</b>이라 별도 축제 페이지는 만들지 않았습니다 — 목록이 짧은데 페이지를 나누면 읽을 게 없어집니다.`) : ''}` : ''}
${open.map(a => `<h2 class="sec">${esc(AXES[a.slug].label.replace(/^\S+\s/, ''))}</h2>
<div class="cy-grid">${D[a.slug].slice(0, a.slug === 'spot' ? 8 : 6).map(CARD[a.slug]).join('')}</div>
<p style="margin:10px 0"><a href="${base}${a.slug}/" style="color:var(--cy);font-weight:800">${esc(KO)} ${esc(AXES[a.slug].label.replace(/^\S+\s/, ''))} ${D[a.slug].length}곳 전체 보기 →</a></p>`).join('')}
${cfg.skip && Object.keys(cfg.skip).length ? note('만들지 않은 것: ' + Object.entries(cfg.skip).map(([k, v]) => `${esc(k)}(${esc(v)})`).join(' · ') + ' — <b>줄 게 없으면 만들지 않습니다.</b>') : ''}
<h2 class="sec">다른 곳도 보기</h2>
<div class="cy-nav">${(cfg.siblings || []).map(([u, l]) => `<a href="${u}">${esc(l)}</a>`).join('')}<a href="/search/?region=${encodeURIComponent(cfg.sido)}">🔎 ${esc(cfg.sido)} 축제 검색</a>${
    intlReady.map(l => `<a href="/${l}/${cfg.key}/">🌏 ${LANG_NAME[l]}</a>`).join('')}</div>
${note(AXES[open[0] ? open[0].slug : 'spot'].src)}`;

  const total = open.reduce((s, a) => s + D[a.slug].length, 0);
  mk('', `${KO} ${open.map(a => AXES[a.slug].label.replace(/^\S+\s/, '')).join('·')} ${MN[mn]} — 지금 갈 만한 ${total}곳 | ${SITE_NAME}`,
    `${KO} ${open.map(a => `${AXES[a.slug].label.replace(/^\S+\s/, '')} ${D[a.slug].length}곳`).join(', ')}을 한곳에. 공공데이터 기반, 영업시간·주차·날씨까지.`,
    `${cfg.emoji} ${KO} — ${open.map(a => AXES[a.slug].label.replace(/^\S+\s/, '')).join('·')}`,
    `${KO}에서 <b>지금 갈 만한 곳</b>을 한곳에 모았습니다. ${open.map(a => `${AXES[a.slug].label.replace(/^\S+\s/, '')} ${D[a.slug].length}곳`).join(' · ')}${fes.length ? ` · 다가오는 축제 ${fes.length}건` : ''}.`,
    hub);

  return {
    urls, intlReady,
    log: `✓ ${base} — ${urls.length}페이지 (${open.map(a => `${a.slug} ${D[a.slug].length}`).join(' · ')}` +
      `${fes.length ? ` · 축제 ${fes.length}` : ''}${cfg.photos ? ` · 사진 ${cfg.photos.length}` : ''})` +
      `${cfg.axes.length > open.length ? ` ⚠️ 게이트 미달로 제외: ${cfg.axes.filter(a => !openSet.has(a.slug)).map(a => `${a.slug}(${(D[a.slug] || []).length})`).join(',')}` : ''}` +
      `${intlReady.length ? ` · 🌏 ${intlReady.join(',')}` : ' · 🌏 없음'}`
  };
}

module.exports = { build, METRO, AXES };
