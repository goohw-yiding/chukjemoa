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

  // ── 🆕 2026-09-04 저녁: 제주데이터허브 + 비짓제주.
  //   ⚠️ 둘 다 **설명이 없거나 너무 짧다**(허브는 아예 없고, 비짓제주는 평균 25~47자).
  //      그래서 «카드 본문»으로 쓰지 않는다 — 위 ALL(설명 120자↑)은 그대로 두고,
  //      여기서 온 것은 **목록·태그·사진·수치**로만 붙인다. 안 그러면 얇은 페이지가 된다.
  const HUB = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'jeju_hub.json'), 'utf8')); } catch (e) { return {}; } })();
  const VJ = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'visitjeju.json'), 'utf8')).rows || []; } catch (e) { return []; } })();

  // 비짓제주 태그·사진을 «이름»으로 기존 항목에 이어 붙인다(설명은 안 가져온다).
  const vjIdx = new Map();
  for (const o of VJ) { const k = norm(o.title); if (k && !vjIdx.has(k)) vjIdx.set(k, o); }
  for (const o of ALL) {
    const v = vjIdx.get(norm(o.title));
    if (!v) continue;
    if (!o.img && v.img) o.img = v.img;          // 사진 없는 곳 채우기
    o.vjTags = v.tags || []; o.vjIndoor = v.indoor; o.vjHours = v.hours;
  }

  // 2024년 관광지별 방문자 — 「붐빔」을 실측으로 말할 수 있는 유일한 재료다.
  const VIS = (HUB.visitors || { kor: [], frn: [] });
  const visIdx = new Map();
  for (const o of (VIS.kor || [])) visIdx.set(norm(o.name), o);
  for (const o of ALL) { const v = visIdx.get(norm(o.title)); if (v) { o.visCnt = v.cnt; o.visPay = v.pay; } }

  const GO = ['관광지', '문화시설', '레포츠'];
  const spot = bySort(ALL.filter(o => GO.includes(o.cat) || o.src === 'mtn' || o.src === 'valley'));
  const cafe = bySort(ALL.filter(o => o.src === 'cafe'));
  const oreum = bySort(ALL.filter(o => o.src === 'mtn' || /오름/.test(o.title)));

  // 🆕 허브 위치형 3종 — 설명이 없으므로 «표 형태 목록»으로만 쓴다.
  const hubList = (arr, exclude) => {
    const have = new Set(exclude.map(o => norm(o.title)));
    return (arr || []).filter(o => o.title && o.x && o.y && !have.has(norm(o.title)))
      .map(o => ({ ...o, em: eupmyeon({ addr: o.addrJibun || o.addr }), side: side({ addr: o.addrJibun || o.addr }) }))
      .sort((a, b) => a.title.localeCompare(b.title, 'ko'));
  };
  const oreumMore = hubList(HUB.oreum, oreum);                 // 설명 있는 오름 밖의 나머지
  const museum = hubList(HUB.museum, []);
  const camping = hubList(HUB.camping, []);
  const olle = (HUB.olle || []).slice().sort((a, b) =>
    (parseInt(a.no) || 999) - (parseInt(b.no) || 999) || a.no.localeCompare(b.no, 'ko'));
  const dulle = (HUB.dulle || []).slice().sort((a, b) => (b.km || 0) - (a.km || 0));
  // 「비 와도 되는 곳」 — 비짓제주 실내 태그 × 우리 날씨. ⚠️ 「모름」을 실내로 밀어넣지 않는다.
  const indoor = VJ.filter(o => o.indoor === true && o.x && o.y)
    .sort((a, b) => (b.img ? 1 : 0) - (a.img ? 1 : 0) || a.title.localeCompare(b.title, 'ko'));
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
.jj-tbl{width:100%;border-collapse:collapse;font-size:.9rem;margin:10px 0}
.jj-tbl th,.jj-tbl td{border-bottom:1px solid #ece7de;padding:9px 10px;text-align:left;vertical-align:top}
.jj-tbl th{background:#fff8ef;color:#9a5a06;font-weight:800;white-space:nowrap}
.jj-tbl td b{color:#111827}
.jj-wrapx{overflow-x:auto;-webkit-overflow-scrolling:touch}
.jj-cols{columns:2 220px;column-gap:22px;font-size:.92rem;line-height:1.95;color:#374151;margin:10px 0}
.jj-cols div{break-inside:avoid}
.jj-cols i{color:#9aa3af;font-style:normal;font-size:.86rem}
.jj-wc{display:inline-block;background:#e6f2ff;color:#0b5ea8;font-size:.78rem;font-weight:800;border-radius:6px;padding:2px 7px;margin-left:5px}
.jj-in{display:inline-block;background:#eef7ee;color:#2f6b34;font-size:.78rem;font-weight:800;border-radius:6px;padding:2px 7px;margin-right:4px}
</style>`;

  const PAGES = [
    ['', '🍊 제주 전체'], ['spot', '📍 가볼만한 곳'], ['east', '🌅 동쪽'], ['west', '🌇 서쪽'],
    ['cafe', '☕ 카페'], ['oreum', '⛰ 오름'], ['beach', '🏖 해수욕장'],
    ['museum', '🏛 박물관·미술관'], ['camping', '⛺ 캠핑장'], ['olle', '🥾 올레길'], ['rainy', '🌧 비 올 때'],
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
  // ⚠️ 제목·설명의 숫자는 «페이지에 실제로 실린 수»와 같아야 한다.
  //    처음엔 설명 있는 76곳만 세어 「76곳」이라 적었는데 페이지에는 376곳이 실려 있었다.
  const oreumTot = oreum.length + oreumMore.length;
  if (oreum.length >= 20) mk('oreum',
    `제주 오름 ${MN[mn]} — 오름 ${oreumTot}곳 총정리 | ${SITE_NAME}`,
    `제주 오름 ${oreumTot}곳을 읍·면별로 정리했습니다. 설명이 있는 ${oreum.length}곳은 사진·날씨와 함께, 나머지는 이름과 위치로 보여 드립니다.`,
    `⛰ 제주 오름 ${oreumTot}곳`,
    `제주 <b>오름</b> ${oreumTot}곳입니다. 오름은 제주 화산섬에만 있는 작은 화산체로, 대부분 <b>30분~1시간</b>이면 오르내립니다.
바람이 세면 능선이 위험하니 <b>오늘 날씨</b>를 꼭 보고 나서세요 — 그래서 카드마다 붙여 뒀습니다.`,
    'oreum',
    `${emLine(oreum)}${grid(oreum, 80)}
${oreumMore.length ? `<h2 class="sec">그 밖의 오름 ${oreumMore.length}곳</h2>
<p class="jj-lead">제주에는 오름이 <b>360개가 넘습니다</b>. 위에 실은 ${oreum.length}곳은 <b>설명이 등록된</b> 오름이고,
아래는 <b>이름과 위치만</b> 확인된 나머지 <b>${oreumMore.length}곳</b>입니다 — 빠뜨린 게 아니라 <b>공공데이터에 설명이 없어서</b>입니다.<br>
「보롬이」·「가메창」·「마흐니」처럼 <b>이름이 오름으로 끝나지 않는 것도 전부 오름</b>입니다. 제주어 이름이라 그렇습니다.</p>
<div class="jj-cols">${oreumMore.map(o => `<div>· ${esc(o.title)} <i>${esc(o.em || (String(o.addr).includes('서귀포') ? '서귀포시' : '제주시'))}</i></div>`).join('')}</div>` : ''}
${SRC_NOTE}`);

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

  // ═══ 🆕 2026-09-04 저녁 신설 4장 ═══
  //   ⚠️ 여기 재료는 «설명이 없다». 그래서 카드가 아니라 **표·목록**으로 만든다.
  //      설명 없는 카드를 수백 개 늘리면 얇은 페이지가 된다(애드센스 심사 중이라 특히).

  // ── ⑧ 박물관·미술관 (제주박물관 6,690 + 제주미술관 4,310 = 11,000)
  //   설명 있는 우리 항목 + 허브 129곳(설명 없음)을 «카드 + 표»로 나눠 싣는다.
  const musCards = bySort(ALL.filter(o => /박물관|미술관|전시관|갤러리|기념관/.test(o.title)));
  if (musCards.length + museum.length >= 40) {
    const tot = musCards.length + museum.length;
    mk('museum',
      `제주 박물관·미술관 ${MN[mn]} — ${tot}곳 총정리 | ${SITE_NAME}`,
      `제주도 박물관·미술관 ${tot}곳을 읍·면별로 정리했습니다. 설명이 있는 ${musCards.length}곳은 사진과 함께, 나머지는 주소·지역과 함께 보여 드립니다.`,
      `🏛 제주 박물관·미술관 ${tot}곳`,
      `제주도 박물관·미술관 <b>${tot}곳</b>입니다. 비 오는 날에 특히 찾게 되는 곳이라 <b>오늘 날씨</b>를 함께 붙였습니다.<br>
설명이 등록된 <b>${musCards.length}곳</b>은 사진과 함께 아래에 자세히 싣고, 나머지 <b>${museum.length}곳</b>은
<b>이름과 위치만</b> 표로 정리했습니다 — <b>공공데이터에 설명이 없어서</b>지, 빠뜨린 게 아닙니다.`,
      'museum',
      `${musCards.length ? `<h2 class="sec">설명이 있는 곳 ${musCards.length}</h2>${grid(musCards, 60)}` : ''}
${museum.length ? `<h2 class="sec">그 밖의 박물관·미술관 ${museum.length}곳</h2>
<p class="jj-note" style="margin-top:0">아래는 <b>이름·위치만</b> 확인된 곳입니다. 카카오 위치 데이터 기준이라 관람 시간·요금은 각 시설에 확인하세요.</p>
<div class="jj-cols">${museum.map(o => `<div>· ${esc(o.title)} <i>${esc(o.em || (String(o.addr).includes('서귀포') ? '서귀포시' : '제주시'))}</i></div>`).join('')}</div>` : ''}
${SRC_NOTE}`);
  }

  // ── ⑨ 캠핑장 (제주캠핑장 2,330) — 지금 우리 재고가 0곳이라 «전부» 새 것이다
  if (camping.length >= 30) mk('camping',
    `제주 캠핑장 ${MN[mn]} — 캠핑 가능한 곳 ${camping.length}곳 | ${SITE_NAME}`,
    `제주도에서 캠핑 가능한 장소 ${camping.length}곳을 읍·면별로 정리했습니다. 위치와 오늘 날씨를 함께 확인하세요.`,
    `⛺ 제주 캠핑장 ${camping.length}곳`,
    `제주도에서 <b>캠핑이 가능한 장소 ${camping.length}곳</b>입니다.
⚠️ 공공 위치 데이터라 <b>이름과 위치</b>까지입니다 — 예약 방법·요금·시설은 각 캠핑장에 확인하세요.
캠핑은 날씨가 곧 성패라 <b>주간 예보</b>를 먼저 보시길 권합니다.`,
    'camping',
    // ⚠️ 「주간 예보를 보라」고 써 놓고 날씨를 안 붙이면 말과 화면이 어긋난다 — 표에도 오늘 날씨를 넣는다.
    `<div class="jj-wrapx"><table class="jj-tbl"><thead><tr><th>이름</th><th>지역</th><th>오늘 날씨</th><th>주소</th></tr></thead><tbody>
${camping.map(o => `<tr><td><b>${esc(o.title)}</b></td><td>${esc(o.em || (String(o.addr).includes('서귀포') ? '서귀포시' : '제주시'))}</td><td>${(WX && o.x && o.y) ? WX.now(String(o.x), String(o.y)) : '-'}</td><td>${esc(String(o.addr).slice(0, 46))}</td></tr>`).join('')}
</tbody></table></div>${SRC_NOTE}`);

  // ── ⑩ 올레길·둘레길 (제주올레길 8,680 · 한라산둘레길 2,200 · 한라산등산코스 19,730)
  //   ⭐ 이 데이터가 이번에 받은 것 중 제일 좋다 — **휠체어 가능 여부 · 거리 · 예상 소요시간**이 다 있다.
  if (olle.length >= 10) {
    const wc = olle.filter(o => o.wheelchair).length;
    const totKm = Math.round(olle.reduce((a, b) => a + (b.km || 0), 0));
    mk('olle',
      `제주 올레길 ${MN[mn]} — ${olle.length}개 코스 거리·소요시간 총정리 | ${SITE_NAME}`,
      `제주 올레길 ${olle.length}개 코스를 거리(km)·예상 소요시간·시작점·종점으로 정리했습니다. 휠체어로 갈 수 있는 코스 ${wc}개도 표시했습니다.`,
      `🥾 제주 올레길 ${olle.length}개 코스`,
      `제주 올레길 <b>${olle.length}개 코스</b>를 <b>거리·예상 소요시간·시작점·종점</b>까지 한 표에 담았습니다. 전부 합치면 <b>약 ${totKm}km</b>입니다.<br>
⭐ <b>휠체어로 갈 수 있는 코스 ${wc}개</b>에는 <span class="jj-wc">♿ 휠체어</span> 표시를 붙였습니다 — 제주올레가 직접 지정한 값입니다.<br>
걷는 날 비가 오면 하루가 통째로 바뀌니 <b>주간 날씨</b>를 먼저 보세요.`,
      'olle',
      `<div class="jj-wrapx"><table class="jj-tbl"><thead><tr><th>코스</th><th>이름</th><th>거리</th><th>소요</th><th>시작 → 종점</th></tr></thead><tbody>
${olle.map(o => `<tr><td><b>${esc(o.no)}</b></td>
<td>${esc(o.name)}${o.wheelchair ? '<span class="jj-wc">♿ 휠체어</span>' : ''}</td>
<td>${o.km ? esc(o.km) + 'km' : '-'}</td><td>${o.hours ? esc(o.hours) + '시간' : '-'}</td>
<td>${esc(o.start || '')} → ${esc(o.end || '')}${(WX && o.sx && o.sy) ? WX.now(o.sx, o.sy) : ''}</td></tr>`).join('')}
</tbody></table></div>
${dulle.length ? `<h2 class="sec">한라산 둘레길 ${dulle.length}개 코스</h2>
<p class="jj-lead">한라산 <b>둘레</b>를 도는 길입니다. 정상에 오르는 등산로와는 다릅니다 — 숲길이라 경사가 완만합니다.</p>
<div class="jj-wrapx"><table class="jj-tbl"><thead><tr><th>코스</th><th>거리</th><th>시작 → 종점</th></tr></thead><tbody>
${dulle.map(o => `<tr><td><b>${esc(o.name)}</b></td><td>${o.km ? esc(o.km) + 'km' : '-'}</td><td>${esc(o.start || '')} → ${esc(o.end || '')}</td></tr>`).join('')}
</tbody></table></div>` : ''}
<p class="jj-note">데이터 출처: <b>제주올레</b>(올레길 코스·거리·소요시간·휠체어 여부) · <b>제주특별자치도</b>(한라산 둘레길) · Open-Meteo(날씨).
⚠️ 소요 시간은 <b>보통 걸음 기준</b>이라 사람마다 다릅니다. 기상·통제 상황은 출발 전 제주올레와 한라산국립공원에 확인하세요.</p>`);
  }

  // ── ⑪ 비 올 때 (제주날씨 1,629,300 — 날씨를 보러 온 사람에게 «갈 곳»을 준다)
  //   ⭐ 우리만 되는 조합: 비짓제주의 «실내» 태그 × 우리가 이미 붙인 날씨.
  //   ⚠️ 태그가 「모름」인 곳을 실내로 밀어넣지 않는다 — 비 오는 날 헛걸음이 제일 나쁘다.
  if (indoor.length >= 30) mk('rainy',
    `제주 비 올 때 갈 곳 ${MN[mn]} — 실내 ${indoor.length}곳 | ${SITE_NAME}`,
    `제주도에서 비 올 때 갈 만한 실내 장소 ${indoor.length}곳. 관광공사가 실내로 분류한 곳만 골랐고 오늘 날씨를 함께 보여 드립니다.`,
    `🌧 제주, 비 올 때 갈 곳 ${indoor.length}곳`,
    `제주 여행에서 제일 아쉬운 게 비입니다. 그래서 <b>실내로 등록된 곳만</b> 골라 모았습니다 — <b>${indoor.length}곳</b>.<br>
⚠️ 제주관광공사 데이터에 <b>「실내」라고 표시된 곳만</b> 넣었습니다. 표시가 없는 곳은 실내일 수도 있지만
<b>확실하지 않아 뺐습니다</b> — 비 오는 날 헛걸음이 제일 아깝기 때문입니다.`,
    'rainy',
    `${(() => {
      const c = {}; indoor.forEach(o => { const k = o.region || '기타'; c[k] = (c[k] || 0) + 1; });
      const t = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 12);
      return t.length ? `<p class="jj-em">지역별: ${t.map(([k, n]) => `${esc(k)} <b>${n}</b>`).join(' · ')}</p>` : '';
    })()}
<div class="jj-grid">${indoor.slice(0, 80).map(p => {
      const wx = (WX && p.x && p.y) ? WX.now(String(p.x), String(p.y)) : '';
      return `<div class="jj-card">
${p.img ? `<img class="jj-img" src="${esc(p.img)}" alt="${esc(p.title)}" loading="lazy" onerror="this.remove()">` : ''}
<div class="jj-body"><h3>${esc(p.title)}</h3>
<p class="jj-meta"><span class="jj-in">🏠 실내</span>${p.hours ? `⏱ ${esc(p.hours)} ` : ''}${p.airport ? '✈️ 공항 근처' : ''}</p>
<p class="jj-meta">📍 ${esc(p.region || '제주')}${wx}</p>
${p.sub ? `<p class="jj-desc">${esc(p.sub)}</p>` : ''}
${(p.tags || []).length ? `<p class="jj-meta">${p.tags.slice(0, 5).map(t => `<span class="jj-tag">${esc(t)}</span>`).join('')}</p>` : ''}
${p.tel ? `<p class="jj-meta">☎️ ${esc(p.tel)}</p>` : ''}
</div></div>`;
    }).join('')}</div>
<p class="jj-note">데이터 출처: <b>비짓제주 관광정보 오픈API</b>(제주관광공사) — 장소·실내 여부·소요시간·사진 · Open-Meteo(날씨).
⚠️ 「실내」는 <b>관광공사가 붙인 분류</b>이고, 일부만 실내인 곳도 있습니다. 운영 시간과 휴무는 각 시설에 확인하세요.</p>`);

  // ── ⑦ 허브 (제주도여행 154,700 · 제주여행 24,480 · 제주도관광 28,150)
  // 🆕 2024년 방문자 실측 — 「붐빔」을 추측이 아니라 숫자로 말한다.
  const busy = (VIS.kor || []).slice(0, 12);
  const busyBlock = busy.length ? `<h2 class="sec">${VIS.year}년에 사람이 가장 많았던 곳</h2>
<p class="jj-lead">제주도가 집계한 <b>${VIS.year}년 관광지별 입장객 수</b>입니다. 붐비는 곳을 피하고 싶을 때도, 놓치기 싫을 때도 기준이 됩니다.
${busy.filter(o => o.pay === '무료').length ? `표시된 곳 중 <b>무료 ${busy.filter(o => o.pay === '무료').length}곳</b>이 있습니다.` : ''}</p>
<div class="jj-wrapx"><table class="jj-tbl"><thead><tr><th>순위</th><th>관광지</th><th>${VIS.year}년 입장객</th><th>요금</th></tr></thead><tbody>
${busy.map((o, i) => `<tr><td>${i + 1}</td><td><b>${esc(o.name)}</b></td><td>${o.cnt.toLocaleString()}명</td><td>${esc(o.pay || '-')}</td></tr>`).join('')}
</tbody></table></div>
<p class="jj-note">데이터 출처: 제주데이터허브 「관광지별 내국인 유입자 수」(${VIS.year}년 월별 합계). ⚠️ <b>집계 대상 관광지 ${(VIS.kor || []).length}곳</b>에 한한 숫자이고, 집계에 없는 곳은 여기 나오지 않습니다.</p>` : '';

  const hub = `<div class="jj-stat">
<div><b>${spot.length}</b>가볼만한 곳</div><div><b>${cafe.length}</b>카페</div><div><b>${oreum.length + oreumMore.length}</b>오름</div>
<div><b>${beach.length}</b>해수욕장</div><div><b>${museum.length + musCards.length}</b>박물관·미술관</div><div><b>${camping.length}</b>캠핑장</div>
<div><b>${olle.length}</b>올레 코스</div><div><b>${indoor.length}</b>비 올 때</div>
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
<p style="margin:10px 0"><a href="/jeju/oreum/" style="color:#c2700a;font-weight:800">제주 오름 ${oreum.length + oreumMore.length}곳 전체 보기 →</a></p>
${busyBlock}
${olle.length ? `<h2 class="sec">올레길·둘레길</h2>
<p class="jj-lead">올레길 <b>${olle.length}개 코스</b>의 거리·소요시간을 한 표에 모았고, <b>휠체어로 갈 수 있는 코스 ${olle.filter(o => o.wheelchair).length}개</b>를 따로 표시했습니다.</p>
<p style="margin:10px 0"><a href="/jeju/olle/" style="color:#c2700a;font-weight:800">올레길 ${olle.length}개 코스 표로 보기 →</a></p>` : ''}
${indoor.length >= 30 ? `<h2 class="sec">비가 온다면</h2>
<p class="jj-lead">제주는 비가 잦습니다. <b>실내로 등록된 ${indoor.length}곳</b>만 따로 모아 뒀습니다.</p>
<p style="margin:10px 0"><a href="/jeju/rainy/" style="color:#c2700a;font-weight:800">비 올 때 갈 곳 ${indoor.length}곳 →</a></p>` : ''}
<h2 class="sec">제주에서 더 보기</h2>
<div class="jj-nav"><a href="/jangteo/jeju/">🏮 제주 오일장</a><a href="/trails/area/jeju/">🥾 제주 올레·걷기길</a>
<a href="/accessible/jeju/">♿ 무장애 여행</a><a href="/pet/jeju/">🐕 반려견 동반</a>
<a href="/search/?region=제주">🔎 제주 축제 검색</a></div>
<h2 class="sec">다른 도시</h2>
<div class="jj-nav"><a href="/seoul/">🏙 서울</a><a href="/busan/">🌊 부산</a><a href="/en/jeju/">🌏 English</a><a href="/ja/jeju/">🇯🇵 日本語</a></div>
${SRC_NOTE}`;

  mk('', `제주 가볼만한 곳·카페·오름 ${MN[mn]} — ${spot.length + cafe.length + oreumTot}곳 총정리 | ${SITE_NAME}`,
    `제주도 여행 정보를 한곳에. 가볼만한 곳 ${spot.length}곳, 카페 ${cafe.length}곳, 오름 ${oreum.length}곳을 동쪽·서쪽으로 나눠 정리했습니다. 오늘 날씨까지 함께.`,
    `🍊 제주 — 가볼만한 곳·카페·오름`,
    `제주도에서 <b>지금 갈 만한 곳</b>을 한곳에 모았습니다. 가볼만한 곳 ${spot.length}곳 · 카페 ${cafe.length}곳 · 오름 ${oreum.length}곳 · 해수욕장 ${beach.length}곳.
전부 <b>공공데이터에 설명이 등록된 곳</b>이고, 좌표가 있는 곳은 <b>오늘 날씨</b>가 함께 나옵니다.`,
    '', hub);

  console.log(`✓ /jeju/ — ${urls.length}페이지 (가볼만한곳 ${spot.length} · 카페 ${cafe.length} · 오름 ${oreum.length}+${oreumMore.length} · 해수욕장 ${beach.length} · 동 ${east.length} · 서 ${west.length} · 사진 ${ALL.filter(o => o.img).length}/${ALL.length})`);
  console.log(`   신규: 박물관 ${musCards.length}+${museum.length} · 캠핑 ${camping.length} · 올레 ${olle.length}코스(휠체어 ${olle.filter(o => o.wheelchair).length}) · 둘레길 ${dulle.length} · 실내 ${indoor.length} · ${VIS.year || '?'}년 붐빔 ${(VIS.kor || []).length}곳`);
  if (beach.length < 12) console.log('   ⚠️ 해수욕장 ' + beach.length + '곳 — 재료 게이트 미달로 페이지를 만들지 않았습니다');
  // 새 재료가 «통째로 비면» 조용히 넘어가지 않는다 — 수집기가 실패했을 때 알아채야 한다.
  if (!olle.length) console.log('   🔴 올레길 0건 — data/jeju_hub.json 이 없거나 수집이 실패했습니다');
  if (!VJ.length) console.log('   🔴 비짓제주 0건 — data/visitjeju.json 이 없거나 수집이 실패했습니다');
  else if (indoor.length < 30) console.log(`   ⚠️ 실내 ${indoor.length}곳뿐 — /jeju/rainy/ 를 만들지 않았습니다`);
  return urls;
}

module.exports = { build };
