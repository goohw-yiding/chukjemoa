// 🍊 제주 한국어 페이지 — /jeju/ 와 그 하위
//
// 왜 이 구성인가 (2026-09-04 네이버 월간 검색량 실측 + 데이터 전수 실측)
//
//   ⭐ **제주는 서울·부산과 또 다르다.** 서울은 전시회(92,800), 부산은 가볼만한곳(172,400)이었는데 제주는 —
//     제주도여행 154,700 · 제주가볼만한곳 53,780 · 제주도가볼만한곳 36,450 · 제주도관광 28,150
//     **제주동쪽가볼만한곳 16,320 · 제주서쪽가볼만한곳 13,290** ⭐ 제주에만 있는 검색 습관이다
//     제주카페 14,630 + 제주도카페 11,540 = 26,170 ⭐ · 제주시가볼만한곳 12,420 · 제주해수욕장 9,570
//     제주서귀포가볼만한곳 9,830 · 제주박물관 6,690 · 제주오름 6,600 + 오름추천 4,290
//     ❌ **제주축제는 3,050뿐이다** — 서울·부산의 1/8. 게다가 우리 제주 축제 재고는 진행·예정 5건.
//        **검색량도 작고 줄 것도 없다 → 축제 페이지는 만들지 않는다.**(부산 콘서트와 같은 판단)
//
//   ⭐ **비짓제주 API를 기다릴 필요가 없었다.** 신청 안내를 드린 뒤 기존 재고를 세어 보니
//     제주 고유 **598곳(개요 120자↑·좌표 있음, 사진 545곳=91%)** 이 이미 있었다.
//     부산을 191곳으로 만들었으니 제주는 그 3배다. API가 오면 그때 더 붙인다.
//
//   🔴 **처음 센 숫자는 틀렸다.** 「제주」를 이름·주소 어디든 포함하면 잡는 식으로 셌더니
//      **`본가제주밥상`(경기도 남양주)** 같은 육지 가게가 대량으로 딸려 왔다.
//      → **`sido` 필드로만 판정한다.** 없으면 주소가 «제주로 시작»하는지 본다(포함 아님).
//      (기억의 「한글 부분매칭엔 앞뒤 글자 검사」와 같은 함정이 또 나왔다.)
//
//   ⚠️ 동/서는 **경도로 자르지 않았다** — 관습과 어긋난다. 제주 사람들이 쓰는 대로 **읍·면 이름**으로 나눈다.
//      동쪽=조천·구좌·성산·표선·남원 / 서쪽=애월·한림·한경·대정·안덕 / 나머지는 시내.
const fs = require('fs'), path = require('path');

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MN = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const norm = s => String(s || '').replace(/[\s()（）·・\-–—_,.'"[\]]/g, '').toLowerCase();

// 제주 판정 — sido 가 있으면 그것만 믿는다(이름 포함 매칭은 육지를 삼킨다).
const isJeju = o => {
  const s = String(o.sido || '').trim();
  if (s) return /^제주/.test(s);
  return /^제주특별자치도|^제주도\s|^제주시|^서귀포시/.test(String(o.addr || o.address || '').trim());
};
const EAST = /조천읍|구좌읍|성산읍|표선면|남원읍|우도면/;
const WEST = /애월읍|한림읍|한경면|대정읍|안덕면|추자면/;
const side = o => EAST.test(o.addr) ? 'east' : (WEST.test(o.addr) ? 'west' : 'mid');
const eupmyeon = o => (String(o.addr).match(/(?:제주시|서귀포시)\s*(\S+?[읍면])/) || [])[1] || '';

function load(ROOT, f) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));
    return Array.isArray(d) ? d : (d.rows || []);
  } catch (e) { return []; }
}

