// 축제 상세에 「붐빔 배수」가 붙은 비율을 시·도별로 센다.
//
// 왜: 2026-08-31에 광주·전남이 visitors.json 에서 통째로 빠져 있었고(행정구역 통합으로
//     시·도 코드가 12로 바뀐 걸 수집기가 «레거시»로 버리고 있었다), 그걸 고친 뒤에도
//     9월 축제가 8월 데이터를 보는 버그가 남아 있었다. 둘 다 «화면에 안 나온다»로만 보였다.
//     → 시·도별 커버리지로 재면 이런 구멍이 숫자로 드러난다.
// 사용: node audit-busy.js
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, 'festival');
const bySido = {};
let total = 0, withBusy = 0;

const idx = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'festival_pages.json'), 'utf8'));
const meta = {};
for (const p of (Array.isArray(idx) ? idx : [])) meta[p.slug] = p;

for (const d of fs.readdirSync(R, { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const p = path.join(R, d.name, 'index.html');
  if (!fs.existsSync(p)) continue;
  const h = fs.readFileSync(p, 'utf8');
  const sido = (meta[d.name] && meta[d.name].sido) || '(미상)';
  bySido[sido] = bySido[sido] || { n: 0, busy: 0 };
  bySido[sido].n++; total++;
  if (/fbadge (hot|qt)/.test(h)) { bySido[sido].busy++; withBusy++; }
}

const L = [`축제 상세 ${total}개 중 붐빔 표시 ${withBusy}개 (${(100 * withBusy / total).toFixed(0)}%)`, ''];
L.push('| 시·도 | 축제 | 붐빔 있음 | 비율 |');
L.push('|---|---:|---:|---:|');
Object.entries(bySido).sort((a, b) => b[1].n - a[1].n).forEach(([s, o]) => {
  const pct = (100 * o.busy / o.n).toFixed(0);
  L.push(`| ${s} | ${o.n} | ${o.busy} | ${pct}%${o.busy === 0 ? '  ⚠️ 0' : ''} |`);
});
const out = L.join('\n');
fs.writeFileSync(path.join(__dirname, 'audit-busy.md'), out, 'utf8');
console.log(out);
