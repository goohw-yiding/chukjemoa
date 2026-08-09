// 🧭 코스·일정 제안 — /course/ 허브 + 정적 코스 페이지
// 설계 근거: 2026-08-08 노출 진단에서 "얇은 페이지 양산"이 지적됐다. 그래서
//  · 지역×기간×테마 조합으로 자동 양산하지 않는다.
//  · 사람이 실제로 검색하는 문장 12개만 고정으로 만든다.
//  · 정적 페이지에는 날짜를 박지 않는다(날짜가 매 빌드 바뀌면 lastmod가 매번 튄다 → 크롤러가 lastmod를 무시하게 된다).
//    날짜별 타임라인은 아래 대화형 제안기가 만든다.
const fs = require('fs'), path = require('path');
const E = require('./course/engine.js');
const R = require('./course/render.js');
const CD = require('./course-data.js');

const ASSET_V = '20260809b';

// 방문자 데이터(붐빔 배수)는 1·4·8·10월만 있다. 정적 페이지는 지금 계절에 가장 가까운 달을 쓴다.
const SEASON_MM = (() => {
  const m = new Date(Date.now() + 9 * 3600e3).getUTCMonth() + 1;    // KST 기준 (⚠️ toISOString은 날짜가 밀린다)
  const rep = [1, 4, 8, 10];
  const near = rep.reduce((a, b) => (Math.abs(b - m) < Math.abs(a - m) ? b : a), rep[0]);
  return ('0' + near).slice(-2);
})();

// 사람이 실제로 치는 문장 = URL. 12개만. 늘릴 때는 색인·클릭을 보고 늘린다.
const PRESETS = [
  { slug: 'jeju-walk-2n3d', sido: '제주', days: 3, pace: 'normal', focus: ['walk', 'nature'], who: [], h1: '제주 2박3일 걷기 코스', kw: '제주 올레길 중심으로 2박3일', lead: '제주에서 걷는 걸 중심에 두고 2박3일을 짠다면 어떤 순서가 자연스러운지 정리했습니다. 올레길을 포함한 제주 걷기길의 실제 거리·소요시간 데이터로 하루 분량을 맞췄습니다.' },
  { slug: 'gangwon-water-1n2d', sido: '강원', days: 2, pace: 'normal', focus: ['nature'], who: [], h1: '강원 여름 1박2일 물놀이 코스', kw: '강원도 계곡 1박2일', lead: '강원도 계곡을 중심으로 1박2일. 계곡 191곳 중 이 지역에 있는 곳들을 동선 순서로 묶고, 근처 식사·카페·숙소까지 붙였습니다.' },
  { slug: 'gyeongbuk-accessible-1d', sido: '경북', days: 1, pace: 'slow', focus: ['photo'], who: ['wheel'], h1: '경주·경북 무장애 당일 코스', kw: '휠체어로 갈 수 있는 경북 여행', lead: '휠체어·유아차로 갈 수 있는 곳만 골라 하루 코스로 묶었습니다. 한국관광공사 무장애 관광정보에 등록된 시설(휠체어·장애인주차·유아 수유실)만 씁니다.' },
  { slug: 'jeonnam-quiet-1n2d', sido: '전남', days: 2, pace: 'slow', focus: ['quiet', 'nature'], who: [], h1: '전남 한적한 1박2일 코스', kw: '사람 없는 여행지 전남', lead: '"사람 적은 데로 가고 싶다"에 숫자로 답합니다. 방문자 데이터로 이달 붐빔 배수가 낮은 시·군·구를 골라 동선을 만들었습니다.' },
  { slug: 'gyeongnam-pet-1n2d', sido: '경남', days: 2, pace: 'normal', focus: ['nature'], who: ['pet'], h1: '경남 반려견 동반 1박2일 코스', kw: '강아지랑 갈 수 있는 경남 여행', lead: '반려동물 동반이 확인된 곳만 골랐습니다. 동반 조건(견종·목줄·입마개)은 장소마다 다르니 카드의 안내를 함께 보세요.' },
  { slug: 'chungnam-food-1d', sido: '충남', days: 1, pace: 'normal', focus: ['food'], who: [], h1: '충남 먹거리 당일 코스', kw: '충남 맛집 코스 당일치기', lead: '식사와 카페를 축으로 하루를 짰습니다. 영업시간·휴무일이 공공데이터에 있는 곳은 함께 표시했습니다.' },
  { slug: 'gangwon-onsen-1n2d', sido: '강원', days: 2, pace: 'slow', focus: ['onsen', 'quiet'], who: ['parent'], h1: '강원 온천 1박2일 부모님 코스', kw: '부모님 모시고 온천 여행', lead: '부모님과 함께 가는 일정이라 걷는 거리를 줄이고 온천을 중심에 뒀습니다. 긴 걷기길은 자동으로 뺍니다.' },
  { slug: 'jeonbuk-walk-1d', sido: '전북', days: 1, pace: 'normal', focus: ['walk'], who: [], h1: '전북 걷기 좋은 당일 코스', kw: '전북 둘레길 당일 코스', lead: '전국길관광정보 표준데이터의 걷기길을 거리·소요시간으로 하루에 맞춰 배치했습니다.' },
  { slug: 'gyeonggi-kid-1d', sido: '경기', days: 1, pace: 'slow', focus: ['nature', 'photo'], who: ['kid'], h1: '경기 아이와 당일 나들이 코스', kw: '아이랑 갈 만한 경기도 나들이', lead: '아이와 함께라 이동을 짧게, 긴 산행은 빼고 짰습니다.' },
  { slug: 'busan-1d', sido: '부산', days: 1, pace: 'packed', focus: ['photo', 'food'], who: [], h1: '부산 당일치기 코스', kw: '부산 당일치기 일정', lead: '부산 안에서 이동을 줄이고 많이 도는 일정입니다. 붐비는 구간은 배지로 표시했습니다.' },
  { slug: 'gyeongbuk-quiet-1n2d', sido: '경북', days: 2, pace: 'slow', focus: ['quiet'], who: [], h1: '경북 조용한 1박2일 코스', kw: '경북 한적한 여행지', lead: '외국인 방문이 적고 이달 붐빔 배수가 낮은 지역 위주로 골랐습니다.' },
  { slug: 'chungbuk-nature-1n2d', sido: '충북', days: 2, pace: 'normal', focus: ['nature', 'walk'], who: [], h1: '충북 자연 1박2일 코스', kw: '충북 1박2일 여행 코스', lead: '산·계곡·걷기길을 하루 분량에 맞춰 이어 붙였습니다.' }
];

