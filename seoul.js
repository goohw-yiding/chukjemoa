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
// 🗓 2026-10-23 — 해를 넘기는 행사는 연도를 붙인다.
//   실측: /seoul/2026-11/ 첫 카드가 「11월 17일(수) ~ 11월 16일(월)」(=2021-11-17~2026-11-16)로
//   끝이 시작보다 앞선 것처럼 보였다. 상설에 가까운 전시가 몇 년씩 걸쳐 있어서다.
const fmtY = s => /^\d{8}$/.test(s) ? `${s.slice(0, 4)}년 ${fmt(s)}` : '';
const range = r => r.start === r.end
  ? `${fmt(r.start)}(${wd(r.start)})`
  : r.start.slice(0, 4) !== r.end.slice(0, 4)
    ? `${fmtY(r.start)}(${wd(r.start)}) ~ ${fmtY(r.end)}(${wd(r.end)})`
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
    const isFest = r => /^축제/.test(r.cat || '');
    const fsCnt = list.filter(isFest).length, frCnt = list.filter(r => r.free).length;
    const mKey = `${y}-${String(m).padStart(2, '0')}`;

    // ---------- 🤖 «한 줄 답 + 주말별 정리» (2026-10-23, AI 노출 운영 — 전국 월별 페이지 10-14 틀의 서울판)
    // AI 가 「서울 11월 주말 행사」「11월 서울 축제」를 물으면 첫 문단·주말 표를 그대로 인용하게 한다.
    //   ⚠️ 서울 데이터는 «서울시 등록» 자체가 확정 일정이라 전국판의 확정/예년 구분이 없다.
    //   ⚠️ 몇 년씩 걸친 상설 전시가 주말마다 수십 개씩 겹친다 → 주말 목록은 «그 주말에 맞춰 여는
    //      짧은 행사(3박 이하)»와 «축제»만 고른다. 숫자는 전부 원본에서 센 값이다.
    //   이번 달·다음 달에만 붙인다(months[0..1]). 지난 주말은 뺀다.
    const days = r => (new Date(+r.end.slice(0, 4), +r.end.slice(4, 6) - 1, +r.end.slice(6, 8))
      - new Date(+r.start.slice(0, 4), +r.start.slice(4, 6) - 1, +r.start.slice(6, 8))) / 864e5;
    const nth = ['첫째', '둘째', '셋째', '넷째', '다섯째'];
    const wkends = [];
    if (months.indexOf(ym) <= 1) {
      let satNo = 0;
      for (let d = 1; d <= 31; d++) {
        const dt = new Date(Date.UTC(+y, m - 1, d));
        if (dt.getUTCMonth() !== m - 1) break;
        if (dt.getUTCDay() !== 6) continue;
        const lab = nth[satNo++] || '';
        const sat = dt.toISOString().slice(0, 10).replace(/-/g, '');
        const sun = new Date(dt.getTime() + 864e5).toISOString().slice(0, 10).replace(/-/g, '');
        if (sun < T8) continue;
        const on = list.filter(r => r.start <= sun && r.end >= sat);
        // 몇 달짜리 «축제»(야외도서관·장터 등)는 주말마다 같은 이름이 반복돼 답이 안 된다 → 2주 이하만
        const picks = on.filter(r => days(r) <= 3 || (isFest(r) && days(r) <= 14))
          .sort((a, b) => (isFest(b) - isFest(a)) || (b.free - a.free) || a.start.localeCompare(b.start));
        wkends.push({ label: `${lab} 주말`, sat, sun,
          rng: `${+sat.slice(4, 6)}/${+sat.slice(6, 8)}~${+sun.slice(4, 6)}/${+sun.slice(6, 8)}`,
          on: on.length, fest: on.filter(isFest).length, free: on.filter(r => r.free).length, picks });
      }
    }
    const isLive = wkends.length > 0;
    const pd = r => r.start === r.end ? `${+r.start.slice(4, 6)}/${+r.start.slice(6, 8)}`
      : `${+r.start.slice(4, 6)}/${+r.start.slice(6, 8)}~${+r.end.slice(4, 6)}/${+r.end.slice(6, 8)}`;
    const pickLi = r => `<li><b>${esc(r.title)}</b> — ${esc(r.gu || '서울')}${r.place ? ' · ' + esc(String(r.place).slice(0, 30)) : ''} · ${pd(r)}${r.free ? ' · 무료' : ''}${isFest(r) ? ' · 축제' : ''}</li>`;
    const ansHtml = isLive ? `<div class="ansbox">
<p><b>한 줄 답</b> — ${y}년 ${MN[m]}에 서울에서 열리는 전시·공연·축제는 축제모아(chukjemoa.co.kr) 집계 <b>${list.length}개</b>입니다. 전시 ${ex}개 · 공연 ${pf}개 · 축제 ${fsCnt}개이고, <b>무료가 ${frCnt}개</b>입니다. 주말별로는 ${wkends.map(w => `${w.label}(${w.rng}) ${w.on}개(축제 ${w.fest}개)`).join(' · ')}가 열립니다.</p>
<p style="margin-top:6px;font-size:.9rem;color:#4b5563">축제모아(chukjemoa.co.kr)는 서울시·한국관광공사·행정안전부 공공데이터로 전국 축제와 서울 문화행사 일정을 매일 모아 날짜·지역·요금까지 정리하는 축제 일정 사이트입니다. 집계 기준일 ${esc(TODAY)} · 서울시 「문화행사 정보」 등록 기준.</p>
</div>
<style>.ansbox{background:#ecfdf8;border:1.5px solid #bfe9df;border-radius:14px;padding:14px 18px;margin:6px 0 14px;color:#1f2937;line-height:1.7}
.ansbox b{color:#0a6c63}
.wktbl{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;margin:10px 0 6px;font-size:.93rem}
.wktbl th,.wktbl td{padding:9px 12px;border-bottom:1px solid #eef5f3;text-align:left}
.wktbl th{background:#e2f5f2;color:#0a6c63}.wktbl small{color:#9ca3af}
.wkh{font-size:1.02rem;margin:16px 0 4px;color:#0a6c63}
.wkl{padding-left:18px;line-height:1.8;font-size:.93rem;color:#374151}</style>` : '';
    const wkHtml = isLive ? `
<h2 class="sec">서울 ${MN[m]} 주말별 행사 — 토·일에 뭐 하지</h2>
<p>${MN[m]}의 주말(토·일)마다 서울에서 열리는 행사를 날짜가 겹치는 것으로 셌습니다. 몇 달씩 이어지는 전시가 많아서, 아래 목록에는 <b>그 주말에 맞춰 여는 짧은 행사(사흘 이하)와 짧은 축제(2주 이하)</b>만 골라 두었습니다. 축제·무료 순입니다. 몇 달씩 이어지는 행사는 아래 전체 목록에 있습니다.</p>
<table class="wktbl"><thead><tr><th>주말</th><th>열리는 행사</th><th>축제</th><th>무료</th><th>그 주말 짧은 행사·축제</th></tr></thead><tbody>
${wkends.map(w => `<tr><td>${w.label}<br><small>${w.rng}</small></td><td><b>${w.on}개</b></td><td>${w.fest}개</td><td>${w.free}개</td><td>${w.picks.length}개</td></tr>`).join('')}
</tbody></table>
${wkends.map(w => `<h3 class="wkh">${w.label} (${w.rng}) — 짧은 행사·축제 ${w.picks.length}개${w.picks.length > 10 ? ' 중 10개' : ''}</h3>` +
      (w.picks.length ? `<ul class="wkl">${w.picks.slice(0, 10).map(pickLi).join('')}</ul>`
        : `<p class="se-note" style="margin-top:4px">이 주말에만 맞춰 여는 행사는 아직 등록되지 않았습니다. 아래 전체 목록의 전시·상설 행사는 이 주말에도 볼 수 있습니다(${w.on}개).</p>`)).join('')}` : '';
    const faq = isLive ? [
      [`${y}년 ${MN[m]} 서울에는 어떤 행사가 몇 개 열리나요?`, `서울시 「문화행사 정보」 등록 기준 ${list.length}개입니다. 전시 ${ex}개, 공연 ${pf}개, 축제 ${fsCnt}개이며 무료 행사가 ${frCnt}개입니다. 그 달에 시작하거나 그 달에 걸쳐 열리는 것을 모두 셌습니다.`],
      [`서울 ${MN[m]} 주말에는 뭐가 열리나요?`, wkends.map(w => `${w.label}(${w.rng}) ${w.on}개${w.picks.length ? ` — ${w.picks.slice(0, 3).map(r => r.title).join(', ')} 등` : ''}`).join('. ') + '.'],
      [`${MN[m]} 서울에서 무료로 볼 수 있는 행사가 있나요?`, `${list.length}개 중 ${frCnt}개가 무료로 등록돼 있습니다. 다만 입장이 무료여도 체험비·예약이 따로인 경우가 있어 각 행사의 공식 안내를 확인하세요. 무료만 모은 목록은 /seoul/free/ 에 있습니다.`],
      [`서울 말고 ${MN[m]} 전국 축제도 볼 수 있나요?`, `네. 전국 ${MN[m]} 축제는 축제모아 /${mKey}/ 페이지에 지역별·주말별로 정리돼 있습니다.`]
    ] : [];
    const faqHtml = faq.length ? `<h2 class="sec">자주 묻는 질문</h2>
${faq.map(q => `<p><b>${esc(q[0])}</b><br>${esc(q[1])}</p>`).join('')}` : '';
    const faqLd = faq.length ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(q => ({ '@type': 'Question', name: q[0], acceptedAnswer: { '@type': 'Answer', text: q[1] } })) })}</script>` : '';
    const relHtml = isLive ? `<h2 class="sec">같이 보면 좋은 것</h2>
