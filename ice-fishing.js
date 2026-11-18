// 🎣 겨울 얼음낚시 축제 /winter/ice-fishing/ — 2026-11-18 AI 노출 운영(질문=페이지)
// 질문: 「얼음낚시 축제 어디서 해?」「2027 산천어축제 언제?」「아이랑 송어·빙어 낚시 축제」
// 원칙(/winter/sunrise/ 와 같음): 날짜마다 출처 상태 — 확정 / 공공데이터 등록(변동 가능) / 예년 기준 예상 / 지난 시즌 기준.
//   ⛔ 지난 시즌 날짜를 확정처럼 쓰지 않는다. 숫자는 data/ 의 공공데이터·큐레이션에서만 센다.
//   ⛔ 요금·프로그램은 주최 측이 TourAPI 소개정보(fest_intro.json)에 올린 원문만 옮긴다(지난 시즌 값일 수 있다고 표시).
//   ⛔ «아이에게 좋다»를 우리가 판단하지 않는다 — 소개문에 어린이 낚시터·뜰채 등이 «적힌» 곳만 표시한다.
//   ⛔ 얼음 두께 기준 같은 수치는 데이터에 없으므로 적지 않는다.
const fs = require('fs'), path = require('path');

function build({ ROOT, layout, writePage, SITE_NAME }) {
  const load = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')); } catch (e) { return d; } };
  const api = load('festivals_api.json', []), cl = load('cltur_fstvl.json', []), cur = load('festivals.json', []), intro = load('fest_intro.json', {});
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const n = s => String(s || '').replace(/-/g, '').slice(0, 8);
  const TODAY = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');

  const RE = /빙어|송어|산천어|꽁꽁|얼음낚시/;
  const stem = s => String(s || '').replace(/(특별자치)?(시|군|구)$/, '');
  const clean = t => String(t || '').replace(/^20\d\d(년)?\s*/, '').replace(/^제\s*\d+\s*회\s*/, '').trim();
  const key = (title, sido, sig) => {
    let t = String(title || '').replace(/제\s*\d+\s*회/g, '').replace(/20\d\d(년)?/g, '').replace(/얼음나라/g, '')
      .replace(/[\s·.:,'"()\-]/g, '').replace(/(축제|행사|축전)$/, '');
    const st = stem(sig); if (st && st.length >= 2 && t.startsWith(st)) t = t.slice(st.length);
    return t + '|' + String(sido || '').slice(0, 2) + stem(sig);
  };
  const thisSeason = s => s >= '20261201' && s <= '20270228';
  const lastSeason = s => s >= '20251201' && s <= '20260228';

  const G = new Map();
  const get = (title, sido, sig) => {
    const k = key(title, sido, sig);
    if (!G.has(k)) G.set(k, { name: clean(title), sido: String(sido || '').trim().slice(0, 2), sig: String(sig || '').trim(), now: null, prev: null, ids: [], place: '', tel: '', text: '' });
    return G.get(k);
  };
  [...api.map(x => [x, 'api']), ...cl.map(x => [x, 'cl'])].forEach(([x, src]) => {
    const t = x.title || '', s = n(x.start), e = n(x.end) || s;
    if (!RE.test(t)) return;
    if (!(thisSeason(s) || lastSeason(s))) return;
    const g = get(t, x.sido, x.sigungu);
    g.ids.push(String(x.id));
    if (!g.place && x.place) g.place = String(x.place);
    if (!g.tel && x.tel) g.tel = String(x.tel);
    if (src === 'api' && x.ov) g.text += ' ' + x.ov;
    if (thisSeason(s)) { if (!g.now || (src === 'api' && g.now.src !== 'api')) { g.now = { s, e, st: 'reg', src }; g.name = clean(t); } }
    else if (!g.prev || src === 'api') g.prev = { s, e };
  });
  cur.forEach(f => {
    const t = f.name || '', s = n(f.start), e = n(f.end) || s;
    if (!RE.test(t)) return;
    if (!(thisSeason(s) || lastSeason(s))) return;
    const g = get(t, f.region, f.city);
    if (f.place && !g.place) g.place = f.place;
    if (f.desc) g.text += ' ' + f.desc;
    if (thisSeason(s)) { if (f.confirmed) g.now = { s, e, st: 'conf' }; else if (!g.now) g.now = { s, e, st: 'est' }; }
    else if (!g.prev) g.prev = { s, e };
  });

  const sh = d => String(+d.slice(0, 4) + 1) + d.slice(4);
  const pageById = new Map(), pageByTitle = new Map();
  try { load('festival_pages.json', []).forEach(p => { pageById.set(String(p.id), p.slug); pageByTitle.set(String(p.title).replace(/\s/g, ''), p.slug); }); } catch (e) { }
  const FISH = ['산천어', '송어', '빙어'];
  const WAYS = ['얼음낚시', '텐트낚시', '실내낚시', '루어낚시', '맨손잡기', '뜰채'];
  const KID = /어린이\s*(전용\s*)?낚시터|어린이\s*뜰채|가족\s*실내\s*낚시터/;
  const items = [...G.values()].filter(g => g.now || g.prev).map(g => {
    g.win = g.now ? { s: g.now.s, e: g.now.e, approx: g.now.st === 'est' } : { s: sh(g.prev.s), e: sh(g.prev.e), approx: true };
    g.st = g.now ? g.now.st : 'prev';
    const it = g.ids.map(i => intro[i]).find(Boolean) || {};
    g.fee = String(it.fee || '').replace(/\s+/g, ' ').trim();
    const prog = String(it.program || '');
    g.feeLines = prog.split(/\n/).map(s => s.replace(/^[\s\-*·]+/, '').trim()).filter(s => /\d[\d,]*\s*원/.test(s)).sort((a, b) => (/얼음낚시/.test(b) ? 1 : 0) - (/얼음낚시/.test(a) ? 1 : 0)).slice(0, 6);
    if (!g.tel && it.hostTel) g.tel = String(it.hostTel);
    if (it.place) g.place = String(it.place);
    const all = g.name + ' ' + prog + ' ' + g.text;
    g.fish = FISH.filter(f => all.includes(f));
    g.ways = WAYS.filter(w => all.includes(w));
    const km = all.match(KID); g.kid = km ? km[0].replace(/\s+/g, ' ') : '';
    g.notice = /안전상의 이유로[^.。*]*/.test(g.text) ? (g.text.match(/안전상의 이유로[^.。*]*/) || [''])[0].trim() : '';
    g.slug = g.ids.map(i => pageById.get(i)).find(Boolean) || pageByTitle.get(g.name.replace(/\s/g, '')) || '';
    return g;
  }).filter(g => g.win.e >= TODAY).sort((a, b) => a.win.s.localeCompare(b.win.s) || a.sido.localeCompare(b.sido));

  const MDs = d => (+d.slice(4, 6)) + '.' + (+d.slice(6, 8));
  const YMD = d => d.slice(0, 4) + '.' + MDs(d);
  const on = (g, d) => g.win.s <= d && g.win.e >= d;
  const isFixed = g => g.st === 'conf' || g.st === 'reg';
  const fixed = items.filter(isFixed);
  const lab = g => { const st = stem(g.sig); const known = (st.length >= 2 && g.name.includes(st)) || (g.sido && g.name.includes(g.sido)); return (known ? '' : (g.sido + ' ' + g.sig).trim() + ' ') + g.name; };
  const span = g => (g.win.approx ? '≈' : '') + (g.win.s === g.win.e ? MDs(g.win.s) : MDs(g.win.s) + '~' + MDs(g.win.e));
  const withDate = (list, k) => list.slice(0, k).map(g => `${lab(g)}(${span(g)})`).join(', ');
  const bySido = {}; items.forEach(g => { bySido[g.sido] = (bySido[g.sido] || 0) + 1; });
  const sidoTxt = Object.entries(bySido).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join('·');
  const kids = items.filter(g => g.kid);
  const fishCnt = f => items.filter(g => g.fish.includes(f)).length;

  // 주말(토·일) 목록: 12월 셋째 주 ~ 2월 말
  const addD = (ymd, k) => { const d = new Date(Date.UTC(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6, 8))); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10).replace(/-/g, ''); };
  const WEEKENDS = []; for (let d = '20261219'; d <= '20270227'; d = addD(d, 7)) WEEKENDS.push([d, addD(d, 1)]);
  const wkRows = WEEKENDS.filter(([sa, su]) => su >= TODAY).map(([sa, su]) => { const L = items.filter(g => on(g, sa) || on(g, su)); return { sa, su, n: L.length, f: L.filter(isFixed).length, names: L.map(lab) }; });
  const peak = wkRows.reduce((a, b) => (b.n > a.n ? b : a), { n: 0 });

  const KIND = { conf: ['일정 확정', '#0a6c63', '#e2f5f2'], reg: ['공공데이터 등록·변동 가능', '#1d4ed8', '#e8efff'], est: ['예년 기준 예상', '#92400e', '#fff4e0'], prev: ['지난 시즌 기준', '#6b7280', '#f3f4f6'] };
  const badge = st => `<span style="display:inline-block;font-size:.76rem;font-weight:800;padding:2px 8px;border-radius:999px;color:${KIND[st][1]};background:${KIND[st][2]};white-space:nowrap">${KIND[st][0]}</span>`;
  const nm = g => g.slug ? `<a href="/festival/${g.slug}/" style="color:#0a6c63">${esc(g.name)}</a>` : esc(g.name);
  const rng = (a, b) => a === b ? YMD(a) : `${YMD(a)}~${MDs(b)}`;

  const ans = `2026~27 겨울 얼음낚시 축제는 축제모아(chukjemoa.co.kr) 집계 전국 <b>${items.length}곳</b>(${esc(sidoTxt)})입니다. 올해 날짜가 확정됐거나 공공데이터에 등록된 곳은 <b>${fixed.length}곳</b>${fixed.length ? `(${esc(withDate(fixed, 4))})` : ''}이고, 나머지 <b>${items.length - fixed.length}곳</b>은 예년·지난 시즌 날짜를 기준으로 적었습니다.${peak.n ? ` 가장 많이 겹치는 주말은 <b>${MDs(peak.sa)}~${MDs(peak.su)}</b>로 ${peak.n}곳(예년·지난 시즌 기준 포함)이 동시에 열립니다.` : ''} 어종별로는 산천어 ${fishCnt('산천어')}곳 · 송어 ${fishCnt('송어')}곳 · 빙어 ${fishCnt('빙어')}곳이고, 소개문에 어린이 낚시터·뜰채 체험이 적힌 곳은 ${kids.length}곳입니다.`;

  const hw = items.find(g => /산천어/.test(g.name));
  const feeShort = g => (g.feeLines.length ? g.feeLines.slice(0, 3).join(' / ') : g.fee) || '주최 측 확인';
  const faq = [
    ['2027년 얼음낚시 축제는 언제, 어디서 열리나요?', items.length ? `축제모아 집계로 이번 겨울 얼음낚시 축제는 ${items.length}곳입니다: ${withDate(items, 10)}. «≈»는 올해 날짜가 아직 없어 예년·지난 시즌 날짜로 적은 곳입니다. 대부분 1월에 몰려 있습니다.` : '아직 집계된 곳이 없습니다.'],
    ['화천 산천어축제 2027년 일정은?', hw ? `${hw.name} 일정은 ${rng(hw.win.s, hw.win.e)}${hw.st === 'conf' ? '로 확정됐습니다' : hw.st === 'reg' ? '로 공공데이터에 등록돼 있습니다(변동 가능)' : '(지난 시즌 기준 예상)'}. 장소는 ${hw.place || '강원 화천군 화천천 일원'}이고, 문의는 ${hw.tel || '주최 측'}입니다. 얼음낚시는 현장·예약 방식이 나뉘니 주최 측 안내를 먼저 확인하세요.` : '아직 올해 일정이 집계되지 않았습니다.'],
    ['아이랑 가기 좋은 얼음낚시 축제는?', kids.length ? `주최 측 소개문에 어린이용 낚시터·뜰채 체험 등이 적힌 곳은 ${kids.map(g => `${lab(g)}(«${g.kid}»)`).join(', ')}입니다. 축제모아가 «아이에게 좋다»고 판단한 것이 아니라 소개문에 적힌 프로그램을 옮긴 것입니다.` : '소개문에 어린이 전용 프로그램이 적힌 곳은 아직 없습니다.'],
    ['얼음낚시 축제 요금은 얼마인가요?', items.filter(g => g.fee || g.feeLines.length).length ? `주최 측이 한국관광공사 TourAPI에 올린 요금은 ${items.filter(g => g.fee || g.feeLines.length).slice(0, 5).map(g => `${lab(g)}: ${feeShort(g)}`).join(' · ')}입니다. 지난 시즌 요금일 수 있으니 방문 전 주최 측 공지로 확인하세요.` : '요금 정보가 아직 등록되지 않았습니다.'],
    ['얼음이 얼지 않으면 축제는 어떻게 되나요?', `얼음낚시 축제는 얼음이 안전하게 얼어야 열 수 있어 날씨에 따라 개막이 늦춰지거나 일정이 바뀌기도 합니다.${items.filter(g => g.notice).length ? ` 실제로 공공데이터 소개문에 «${items.find(g => g.notice).notice}»라고 적힌 곳도 있습니다(${lab(items.find(g => g.notice))}).` : ''} 출발 전날 주최 측 공지나 문의 전화로 개장 여부를 확인하세요.`],
    ['날짜가 «지난 시즌 기준»이면 어떻게 보나요?', '올해 일정이 아직 공공데이터에 올라오지 않은 축제입니다. 지난 시즌(2025~26년 겨울) 실제 날짜를 1년 뒤로 옮겨 적었으니 대략의 시기로만 보세요. 올해 날짜가 등록되면 이 페이지가 매일 빌드 때 자동으로 바뀝니다.']
  ];

  const toolData = items.map(g => ({ n: g.name, r: (g.sido + ' ' + g.sig).trim(), s: g.win.s, e: g.win.e, a: g.win.approx ? 1 : 0, st: g.st, f: g.fish, k: g.kid ? 1 : 0, u: g.slug ? '/festival/' + g.slug + '/' : '' }));
  const tbl = `<div style="overflow-x:auto"><table class="wltbl"><thead><tr><th>축제</th><th>지역·장소</th><th>올해 일정</th><th>어종·낚시</th><th>요금(주최 측 등록)</th></tr></thead><tbody>
${items.map(g => `<tr><td><b>${nm(g)}</b>${g.tel ? `<br><small>☎ ${esc(g.tel)}</small>` : ''}</td><td>${esc(g.sido)} ${esc(g.sig)}${g.place ? `<br><small>${esc(g.place.slice(0, 34))}</small>` : ''}</td><td>${g.now ? rng(g.now.s, g.now.e) : '≈' + rng(g.win.s, g.win.e)}<br>${badge(g.st)}${g.prev && g.now ? `<br><small>지난 시즌 ${rng(g.prev.s, g.prev.e)}</small>` : ''}</td><td>${esc(g.fish.join('·') || '—')}<br><small>${esc(g.ways.join('·'))}${g.kid ? ' · 👶 ' + esc(g.kid) : ''}</small></td><td><small>${esc(feeShort(g))}</small></td></tr>`).join('')}
</tbody></table></div>`;
  const wkTbl = `<div style="overflow-x:auto"><table class="wltbl"><thead><tr><th>주말</th><th>열리는 곳</th><th>그중 올해 날짜 있는 곳</th><th>어디</th></tr></thead><tbody>
${wkRows.map(w => `<tr><td><b>${MDs(w.sa)}(토)~${MDs(w.su)}(일)</b></td><td>${w.n}곳</td><td>${w.f}곳</td><td><small>${esc(w.names.join(', ') || '—')}</small></td></tr>`).join('')}
</tbody></table></div>`;

  const content = `<main><div class="wrap">
<h1 style="font-size:1.5rem;font-weight:900;margin:8px 0 6px">얼음낚시 축제 어디서 해? — 2027 산천어·송어·빙어축제 전국 ${items.length}곳 날짜·요금</h1>
<div class="ansbox"><p><b>한 줄 답</b> — ${ans}</p>
<p style="margin-top:6px;font-size:.9rem;color:#4b5563">축제모아(chukjemoa.co.kr)는 한국관광공사·행정안전부 공공데이터로 전국 축제 일정을 매일 모아 날짜·지역·확정 여부까지 정리하는 축제 일정 사이트입니다. 집계 기준일 ${YMD(TODAY)}.</p></div>

<h2 class="sec">🧭 날짜·어종으로 고르기</h2>
<p style="color:#6b7280;font-size:.94rem">가려는 주말과 어종을 고르면 그날 열리는 곳만 남깁니다. «≈»는 올해 일정이 아직 없어 예년·지난 시즌 날짜로 적은 곳입니다.</p>
<div class="wlpick"><select id="ifWk"><option value="">겨울 전체</option>${wkRows.map(w => `<option value="${w.sa}">${MDs(w.sa)}(토)~${MDs(w.su)}(일)</option>`).join('')}</select>
<select id="ifFish"><option value="">어종 전체</option><option>산천어</option><option>송어</option><option>빙어</option></select>
<label style="font-size:.9rem"><input type="checkbox" id="ifKid"> 어린이 프로그램 적힌 곳만</label>
<label style="font-size:.9rem"><input type="checkbox" id="ifFix"> 올해 날짜 있는 곳만</label></div>
<div id="ifOut" class="wlout"></div>
<script>(function(){var D=${JSON.stringify(toolData)};var L={conf:'확정',reg:'등록',est:'예상',prev:'지난 시즌 기준'};
function f(d){return (+d.slice(4,6))+'.'+(+d.slice(6,8))}
function nx(d){var t=new Date(Date.UTC(+d.slice(0,4),+d.slice(4,6)-1,+d.slice(6,8)+1));return t.toISOString().slice(0,10).replace(/-/g,'')}
function run(){var w=document.getElementById('ifWk').value,fi=document.getElementById('ifFish').value,k=document.getElementById('ifKid').checked,x0=document.getElementById('ifFix').checked;
var r=D.filter(function(x){var ok=!w||(x.s<=nx(w)&&x.e>=w);return ok&&(!fi||x.f.indexOf(fi)>=0)&&(!k||x.k)&&(!x0||x.st==='conf'||x.st==='reg')});
document.getElementById('ifOut').innerHTML='<p>고른 조건에 맞는 곳 <b>'+r.length+'곳</b></p>'+(r.length?'<ul>'+r.map(function(x){return '<li>🎣 '+(x.u?'<a href="'+x.u+'">'+x.n+'</a>':x.n)+' <span>'+x.r+' · '+(x.f.join('·')||'')+' · '+(x.a?'≈':'')+(x.s===x.e?f(x.s):f(x.s)+'~'+f(x.e))+' ('+L[x.st]+')'+(x.k?' · 👶어린이 프로그램':'')+'</span></li>'}).join('')+'</ul>':'<p class="note">이 조건에 맞는 곳이 없습니다.</p>')}
['ifWk','ifFish','ifKid','ifFix'].forEach(function(i){document.getElementById(i).addEventListener('change',run)});run()})();</script>

<h2 class="sec">📅 주말별로 열리는 곳</h2>
${wkTbl}

<h2 class="sec">🎣 얼음낚시 축제 ${items.length}곳 — 날짜 순</h2>
${tbl}
<p class="note">요금은 주최 측이 한국관광공사 TourAPI에 등록한 원문입니다. 올해 요금이 아직 반영되지 않아 지난 시즌 값일 수 있습니다.</p>

<h2 class="sec">날짜 표시 읽는 법</h2>
<ul style="line-height:1.9;font-size:.95rem;padding-left:20px">
<li>${badge('conf')} 주최 측 발표로 확정된 일정</li>
<li>${badge('reg')} 한국관광공사·행정안전부 공공데이터에 올해 날짜로 올라온 일정 (주최 측 확정 전일 수 있음)</li>
<li>${badge('est')} 축제모아가 예년 개최 시기로 잡아 둔 예상 날짜</li>
<li>${badge('prev')} 올해 일정이 아직 없어 지난 시즌(2025~26년 겨울) 실제 날짜를 1년 뒤로 옮겨 적은 것</li>
</ul>

<h2 class="sec">같이 보면 좋은 것</h2>
<div class="frel2"><a href="/winter/light/">✨ 겨울 빛축제·눈꽃(얼음)축제</a><a href="/winter/">❄️ 겨울 축제 총정리</a><a href="/2026-12/">12·1월 겨울 축제 일정</a><a href="/kids/">👨‍👩‍👧 아이와 가볼만한 축제</a><a href="/winter/sunrise/">🌅 새해 해맞이·해넘이</a><a href="/onsen/">♨️ 온천</a></div>

<h2 class="sec">자주 묻는 것</h2>
${faq.map(([q, a]) => `<p style="line-height:1.8"><b>${esc(q)}</b><br>${esc(a)}</p>`).join('')}

<p class="note" style="margin-top:20px">데이터 출처: 한국관광공사 TourAPI 축제·소개 정보, 행정안전부 전국문화축제표준데이터, 축제모아 큐레이션. 얼음낚시 축제는 기상·얼음 상태에 따라 일정이 바뀌거나 취소될 수 있으니 방문 전 주최 측 공지를 확인하세요.</p>
</div></main>
<style>.ansbox{background:#ecfdf8;border:1.5px solid #bfe9df;border-radius:14px;padding:14px 18px;margin:6px 0 14px;color:#1f2937;line-height:1.7}.ansbox b{color:#0a6c63}
.wltbl{width:100%;border-collapse:collapse;background:#fff;font-size:.92rem;margin:8px 0 4px}.wltbl th,.wltbl td{padding:8px 10px;border-bottom:1px solid #eef5f3;text-align:left;vertical-align:top}.wltbl th{background:#e2f5f2;color:#0a6c63;white-space:nowrap}.wltbl small{color:#6b7280}
.wlpick{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.wlpick select{padding:8px 10px;border:1.5px solid #dcefeb;border-radius:10px;font-size:.95rem}
.wlout{background:#f8fbfa;border:1px solid #e5f1ee;border-radius:12px;padding:10px 16px;margin:6px 0 12px}.wlout li{margin:5px 0}.wlout li span{color:#6b7280;font-size:.88rem}.wlout a{color:#0a6c63;font-weight:700}
.frel2{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.frel2 a{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.88rem;padding:9px 15px;border-radius:999px;text-decoration:none}</style>`;

  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  const desc = `2027 얼음낚시 축제 전국 ${items.length}곳 날짜·요금표 — 화천 산천어축제·평창송어축제·빙어축제. 올해 날짜 확정·등록 ${fixed.length}곳, 주말별 열리는 곳, 어린이 낚시터 있는 곳까지 골라 볼 수 있습니다.`;
  writePage('winter/ice-fishing', layout('얼음낚시 축제 어디서? 2027 산천어·송어·빙어축제 전국 ' + items.length + '곳 날짜·요금 | ' + SITE_NAME, desc, '/winter/ice-fishing/', content,
    { jsonld: `<script type="application/ld+json">${JSON.stringify(faqLd)}</script>`, ogImage: '/img/cat2-snow-b.webp' }));
  console.log('✓ /winter/ice-fishing/ —', items.length, '곳 · 확정/등록', fixed.length, '· 어린이', kids.length, '· 최다 주말', peak.sa || '-', peak.n);
  return ['/winter/ice-fishing/'];
}
module.exports = { build };
