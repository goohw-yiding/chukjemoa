// audit.js 의 뒷부분 — 빌드 산출물(HTML) 점검. 단독 실행 안 함.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
// ⚠️ .vercelignore 로 «배포에서 빠지는» 폴더는 여기서도 빼야 한다.
//    2026-08-27: cardnews/ 가 빠져 있어 template.html 이 「고아 페이지 + canonical 누락」 🔴 2건으로 잡혔다.
//    라이브에는 아예 없는 파일이다(.vercelignore 에 cardnews 등재, 2026-08-24).
const SKIP = new Set(['node_modules', '.git', 'data', 'img', 'scripts', '.vercel', 'api', 'cardnews']);

module.exports = function (R, RED, ORANGE, red, orange) {
  // ── 페이지 수집 (⚠️ rel 은 반드시 '/' 로 시작)
  const pages = new Map();
  (function walk(d, rel) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) { if (!SKIP.has(e.name) && !e.name.startsWith('.')) walk(path.join(d, e.name), rel + e.name + '/'); continue; }
      if (e.name.endsWith('.html')) pages.set(rel + (e.name === 'index.html' ? '' : e.name), fs.readFileSync(path.join(d, e.name), 'utf8'));
    }
  })(ROOT, '/');

  const exists = u => pages.has(u) || pages.has(u + 'index.html') || fs.existsSync(path.join(ROOT, u.replace(/^\//, '')));
  const noScript = h => h.replace(/<script[\s\S]*?<\/script>/g, ' ');
  const bodyOf = h => noScript((h.match(/<main[\s\S]*?<\/main>/) || [h])[0])
    .replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();

  const broken = [], orphan = [], render = [], ghost = [], canon = [], jsErr = [], leak = [];
  const linked = new Set(['/']);

  for (const [u, h] of pages) {
    for (const m of noScript(h).matchAll(/href="(\/[^"#?]*)/g)) {
      const t = m[1];
      if (/\.(xml|txt|json|webp|png|jpg|svg|ico|js|css|pdf)$/i.test(t)) continue;
      linked.add(t);
      if (!exists(t)) broken.push(u + ' → ' + t);
    }
    const b = bodyOf(h);
    if (/\bundefined\b|\bNaN\b|\[object Object\]|Invalid Date|�/.test(b)) render.push(u);
    if (!/rel="canonical"/.test(h)) canon.push(u);
    // 개발용 메모가 HTML 주석으로 새어 나갔는지 (2026-08-18 611페이지 실사고)
    for (const c of h.match(/<!--[\s\S]*?-->/g) || []) {
      if (/⚠️|실사고|TODO|FIXME|주의:/.test(c)) leak.push(u);
    }
    for (const m of h.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
      const at = m[1] || '';
      if (/\bsrc=/.test(at)) continue;
      const ty = (at.match(/type="([^"]*)"/) || [])[1] || '';
      if (ty && !/javascript|module/.test(ty)) continue;      // 데이터 섬은 건너뛴다
      try { new vm.Script(m[2]); } catch (e) { jsErr.push(u + ': ' + e.message.slice(0, 60)); }
    }
  }
  for (const u of pages.keys()) if (!linked.has(u) && u !== '/' && u !== '/404.html') orphan.push(u);
  try {
    const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
    for (const m of sm.matchAll(/<loc>https:\/\/chukjemoa\.co\.kr([^<]*)<\/loc>/g)) if (!exists(m[1])) ghost.push(m[1]);
  } catch (e) { }

  R.push('\n## 6. 빌드 산출물 점검 (' + pages.size + '페이지)');
  R.push('| 항목 | 건수 |'); R.push('|---|---|');
  const checks = [['끊긴 내부 링크', broken], ['홈에서 도달 불가(고아)', orphan], ['렌더 사고', render],
  ['사이트맵 유령 URL', ghost], ['canonical 누락', canon], ['인라인 JS 문법오류', jsErr],
  ['개발용 주석 유출', [...new Set(leak)]]];
  checks.forEach(([l, a]) => R.push('| ' + l + ' | ' + (a.length ? '**' + a.length + '**' : '0') + ' |'));
  checks.forEach(([l, a]) => { if (a.length) { R.push('\n' + red(l + ' ' + a.length + '건')); a.slice(0, 10).forEach(s => R.push('- ' + s)); } });
  if (checks.every(([, a]) => !a.length)) R.push('\n✅ 산출물 이상 없음');

  // ── 섹션별 두께 · 판박이
  const secOf = u => /^\/festival\/.+/.test(u) ? '축제상세'
    : /^\/blog\/.+/.test(u) ? '블로그'
      : /^\/course\/.+/.test(u) ? '코스'
        : /^\/trails\/.+/.test(u) ? '걷기길'
          : /^\/jangteo\/.+/.test(u) ? '오일장 시도'
            : /^\/20\d\d-\d\d\/$/.test(u) ? '월별'
              : /^\/(en|ja|zh|tw|es)\//.test(u) ? '외국어' : '허브·기타';
  const bySec = {};
  for (const [u, h] of pages) {
    if (/content="noindex/.test(h)) continue;
    const s = secOf(u), b = bodyOf(h);
    (bySec[s] = bySec[s] || []).push({ u, len: b.length, b });
  }
  const shing = t => { const s = new Set(); for (let i = 0; i + 8 <= t.length; i += 2) s.add(t.slice(i, i + 8)); return s; };
  const jac = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n / (a.size + b.size - n); };

  R.push('\n## 7. 색인 대상 본문 두께 · 판박이 정도');
  R.push('| 섹션 | 개수 | 최소 | 중앙 | 최대 | 2,000자 미만 | 평균 유사도 |');
  R.push('|---|---|---|---|---|---|---|');
  // ⚠️ 얇은 게 «정상»인 페이지가 있다 — 개인정보처리방침·문의처는 길게 늘리면 오히려 나쁜 글이 된다.
  //    이걸 매주 🟠로 올리면 진짜 얇은 페이지가 소음에 묻힌다. 그래서 의도적 예외로 빼되,
  //    **표에는 그대로 세고** 목록에만 「(의도적)」으로 표시한다 — 조용히 숨기면 그것도 거짓말이다.
  const THIN_OK = new Set(['/privacy/', '/contact/', '/editorial/']);
  const thin = [];
  Object.keys(bySec).sort().forEach(s => {
    const a = bySec[s], v = a.map(p => p.len).sort((x, y) => x - y);
    const t = a.filter(p => p.len < 2000); t.forEach(p => thin.push(p));
    const samp = a.filter(p => p.len > 500).slice(0, 40);
    let sim = '—';
    if (samp.length >= 3) {
      const sh = samp.map(p => shing(p.b));
      let sum = 0, c = 0;
      for (let i = 0; i < samp.length; i++) for (let k = i + 1; k < samp.length; k++) { sum += jac(sh[i], sh[k]); c++; }
      sim = (sum / c).toFixed(3);
      if (sum / c > 0.35) ORANGE.push(s + ' 판박이 유사도 ' + sim + ' (0.35 초과)');
    }
    R.push('| ' + s + ' | ' + a.length + ' | ' + v[0] + ' | ' + v[v.length >> 1] + ' | ' + v[v.length - 1] + ' | ' + (t.length ? '**' + t.length + '**' : '0') + ' | ' + sim + ' |');
  });
  const thinReal = thin.filter(p => !THIN_OK.has(p.u));
  if (thin.length) {
    if (thinReal.length) R.push('\n' + orange('본문 2,000자 미만 색인 페이지 ' + thinReal.length + '개'
      + (thin.length > thinReal.length ? ' (의도적 예외 ' + (thin.length - thinReal.length) + '개 제외)' : '')));
    else R.push('\n✅ 얇은 페이지 없음 (의도적 예외 ' + thin.length + '개 제외)');
    thin.sort((a, b) => a.len - b.len).slice(0, 20).forEach(p =>
      R.push('- ' + p.len + '자  ' + p.u + (THIN_OK.has(p.u) ? '  ← 의도적(법적·안내 페이지는 늘리지 않는다)' : '')));
  }

  // ── 「N곳」이라 말하면서 목록이 빈약한 허브
  R.push('\n## 8. 「N곳」이라 말하는데 실제로 보여주는 항목 수');
  R.push('| 페이지 | 본문 | 항목(h2/h3) | 항목당 글자 |'); R.push('|---|---|---|---|');
  for (const u of ['/onsen/', '/flower/', '/pet/', '/accessible/', '/valley/', '/maple/', '/mountains/', '/cafe/', '/jangteo/']) {
    const h = pages.get(u); if (!h) continue;
    const main = noScript((h.match(/<main[\s\S]*?<\/main>/) || [h])[0]).replace(/<style[\s\S]*?<\/style>/g, ' ');
    const n = (main.match(/<h[23][\s>]/g) || []).length;
    const len = main.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
    const per = Math.round(len / Math.max(1, n));
    R.push('| ' + u + ' | ' + len + '자 | ' + n + ' | ' + (per < 60 ? '**' + per + '자**' : per + '자') + ' |');
    if (per < 60) ORANGE.push(u + ' 항목당 ' + per + '자 — 이름 나열 수준');
  }

  // ── 마무리
  R.push('\n---\n## 요약');
  R.push('- 🔴 즉시 고칠 것: **' + RED.length + '건**');
  RED.forEach(s => R.push('  - ' + s));
  R.push('- 🟠 보강할 것: **' + ORANGE.length + '건**');
  ORANGE.forEach(s => R.push('  - ' + s));
  if (!RED.length && !ORANGE.length) R.push('- ✅ 이번 점검에서 나온 문제 없음');

  fs.writeFileSync(path.join(ROOT, 'audit-report.md'), R.join('\n'), 'utf8');
  console.log('=== 축제모아 점검 완료 ===');
  console.log('페이지 ' + pages.size + ' · 🔴 ' + RED.length + '건 · 🟠 ' + ORANGE.length + '건');
  RED.forEach(s => console.log('  🔴 ' + s));
  ORANGE.forEach(s => console.log('  🟠 ' + s));
  console.log('보고서: audit-report.md');
  process.exitCode = RED.length ? 1 : 0;
};
