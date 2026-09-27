// 📝 2026-09-28 신설 — 네이버 블로그(goohw) 글 ↔ 사이트 페이지 «짝» 목록을 만든다.
//   사이트 → 블로그 역링크 카드(build.js naverBlogInject)의 재료다. 매일 빌드 전에 돌린다.
//   ① RSS(최근 50편) → 새 글만 본문을 열어 chukjemoa 링크를 뽑는다(이미 본 글은 캐시 — 네이버 429 방지)
//   ② 제목에 축제 이름이 들어 있으면 그 축제 상세(/festival/{slug}/)와도 짝짓는다
//      (9/26~27 축제 글 16편이 본문 링크는 /2026-10/ 인데 상세 페이지가 따로 있었다 — 제목 매칭으로 보완)
//   출력: data/naver_posts.json  { updated, posts:[{id,title,date,cat,url,targets:[path],fest}] }
//   사용: node naver-posts.js            (새 글만)
//         node naver-posts.js --refetch  (전부 다시 — 링크를 고친 뒤)
const fs = require('fs'), path = require('path'), https = require('https');
const ROOT = __dirname, OUT = path.join(ROOT, 'data', 'naver_posts.json');
const UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36';
const REFETCH = process.argv.includes('--refetch');
const sleep = ms => new Promise(r => setTimeout(r, ms));
function get(url, n = 0) {
  return new Promise((res, rej) => {
    https.get(url, { headers: { 'User-Agent': UA } }, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location && n < 5) { r.resume(); return res(get(new URL(r.headers.location, url).href, n + 1)); }
      if (r.statusCode !== 200) { r.resume(); return rej(new Error('HTTP ' + r.statusCode)); }
      let b = ''; r.setEncoding('utf8'); r.on('data', c => b += c); r.on('end', () => res(b));
    }).on('error', rej);
  });
}
const unesc = s => s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const norm = s => String(s).replace(/2026|2027|\s|·|—|-|,|\(|\)|「|」/g, '').toLowerCase();

(async () => {
  let prev = { posts: [] };
  try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (e) {}
  const byId = new Map(prev.posts.map(p => [p.id, p]));

  // ② 축제 이름 색인 — 실제로 지어진 상세 페이지의 <title> 에서 이름을 읽는다(데이터 원천이 여럿이라 이게 가장 확실)
  const fdir = path.join(ROOT, 'festival'); const FEST = [];
  for (const slug of fs.readdirSync(fdir)) {
    const f = path.join(fdir, slug, 'index.html');
    if (!fs.existsSync(f)) continue;
    const h = fs.readFileSync(f, 'utf8').slice(0, 4000);
    if (/name="robots"[^>]*noindex/.test(h)) continue;             // 끝난 축제(색인 제외)와는 짝짓지 않는다
    const m = h.match(/<title>([^<]+?)\s*[—|-]/);
    if (m && norm(m[1]).length >= 3) FEST.push({ slug, key: norm(m[1]) });
  }
  FEST.sort((a, b) => b.key.length - a.key.length);                // 긴 이름 우선(「수원화성문화제」 > 「수원화성」)

  // ① RSS
  const rss = await get('https://rss.blog.naver.com/goohw.xml');
  const items = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1]);
  let fetched = 0, failed = 0;
  for (const it of items) {
    const title = unesc((it.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').trim();
    const link = unesc((it.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '');
    const id = (link.match(/(\d{9,})/) || [])[1]; if (!id) continue;
    const cat = unesc((it.match(/<category>([\s\S]*?)<\/category>/) || [])[1] || '').trim();
    const d = new Date((it.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1]);
    const date = isNaN(d) ? '' : new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);   // KST
    const old = byId.get(id) || {};
    const p = { ...old, id, title, date, cat, url: `https://blog.naver.com/goohw/${id}` };
    if (REFETCH || !old.targets) {
      try {
        await sleep(1500);
        const h = unesc(await get(`https://m.blog.naver.com/PostView.naver?blogId=goohw&logNo=${id}`));
        const paths = new Set();
        for (const m of h.matchAll(/https?:\/\/(?:www\.)?chukjemoa\.co\.kr(\/[^\s"'<>\\)?#]*)?/g)) {
          let u = (m[1] || '/').replace(/[.,;]+$/, ''); if (!u.endsWith('/')) u += '/'; paths.add(u);
        }
        p.targets = [...paths]; fetched++;
      } catch (e) { failed++; p.targets = old.targets || null; }
    }
    const nt = norm(title); const hit = FEST.find(f => nt.includes(f.key));
    p.fest = hit ? hit.slug : null;
    byId.set(id, p);
  }
  const posts = [...byId.values()].filter(p => !/사돈댁/.test(p.title)).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  fs.writeFileSync(OUT, JSON.stringify({ updated: new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16), posts }, null, 1));
  const withFest = posts.filter(p => p.fest).length;
  console.log(`📝 네이버 블로그 짝 목록 — 글 ${posts.length}편 (본문 새로 읽음 ${fetched} · 실패 ${failed}) · 축제 상세와 짝 ${withFest}편 · 축제 색인 ${FEST.length}개`);
})().catch(e => { console.log('⚠️ naver-posts 실패(빌드는 계속):', String(e.message).slice(0, 100)); });
