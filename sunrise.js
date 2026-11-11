// 🌅 새해 해맞이·해넘이 /winter/sunrise/ — 2026-11-11 AI 노출 운영(질문=페이지)
// 질문: 「2027 해돋이 행사 어디서 해?」「새해 해맞이 명소 어디?」「12월 31일 해넘이 행사」
// 원칙(/winter/christmas-market/ 와 같음): 날짜마다 출처 상태 — 확정 / 공공데이터 등록(변동 가능) / 예년 기준 예상 / 지난해 기준.
//   ⛔ 지난해 날짜를 확정처럼 쓰지 않는다. 숫자는 data/ 의 공공데이터·큐레이션에서만 센다.
//   ⛔ 일출 시각은 한국천문연구원 자료로만 쓴다 — 아직 받아 오지 않았으므로 이 페이지에는 적지 않는다(링크만).
const fs = require('fs'), path = require('path');

function build({ ROOT, layout, writePage, SITE_NAME }) {
  const load = f => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')); } catch (e) { return []; } };
  const api = load('festivals_api.json'), cl = load('cltur_fstvl.json'), cur = load('festivals.json');
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const n = s => String(s || '').replace(/-/g, '').slice(0, 8);
  const TODAY = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');

  const RE = /해맞이|해돋이|일출|해넘이|타종|제야/;
  const SKIP = /마을축제|공연|콘서트/;                 // 「해맞이마을축제」(10월, 마을 이름) 등
  const kindOf = t => /해맞이|해돋이|일출/.test(t) ? (/해넘이/.test(t) ? 'both' : 'rise') : (/해넘이/.test(t) ? 'set' : 'bell');
  const stem = s => String(s || '').replace(/(특별자치)?(시|군|구)$/, '');
  const key = (title, sido, sig) => {
    let t = String(title || '').replace(/제\s*\d+\s*회/g, '').replace(/20\d\d(년)?/g, '').replace(/병오년|정미년|신년|새해/g, '')
      .replace(/해돋이/g, '해맞이').replace(/[\s·.:,'"()\-]/g, '').replace(/(축제|행사|축전)$/, '');
    const st = stem(sig); if (st && st.length >= 2 && t.startsWith(st)) t = t.slice(st.length);
    return t + '|' + String(sido || '').slice(0, 2) + stem(sig);
  };
  const thisSeason = s => s >= '20261225' && s <= '20270115';
  const lastSeason = s => s >= '20251225' && s <= '20260115';

  const G = new Map();
  const get = (title, sido, sig) => {
    const k = key(title, sido, sig);
    if (!G.has(k)) G.set(k, { name: String(title).replace(/^20\d\d(년)?\s*/, '').replace(/^제\s*\d+\s*회\s*/, '').trim(), sido: String(sido || '').trim(), sig: String(sig || '').trim(), kind: kindOf(title), now: null, prev: null, ids: [], place: '' });
    return G.get(k);
  };
  [...api.map(x => [x, 'api']), ...cl.map(x => [x, 'cl'])].forEach(([x, src]) => {
    const t = x.title || '', s = n(x.start), e = n(x.end) || s;
    if (!RE.test(t) || SKIP.test(t)) return;
    if (!(thisSeason(s) || lastSeason(s))) return;
    const g = get(t, x.sido, x.sigungu);
    g.ids.push(String(x.id));
    if (!g.place && x.place) g.place = String(x.place);
    if (thisSeason(s)) { if (!g.now || (src === 'api' && g.now.src !== 'api')) { g.now = { s, e, st: 'reg', src }; g.name = String(t).replace(/^20\d\d(년)?\s*/, '').replace(/^제\s*\d+\s*회\s*/, '').trim(); } }
    else if (!g.prev || src === 'api') g.prev = { s, e };
  });
  cur.forEach(f => {
    const t = f.name || '', s = n(f.start), e = n(f.end) || s;
    if (!RE.test(t) || SKIP.test(t)) return;
    if (!(thisSeason(s) || lastSeason(s))) return;
    const g = get(t, f.region, f.city);
    if (f.place && !g.place) g.place = f.place;
    if (thisSeason(s)) { if (f.confirmed) g.now = { s, e, st: 'conf' }; else if (!g.now) g.now = { s, e, st: 'est' }; }
    else if (!g.prev) g.prev = { s, e };
  });
  const sh = d => String(+d.slice(0, 4) + 1) + d.slice(4);
  const items = [...G.values()].filter(g => g.now || g.prev).map(g => {
    g.name = g.name.replace(/^(병오년|정미년)\s*/, '');   // 지난해 간지(병오년)를 올해 이름처럼 보이지 않게
    g.win = g.now ? { s: g.now.s, e: g.now.e, approx: g.now.st === 'est' } : { s: sh(g.prev.s), e: sh(g.prev.e), approx: true };
    g.st = g.now ? g.now.st : 'prev';
    return g;
  }).filter(g => g.win.e >= TODAY).sort((a, b) => a.win.s.localeCompare(b.win.s) || a.sido.localeCompare(b.sido));

  const pageById = new Map(), pageByTitle = new Map();
  try { JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'festival_pages.json'), 'utf8')).forEach(p => { pageById.set(String(p.id), p.slug); pageByTitle.set(String(p.title).replace(/\s/g, ''), p.slug); }); } catch (e) { }
  items.forEach(g => { g.slug = g.ids.map(i => pageById.get(i)).find(Boolean) || pageByTitle.get(g.name.replace(/\s/g, '')) || ''; });

  const MD = d => (+d.slice(4, 6)) + '월 ' + (+d.slice(6, 8)) + '일';
  const MDs = d => (+d.slice(4, 6)) + '.' + (+d.slice(6, 8));
  const YMD = d => d.slice(0, 4) + '.' + MDs(d);
  const on = (g, d) => g.win.s <= d && g.win.e >= d;
  const fixed = items.filter(g => g.st === 'conf' || g.st === 'reg');
  const est = items.length - fixed.length;
  const rise = items.filter(g => g.kind === 'rise' || g.kind === 'both');
  const set = items.filter(g => g.kind === 'set' || g.kind === 'both');
  const bell = items.filter(g => g.kind === 'bell');
  const capital = items.filter(g => /^(서울|경기|인천)/.test(g.sido));
  const east = rise.filter(g => /^(강원|경북|울산|부산)/.test(g.sido));
  const lab = g => { const st = stem(g.sig); const known = (st.length >= 2 && g.name.includes(st)) || (g.sido && g.name.includes(g.sido.slice(0, 2))); return (known ? '' : (g.sido + ' ' + g.sig).trim() + ' ') + g.name; };
  const withDate = (list, k) => list.slice(0, k).map(g => `${lab(g)}(${g.win.approx ? '≈' : ''}${g.win.s === g.win.e ? MDs(g.win.s) : MDs(g.win.s) + '~' + MDs(g.win.e)})`).join(', ');
  const names = (list, k) => list.slice(0, k).map(lab).join(', ');
  const fixedRise = fixed.filter(g => g.kind === 'rise' || g.kind === 'both');

  const DAYS = [['12월 30일', '20261230'], ['12월 31일 (해넘이·제야)', '20261231'], ['1월 1일 (해맞이)', '20270101']];
  const dayRows = DAYS.map(([l, d]) => { const L = items.filter(g => on(g, d)); return { l, n: L.length, f: L.filter(g => g.st === 'conf' || g.st === 'reg').length, names: L.map(lab) }; });

  const KIND = { rise: '🌅 해맞이', set: '🌇 해넘이', both: '🌅🌇 해넘이·해맞이', bell: '🔔 타종·제야' };
  const ST = { conf: ['일정 확정', '#0a6c63', '#e2f5f2'], reg: ['공공데이터 등록·변동 가능', '#1d4ed8', '#e8efff'], est: ['예년 기준 예상', '#92400e', '#fff4e0'], prev: ['지난해 기준', '#6b7280', '#f3f4f6'] };
  const badge = st => `<span style="display:inline-block;font-size:.76rem;font-weight:800;padding:2px 8px;border-radius:999px;color:${ST[st][1]};background:${ST[st][2]};white-space:nowrap">${ST[st][0]}</span>`;
  const nm = g => g.slug ? `<a href="/festival/${g.slug}/" style="color:#0a6c63">${esc(g.name)}</a>` : esc(g.name);
  const rng = (a, b) => a === b ? YMD(a) : `${YMD(a)}~${MDs(b)}`;
  const whenNow = g => g.now ? rng(g.now.s, g.now.e) : '—';
  const whenPrev = g => g.prev ? rng(g.prev.s, g.prev.e) : '—';

  const ans = `2026년 마지막 날~2027년 새해 첫날 해맞이·해넘이·타종 행사는 축제모아(chukjemoa.co.kr) 집계 전국 <b>${items.length}곳</b>입니다. 이 가운데 올해 날짜가 공공데이터에 등록됐거나 확정된 곳은 <b>${fixed.length}곳</b>${fixedRise.length ? `(해맞이는 ${esc(withDate(fixedRise, 4))})` : ''}이고, 나머지 <b>${est}곳</b>은 지난해(2025→2026) 실제 날짜를 기준으로 적었습니다. 1월 1일 해맞이 <b>${rise.length}곳</b> · 12월 31일 해넘이 <b>${set.length}곳</b> · 타종·제야 <b>${bell.length}곳</b>${capital.length ? `, 서울·경기·인천은 ${esc(names(capital, 5))}` : ''}입니다.`;

  const faq = [
    ['2027년 새해 해돋이(해맞이) 행사는 어디서 열리나요?', rise.length ? `축제모아 집계로 1월 1일 해맞이 행사는 전국 ${rise.length}곳입니다: ${withDate(rise, 14)}${rise.length > 14 ? ' 등' : ''}. «≈»는 올해 날짜가 아직 없어 지난해 날짜로 적은 곳입니다.` : '아직 집계된 곳이 없습니다.'],
    ['서울·수도권에서 해맞이 행사를 하는 곳은?', capital.length ? `서울·경기·인천에서는 ${withDate(capital, 10)} ${capital.length}곳입니다. 대부분 동네 산 정상이나 공원에서 열려 대중교통으로 갈 수 있지만, 1월 1일 새벽에는 첫차 시간을 미리 확인해야 합니다.` : '아직 수도권 일정이 등록되지 않았습니다.'],
    ['강원·경북·울산·부산 해맞이 행사는?', east.length ? `강원·경북·울산·부산에서는 ${withDate(east, 10)} ${east.length}곳입니다. 1월 1일 동해안 해맞이 명소는 숙소와 도로가 크게 붐비는 날이라 숙소·교통을 일찍 잡는 것이 좋습니다.` : '아직 집계된 곳이 없습니다.'],
    ['12월 31일 해넘이·제야 행사는 어디서 하나요?', (set.length + bell.length) ? `해넘이 행사는 ${withDate(set, 8) || '없음'}${set.length ? ` ${set.length}곳` : ''}, 타종·제야 행사는 ${withDate(bell, 6) || '없음'}${bell.length ? ` ${bell.length}곳` : ''}입니다. 서해안·남해안은 해넘이를, 동해안은 해맞이를 여는 곳이 많습니다.` : '아직 집계된 곳이 없습니다.'],
    ['1월 1일 일출 시각은 몇 시인가요?', '일출 시각은 지역마다 몇 분씩 다르고, 매년 한국천문연구원이 지역별 일출·일몰 시각을 발표합니다. 이 페이지는 행사 날짜만 정리하고 일출 시각은 적지 않았습니다. 정확한 시각은 한국천문연구원 천문우주정보(astro.kasi.re.kr)의 «일출일몰시각계산»에서 가려는 지역으로 확인하세요. 행사 시작 시각은 행사마다 달라 주최 측 공지를 봐야 합니다.'],
    ['날짜가 «지난해 기준»이면 어떻게 보나요?', '올해 일정이 아직 공공데이터에 올라오지 않은 행사입니다. 해맞이·해넘이는 날짜가 12월 31일·1월 1일로 거의 고정이라 날짜 자체보다는 «올해도 여는지»가 관건입니다. 지자체 공지로 개최 여부를 확인하세요. 등록되면 이 페이지가 매일 빌드 때 자동으로 바뀝니다.']
  ];

  const REG = { '수도권': /^(서울|경기|인천)/, '동해안': /^(강원|경북|울산|부산)/, '충청': /^(대전|세종|충북|충남)/, '호남': /^(광주|전북|전남)/, '영남내륙': /^(대구|경남)/, '제주': /^제주/ };
  const toolData = items.map(g => ({ n: g.name, r: (g.sido + ' ' + g.sig).trim(), k: g.kind, s: g.win.s, e: g.win.e, a: g.win.approx ? 1 : 0, st: g.st, p: (g.place || '').slice(0, 30), u: g.slug ? '/festival/' + g.slug + '/' : '' }));
  const tbl = `<div style="overflow-x:auto"><table class="wltbl"><thead><tr><th>행사</th><th>지역·장소</th><th>올해 일정</th><th>지난해</th></tr></thead><tbody>
${items.map(g => `<tr><td><b>${nm(g)}</b><br><small>${KIND[g.kind]}</small></td><td>${esc(g.sido)} ${esc(g.sig)}${g.place ? `<br><small>${esc(g.place.slice(0, 30))}</small>` : ''}</td><td>${whenNow(g)}<br>${badge(g.st)}</td><td>${whenPrev(g)}</td></tr>`).join('')}
</tbody></table></div>`;
  const dayTbl = `<div style="overflow-x:auto"><table class="wltbl"><thead><tr><th>날짜</th><th>열리는 곳</th><th>그중 올해 날짜 있는 곳</th><th>어디</th></tr></thead><tbody>
${dayRows.map(w => `<tr><td><b>${w.l}</b></td><td>${w.n}곳</td><td>${w.f}곳</td><td><small>${esc(w.names.slice(0, 8).join(', '))}${w.names.length > 8 ? ' 외' : ''}</small></td></tr>`).join('')}
</tbody></table></div>`;

  const content = `<main><div class="wrap">
<h1 style="font-size:1.5rem;font-weight:900;margin:8px 0 6px">2027 해돋이 행사 어디서 해? — 새해 해맞이·해넘이 명소 전국 ${items.length}곳 날짜표</h1>
<div class="ansbox"><p><b>한 줄 답</b> — ${ans}</p>
<p style="margin-top:6px;font-size:.9rem;color:#4b5563">축제모아(chukjemoa.co.kr)는 한국관광공사·행정안전부 공공데이터로 전국 축제 일정을 매일 모아 날짜·지역·확정 여부까지 정리하는 축제 일정 사이트입니다. 집계 기준일 ${YMD(TODAY)}.</p></div>

<h2 class="sec">🧭 지역·종류로 고르기</h2>
<p style="color:#6b7280;font-size:.94rem">지역과 종류를 고르면 해당 행사만 남깁니다. «≈»는 올해 일정이 아직 없어 지난해 날짜로 적은 곳입니다.</p>
<div class="wlpick"><select id="srKind"><option value="">전체</option><option value="rise">🌅 1월 1일 해맞이</option><option value="set">🌇 12월 31일 해넘이</option><option value="bell">🔔 타종·제야</option></select>
<select id="srReg"><option value="">전국</option>${Object.keys(REG).map(k => `<option value="${k}">${k === '수도권' ? '서울·경기·인천' : k === '동해안' ? '강원·경북·울산·부산' : k === '영남내륙' ? '대구·경남' : k}</option>`).join('')}</select>
<label style="font-size:.9rem"><input type="checkbox" id="srFix"> 올해 날짜 있는 곳만</label></div>
<div id="srOut" class="wlout"></div>
<script>(function(){var D=${JSON.stringify(toolData)};var L={conf:'확정',reg:'등록',est:'예상',prev:'지난해 기준'};var K={rise:'🌅 ',set:'🌇 ',both:'🌅🌇 ',bell:'🔔 '};
var R={${Object.entries(REG).map(([k, v]) => `'${k}':${v.toString()}`).join(',')}};
function f(d){return (+d.slice(4,6))+'.'+(+d.slice(6,8))}
function run(){var k=document.getElementById('srKind').value,g=document.getElementById('srReg').value,x0=document.getElementById('srFix').checked;
var r=D.filter(function(x){return (!k||x.k===k||(x.k==='both'&&k!=='bell'))&&(!g||R[g].test(x.r))&&(!x0||x.st==='conf'||x.st==='reg')});
document.getElementById('srOut').innerHTML='<p>고른 조건에 맞는 곳 <b>'+r.length+'곳</b></p>'+(r.length?'<ul>'+r.map(function(x){return '<li>'+K[x.k]+(x.u?'<a href="'+x.u+'">'+x.n+'</a>':x.n)+' <span>'+x.r+(x.p?' · '+x.p:'')+' · '+(x.a?'≈':'')+(x.s===x.e?f(x.s):f(x.s)+'~'+f(x.e))+' ('+L[x.st]+')</span></li>'}).join('')+'</ul>':'<p class="note">이 조건에 맞는 곳이 없습니다.</p>')}
['srKind','srReg','srFix'].forEach(function(i){document.getElementById(i).addEventListener('change',run)});run()})();</script>

<h2 class="sec">📅 날짜별로 열리는 곳</h2>
${dayTbl}

<h2 class="sec">🌅 해맞이·해넘이·타종 행사 ${items.length}곳 — 날짜 순</h2>
${tbl}

<h2 class="sec">일출 시각은 어디서 보나</h2>
<p style="line-height:1.8;font-size:.96rem">지역별 1월 1일 일출 시각은 <b>한국천문연구원</b>이 발표합니다. <a href="https://astro.kasi.re.kr/" rel="nofollow noopener" target="_blank" style="color:#0a6c63;font-weight:700">한국천문연구원 일출일몰시각계산 →</a>에서 가려는 지역을 넣으면 됩니다. 축제모아는 이 페이지에 일출 시각을 따로 적지 않았습니다(천문연 자료로만 쓰기 위해).</p>

<h2 class="sec">날짜 표시 읽는 법</h2>
<ul style="line-height:1.9;font-size:.95rem;padding-left:20px">
<li>${badge('conf')} 주최 측 발표로 확정된 일정</li>
<li>${badge('reg')} 한국관광공사·행정안전부 공공데이터에 올해 날짜로 올라온 일정 (주최 측 확정 전일 수 있음)</li>
<li>${badge('est')} 축제모아가 예년 개최 시기로 잡아 둔 예상 날짜</li>
<li>${badge('prev')} 올해 일정이 아직 없어 지난해(2025년 말~2026년 1월 1일) 실제 날짜를 1년 뒤로 옮겨 적은 것</li>
</ul>

<h2 class="sec">같이 보면 좋은 것</h2>
<div class="frel2"><a href="/winter/christmas-market/">🎄 크리스마스 마켓·빌리지</a><a href="/winter/light/">✨ 겨울 빛축제·눈꽃축제</a><a href="/winter/">❄️ 겨울 축제 총정리</a><a href="/2026-12/">12월 축제 일정</a><a href="/seoul/2026-12/">🏙 서울 12월 축제·행사</a><a href="/course/">🧭 코스 짜기</a></div>

<h2 class="sec">자주 묻는 것</h2>
${faq.map(([q, a]) => `<p style="line-height:1.8"><b>${esc(q)}</b><br>${esc(a)}</p>`).join('')}

<p class="note" style="margin-top:20px">데이터 출처: 한국관광공사 TourAPI 축제 정보, 행정안전부 전국문화축제표준데이터, 축제모아 큐레이션. 해맞이 행사는 기상·안전 사정으로 취소되기도 하니 방문 전 지자체 공지를 확인하세요.</p>
</div></main>
<style>.ansbox{background:#ecfdf8;border:1.5px solid #bfe9df;border-radius:14px;padding:14px 18px;margin:6px 0 14px;color:#1f2937;line-height:1.7}.ansbox b{color:#0a6c63}
.wltbl{width:100%;border-collapse:collapse;background:#fff;font-size:.92rem;margin:8px 0 4px}.wltbl th,.wltbl td{padding:8px 10px;border-bottom:1px solid #eef5f3;text-align:left;vertical-align:top}.wltbl th{background:#e2f5f2;color:#0a6c63;white-space:nowrap}.wltbl small{color:#6b7280}
.wlpick{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.wlpick select{padding:8px 10px;border:1.5px solid #dcefeb;border-radius:10px;font-size:.95rem}
.wlout{background:#f8fbfa;border:1px solid #e5f1ee;border-radius:12px;padding:10px 16px;margin:6px 0 12px}.wlout li{margin:5px 0}.wlout li span{color:#6b7280;font-size:.88rem}.wlout a{color:#0a6c63;font-weight:700}
.frel2{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.frel2 a{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.88rem;padding:9px 15px;border-radius:999px;text-decoration:none}</style>`;

  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  const desc = `2027 새해 해돋이·해맞이·해넘이·타종 행사 전국 ${items.length}곳 날짜표. 올해 날짜 등록 ${fixed.length}곳, 1월 1일 해맞이 ${rise.length}곳·12월 31일 해넘이 ${set.length}곳. 지역·종류를 고르면 해당 행사만 보여 줍니다.`;
  writePage('winter/sunrise', layout('2027 해돋이 행사 어디서? 새해 해맞이·해넘이 명소 전국 ' + items.length + '곳 날짜표 | ' + SITE_NAME, desc, '/winter/sunrise/', content,
    { jsonld: `<script type="application/ld+json">${JSON.stringify(faqLd)}</script>`, ogImage: '/img/cat2-snow-b.webp' }));
  console.log('✓ /winter/sunrise/ —', items.length, '곳 · 확정/등록', fixed.length, '· 해맞이', rise.length, '· 해넘이', set.length, '· 타종', bell.length);
  return ['/winter/sunrise/'];
}
module.exports = { build };
