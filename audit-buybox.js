// 축제 상세 페이지가 «어떤 상품을 달고 나갔는지» 분포를 센다.
//
// 왜: 2026-08-10에 「축제 상세 140개가 전부 같은 상품」이었던 사고가 있었고, 규칙을 넓힌 뒤에도
//     63% → 26%가 여전히 폴백이었다. 붙어 있냐가 아니라 «맞는 게 붙어 있냐»를 숫자로 봐야 한다.
//     `node audit-buybox.js` — 폴백 비율이 올라가면 FEST_KIND 규칙을 넓힐 때가 된 것이다.
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, 'festival');
const rx = /class="buybox" data-bb="([A-Za-z0-9]+)" data-slot="main" data-place="festival-page"/;
const fb = /class="buybox" data-bb="([A-Za-z0-9]+)" data-slot="main" data-place="festival"/;

const cnt = {}, fallbackTitles = [];
let total = 0;
for (const d of fs.readdirSync(R, { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const p = path.join(R, d.name, 'index.html');
  if (!fs.existsSync(p)) continue;
  const h = fs.readFileSync(p, 'utf8');
  total++;
  const m = h.match(rx);
  if (m) { cnt[m[1]] = (cnt[m[1]] || 0) + 1; continue; }
  const m2 = h.match(fb);
  const key = '폴백:' + (m2 ? m2[1] : '없음');
  cnt[key] = (cnt[key] || 0) + 1;
  const t = h.match(/<title>(.*?)\s*—/);
  if (t && fallbackTitles.length < 40) fallbackTitles.push(t[1]);
}

const L = [`축제 상세 ${total}개 상품 분포`];
Object.entries(cnt).sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => L.push(`  ${k.padEnd(16)} ${String(v).padStart(4)}  (${(100 * v / total).toFixed(0)}%)`));
const fbTotal = Object.entries(cnt).filter(([k]) => k.startsWith('폴백')).reduce((s, [, v]) => s + v, 0);
L.push('');
L.push(`규칙에 안 걸린 축제 ${fbTotal}개 (${(100 * fbTotal / total).toFixed(0)}%) — 상위 40`);
fallbackTitles.forEach(t => L.push('  - ' + t));
const out = L.join('\n');
fs.writeFileSync(path.join(__dirname, 'audit-buybox.md'), out, 'utf8');
console.log(out);
