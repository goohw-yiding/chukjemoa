// 축제 「재고」 감사 — 앞으로 몇 달치가 실제로 차 있는지, 빈 달을 무엇으로 채울 수 있는지.
//
// 왜: 2026-08-31 「총 904건 중 종료 658건(73%)」 경고가 떴다. 그런데 실측해 보니
//     **수집 누락이 아니라 지자체 등록 시차**였다(TourAPI 2026-11 46건 vs 작년 11월 84건,
//     2027-01은 2건 vs 작년 36건). 우리는 TourAPI에 있는 걸 거의 다 갖고 있다(차이 0~7건).
//     → 채울 방법은 «작년 같은 달에 열린 연례 축제»다. 그게 몇 건인지 이 도구로 센다.
// 사용: node audit-supply.js
const fs = require('fs'), path = require('path');
const F = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'festivals_api.json'), 'utf8'));
const y = s => String(s || '').replace(/-/g, '').slice(0, 8);
const kst = new Date(Date.now() + 9 * 3600e3);
const TODAY = kst.toISOString().slice(0, 10).replace(/-/g, '');

// 그 기간에 열리는(겹치는) 축제
const inRange = (a, b) => F.filter(r => {
  const s = y(r.start), e = y(r.end) || s;
  return s && s <= b && e >= a;
});

// 「연례 축제」로 볼 수 있는가 — 제목에서 회차·연도를 지운 이름이 작년에도 있었나
const norm = t => String(t || '').replace(/^제?\s*\d+\s*회\s*/, '').replace(/\d{4}\s*년?/g, '')
  .replace(/[\s()·,'"「」]/g, '').trim();

const L = [];
const p = s => L.push(String(s));
p('# 축제 재고 감사 — ' + TODAY.slice(0, 4) + '-' + TODAY.slice(4, 6) + '-' + TODAY.slice(6, 8));
p('');
p('`node audit-supply.js` 자동 생성. 숫자는 전부 실측입니다.');
p('');
p('| 달 | 올해 확보 | 작년 같은 달 | 부족 | 작년 것 중 «올해 아직 없는» 연례 축제 |');
p('|---|---:|---:|---:|---:|');

const Y = +TODAY.slice(0, 4), M = +TODAY.slice(4, 6);
const rows = [];
for (let i = 0; i < 8; i++) {
  const d = new Date(Y, M - 1 + i, 1);
  const yy = d.getFullYear(), mm = d.getMonth() + 1;
  const a = `${yy}${String(mm).padStart(2, '0')}01`;
  const b = `${yy}${String(mm).padStart(2, '0')}${new Date(yy, mm, 0).getDate()}`;
  const pa = `${yy - 1}${String(mm).padStart(2, '0')}01`;
  const pb = `${yy - 1}${String(mm).padStart(2, '0')}${new Date(yy - 1, mm, 0).getDate()}`;

  const cur = inRange(a, b), prev = inRange(pa, pb);
  const curNames = new Set(cur.map(r => norm(r.title)));
  const missing = prev.filter(r => !curNames.has(norm(r.title)));
  rows.push({ ym: `${yy}-${String(mm).padStart(2, '0')}`, cur: cur.length, prev: prev.length, missing });
  p(`| ${yy}-${String(mm).padStart(2, '0')} | ${cur.length} | ${prev.length} | ${Math.max(0, prev.length - cur.length)} | **${missing.length}** |`);
}

p('');
p('## 채울 수 있는 것 — 작년에 열렸는데 올해 일정이 아직 안 올라온 축제');
p('> 올해 일정이 확정된 게 아니다. **「예년 기준」이라고 반드시 밝히고** 쓸 것.');
for (const r of rows) {
  if (!r.missing.length) continue;
  p('');
  p(`### ${r.ym} — ${r.missing.length}건`);
  r.missing.sort((a, b2) => (a.sido || '').localeCompare(b2.sido || ''))
    .slice(0, 40)
    .forEach(f => p(`- ${f.title} (${f.sido || ''} ${f.sigungu || ''}) — 작년 ${y(f.start).slice(4, 6)}/${y(f.start).slice(6, 8)}~${y(f.end).slice(4, 6)}/${y(f.end).slice(6, 8)}${f.ov ? '' : '  ⚠️개요없음'}`));
  if (r.missing.length > 40) p(`- … 외 ${r.missing.length - 40}건`);
}
const out = L.join('\n');
fs.writeFileSync(path.join(__dirname, 'audit-supply.md'), out, 'utf8');
console.log(out.split('\n').slice(0, 20).join('\n'));
console.log('\n→ audit-supply.md 에 전체 목록');
