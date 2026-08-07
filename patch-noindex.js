const fs = require('fs');
const CR = t => t.replace(/\r?\n/g, '\r\n');
let s = fs.readFileSync('build.js', 'utf8');
let n = 0;
function rep(a, b, l) { const A = CR(a), B = CR(b); if (s.indexOf(A) < 0) { console.error('MISS ' + l); return; } s = s.replace(A, B); n++; console.log('ok ' + l); }

// ① layout()에 noindex 옵션
rep(`<link rel="canonical" href="\${SITE}\${urlPath}">`,
    `<link rel="canonical" href="\${SITE}\${urlPath}">
\${opts.noindex ? '<meta name="robots" content="noindex,follow">' : ''}`, 'noindex 메타');

// ② 지역별 걷기길 — 브랜드 페이지와 같은 데이터를 다른 기준으로 다시 묶은 것이라 중복.
//    사용자는 그대로 볼 수 있고 검색결과에만 안 나온다(follow라 링크는 살아 있음).
rep(`  writePage(o.path, layout(o.title2, o.desc, '/' + o.path + '/', content, { jsonld: ld }));
  WALK_URLS.push('/' + o.path + '/');`,
    `  const noindex = !!o.noindex;
  writePage(o.path, layout(o.title2, o.desc, '/' + o.path + '/', content, { jsonld: ld, noindex }));
  if (!noindex) WALK_URLS.push('/' + o.path + '/');`, '걷기길 noindex 반영');

rep(`    path: 'trails/area/' + slug, title: \`\${sd} 걷기길\`, emoji: '🚶', items,`,
    `    path: 'trails/area/' + slug, title: \`\${sd} 걷기길\`, emoji: '🚶', items, noindex: true,`, '지역 걷기길 noindex');

fs.writeFileSync('build.js', s);
console.log('총', n, '/3');
