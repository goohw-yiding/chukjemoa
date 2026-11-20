// 🏠 실내 가볼만한 곳 /indoor/ — «한 줄 답 + 고르기 도구 + 지역×종류 표 + FAQ» (2026-11-20 AI 노출 실행)
// 질문: 「추운 겨울(비 오는 날) 실내 가볼만한 곳 어디야?」「아이랑 겨울에 실내 어디 가?」「서울 실내 가볼만한 곳」
// 왜 — 테마 공통 틀(운영판 할 일 0): 이 틀을 받은 페이지 체류 97초 vs 못 받은 테마 페이지 26초.
//   12~2월은 «밖이 어려운 날»이 가장 많은 철이라 한 달 앞서 붙인다.
// 원칙
//   ⛔ 숫자는 apiIndoor(한국관광공사 공공데이터에서 이름으로 실내가 확실한 곳만 고른 목록)에서만 센다.
//   ⛔ 휴관일·요금·기온 같은 수치는 데이터에 없으므로 적지 않는다.
//   ⛔ «아이에게 좋다»를 장소마다 판정하지 않는다 — 종류(과학관·아쿠아리움·체험관·테마파크)로만 묶는다.
const SLUG = { 서울: 'seoul', 부산: 'busan', 대구: 'daegu', 인천: 'incheon', 광주: 'gwangju', 대전: 'daejeon', 울산: 'ulsan', 세종: 'sejong', 경기: 'gyeonggi', 강원: 'gangwon', 충북: 'chungbuk', 충남: 'chungnam', 전북: 'jeonbuk', 전남: 'jeonnam', 경북: 'gyeongbuk', 경남: 'gyeongnam', 제주: 'jeju' };
const GROUPS = [
  { k: 'kids', t: '👨‍👩‍👧 아이와', re: /과학관|아쿠아리움|체험관|테마파크/, d: '과학관·아쿠아리움·체험관·테마파크' },
  { k: 'warm', t: '♨️ 몸 녹이기', re: /온천/, d: '온천·스파·찜질방' },
  { k: 'art', t: '🖼 데이트·혼자', re: /미술관|공연장/, d: '미술관·갤러리·공연장' },
  { k: 'hist', t: '🏛 역사·공부', re: /박물관|전시관/, d: '박물관·전시관·기념관' },
];

