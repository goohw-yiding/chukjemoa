// ♨️ 전국 온천 /onsen/ — «한 줄 답 + 지역 고르기 + 지역별 표 + 지정 온천 관광지 표 + FAQ» (2026-11-25 AI 노출 실행)
// 질문: 「겨울 온천 어디가 좋아?」「가족이랑 갈 만한 온천 추천」「서울 근교 온천」「유명한 온천 관광지」
// 왜 — 테마 공통 틀(운영판 할 일 0): 틀을 받은 페이지 체류 97초 vs 못 받은 테마 페이지 26초. 12~2월이 온천 수요 철이라 한 달 앞서 붙인다.
//   예전 /onsen/ 은 onsen.json 10곳뿐이었다 — «한 줄 답»이 약해 미뤄 둔 것(할 일 0). 같은 공공데이터 4종(무장애·관광지·관광지정보 표준·온천)에서
//   이름으로 온천·스파·찜질방이 확실한 곳만 모아 목록을 넓힌다. /indoor/ 의 «♨️ 온천·스파»와 같은 원천이다.
// 원칙
//   ⛔ 숫자는 data/ 의 공공데이터에서만 센다. 수온·pH 같은 수치는 «주최·지자체가 공공데이터에 적은 원문»만 옮기고 우리가 판정하지 않는다.
//   ⛔ 요금·영업시간은 데이터에 거의 없으므로(온천 10곳만) 지어 쓰지 않는다.
//   ⛔ 이름에 «스파»가 들어가도 옷가게(스파오)·○○파크(예스파크·휘닉스파크)·식당·시장·온천천(하천)은 뺀다.
const fs = require('fs'), path = require('path');
const SIDO_ORDER = ['서울', '경기', '인천', '강원', '충북', '충남', '대전', '세종', '전북', '전남', '광주', '경북', '경남', '대구', '울산', '부산', '제주'];
const NEAR_SEOUL = ['서울', '경기', '인천'];

