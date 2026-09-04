// 🌊 부산 한국어 페이지 — /busan/ 와 그 하위
//
// 왜 이 구성인가 (2026-09-04 네이버 월간 검색량 실측 + 데이터 실측)
//   ⭐ **부산은 서울과 그림이 다르다.** 서울은 전시회(92,800)가 압도적이었지만 부산은 —
//     **부산가볼만한곳 172,400** ≫ 부산축제 24,250 ≈ 부산콘서트 24,090 > 부산전시회 22,010
//     > 부산공연 18,430 · 연극 16,200 · 뮤지컬 12,100 ≫ 무료전시 310 · 클래식 460
//   ⭐ **제일 큰 「부산가볼만한곳」은 축제·전시가 아니라 «장소»다 — API 신청이 필요 없었다.**
//     우리가 이미 가진 것으로 만든다(관광지 352 · 관광지표준 78 — 주차 대수·수용인원 포함).
//   ❌ **콘서트 페이지는 만들지 않는다.** 총 1,210건인데 «오늘 이후 시작 0건»이다
//     (2022년 375건 → 2026년 16건으로 갱신이 말랐다). 검색량이 커도 **줄 게 없으면 안 만든다.**
//   ❌ 무료·클래식도 안 만든다(310·460). 서울에서 만든 `/seoul/free/` 를 부산에 복사하지 않는다.
//
// ⚠️ 부산 문화 API 는 「제목·기간·장소명」뿐이라 그대로 쓰면 «목록만 있는 페이지»가 된다.
//    → `busan_places.json`(문화공간 601곳)으로 **주소·좌표·좌석수**를 이어 붙였다(126건 중 106건, 84%).
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

function load(ROOT, f) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));
    return Array.isArray(d) ? d : (d.rows || []);
  } catch (e) { return []; }
}