function build({ apiIndoor, esc, fs, path, ROOT }) {
  const A = apiIndoor;
  const N = A.length, nf = n => n.toLocaleString();
  const cnt = (arr, f) => { const c = {}; arr.forEach(o => { const k = f(o); if (k) c[k] = (c[k] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1]); };
  const bySido = cnt(A, o => o.sido);
  const sidoN = Object.fromEntries(bySido);
  const hasSub = s => (sidoN[s] || 0) >= 40 && s !== '제주';
  const kinds = cnt(A, o => o.kind);
  const kindN = Object.fromEntries(kinds);
  const short = k => k.replace(/^\S+\s/, '');
  const grp = g => A.filter(o => g.re.test(o.kind));
  const G = Object.fromEntries(GROUPS.map(g => [g.k, grp(g)]));
  const acc = A.filter(o => Array.isArray(o.acc) && o.acc.length);
  const top3 = bySido.slice(0, 3).map(([s, n]) => `${s} ${nf(n)}`).join(' · ');
  const kidsTop = cnt(G.kids, o => o.sido).slice(0, 3).map(([s, n]) => `${s} ${n}`).join(' · ');
  const warmTop = cnt(G.warm, o => o.sido).slice(0, 3).map(([s, n]) => `${s} ${n}`).join(' · ');
  const seoul = A.filter(o => o.sido === '서울');
  const seoulKinds = cnt(seoul, o => short(o.kind)).slice(0, 4).map(([k, n]) => `${k} ${n}`).join(' · ');
  const seoulGu = cnt(seoul, o => o.sigungu).slice(0, 3).map(([k, n]) => `${k} ${n}`).join(' · ');

  const LEAD = `<b>추운 겨울이나 비 오는 날 실내로 갈 곳</b>은 축제모아 집계 전국 <b>${nf(N)}곳</b>입니다 — ${kinds.slice(0, 5).map(([k, n]) => `${short(k)} ${nf(n)}`).join(' · ')} 순이고, 지역은 ${top3} 순으로 많습니다. `
    + `아이와 함께라면 과학관·아쿠아리움·체험관·테마파크 <b>${nf(G.kids.length)}곳</b>, 몸을 녹이려면 온천·스파 <b>${nf(G.warm.length)}곳</b>이 있습니다. `
    + `모두 한국관광공사 공공데이터에서 <b>이름으로 실내가 확실한 곳만</b> 골랐습니다.`;
  const DEF = `축제모아(chukjemoa.co.kr)는 한국관광공사·행정안전부 공공데이터를 매일 다시 모아 전국 축제와 «지금 갈 만한 곳»을 지역별로 알려 주는 축제·여행 정보 사이트입니다.`;

  const FAQ = [
    ['추운 날 실내 가볼만한 곳은 전국에 몇 곳인가요?',
      `축제모아가 이름으로 실내가 확실한 곳만 세어 전국 ${nf(N)}곳입니다. 종류별로 ${kinds.map(([k, n]) => `${short(k)} ${nf(n)}곳`).join(', ')}이고, 지역별로는 ${bySido.slice(0, 5).map(([s, n]) => `${s} ${nf(n)}곳`).join(', ')} 순입니다.`],
    ['겨울에 아이와 실내로 갈 만한 곳은 어디인가요?',
      `과학관·아쿠아리움·체험관·테마파크가 전국 ${nf(G.kids.length)}곳입니다(과학관 ${kindN['🔭 과학관'] || 0} · 체험관 ${kindN['🧪 체험관'] || 0} · 테마파크 ${kindN['🎡 테마파크'] || 0} · 아쿠아리움 ${kindN['🐠 아쿠아리움'] || 0}). 많은 지역은 ${kidsTop} 순입니다. 위 고르기 도구에서 지역과 «아이와»를 고르면 그 지역 목록이 나옵니다. 겨울방학 축제는 아이와 가볼만한 곳 페이지에 따로 모았습니다.`],
    ['서울에서 실내 가볼만한 곳은 몇 곳인가요?',
      `서울은 ${nf(seoul.length)}곳입니다. 종류별로 ${seoulKinds}, 자치구는 ${seoulGu} 순으로 많습니다. 서울 실내 가볼만한 곳 페이지에 전체 목록이 있고, 이번 달 서울 전시·공연 일정은 서울 월별 행사 페이지에서 날짜순으로 볼 수 있습니다.`],
    ['몸을 녹일 온천·스파는 어디에 있나요?',
      `실내 목록 중 온천·스파·찜질방이 ${nf(G.warm.length)}곳이고, ${warmTop} 순으로 많습니다. 영업시간·휴무일이 정리된 온천은 전국 온천 페이지에서 따로 볼 수 있습니다.`],
    ['휠체어나 유아차로 갈 수 있는 실내 관광지도 있나요?',
      `이 목록 중 ${nf(acc.length)}곳은 한국관광공사 무장애여행 정보에 휠체어·장애인주차 같은 편의시설이 확인돼 있습니다. 나머지는 «편의시설 정보가 공공데이터에 없는 것»이지 접근이 안 된다는 뜻이 아니니, 방문 전 시설에 확인하세요. 전체는 무장애 여행지 페이지에 있습니다.`],
    ['목록에 없는 실내 장소도 있지 않나요? 휴관일은요?',
      '있습니다. 공공데이터에는 «실내인지» 항목이 없어서 축제모아는 이름으로 실내가 확실한 곳(박물관·미술관·과학관·아쿠아리움·온천 등)만 넣었고, 동네 시립·교육 도서관은 뺐습니다. 운영 시간·휴관일·예약 여부는 시설마다 달라 데이터에 없으므로, 카드의 지도·검색 링크로 방문 전 확인하세요.'],
  ];
  const faqLd = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) })}</script>`;

  // 지역 × 종류 표 — 숫자는 전부 apiIndoor 에서 센 것
  const KCOL = kinds.map(([k]) => k);
  const tbl = `<div class="ig-scroll"><table class="ig-tb"><thead><tr><th>지역</th><th>전체</th>${GROUPS.map(g => `<th>${g.t}</th>`).join('')}</tr></thead><tbody>`
    + bySido.map(([s, n]) => {
      const a = A.filter(o => o.sido === s);
      const name = s === '제주' ? `<a href="/jeju/rainy/">${s}</a>` : hasSub(s) ? `<a href="/indoor/${SLUG[s]}/">${s}</a>` : s;
      return `<tr><td><b>${name}</b></td><td>${nf(n)}</td>${GROUPS.map(g => `<td>${a.filter(o => g.re.test(o.kind)).length || '—'}</td>`).join('')}</tr>`;
    }).join('') + `</tbody></table></div>`;

  // 고르기 도구용 가벼운 데이터 — 이름·종류·시도·시군구·편의시설 여부만
  try {
    fs.mkdirSync(path.join(ROOT, 'indoor'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'indoor', 'data.json'), JSON.stringify(A.map(o => [o.title, short(o.kind), o.sido, o.sigungu || '', (Array.isArray(o.acc) && o.acc.length) ? 1 : 0])));
  } catch (e) { console.log('⚠️ indoor/data.json 쓰기 실패', e.message); }

  const sidoOpts = bySido.map(([s, n]) => `<option value="${s}">${s} (${n})</option>`).join('');
  const SUBS = JSON.stringify(Object.fromEntries(bySido.filter(([s]) => hasSub(s)).map(([s]) => [s, '/indoor/' + SLUG[s] + '/']).concat([['제주', '/jeju/rainy/']])));
  const GRE = JSON.stringify(Object.fromEntries(GROUPS.map(g => [g.k, g.re.source])));

  const html = `<style>
