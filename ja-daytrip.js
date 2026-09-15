// 🚄 /ja/daytrip/ — 「ソウルから日帰り・1泊2日で行ける街」
//
// 왜 이것인가 (2026-09-14 결정 · 근거는 handoff 문서)
//   한국관광공사 발표: 訪韓 일본인 2025년 365만(과거 최다) → 2026년 목표 450만(+23%),
//   90% 이상이 개인여행, 20·30대 여성이 견인. 그런데 **「지방 방문률 20% 미만」이 그쪽이 꼽은 과제**다.
//   그리고 「1박2일, 나아가 당일치기」 콘텐츠가 늘고 있다.
//   ⇒ 지방은 «경쟁이 비어 있고 우리 데이터가 제일 두꺼운» 자리다.
//   ⇒ 「混む日」(/ja/busy/)의 다음 질문이 「그럼 어디로 가나」라서 축이 이어진다.
//
// 무엇으로 말하나 — 전부 우리가 가진 것. 지어내지 않는다.
//   · data/train_time.json      코레일 공식 시간표·운임 (79개 역 · 출발역별 최속 + 일반실 운임)
//   · data/train_station_geo.json  역 좌표 (카카오)
//   · data/places_ja.json       일본어 장소 3,367건 → 역 반경 12km 안의 개수
//   · data/markets_std.json     오일장 409곳 → 역 반경 15km 안, «며칠에 서는지»
//   · restaurants/cafes_ko      요일 정기휴무 → 「그날 문 여나」로 /ja/busy/ 에 넘긴다
//
// ⚠️ 표기 규칙
//   · 「KTX で○分」이라 쓰지 않는다 — 편성마다 다르다. **「いちばん速い列車で○分」**
//   · 운임은 **一般室(普通車)** 기준이라고 밝힌다. 특실은 더 비싸다
//   · 출발역을 반드시 같이 적는다 — 강릉은 청량리, 전주는 용산, 부산은 수서가 제일 빠르다.
//     일본인 숙소가 명동이냐 강남이냐에 따라 답이 달라지는데 이걸 안 적는 사이트가 대부분이다
'use strict';
const fs = require('fs'), path = require('path');
const load = f => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { return null; } };
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nf = n => Number(n || 0).toLocaleString('ja-JP');

// 코레일 시간표의 한자 역명에는 «중국어 간체»가 섞여 있다(东大邱·庆州).
// 일본어 페이지에 간체를 그대로 두면 안 된다. 실제로 쓰인 글자만 바꾼다 — 넓게 추측하지 않는다.
const HAN_FIX = { '东': '東', '庆': '慶', '广': '廣', '济': '濟', '汉': '漢', '长': '長', '宁': '寧', '丽': '麗' };
// ⚠️ 한자 칸에 한글이 그대로 남은 역이 있다(「麗水엑스포」). 일본어 페이지에 한글을 두지 않는다.
//    실물에서 보고 알았다 — 표에도 카드에도 「麗水엑스포」라고 찍혀 있었다.
const KO_FIX = { '엑스포': 'エキスポ' };
const han = s => {
  let t = String(s || '').replace(/[一-鿿]/g, c => HAN_FIX[c] || c);
  for (const k of Object.keys(KO_FIX)) t = t.split(k).join(KO_FIX[k]);
  return t;
};