function build({ ROOT, layout, writePage, SITE, SITE_NAME, TODAY, WX, buyBox }) {
  const T8 = String(TODAY).replace(/-/g, '');
  const mn = +T8.slice(4, 6);
  const urls = [];

  // ── 재료
  const bf = load(ROOT, 'busan_festivals.json');           // 부산축제 41(공식 5개어·설명·교통·사진·좌표)
  const cult = load(ROOT, 'busan_culture.json');           // 전시·뮤지컬·기타(진행·예정 126)
  const places = load(ROOT, 'busan_places.json');          // 문화공간 601
  const spots = load(ROOT, 'spots_ko.json').filter(r => r.sido === '부산');
  const trr = load(ROOT, 'trrsrt.json').filter(r => r.sido === '부산');
  const api = load(ROOT, 'festivals_api.json').filter(r => r.sido === '부산');
  const std = load(ROOT, 'cltur_fstvl.json').filter(r => r.sido === '부산');

  // ── ① 축제 — 세 소스를 합치고 제목으로 중복 제거(부산축제 API 를 우선한다: 설명·교통·사진이 있다)
  const fes = [], fseen = new Set();
  const pushFes = f => { const k = norm(f.title); if (!k || fseen.has(k)) return; fseen.add(k); fes.push(f); };
  bf.forEach(r => {
    const k = r.langs && r.langs.ko; if (!k || !k.title) return;
    pushFes({
      title: r.ko || k.title, sub: k.sub, place: k.place, day: k.day, time: k.time,
      fee: k.fee, traffic: k.traffic, desc: k.desc, tel: k.tel, hp: k.hp,
      img: r.img, x: r.x, y: r.y, start: '', end: '', src: '부산시'
    });
  });
  api.filter(r => String(r.end || '') >= T8).forEach(r => pushFes({
    title: r.title, place: r.addr, start: String(r.start), end: String(r.end),
    desc: r.ov, tel: r.tel, img: r.img, x: r.x, y: r.y, src: '관광공사'
  }));
  std.filter(r => String(r.end || '') >= T8).forEach(r => pushFes({
    title: r.title, place: r.place || r.addr, start: String(r.start), end: String(r.end),
    desc: r.ov, tel: r.tel, hp: r.hp, x: r.x, y: r.y, src: '행안부 표준데이터'
  }));

  // ── ② 전시·공연
  const live = cult.filter(r => r.end >= T8);
  const exh = live.filter(r => r.kind === 'exhibit');
  const perf = live.filter(r => r.kind === 'musical' || r.kind === 'etc');

  // ── ③ 가볼만한 곳 — ⭐172,400. 부산 검색량 1위인데 **API 신청이 필요 없었다.**
  // ⚠️ 처음엔 `spots_ko`(부산 352)를 쓰려 했는데 **개요 필드가 아예 없었다**(수집 때 ovMax:0).
  //    그대로 두면 「이름만 나열한 페이지」가 된다. 그래서 «설명이 있는» 소스를 다시 찾았다 —
  //    ⭐ `accessible.json`(한국관광공사 무장애여행 정보)에 부산 390곳이 있고 그중 **관광지·문화시설·레포츠 201곳,
  //      개요 120자↑ 192곳**이었다. 무장애 데이터지만 설명은 그 장소의 일반 설명이다.
  //    ⭐ 덤으로 **휠체어·유모차로 갈 수 있는 곳**이라는 사실이 붙는다 — 경쟁사가 못 쓰는 각도다.
  //    ⚠️ 숙박·쇼핑·음식점은 「가볼만한 곳」이 아니라 뺐다.
  const GO_CAT = ['관광지', '문화시설', '레포츠'];
  const trrIdx = new Map();
  trr.forEach(r => { const k = norm(r.title || r.name); if (k && !trrIdx.has(k)) trrIdx.set(k, r); });
  const imgIdx = new Map();
  spots.forEach(r => { const k = norm(r.title); if (k && r.img && !imgIdx.has(k)) imgIdx.set(k, r.img); });
  const spot = load(ROOT, 'accessible.json')
    .filter(r => r.sido === '부산' && GO_CAT.includes(r.cat)
      && String(r.ov || '').length >= 120 && +r.x && +r.y)
    .map(r => ({ ...r, img: r.img || imgIdx.get(norm(r.title)) || '', t: trrIdx.get(norm(r.title)) || null }))
    .sort((a, b) => (b.img ? 1 : 0) - (a.img ? 1 : 0) || (b.t ? 1 : 0) - (a.t ? 1 : 0));

  const CSS = `<style>
.bs-h1{font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:8px 0 6px}
.bs-lead{color:#374151;font-size:1rem;line-height:1.8;margin:0 0 12px}
.bs-nav{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 18px}
.bs-nav a,.bs-nav span{display:inline-block;padding:9px 15px;border-radius:22px;font-weight:800;font-size:.92rem;text-decoration:none}
.bs-nav a{background:#fff;border:1.5px solid #dfe6ea;color:#374151}
.bs-nav span{background:#0f9d8f;color:#fff}
.bs-stat{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0 6px}
.bs-stat div{background:#f4faf8;border:1.5px solid #dcefeb;border-radius:12px;padding:10px 16px;font-size:.86rem;color:#0a6c63;font-weight:700}
.bs-stat b{display:block;font-size:1.25rem;color:#0a6c63}
.bs-grid{display:grid;gap:13px;grid-template-columns:repeat(auto-fill,minmax(262px,1fr))}
.bs-card{background:#fff;border:1px solid #e6eaee;border-radius:14px;overflow:hidden}
.bs-img{width:100%;height:150px;object-fit:cover}
.bs-body{padding:12px 14px}
.bs-body h3{font-size:1rem;font-weight:800;margin:0 0 5px;line-height:1.45;color:#111827}
.bs-meta{font-size:.86rem;color:#6b7280;margin:0 0 4px;line-height:1.6}
.bs-desc{font-size:.88rem;color:#374151;line-height:1.7;margin:6px 0 6px}
.bs-tr{font-size:.85rem;color:#374151;background:#f7fafc;border-radius:8px;padding:8px 10px;margin:6px 0}
.bs-tag{display:inline-block;background:#e2f5f2;color:#0a6c63;font-size:.78rem;font-weight:800;border-radius:6px;padding:2px 8px;margin-right:4px}
.bs-note{color:#9aa3af;font-size:.82rem;line-height:1.7;margin-top:16px}
.bs-gu{color:#6b7280;font-size:.93rem;line-height:1.9;margin:6px 0 0}
</style>`;

  const nav = cur => `<div class="bs-nav">${[
    ['', '🌊 부산 전체'], ['spot', '📍 가볼만한 곳'], ['festival', '🎪 축제'],
    ['exhibition', '🖼 전시회'], ['performance', '🎭 공연']
  ].map(([k, label]) => cur === k ? `<span>${label}</span>`
    : `<a href="/busan/${k ? k + '/' : ''}">${label}</a>`).join('')}</div>`;

  const guLine = list => {
    const c = {}; list.forEach(r => { const g = r.gu || r.sigungu || r.city; if (g) c[g] = (c[g] || 0) + 1; });
    const top = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 12);
    return top.length ? `<p class="bs-gu">자치구·군별: ${top.map(([k, n]) => `${esc(k)} <b>${n}</b>`).join(' · ')}</p>` : '';
  };

  const SRC_FES = `<p class="bs-note">데이터 출처: <b>부산광역시 부산축제정보</b>(공공데이터포털)·한국관광공사 TourAPI·행정안전부 전국문화축제표준데이터.
일정과 요금은 주최 측 사정으로 바뀔 수 있으니 방문 전 확인하세요. <b>등록돼 있지 않은 정보는 비워 뒀습니다</b> — 추측해서 채우지 않습니다.</p>`;
  const SRC_CULT = `<p class="bs-note">데이터 출처: <b>부산광역시 문화포털</b>(공공데이터포털). ⚠️ 이 데이터는 <b>제목·기간·장소명·유료 여부</b>만 제공합니다 —
주소·좌표·좌석수는 <b>부산광역시 문화공간(공연장·전시공간) 목록</b>과 장소 이름으로 이어 붙인 것이며, 이어지지 않은 곳은 장소명만 표시합니다.
자세한 관람 시간과 요금은 각 공간에 확인하세요.</p>`;

  const fesCard = f => {
    const wx = (WX && f.x && f.y) ? WX.now(f.x, f.y) : '';
    return `<div class="bs-card">
${f.img ? `<img class="bs-img" src="${esc(f.img)}" alt="${esc(f.title)}" loading="lazy" onerror="this.remove()">` : ''}
<div class="bs-body"><h3>${esc(f.title)}</h3>
${f.sub ? `<p class="bs-meta" style="color:#0a6c63;font-weight:700">${esc(f.sub)}</p>` : ''}
<p class="bs-meta">📅 ${esc(range(f.start, f.end) || f.day || '일정 미정')}${wx}</p>
${f.place ? `<p class="bs-meta">📍 ${esc(String(f.place).slice(0, 60))}</p>` : ''}
${f.fee ? `<p class="bs-meta">💳 ${esc(String(f.fee).slice(0, 60))}</p>` : ''}
${f.desc ? `<p class="bs-desc">${esc(String(f.desc).slice(0, 200))}</p>` : ''}
${f.traffic ? `<p class="bs-tr">🚇 ${esc(String(f.traffic).slice(0, 170))}</p>` : ''}
<p class="bs-meta"><span class="bs-tag">${esc(f.src)}</span>${f.tel ? `☎️ ${esc(f.tel)}` : ''}</p>
</div></div>`;
  };

  const cultCard = r => `<div class="bs-card"><div class="bs-body">
<h3>${esc(r.title)}</h3>
<p class="bs-meta">📅 ${esc(range(r.start, r.end))}</p>
<p class="bs-meta">📍 ${esc(r.place)}${r.addr ? ` · ${esc(String(r.addr).slice(0, 40))}` : ''}</p>
<p class="bs-meta">${r.pay ? '💳 유료' : '<span class="bs-tag">무료</span>'}</p>
</div></div>`;

  const spotCard = p => {
    const wx = (WX && p.x && p.y) ? WX.now(p.x, p.y) : '';
    const t = p.t;
    return `<div class="bs-card">
${p.img ? `<img class="bs-img" src="${esc(String(p.img).replace(/^http:/, 'https:'))}" alt="${esc(p.title)}" loading="lazy" onerror="this.remove()">` : ''}
<div class="bs-body"><h3>${esc(p.title)}</h3>
<p class="bs-meta">📍 ${esc(p.sigungu || '부산')}${p.cat ? ` · ${esc(p.cat)}` : ''}${wx}</p>
${t && (t.park || t.cap) ? `<p class="bs-meta">${t.park ? `🅿️ 주차 ${esc(String(t.park))}대 ` : ''}${t.cap ? `· 수용 ${esc(String(t.cap))}명` : ''}</p>` : ''}
<p class="bs-desc">${esc(String(p.ov).slice(0, 190))}…</p>
<p class="bs-meta"><span class="bs-tag">♿ 무장애여행 등록</span>${p.tel ? ` ☎️ ${esc(p.tel)}` : ''}</p>
</div></div>`;
  };

  const mk = (slug, title, desc, h1, lead, cur, body) => {
    const content = `<main><div class="wrap">${CSS}
${slug ? `<p style="font-size:.85rem;color:#9aa3af;margin:8px 0"><a href="/" style="color:#0c7d72">홈</a> › <a href="/busan/" style="color:#0c7d72">부산</a></p>` : ''}
<h1 class="bs-h1">${h1}</h1>
<p class="bs-lead">${lead}</p>
${nav(cur)}
${body}
</div></main>`;
    writePage('busan' + (slug ? '/' + slug : ''), layout(title, desc, `/busan/${slug ? slug + '/' : ''}`, content));
    urls.push(`/busan/${slug ? slug + '/' : ''}`);
  };

  // ── 가볼만한 곳 (⭐ 172,400)
  if (spot.length >= 30) {
    const N = Math.min(spot.length, 80);
    mk('spot',
      `부산 가볼만한 곳 ${MN[mn]} — 관광지 ${spot.length}곳 총정리 | ${SITE_NAME}`,
      `부산 가볼만한 곳 ${spot.length}곳을 자치구별로 정리했습니다. 공공데이터 기반 설명과 오늘 날씨, 주차 대수까지 함께 확인하세요.`,
      `📍 부산 가볼만한 곳 ${spot.length}곳`,
      `부산에서 가볼 만한 곳 <b>${spot.length}곳</b>입니다. 설명이 등록된 <b>관광지·문화시설·레포츠</b>만 골랐고(숙박·쇼핑·음식점은 뺐습니다),
행정안전부 관광지표준데이터에 <b>주차 대수·수용 인원</b>이 있는 곳은 그 숫자도 함께 실었습니다. 좌표가 있는 곳은 <b>오늘 날씨</b>가 붙습니다.
⭐ 이 목록은 한국관광공사 <b>무장애여행 정보</b>에 등록된 곳이라 <b>휠체어·유모차로 갈 만한지</b> 참고가 됩니다.`,
      'spot',
      `${guLine(spot)}<div class="bs-grid">${spot.slice(0, N).map(spotCard).join('')}</div>
<p class="bs-note">데이터 출처: 한국관광공사 무장애여행 정보(장소·설명) · 행정안전부 전국관광지정보표준데이터(주차 대수·수용 인원) · Open-Meteo(날씨).
⚠️ <b>「무장애여행 정보에 등록된 곳」이라는 뜻이지, 모든 시설이 완전히 무장애라는 뜻은 아닙니다.</b>
경사·출입구·화장실 같은 실제 접근성은 방문 전 각 시설에 확인하세요. 주차 대수는 지자체가 신고한 값이라 현장과 다를 수 있습니다.</p>`);
  }

  // ── 축제 (24,250)
  if (fes.length >= 15) {
    mk('festival',
      `부산 축제 ${MN[mn]} — 지금 하는 축제 ${fes.length}개 총정리 | ${SITE_NAME}`,
      `부산에서 지금 열리는 축제 ${fes.length}개를 기간·장소·요금·가는 길까지 정리했습니다. 부산시 공식 축제정보와 공공데이터 기준.`,
      `🎪 부산 축제 ${fes.length}개`,
      `부산에서 열리는 축제 <b>${fes.length}개</b>입니다. 부산시가 직접 공개한 축제정보에는 <b>가는 길 안내</b>가 함께 들어 있어 그대로 실었습니다.`,
      'festival',
      `<div class="bs-grid">${fes.map(fesCard).join('')}</div>${SRC_FES}`);
  }

  // ── 전시회 (22,010)
  if (exh.length >= 15) {
    mk('exhibition',
      `부산 전시회 ${MN[mn]} — 지금 하는 전시 ${exh.length}개 총정리 | ${SITE_NAME}`,
      `부산에서 지금 볼 수 있는 전시 ${exh.length}개를 기간·장소·요금으로 정리했습니다. 부산시 문화포털 공개 데이터 기준.`,
      `🖼 부산 전시회 ${exh.length}개`,
      `부산에서 <b>지금 볼 수 있는 전시</b> ${exh.length}개입니다. 무료 ${exh.filter(r => !r.pay).length}개가 포함돼 있습니다.`,
      'exhibition',
      `${guLine(exh.map(r => ({ gu: (places.find(p => p.name === r.place) || {}).gu })))}
<div class="bs-grid">${exh.map(cultCard).join('')}</div>${SRC_CULT}`);
  }

  // ── 공연(뮤지컬·기타) — 콘서트는 데이터가 0건이라 제외
  if (perf.length >= 15) {
    mk('performance',
      `부산 공연 ${MN[mn]} — 뮤지컬·연극 등 ${perf.length}개 | ${SITE_NAME}`,
      `부산에서 지금 볼 수 있는 뮤지컬·연극 등 공연 ${perf.length}개를 기간·장소로 정리했습니다.`,
      `🎭 부산 공연 ${perf.length}개`,
      `부산에서 <b>지금 볼 수 있는 공연</b> ${perf.length}개(뮤지컬·연극 등)입니다.
⚠️ 콘서트는 공개 데이터에 <b>올해 등록이 거의 없어</b> 따로 싣지 않았습니다 — 없는 것을 있는 것처럼 보이게 하지 않습니다.`,
      'performance',
      `<div class="bs-grid">${perf.map(cultCard).join('')}</div>${SRC_CULT}`);
  }

  // ── 허브
  const hub = `<div class="bs-stat">
<div><b>${spot.length}</b>가볼만한 곳</div><div><b>${fes.length}</b>축제</div>
<div><b>${exh.length}</b>전시</div><div><b>${perf.length}</b>공연</div><div><b>${places.length}</b>문화공간</div>
</div>
<h2 class="sec">가볼만한 곳</h2>
<div class="bs-grid">${spot.slice(0, 8).map(spotCard).join('')}</div>
<p style="margin:10px 0"><a href="/busan/spot/" style="color:#0c7d72;font-weight:800">부산 가볼만한 곳 ${spot.length}곳 전체 보기 →</a></p>
${fes.length ? `<h2 class="sec">지금 하는 축제</h2>
<div class="bs-grid">${fes.slice(0, 6).map(fesCard).join('')}</div>
<p style="margin:10px 0"><a href="/busan/festival/" style="color:#0c7d72;font-weight:800">부산 축제 전체 보기 →</a></p>` : ''}
${exh.length ? `<h2 class="sec">지금 하는 전시</h2>
<div class="bs-grid">${exh.slice(0, 6).map(cultCard).join('')}</div>
<p style="margin:10px 0"><a href="/busan/exhibition/" style="color:#0c7d72;font-weight:800">부산 전시회 전체 보기 →</a></p>` : ''}
<h2 class="sec">다른 곳도 보기</h2>
<div class="bs-nav"><a href="/seoul/">🏙 서울</a><a href="/search/?region=부산">🔎 부산 축제 검색</a><a href="/jangteo/">🏮 전국 오일장</a><a href="/en/busan/">🌏 English</a></div>
${SRC_FES}`;
  mk('', `부산 가볼만한 곳·축제·전시 ${MN[mn]} — 지금 갈 만한 ${spot.length + fes.length + exh.length}곳 | ${SITE_NAME}`,
    `부산 가볼만한 곳 ${spot.length}곳, 지금 하는 축제 ${fes.length}개와 전시 ${exh.length}개를 한곳에. 공공데이터 기반, 날씨와 주차 정보까지.`,
    `🌊 부산 — 가볼만한 곳·축제·전시`,
    `부산에서 <b>지금 갈 만한 곳</b>을 한곳에 모았습니다. 가볼만한 곳 ${spot.length}곳 · 축제 ${fes.length}개 · 전시 ${exh.length}개 · 공연 ${perf.length}개.`,
    '', hub);

  console.log(`✓ /busan/ — ${urls.length}페이지 (가볼만한곳 ${spot.length} · 축제 ${fes.length} · 전시 ${exh.length} · 공연 ${perf.length} · 문화공간 ${places.length})`);
  if (!perf.length) console.log('   ⚠️ 공연 0건 — 부산 문화포털 데이터가 비어 있습니다');
  return urls;
}

module.exports = { build };
