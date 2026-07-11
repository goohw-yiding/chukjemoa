// 異뺤젣紐⑥븘 ?뺤쟻 ?ъ씠??鍮뚮뱶 ?ㅽ겕由쏀듃
// ?ъ슜踰? node build.js  (data/*.json ?섏젙 ???ъ떎?됲븯硫??섏씠吏 ?ъ깮??
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE = 'https://chukjemoa.co.kr';
const SITE_NAME = '異뺤젣紐⑥븘';
const ADSENSE = 'ca-pub-3293445488923111';
const TODAY = new Date().toISOString().slice(0, 10);

const festivals = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/festivals.json'), 'utf8'));
const markets = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/markets.json'), 'utf8'));
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/posts.json'), 'utf8'));

const MONTHS = [
  { key: '2026-07', months: [7], label: '2026??7??, short: '7?? },
  { key: '2026-08', months: [8], label: '2026??8??, short: '8?? },
  { key: '2026-09', months: [9], label: '2026??9??, short: '9?? },
  { key: '2026-10', months: [10], label: '2026??10??, short: '10?? },
  { key: '2026-11', months: [11], label: '2026??11??, short: '11?? },
  { key: '2026-12', months: [12, 1], label: '2026??12??2027??1??寃⑥슱', short: '12?붋룰꺼?? },
];

const CAT_EMOJI = { '臾쇰???: '?뮚', '?뚯븙': '?렦', '?뚯떇': '?뜙', '苑?: '?뙵', '臾명솕': '?렚', '遺덇퐙': '?럣', '?꾪넻': '?룼', '鍮?: '??, '??: '??, '湲고?': '?렕' };

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
  const emoji = CAT_EMOJI[f.category] || '?렕';
  const badge = f.confirmed
    ? '<span class="badge ok">?쇱젙 ?뺤젙</span>'
    : '<span class="badge est">?덈뀈 湲곗?쨌蹂??媛??/span>';
  return `<div class="card" data-region="${esc(f.region)}">
  <div class="card-top"><span class="cat">${emoji} ${esc(f.category)}</span>${badge}</div>
  <h3>${esc(f.name)}</h3>
  <p class="date">?뱟 ${fmtRange(f)}</p>
  <p class="loc">?뱧 ${esc(f.region)} ${esc(f.city)} 쨌 ${esc(f.place)}</p>
  <p class="desc">${esc(f.desc)}</p>
</div>`;
}

function regionFilter(list) {
  const regions = [...new Set(list.map(f => f.region))];
  const btns = regions.map(r => `<button class="rbtn" data-r="${esc(r)}">${esc(r)}</button>`).join('');
  return `<div class="filter"><button class="rbtn active" data-r="all">?꾩껜</button>${btns}</div>
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
tr.today-open td:first-child::after{content:" ?뵶 ?ㅻ뒛 ?λ궇!";color:#1a7f37;font-size:.78rem;font-weight:700}
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
<a class="logo" href="/">?렕 ${SITE_NAME}</a>
<nav><a href="/2026-07/">?붾퀎 異뺤젣</a><a href="/jangteo/">?꾧뎅 ?ㅼ씪??/a><a href="/blog/">異뺤젣 媛?대뱶</a></nav>
</div></header>
${content}
<footer><div class="wrap">
<p>${SITE_NAME} ???꾧뎅 異뺤젣쨌?ㅼ씪???쇱젙 紐⑥쓬</p>
<p>異뺤젣 ?쇱젙? 二쇱턀 痢??ъ젙???곕씪 蹂寃쎈맆 ???덉뒿?덈떎. 諛⑸Ц ??怨듭떇 ?덊럹?댁?瑜??뺤씤?섏꽭??</p>
<p><a href="/privacy/">媛쒖씤?뺣낫泥섎━諛⑹묠</a> 쨌 臾몄쓽: goohw593@gmail.com</p>
<p>짤 2026 ${SITE_NAME}</p>
</div></footer>
</body>
</html>`;
}