const CSS = `
.cwiz{background:#fff;border-radius:18px;padding:18px 20px;box-shadow:0 3px 16px rgba(31,41,55,.08);margin:14px 0}
.cwiz h3{font-size:.95rem;font-weight:900;color:#0a6c63;margin:14px 0 8px}
.cwiz h3:first-child{margin-top:0}
.cwiz select,.cwiz input[type=date]{padding:10px 13px;border:1.5px solid #dcefeb;border-radius:12px;font-size:.95rem;font-family:inherit;background:#f4faf8;color:#374151}
.crowf{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.cchk{display:flex;flex-wrap:wrap;gap:8px}
.cchk label{background:#f4faf8;border:1.5px solid #dcefeb;border-radius:999px;padding:8px 14px;font-size:.9rem;font-weight:700;color:#374151;cursor:pointer;user-select:none}
.cchk input{display:none}
.cchk input:checked+span{color:#0a6c63}
.cchk label:has(input:checked){background:#e2f5f2;border-color:#0f9d8f;color:#0a6c63}
.cbtn{display:block;width:100%;margin-top:16px;background:#0f9d8f;color:#fff;border:none;border-radius:14px;padding:15px;font-weight:900;font-size:1.05rem;cursor:pointer;font-family:inherit}
.cbtn:disabled{background:#9ca3af;cursor:default}
.cbtn2{display:block;margin:12px 0 0;background:#f3f4f6;color:#374151;border:none;border-radius:12px;padding:12px 20px;font-weight:800;cursor:pointer;font-family:inherit;font-size:.92rem}
.cpresets{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
.cpreset,.cplink{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.88rem;padding:9px 15px;border-radius:999px;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-block}
.cpreset:hover,.cplink:hover{background:#e2f5f2}
.cday{margin:22px 0 0}
.cdh{display:flex;align-items:baseline;gap:10px;border-bottom:2px solid #e2f5f2;padding-bottom:8px;margin-bottom:6px}
.cdh b{font-size:1.15rem;color:#0a6c63}
.cdh span{color:#6b7280;font-size:.9rem}
.cdh em{margin-left:auto;font-style:normal;font-size:.82rem;color:#9ca3af}
.citem{margin:10px 0}
.cmove{font-size:.8rem;color:#9ca3af;margin:6px 0 6px 74px}
.cmove em{font-style:normal;color:#c3c9d2}
.crow{display:flex;gap:12px;align-items:flex-start}
.ctime{flex:none;width:62px;font-weight:900;color:#0f9d8f;font-size:.92rem;padding-top:4px}
.ctime span{font-weight:600;color:#9ca3af;font-size:.8rem}
.cbody2{flex:1;background:#fff;border-radius:14px;box-shadow:0 2px 10px rgba(31,41,55,.07);padding:12px 14px;display:flex;gap:12px}
.cthumb2{width:92px;height:70px;object-fit:cover;border-radius:10px;flex:none;background:#f6f1ea}
.cmeta{flex:1;min-width:0}
.ctag{font-size:.75rem;font-weight:800;color:#0f9d8f}
.cmeta h4{font-size:1rem;font-weight:900;color:#1f2937;margin:2px 0 0}
.cline{font-size:.82rem;color:#6b7280;margin-top:3px}
.chours{font-size:.8rem;color:#4b5563;margin-top:4px}
.chours.dim{color:#b0b7c0}
.cbadge{display:inline-block;font-size:.74rem;font-weight:800;border-radius:999px;padding:3px 9px;margin-top:6px}
.cbadge.hot{background:#fff1e8;color:#c2410c}
.cbadge.quiet{background:#f2fbfa;color:#0a6c63}
.cov2{font-size:.83rem;color:#4b5563;line-height:1.5;margin-top:6px}
.cmap{display:inline-block;margin-top:7px;font-size:.82rem;font-weight:700;color:#0f9d8f;text-decoration:none}
.cmkt{background:#fffbeb;border-radius:12px;padding:11px 14px;font-size:.87rem;color:#92400e;margin-top:12px}
.csum{background:#f2fbfa;border-radius:16px;padding:16px 18px;margin:22px 0 0}
.csum h3{font-size:1rem;font-weight:900;color:#0a6c63;margin-bottom:8px}
.csum ul{list-style:none;padding:0}
.csum li{font-size:.92rem;color:#374151;padding:4px 0}
.csum li em{font-style:normal;color:#9ca3af;font-size:.84em}
.cwarn{font-size:.8rem;color:#6b7280;line-height:1.6;margin-top:12px;background:#fff;border-radius:10px;padding:10px 12px}
.cnote{background:#fff;border-radius:12px;padding:14px;color:#6b7280;font-size:.9rem}
.ctab{width:100%;border-collapse:collapse;margin-top:10px;font-size:.85rem;background:#fff;border-radius:10px;overflow:hidden}
.ctab th,.ctab td{padding:8px 10px;border-bottom:1px solid #eef2f1;text-align:left}
.ctab th{background:#f2fbfa;color:#0a6c63;font-weight:800}
.cai{margin:8px 0;padding:11px 14px;border-radius:14px;font-size:.92rem;line-height:1.6;max-width:88%}
.cai.me{background:#0f9d8f;color:#fff;margin-left:auto;border-bottom-right-radius:4px}
.cai.bot{background:#fff;color:#374151;box-shadow:0 2px 10px rgba(31,41,55,.07);border-bottom-left-radius:4px}
#c-ai-log{max-height:420px;overflow-y:auto;padding:4px 2px}
.cain{display:flex;gap:8px;margin-top:10px}
.cain input{flex:1;padding:12px 14px;border:1.5px solid #dcefeb;border-radius:12px;font-size:.95rem;font-family:inherit;background:#fff}
.cain button{background:#0f9d8f;color:#fff;border:none;border-radius:12px;padding:12px 20px;font-weight:800;cursor:pointer;font-family:inherit}
.cqs{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
.cq{background:#fff;border:1.5px solid #dcefeb;color:#4b5563;font-size:.83rem;padding:7px 13px;border-radius:999px;cursor:pointer;font-family:inherit}
@media(max-width:640px){.cbody2{flex-direction:column}.cthumb2{width:100%;height:150px}.ctime{width:52px;font-size:.85rem}.cmove{margin-left:64px}}
`;

