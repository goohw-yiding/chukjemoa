// 🎄 크리스마스 마켓·빌리지 /winter/christmas-market/ — 2026-11-04 AI 노출 운영(질문=페이지)
// 질문: 「올해 크리스마스 마켓은 어디서 열려?」「서울 크리스마스 마켓 언제?」「산타마을 축제 어디?」
// 원칙(/winter/light/ 와 같음): 날짜마다 출처 상태 — 확정 / 공공데이터 등록(변동 가능) / 예년 기준 예상 / 지난겨울 기간.
//   ⛔ 예년 날짜를 확정처럼 쓰지 않는다. 숫자는 data/ 의 공공데이터·큐레이션에서만 센다. 입장료는 데이터에 없으면 쓰지 않는다.
const fs = require('fs'), path = require('path');

function build({ ROOT, layout, writePage, SITE_NAME }) {
  const load = f => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')); } catch (e) { return []; } };
  const api = load('festivals_api.json'), cl = load('cltur_fstvl.json'), cur = load('festivals.json');
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const n = s => String(s || '').replace(/-/g, '').slice(0, 8);
  const TODAY = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');

  const XMAS = /크리스마스|산타|성탄/;               // 제목에 크리스마스·산타가 들어간 행사
  const MKT = /마켓|빌리지/;                          // 마켓·빌리지는 크리스마스 당일(12/25)을 포함해 열 때만
  const SKIP = /공연|콘서트|뮤지컬|연극|BPAM|플리마켓|프리마켓|아트프리/;
  const ALIAS = { '부산크리스마스트리문화축제': '광복로겨울빛트리축제' };
  const stem = s => String(s || '').replace(/(특별자치)?(시|군|구)$/, '');
  const key = (title, sido, sig) => {
    let t = String(title || '').replace(/제\s*\d+\s*회/g, '').replace(/20\d\d(년)?/g, '').replace(/[\s·:,'"()\-]/g, '');
    if (ALIAS[t]) t = ALIAS[t];
    const st = stem(sig); if (st && st.length >= 2 && t.startsWith(st)) t = t.slice(st.length);
    return t + '|' + String(sido || '').slice(0, 2);
  };
  const thisSeason = (s, e) => s >= '20261101' && s <= '20270131';
  const lastSeason = (s, e) => s >= '20251001' && s <= '20260131' && e >= '20251201';
  const coversXmas = (s, e) => s <= '20261225' && e >= '20261225' || s <= '20251225' && e >= '20251225';
  const wanted = (t, ov, s, e) => !SKIP.test(t) && (XMAS.test(t) || (MKT.test(t) && coversXmas(s, e)));

  const G = new Map();
  const get = (title, sido, sig) => {
    const k = key(title, sido, sig);
    if (!G.has(k)) G.set(k, { name: String(title).replace(/^20\d\d\s*/, '').replace(/\s*20\d\d$/, '').replace(/^제\s*\d+\s*회\s*/, '').replace(/,\s*/g, ' ').trim(), sido: String(sido || '').trim(), sig: String(sig || '').trim(), kind: MKT.test(title) ? 'market' : 'festa', now: null, prev: null, ids: [], ov: '', place: '' });
    return G.get(k);
  };
  [...api.map(x => [x, 'api']), ...cl.map(x => [x, 'cl'])].forEach(([x, src]) => {
    const t = x.title || '', s = n(x.start), e = n(x.end) || s;
    if (!wanted(t, x.ov, s, e)) return;
    if (!(thisSeason(s, e) || lastSeason(s, e))) return;
    const g = get(t, x.sido, x.sigungu);
    g.ids.push(String(x.id)); if ((x.ov || '').length > g.ov.length) g.ov = String(x.ov);
    if (!g.place && x.place) g.place = String(x.place);
    if (!g.sig && x.sigungu) g.sig = x.sigungu;
    if (thisSeason(s, e)) { if (!g.now || (g.now.st === 'reg' && src === 'api' && g.now.src !== 'api')) g.now = { s, e, st: 'reg', src }; }
    else if (!g.prev || src === 'api') g.prev = { s, e };
  });
  cur.forEach(f => {
    const t = f.name || '', s = n(f.start), e = n(f.end) || s;
    if (!wanted(t, f.desc, s, e)) return;
    if (!(thisSeason(s, e) || lastSeason(s, e))) return;
    const g = get(t, f.region, f.city);
    if (f.place && !g.place) g.place = f.place;
    if (thisSeason(s, e)) { if (f.confirmed) g.now = { s, e, st: 'conf' }; else if (!g.now) g.now = { s, e, st: 'est' }; }
    else if (!g.prev) g.prev = { s, e };
  });
  // 행사 설명에 «마켓»이 들어 있으면 마켓을 함께 여는 축제로 표시(예: 크리스마스 마켓 운영)
  const items = [...G.values()].filter(g => g.now || g.prev).map(g => {
    const sh = d => String(+d.slice(0, 4) + 1) + d.slice(4);
    g.win = g.now ? { s: g.now.s, e: g.now.e, approx: g.now.st === 'est' } : { s: sh(g.prev.s), e: sh(g.prev.e), approx: true };
    g.st = g.now ? g.now.st : 'prev';
    g.hasMkt = g.kind === 'market' || /마켓/.test(g.ov);
    return g;
  }).filter(g => g.win.e >= TODAY).sort((a, b) => a.win.s.localeCompare(b.win.s));

  const pageById = new Map(), pageByTitle = new Map();
  try { JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'festival_pages.json'), 'utf8')).forEach(p => { pageById.set(String(p.id), p.slug); pageByTitle.set(String(p.title).replace(/\s/g, ''), p.slug); }); } catch (e) { }
  items.forEach(g => { g.slug = g.ids.map(i => pageById.get(i)).find(Boolean) || pageByTitle.get(g.name.replace(/\s/g, '')) || ''; });

  const MD = d => (+d.slice(4, 6)) + '월 ' + (+d.slice(6, 8)) + '일';
  const MDs = d => (+d.slice(4, 6)) + '.' + (+d.slice(6, 8));
  const YMD = d => d.slice(0, 4) + '.' + MDs(d);
  const on = (g, a, b) => g.win.s <= b && g.win.e >= a;
  const mk = items.filter(g => g.hasMkt), fixed = items.filter(g => g.st === 'conf' || g.st === 'reg');
  const est = items.length - fixed.length;
  const firstFixed = fixed.slice().sort((a, b) => a.win.s.localeCompare(b.win.s))[0];
  const xmas = items.filter(g => on(g, '20261225', '20261225'));
  const capital = items.filter(g => /^(서울|경기|인천)/.test(g.sido));
  const seoul = items.filter(g => /^서울/.test(g.sido));
  const kidsy = items.filter(g => /산타|썰매|어린이|키즈/.test(g.name + ' ' + g.ov)).sort((a, b) => (/산타/.test(b.name) ? 1 : 0) - (/산타/.test(a.name) ? 1 : 0));
  const lab = g => (g.name.length < 12 && !g.name.includes(stem(g.sig)) ? (g.sido + ' ' + g.sig).trim() + ' ' : '') + g.name;

  const WEEKS = [['11.28~29', '20261128', '20261129'], ['12.5~6', '20261205', '20261206'], ['12.12~13', '20261212', '20261213'], ['12.19~20', '20261219', '20261220'], ['12.24~25 (성탄)', '20261224', '20261225'], ['12.26~27', '20261226', '20261227'], ['12.31~1.3', '20261231', '20270103']];
  const wk = WEEKS.map(([lab, a, b]) => { const l = items.filter(g => on(g, a, b)); return { lab, n: l.length, f: l.filter(g => !g.win.approx && g.st !== 'prev').length, names: l.map(g => g.name) }; });

  const ST = { conf: ['일정 확정', '#0a6c63', '#e2f5f2'], reg: ['공공데이터 등록·변동 가능', '#1d4ed8', '#e8efff'], est: ['예년 기준 예상', '#92400e', '#fff4e0'], prev: ['지난겨울 기준', '#6b7280', '#f3f4f6'] };
  const badge = st => `<span style="display:inline-block;font-size:.76rem;font-weight:800;padding:2px 8px;border-radius:999px;color:${ST[st][1]};background:${ST[st][2]};white-space:nowrap">${ST[st][0]}</span>`;
  const nm = g => g.slug ? `<a href="/festival/${g.slug}/" style="color:#0a6c63">${esc(g.name)}</a>` : esc(g.name);
  const whenNow = g => g.now ? `${YMD(g.now.s)}~${MDs(g.now.e)}` : '—';
  const whenPrev = g => g.prev ? `${YMD(g.prev.s)}~${MDs(g.prev.e)}` : '—';
  const names = (list, k) => list.slice(0, k).map(lab).join(', ');
  const withDate = (list, k) => list.slice(0, k).map(g => `${lab(g)}(${g.win.approx ? '≈' : ''}${MDs(g.win.s)}~${MDs(g.win.e)})`).join(', ');

  const ans = `2026년 크리스마스 마켓·빌리지와 크리스마스·산타 축제는 축제모아(chukjemoa.co.kr) 집계 전국 <b>${items.length}곳</b>입니다. 이 가운데 올해 날짜가 확정됐거나 공공데이터에 등록된 곳은 <b>${fixed.length}곳</b>${firstFixed ? `(가장 이른 개막 <b>${MD(firstFixed.win.s)}</b> ${esc(lab(firstFixed))})` : ''}이고, 나머지 <b>${est}곳</b>은 예년 기간 기준 예상입니다. 크리스마스 당일(12월 25일)에 열려 있는 곳은 <b>${xmas.length}곳</b>, 서울에서는 ${esc(withDate(seoul, 4)) || '아직 없음'}입니다.`;

  const faq = [
    ['2026년 크리스마스 마켓은 어디서 열리나요?', `축제모아 집계로 전국 ${items.length}곳이고, 마켓·빌리지 형태(판매 부스가 있는 곳)는 ${mk.length}곳입니다: ${withDate(mk, 10)}${mk.length > 10 ? ' 등' : ''}. «≈»는 올해 날짜가 아직 없어 예년 기간으로 적은 곳입니다.`],
    ['서울 크리스마스 마켓은 언제 하나요?', seoul.length ? `서울은 ${withDate(seoul, 8)} ${seoul.length}곳입니다. 경기·인천에는 ${capital.length - seoul.length}곳이 더 있습니다: ${names(capital.filter(g => !/^서울/.test(g.sido)), 8)}.` : '아직 서울 일정이 등록되지 않았습니다.'],
    ['크리스마스 당일(12월 25일)에 갈 수 있는 곳은?', xmas.length ? `12월 25일에 열려 있는 곳은 ${xmas.length}곳입니다: ${names(xmas, 12)}${xmas.length > 12 ? ' 등' : ''}. 위의 날짜 고르기에서 다른 날짜도 바로 확인할 수 있습니다.` : '아직 해당 날짜에 걸리는 일정이 없습니다.'],
    ['아이랑 가기 좋은 크리스마스 축제는?', kidsy.length ? `산타·썰매·체험 프로그램이 행사 소개에 들어 있는 곳은 ${names(kidsy, 8)}입니다. 산타마을형 축제는 크리스마스가 지나도 이어지는 곳이 있어(예: ${kidsy.slice().sort((a, b) => b.win.e.localeCompare(a.win.e))[0].name} ${MD(kidsy.slice().sort((a, b) => b.win.e.localeCompare(a.win.e))[0].win.e)}까지) 붐비는 성탄 주말을 피해 가기 좋습니다.` : '집계된 곳이 없습니다.'],
    ['입장료는 무료인가요?', '공공데이터에 입장료가 표기되지 않은 곳이 대부분이라 이 페이지에는 적지 않았습니다. 지자체·재단이 여는 크리스마스 문화축제는 대개 거리·광장 행사라 입장 자체는 열려 있지만, 체험·먹거리·판매 부스는 따로 값을 받습니다. 방문 전 각 행사의 공식 채널에서 확인하세요.'],
    ['날짜가 «지난겨울 기준»이면 어떻게 보나요?', '올해 일정이 아직 어디에도 올라오지 않은 행사입니다. 지난겨울(2025년) 실제 기간을 적었고, 보통 해마다 비슷한 주차에 열리므로 계획용으로 쓰고 출발 전 공지를 확인하세요. 날짜가 확정되면 이 페이지가 매일 빌드 때 자동으로 바뀝니다.']
  ];

  const toolData = items.map(g => ({ n: g.name, r: (g.sido + ' ' + g.sig).trim(), k: g.hasMkt ? 'market' : 'festa', s: g.win.s, e: g.win.e, a: g.win.approx ? 1 : 0, st: g.st, u: g.slug ? '/festival/' + g.slug + '/' : '' }));
  const tbl = `<div style="overflow-x:auto"><table class="wltbl"><thead><tr><th>행사</th><th>지역·장소</th><th>올해 일정</th><th>지난겨울</th></tr></thead><tbody>
${items.map(g => `<tr><td><b>${nm(g)}</b>${g.hasMkt ? ' <small>🛍 마켓</small>' : ''}</td><td>${esc(g.sido)} ${esc(g.sig)}${g.place ? `<br><small>${esc(g.place.slice(0, 30))}</small>` : ''}</td><td>${whenNow(g)}<br>${badge(g.st)}</td><td>${whenPrev(g)}</td></tr>`).join('')}
</tbody></table></div>`;
  const wkTbl = `<div style="overflow-x:auto"><table class="wltbl"><thead><tr><th>주말</th><th>열리는 곳</th><th>그중 올해 날짜 있는 곳</th><th>어디</th></tr></thead><tbody>
${wk.map(w => `<tr><td><b>${w.lab}</b></td><td>${w.n}곳</td><td>${w.f}곳</td><td><small>${esc(w.names.slice(0, 6).join(', '))}${w.names.length > 6 ? ' 외' : ''}</small></td></tr>`).join('')}
</tbody></table></div>`;

  const content = `<main><div class="wrap">
<h1 style="font-size:1.5rem;font-weight:900;margin:8px 0 6px">올해 크리스마스 마켓은 어디서 열려? — 2026 전국 크리스마스 마켓·빌리지 ${items.length}곳 날짜표</h1>
<div class="ansbox"><p><b>한 줄 답</b> — ${ans}</p>
<p style="margin-top:6px;font-size:.9rem;color:#4b5563">축제모아(chukjemoa.co.kr)는 한국관광공사·행정안전부 공공데이터로 전국 축제 일정을 매일 모아 날짜·지역·확정 여부까지 정리하는 축제 일정 사이트입니다. 집계 기준일 ${YMD(TODAY)}.</p></div>

<h2 class="sec">🗓 내가 갈 날짜에 열리는 곳 고르기</h2>
<p style="color:#6b7280;font-size:.94rem">날짜를 고르면 그날 열려 있는 크리스마스 마켓·축제만 남깁니다. «≈»는 올해 일정이 아직 없어 예년 기간으로 추정한 곳입니다.</p>
<div class="wlpick"><input type="date" id="wlDate" value="2026-12-25" min="2026-11-01" max="2027-02-28">
<button data-d="2026-12-05">12월 첫 주말</button><button data-d="2026-12-19">12월 셋째 주말</button><button data-d="2026-12-24">이브</button><button data-d="2026-12-25">크리스마스</button><button data-d="2026-12-31">연말</button>
<select id="wlKind"><option value="">전체</option><option value="market">마켓 있는 곳만</option></select>
<select id="wlReg"><option value="">전국</option><option value="수도권">서울·경기·인천</option><option value="영남">부산·울산·경상</option><option value="호남">광주·전라</option><option value="충청">대전·세종·충청</option><option value="강원">강원</option></select></div>
<div id="wlOut" class="wlout"></div>
<script>(function(){var D=${JSON.stringify(toolData)};var L={conf:'확정',reg:'등록',est:'예상',prev:'지난겨울 기준'};
var R={'수도권':/^(서울|경기|인천)/,'영남':/^(부산|울산|대구|경북|경남)/,'호남':/^(광주|전북|전남)/,'충청':/^(대전|세종|충북|충남)/,'강원':/^강원/};
function f(d){return (+d.slice(4,6))+'.'+(+d.slice(6,8))}
function run(){var v=document.getElementById('wlDate').value.replace(/-/g,''),k=document.getElementById('wlKind').value,g=document.getElementById('wlReg').value;
var r=D.filter(function(x){return x.s<=v&&x.e>=v&&(!k||x.k===k)&&(!g||R[g].test(x.r))});
document.getElementById('wlOut').innerHTML='<p><b>'+(+v.slice(4,6))+'월 '+(+v.slice(6,8))+'일</b>에 열려 있는 곳 <b>'+r.length+'곳</b></p>'+(r.length?'<ul>'+r.map(function(x){return '<li>'+(x.k==='market'?'🛍 ':'🎄 ')+(x.u?'<a href="'+x.u+'">'+x.n+'</a>':x.n)+' <span>'+x.r+' · '+(x.a?'≈':'')+f(x.s)+'~'+f(x.e)+' ('+L[x.st]+')</span></li>'}).join('')+'</ul>':'<p class="note">이 날짜·지역에 걸리는 곳이 없습니다.</p>')}
['wlDate','wlKind','wlReg'].forEach(function(i){document.getElementById(i).addEventListener('change',run)});
[].forEach.call(document.querySelectorAll('.wlpick button'),function(b){b.addEventListener('click',function(){document.getElementById('wlDate').value=b.getAttribute('data-d');run()})});run()})();</script>

<h2 class="sec">📅 주말별로 열리는 곳</h2>
${wkTbl}

<h2 class="sec">🎄 크리스마스 마켓·빌리지·축제 ${items.length}곳 — 시작일 순</h2>
<p style="color:#6b7280;font-size:.94rem">🛍 표시는 판매 부스(마켓)가 있는 곳입니다. 크리스마스 이름이 붙은 트리·문화축제와 산타마을 축제도 함께 실었습니다. 불빛 위주의 겨울 빛축제는 <a href="/winter/light/" style="color:#0a6c63">겨울 빛축제·눈꽃축제</a>에 따로 있습니다.</p>
${tbl}

<h2 class="sec">날짜 표시 읽는 법</h2>
<ul style="line-height:1.9;font-size:.95rem;padding-left:20px">
<li>${badge('conf')} 주최 측 발표로 확정된 일정</li>
<li>${badge('reg')} 한국관광공사·행정안전부 공공데이터에 올해 날짜로 올라온 일정 (주최 측 확정 전일 수 있음)</li>
<li>${badge('est')} 축제모아가 예년 개최 시기로 잡아 둔 예상 날짜</li>
<li>${badge('prev')} 올해 일정이 아직 없어 지난겨울(2025년) 실제 기간을 적은 것</li>
</ul>

<h2 class="sec">같이 보면 좋은 것</h2>
<div class="frel2"><a href="/winter/light/">✨ 겨울 빛축제·눈꽃축제</a><a href="/winter/">❄️ 겨울 축제 총정리</a><a href="/2026-12/">12월 축제 일정</a><a href="/seoul/2026-12/">🏙 서울 12월 축제·행사</a><a href="/kids/">👨‍👩‍👧 아이와 가볼만한 축제</a><a href="/course/">🧭 코스 짜기</a></div>

<h2 class="sec">자주 묻는 것</h2>
${faq.map(([q, a]) => `<p style="line-height:1.8"><b>${esc(q)}</b><br>${esc(a)}</p>`).join('')}

<p class="note" style="margin-top:20px">데이터 출처: 한국관광공사 TourAPI 축제 정보, 행정안전부 전국문화축제표준데이터, 축제모아 큐레이션. 일정은 주최 측 사정으로 바뀔 수 있으니 방문 전 공식 채널에서 확인하세요.</p>
</div></main>
<style>.ansbox{background:#ecfdf8;border:1.5px solid #bfe9df;border-radius:14px;padding:14px 18px;margin:6px 0 14px;color:#1f2937;line-height:1.7}.ansbox b{color:#0a6c63}
.wltbl{width:100%;border-collapse:collapse;background:#fff;font-size:.92rem;margin:8px 0 4px}.wltbl th,.wltbl td{padding:8px 10px;border-bottom:1px solid #eef5f3;text-align:left;vertical-align:top}.wltbl th{background:#e2f5f2;color:#0a6c63;white-space:nowrap}.wltbl small{color:#6b7280}
.wlpick{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.wlpick input,.wlpick select{padding:8px 10px;border:1.5px solid #dcefeb;border-radius:10px;font-size:.95rem}.wlpick button{background:#fff;border:1.5px solid #dcefeb;border-radius:999px;padding:7px 13px;font-weight:700;font-size:.86rem;cursor:pointer}
.wlout{background:#f8fbfa;border:1px solid #e5f1ee;border-radius:12px;padding:10px 16px;margin:6px 0 12px}.wlout li{margin:5px 0}.wlout li span{color:#6b7280;font-size:.88rem}.wlout a{color:#0a6c63;font-weight:700}
.frel2{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.frel2 a{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.88rem;padding:9px 15px;border-radius:999px;text-decoration:none}</style>`;

  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  const desc = `2026 크리스마스 마켓·빌리지·크리스마스 축제 전국 ${items.length}곳 날짜표. 올해 날짜 확정·등록 ${fixed.length}곳, 12월 25일에 열린 곳 ${xmas.length}곳. 날짜·지역을 고르면 그날 열리는 곳만 보여 줍니다.`;
  writePage('winter/christmas-market', layout('올해 크리스마스 마켓 어디서? 2026 전국 크리스마스 마켓·빌리지 ' + items.length + '곳 날짜표 | ' + SITE_NAME, desc, '/winter/christmas-market/', content,
    { jsonld: `<script type="application/ld+json">${JSON.stringify(faqLd)}</script>`, ogImage: '/img/cat2-snow-b.webp' }));
  console.log('✓ /winter/christmas-market/ —', items.length, '곳 · 마켓', mk.length, '· 확정/등록', fixed.length, '· 12/25', xmas.length);
  return ['/winter/christmas-market/'];
}
module.exports = { build };