.ig-box{background:#fff;border:1.5px solid #c7d2fe;border-radius:16px;padding:18px 20px;margin:16px 0}
.ig-ans{background:#eef2ff;border:1.5px solid #c7d2fe;border-radius:14px;padding:14px 18px;margin:6px 0 14px;color:#1f2937;line-height:1.72;font-size:.97rem}.ig-ans b{color:#3730a3}
.ig-h2{font-size:1.12rem;font-weight:900;color:#3730a3;margin:0 0 8px;letter-spacing:-.02em}
.ig-pick{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.ig-pick select{padding:9px 11px;border:1.5px solid #c7d2fe;border-radius:10px;font-size:.95rem;font-family:inherit;background:#f8f9ff}
.ig-pick label{font-size:.9rem;color:#374151}
.ig-out{background:#f8f9ff;border:1px solid #e0e7ff;border-radius:12px;padding:10px 16px;margin:6px 0 4px}.ig-out li{margin:5px 0}.ig-out li span{color:#6b7280;font-size:.88rem}.ig-out a{color:#3730a3;font-weight:700}
.ig-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
.ig-tb{border-collapse:collapse;width:100%;min-width:420px;font-size:.92rem}.ig-tb th{background:#eef2ff;color:#3730a3;font-weight:800;padding:8px 9px;border-bottom:2px solid #c7d2fe;text-align:left;white-space:nowrap}
.ig-tb td{padding:7px 9px;border-bottom:1px solid #eef0f8;color:#374151;white-space:nowrap}.ig-tb a{color:#3730a3}
.ig-q{font-size:.94rem;line-height:1.68;color:#374151;margin:0 0 12px}
.ig-src{font-size:.84rem;color:#6b7280;line-height:1.6;margin:10px 0 0}
.ig-rel{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}.ig-rel a{background:#f8f9ff;border:1.5px solid #c7d2fe;color:#3730a3;font-weight:700;font-size:.88rem;padding:8px 14px;border-radius:999px;text-decoration:none}
</style>
<div class="ig-ans">${LEAD}<br><span style="font-size:.9rem;color:#4b5563">${DEF}</span></div>
<div class="ig-box">
<h2 class="ig-h2">어디로 갈까? — 지역과 목적만 고르세요</h2>
<div class="ig-pick"><label>지역 <select id="igS"><option value="">전국</option>${sidoOpts}</select></label>
<label>목적 <select id="igG"><option value="">전체</option>${GROUPS.map(g => `<option value="${g.k}">${g.t} (${g.d})</option>`).join('')}</select></label>
<label><input type="checkbox" id="igA"> 휠체어 편의시설 확인된 곳만</label></div>
<div class="ig-out" id="igOut"><p style="color:#6b7280;margin:6px 0">불러오는 중…</p></div>
<p class="ig-src">목록은 이름순 최대 12곳입니다. 장소 이름을 누르면 네이버 지도에서 위치·운영 시간을 확인할 수 있습니다.</p>
</div>
<script>(function(){var D=null,SUB=${SUBS},GRE=${GRE};
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function run(){var o=document.getElementById('igOut');if(!D){return;}var s=document.getElementById('igS').value,g=document.getElementById('igG').value,a=document.getElementById('igA').checked,re=g?new RegExp(GRE[g]):null;
var L=D.filter(function(r){return (!s||r[2]===s)&&(!re||re.test(r[1]))&&(!a||r[4]);});
L.sort(function(x,y){return (x[2]+x[3]+x[0]).localeCompare(y[2]+y[3]+y[0],'ko');});
var h='<p style="margin:4px 0 8px"><b>'+(s||'전국')+(g?' · '+document.getElementById('igG').selectedOptions[0].text.replace(/ \\(.*$/,''):'')+' '+L.length.toLocaleString()+'곳</b></p>';
h+=L.length?'<ul style="padding-left:18px;margin:0">'+L.slice(0,12).map(function(r){return '<li><a href="https://map.naver.com/p/search/'+encodeURIComponent(r[0])+'" target="_blank" rel="noopener nofollow">'+esc(r[0])+'</a> <span>'+esc(r[1])+' · '+esc(r[2]+' '+r[3])+(r[4]?' · ♿ 편의시설 확인':'')+'</span></li>';}).join('')+'</ul>':'<p style="color:#6b7280">조건에 맞는 곳이 없어요. 지역이나 목적을 바꿔 보세요.</p>';
if(s&&SUB[s]&&L.length>12)h+='<p style="margin:8px 0 2px"><a href="'+SUB[s]+'">'+s+' 실내 가볼만한 곳 전체 보기 →</a></p>';
o.innerHTML=h;}
['igS','igG','igA'].forEach(function(i){document.getElementById(i).addEventListener('change',run);});
fetch('/indoor/data.json').then(function(r){return r.json();}).then(function(d){D=d;run();}).catch(function(){document.getElementById('igOut').innerHTML='<p style="color:#6b7280">목록을 불러오지 못했습니다. 아래 지역별 링크를 이용하세요.</p>';});})();</script>
<div class="ig-box">
<h2 class="ig-h2">지역별·목적별로 몇 곳?</h2>
${tbl}
<p class="ig-src">지역 이름을 누르면 그 지역 실내 가볼만한 곳 전체로 갑니다(40곳 이상인 지역만 따로 페이지가 있습니다. 제주는 제주관광공사 «실내» 분류 기준 별도 페이지).</p>
</div>`;
  const faqHtml = `<div class="ig-box">
<h2 class="ig-h2">추운 날 실내 나들이, 자주 묻는 것</h2>
${FAQ.map(([q, a]) => `<p class="ig-q"><b>${esc(q)}</b><br>${esc(a)}</p>`).join('')}
<div class="ig-rel"><a href="/kids/">👨‍👩‍👧 아이와 가볼만한 곳</a><a href="/indoor/seoul/">🏙 서울 실내 가볼만한 곳</a><a href="/seoul/2026-12/">서울 12월 전시·공연</a><a href="/onsen/">♨️ 전국 온천</a><a href="/winter/">❄️ 겨울 축제 총정리</a><a href="/winter/light/">✨ 겨울 빛축제</a><a href="/accessible/">♿ 무장애 여행지</a></div>
</div>`;
  const title = `실내 가볼만한 곳 — 추운 날·비 오는 날 전국 실내 관광지 ${nf(N)}곳(아이와·온천·전시)`;
  const desc = `추운 겨울·비 오는 날 갈 수 있는 전국 실내 가볼만한 곳 ${nf(N)}곳. 아이와 갈 과학관·아쿠아리움·체험관 ${nf(G.kids.length)}곳, 온천·스파 ${nf(G.warm.length)}곳을 지역·목적별로 골라 보세요. 한국관광공사 공공데이터 기준.`;
  console.log('✓ /indoor/ 한 줄 답 —', N, '곳 · 아이와', G.kids.length, '· 온천', G.warm.length, '· 편의시설', acc.length);
  return { html, faqHtml, faqLd, title, desc };
}
module.exports = { build };