const SCRIPTS = `<script src="/course/engine.js?v=${ASSET_V}"></script>
<script src="/course/render.js?v=${ASSET_V}"></script>
<script src="/course/app.js?v=${ASSET_V}" defer></script>`;

function wizard(def) {
  def = def || {};
  const SIDO = Object.keys(CD.SIDO_SLUG);
  const sel = def.sido || '제주';
  const F = def.focus || [], W = def.who || [];
  const chk = (name, v, label) => `<label><input type="checkbox" name="${name}" value="${v}"${(name === 'focus' ? F : W).indexOf(v) >= 0 ? ' checked' : ''}><span>${label}</span></label>`;
  return `<div class="cwiz" id="c-form">
<h3>1. 어디로 가세요?</h3>
<div class="crowf">
<select id="c-sido">${SIDO.map(s => `<option value="${CD.SIDO_SLUG[s]}"${s === sel ? ' selected' : ''}>${s}</option>`).join('')}</select>
<input type="date" id="c-date">
<select id="c-days">${[1, 2, 3, 4].map(n => `<option value="${n}"${n === (def.days || 1) ? ' selected' : ''}>${n === 1 ? '당일치기' : (n - 1) + '박' + n + '일'}</option>`).join('')}</select>
<select id="c-pace">
<option value="slow"${def.pace === 'slow' ? ' selected' : ''}>여유롭게</option>
<option value="normal"${(def.pace || 'normal') === 'normal' ? ' selected' : ''}>보통</option>
<option value="packed"${def.pace === 'packed' ? ' selected' : ''}>많이 돌기</option>
</select>
</div>
<h3>2. 누구와 가세요?</h3>
<div class="cchk">
${chk('who', 'alone', '혼자')}${chk('who', 'friend', '친구·연인')}${chk('who', 'kid', '아이와')}${chk('who', 'parent', '부모님과')}${chk('who', 'pet', '반려견과')}${chk('who', 'wheel', '휠체어·유아차')}
</div>
<h3>3. 뭘 중심으로 돌까요?</h3>
<div class="cchk">
${chk('focus', 'walk', '🥾 걷기')}${chk('focus', 'nature', '⛰️ 자연')}${chk('focus', 'food', '🍚 먹기')}${chk('focus', 'photo', '📷 사진·감성')}${chk('focus', 'fes', '🎪 축제')}${chk('focus', 'onsen', '♨️ 온천')}${chk('focus', 'quiet', '🤫 한적한 곳')}
</div>
<h3>4. 어떻게 이동하세요?</h3>
<div class="cchk">
<label><input type="radio" name="move" value="car" checked><span>🚗 자차</span></label>
<label><input type="radio" name="move" value="transit"><span>🚌 대중교통</span></label>
</div>
<button class="cbtn" id="c-run" type="button">코스 짜기</button>
</div>`;
}