// 출발역 일본어 표기 — 여행자가 실제로 찾아가야 하는 역이라 «읽을 수 있게» 적는다
const ORIG_JA = {
  '서울': 'ソウル駅', '용산': '龍山駅', '청량리': '清凉里駅', '수서': '水西駅',
  '행신': '幸信駅', '판교(경기)': '板橋駅（城南）'
};
// 우리 일본어 도시 페이지가 있는 시·군. 여기 없는 도시는 시·도 허브(/ja/places/{sido}/)로 보낸다.
const CITY_PAGE = {
  '강릉시': 'gangneung', '경주시': 'gyeongju', '전주시': 'jeonju', '여수시': 'yeosu',
  '수원시': 'suwon', '통영시': 'tongyeong', '거제시': 'geoje', '속초시': 'sokcho',
  '청주시': 'cheongju', '제주시': 'jeju'
};
const SIDO_PAGE = { '부산': 'busan', '대구': 'daegu', '인천': 'incheon' };
// 시·도 허브 슬러그(places-ja.js 와 같은 표기를 써야 링크가 산다)
const SIDO_SLUG = {
  '서울': 'seoul', '부산': 'busan', '대구': 'daegu', '인천': 'incheon', '광주': 'gwangju',
  '대전': 'daejeon', '울산': 'ulsan', '경기': 'gyeonggi', '강원': 'gangwon', '충북': 'chungbuk',
  '충남': 'chungnam', '전북': 'jeonbuk', '전남': 'jeonnam', '경북': 'gyeongbuk', '경남': 'gyeongnam', '제주': 'jeju'
};
const SIDO_JA = {
  '서울': 'ソウル', '부산': '釜山', '대구': '大邱', '인천': '仁川', '광주': '光州', '대전': '大田',
  '울산': '蔚山', '세종': '世宗', '경기': '京畿道', '강원': '江原道', '충북': '忠清北道', '충남': '忠清南道',
  '전북': '全羅北道', '전남': '全羅南道', '경북': '慶尚北道', '경남': '慶尚南道', '제주': '済州'
};
// 주소 문자열 → 우리 표기. ⚠️ 행정구역 통합으로 「전남광주통합특별시」 같은 표기가 온다.
function sidoOf(addrSido) {
  const s = String(addrSido || '');
  if (/전남|전라남/.test(s) && /광주/.test(s)) return '전남';   // 통합 표기 — 앞쪽이 실제 시·도다
  for (const k of Object.keys(SIDO_SLUG)) if (s.indexOf(k) === 0) return k;
  if (/강원/.test(s)) return '강원';
  if (/전북|전라북/.test(s)) return '전북';
  if (/충북|충청북/.test(s)) return '충북';
  if (/충남|충청남/.test(s)) return '충남';
  if (/경북|경상북/.test(s)) return '경북';
  if (/경남|경상남/.test(s)) return '경남';
  if (/제주/.test(s)) return '제주';
  return '';
}
const km = (ax, ay, bx, by) => {
  const r = Math.PI / 180;
  const dx = (bx - ax) * Math.cos((ay + by) / 2 * r) * 111.32, dy = (by - ay) * 110.57;
  return Math.sqrt(dx * dx + dy * dy);
};

const CSS = `<style>
.dtc{background:#fff;border-radius:16px;padding:18px 20px;margin:14px 0;box-shadow:0 2px 10px rgba(31,41,55,.06)}
.dtc h2{font-size:1.06rem;font-weight:900;color:#0a6c63;margin:0 0 8px}
.dtc h3{font-size:.98rem;font-weight:800;color:#1f2937;margin:16px 0 6px}
.dtc p{color:#374151;font-size:.95rem;line-height:1.85;margin:0 0 8px}
.dtnote{color:#9aa3af;font-size:.81rem;line-height:1.65;margin-top:9px}
.dtk{font-weight:800;color:#1c1917}
.dtgrid{display:grid;gap:12px;margin:12px 0}
.dtcard{border:1.5px solid #eef2f1;border-radius:14px;padding:14px 15px;background:#fff}
.dtcard.d1{border-color:#cfe9e4;background:#fbfffe}
.dthead{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:8px}
.dthead .nm{font-size:1.12rem;font-weight:900;color:#1f2937;letter-spacing:-.01em}
.dthead .ko{font-size:.82rem;color:#9aa3af;font-weight:700}
.dthead .rg{font-size:.8rem;color:#6b7280;background:#f4f6f5;border-radius:999px;padding:2px 9px;font-weight:700}
.dtfact{display:flex;flex-wrap:wrap;gap:6px 14px;margin:8px 0;font-size:.9rem;color:#374151}
.dtfact b{color:#0a6c63;font-weight:900;font-size:1.02em}
.dtwhy{font-size:.9rem;color:#4b5563;line-height:1.8;margin:8px 0 0}
.dtlinks{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.dtlinks a{background:#fff;border:1.5px solid #dcefeb;color:#0c7d72;font-weight:700;font-size:.84rem;padding:7px 12px;border-radius:999px;text-decoration:none}
.dtt{width:100%;border-collapse:collapse;font-size:.92rem;margin:8px 0;min-width:420px}
.dtt th{background:#f6fbfa;color:#0a6c63;font-weight:800;text-align:left;padding:9px 10px;border-bottom:2px solid #dcefeb;white-space:nowrap}
.dtt td{padding:9px 10px;border-bottom:1px solid #eef2f1;color:#374151}
.dtt td.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.dtwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.dtsw{display:none;color:#9aa3af;font-size:.83rem;margin:2px 0 6px}
.dtnav{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}
.dtnav a{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.88rem;padding:9px 14px;border-radius:999px;text-decoration:none}
.dtol{margin:6px 0 0;padding-left:22px}
.dtol li{color:#374151;font-size:.95rem;line-height:1.85;margin-bottom:7px}
@media(max-width:560px){.dtsw{display:block}}
</style>`;

