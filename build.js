// 축제모아 정적 사이트 빌드 스크립트
// 사용법: node build.js  (data/*.json 수정 후 재실행하면 페이지 재생성)
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE = 'https://chukjemoa.com';
const SITE_NAME = '축제모아';
const ADSENSE = 'ca-pub-3293445488923111';
const TODAY = new Date().toISOString().slice(0, 10);

const festivals = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/festivals.json'), 'utf8'));
const markets = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/markets.json'), 'utf8'));
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/posts.json'), 'utf8'));

const MONTHS = [
  { key: '2026-07', months: [7], label: '2026년 7월', short: '7월' },
  { key: '2026-08', months: [8], label: '2026년 8월', short: '8월' },
  { key: '2026-09', months: [9], label: '2026년 9월', short: '9월' },
  { key: '2026-10', months: [10], label: '2026년 10월', short: '10월' },
  { key: '2026-11', months: [11], label: '2026년 11월', short: '11월' },
  { key: '2026-12', months: [12, 1], label: '2026년 12월~2027년 1월 겨울', short: '12월·겨울' },
];

const CAT_EMOJI = { '물놀이': '💦', '음악': '🎵', '음식': '🍜', '꽃': '🌸', '문화': '🎭', '불꽃': '🎆', '전통': '🏮', '빛': '✨', '눈': '⛄', '기타': '🎪' };

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
  const badge = f.confirmed
    ? '<span class="badge ok">일정 확정</span>'
    : '<span class="badge est">예년 기준·변동 가능</span>';
  return `<div class="card" data-region="${esc(f.region)}">
  <div class="card-top"><span class="cat">${emoji} ${esc(f.category)}</span>${badge}</div>
  <h3>${esc(f.name)}</h3>
  <p class="date">📅 ${fmtRange(f)}</p>
  <p class="loc">📍 ${esc(f.region)} ${esc(f.city)} · ${esc(f.place)}</p>
  <p class="desc">${esc(f.desc)}</p>
</div>`;
}

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
body{font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#333;line-height:1.6;background:#fffaf5}
a{color:inherit;text-decoration:none}
.wrap{max-width:960px;margin:0 auto;padding:0 16px}
header{background:linear-gradient(135deg,#ff6b4a,#ff9a3c);color:#fff;padding:14px 0}
header .wrap{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
.logo{font-size:1.5rem;font-weight:800}
nav a{margin-left:14px;font-weight:600;font-size:.95rem;opacity:.95}
nav a:hover{text-decoration:underline}
.hero{background:linear-gradient(135deg,#ff6b4a,#ff9a3c);color:#fff;text-align:center;padding:36px 16px 44px}
.hero h1{font-size:1.7rem;margin-bottom:8px}
.hero p{opacity:.95}
main{padding:28px 0 40px}
h2.sec{font-size:1.3rem;margin:28px 0 14px;padding-left:10px;border-left:5px solid #ff6b4a}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
.card{background:#fff;border:1px solid #ffe3d0;border-radius:12px;padding:16px;box-shadow:0 2px 6px rgba(255,107,74,.07)}
.card h3{font-size:1.08rem;margin:6px 0 4px}
.card .date{font-weight:700;color:#e0502f;font-size:.93rem}
.card .loc{font-size:.87rem;color:#666;margin:2px 0 6px}
.card .desc{font-size:.9rem;color:#555}
.card-top{display:flex;justify-content:space-between;align-items:center}
.cat{font-size:.82rem;color:#b45}
.badge{font-size:.72rem;padding:2px 8px;border-radius:10px;font-weight:700}
.badge.ok{background:#e5f6e8;color:#1a7f37}
.badge.est{background:#fff2d6;color:#9a6700}
.filter{margin:12px 0 18px;display:flex;flex-wrap:wrap;gap:6px}
.rbtn{border:1px solid #ffb08a;background:#fff;color:#e0502f;border-radius:16px;padding:5px 13px;font-size:.87rem;cursor:pointer;font-weight:600}
.rbtn.active{background:#ff6b4a;color:#fff;border-color:#ff6b4a}
.monthnav{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin:14px 0}
.monthnav a{background:#fff;border:1px solid #ffd9c2;border-radius:10px;padding:14px;text-align:center;font-weight:700;color:#e0502f}
.monthnav a:hover{background:#fff0e6}
.monthnav .cnt{display:block;font-size:.8rem;color:#999;font-weight:400}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;font-size:.9rem}
th,td{padding:10px 8px;border-bottom:1px solid #f4e3d6;text-align:left}
th{background:#fff0e6;color:#c14a26}
tr.today-open{background:#e5f6e8}
tr.today-open td:first-child::after{content:" 🔴 오늘 장날!";color:#1a7f37;font-size:.78rem;font-weight:700}
.note{font-size:.83rem;color:#888;margin:10px 0}
footer{background:#3d2b23;color:#d9c9bf;padding:24px 0;font-size:.85rem;text-align:center}
footer a{text-decoration:underline}
.bloglist a{display:block;background:#fff;border:1px solid #ffe3d0;border-radius:10px;padding:14px 16px;margin-bottom:10px;font-weight:600}
.bloglist a span{display:block;font-size:.83rem;color:#999;font-weight:400;margin-top:2px}
article{background:#fff;border:1px solid #ffe3d0;border-radius:12px;padding:24px}
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
  return `<a href="/${mm.key}/">${mm.short} 축제<span class="cnt">${cnt}개</span></a>`;
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

const indexContent = `<div class="hero">
<h1>전국 축제·오일장 일정, 한눈에 모아보기</h1>
<p>이번 주말 어디 갈까? 전국 ${festivals.length}개 축제와 ${markets.length}곳 오일장 일정을 확인하세요.</p>
</div>
<main><div class="wrap">
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
<p>축제모아(chukjemoa.com, 이하 "사이트")는 이용자의 개인정보를 중요시하며, 관련 법령을 준수합니다. 본 사이트는 회원가입 없이 이용 가능하며, 이용자가 직접 입력하는 개인정보를 수집·저장하지 않습니다.</p>
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
