// 🏙 서울 문화행사 페이지 — /seoul/ 와 그 하위
//
// 왜 이 구성인가 (2026-09-04 네이버 월간 검색량 실측)
//   같은 이름을 쓰는 경쟁사(travel-info.co.kr)가 「오늘 홍대 행사」·「주말 서울 무료 전시」 같은
//   상황형 랜딩을 깔아 뒀길래 따라가려다, 검색량을 재보니 **그쪽이 노리는 말은 수요가 거의 없었다**:
//     서울문화행사 80 · 홍대행사 200 · 서울주말행사 350 · 오늘서울행사 940 · 서울무료전시 1,210
//   진짜 큰 건 따로 있었다:
//     ⭐ **서울전시회 92,800** · 서울전시 26,020 · **서울공연 17,430** · **서울축제 15,880**
//     그리고 **「서울전시회8월」 14,680** — 우리가 이미 제일 잘하는 «월 조합 롱테일»이다.
//   → 상황형 랜딩은 만들지 않는다. **전시 / 공연 / 축제 / 무료 + 월 조합**으로 간다.
//
// 왜 서울·부산·제주인가
//   코리(KORY) 상품 지역이 **한국·서울·부산·제주** 4종이다(6제품 × 4지역 = 24 SKU).
//   ⭐ 그리고 축제모아가 가진 관광공사 방문자 실측에서 외국인 방문은 **서울 984만 · 부산 406만 · 제주 213만** —
//     장남 님이 말한 순서(서울 → 부산 → 제주)가 실측과 맞는다.
//
// ⚠️ 데이터: 서울열린데이터광장 `culturalEventInfo`. 지어내지 않는다 — 요금·시간·대상은 원본 그대로 싣고,
//    없으면 «없다»고 둔다(빈칸을 추측으로 채우지 않는다).
// ⚠️ 상품(쿠웅샵)은 붙이지 않는다. 이 페이지들은 「서울 뭐 하지」로 들어오는 사람을 받는 정보 페이지다.
const fs = require('fs'), path = require('path');

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 원본 분류(CODENAME)를 우리 4묶음으로 — 검색어에 맞춘 묶음이지 원본을 바꾸는 게 아니다.
const GROUP = {
  '전시/미술': 'exhibition',
  '콘서트': 'performance', '클래식': 'performance', '국악': 'performance',
  '뮤지컬/오페라': 'performance', '연극': 'performance', '무용': 'performance', '독주/독창회': 'performance',
  '축제-문화/예술': 'festival', '축제-전통/역사': 'festival', '축제-시민화합': 'festival',
  '축제-자연/경관': 'festival', '축제-기타': 'festival'
};
const G = {
  exhibition: { name: '전시회', emoji: '🖼', h1: '서울 전시회', kw: '서울전시회·서울전시' },
  performance: { name: '공연', emoji: '🎭', h1: '서울 공연', kw: '서울공연·서울콘서트' },
  festival: { name: '축제', emoji: '🎪', h1: '서울 축제', kw: '서울축제·서울행사' },
  etc: { name: '교육·체험 등', emoji: '🧩', h1: '서울 교육·체험 행사', kw: '' }
};
const MN = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

const fmt = s => /^\d{8}$/.test(s) ? `${+s.slice(4, 6)}월 ${+s.slice(6, 8)}일` : '';
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const wd = s => /^\d{8}$/.test(s) ? WD[new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)).getDay()] : '';
const range = r => r.start === r.end
  ? `${fmt(r.start)}(${wd(r.start)})`
  : `${fmt(r.start)}(${wd(r.start)}) ~ ${fmt(r.end)}(${wd(r.end)})`;