const AI_BOX = `<div id="c-ai" style="display:none;margin-top:26px">
<h2 class="sec">💬 이 코스, AI에게 더 물어보기</h2>
<p style="color:#6b7280;font-size:.92rem">위에 나온 코스와 후보 목록을 보고 답합니다. 목록에 없는 곳은 지어내지 않습니다.</p>
<div id="c-ai-log"></div>
<div class="cqs">
<button class="cq" type="button">2일차가 너무 빡빡해요, 하나 빼주세요</button>
<button class="cq" type="button">비 오면 어디로 바꾸면 좋을까요?</button>
<button class="cq" type="button">더 한적한 곳으로 바꿔주세요</button>
<button class="cq" type="button">아이랑 가기엔 어디가 무리인가요?</button>
</div>
<div class="cain"><input id="c-ai-in" type="text" placeholder="예) 첫날 이동이 너무 길어요. 줄여줄 수 있나요?" maxlength="200"><button id="c-ai-send" type="button">보내기</button></div>
<p class="cwarn">AI 답변은 참고용입니다. 영업시간·휴무일·예약 가능 여부는 우리 데이터에 없으므로 반드시 직접 확인하세요.</p>
</div>`;

const LIMITS = `<h2 class="sec">이 기능이 못 하는 것</h2>
<p>쓸모 있으려면 못 하는 것부터 밝히는 게 맞다고 봅니다.</p>
<ul>
<li><b>실제 도로 이동시간이 아닙니다.</b> 두 지점의 직선거리에 1.35를 곱해 추정합니다. 산길·섬·도심 정체는 반영되지 않습니다. 대중교통은 코스를 만든 뒤 <b>실제 소요시간 확인</b> 버튼을 누르면 ODsay 경로로 실측값을 가져옵니다.</li>
<li><b>영업시간·휴무일이 대부분 없습니다.</b> 공공데이터에 등록된 곳만 표시합니다. "월요일 휴관" 같은 정보를 우리가 다 알지 못하므로 방문 전 확인이 필요합니다.</li>
<li><b>가격·빈방·예약은 다루지 않습니다.</b> 숙소는 위치와 유형만 보여줍니다.</li>
<li><b>붐빔 배수는 그 장소가 아니라 그 시·군·구 기준입니다.</b> 같은 군 안에서도 장소마다 다릅니다.</li>
</ul>`;