function writePage(rel, html) {
  const dir = path.join(ROOT, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log('??, rel + '/index.html');
}

// ---------- ?붾퀎 ?섏씠吏 ----------
const monthNavHtml = `<div class="monthnav">` + MONTHS.map(mm => {
  const cnt = festivals.filter(f => f.month.some(m => mm.months.includes(m))).length;
  return `<a href="/${mm.key}/">${mm.short} 異뺤젣<span class="cnt">${cnt}媛?/span></a>`;
}).join('') + `</div>`;

MONTHS.forEach(mm => {
  const list = festivals
    .filter(f => f.month.some(m => mm.months.includes(m)))
    .sort((a, b) => a.start.localeCompare(b.start));
  const title = `${mm.label} 異뺤젣 ?쇱젙 珥앹젙由?(${list.length}媛? | ${SITE_NAME}`;
  const desc = `${mm.label} ?꾧뎅 異뺤젣 ?쇱젙 ?쒕늿??蹂닿린 ??吏??퀎 異뺤젣 ?좎쭨, ?μ냼, 蹂쇨굅由??뺣━. ${list.slice(0, 3).map(f => f.name).join(', ')} ??${list.length}媛?異뺤젣.`;
  const content = `<main><div class="wrap">
<h1 style="font-size:1.5rem;margin-bottom:6px">${mm.label} ?꾧뎅 異뺤젣 ?쇱젙</h1>
<p class="note">珥?${list.length}媛?쨌 吏??踰꾪듉???뚮윭 ?꾪꽣留곹븯?몄슂. ?쇱젙? 蹂?숇맆 ???덉쑝??諛⑸Ц ??怨듭떇 ?덊럹?댁?瑜??뺤씤?섏꽭??</p>
${regionFilter(list)}
<div class="grid">${list.map(festCard).join('\n')}</div>
<h2 class="sec">?ㅻⅨ ??異뺤젣 蹂닿린</h2>
${monthNavHtml}
</div></main>`;
  writePage(mm.key, layout(title, desc, `/${mm.key}/`, content));
});

// ---------- ?ㅼ씪???섏씠吏 ----------
const marketRows = markets.map(m =>
  `<tr data-days="${m.daysNum.join(',')}"><td><strong>${esc(m.name)}</strong></td><td>${esc(m.region)} ${esc(m.city)}</td><td>${esc(m.days)}</td><td>${esc(m.famous)}</td><td>${esc(m.desc)}</td></tr>`
).join('\n');

const jangteoContent = `<main><div class="wrap">
<h1 style="font-size:1.5rem;margin-bottom:6px">?꾧뎅 ?좊챸 ?ㅼ씪??5?쇱옣) ?좎쭨 珥앹젙由?/h1>
<p class="note">?ㅼ씪?μ? ?좎쭨 ?앹옄由?湲곗??쇰줈 ?대┰?덈떎. ?? 4쨌9?쇱옣 ??4, 9, 14, 19, 24, 29?? <strong>?ㅻ뒛 ?대━???μ? 珥덈줉?됱쑝濡??쒖떆?⑸땲??</strong></p>
<p id="today-info" class="note" style="font-weight:700;color:#1a7f37"></p>
<table>
<thead><tr><th>?ν꽣</th><th>?꾩튂</th><th>?λ궇</th><th>????덈ぉ</th><th>?뱀쭠</th></tr></thead>
<tbody>${marketRows}</tbody>
</table>
<h2 class="sec">?대떖??異뺤젣???뺤씤?섏꽭??/h2>
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
  info.textContent = '?ㅻ뒛? ' + (now.getMonth()+1) + '??' + now.getDate() + '????' +
    (openCnt ? '?ㅻ뒛 ?쒕뒗 ?ㅼ씪??' + openCnt + '怨?' : '?ㅻ뒛 ?쒕뒗 ?ㅼ씪?μ씠 ?놁뼱?? ?λ궇???뺤씤?대낫?몄슂.');
})();
</script>`;
writePage('jangteo', layout(
  `?꾧뎅 ?ㅼ씪??5?쇱옣) ?좎쭨 珥앹젙由???紐⑤??Β룹젙?좎옣쨌遊됲룊???λ궇 | ${SITE_NAME}`,
  `?꾧뎅 ?좊챸 ?ㅼ씪???λ궇 ?쒕늿??蹂닿린. ?깅궓 紐⑤???4쨌9??, ?뺤꽑?꾨━?묒떆??2쨌7??, 遊됲룊??2쨌7?? ??27怨?5?쇱옣 ?좎쭨? ???癒밴굅由??뺣━.`,
  '/jangteo/', jangteoContent));

// ---------- 釉붾줈洹?----------
posts.forEach(p => {
  const content = `<main><div class="wrap"><article>
<h1>${esc(p.title)}</h1>
<p class="note">?묒꽦?? ${p.date}</p>
${p.body}
</article>
<h2 class="sec">?붾퀎 異뺤젣 ?쇱젙 蹂닿린</h2>
${monthNavHtml}
</div></main>`;
  writePage(`blog/${p.slug}`, layout(`${p.title} | ${SITE_NAME}`, p.desc, `/blog/${p.slug}/`, content));
});

const blogIndex = `<main><div class="wrap">
<h1 style="font-size:1.5rem;margin-bottom:14px">異뺤젣쨌?ν꽣 媛?대뱶</h1>
<div class="bloglist">
${posts.map(p => `<a href="/blog/${p.slug}/">${esc(p.title)}<span>${p.date} 쨌 ${esc(p.desc)}</span></a>`).join('\n')}
</div>
<h2 class="sec">?붾퀎 異뺤젣 ?쇱젙 蹂닿린</h2>
${monthNavHtml}
</div></main>`;
writePage('blog', layout(`異뺤젣쨌?ν꽣 媛?대뱶 | ${SITE_NAME}`, `異뺤젣 以鍮꾨Ъ, ?ㅼ씪???댁슜 ????異뺤젣쨌?ν꽣瑜?200% 利먭린??媛?대뱶 紐⑥쓬.`, '/blog/', blogIndex));

// ---------- 硫붿씤 ?섏씠吏 ----------
const upcoming = festivals
  .filter(f => f.end >= TODAY)
  .sort((a, b) => a.start.localeCompare(b.start))
  .slice(0, 9);

const indexContent = `<div class="hero">
<h1>?꾧뎅 異뺤젣쨌?ㅼ씪???쇱젙, ?쒕늿??紐⑥븘蹂닿린</h1>
<p>?대쾲 二쇰쭚 ?대뵒 媛덇퉴? ?꾧뎅 ${festivals.length}媛?異뺤젣? ${markets.length}怨??ㅼ씪???쇱젙???뺤씤?섏꽭??</p>
</div>
<main><div class="wrap">
<h2 class="sec">吏湲?& 怨??대━??異뺤젣</h2>
<div class="grid">${upcoming.map(festCard).join('\n')}</div>
<h2 class="sec">?붾퀎 異뺤젣 ?쇱젙</h2>
${monthNavHtml}
<h2 class="sec">?꾧뎅 ?ㅼ씪?????ㅻ뒛 ?쒕뒗 ?μ??</h2>
<p class="note">?깅궓 紐⑤??? ?뺤꽑?꾨━?묒떆?? 遊됲룊?????꾧뎅 ?좊챸 5?쇱옣 ?좎쭨瑜??뺣━?덉뼱??</p>
<p><a href="/jangteo/" style="display:inline-block;background:#ff6b4a;color:#fff;font-weight:700;padding:10px 22px;border-radius:24px">?ㅼ씪???좎쭨 蹂대윭媛湲???/a></p>
<h2 class="sec">異뺤젣 媛?대뱶</h2>
<div class="bloglist">
${posts.map(p => `<a href="/blog/${p.slug}/">${esc(p.title)}<span>${p.date}</span></a>`).join('\n')}
</div>
</div></main>`;
writePage('.', layout(
  `${SITE_NAME} ???꾧뎅 異뺤젣쨌?ㅼ씪???쇱젙 珥앹젙由?(2026)`,
  `2026 ?꾧뎅 異뺤젣 ?쇱젙怨??ㅼ씪??5?쇱옣) ?좎쭨瑜??쒕늿?? ?붾퀎쨌吏??퀎 異뺤젣 ?뺣낫, 蹂대졊癒몃뱶異뺤젣遺???붿쿇?곗쿇?댁텞?쒓퉴吏.`,
  '/', indexContent));

// ---------- 媛쒖씤?뺣낫泥섎━諛⑹묠 ----------
const privacyContent = `<main><div class="wrap"><article>
<h1>媛쒖씤?뺣낫泥섎━諛⑹묠</h1>
<p>?쒗뻾?? 2026??7??11??/p>
<h2>1. 媛쒖슂</h2>
<p>異뺤젣紐⑥븘(chukjemoa.co.kr, ?댄븯 "?ъ씠??)???댁슜?먯쓽 媛쒖씤?뺣낫瑜?以묒슂?쒗븯硫? 愿??踰뺣졊??以?섑빀?덈떎. 蹂??ъ씠?몃뒗 ?뚯썝媛???놁씠 ?댁슜 媛?ν븯硫? ?댁슜?먭? 吏곸젒 ?낅젰?섎뒗 媛쒖씤?뺣낫瑜??섏쭛쨌??ν븯吏 ?딆뒿?덈떎.</p>
<h2>2. 荑좏궎 諛?愿묎퀬</h2>
<p>蹂??ъ씠?몃뒗 Google AdSense 愿묎퀬瑜?寃뚯옱?⑸땲?? Google???ы븿??????愿묎퀬 ?ъ뾽?먮뒗 荑좏궎瑜??ъ슜?섏뿬 ?댁슜?먯쓽 ?댁쟾 諛⑸Ц 湲곕줉??諛뷀깢?쇰줈 愿묎퀬瑜?寃뚯옱?????덉뒿?덈떎. Google??愿묎퀬 荑좏궎 ?ъ슜?쇰줈 Google 諛??뚰듃?덈뒗 ?ъ씠??諛⑸Ц 湲곕줉??湲곕컲??留욎땄 愿묎퀬瑜??쒓났?????덉뒿?덈떎.</p>
<p>?댁슜?먮뒗 <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">Google 愿묎퀬 ?ㅼ젙</a>?먯꽌 留욎땄 愿묎퀬瑜?鍮꾪솢?깊솕?????덉뒿?덈떎.</p>
<h2>3. 遺꾩꽍 ?꾧뎄</h2>
<p>?ъ씠??媛쒖꽑???꾪빐 諛⑸Ц ?듦퀎 ?꾧뎄瑜??ъ슜?????덉쑝硫? ??怨쇱젙?먯꽌 IP 二쇱냼쨌釉뚮씪?곗? ?뺣낫 ??鍮꾩떇蹂??뺣낫媛 ?먮룞 ?섏쭛?????덉뒿?덈떎.</p>
<h2>4. ?몃? 留곹겕</h2>
<p>蹂??ъ씠?몃뒗 異뺤젣 怨듭떇 ?덊럹?댁? ???몃? ?ъ씠??留곹겕瑜??ы븿?⑸땲?? ?몃? ?ъ씠?몄쓽 媛쒖씤?뺣낫 泥섎━????댁꽌??梨낆엫吏吏 ?딆뒿?덈떎.</p>
<h2>5. 臾몄쓽</h2>
<p>媛쒖씤?뺣낫 愿??臾몄쓽: goohw593@gmail.com</p>
</article></div></main>`;
writePage('privacy', layout(`媛쒖씤?뺣낫泥섎━諛⑹묠 | ${SITE_NAME}`, `異뺤젣紐⑥븘 媛쒖씤?뺣낫泥섎━諛⑹묠`, '/privacy/', privacyContent));

// ---------- sitemap / robots ----------
const urls = ['/', ...MONTHS.map(m => `/${m.key}/`), '/jangteo/', '/blog/', ...posts.map(p => `/blog/${p.slug}/`), '/privacy/'];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url><loc>${SITE}${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}
</urlset>`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync(path.join(ROOT, 'ads.txt'), `google.com, pub-3293445488923111, DIRECT, f08c47fec0942fa0\n`);
console.log('??sitemap.xml, robots.txt, ads.txt');
console.log('鍮뚮뱶 ?꾨즺:', urls.length, '?섏씠吏');