function build({ ROOT, layout, writePage, SITE, SITE_NAME, TODAY, WX }) {
  let db;
  try { db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'seoul_events.json'), 'utf8')); }
  catch (e) { console.log('⚠ seoul_events.json 없음 — /seoul/ 건너뜀 (node fetch-seoul.js 먼저)'); return []; }

  const T8 = String(TODAY).replace(/-/g, '');
  const rows = (db.rows || []).map(r => ({ ...r, g: GROUP[r.cat] || 'etc' }));
  const live = rows.filter(r => r.end >= T8).sort((a, b) => a.start.localeCompare(b.start));
  if (live.length < 20) { console.log(`⚠ 서울 진행·예정 ${live.length}건뿐 — /seoul/ 건너뜀(얇은 페이지를 만들지 않는다)`); return []; }

  const urls = [];
  const byG = g => live.filter(r => r.g === g);
  const freeRows = live.filter(r => r.free);

  // ── 카드 하나
  const card = r => {
    // 🌤 야외인 축제만 날씨를 붙인다 — 전시·공연은 실내라 날씨가 «갈지 말지»를 안 바꾼다.
    const wx = (r.g === 'festival' && WX && r.x && r.y) ? WX.now(r.x, r.y) : '';
    return `<div class="se-card">
${r.img ? `<img class="se-img" src="${esc(r.img)}" alt="${esc(r.title)}" loading="lazy" onerror="this.remove()">` : ''}
<div class="se-body">
<h3>${esc(r.title)}</h3>
<p class="se-meta">📅 ${esc(range(r))}${wx}</p>
<p class="se-meta">📍 ${esc(r.gu || '서울')}${r.place ? ' · ' + esc(r.place) : ''}</p>
<p class="se-meta">${r.free ? '<b class="se-free">무료</b>' : (r.fee ? '💳 ' + esc(String(r.fee).slice(0, 60)) : '')}${r.time ? ' · 🕘 ' + esc(String(r.time).slice(0, 40)) : ''}${r.target ? ' · 👥 ' + esc(String(r.target).slice(0, 30)) : ''}</p>
${r.desc ? `<p class="se-desc">${esc(String(r.desc).slice(0, 220))}</p>` : ''}
${r.link ? `<a class="se-link" href="${esc(r.link)}" target="_blank" rel="noopener nofollow">공식 안내 →</a>` : ''}
</div></div>`;
  };

  const CSS = `<style>
.se-h1{font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:8px 0 6px}
.se-lead{color:#374151;font-size:1rem;line-height:1.8;margin:0 0 12px}
.se-nav{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 18px}
.se-nav a,.se-nav span{display:inline-block;padding:9px 15px;border-radius:22px;font-weight:800;font-size:.92rem;text-decoration:none}
.se-nav a{background:#fff;border:1.5px solid #dfe6ea;color:#374151}
.se-nav span{background:#0f9d8f;color:#fff}
.se-stat{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0 6px}
.se-stat b{display:block;font-size:1.25rem;color:#0a6c63}
.se-stat div{background:#f4faf8;border:1.5px solid #dcefeb;border-radius:12px;padding:10px 16px;font-size:.86rem;color:#0a6c63;font-weight:700}
.se-grid{display:grid;gap:13px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.se-card{background:#fff;border:1px solid #e6eaee;border-radius:14px;overflow:hidden;display:flex;flex-direction:column}
.se-img{width:100%;height:150px;object-fit:cover}
.se-body{padding:12px 14px}
.se-body h3{font-size:1rem;font-weight:800;margin:0 0 6px;line-height:1.45;color:#111827}
.se-meta{font-size:.86rem;color:#6b7280;margin:0 0 4px;line-height:1.6}
.se-free{background:#e7f6f3;color:#0a6c63;border-radius:6px;padding:1px 7px;font-size:.82rem}
.se-desc{font-size:.88rem;color:#374151;line-height:1.7;margin:6px 0 8px}
.se-link{color:#0c7d72;font-weight:800;font-size:.87rem}
.se-note{color:#9aa3af;font-size:.82rem;line-height:1.7;margin-top:16px}
.se-gu{color:#6b7280;font-size:.93rem;line-height:1.9;margin:6px 0 0}
</style>`;

  const nav = cur => `<div class="se-nav">
${['', 'exhibition', 'performance', 'festival', 'free'].map(k => {
    const label = k === '' ? '🏙 서울 전체' : k === 'free' ? '🆓 무료' : `${G[k].emoji} ${G[k].name}`;
    const href = k === '' ? '/seoul/' : `/seoul/${k}/`;
    return cur === k ? `<span>${label}</span>` : `<a href="${href}">${label}</a>`;
  }).join('')}</div>`;

  const guLine = list => {
    const c = {}; list.forEach(r => { if (r.gu) c[r.gu] = (c[r.gu] || 0) + 1; });
    const top = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 12);
    return top.length ? `<p class="se-gu">자치구별: ${top.map(([k, n]) => `${esc(k)} <b>${n}</b>`).join(' · ')}</p>` : '';
  };

  const srcNote = `<p class="se-note">데이터 출처: <b>서울열린데이터광장 「서울시 문화행사 정보」</b>(서울특별시). 기준일 ${esc(db.generated || TODAY)}.
요금·운영시간·대상은 원본에 등록된 값을 그대로 싣고, <b>등록돼 있지 않으면 비워 둡니다</b> — 추측해서 채우지 않습니다.
일정과 예약 여부는 바뀔 수 있으니 방문 전 각 행사의 공식 안내를 확인하세요.</p>`;

  // ── ① 묶음별 페이지
  for (const key of ['exhibition', 'performance', 'festival']) {
    const list = byG(key);
    if (list.length < 15) { console.log(`  · /seoul/${key}/ 는 ${list.length}건뿐이라 만들지 않았습니다`); continue; }
    const free = list.filter(r => r.free).length;
    const g = G[key];
    const content = `<main><div class="wrap">${CSS}
<p style="font-size:.85rem;color:#9aa3af;margin:8px 0"><a href="/" style="color:#0c7d72">홈</a> › <a href="/seoul/" style="color:#0c7d72">서울</a> › ${esc(g.name)}</p>
<h1 class="se-h1">${g.emoji} ${esc(g.h1)} — 지금 볼 수 있는 ${list.length}개</h1>
<p class="se-lead">서울에서 <b>오늘 이후에 열리는 ${esc(g.name)}</b> ${list.length}개를 모았습니다. 서울시가 공개한 문화행사 정보를 날짜순으로 정리했고, <b>무료 ${free}개</b>가 포함돼 있습니다.</p>
${nav(key)}
<div class="se-stat"><div><b>${list.length}</b>지금 볼 수 있는 ${esc(g.name)}</div><div><b>${free}</b>무료</div><div><b>${new Set(list.map(r => r.gu).filter(Boolean)).size}</b>자치구</div></div>
${guLine(list)}
<h2 class="sec">날짜순으로 보기</h2>
<div class="se-grid">${list.map(card).join('')}</div>
${srcNote}
<p style="margin-top:14px"><a href="/seoul/" style="color:#0c7d72;font-weight:800">← 서울 전체 보기</a></p>
</div></main>`;
    writePage('seoul/' + key, layout(
      `${g.h1} ${MN[+T8.slice(4, 6)]} — 지금 하는 ${esc(g.name)} ${list.length}개 총정리 | ${SITE_NAME}`,
      `서울에서 지금 볼 수 있는 ${g.name} ${list.length}개(무료 ${free}개)를 날짜·자치구·요금으로 정리했습니다. 서울시 공개 문화행사 정보 기준.`,
      `/seoul/${key}/`, content));
    urls.push(`/seoul/${key}/`);
  }

  // ── ② 무료
  if (freeRows.length >= 15) {
    const content = `<main><div class="wrap">${CSS}
<p style="font-size:.85rem;color:#9aa3af;margin:8px 0"><a href="/" style="color:#0c7d72">홈</a> › <a href="/seoul/" style="color:#0c7d72">서울</a> › 무료</p>
<h1 class="se-h1">🆓 서울 무료 전시·공연·행사 ${freeRows.length}개</h1>
<p class="se-lead">서울에서 <b>입장료 없이</b> 볼 수 있는 행사 ${freeRows.length}개입니다. ⚠️ 입장이 무료여도 <b>체험비·예약 수수료·주차비는 따로</b>인 경우가 있어, 요금 설명이 등록된 행사는 원문을 그대로 함께 실었습니다.</p>
${nav('free')}
${guLine(freeRows)}
<div class="se-grid">${freeRows.map(card).join('')}</div>
${srcNote}
</div></main>`;
    writePage('seoul/free', layout(
      `서울 무료 전시·공연 ${MN[+T8.slice(4, 6)]} — 지금 하는 무료 행사 ${freeRows.length}개 | ${SITE_NAME}`,
      `서울에서 입장료 없이 볼 수 있는 전시·공연·행사 ${freeRows.length}개를 정리했습니다. 자치구·기간·운영시간까지 서울시 공개 데이터 기준.`,
      '/seoul/free/', content));
    urls.push('/seoul/free/');
  }

  // ── ③ 월별 (⭐「서울전시회8월」 같은 월 조합이 실측에서 가장 큰 롱테일이었다)
  const months = [...new Set(live.map(r => r.start.slice(0, 6)).concat(live.map(r => T8.slice(0, 6))))]
    .filter(m => m >= T8.slice(0, 6)).sort().slice(0, 3);
  for (const ym of months) {
    const mStart = ym + '01';
    const mEnd = ym + String(new Date(+ym.slice(0, 4), +ym.slice(4, 6), 0).getDate());
    const list = live.filter(r => r.start <= mEnd && r.end >= mStart).sort((a, b) => a.start.localeCompare(b.start));
    if (list.length < 20) continue;
    const y = ym.slice(0, 4), m = +ym.slice(4, 6);
    const ex = list.filter(r => r.g === 'exhibition').length, pf = list.filter(r => r.g === 'performance').length;
    const content = `<main><div class="wrap">${CSS}
<p style="font-size:.85rem;color:#9aa3af;margin:8px 0"><a href="/" style="color:#0c7d72">홈</a> › <a href="/seoul/" style="color:#0c7d72">서울</a> › ${y}년 ${MN[m]}</p>
<h1 class="se-h1">서울 ${y}년 ${MN[m]} 전시회·공연·축제 ${list.length}개</h1>
<p class="se-lead">${y}년 ${MN[m]}에 서울에서 열리는(또는 그 달에 걸쳐 있는) 문화행사 <b>${list.length}개</b>입니다. 전시 ${ex}개 · 공연 ${pf}개 · 무료 ${list.filter(r => r.free).length}개.</p>
${nav('')}
${guLine(list)}
<div class="se-grid">${list.map(card).join('')}</div>
${srcNote}
</div></main>`;
    writePage(`seoul/${y}-${String(m).padStart(2, '0')}`, layout(
      `서울 ${MN[m]} 전시회·공연 ${y} — 그 달에 열리는 행사 ${list.length}개 | ${SITE_NAME}`,
      `${y}년 ${MN[m]} 서울에서 열리는 전시회 ${ex}개·공연 ${pf}개 등 문화행사 ${list.length}개를 날짜·자치구·요금으로 정리했습니다.`,
      `/seoul/${y}-${String(m).padStart(2, '0')}/`, content));
    urls.push(`/seoul/${y}-${String(m).padStart(2, '0')}/`);
  }

  // ── ④ 허브
  const soon = live.slice(0, 12);
  const hub = `<main><div class="wrap">${CSS}
<h1 class="se-h1">🏙 서울 전시회·공연·축제 — 지금 하는 것 ${live.length}개</h1>
<p class="se-lead">서울에서 <b>오늘 이후에 열리는 문화행사 ${live.length}개</b>를 한곳에 모았습니다.
전시 ${byG('exhibition').length}개 · 공연 ${byG('performance').length}개 · 축제 ${byG('festival').length}개 · 무료 ${freeRows.length}개.
서울시가 공개한 문화행사 정보를 <b>날짜·자치구·요금</b>으로 정리했고, 없는 정보는 비워 뒀습니다.</p>
${nav('')}
<div class="se-stat">
<div><b>${live.length}</b>지금 하는 행사</div>
<div><b>${byG('exhibition').length}</b>전시</div>
<div><b>${byG('performance').length}</b>공연</div>
<div><b>${byG('festival').length}</b>축제</div>
<div><b>${freeRows.length}</b>무료</div>
</div>
${guLine(live)}
<h2 class="sec">곧 시작하는 행사</h2>
<div class="se-grid">${soon.map(card).join('')}</div>
<h2 class="sec">달별로 보기</h2>
<div class="se-nav">${months.map(ym => `<a href="/seoul/${ym.slice(0, 4)}-${ym.slice(4, 6)}/">${ym.slice(0, 4)}년 ${MN[+ym.slice(4, 6)]}</a>`).join('')}</div>
<h2 class="sec">서울 말고 다른 곳도</h2>
<div class="se-nav"><a href="/search/?region=서울">🎪 서울 축제 검색</a><a href="/">🏠 전국 축제</a><a href="/jangteo/">🏮 전국 오일장</a></div>
${srcNote}
</div></main>`;
  writePage('seoul', layout(
    `서울 전시회·공연·축제 ${MN[+T8.slice(4, 6)]} — 지금 하는 행사 ${live.length}개 | ${SITE_NAME}`,
    `서울에서 지금 볼 수 있는 전시회·공연·축제 ${live.length}개(무료 ${freeRows.length}개)를 날짜·자치구·요금으로 정리했습니다. 서울시 공개 문화행사 정보 기준, 매일 갱신.`,
    '/seoul/', hub));
  urls.push('/seoul/');

  console.log(`✓ /seoul/ — ${urls.length}페이지 (진행·예정 ${live.length}건 · 전시 ${byG('exhibition').length} · 공연 ${byG('performance').length} · 축제 ${byG('festival').length} · 무료 ${freeRows.length})`);
  return urls;
}

module.exports = { build };