function build(ctx) {
  const { layout, writePage, TODAY } = ctx;
  const TT = load('train_time.json'), GEO = load('train_station_geo.json');
  if (!TT || !GEO) { console.log('⚠️ /ja/daytrip/ 건너뜀 — train_time.json 또는 train_station_geo.json 없음'); return []; }
  const PJ = load('places_ja.json') || [];
  const MK = (load('markets_std.json') || []).filter(m => m.x && m.y && Array.isArray(m.daysNum) && m.daysNum.length);
  // 🚌 시티투어버스 — 이 페이지에 빠져 있던 답: 「기차로 도착했는데 그 다음은 어떻게 도나」.
  //    일본인 訪韓客의 90% 이상이 개인여행이고 대부분 렌터카를 안 쓴다. 지방에서 차 없이 도는 길이 이것이다.
  //    데이터가 드물게 완전하다 — 277건 전부에 요금·운행시각·승차장·코스가 채워져 있다.
  //    ⭐ 그리고 승차장이 대개 «역 앞»이다(여주역 승강장·안동역·묵호역·대전역시티투어승강장…).
  const CT = load('citytour.json') || [];
  const G = GEO.stations, S = TT.stations;

  // ── 대상 고르기
  //   ⚠️ 서울시 안의 역(상봉·영등포…)은 «日帰りで行く街»가 아니다 — 출발지다. 뺀다.
  //   ⚠️ 40분 미만도 뺀다. 「서울에서 30분」은 여행이 아니라 이동이다.
  //   ⚠️ 그리고 **보여줄 게 없는 역은 넣지 않는다** — 소요시간만 적힌 줄은 아무 쓸모가 없다.
  const MAXMIN = 180, MINMIN = 40, RP = 12, RM = 15;
  const rows = [];
  for (const [nm, v] of Object.entries(S)) {
    const g = G[nm];
    if (!g || v.min < MINMIN || v.min > MAXMIN) continue;
    const sido = sidoOf(g.sido);
    if (sido === '서울' || sido === '경기') continue;
    const places = PJ.filter(p => p.x && p.y && km(g.x, g.y, +p.x, +p.y) <= RP);
    const mkts = MK.map(m => ({ m, d: km(g.x, g.y, +m.x, +m.y) })).filter(o => o.d <= RM)
      .sort((a, b) => a.d - b.d).map(o => Object.assign({ _km: Math.round(o.d) }, o.m));
    // ⚠️ 오일장만으로는 싣지 않는다. 반경 15km 를 잡으면 시골 어디에나 두어 곳은 있어서
    //    「오일장 2곳」이 기준이 되면 여행지가 아닌 간이역까지 다 들어온다(첫 판에 45개가 됐다).
    //    «일본어로 보여줄 것이 실제로 있는가»를 기준으로 한다.
    if (places.length < 10 && !CITY_PAGE[g.sigungu] && !SIDO_PAGE[sido]) continue;
    rows.push({ nm, v, g, sido, sigungu: g.sigungu, places, mkts });
  }
  // 같은 도시에 역이 여럿이면 «제일 빠른 역» 하나만 남긴다.
  // ⚠️ 광역시는 «구»가 달라도 같은 도시다 — 동대구/서대구, 부산/구포, 울산/태화강이 따로 실렸다.
  //    광역시는 시·도로, 도(道)는 시·군으로 묶는다.
  const METRO = new Set(['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종']);
  // ⭐ 「제일 빠른 역」만으로 고르면 관문이 아닌 역이 그 도시의 얼굴이 된다 —
  //    여수는 «여천»(165분), 원주는 «서원주»(44분), 울산은 «태화강»이 뽑혔다.
  //    여행자가 실제로 내리는 건 «도시 이름을 단 역»이다. 그걸 먼저 보고, 없을 때만 빠른 순으로 간다.
  //    (손으로 예외를 박지 않는다 — 이름 규칙 하나로 여수엑스포·원주·울산역이 다 제자리를 찾는다.)
  const cityWord = r => String(METRO.has(r.sido) ? r.sido : r.sigungu).replace(/(특별자치)?[시군구도]$/, '');
  //    ⚠️ «부분 포함»만 보면 「서원주」도 원주의 관문이 된다(44분이라 원주역 49분을 이겼다).
  //       이름이 도시명과 «정확히 같은» 역을 맨 위에 둔다: 원주 > 서원주, 부산 > 구포.
  const rank = r => {
    const w = cityWord(r);
    if (w.length < 2) return 0;
    if (r.nm === w) return 2;                      // 「원주」「부산」「울산」 — 그 도시의 이름 그대로
    return r.nm.indexOf(w) >= 0 ? 1 : 0;           // 「광주송정」「여수엑스포」 — 이름을 품고 있다
  };
  const better = (a, b) => {                       // b 가 a 보다 나은가
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return rb > ra;                 // 관문역이 이긴다
    return b.v.min < a.v.min;                      // 같은 급이면 빠른 쪽
  };
  const byCity = {};
  rows.forEach(r => {
    const k = METRO.has(r.sido) ? r.sido : (r.sido + '|' + r.sigungu);
    if (!byCity[k] || better(byCity[k], r)) byCity[k] = r;
  });
  const list = Object.values(byCity).sort((a, b) => a.v.min - b.v.min);
  if (!list.length) { console.log('⚠️ /ja/daytrip/ 건너뜀 — 대상 0개'); return []; }

  const DAY = 120;                                  // ← 편도 2시간까지를 「日帰り」로 본다
  // 표에는 전부 싣는다(자료로서 값이 있다). 카드는 «실제로 하루를 보낼 만한 곳»만 —
  // 견본이 10건인 역까지 카드로 크게 세우면 읽는 사람이 다 같은 무게로 읽게 된다.
  //   ⚠️ 실물에서 보고 두 조건을 더 걸었다:
  //      · 「1日 4本」인 역(판교발 충주·문경·연풍)이 카드로 올라와 있었다 — 하루 4편으로는 일정을 못 짠다
  //      · 볼거리 10~15건짜리 간이역이 부산(144건)과 같은 크기로 실려 있었다
  const isCard = r => r.v.trains >= 10 && (r.places.length >= 25 || CITY_PAGE[r.sigungu] || SIDO_PAGE[r.sido]);
  const cards = list.filter(isCard);
  const dayTrip = cards.filter(r => r.v.min <= DAY);
  const overnight = cards.filter(r => r.v.min > DAY);

  // ── 🚌 시티투어버스를 도시에 붙인다
  //   ⚠️ 시·군 이름만으로 맞추면 「중구」「동구」가 여러 시·도에 있어 엉뚱한 데 붙는다(인천 중구 = 대전 동구).
  //      시·도까지 같이 본다.
  const bare = s => String(s || '').replace(/(특별자치)?[시군구도]$/, '');
  const ctKey = c => sidoOf(c.sido) + '|' + bare(c.city);
  const CT_BY = {};
  CT.forEach(c => { (CT_BY[ctKey(c)] = CT_BY[ctKey(c)] || []).push(c); });
  const tourOf = r => CT_BY[r.sido + '|' + bare(r.sigungu)] || [];
  // 요금 문자열에서 «가장 싼 어른 요금»을 뽑는다. 「성인 5000원/청소년 3000원」 같은 한국어라 숫자만 본다.
  //   ⚠️ 못 읽으면 값을 만들어 내지 않고 비워 둔다.
  const feeOf = list => {
    const nums = [];
    list.forEach(c => (c.fee || []).forEach(f => {
      const m = String(f).replace(/,/g, '').match(/(\d{3,6})\s*원/);
      if (m) nums.push(+m[1]);
    }));
    return nums.length ? Math.min(...nums) : null;
  };

  const cityLink = r => {
    const c = CITY_PAGE[r.sigungu] || SIDO_PAGE[r.sido];
    return c ? `/ja/${c}/` : (SIDO_SLUG[r.sido] ? `/ja/places/${SIDO_SLUG[r.sido]}/` : '');
  };
  const cityLabel = r => (CITY_PAGE[r.sigungu] || SIDO_PAGE[r.sido]) ? '街のページ' : `${SIDO_JA[r.sido] || ''}の見どころ`;

  function card(r, cls) {
    const v = r.v, g = r.g;
    const link = cityLink(r);
    const oja = ORIG_JA[v.from] || (v.from + '駅');
    const nmJa = han(v.han || r.nm);
    const facts = [];
    facts.push(`🚄 <b>${v.min}分</b>（${esc(oja)}発）`);
    if (v.fareBest) facts.push(`🎫 <b>${nf(v.fareBest)}ウォン</b>`);
    facts.push(`🕐 1日 <b>${v.trains}本</b>`);
    if (r.places.length) facts.push(`📍 見どころ <b>${nf(r.places.length)}件</b>`);
    const why = [];
    // 🏮 오일장 — ⚠️ 처음엔 반경 안의 «끝자리를 다 모아서» 썼더니 「末尾が 0・1・2…9 の日」가 됐다.
    //    8곳이면 끝자리가 전부 덮여서 «아무 말도 안 하는 문장»이 된다(진영·경주에서 그렇게 나왔다).
    //    → 제일 가까운 한 곳을 이름으로 말한다. 그게 여행자가 실제로 갈 시장이다.
    if (r.mkts.length) {
      const m0 = r.mkts[0];
      // ⚠️ days 는 「3·8일」처럼 한국어다. 「일」만 「日」로 바꾼다(실물 375px 에서 보고 잡았다).
      //    시장 «이름»은 한글 그대로 둔다 — 지도 앱에 넣어 찾아야 하는 글자라 번역하면 못 찾는다.
      const d0 = String(m0.days || '').replace(/일/g, '日');
      why.push(`いちばん近い五日市は<b>${esc(m0.name)}</b>（駅から約${m0._km}km・<b>${esc(d0)}</b>に開催）。`
        + (r.mkts.length > 1 ? `ほかに${r.mkts.length - 1}ヶ所あります。` : ''));
    }
    if (v.byOrigin && Object.keys(v.byOrigin).length > 1) {
      const alt = Object.keys(v.byOrigin).filter(o => o !== v.from).sort((a, b) => v.byOrigin[a] - v.byOrigin[b])[0];
      if (alt) why.push(`${esc(ORIG_JA[alt] || alt + '駅')}からだと${v.byOrigin[alt]}分です。`);
    }
    // 🚌 착지 이동 — 이 한 줄이 「기차는 알겠는데 그 다음은?」에 답한다
    const tour = tourOf(r);
    if (tour.length) {
      const fee = feeOf(tour);
      const board = (tour[0].board || [])[0] || '';
      why.push(`🚌 <b>市内観光バス</b>があります${fee ? `（<b>${nf(fee)}ウォン〜</b>`: '（'}`
        + `${board ? `・乗り場「<span class="dtk">${esc(board)}</span>」` : ''}）。`
        + (tour.length > 1 ? `コースは${tour.length}種類。` : ''));
    }
    return `<div class="dtcard ${cls}">
<div class="dthead"><span class="nm">${esc(nmJa)}</span><span class="ko dtk">${esc(r.nm)}</span>
<span class="rg">${esc(SIDO_JA[r.sido] || r.sido)}</span></div>
<div class="dtfact">${facts.join('')}</div>
${why.length ? `<p class="dtwhy">${why.join(' ')}</p>` : ''}
<div class="dtlinks">
${link ? `<a href="${link}">📍 ${cityLabel(r)}</a>` : ''}
<a href="/ja/jangteo/">🏮 五日市</a><a href="/ja/busy/">📅 その日は開いてる？</a></div>
</div>`;
  }

  // 한눈에 보는 표 — 카드가 길어지므로 위에 요약을 둔다
  const tbl = list.map(r => {
    const v = r.v;
    return `<tr><td><b>${esc(han(v.han || r.nm))}</b> <span class="dtk" style="font-size:.85em;color:#9aa3af">${esc(r.nm)}</span>
<br><span style="font-size:.82em;color:#9aa3af">${esc(SIDO_JA[r.sido] || r.sido)}</span></td>
<td class="n">${v.min}分</td><td>${esc((ORIG_JA[v.from] || v.from).replace('駅', ''))}</td>
<td class="n">${v.fareBest ? nf(v.fareBest) : '—'}</td><td class="n">${v.trains}</td>
<td class="n">${r.places.length ? nf(r.places.length) : '—'}</td></tr>`;
  }).join('');

  // 🚌 시티투어 표 — daytrip 에 실린 도시 중 시티투어가 확인된 곳만
  const tourList = list.map(r => ({ r, t: tourOf(r) })).filter(o => o.t.length);
  const tourCities = tourList.length;
  const tourRows = tourList.map(({ r, t }) => {
    const fee = feeOf(t);
    const board = (t[0].board || [])[0] || '';
    const open = t[0].open || '', close = t[0].close || '';
    return `<tr><td><b>${esc(han(r.v.han || r.nm))}</b> <span class="dtk" style="font-size:.85em;color:#9aa3af">${esc(r.nm)}</span></td>
<td class="n">${fee ? nf(fee) + '〜' : '—'}</td><td class="dtk" style="font-size:.9em">${esc(board)}</td>
<td class="n">${open && close ? esc(open) + '–' + esc(close) : '—'}</td><td class="n">${t.length}</td></tr>`;
  }).join('');

  const fastest = cards[0] || list[0], farthest = cards[cards.length - 1] || list[list.length - 1];
  const withMkt = list.filter(r => r.mkts.length).length;
  const totPlaces = list.reduce((a, r) => a + r.places.length, 0);

  const content = `<main><div class="wrap">${CSS}
<p style="font-size:.85rem;color:#9aa3af;margin:8px 0"><a href="/ja/" style="color:#0c7d72">ホーム</a> › 日帰りで行ける街</p>
<h1 style="font-size:1.46rem;font-weight:900;letter-spacing:-.02em;margin:6px 0 6px">ソウルから日帰り・1泊2日で行ける街 — 何分・いくらかを駅ごとに</h1>
<p style="color:#6b7280;font-size:.94rem;line-height:1.8;margin:0 0 4px">ソウルに何度か来ると「今回は地方も」となりますが、そこで止まります。<b>何時間かかるのか、いくらなのか、着いて何があるのか</b>が一度に分からないからです。韓国鉄道公社が公式に配布している時刻表と運賃表から、<b>${list.length}の街</b>について所要時間・運賃・1日の本数を出し、そこに私たちが持っている見どころ${nf(totPlaces)}件と五日市の開催日を重ねました。</p>

<div class="dtc"><h2>⭐ この表の見方 — 「どの駅から乗るか」で答えが変わります</h2>
<p>ソウルの鉄道の出口は一つではありません。<b>${esc(ORIG_JA['서울'])}・${esc(ORIG_JA['용산'])}・${esc(ORIG_JA['청량리'])}・${esc(ORIG_JA['수서'])}</b>から別々の路線が出ていて、行き先によって<b>いちばん速い駅が違います</b>。江陵は清凉里、全州は龍山、釜山は水西が最速です。宿が明洞・南大門ならソウル駅や龍山駅、江南なら水西駅が近い — だから下の表には<b>出発駅を必ず書いてあります</b>。</p>
<p class="dtnote">所要時間は「その区間でいちばん速い列車」の時間です。列車によってはもっとかかります。運賃は<b>一般室（普通車）</b>の片道で、特室はこれより高くなります。出典：韓国鉄道公社「KTX時刻表」「KTX運賃表」（${esc(TT.srcDate || '')}時点）。</p></div>

<div class="dtc"><h2>🚄 一覧 — 近い順</h2>
<p class="dtsw">↔ 表は横にスクロールできます</p>
<div class="dtwrap"><table class="dtt"><thead><tr><th>街（駅）</th><th class="n">所要</th><th>出発駅</th><th class="n">運賃(ウォン)</th><th class="n">本/日</th><th class="n">見どころ</th></tr></thead><tbody>${tbl}</tbody></table></div>
<p class="dtnote">「見どころ」は駅から半径${RP}kmにある、日本語の情報が用意できている場所の数です（全国${nf(PJ.length)}件から数えました）。ゼロではなく「—」の街は、まだ日本語の情報が足りていないという意味です。</p></div>

${dayTrip.length ? `<div class="dtc"><h2>☀️ 片道${DAY}分以内 — 日帰りできる街</h2>
<p>朝に出て夕方に戻れる範囲です。<b>${esc(han(fastest.v.han || fastest.nm))}</b>がいちばん近く${fastest.v.min}分。市場が立つ日を狙うと、同じ街でも見えるものが変わります。</p>
<div class="dtgrid">${dayTrip.map(r => card(r, 'd1')).join('')}</div></div>` : ''}

${overnight.length ? `<div class="dtc"><h2>🌙 片道${DAY}分超 — 1泊2日が向く街</h2>
<p>日帰りもできますが、滞在時間より移動時間が長くなります。${esc(han(farthest.v.han || farthest.nm))}まで${farthest.v.min}分。</p>
<div class="dtgrid">${overnight.map(r => card(r, '')).join('')}</div></div>` : ''}

${tourRows ? `<div class="dtc"><h2>🚌 着いてから、どう回るか — 市内観光バス</h2>
<p>地方でいちばん困るのが<b>駅から先</b>です。レンタカーを借りない旅行者にとって、バス路線が分からない街で一日を組むのは簡単ではありません。韓国の多くの自治体は<b>市内観光バス（시티투어버스）</b>を走らせていて、主要な見どころを一周します。<b>${tourCities}の街</b>で確認できました。</p>
<p>ありがたいことに、<b>乗り場はたいてい駅前です</b> — 列車を降りてそのまま乗れます。料金も<b>2,000〜10,000ウォン</b>程度で、タクシーを1回使うより安く一日回れます。</p>
<p class="dtsw">↔ 表は横にスクロールできます</p>
<div class="dtwrap"><table class="dtt"><thead><tr><th>街</th><th class="n">料金</th><th>乗り場</th><th class="n">運行</th><th class="n">コース</th></tr></thead><tbody>${tourRows}</tbody></table></div>
<p class="dtnote">乗り場は<b>ハングルのまま</b>です — 地図アプリに貼って探すための文字なので訳していません。料金は確認できた中でいちばん安い区分（多くは大人料金）です。<b>運行日は街ごとに違い、週末だけ走る路線もあります</b> — 行く前に各市の公式サイトで必ず確認してください。出典：行政安全部「全国シティツアー標準データ」。</p></div>

<div class="dtc"><h2>🏮 五日市 — 「その日に立つ」かどうかで決まります</h2>
<p>韓国の地方には<b>5日ごとに立つ市場</b>があります。日付の<b>末尾の数字</b>で決まっていて、たとえば「2・7日」の市場は2日・7日・12日・17日…に立ちます。常設ではないので、<b>行った日に立っていなければ何もありません</b>。上の${list.length}の街のうち<b>${withMkt}の街</b>に、駅から${RM}km以内の五日市があります。</p>
<p>日本の朝市と同じ発想ですが、開催日が固定の曜日ではなく<b>日付</b>である点が違います。市場の名前は<b>ハングルのまま</b>載せています — 訳してしまうと地図アプリで探せなくなるからです。そのままコピーしてNAVER地図やカカオマップに貼ってください。旅程が決まったら、その日の末尾の数字を見てください。<a href="/ja/jangteo/" style="color:#0c7d72;font-weight:700">五日市のページ</a>に全国${nf(MK.length)}ヶ所の開催日を出しています。</p></div>

<div class="dtc"><h2>⚠️ 出かける前に — 「行けるか」より「開いているか」</h2>
<p>地方は<b>ソウルより休みの影響が大きい</b>です。個人商店の比率が高く、名節（ソルラル・チュソク）には街ごと静かになります。曜日の定休日も効きます — 韓国の個人店は休む日を曜日で決めているので、<b>月曜に行くと閉まっている店が最も多い</b>です。</p>
<p>日韓の祝日が重なる期間、名節の日付、曜日ごとに何店が定休日なのかは<a href="/ja/busy/" style="color:#0c7d72;font-weight:700">韓国が混む日</a>にまとめました。切符を取る前にその1枚を見てください。</p>
<ol class="dtol">
<li><b>行く日が名節に当たっていないか</b> — 当たっているなら地方は特に厳しいです。</li>
<li><b>その日に五日市が立つか</b> — 末尾の数字で決まります。立たない日は普通の街です。</li>
<li><b>帰りの列車</b> — 本数が少ない路線があります。上の表の「本/日」を見て、最終の時刻を先に調べてください。</li>
<li><b>切符</b> — 日本からでも韓国鉄道公社の公式サイト・アプリで予約できます。連休は埋まります。</li>
</ol></div>

<div class="dtnav">
<a href="/ja/busy/">📅 韓国が混む日</a>
<a href="/ja/closed/">🚪 休む日 — 店は開いているか</a>
<a href="/ja/places/">📍 行ける場所を探す</a>
<a href="/ja/jangteo/">🏮 五日市</a>
<a href="/ja/calendar/">🗓️ いつ行くか</a>
</div>
</div></main>`;

  writePage('ja/daytrip', layout(
    `ソウルから日帰りで行ける街 ${list.length}選 — 何分・いくら・何があるか | チュクチェモア`,
    `韓国鉄道公社の公式時刻表・運賃表から、ソウルから${list.length}の街への所要時間・運賃・1日の本数を出発駅ごとに出しました。見どころ${nf(totPlaces)}件と五日市の開催日つき。`,
    '/ja/daytrip/', content, { lang: 'ja' }));

  console.log(`✓ /ja/daytrip/ — ${list.length}개 도시 (日帰り ${dayTrip.length} · 1박2일 ${overnight.length} · 오일장 있는 곳 ${withMkt})`);
  return ['/ja/daytrip/'];
}

module.exports = { build };
