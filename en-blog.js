// 📝 영문 블로그 /en/blog/, /en/blog/{slug}/
//
// 2026-08-20: 장남 님이 "빙 웹마스터 등록 + 영문 블로그"를 요청. 한국어 블로그(posts.json, 29편)와
//   같은 주제(오일장 이용법, 축제 준비 데이터 가이드 등)를 영문 독자용으로 새로 썼다 —
//   번역이 아니라 영문으로 다시 쓴 것이며, 안에 들어간 숫자는 전부 한국어판 원본 글이나
//   이번 세션에서 직접 집계한 실측치를 그대로 인용했다(지어내지 않음).
//   ⚠️ 각 글은 실제로 살아있는 영문 페이지(/en/jangteo/, /en/mountains/, /en/search/, /en/calendar/,
//   /en/closed/, /en/trend/)로만 링크한다 — 아직 없는 페이지(예: /en/pet/, /en/trails/)로는 링크하지 않는다.
const fs = require('fs'), path = require('path');

function load(f) { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { return []; } }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function fmtDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso || ''))) return iso || '';
  const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [y, m, d] = iso.split('-').map(Number);
  return `${MN[m - 1]} ${d}, ${y}`;
}
function stripTags(s) { return String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim(); }

const CSS = `
<style>
.ebmeta{color:#9aa3af;font-size:.85rem;margin:6px 0 18px}
.ebart p{color:#374151;font-size:.98rem;line-height:1.8;margin:12px 0}
.ebart h2{font-size:1.12rem;font-weight:900;color:#0a6c63;margin:26px 0 10px}
.ebart ul{margin:12px 0 12px 20px}
.ebart li{color:#374151;font-size:.96rem;line-height:1.75;margin:6px 0}
.ebart strong{color:#0a6c63}
.ebart a{color:#0c7d72;font-weight:700}
.ebart table{width:100%;border-collapse:collapse;margin:14px 0;font-size:.92rem}
.ebart th,.ebart td{border:1px solid #dcefeb;padding:8px 10px;text-align:left}
.ebart th{background:#f2fbfa;color:#0a6c63;font-weight:800}
.eblist{display:flex;flex-direction:column;gap:10px;margin:16px 0}
.eblist a{display:block;background:#fff;border-radius:14px;box-shadow:0 2px 10px rgba(31,41,55,.06);padding:16px 18px;text-decoration:none}
.eblist a b{display:block;color:#0a6c63;font-size:1.02rem;font-weight:900;margin-bottom:5px}
.eblist a span{display:block;color:#6b7280;font-size:.88rem;line-height:1.5}
.ebnote{color:#9aa3af;font-size:.83rem;margin-top:22px;padding-top:14px;border-top:1px solid #eef2f1}
</style>`;

function build(ctx) {
  const { ROOT, layout, writePage, SITE, TODAY } = ctx;
  const posts = load('posts_en.json');
  if (!posts.length) return [];

  const urls = [];

  posts.forEach(p => {
    const content = `<main><div class="wrap">
${CSS}
<p style="font-size:.85rem;color:#9aa3af;margin:8px 0"><a href="/en/" style="color:#0c7d72">Home</a> › <a href="/en/blog/" style="color:#0c7d72">Blog</a> › ${esc(p.title)}</p>
<article class="ebart">
<h1 style="font-size:1.45rem;font-weight:900;letter-spacing:-.02em;margin:6px 0 4px">${esc(p.title)}</h1>
<div class="ebmeta">Chukjemoa Editorial · Published ${fmtDate(p.date)}</div>
${p.body}
</article>
<div class="ebnote">Figures in this article are drawn from Korea Tourism Organization (TourAPI) public data and Korea Tourism Data Lab visitor statistics, as cited inline. Festival dates, market days, and venue policies can change — please confirm directly with the organizer or venue before you travel.</div>
</div></main>`;

    const ld = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Article',
      headline: p.title, description: p.desc, inLanguage: 'en',
      datePublished: p.date, dateModified: p.date,
      author: { '@type': 'Organization', name: 'Chukjemoa', url: `${SITE}/en/` },
      publisher: { '@type': 'Organization', name: 'Chukjemoa', url: `${SITE}/en/` },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/en/blog/${p.slug}/` }
    })}</script>`;

    const urlPath = `/en/blog/${p.slug}/`;
    writePage('en/blog/' + p.slug, layout(
      `${p.title} | Chukjemoa`, p.desc, urlPath, content, { lang: 'en', jsonld: ld }));
    urls.push(urlPath);
  });

  const indexContent = `<main><div class="wrap">
${CSS}
<h1 style="font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:10px 0 6px">📝 Chukjemoa Blog</h1>
<p style="color:#6b7280;margin-bottom:6px">Practical, data-grounded guides to Korean festivals and traditional markets — same topics as our Korean-language blog, written for English-speaking travelers.</p>
<div class="eblist">
${posts.map(p => `<a href="/en/blog/${esc(p.slug)}/"><b>${esc(p.title)}</b><span>${fmtDate(p.date)} · ${esc(p.desc)}</span></a>`).join('\n')}
</div>
</div></main>`;

  const indexLd = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Blog', name: 'Chukjemoa Blog',
    url: `${SITE}/en/blog/`,
    blogPost: posts.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE}/en/blog/${p.slug}/` }))
  })}</script>`;

  writePage('en/blog', layout(
    'Chukjemoa Blog — Korean Festival & Market Guides',
    'Practical, data-grounded guides to Korean festivals and traditional markets for English-speaking travelers.',
    '/en/blog/', indexContent, { lang: 'en', jsonld: indexLd }));
  urls.push('/en/blog/');

  console.log(`✓ /en/blog/{slug}/ — ${posts.length}개`);
  return urls;
}

module.exports = { build };