function faqLd(items) {
  return `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
  })}</script>`;
}

function build(ctx) {
  const { ROOT, layout, writePage, SITE_NAME } = ctx;
  const urls = [];
  const packs = {};
  const loadPack = slug => {
    if (packs[slug]) return packs[slug];
    try { packs[slug] = E.expand(JSON.parse(fs.readFileSync(path.join(ROOT, 'course', 'd', slug + '.json'), 'utf8'))); }
    catch (e) { packs[slug] = null; }
    return packs[slug];
  };

  // ── 허브 /course/
  {
    const presetChips = PRESETS.slice(0, 8).map(p =>
      `<a class="cplink" href="/course/${p.slug}/">${p.h1}</a>`).join('');
    const faq = [
      ['축제모아 코스 제안은 무엇을 근거로 만드나요?', '한국관광공사 TourAPI의 축제·음식점·카페·숙박·자연 명소, 전국길관광정보 표준데이터의 걷기길 1,325개 코스(거리·소요시간·난이도), 한국관광 데이터랩의 시·군·구 방문자 수를 씁니다. 좌표로 동선을 정렬하고 걷기길의 실제 소요시간으로 하루 분량을 맞춥니다.'],
      ['이동시간은 정확한가요?', '아닙니다. 직선거리에 1.35를 곱해 추정한 값입니다. 대중교통은 코스를 만든 뒤 실제 소요시간 확인 버튼을 누르면 ODsay 경로 기준 실측값을 가져옵니다.'],
      ['영업시간이 안 나오는 곳이 있는데요?', '공공데이터에 영업시간이 등록된 곳만 표시합니다. 등록되지 않은 곳이 더 많아 "정보 없음"으로 두었습니다. 없는 정보를 추정해서 넣지 않습니다.'],
      ['한적한 곳 위주로 짤 수 있나요?', '가능합니다. 중점에서 "한적한 곳"을 고르면 이달 방문자 배수가 높은 시·군·구와 외국인 방문 상위 지역에 감점을 줘서 후보에서 밀어냅니다.'],
      ['휠체어나 반려견과 함께 가는 코스도 되나요?', '됩니다. 휠체어·유아차를 고르면 무장애 관광정보에 등록된 시설만 쓰고 산·걷기길을 제외합니다. 반려견을 고르면 동반 가능이 확인된 장소만 씁니다.']
    ];
    const content = `<main><div class="wrap">
<style>${CSS}</style>
<h1 style="font-size:1.5rem;font-weight:900;margin:8px 0 4px">🧭 코스 짜기 — 조건만 고르면 일정이 나옵니다</h1>
<p style="color:#6b7280;font-size:.95rem">"며칠, 누구와, 뭘 중심으로"만 고르면 그 지역의 축제·걷기길·자연·식당·카페·숙소를 <b>동선 순서로</b> 묶어 시간표를 만듭니다. 걷기길은 실제 거리·소요시간이 있어서 하루에 무리인지 아닌지를 계산할 수 있습니다. 여기에 <b>이달 그 동네가 평소보다 몇 배 붐비는지</b>를 같이 보여주는 건 다른 데는 없는 부분입니다.</p>
<div class="cpresets">${presetChips}</div>
${wizard({ sido: '제주', days: 2, focus: ['walk', 'nature'] })}
<div id="c-outwrap"><div id="c-out"></div></div>
${AI_BOX}
${LIMITS}
<h2 class="sec">자주 묻는 것</h2>
${faq.map(([q, a]) => `<p><b>${q}</b><br>${a}</p>`).join('')}
<p class="note" style="margin-top:18px">데이터 출처: 한국관광공사 TourAPI(축제·음식점·카페·숙박·무장애·반려동반) · 전국길관광정보 표준데이터(걷기길) · 한국관광공사 「한국관광 데이터랩」(시·군·구 방문자 수) · 대중교통 소요시간 ODsay.</p>
</div></main>${SCRIPTS}`;
    writePage('course', layout(
      `여행 코스 짜기 — 조건 넣으면 일정까지 | ${SITE_NAME}`,
      `며칠·누구와·뭘 중심으로만 고르면 그 지역 축제·걷기길·자연·맛집·숙소를 동선 순서로 묶어 시간표를 만들어 드립니다. 걷기길 실제 소요시간과 이달 붐빔 배수까지 반영합니다.`,
      '/course/', content, { jsonld: faqLd(faq), ogImage: '/img/hero.webp' }));
    urls.push('/course/');
  }

  // ── 정적 코스 페이지 (날짜 없음 — lastmod 안정성 때문)
  PRESETS.forEach(p => {
    const slug = CD.SIDO_SLUG[p.sido];
    const D = loadPack(slug);
    if (!D) return;
    // 축제는 날짜 의존이라 정적 페이지에서는 쓰지 않는다 → 연도를 1970으로 둬서 자동 배제.
    // ⚠️ 단, 월(月)은 지금 계절에 맞춰야 붐빔 배수가 붙는다. 방문자 데이터는 1·4·8·10월만 있으므로 가장 가까운 달로 맞춘다.
    const O = { slug, date: '1970' + SEASON_MM + '15', days: p.days, who: p.who, focus: p.focus, move: 'car', pace: p.pace };
    const P = E.makePlan(D, O);
    const body = R.renderPlan(D, P, { static: true, nodate: true });
    const n = P.days.reduce((a, d) => a + d.items.length, 0);
    if (n < 3) return;                       // 후보가 빈약하면 페이지를 만들지 않는다(얇은 페이지 방지)

    const faq = [
      [`${p.h1}는 어떻게 정해졌나요?`, `${p.sido} 지역의 공공데이터 후보를 좌표로 이어 동선이 짧은 순서로 배치하고, 걷기길은 실제 소요시간으로 하루 분량을 맞췄습니다. 광고나 제휴가 아니라 데이터로 뽑은 순서입니다.`],
      ['날짜를 바꾸고 싶어요.', '이 페이지 아래의 코스 짜기에서 날짜와 조건을 바꾸면 그 날 열리는 축제와 오일장까지 반영해 다시 만들어 드립니다.'],
      ['이동시간이 정확한가요?', '직선거리 기반 추정치입니다. 대중교통 실제 소요시간은 조건을 넣어 코스를 만든 뒤 확인 버튼으로 조회할 수 있습니다.']
    ];
    const content = `<main><div class="wrap">
<style>${CSS}</style>
<h1 style="font-size:1.5rem;font-weight:900;margin:8px 0 4px">${p.h1}</h1>
<p style="color:#6b7280;font-size:.95rem">${p.lead}</p>
<p style="color:#9ca3af;font-size:.85rem">아래는 <b>날짜를 넣지 않은 기본 동선</b>입니다. 실제 날짜를 넣으면 그 날 열리는 축제와 오일장까지 반영해 시간표를 다시 만들어 드립니다.</p>
${body}
<h2 class="sec">내 날짜·조건으로 다시 짜기</h2>
${wizard({ sido: p.sido, days: p.days, focus: p.focus, who: p.who, pace: p.pace })}
<div id="c-outwrap"><div id="c-out"></div></div>
${AI_BOX}
${LIMITS}
<h2 class="sec">자주 묻는 것</h2>
${faq.map(([q, a]) => `<p><b>${q}</b><br>${a}</p>`).join('')}
<div class="cpresets" style="margin-top:18px">${PRESETS.filter(o => o.slug !== p.slug).slice(0, 6).map(o => `<a class="cplink" href="/course/${o.slug}/">${o.h1}</a>`).join('')}</div>
<p class="note" style="margin-top:18px">데이터 출처: 한국관광공사 TourAPI · 전국길관광정보 표준데이터 · 한국관광공사 「한국관광 데이터랩」. 영업시간·휴무일은 등록된 곳만 표시합니다. 방문 전 확인하세요.</p>
</div></main>${SCRIPTS}`;

    writePage('course/' + p.slug, layout(
      `${p.h1} — 동선·소요시간·이동비까지 | ${SITE_NAME}`,
      `${p.kw}. 공공데이터로 ${p.sido} 지역 ${n}곳을 동선 순서로 묶고 소요시간과 이동비까지 계산했습니다. 날짜를 넣으면 그 날 열리는 축제·오일장까지 반영해 다시 짜 드립니다.`,
      `/course/${p.slug}/`, content, { jsonld: faqLd(faq), ogImage: '/img/hero.webp' }));
    urls.push(`/course/${p.slug}/`);
  });

  console.log('✓ /course/ —', urls.length, '페이지');
  return urls;
}

module.exports = { build, PRESETS };