function build({ ROOT, layout, writePage, SITE, SITE_NAME, TODAY, WX }) {
  const T8 = String(TODAY).replace(/-/g, '');
  const mn = +T8.slice(4, 6);
  const urls = [];

  // ── 재료 모으기: 여러 소스를 «이름»으로 합치되, 개요가 긴 쪽을 남긴다.
  const SRC = [
    ['accessible.json', 'acc'], ['cafes_ko.json', 'cafe'], ['mountains_ko.json', 'mtn'],
    ['valleys.json', 'valley'], ['flower.json', 'flower'], ['maple.json', 'maple'],
  ];
  const pool = [];
  for (const [f, tag] of SRC)
    for (const o of load(ROOT, f).filter(isJeju))
      pool.push({
        src: tag, title: o.title || o.name || '', addr: String(o.addr || ''), cat: o.cat || '',
        ov: String(o.ov || ''), x: o.x, y: o.y, tel: o.tel || '',
        img: String(o.img || '').replace(/^http:/, 'https:'),
        open: o.open || '', rest: o.rest || '', park: o.park || '', hp: o.hp || ''
      });

  // 사진·주차 같은 «부가 정보»는 다른 소스에 있을 수 있으니 이름으로 이어 붙인다.
  const spotsImg = new Map();
  for (const o of load(ROOT, 'spots_ko.json').filter(isJeju))
    if (o.img) spotsImg.set(norm(o.title), String(o.img).replace(/^http:/, 'https:'));
  const trrIdx = new Map();
  for (const o of load(ROOT, 'trrsrt.json').filter(isJeju))
    trrIdx.set(norm(o.title || o.name), o);

  const uniq = new Map();
  for (const o of pool) {
    if (!o.title || o.ov.length < 120 || !+o.x || !+o.y) continue;
    const k = norm(o.title);
    const prev = uniq.get(k);
    if (!prev) uniq.set(k, o);
    else {
      if (o.ov.length > prev.ov.length) { uniq.set(k, { ...o, img: o.img || prev.img }); }
      else if (!prev.img && o.img) prev.img = o.img;
    }
  }
  const ALL = [...uniq.values()].map(o => ({
    ...o, img: o.img || spotsImg.get(norm(o.title)) || '',
    t: trrIdx.get(norm(o.title)) || null, side: side(o), em: eupmyeon(o)
  }));
  // 사진 있는 것을 앞으로 — 카드가 훨씬 잘 읽힌다.
  const bySort = a => a.slice().sort((x, y) => (y.img ? 1 : 0) - (x.img ? 1 : 0) || x.title.localeCompare(y.title, 'ko'));

  const GO = ['관광지', '문화시설', '레포츠'];
  const spot = bySort(ALL.filter(o => GO.includes(o.cat) || o.src === 'mtn' || o.src === 'valley'));
  const cafe = bySort(ALL.filter(o => o.src === 'cafe'));
  const oreum = bySort(ALL.filter(o => o.src === 'mtn' || /오름/.test(o.title)));
  const beach = bySort(ALL.filter(o => /해수욕장|해변|백사/.test(o.title)));
  const east = bySort(ALL.filter(o => o.side === 'east'));
  const west = bySort(ALL.filter(o => o.side === 'west'));

  const CSS = `<style>
.jj-h1{font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:8px 0 6px}
.jj-lead{color:#374151;font-size:1rem;line-height:1.8;margin:0 0 12px}
.jj-nav{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 18px}
.jj-nav a,.jj-nav span{display:inline-block;padding:9px 15px;border-radius:22px;font-weight:800;font-size:.92rem;text-decoration:none}
.jj-nav a{background:#fff;border:1.5px solid #e4e0d6;color:#374151}
.jj-nav span{background:#e8820c;color:#fff}
.jj-stat{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0 6px}
.jj-stat div{background:#fff8ef;border:1.5px solid #f3e2cc;border-radius:12px;padding:10px 16px;font-size:.86rem;color:#9a5a06;font-weight:700}
.jj-stat b{display:block;font-size:1.25rem;color:#9a5a06}
.jj-grid{display:grid;gap:13px;grid-template-columns:repeat(auto-fill,minmax(262px,1fr))}
.jj-card{background:#fff;border:1px solid #ece7de;border-radius:14px;overflow:hidden}
.jj-img{width:100%;height:150px;object-fit:cover}
.jj-body{padding:12px 14px}
.jj-body h3{font-size:1rem;font-weight:800;margin:0 0 5px;line-height:1.45;color:#111827}
.jj-meta{font-size:.86rem;color:#6b7280;margin:0 0 4px;line-height:1.6}
.jj-desc{font-size:.88rem;color:#374151;line-height:1.7;margin:6px 0}
.jj-tag{display:inline-block;background:#fdeed8;color:#9a5a06;font-size:.78rem;font-weight:800;border-radius:6px;padding:2px 8px;margin-right:4px}
.jj-note{color:#9aa3af;font-size:.82rem;line-height:1.7;margin-top:16px}
.jj-em{color:#6b7280;font-size:.93rem;line-height:1.9;margin:6px 0 0}
.jj-box{background:#fff8ef;border:1.5px solid #f3e2cc;border-radius:12px;padding:13px 16px;margin:12px 0;font-size:.92rem;line-height:1.85;color:#4b3a22}
</style>`;

  const PAGES = [
    ['', '🍊 제주 전체'], ['spot', '📍 가볼만한 곳'], ['east', '🌅 동쪽'], ['west', '🌇 서쪽'],
    ['cafe', '☕ 카페'], ['oreum', '⛰ 오름'], ['beach', '🏖 해수욕장'],
  ];
  const nav = cur => `<div class="jj-nav">${PAGES.map(([k, label]) => cur === k
    ? `<span>${label}</span>` : `<a href="/jeju/${k ? k + '/' : ''}">${label}</a>`).join('')}</div>`;

  const emLine = list => {
    const c = {};
    list.forEach(r => { const g = r.em || (r.addr.includes('서귀포시') ? '서귀포시내' : '제주시내'); c[g] = (c[g] || 0) + 1; });
    const top = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 14);
    return top.length ? `<p class="jj-em">지역별: ${top.map(([k, n]) => `${esc(k)} <b>${n}</b>`).join(' · ')}</p>` : '';
  };

  const card = p => {
    const wx = (WX && p.x && p.y) ? WX.now(p.x, p.y) : '';
    const t = p.t;
    const where = p.em || (p.addr.includes('서귀포시') ? '서귀포시' : '제주시');
    return `<div class="jj-card">
${p.img ? `<img class="jj-img" src="${esc(p.img)}" alt="${esc(p.title)}" loading="lazy" onerror="this.remove()">` : ''}
<div class="jj-body"><h3>${esc(p.title)}</h3>
<p class="jj-meta">📍 ${esc(where)}${p.cat ? ` · ${esc(p.cat)}` : ''}${wx}</p>
${t && (t.park || t.cap) ? `<p class="jj-meta">${t.park ? `🅿️ 주차 ${esc(String(t.park))}대 ` : ''}${t.cap ? `· 수용 ${esc(String(t.cap))}명` : ''}</p>` : ''}
${p.open ? `<p class="jj-meta">🕘 ${esc(String(p.open).slice(0, 50))}</p>` : ''}
${p.rest ? `<p class="jj-meta">🚫 쉬는 날 ${esc(String(p.rest).slice(0, 40))}</p>` : ''}
<p class="jj-desc">${esc(p.ov.slice(0, 190))}…</p>
<p class="jj-meta">${p.src === 'acc' ? '<span class="jj-tag">♿ 무장애여행 등록</span>' : ''}${p.tel ? ` ☎️ ${esc(p.tel)}` : ''}</p>
</div></div>`;
  };

  const SRC_NOTE = `<p class="jj-note">데이터 출처: 한국관광공사 무장애여행 정보·전국 카페/산 정보(장소·설명·사진) · 행정안전부 전국관광지정보표준데이터(주차 대수·수용 인원) · Open-Meteo(날씨).
⚠️ <b>♿ 표시는 「무장애여행 정보에 등록된 곳」이라는 뜻이지, 모든 시설이 완전히 무장애라는 뜻은 아닙니다.</b>
경사·출입구·화장실 같은 실제 접근성은 방문 전 각 시설에 확인하세요.
운영시간·쉬는 날은 등록된 값이라 현장과 다를 수 있고, <b>등록돼 있지 않은 정보는 비워 뒀습니다</b> — 추측해서 채우지 않습니다.</p>`;

  const mk = (slug, title, desc, h1, lead, cur, body) => {
    const content = `<main><div class="wrap">${CSS}
${slug ? `<p style="font-size:.85rem;color:#9aa3af;margin:8px 0"><a href="/" style="color:#c2700a">홈</a> › <a href="/jeju/" style="color:#c2700a">제주</a></p>` : ''}
<h1 class="jj-h1">${h1}</h1>
<p class="jj-lead">${lead}</p>
${nav(cur)}
${body}
</div></main>`;
    writePage('jeju' + (slug ? '/' + slug : ''), layout(title, desc, `/jeju/${slug ? slug + '/' : ''}`, content));
    urls.push(`/jeju/${slug ? slug + '/' : ''}`);
  };

  const grid = (list, n) => `<div class="jj-grid">${list.slice(0, n).map(card).join('')}</div>`;

  // ── ① 가볼만한 곳 (제주가볼만한곳 53,780 + 제주도가볼만한곳 36,450)
  if (spot.length >= 30) mk('spot',
    `제주 가볼만한 곳 ${MN[mn]} — 관광지 ${spot.length}곳 총정리 | ${SITE_NAME}`,
    `제주도 가볼만한 곳 ${spot.length}곳을 읍·면별로 정리했습니다. 공공데이터 기반 설명과 오늘 날씨, 주차 대수까지 한 화면에서 확인하세요.`,
    `📍 제주 가볼만한 곳 ${spot.length}곳`,
    `제주도에서 가볼 만한 곳 <b>${spot.length}곳</b>입니다. 설명이 등록된 <b>관광지·문화시설·레포츠·오름·계곡</b>만 골랐고
(숙박·음식점은 뺐습니다), 좌표가 있는 곳은 <b>오늘 날씨</b>가 함께 나옵니다.
동쪽·서쪽으로 나눠 보고 싶으면 위 <b>🌅 동쪽 ${east.length}곳 · 🌇 서쪽 ${west.length}곳</b>을 눌러 주세요.`,
    'spot',
    `${emLine(spot)}${grid(spot, 90)}${SRC_NOTE}`);

  // ── ② 동쪽 (16,320) / ③ 서쪽 (13,290)
  //    ⚠️ spot 과 항목이 겹치지만 «자르는 축»이 다르다(카테고리 vs 지역)고 보고 만든다.
  //       대신 각 페이지에 그 지역만의 안내를 넣어 «같은 목록 두 번»이 되지 않게 한다.
  const sideBox = (nm, list, eups, tip) => `<div class="jj-box">
<b>${nm}</b>에 해당하는 읍·면은 <b>${eups}</b>입니다. 제주 사람들이 부르는 대로 나눴고, 지도 경도로 자르지 않았습니다.<br>
지금 이 목록에는 카페 <b>${list.filter(o => o.src === 'cafe').length}곳</b> · 오름 <b>${list.filter(o => /오름/.test(o.title) || o.src === 'mtn').length}곳</b> ·
해수욕장 <b>${list.filter(o => /해수욕장|해변/.test(o.title)).length}곳</b>이 섞여 있습니다.<br>${tip}</div>`;

  if (east.length >= 25) mk('east',
    `제주 동쪽 가볼만한 곳 ${MN[mn]} — ${east.length}곳 총정리 | ${SITE_NAME}`,
    `제주 동쪽(조천·구좌·성산·표선·남원) 가볼만한 곳 ${east.length}곳. 카페·오름·해수욕장을 한 번에, 오늘 날씨까지 함께 봅니다.`,
    `🌅 제주 동쪽 가볼만한 곳 ${east.length}곳`,
    `제주 <b>동쪽</b>에서 가볼 만한 곳 <b>${east.length}곳</b>을 한 번에 모았습니다. 종류를 가리지 않고 <b>지역으로만</b> 잘랐습니다 — 하루 동선을 짤 때는 이쪽이 편합니다.`,
    'east',
    `${sideBox('제주 동쪽', east, '조천읍 · 구좌읍 · 성산읍 · 표선면 · 남원읍 · 우도면',
      '☀️ 동쪽은 <b>해가 뜨는 쪽</b>이라 성산일출봉·섭지코지처럼 아침이 좋은 곳이 몰려 있습니다.')}
${emLine(east)}${grid(east, 80)}${SRC_NOTE}`);

  if (west.length >= 25) mk('west',
    `제주 서쪽 가볼만한 곳 ${MN[mn]} — ${west.length}곳 총정리 | ${SITE_NAME}`,
    `제주 서쪽(애월·한림·한경·대정·안덕) 가볼만한 곳 ${west.length}곳. 카페·오름·해수욕장을 한 번에, 오늘 날씨까지 함께 봅니다.`,
    `🌇 제주 서쪽 가볼만한 곳 ${west.length}곳`,
    `제주 <b>서쪽</b>에서 가볼 만한 곳 <b>${west.length}곳</b>을 한 번에 모았습니다. 종류를 가리지 않고 <b>지역으로만</b> 잘랐습니다.`,
    'west',
    `${sideBox('제주 서쪽', west, '애월읍 · 한림읍 · 한경면 · 대정읍 · 안덕면 · 추자면',
      '🌆 서쪽은 <b>해가 지는 쪽</b>이라 애월·한림 바닷가 카페처럼 저녁이 좋은 곳이 몰려 있습니다.')}
${emLine(west)}${grid(west, 80)}${SRC_NOTE}`);

  // ── ④ 카페 (제주카페 14,630 + 제주도카페 11,540)
  if (cafe.length >= 30) mk('cafe',
    `제주 카페 ${MN[mn]} — 가볼만한 카페 ${cafe.length}곳 총정리 | ${SITE_NAME}`,
    `제주도 카페 ${cafe.length}곳을 읍·면별로 정리했습니다. 운영시간·쉬는 날과 오늘 날씨까지 함께 확인하세요.`,
    `☕ 제주 카페 ${cafe.length}곳`,
    `제주도 카페 <b>${cafe.length}곳</b>입니다. <b>운영시간과 쉬는 날</b>이 등록된 곳은 그대로 실었습니다 —
헛걸음이 제일 아깝기 때문입니다. 좌표가 있는 곳은 <b>오늘 날씨</b>가 함께 나옵니다.`,
    'cafe',
    `${emLine(cafe)}${grid(cafe, 90)}${SRC_NOTE}`);

  // ── ⑤ 오름 (6,600 + 추천 4,290) — 제주에만 있는 말이다
  if (oreum.length >= 20) mk('oreum',
    `제주 오름 ${MN[mn]} — 오를 만한 오름 ${oreum.length}곳 총정리 | ${SITE_NAME}`,
    `제주 오름 ${oreum.length}곳을 읍·면별로 정리했습니다. 각 오름 설명과 오늘 날씨를 함께 확인하세요.`,
    `⛰ 제주 오름 ${oreum.length}곳`,
    `제주 <b>오름</b> ${oreum.length}곳입니다. 오름은 제주 화산섬에만 있는 작은 화산체로, 대부분 <b>30분~1시간</b>이면 오르내립니다.
바람이 세면 능선이 위험하니 <b>오늘 날씨</b>를 꼭 보고 나서세요 — 그래서 카드마다 붙여 뒀습니다.`,
    'oreum',
    `${emLine(oreum)}${grid(oreum, 80)}${SRC_NOTE}`);

  // ── ⑥ 해수욕장 (9,570) — 17곳 안팎이라 얇다. 게이트로 판정한다.
  if (beach.length >= 12) mk('beach',
    `제주 해수욕장 ${MN[mn]} — 해변 ${beach.length}곳 총정리 | ${SITE_NAME}`,
    `제주도 해수욕장·해변 ${beach.length}곳을 정리했습니다. 위치와 설명, 오늘 날씨를 함께 확인하세요.`,
    `🏖 제주 해수욕장 ${beach.length}곳`,
    `제주도 해수욕장·해변 <b>${beach.length}곳</b>입니다. <b>공공데이터에 설명이 등록된 곳만</b> 실었기 때문에
제주의 모든 해변이 다 있지는 않습니다 — 없는 것을 채워 넣지 않았습니다.
바다는 날씨에 가장 크게 좌우되니 <b>오늘 날씨</b>를 먼저 보세요.`,
    'beach',
    `${emLine(beach)}${grid(beach, 40)}${SRC_NOTE}`);

  // ── ⑦ 허브 (제주도여행 154,700 · 제주여행 24,480 · 제주도관광 28,150)
  const hub = `<div class="jj-stat">
<div><b>${spot.length}</b>가볼만한 곳</div><div><b>${cafe.length}</b>카페</div><div><b>${oreum.length}</b>오름</div>
<div><b>${beach.length}</b>해수욕장</div><div><b>${east.length}</b>동쪽</div><div><b>${west.length}</b>서쪽</div>
</div>
<div class="jj-box">🍊 제주는 <b>동쪽과 서쪽을 나눠서</b> 다니는 섬입니다. 하루는 동쪽, 하루는 서쪽으로 묶으면 이동이 훨씬 짧아집니다.<br>
<b>🌅 동쪽</b>(조천·구좌·성산·표선·남원) — 해 뜨는 쪽. 성산일출봉·섭지코지·월정리.<br>
<b>🌇 서쪽</b>(애월·한림·한경·대정·안덕) — 해 지는 쪽. 애월 바닷가 카페·협재·산방산.</div>
<h2 class="sec">가볼만한 곳</h2>
${grid(spot, 8)}
<p style="margin:10px 0"><a href="/jeju/spot/" style="color:#c2700a;font-weight:800">제주 가볼만한 곳 ${spot.length}곳 전체 보기 →</a></p>
<h2 class="sec">제주 카페</h2>
${grid(cafe, 6)}
<p style="margin:10px 0"><a href="/jeju/cafe/" style="color:#c2700a;font-weight:800">제주 카페 ${cafe.length}곳 전체 보기 →</a></p>
<h2 class="sec">오름</h2>
${grid(oreum, 6)}
<p style="margin:10px 0"><a href="/jeju/oreum/" style="color:#c2700a;font-weight:800">제주 오름 ${oreum.length}곳 전체 보기 →</a></p>
<h2 class="sec">제주에서 더 보기</h2>
<div class="jj-nav"><a href="/jangteo/jeju/">🏮 제주 오일장</a><a href="/trails/area/jeju/">🥾 제주 올레·걷기길</a>
<a href="/accessible/jeju/">♿ 무장애 여행</a><a href="/pet/jeju/">🐕 반려견 동반</a>
<a href="/search/?region=제주">🔎 제주 축제 검색</a></div>
<h2 class="sec">다른 도시</h2>
<div class="jj-nav"><a href="/seoul/">🏙 서울</a><a href="/busan/">🌊 부산</a><a href="/en/jeju/">🌏 English</a><a href="/ja/jeju/">🇯🇵 日本語</a></div>
${SRC_NOTE}`;

  mk('', `제주 가볼만한 곳·카페·오름 ${MN[mn]} — ${spot.length + cafe.length}곳 총정리 | ${SITE_NAME}`,
    `제주도 여행 정보를 한곳에. 가볼만한 곳 ${spot.length}곳, 카페 ${cafe.length}곳, 오름 ${oreum.length}곳을 동쪽·서쪽으로 나눠 정리했습니다. 오늘 날씨까지 함께.`,
    `🍊 제주 — 가볼만한 곳·카페·오름`,
    `제주도에서 <b>지금 갈 만한 곳</b>을 한곳에 모았습니다. 가볼만한 곳 ${spot.length}곳 · 카페 ${cafe.length}곳 · 오름 ${oreum.length}곳 · 해수욕장 ${beach.length}곳.
전부 <b>공공데이터에 설명이 등록된 곳</b>이고, 좌표가 있는 곳은 <b>오늘 날씨</b>가 함께 나옵니다.`,
    '', hub);

  console.log(`✓ /jeju/ — ${urls.length}페이지 (가볼만한곳 ${spot.length} · 카페 ${cafe.length} · 오름 ${oreum.length} · 해수욕장 ${beach.length} · 동 ${east.length} · 서 ${west.length} · 사진 ${ALL.filter(o => o.img).length}/${ALL.length})`);
  if (beach.length < 12) console.log('   ⚠️ 해수욕장 ' + beach.length + '곳 — 재료 게이트 미달로 페이지를 만들지 않았습니다');
  return urls;
}

module.exports = { build };
