// 축제모아 정적 사이트 빌드 스크립트
// 사용법: node build.js  (data/*.json 수정 후 재실행하면 페이지 재생성)
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE = 'https://chukjemoa.co.kr';
const SITE_NAME = '축제모아';
const ADSENSE = 'ca-pub-3293445488923111';
const TODAY = new Date().toISOString().slice(0, 10);

const festivals = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/festivals.json'), 'utf8'));
const markets = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/markets.json'), 'utf8'));
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/posts.json'), 'utf8'));

const MONTHS = [
  { key: '2026-07', months: [7], label: '2026년 7월', short: '7월', emoji: '💦' },
  { key: '2026-08', months: [8], label: '2026년 8월', short: '8월', emoji: '🌊' },
  { key: '2026-09', months: [9], label: '2026년 9월', short: '9월', emoji: '🎆' },
  { key: '2026-10', months: [10], label: '2026년 10월', short: '10월', emoji: '🍁' },
  { key: '2026-11', months: [11], label: '2026년 11월', short: '11월', emoji: '🌾' },
  { key: '2026-12', months: [12, 1], label: '2026년 12월~2027년 1월 겨울', short: '12월·겨울', emoji: '⛄' },
];

const CAT_EMOJI = { '물놀이': '💦', '음악': '🎵', '음식': '🍜', '꽃': '🌸', '문화': '🎭', '불꽃': '🎆', '전통': '🏮', '빛': '✨', '눈': '⛄', '기타': '🎪' };
const CAT_IMG = { '물놀이': 'water', '음악': 'music', '음식': 'food', '꽃': 'flower', '문화': 'culture', '불꽃': 'firework', '전통': 'tradition', '빛': 'light', '눈': 'snow', '기타': 'etc' };

function fmtDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return `${y}.${m}.${d}`;
}
function fmtRange(f) {
  return f.start === f.end ? fmtDate(f.start) : `${fmtDate(f.start)} ~ ${fmtDate(f.end)}`;
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function festCard(f) {
  const emoji = CAT_EMOJI[f.category] || '🎪';
  const img = CAT_IMG[f.category] || 'etc';
  const badge = f.confirmed
    ? '<span class="badge ok">일정 확정</span>'
    : '<span class="badge est">예년 기준·변동 가능</span>';
  return `<div class="card" data-region="${esc(f.region)}" data-start="${f.start}" data-end="${f.end}">
  <div class="thumb"><img src="/img/cat-${img}.webp" alt="${esc(f.category)} 축제" loading="lazy"><span class="dday"></span><span class="cat">${emoji} ${esc(f.category)}</span></div>
  <div class="card-body">
  <div class="card-top">${badge}</div>
  <h3>${esc(f.name)}</h3>
  <p class="date">📅 ${fmtRange(f)}</p>
  <p class="loc">📍 ${esc(f.region)} ${esc(f.city)} · ${esc(f.place)}</p>
  <p class="desc">${esc(f.desc)}</p>
  </div>
</div>`;
}

// 카드 D-day 배지 스크립트 (클라이언트에서 오늘 기준 계산)
const DDAY_JS = `<script>
(function(){
  const t = new Date(); t.setHours(0,0,0,0);
  document.querySelectorAll('.card[data-start]').forEach(c => {
    const s = new Date(c.dataset.start), e = new Date(c.dataset.end), el = c.querySelector('.dday');
    if (!el) return;
    const d = Math.ceil((s - t) / 86400000);
    if (t >= s && t <= e) { el.textContent = '진행중 🔥'; el.classList.add('on'); }
    else if (d > 0 && d <= 99) { el.textContent = 'D-' + d; }
    else if (t > e) { el.textContent = '종료'; el.classList.add('off'); c.classList.add('ended'); }
  });
})();
</script>`;

// 입장 불꽃놀이 효과 (세션당 1회)
const FIREWORKS_JS = `<script>
(function(){
  if (sessionStorage.getItem('fw')) return;
  sessionStorage.setItem('fw', '1');
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight;
  const colors = ['#ff6b4a','#ffd93c','#6bcB77','#4d96ff','#ff6bd6','#fff'];
  let parts = [], done = false;
  function burst(x, y) {
    const c = colors[Math.floor(Math.random()*colors.length)];
    for (let i = 0; i < 60; i++) {
      const a = Math.PI*2*i/60, v = 2+Math.random()*3;
      parts.push({x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v, life: 70+Math.random()*30, c});
    }
  }
  let n = 0;
  const iv = setInterval(() => {
    burst(cv.width*(0.15+Math.random()*0.7), cv.height*(0.15+Math.random()*0.4));
    if (++n >= 5) { clearInterval(iv); done = true; }
  }, 450);
  (function loop(){
    ctx.clearRect(0,0,cv.width,cv.height);
    parts = parts.filter(p => p.life > 0);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.life--;
      ctx.globalAlpha = Math.min(1, p.life/50);
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, 7); ctx.fill();
    });
    if (!done || parts.length) requestAnimationFrame(loop);
    else cv.remove();
  })();
})();
</script>`;

function regionFilter(list) {
  const regions = [...new Set(list.map(f => f.region))];
  const btns = regions.map(r => `<button class="rbtn" data-r="${esc(r)}">${esc(r)}</button>`).join('');
  return `<div class="filter"><button class="rbtn active" data-r="all">전체</button>${btns}</div>
<script>
document.querySelectorAll('.rbtn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.rbtn').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  const r = b.dataset.r;
  document.querySelectorAll('.card').forEach(c => {
    c.style.display = (r === 'all' || c.dataset.region === r) ? '' : 'none';
  });
}));
</script>`;
}

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Pretendard Variable',Pretendard,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#1f2937;line-height:1.65;background:#fff;letter-spacing:-.01em}
a{color:inherit;text-decoration:none}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
header{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.92);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid #f3ece6;padding:13px 0}
header .wrap{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
.logo{font-size:1.35rem;font-weight:900;color:#ff5a3c}
nav a{margin-left:20px;font-weight:600;font-size:.95rem;color:#4b5563;transition:color .15s}
nav a:hover{color:#ff5a3c}
.hero{position:relative;overflow:hidden;background:url('/img/hero.webp') center/cover;color:#fff;text-align:center}
.hero-vid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero-inner{position:relative;z-index:1;padding:88px 20px 96px;background:linear-gradient(180deg,rgba(20,10,25,.28),rgba(20,10,25,.62))}
.hero h1{font-size:clamp(1.7rem,4.2vw,2.7rem);font-weight:900;letter-spacing:-.03em;margin-bottom:12px;text-shadow:0 2px 14px rgba(0,0,0,.45)}
.hero p{font-size:clamp(.98rem,1.8vw,1.15rem);opacity:.96;text-shadow:0 1px 6px rgba(0,0,0,.45)}
.hero-cta{margin-top:26px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.hero-cta a{padding:13px 26px;border-radius:28px;font-weight:800;font-size:.98rem;transition:transform .15s}
.hero-cta a:hover{transform:translateY(-2px)}
.hero-cta .cta1{background:#ff5a3c;color:#fff;box-shadow:0 6px 18px rgba(255,90,60,.45)}
.hero-cta .cta2{background:rgba(255,255,255,.16);color:#fff;border:1.5px solid rgba(255,255,255,.65);backdrop-filter:blur(4px)}
.hero-stats{margin-top:28px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.hero-stats span{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.28);backdrop-filter:blur(4px);padding:6px 15px;border-radius:18px;font-size:.85rem;font-weight:600}
main{padding:36px 0 56px}
h2.sec{position:relative;font-size:1.45rem;font-weight:800;letter-spacing:-.02em;margin:48px 0 18px;padding-left:15px}
h2.sec::before{content:'';position:absolute;left:0;top:14%;width:5px;height:72%;background:linear-gradient(180deg,#ff5a3c,#ff9a3c);border-radius:4px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}
.card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 3px 14px rgba(31,41,55,.08);transition:transform .2s,box-shadow .2s}
.card:hover{transform:translateY(-5px);box-shadow:0 12px 28px rgba(31,41,55,.14)}
.card .card-body{padding:16px 18px 18px}
.card .thumb{position:relative;height:158px;overflow:hidden;background:#ffe9db}
.card .thumb img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .45s}
.card:hover .thumb img{transform:scale(1.07)}
.card .thumb::after{content:'';position:absolute;inset:auto 0 0 0;height:46%;background:linear-gradient(180deg,transparent,rgba(0,0,0,.28))}
.card .dday{position:absolute;top:10px;left:10px;z-index:2;background:rgba(17,24,39,.72);color:#fff;font-size:.78rem;font-weight:800;padding:4px 11px;border-radius:14px;backdrop-filter:blur(3px)}
.card .dday:empty{display:none}
.card .dday.on{background:#ff5a3c}
.card .dday.off{background:#9ca3af}
.card.ended{opacity:.55}
.card .cat{position:absolute;bottom:10px;left:10px;z-index:2;background:rgba(255,255,255,.94);color:#e0502f;font-size:.78rem;font-weight:800;padding:3px 11px;border-radius:12px}
.card h3{font-size:1.13rem;font-weight:800;letter-spacing:-.02em;margin:2px 0 6px}
.card .date{font-weight:700;color:#ff5a3c;font-size:.92rem}
.card .loc{font-size:.86rem;color:#6b7280;margin:2px 0 8px}
.card .desc{font-size:.9rem;color:#4b5563}
.card-top{display:flex;justify-content:flex-end;align-items:center;margin-bottom:2px}
.badge{font-size:.72rem;padding:3px 9px;border-radius:10px;font-weight:700}
.badge.ok{background:#e5f6e8;color:#1a7f37}
.badge.est{background:#fff2d6;color:#9a6700}
.filter{margin:14px 0 22px;display:flex;flex-wrap:wrap;gap:8px}
.rbtn{border:1.5px solid #ffd0be;background:#fff;color:#e0502f;border-radius:20px;padding:7px 17px;font-size:.88rem;cursor:pointer;font-weight:700;transition:all .15s}
.rbtn:hover{border-color:#ff5a3c}
.rbtn.active{background:linear-gradient(135deg,#ff5a3c,#ff9a3c);color:#fff;border-color:transparent;box-shadow:0 4px 12px rgba(255,90,60,.35)}
.monthnav{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:12px;margin:16px 0}
.monthnav a{background:#fff;border:1.5px solid #f3e8e0;border-radius:16px;padding:18px 12px;text-align:center;font-weight:800;color:#374151;box-shadow:0 2px 8px rgba(31,41,55,.05);transition:all .18s}
.monthnav a:hover{transform:translateY(-3px);border-color:#ffb59d;box-shadow:0 8px 20px rgba(255,90,60,.14);color:#ff5a3c}
.monthnav .mn-emoji{display:block;font-size:1.6rem;margin-bottom:6px}
.monthnav .cnt{display:block;font-size:.8rem;color:#9ca3af;font-weight:500;margin-top:2px}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:16px;overflow:hidden;font-size:.92rem;box-shadow:0 3px 14px rgba(31,41,55,.07)}
th,td{padding:12px 10px;border-bottom:1px solid #f6efe9;text-align:left}
th{background:#fff5ef;color:#c14a26;font-weight:800}
tr:hover td{background:#fffaf6}
tr.today-open{background:#e5f6e8}
tr.today-open td:first-child::after{content:" 🔴 오늘 장날!";color:#1a7f37;font-size:.78rem;font-weight:700}
.note{font-size:.86rem;color:#8b8378;margin:10px 0}
body{background:#fdfaf7}
footer{background:#231a14;color:#cfc2b8;padding:38px 0;font-size:.86rem;text-align:center;margin-top:20px}
footer a{text-decoration:underline}
footer p{margin:3px 0}
.wkgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(235px,1fr));gap:10px}
.wkchip{background:#fff;border-radius:14px;padding:14px 17px;font-size:.94rem;box-shadow:0 2px 10px rgba(31,41,55,.07);transition:all .18s;border:1.5px solid transparent}
.wkchip:hover{transform:translateY(-3px);border-color:#ffb59d;box-shadow:0 8px 20px rgba(255,90,60,.14)}
.wkchip span{display:block;font-size:.8rem;color:#9ca3af;margin-top:2px}
.bloglist a{display:block;background:#fff;border-radius:14px;padding:16px 19px;margin-bottom:12px;font-weight:700;box-shadow:0 2px 10px rgba(31,41,55,.07);transition:all .18s;border:1.5px solid transparent}
.bloglist a:hover{transform:translateY(-2px);border-color:#ffb59d;box-shadow:0 8px 20px rgba(255,90,60,.12)}
.bloglist a span{display:block;font-size:.84rem;color:#9ca3af;font-weight:400;margin-top:3px}
article{background:#fff;border-radius:16px;padding:30px;box-shadow:0 3px 14px rgba(31,41,55,.07)}
article h1{font-size:1.5rem;margin-bottom:14px}
article h2{font-size:1.2rem;margin:22px 0 8px;color:#c14a26}
article p,article li{margin-bottom:10px;font-size:.96rem}
article ul{padding-left:20px}
@media(max-width:600px){.hero h1{font-size:1.3rem}nav a{margin-left:9px;font-size:.85rem}}
`;

function layout(title, desc, urlPath, content) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${urlPath}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}${urlPath}">
<meta property="og:type" content="website">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE}" crossorigin="anonymous"></script>
<style>${CSS}</style>
</head>
<body>
<header><div class="wrap">
<a class="logo" href="/">🎪 ${SITE_NAME}</a>
<nav><a href="/2026-07/">월별 축제</a><a href="/jangteo/">전국 오일장</a><a href="/blog/">축제 가이드</a></nav>
</div></header>
${content}
<footer><div class="wrap">
<p>${SITE_NAME} — 전국 축제·오일장 일정 모음</p>
<p>축제 일정은 주최 측 사정에 따라 변경될 수 있습니다. 방문 전 공식 홈페이지를 확인하세요.</p>
<p><a href="/privacy/">개인정보처리방침</a> · 문의: goohw593@gmail.com</p>
<p>© 2026 ${SITE_NAME}</p>
</div></footer>
${DDAY_JS}
${urlPath === '/' ? FIREWORKS_JS : ''}
</body>
</html>`;
}

function writePage(rel, html) {
  const dir = path.join(ROOT, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log('✓', rel + '/index.html');
}

// ---------- 월별 페이지 ----------
const monthNavHtml = `<div class="monthnav">` + MONTHS.map(mm => {
  const cnt = festivals.filter(f => f.month.some(m => mm.months.includes(m))).length;
  return `<a href="/${mm.key}/"><span class="mn-emoji">${mm.emoji}</span>${mm.short} 축제<span class="cnt">${cnt}개</span></a>`;
}).join('') + `</div>`;

MONTHS.forEach(mm => {
  const list = festivals
    .filter(f => f.month.some(m => mm.months.includes(m)))
    .sort((a, b) => a.start.localeCompare(b.start));
  const title = `${mm.label} 축제 일정 총정리 (${list.length}개) | ${SITE_NAME}`;
  const desc = `${mm.label} 전국 축제 일정 한눈에 보기 — 지역별 축제 날짜, 장소, 볼거리 정리. ${list.slice(0, 3).map(f => f.name).join(', ')} 등 ${list.length}개 축제.`;
  const content = `<main><div class="wrap">
<h1 style="font-size:1.5rem;margin-bottom:6px">${mm.label} 전국 축제 일정</h1>
<p class="note">총 ${list.length}개 · 지역 버튼을 눌러 필터링하세요. 일정은 변동될 수 있으니 방문 전 공식 홈페이지를 확인하세요.</p>
${regionFilter(list)}
<div class="grid">${list.map(festCard).join('\n')}</div>
<h2 class="sec">다른 달 축제 보기</h2>
${monthNavHtml}
</div></main>`;
  writePage(mm.key, layout(title, desc, `/${mm.key}/`, content));
});

// ---------- 오일장 페이지 ----------
const marketRows = markets.map(m =>
  `<tr data-days="${m.daysNum.join(',')}"><td><strong>${esc(m.name)}</strong></td><td>${esc(m.region)} ${esc(m.city)}</td><td>${esc(m.days)}</td><td>${esc(m.famous)}</td><td>${esc(m.desc)}</td></tr>`
).join('\n');

const jangteoContent = `<main><div class="wrap">
<div style="border-radius:12px;overflow:hidden;margin-bottom:16px"><img src="/img/jangteo.webp" alt="전통 오일장 풍경" style="width:100%;max-height:220px;object-fit:cover;display:block"></div>
<h1 style="font-size:1.5rem;margin-bottom:6px">전국 유명 오일장(5일장) 날짜 총정리</h1>
<p class="note">오일장은 날짜 끝자리 기준으로 열립니다. 예: 4·9일장 → 4, 9, 14, 19, 24, 29일. <strong>오늘 열리는 장은 초록색으로 표시됩니다.</strong></p>
<p id="today-info" class="note" style="font-weight:700;color:#1a7f37"></p>
<table>
<thead><tr><th>장터</th><th>위치</th><th>장날</th><th>대표 품목</th><th>특징</th></tr></thead>
<tbody>${marketRows}</tbody>
</table>
<h2 class="sec">이달의 축제도 확인하세요</h2>
${monthNavHtml}
</div></main>
<script>
(function(){
  const now = new Date();
  const d = now.getDate() % 10;
  let openCnt = 0;
  document.querySelectorAll('tr[data-days]').forEach(tr => {
    const days = tr.dataset.days.split(',').filter(Boolean).map(Number).map(x => x % 10);
    if (days.includes(d)) { tr.classList.add('today-open'); openCnt++; }
  });
  const info = document.getElementById('today-info');
  info.textContent = '오늘은 ' + (now.getMonth()+1) + '월 ' + now.getDate() + '일 — ' +
    (openCnt ? '오늘 서는 오일장 ' + openCnt + '곳!' : '오늘 서는 오일장이 없어요. 장날을 확인해보세요.');
})();
</script>`;
writePage('jangteo', layout(
  `전국 오일장(5일장) 날짜 총정리 — 모란장·정선장·봉평장 장날 | ${SITE_NAME}`,
  `전국 유명 오일장 장날 한눈에 보기. 성남 모란장(4·9일), 정선아리랑시장(2·7일), 봉평장(2·7일) 등 27곳 5일장 날짜와 대표 먹거리 정리.`,
  '/jangteo/', jangteoContent));

// ---------- 블로그 ----------
posts.forEach(p => {
  const content = `<main><div class="wrap"><article>
<h1>${esc(p.title)}</h1>
<p class="note">작성일: ${p.date}</p>
${p.body}
</article>
<h2 class="sec">월별 축제 일정 보기</h2>
${monthNavHtml}
</div></main>`;
  writePage(`blog/${p.slug}`, layout(`${p.title} | ${SITE_NAME}`, p.desc, `/blog/${p.slug}/`, content));
});

const blogIndex = `<main><div class="wrap">
<h1 style="font-size:1.5rem;margin-bottom:14px">축제·장터 가이드</h1>
<div class="bloglist">
${posts.map(p => `<a href="/blog/${p.slug}/">${esc(p.title)}<span>${p.date} · ${esc(p.desc)}</span></a>`).join('\n')}
</div>
<h2 class="sec">월별 축제 일정 보기</h2>
${monthNavHtml}
</div></main>`;
writePage('blog', layout(`축제·장터 가이드 | ${SITE_NAME}`, `축제 준비물, 오일장 이용 팁 등 축제·장터를 200% 즐기는 가이드 모음.`, '/blog/', blogIndex));

// ---------- 메인 페이지 ----------
const upcoming = festivals
  .filter(f => f.end >= TODAY)
  .sort((a, b) => a.start.localeCompare(b.start))
  .slice(0, 9);

const slim = festivals.map(f => ({
  n: f.name, s: f.start, e: f.end, r: f.region, c: f.city, g: f.category,
  k: (MONTHS.find(mm => f.month.some(m => mm.months.includes(m))) || MONTHS[0]).key
}));

const WEEKEND_JS = `<script>
(function(){
  const F = ${JSON.stringify(slim)};
  const EMOJI = ${JSON.stringify(CAT_EMOJI)};
  const t = new Date(); t.setHours(0,0,0,0);
  const sat = new Date(t); sat.setDate(t.getDate() + ((6 - t.getDay() + 7) % 7));
  const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
  const iso = d => d.toISOString().slice(0,10);
  const list = F.filter(f => f.s <= iso(sun) && f.e >= iso(sat)).slice(0, 10);
  const box = document.getElementById('weekend');
  if (!box) return;
  if (!list.length) { box.innerHTML = '<p class="note">이번 주말 예정된 축제 정보가 없어요.</p>'; return; }
  document.getElementById('weekend-title').textContent =
    '이번 주말(' + (sat.getMonth()+1) + '/' + sat.getDate() + '~' + (sun.getMonth()+1) + '/' + sun.getDate() + ') 갈 만한 축제';
  box.innerHTML = list.map(f =>
    '<a class="wkchip" href="/' + f.k + '/">' + (EMOJI[f.g]||'🎪') + ' <strong>' + f.n + '</strong><span>' + f.r + ' ' + f.c + '</span></a>'
  ).join('');
})();
</script>`;

const indexContent = `<div class="hero">
<video class="hero-vid" autoplay muted loop playsinline poster="/img/hero.webp" aria-hidden="true"><source src="/img/hero.mp4" type="video/mp4"></video>
<div class="hero-inner">
<h1>이번 주말, 어디로 떠나볼까요?</h1>
<p>전국 축제와 오일장 일정을 한눈에 — 가족 나들이 계획이 3분이면 끝나요.</p>
<div class="hero-cta"><a class="cta1" href="#weekend-title">이번 주말 축제 보기</a><a class="cta2" href="/jangteo/">오늘 서는 오일장</a></div>
<div class="hero-stats"><span>🎪 축제 ${festivals.length}개</span><span>🧺 오일장 ${markets.length}곳</span><span>📅 매달 업데이트</span></div>
</div>
</div>
<main><div class="wrap">
<h2 class="sec" id="weekend-title">이번 주말 갈 만한 축제</h2>
<div class="wkgrid" id="weekend"></div>
${WEEKEND_JS}
<h2 class="sec">지금 & 곧 열리는 축제</h2>
<div class="grid">${upcoming.map(festCard).join('\n')}</div>
<h2 class="sec">월별 축제 일정</h2>
${monthNavHtml}
<h2 class="sec">전국 오일장 — 오늘 서는 장은?</h2>
<p class="note">성남 모란장, 정선아리랑시장, 봉평장 등 전국 유명 5일장 날짜를 정리했어요.</p>
<p><a href="/jangteo/" style="display:inline-block;background:#ff6b4a;color:#fff;font-weight:700;padding:10px 22px;border-radius:24px">오일장 날짜 보러가기 →</a></p>
<h2 class="sec">축제 가이드</h2>
<div class="bloglist">
${posts.map(p => `<a href="/blog/${p.slug}/">${esc(p.title)}<span>${p.date}</span></a>`).join('\n')}
</div>
</div></main>`;
writePage('.', layout(
  `${SITE_NAME} — 전국 축제·오일장 일정 총정리 (2026)`,
  `2026 전국 축제 일정과 오일장(5일장) 날짜를 한눈에. 월별·지역별 축제 정보, 보령머드축제부터 화천산천어축제까지.`,
  '/', indexContent));

// ---------- 개인정보처리방침 ----------
const privacyContent = `<main><div class="wrap"><article>
<h1>개인정보처리방침</h1>
<p>시행일: 2026년 7월 11일</p>
<h2>1. 개요</h2>
<p>축제모아(chukjemoa.co.kr, 이하 "사이트")는 이용자의 개인정보를 중요시하며, 관련 법령을 준수합니다. 본 사이트는 회원가입 없이 이용 가능하며, 이용자가 직접 입력하는 개인정보를 수집·저장하지 않습니다.</p>
<h2>2. 쿠키 및 광고</h2>
<p>본 사이트는 Google AdSense 광고를 게재합니다. Google을 포함한 제3자 광고 사업자는 쿠키를 사용하여 이용자의 이전 방문 기록을 바탕으로 광고를 게재할 수 있습니다. Google의 광고 쿠키 사용으로 Google 및 파트너는 사이트 방문 기록에 기반한 맞춤 광고를 제공할 수 있습니다.</p>
<p>이용자는 <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">Google 광고 설정</a>에서 맞춤 광고를 비활성화할 수 있습니다.</p>
<h2>3. 분석 도구</h2>
<p>사이트 개선을 위해 방문 통계 도구를 사용할 수 있으며, 이 과정에서 IP 주소·브라우저 정보 등 비식별 정보가 자동 수집될 수 있습니다.</p>
<h2>4. 외부 링크</h2>
<p>본 사이트는 축제 공식 홈페이지 등 외부 사이트 링크를 포함합니다. 외부 사이트의 개인정보 처리에 대해서는 책임지지 않습니다.</p>
<h2>5. 문의</h2>
<p>개인정보 관련 문의: goohw593@gmail.com</p>
</article></div></main>`;
writePage('privacy', layout(`개인정보처리방침 | ${SITE_NAME}`, `축제모아 개인정보처리방침`, '/privacy/', privacyContent));

// ---------- sitemap / robots ----------
const urls = ['/', ...MONTHS.map(m => `/${m.key}/`), '/jangteo/', '/blog/', ...posts.map(p => `/blog/${p.slug}/`), '/privacy/'];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url><loc>${SITE}${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}
</urlset>`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync(path.join(ROOT, 'ads.txt'), `google.com, pub-3293445488923111, DIRECT, f08c47fec0942fa0\n`);
console.log('✓ sitemap.xml, robots.txt, ads.txt');
console.log('빌드 완료:', urls.length, '페이지');