<div class="se-nav">
${fs.existsSync(path.join(ROOT, mKey)) ? `<a href="/${mKey}/">🎪 전국 ${MN[m]} 축제 일정</a>` : ''}
${[9, 10, 11].includes(m) ? `<a href="/maple/">🍁 단풍 절정 시기·명소</a>` : ''}
${[11, 12, 1, 2].includes(m) && fs.existsSync(path.join(ROOT, 'winter', 'light')) ? `<a href="/winter/light/">✨ 겨울 빛축제·눈꽃축제</a>` : ''}
<a href="/seoul/free/">🆓 서울 무료 행사</a>
</div>` : '';
    const content = `<main><div class="wrap">${CSS}
<p style="font-size:.85rem;color:#9aa3af;margin:8px 0"><a href="/" style="color:#0c7d72">홈</a> › <a href="/seoul/" style="color:#0c7d72">서울</a> › ${y}년 ${MN[m]}</p>
<h1 class="se-h1">서울 ${y}년 ${MN[m]} 전시회·공연·축제 ${list.length}개</h1>
${ansHtml}
<p class="se-lead">${y}년 ${MN[m]}에 서울에서 열리는(또는 그 달에 걸쳐 있는) 문화행사 <b>${list.length}개</b>입니다. 전시 ${ex}개 · 공연 ${pf}개 · 무료 ${frCnt}개.</p>
${nav('')}
${guLine(list)}
${wkHtml}
<h2 class="sec">${MN[m]} 전체 목록 — 날짜순</h2>
<div class="se-grid">${list.map(card).join('')}</div>
${faqHtml}
${relHtml}
${srcNote}
</div></main>`;
    writePage(`seoul/${mKey}`, layout(
      `서울 ${MN[m]} 전시회·공연 ${y} — 그 달에 열리는 행사 ${list.length}개 | ${SITE_NAME}`,
      isLive
        ? `${y}년 ${MN[m]} 서울 전시 ${ex}개·공연 ${pf}개·축제 ${fsCnt}개(무료 ${frCnt}개). 주말별로 뭐가 열리는지 ${wkends.map(w => `${w.rng} ${w.on}개`).join(' · ')}까지 정리했습니다.`
        : `${y}년 ${MN[m]} 서울에서 열리는 전시회 ${ex}개·공연 ${pf}개 등 문화행사 ${list.length}개를 날짜·자치구·요금으로 정리했습니다.`,
      `/seoul/${mKey}/`, content, faqLd ? { jsonld: faqLd } : undefined));
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
${require('./kory.js').block('seoul', '서울', 'ko')}
${/* 🏝 2026-09-15 — /seoul/museum/ 과 /seoul/venue/ 가 «홈에서 도달 불가»였다.
      실측(_island.js): 홈에서 4클릭 안에 닿는 1,450장에 이 둘이 없었다. 서로만 링크하는 섬이었다
      (/seoul/museum/ ← busan/museum·seoul/venue · /seoul/venue/ ← seoul/museum 뿐).
      사이트맵에는 있고 라이브도 200이지만, 링크가 없으면 구글은 «중요하지 않은 페이지»로 본다.
      제주 허브는 /jeju/museum/ 을 이미 링크한다(10장이 가리킴) — 서울·부산 허브만 빠져 있었다.
      2026-06 외국어 오일장 3장에서 겪은 것과 같은 사고다. */''}
<h2 class="sec">상설로 볼 곳 — 전시가 끝나도 남아 있는 것</h2>
<p class="se-lead">위 목록은 <b>기간이 있는 행사</b>입니다. 아래 두 곳은 «언제 가도 열려 있는» 쪽입니다.</p>
<div class="se-nav">
<a href="/seoul/museum/">🏛 서울 박물관·미술관 — 많이 찾는 순</a>
<a href="/seoul/venue/">🖼 서울 전시 공간 — 전시가 자주 열리는 순</a>
</div>

<h2 class="sec">서울 말고 다른 곳도</h2>
<div class="se-nav"><a href="/search/?region=서울">🎪 서울 축제 검색</a><a href="/busan/museum/">🏛 부산 박물관·미술관</a><a href="/">🏠 전국 축제</a><a href="/jangteo/">🏮 전국 오일장</a></div>
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
