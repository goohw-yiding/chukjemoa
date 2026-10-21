// ✨ 겨울 빛축제·눈꽃(얼음)축제 /winter/light/  — 2026-10-21 AI 노출 운영(질문=페이지)
// 질문: 「2026 겨울 빛축제 언제 어디서?」「눈꽃축제·얼음축제 언제 가?」「크리스마스에 갈 빛축제」
// 원칙: 날짜마다 출처 상태를 붙인다 — 확정 / 공공데이터 등록(변동 가능) / 예년 기준 예상 / 지난겨울 기간.
//   ⛔ 예년 날짜를 확정처럼 쓰지 않는다. 숫자는 data/ 의 공공데이터·큐레이션에서만 센다.
const fs = require('fs'), path = require('path');

function build({ ROOT, layout, writePage, SITE_NAME }) {
  const load = f => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')); } catch (e) { return []; } };
  const api = load('festivals_api.json'), cl = load('cltur_fstvl.json'), cur = load('festivals.json');
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const n = s => String(s || '').replace(/-/g, '').slice(0, 8);
  const TODAY = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');

  const LIGHT = /빛|등불|불빛|일루미|크리스마스|루미나|산타|트리/;
  const ICE = /얼음|빙어|송어|산천어|눈꽃|눈축제|썰매|빙벽|꽁꽁/;
  const SKIP = /사진|거장|전시|한우|은빛|주막|마켓|빌리지|모닥불|달빛|별빛산책|별빛축제/;
  const ALIAS = { '부산크리스마스트리문화축제': '광복로겨울빛트리축제' };
  const stem = s => String(s || '').replace(/(특별자치)?(시|군|구)$/, '');
  const key = (title, sido, sig) => {
    let t = String(title || '').replace(/제\s*\d+\s*회/g, '').replace(/20\d\d(년)?/g, '').replace(/얼음나라/g, '').replace(/[\s·:,'"()\-]/g, '');
    if (ALIAS[t]) t = ALIAS[t];
    const st = stem(sig); if (st && st.length >= 2 && t.startsWith(st)) t = t.slice(st.length);
    if (ALIAS[t]) t = ALIAS[t];
    return t + '|' + String(sido || '').slice(0, 2);
  };

  const G = new Map();
  const get = (title, sido, sig) => {
    const k = key(title, sido, sig);
    if (!G.has(k)) G.set(k, { name: String(title).replace(/^20\d\d\s*/, '').replace(/^제\s*\d+\s*회\s*/, '').trim(), sido: String(sido || '').trim(), sig: String(sig || '').trim(), kind: ICE.test(title) ? 'ice' : 'light', now: null, prev: null, ids: [], ov: '' });
    return G.get(k);
  };
  const thisSeason = (s, e) => s >= '20261101' && s <= '20270228';
  const lastSeason = (s, e) => s >= '20251001' && s <= '20260301' && e >= '20251201';

  // ① 공공데이터(TourAPI 우선, 행안부 표준데이터 보조)
  [...api.map(x => [x, 'api']), ...cl.map(x => [x, 'cl'])].forEach(([x, src]) => {
    const t = x.title || ''; if (!(LIGHT.test(t) || ICE.test(t)) || SKIP.test(t)) return;
    const s = n(x.start), e = n(x.end) || s;
    if (!(thisSeason(s, e) || lastSeason(s, e))) return;
    const g = get(t, x.sido, x.sigungu);
    g.ids.push(String(x.id)); if ((x.ov || '').length > g.ov.length) g.ov = String(x.ov);
    if (!g.sig && x.sigungu) g.sig = x.sigungu;
    if (thisSeason(s, e)) { if (!g.now || (g.now.st === 'reg' && src === 'api' && g.now.src !== 'api')) g.now = { s, e, st: 'reg', src }; }
    else if (!g.prev || src === 'api') g.prev = { s, e };
  });
  // ② 축제모아 큐레이션(festivals.json) — confirmed:true 만 «확정», 나머지는 «예년 기준 예상»
  cur.forEach(f => {
    const t = f.name || ''; if (!(LIGHT.test(t) || ICE.test(t) || ['빛', '눈'].includes(f.category)) || SKIP.test(t)) return;
    const s = n(f.start), e = n(f.end) || s;
    if (!(thisSeason(s, e) || lastSeason(s, e))) return;
    const g = get(t, f.region, f.city);
    if (f.category === '눈' && !LIGHT.test(t)) g.kind = 'ice';
    if (f.desc && !f.apiSource && f.desc.length <= 40 && !g.desc) g.desc = f.desc;
    if (thisSeason(s, e)) {
      if (f.confirmed) g.now = { s, e, st: 'conf' };
      else if (!g.now) g.now = { s, e, st: 'est' };
    } else if (!g.prev) g.prev = { s, e };
  });

  const items = [...G.values()].filter(g => g.now || g.prev).map(g => {
    // 비교·도구용 «올겨울 추정 구간»: 지난겨울만 있으면 1년 뒤로 민다(≈ 표시)
    const sh = d => String(+d.slice(0, 4) + 1) + d.slice(4);
    g.win = g.now ? { s: g.now.s, e: g.now.e, approx: g.now.st === 'est' } : { s: sh(g.prev.s), e: sh(g.prev.e), approx: true };
    g.st = g.now ? g.now.st : 'prev';
    return g;
  }).filter(g => g.win.e >= TODAY).sort((a, b) => a.win.s.localeCompare(b.win.s));

  const light = items.filter(g => g.kind === 'light'), ice = items.filter(g => g.kind === 'ice');
  const fixed = items.filter(g => g.st === 'conf' || g.st === 'reg');
  const MD = d => (+d.slice(4, 6)) + '월 ' + (+d.slice(6, 8)) + '일';
  const MDs = d => (+d.slice(4, 6)) + '.' + (+d.slice(6, 8));
  const YMD = d => d.slice(0, 4) + '.' + MDs(d);
  const median = arr => { const a = arr.slice().sort(); return a.length ? a[Math.floor((a.length - 1) / 2)] : ''; };
  const lightMed = median(light.map(g => g.win.s)), iceMed = median(ice.map(g => g.win.s));
  const lightLongest = light.slice().sort((a, b) => b.win.e.localeCompare(a.win.e))[0];
  const on = (g, a, b) => g.win.s <= b && g.win.e >= a;
  const xmas = items.filter(g => on(g, '20261224', '20261225'));
  const capital = items.filter(g => /^(서울|경기|인천)/.test(g.sido));

  // 상세 페이지 연결
  const pageById = new Map(), pageByTitle = new Map();
  try { JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'festival_pages.json'), 'utf8')).forEach(p => { pageById.set(String(p.id), p.slug); pageByTitle.set(String(p.title).replace(/\s/g, ''), p.slug); }); } catch (e) { }
  items.forEach(g => { g.slug = g.ids.map(i => pageById.get(i)).find(Boolean) || pageByTitle.get(g.name.replace(/\s/g, '')) || ''; });

  const ST = { conf: ['일정 확정', '#0a6c63', '#e2f5f2'], reg: ['공공데이터 등록·변동 가능', '#1d4ed8', '#e8efff'], est: ['예년 기준 예상', '#92400e', '#fff4e0'], prev: ['지난겨울 기준', '#6b7280', '#f3f4f6'] };
  const badge = st => `<span style="display:inline-block;font-size:.76rem;font-weight:800;padding:2px 8px;border-radius:999px;color:${ST[st][1]};background:${ST[st][2]};white-space:nowrap">${ST[st][0]}</span>`;
  const nm = g => g.slug ? `<a href="/festival/${g.slug}/" style="color:#0a6c63">${esc(g.name)}</a>` : esc(g.name);
  const whenNow = g => g.now ? `${YMD(g.now.s)}~${MDs(g.now.e)}` : '—';
  const whenPrev = g => g.prev ? `${YMD(g.prev.s)}~${MDs(g.prev.e)}` : '—';
  const table = list => `<div style="overflow-x:auto"><table class="wltbl"><thead><tr><th>축제</th><th>지역</th><th>올겨울 일정</th><th>지난겨울</th></tr></thead><tbody>
${list.map(g => `<tr><td><b>${nm(g)}</b>${g.desc ? `<br><small>${esc(g.desc.slice(0, 40))}</small>` : ''}</td><td>${esc(g.sido)} ${esc(g.sig)}</td><td>${whenNow(g)}<br>${badge(g.st)}</td><td>${whenPrev(g)}</td></tr>`).join('')}
</tbody></table></div>`;
  const names = (list, k) => list.slice(0, k).map(g => g.name).join(', ');

  const ans = `2026~2027년 겨울 빛축제·눈꽃(얼음)축제는 축제모아(chukjemoa.co.kr) 집계 전국 <b>${items.length}곳</b>입니다. 빛축제 <b>${light.length}곳</b>은 시작일 중간값이 <b>${MD(lightMed)}</b>로 11월 말~12월 초에 불을 켜 1월까지 이어지고, 얼음·눈 축제 <b>${ice.length}곳</b>은 강이 어는 <b>${MD(iceMed)}</b> 전후에 몰립니다. 올겨울 날짜가 확정됐거나 공공데이터에 등록된 곳은 <b>${fixed.length}곳</b>이고, 나머지는 예년 기간을 기준으로 적었습니다.`;

  const faq = [
    ['2026년 겨울 빛축제는 언제 시작하나요?', `축제모아가 모은 빛축제 ${light.length}곳의 시작일 중간값은 ${MD(lightMed)}입니다. 포항국제불빛축제처럼 11월에 하루 이틀 여는 곳도 있지만, 대부분은 11월 말~12월 초에 점등해 1월(${lightLongest ? lightLongest.name + '은 ' + MD(lightLongest.win.e) + '까지' : '일부는 2월까지'})까지 매일 저녁 켜 둡니다.`],
    ['눈꽃축제·얼음축제는 언제 가야 하나요?', `얼음·눈 축제 ${ice.length}곳의 시작일 중간값은 ${MD(iceMed)}입니다. 얼음낚시 축제는 얼음이 사람이 올라설 만큼 두꺼워져야 열리므로 1월 둘째 주~1월 말이 가장 안정적이고, 포근한 해에는 개막이 밀리거나 조기 종료됩니다. ${ice.filter(g => g.st === 'conf').map(g => `${g.name}의 올해 일정은 ${YMD(g.now.s)}~${MDs(g.now.e)}로 확정됐습니다.`).join(' ')}`.trim()],
    ['크리스마스(12월 24~25일)에 갈 수 있는 빛축제는?', xmas.length ? `올겨울 일정(또는 예년 기간) 기준으로 12월 24~25일에 열려 있는 곳은 ${xmas.length}곳입니다: ${names(xmas, 10)}${xmas.length > 10 ? ' 등' : ''}. 위의 날짜 고르기에서 다른 날짜도 바로 확인할 수 있습니다.` : '아직 해당 날짜에 걸리는 일정이 없습니다.'],
    ['서울·수도권에서 가까운 겨울 빛축제·얼음축제는?', capital.length ? `서울·경기·인천에서는 ${names(capital, 12)}${capital.length > 12 ? ' 등' : ''} ${capital.length}곳이 있습니다.` : '집계된 곳이 없습니다.'],
    ['올겨울 날짜가 확정된 곳은 어디인가요?', fixed.length ? `주최 측 확정 ${fixed.filter(g => g.st === 'conf').length}곳, 공공데이터에 올겨울 날짜가 등록된 곳 ${fixed.filter(g => g.st === 'reg').length}곳으로 모두 ${fixed.length}곳입니다: ${fixed.map(g => `${g.name}(${YMD(g.now.s)}~${MDs(g.now.e)})`).slice(0, 12).join(', ')}. «공공데이터 등록» 표시는 한국관광공사·행정안전부 데이터에 올라온 날짜라 주최 측 사정으로 바뀔 수 있습니다.` : '아직 없습니다.'],
    ['날짜가 «지난겨울 기준»이면 어떻게 보나요?', '올겨울 일정이 아직 어디에도 올라오지 않은 축제입니다. 지난겨울(2025~26) 실제 기간을 그대로 적었고, 보통 해마다 비슷한 요일·주차에 열리므로 휴가·숙소 계획용으로 쓰고 출발 전 주최 측 공지를 확인하세요. 확정되면 이 페이지가 매일 빌드 때 자동으로 바뀝니다.']
  ];

  const toolData = items.map(g => ({ n: g.name, r: (g.sido + ' ' + g.sig).trim(), k: g.kind, s: g.win.s, e: g.win.e, a: g.win.approx ? 1 : 0, st: g.st, u: g.slug ? '/festival/' + g.slug + '/' : '' }));

  const content = `<main><div class="wrap">
<h1 style="font-size:1.5rem;font-weight:900;margin:8px 0 6px">2026 겨울 빛축제·눈꽃축제 언제 어디서? — 전국 ${items.length}곳 일정</h1>
<div class="ansbox"><p><b>한 줄 답</b> — ${ans}</p>
<p style="margin-top:6px;font-size:.9rem;color:#4b5563">축제모아(chukjemoa.co.kr)는 한국관광공사·행정안전부 공공데이터로 전국 축제 일정을 매일 모아 날짜·지역·확정 여부까지 정리하는 축제 일정 사이트입니다. 집계 기준일 ${YMD(TODAY)}.</p></div>

<h2 class="sec">🗓 내가 갈 날짜에 열리는 곳 고르기</h2>
<p style="color:#6b7280;font-size:.94rem">날짜를 고르면 그날 켜져 있는 빛축제·얼음축제만 남깁니다. «≈»는 올겨울 일정이 아직 없어 예년 기간으로 추정한 곳입니다.</p>
<div class="wlpick"><input type="date" id="wlDate" value="2026-12-24" min="2026-11-01" max="2027-03-01">
<button data-d="2026-12-24">크리스마스</button><button data-d="2026-12-31">연말</button><button data-d="2027-01-16">1월 셋째 주말</button><button data-d="2027-02-06">2월 첫 주말</button>
<select id="wlKind"><option value="">전체</option><option value="light">빛축제만</option><option value="ice">얼음·눈만</option></select></div>
<div id="wlOut" class="wlout"></div>
<script>(function(){var D=${JSON.stringify(toolData)};var L={conf:'확정',reg:'등록',est:'예상',prev:'지난겨울 기준'};
function f(d){return (+d.slice(4,6))+'.'+(+d.slice(6,8))}
function run(){var v=document.getElementById('wlDate').value.replace(/-/g,''),k=document.getElementById('wlKind').value;
var r=D.filter(function(x){return x.s<=v&&x.e>=v&&(!k||x.k===k)});
document.getElementById('wlOut').innerHTML='<p><b>'+(+v.slice(4,6))+'월 '+(+v.slice(6,8))+'일</b>에 열려 있는 곳 <b>'+r.length+'곳</b></p>'+(r.length?'<ul>'+r.map(function(x){return '<li>'+(x.k==='ice'?'🧊 ':'✨ ')+(x.u?'<a href="'+x.u+'">'+x.n+'</a>':x.n)+' <span>'+x.r+' · '+(x.a?'≈':'')+f(x.s)+'~'+f(x.e)+' ('+L[x.st]+')</span></li>'}).join('')+'</ul>':'<p class="note">이 날짜에 걸리는 곳이 없습니다.</p>')}
document.getElementById('wlDate').addEventListener('change',run);document.getElementById('wlKind').addEventListener('change',run);
[].forEach.call(document.querySelectorAll('.wlpick button'),function(b){b.addEventListener('click',function(){document.getElementById('wlDate').value=b.getAttribute('data-d');run()})});run()})();</script>

<h2 class="sec">✨ 겨울 빛축제 ${light.length}곳 — 시작일 순</h2>
<p style="color:#6b7280;font-size:.94rem">해가 오후 5시 전후에 지는 계절이라 «밤에 보는 축제»가 겨울 축제의 가장 큰 덩어리입니다. 대부분 한 번 켜면 한 달 이상 매일 저녁 점등합니다.</p>
${table(light)}

<h2 class="sec">🧊 얼음·눈꽃축제 ${ice.length}곳 — 시작일 순</h2>
<p style="color:#6b7280;font-size:.94rem">강과 저수지가 얼어야 열리는 축제입니다. 결빙이 늦으면 개막이 밀리고, 따뜻하면 일찍 끝납니다. 출발 전 주최 측 공지 확인이 꼭 필요합니다.</p>
${table(ice)}

<h2 class="sec">날짜 표시 읽는 법</h2>
<ul style="line-height:1.9;font-size:.95rem;padding-left:20px">
<li>${badge('conf')} 주최 측 발표로 확정된 일정</li>
<li>${badge('reg')} 한국관광공사·행정안전부 공공데이터에 올겨울 날짜로 올라온 일정 (주최 측 확정 전일 수 있음)</li>
<li>${badge('est')} 축제모아가 예년 개최 시기로 잡아 둔 예상 날짜</li>
<li>${badge('prev')} 올겨울 일정이 아직 없어 지난겨울(2025~26) 실제 기간을 적은 것</li>
</ul>

<h2 class="sec">같이 보면 좋은 것</h2>
<div class="frel2"><a href="/winter/">❄️ 겨울 축제 12월·1월·2월 총정리</a><a href="/2026-11/">11월 축제 일정</a><a href="/2026-12/">12월 축제 일정</a><a href="/onsen/">♨️ 전국 온천</a><a href="/mountains/">⛰️ 상고대·설경 명산</a><a href="/course/">🧭 코스 짜기</a></div>

<h2 class="sec">자주 묻는 것</h2>
${faq.map(([q, a]) => `<p style="line-height:1.8"><b>${esc(q)}</b><br>${esc(a)}</p>`).join('')}

<p class="note" style="margin-top:20px">데이터 출처: 한국관광공사 TourAPI 축제 정보, 행정안전부 전국문화축제표준데이터, 축제모아 큐레이션. 일정·요금은 주최 측 사정과 날씨로 바뀔 수 있으니 방문 전 공식 채널에서 확인하세요.</p>
</div></main>
<style>.ansbox{background:#ecfdf8;border:1.5px solid #bfe9df;border-radius:14px;padding:14px 18px;margin:6px 0 14px;color:#1f2937;line-height:1.7}.ansbox b{color:#0a6c63}
.wltbl{width:100%;border-collapse:collapse;background:#fff;font-size:.92rem;margin:8px 0 4px}.wltbl th,.wltbl td{padding:8px 10px;border-bottom:1px solid #eef5f3;text-align:left;vertical-align:top}.wltbl th{background:#e2f5f2;color:#0a6c63;white-space:nowrap}.wltbl small{color:#6b7280}
.wlpick{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.wlpick input,.wlpick select{padding:8px 10px;border:1.5px solid #dcefeb;border-radius:10px;font-size:.95rem}.wlpick button{background:#fff;border:1.5px solid #dcefeb;border-radius:999px;padding:7px 13px;font-weight:700;font-size:.86rem;cursor:pointer}
.wlout{background:#f8fbfa;border:1px solid #e5f1ee;border-radius:12px;padding:10px 16px;margin:6px 0 12px}.wlout li{margin:5px 0}.wlout li span{color:#6b7280;font-size:.88rem}.wlout a{color:#0a6c63;font-weight:700}
.frel2{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.frel2 a{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.88rem;padding:9px 15px;border-radius:999px;text-decoration:none}</style>`;

  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  const desc = `2026~2027 겨울 빛축제·눈꽃(얼음)축제 전국 ${items.length}곳. 빛축제 ${light.length}곳은 ${MD(lightMed)} 전후 점등, 얼음·눈 축제 ${ice.length}곳은 ${MD(iceMed)} 전후 개막. 확정·등록 ${fixed.length}곳 표시, 날짜를 고르면 그날 열리는 곳만 보여 줍니다.`;
  writePage('winter/light', layout('2026 겨울 빛축제·눈꽃축제 일정 — 언제 어디서? 전국 ' + items.length + '곳 | ' + SITE_NAME, desc, '/winter/light/', content,
    { jsonld: `<script type="application/ld+json">${JSON.stringify(faqLd)}</script>`, ogImage: '/img/cat2-snow-b.webp' }));
  console.log('✓ /winter/light/ — 빛', light.length, '· 얼음·눈', ice.length, '· 확정/등록', fixed.length);
  return ['/winter/light/'];
}
module.exports = { build };