function build({ ROOT, apiOnsen }) {
  const load = f => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')); } catch (e) { return []; } };
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const nf = n => n.toLocaleString();
  const IN = /온천|스파(?![오크])|찜질방/, OUT = /스파오|칼국수|곰장어|시장|온천천|휘닉스파크/;
  const kindOf = t => /찜질방/.test(t) ? '찜질방' : /온천/.test(t) ? '온천' : '스파';
  const seen = new Map(); let seq = 0;
  const push = (o, tf, src, force) => {
    const title = String(o[tf] || '').trim();
    if (!title || OUT.test(title) || !(force || IN.test(title))) return;
    if (!(+o.x) || !(+o.y) || !o.sido) return;
    const sido = String(o.sido).slice(0, 2);
    const k = title.replace(/\s/g, '') + '|' + sido;
    const row = { id: String(o.id || ('og' + (++seq))), title, kind: force && !IN.test(title) ? '온천' : kindOf(title), sido, sigungu: o.sigungu || '', addr: String(o.addr || ''),
      img: String(o.img || '').replace(/^http:/, 'https:'), ov: String(o.ov || o.intro || ''), tel: o.tel || '', x: o.x, y: o.y,
      acc: Array.isArray(o.acc) && o.acc.length ? 1 : 0, open: o.open || '', rest: o.rest || '', desig: src === 'tr' ? (o.kind || '관광지') : '' };
    const p = seen.get(k);
    if (!p) { seen.set(k, row); return; }
    ['img', 'tel', 'sigungu', 'addr', 'open', 'rest', 'desig'].forEach(f => { if (!p[f] && row[f]) p[f] = row[f]; });
    if (row.ov.length > p.ov.length && src !== 'tr') p.ov = row.ov;
    if (row.acc) p.acc = 1;
  };
  load('accessible.json').forEach(o => push(o, 'title', 'acc'));
  load('spots_ko.json').forEach(o => push(o, 'title', 'spot'));
  load('trrsrt.json').forEach(o => push(o, 'name', 'tr'));
  (apiOnsen || []).forEach(o => push(o, 'title', 'onsen', true));
  const A = [...seen.values()].sort((a, b) => SIDO_ORDER.indexOf(a.sido) - SIDO_ORDER.indexOf(b.sido) || a.title.localeCompare(b.title, 'ko'));
  const N = A.length;
  if (N < 20) return { data: apiOnsen, intro: '', jsonld: '', title: '', desc: '' };

  const cnt = (arr, f) => { const c = {}; arr.forEach(o => { const k = f(o); if (k) c[k] = (c[k] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1]); };
  const bySido = cnt(A, o => o.sido);
  const kinds = Object.fromEntries(cnt(A, o => o.kind));
  const near = A.filter(o => NEAR_SEOUL.includes(o.sido));
  const nearBy = cnt(near, o => o.sido).map(([s, n]) => `${s} ${n}`).join(' · ');
  const acc = A.filter(o => o.acc);
  const withHours = A.filter(o => o.open);
  // 지정 온천 관광지 — 전국관광지정보 표준데이터(지자체 지정 관광지·관광단지) 중 이름에 «온천»이 있는 곳 + 관광특구
  const desig = A.filter(o => o.desig && /온천/.test(o.title));
  const tokgu = A.filter(o => /온천/.test(o.title) && /관광특구/.test(o.title));
  // 같은 온천이 «관광지»와 «관광특구»로 두 번 잡히면(백암·아산) 한 곳으로 센다 — 특구 > 관광단지 > 관광지 순으로 남긴다.
  const rank = o => /관광특구/.test(o.title) ? 0 : o.desig === '관광단지' ? 1 : 2;
  const core = o => o.title.replace(/\s/g, '').replace(/(관광지|관광단지|관광특구)$/, '').replace(/^(\S{2})시(?=\S)/, '$1');
  const famMap = new Map();
  desig.concat(tokgu).sort((a, b) => rank(a) - rank(b)).forEach(o => { const k = core(o) + '|' + o.sido; if (!famMap.has(k)) famMap.set(k, o); });
  const famous = [...famMap.values()].sort((a, b) => rank(a) - rank(b) || SIDO_ORDER.indexOf(a.sido) - SIDO_ORDER.indexOf(b.sido));
  const famKeys = new Set(desig.concat(tokgu));
  const famNames = famous.map(o => o.title.replace(/\s*(관광지|관광단지|관광특구)$/, ''));
  const top3 = bySido.slice(0, 3).map(([s, n]) => `${s} ${n}`).join(' · ');

  const LEAD = `<b>겨울에 갈 만한 온천</b>은 축제모아 집계 전국 <b>${nf(N)}곳</b>입니다 — 온천 ${kinds['온천'] || 0} · 스파 ${kinds['스파'] || 0} · 찜질방 ${kinds['찜질방'] || 0}이고, 지역은 ${top3} 순으로 많습니다. `
    + `지자체가 관광지·관광단지·관광특구로 지정한 <b>온천 관광지는 ${famous.length}곳</b>(관광특구 ${famous.filter(o => rank(o) === 0).map(o => o.title.replace(/\s*관광특구$/, '')).join(' · ')} 등)이고, 서울에서 가까운 서울·경기·인천에는 <b>${near.length}곳</b>이 있습니다. `
    + `모두 한국관광공사·문화체육관광부 공공데이터에서 <b>이름으로 온천·스파가 확실한 곳만</b> 골랐습니다.`;
  const DEF = `축제모아(chukjemoa.co.kr)는 한국관광공사·행정안전부 공공데이터를 매일 다시 모아 전국 축제와 «지금 갈 만한 곳»을 지역별로 알려 주는 축제·여행 정보 사이트입니다.`;

  const famRows = famous.map(o => {
    const tr = (load._tr = load._tr || load('trrsrt.json')).find(t => String(t.name).replace(/\s/g, '') === o.title.replace(/\s/g, ''));
    let note = String((tr && tr.intro) || '').replace(/\s+/g, ' ').trim();
    if (note.length < 12) note = '';
    if (note.length > 90) note = note.slice(0, 88) + '…';
    return `<tr><td><b><a href="https://map.naver.com/p/search/${encodeURIComponent(o.title)}" target="_blank" rel="noopener nofollow">${esc(o.title)}</a></b></td><td>${esc(o.sido + ' ' + (o.sigungu || ''))}</td><td>${esc(/관광특구/.test(o.title) ? '관광특구' : (o.desig || '관광지'))}</td><td class="og-n">${note ? esc(note) : '—'}</td></tr>`;
  }).join('');

  const FAQ = [
    ['겨울에 갈 만한 온천은 전국에 몇 곳인가요?',
      `축제모아가 공공데이터에서 이름으로 온천·스파·찜질방이 확실한 곳만 세어 전국 ${nf(N)}곳입니다(온천 ${kinds['온천'] || 0}·스파 ${kinds['스파'] || 0}·찜질방 ${kinds['찜질방'] || 0}). 지역별로는 ${bySido.slice(0, 5).map(([s, n]) => `${s} ${n}곳`).join(', ')} 순입니다.`],
    ['유명한 온천 관광지는 어디인가요?',
      `지자체가 관광지·관광단지·관광특구로 지정한 온천은 ${famous.length}곳입니다: ${famNames.join(', ')}. 지정 여부는 문화체육관광부 전국관광지정보 표준데이터와 한국관광공사 관광특구 정보를 기준으로 했습니다.`],
    ['서울 근교에 온천이 있나요?',
      `서울·경기·인천에 ${near.length}곳(${nearBy})이 있습니다. 위 고르기 도구에서 지역을 경기로 고르면 이름이 나오고, 이름을 누르면 지도에서 위치를 볼 수 있습니다.`],
    ['휠체어나 유아차로 갈 수 있는 온천도 있나요?',
      `이 목록 중 ${acc.length}곳은 한국관광공사 무장애여행 정보에 휠체어·장애인주차 같은 편의시설이 확인돼 있습니다. 나머지는 «정보가 공공데이터에 없는 것»이지 이용이 안 된다는 뜻이 아니니 방문 전 시설에 확인하세요.`],
    ['온천 요금이나 영업시간은 어디서 보나요?',
      `요금은 공공데이터에 없어 적지 않았습니다. 영업시간·휴무일은 ${withHours.length}곳만 공공데이터에 정리돼 있어 아래 카드를 누르면 볼 수 있고, 나머지는 시설에 직접 확인해야 합니다. 명절·연말에는 바뀌는 곳이 많습니다.`],
    ['온천 말고 겨울에 함께 갈 만한 곳은요?',
      '같은 지역의 겨울 축제(빛축제·눈꽃·얼음낚시)와 실내 가볼만한 곳을 함께 보면 하루 일정을 짜기 좋습니다. 아래 링크에서 겨울 축제 총정리, 얼음낚시 축제, 실내 가볼만한 곳으로 이어집니다.'],
  ];
  const jsonld = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) })}</script>`;

  const tbl = `<div class="og-scroll"><table class="og-tb"><thead><tr><th>지역</th><th>전체</th><th>온천</th><th>스파</th><th>찜질방</th><th>지정 온천 관광지</th></tr></thead><tbody>`
    + bySido.map(([s, n]) => { const a = A.filter(o => o.sido === s); const f = famous.filter(o => o.sido === s);
      return `<tr><td><b>${s}</b></td><td>${n}</td><td>${a.filter(o => o.kind === '온천').length || '—'}</td><td>${a.filter(o => o.kind === '스파').length || '—'}</td><td>${a.filter(o => o.kind === '찜질방').length || '—'}</td><td class="og-n">${f.length ? f.map(o => esc(o.title.replace(/\s*(관광지|관광단지|관광특구)$/, ''))).join(', ') : '—'}</td></tr>`; }).join('')
    + `</tbody></table></div>`;
  const sidoOpts = bySido.map(([s, n]) => `<option value="${s}">${s} (${n})</option>`).join('');
  const PICK = JSON.stringify(A.map(o => [o.title, o.kind, o.sido, o.sigungu || '', o.acc, famKeys.has(o) ? 1 : 0]));

  const intro = `<style>
.og-box{background:#fff;border:1.5px solid #bcdcec;border-radius:16px;padding:18px 20px;margin:16px 0}
.og-ans{background:#eff8fc;border:1.5px solid #bcdcec;border-radius:14px;padding:14px 18px;margin:6px 0 14px;color:#1f2937;line-height:1.72;font-size:.97rem}.og-ans b{color:#0369a1}
.og-h2{font-size:1.12rem;font-weight:900;color:#0369a1;margin:0 0 8px;letter-spacing:-.02em}
.og-pick{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.og-pick select{padding:9px 11px;border:1.5px solid #bcdcec;border-radius:10px;font-size:.95rem;font-family:inherit;background:#f5fbfe}.og-pick label{font-size:.9rem;color:#374151}
.og-out{background:#f5fbfe;border:1px solid #dbeef7;border-radius:12px;padding:10px 16px;margin:6px 0 4px}.og-out li{margin:5px 0}.og-out li span{color:#6b7280;font-size:.88rem}.og-out a{color:#0369a1;font-weight:700}
.og-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
.og-tb{border-collapse:collapse;width:100%;min-width:460px;font-size:.92rem}.og-tb th{background:#eff8fc;color:#0369a1;font-weight:800;padding:8px 9px;border-bottom:2px solid #bcdcec;text-align:left;white-space:nowrap}
.og-tb td{padding:7px 9px;border-bottom:1px solid #e6f1f7;color:#374151;white-space:nowrap;vertical-align:top}.og-tb td.og-n{white-space:normal;min-width:180px;font-size:.88rem;color:#4b5563}.og-tb a{color:#0369a1}
.og-q{font-size:.94rem;line-height:1.68;color:#374151;margin:0 0 12px}
.og-src{font-size:.84rem;color:#6b7280;line-height:1.6;margin:10px 0 0}
.og-rel{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}.og-rel a{background:#f5fbfe;border:1.5px solid #bcdcec;color:#0369a1;font-weight:700;font-size:.88rem;padding:8px 14px;border-radius:999px;text-decoration:none}
</style>
<div class="og-ans">${LEAD}<br><span style="font-size:.9rem;color:#4b5563">${DEF}</span></div>
<div class="og-box">
<h2 class="og-h2">어디로 갈까? — 지역과 종류만 고르세요</h2>
<div class="og-pick"><label>지역 <select id="ogS"><option value="">전국</option>${sidoOpts}</select></label>
<label>종류 <select id="ogK"><option value="">전체</option><option value="온천">온천</option><option value="스파">스파</option><option value="찜질방">찜질방</option></select></label>
<label><input type="checkbox" id="ogF"> 지정 온천 관광지만</label>
<label><input type="checkbox" id="ogA"> 휠체어 편의시설 확인된 곳만</label></div>
<div class="og-out" id="ogOut"></div>
<p class="og-src">목록은 이름순 최대 15곳입니다. 이름을 누르면 네이버 지도에서 위치·영업시간을 확인할 수 있습니다.</p>
</div>
<script>(function(){var D=${PICK};
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function run(){var s=document.getElementById('ogS').value,k=document.getElementById('ogK').value,f=document.getElementById('ogF').checked,a=document.getElementById('ogA').checked;
var L=D.filter(function(r){return (!s||r[2]===s)&&(!k||r[1]===k)&&(!f||r[5])&&(!a||r[4]);});
L.sort(function(x,y){return (x[2]+x[3]+x[0]).localeCompare(y[2]+y[3]+y[0],'ko');});
var h='<p style="margin:4px 0 8px"><b>'+(s||'전국')+(k?' · '+k:'')+(f?' · 지정 관광지':'')+' '+L.length+'곳</b></p>';
h+=L.length?'<ul style="padding-left:18px;margin:0">'+L.slice(0,15).map(function(r){return '<li><a href="https://map.naver.com/p/search/'+encodeURIComponent(r[0])+'" target="_blank" rel="noopener nofollow">'+esc(r[0])+'</a> <span>'+esc(r[1])+' · '+esc(r[2]+' '+r[3])+(r[5]?' · 지정 온천 관광지':'')+(r[4]?' · ♿ 편의시설 확인':'')+'</span></li>';}).join('')+'</ul>':'<p style="color:#6b7280">조건에 맞는 곳이 없어요. 지역이나 종류를 바꿔 보세요.</p>';
document.getElementById('ogOut').innerHTML=h;}
['ogS','ogK','ogF','ogA'].forEach(function(i){document.getElementById(i).addEventListener('change',run);});run();})();</script>
<div class="og-box">
<h2 class="og-h2">지역별로 몇 곳?</h2>
${tbl}
</div>
<div class="og-box">
<h2 class="og-h2">지자체가 지정한 온천 관광지 ${famous.length}곳</h2>
<div class="og-scroll"><table class="og-tb"><thead><tr><th>이름</th><th>지역</th><th>지정</th><th>공공데이터 소개(원문 발췌)</th></tr></thead><tbody>${famRows}</tbody></table></div>
<p class="og-src">지정: 문화체육관광부 전국관광지정보 표준데이터(관광지·관광단지)와 한국관광공사 관광특구 정보. 소개는 지자체가 공공데이터에 적은 문장을 그대로 옮긴 것으로, 수온·성분 등은 축제모아가 확인한 값이 아닙니다.</p>
</div>
<div class="og-box">
<h2 class="og-h2">겨울 온천, 자주 묻는 것</h2>
${FAQ.map(([q, a]) => `<p class="og-q"><b>${esc(q)}</b><br>${esc(a)}</p>`).join('')}
<div class="og-rel"><a href="/winter/">❄️ 겨울 축제 총정리</a><a href="/winter/ice-fishing/">🎣 얼음낚시 축제</a><a href="/winter/light/">✨ 겨울 빛축제</a><a href="/indoor/">🏠 실내 가볼만한 곳</a><a href="/2026-12/">12월 축제</a><a href="/accessible/">♿ 무장애 여행지</a></div>
</div>
<h2 class="og-h2" style="margin-top:22px">전체 목록 — 카드를 누르면 상세정보</h2>`;
  const title = `겨울 온천 어디가 좋아? 전국 온천·스파 ${nf(N)}곳 — 지정 온천 관광지 ${famous.length}곳·서울 근교 ${near.length}곳`;
  const desc = `겨울에 갈 만한 전국 온천·스파 ${nf(N)}곳을 지역·종류별로. 지자체 지정 온천 관광지 ${famous.length}곳(${famNames.slice(0, 4).join('·')} 등), 서울·경기·인천 ${near.length}곳. 한국관광공사·문화체육관광부 공공데이터 기준.`;
  console.log('✓ /onsen/ 한 줄 답 —', N, '곳 · 지정', famous.length, '· 근교', near.length, '· 편의시설', acc.length, '· 영업시간', withHours.length);
  return { data: A, intro, jsonld, title, desc };
}
module.exports = { build };
