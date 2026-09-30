// 클룩(Klook) 제휴 링크 — 2026-09-24 신설. 일본어 페이지 전용.
//
// ⭐ 방침(장남님, 2026-09-04): 상품을 인위적으로 앞에 빼지 않는다.
//    → 「상품이 필요한 상황」을 본문이 사실로 먼저 말한 «바로 뒤»에만 둔다.
//      고궁: 「韓服を着ていれば無料」 뒤 → 韓服レンタル
//      당일치기: 도시 카드의 운임 뒤 → 그 구간 KTX 切符
//      연휴 상세: 「電話かSNSで確認してください」 뒤 → eSIM
// ⚖️ 일본 스테마 규제(2023-10 경품표시법 고시): 광고임을 알 수 있게 「PR」 표기 + 이해관계 고지.
// 📏 측정: track.js 가 affiliate.klook.com 을 merchant='klook' 으로 센다(data-bb·data-slot·data-place).
//
// 링크 형식(대시보드 「텍스트 링크」로 만든 것과 같다 — 2026-09-24 curl 로 302 확인):
//   https://affiliate.klook.com/redirect?aid=136460&aff_adid=<광고ID>&k_site=<클룩 주소>
//   ⚠️ aff_sid 는 전달되지 않는다(실측). 도시별 구분은 GA4 data-bb 로 한다.
const AID = '136460';
// 대시보드에서 만든 광고 ID (라벨1=면, 라벨2=상품)
const AD = {
  hanbok: '1447552',   // ja-palace / hanbok
  esim: '1447554',     // ja-closed / esim
  ktx: '1447555',      // ja-daytrip / ktx (대전으로 만들었지만 KTX 공용으로 쓴다)
  ktxGangneung: '1447556',
};

// 당일치기 도시(역 한국어 이름) → 클룩 「서울〜○○ KTX 승차권」 상품. 없는 도시는 링크를 안 단다.
const KTX = {
  '대전': 'https://www.klook.com/ja/activity/202179-korea-train-ticket/',
  '강릉': 'https://www.klook.com/ja/activity/127057-seoul-gangneung-ktx-train-ticket/',
  '전주': 'https://www.klook.com/ja/activity/114499-seoul-jeonju-ktx-exclusive-combos/',
  '동대구': 'https://www.klook.com/ja/activity/112337-seoul-daegu-ktx-exclusive-combos/',
  '경주': 'https://www.klook.com/ja/activity/118700-seoul-gyeongju-ktx-exclusive-combos/',
  '부산': 'https://www.klook.com/ja/activity/47751-ktx-one-way-ticket-busan/',
  '여수엑스포': 'https://www.klook.com/ja/activity/113889-seoul-yeosu-ktx-exclusive-combos/',
};
const KTX_SLUG = { '대전': 'daejeon', '강릉': 'gangneung', '전주': 'jeonju', '동대구': 'daegu',
  '경주': 'gyeongju', '부산': 'busan', '여수엑스포': 'yeosu' };

const TARGET = {
  hanbok: 'https://www.klook.com/ja/search/result/?query=' + encodeURIComponent('韓服 景福宮'),
  esim: 'https://www.klook.com/ja/search/result/?query=' + encodeURIComponent('韓国 eSIM'),
};

const url = (target, adid) =>
  `https://affiliate.klook.com/redirect?aid=${AID}&aff_adid=${adid}&k_site=${encodeURIComponent(target)}`;

const PR = '<span style="display:inline-block;font-size:.72rem;font-weight:700;color:#8a8178;border:1px solid #cfc6b8;border-radius:4px;padding:0 5px;margin-right:6px;vertical-align:1px">PR</span>';
const NOTE = '<span style="display:block;font-size:.78rem;color:#8a8178;margin-top:4px">このリンクから予約があると、当サイトに紹介料が入ります。お支払い額は変わりません。</span>';

function a(href, label, item, place, slot) {
  return `<a href="${href}" target="_blank" rel="sponsored noopener" data-bb="klook-${item}" data-slot="${slot}" data-place="${place}" style="color:#0c7d72;font-weight:700">${label}</a>`;
}
const box = inner => `<p style="background:#faf7f1;border:1px solid #eee5d6;border-radius:10px;padding:10px 12px;margin:10px 0;font-size:.92rem;line-height:1.6">${inner}${NOTE}</p>`;

// 고궁 — 韓服無料 설명 바로 뒤
function hanbok() {
  return box(`${PR}景福宮・北村まわりの韓服レンタルは、Klookで日本語のまま料金と口コミを比べて予約できます → `
    + a(url(TARGET.hanbok, AD.hanbok), '韓服レンタルを見る（Klook）', 'hanbok', 'ja-palace', 'inline-context'));
}

// 연휴 상세 — 「電話かSNSで確認」 뒤
function esim(place) {
  return box(`${PR}現地で店に電話したりSNSを見たりするには、スマホの通信が要ります。韓国用のeSIM・SIMは出発前に買っておけます → `
    + a(url(TARGET.esim, AD.esim), '韓国のeSIMを見る（Klook）', 'esim', place || 'ja-closed', 'inline-context'));
}

// 당일치기 — 도시 카드 안. 상품이 없는 도시는 빈 문자열.
function ktx(stationKo, cityJa) {
  const t = KTX[stationKo];
  if (!t) return '';
  const ad = stationKo === '강릉' ? AD.ktxGangneung : AD.ktx;
  return `<p class="dtaff" style="font-size:.85rem;margin:6px 0 0;color:#5a524b">${PR}ソウル〜${cityJa}のKTX切符はKlookでも日本語で予約できます → `
    + a(url(t, ad), 'KTX切符を見る', 'ktx-' + (KTX_SLUG[stationKo] || 'other'), 'ja-daytrip', 'city-card') + '</p>';
}
// 당일치기 — 섹션 끝에 한 번. 공식 판매처도 같이 밝힌다(우리만 파는 게 아니다).
const ktxNote = () => `<p style="font-size:.8rem;color:#8a8178;margin-top:8px">${PR}「KTX切符を見る」はKlookの紹介リンクで、予約があると当サイトに紹介料が入ります。切符は<a href="https://www.korail.com/global/eng/main" target="_blank" rel="noopener" style="color:#0c7d72">韓国鉄道（コレール）の外国人向け公式サイト</a>でも買えます。</p>`;

module.exports = { hanbok, esim, ktx, ktxNote, url, AD, AID };

// ─────────────────────────────────────────────────────────────
// 🇹🇼🇨🇳 2026-09-30 추가 — 중국어(번체 tw·간체 zh) 페이지. 기획서: 프로젝트 문서 claude/기획_2026-09-30_축제모아_중국어.md
//   대만·홍콩이 클룩의 본진(홍콩 창업)이라 번체가 주력이다. 광고 ID 는 면별로 따로 만들었다(성과를 따로 재려고).
//   자리 원칙은 일본어와 같다 — 상품이 필요한 사실을 본문이 먼저 말한 «바로 뒤»에만.
//     /tw/closed/·/zh/closed/ : 「NAVER·Kakao 지도로 한글 검색해 영업시간 확인」 뒤 → eSIM(그걸 하려면 데이터가 필요)
//     /tw/busy/               : 「연휴가 겹치면 항공권·호텔이 같이 찬다」 표 뒤 → 서울 숙소
//   ⚖️ 대만 공평교역위원회 「推薦式廣告」 규범: 광고임을 표시 + 대가 관계 고지 → 「廣告」 배지 + 고지문.
//   클룩 zh-TW·zh-CN 검색 주소는 2026-09-30 브라우저로 열어 결과가 나오는 것 확인(eSIM 15건/6건, 서울 숙소 999+).
AD.twEsim = '1466896';   // tw-closed / esim
AD.zhEsim = '1466898';   // zh-closed / esim
AD.twHotel = '1466900';  // tw-busy / hotel
const TARGET_ZH = {
  twEsim: 'https://www.klook.com/zh-TW/search/result/?query=' + encodeURIComponent('韓國 eSIM'),
  zhEsim: 'https://www.klook.com/zh-CN/search/result/?query=' + encodeURIComponent('韩国 eSIM'),
  twHotel: 'https://www.klook.com/zh-TW/search/result/?query=' + encodeURIComponent('首爾 飯店'),
};
const ZH_TXT = {
  tw: { badge: '廣告', note: '透過這個連結預訂，本站會收到介紹費；你支付的金額不會改變。',
    esim: '在韓國要用 NAVER 地圖查營業時間、打電話或看店家 IG，手機都得有網路。韓國用的 eSIM 可以出發前先買好 → ',
    esimA: '看韓國 eSIM（Klook）',
    hotel: '連假重疊的期間飯店會最先被訂走。如果日期已經落在上表裡，首爾的住宿可以先比價訂好 → ',
    hotelA: '看首爾飯店（Klook）' },
  zh: { badge: '广告', note: '通过此链接预订，本站会获得介绍费；您支付的金额不变。',
    esim: '在韩国用 NAVER 地图查营业时间、打电话或看店家的 SNS，手机都需要流量。韩国用的 eSIM 可以出发前买好 → ',
    esimA: '查看韩国 eSIM（Klook）' },
};
const badgeZh = t => `<span style="display:inline-block;font-size:.72rem;font-weight:700;color:#8a8178;border:1px solid #cfc6b8;border-radius:4px;padding:0 5px;margin-right:6px;vertical-align:1px">${t}</span>`;
const boxZh = (inner, T) => `<p style="background:#faf7f1;border:1px solid #eee5d6;border-radius:10px;padding:10px 12px;margin:10px 0;font-size:.92rem;line-height:1.6">${inner}<span style="display:block;font-size:.78rem;color:#8a8178;margin-top:4px">${T.note}</span></p>`;
function esimZh(lang) {
  const T = ZH_TXT[lang]; if (!T) return '';
  const k = lang === 'tw' ? 'twEsim' : 'zhEsim';
  return boxZh(badgeZh(T.badge) + T.esim + a(url(TARGET_ZH[k], AD[k]), T.esimA, 'esim', lang + '-closed', 'inline-context'), T);
}
function hotelTw() {
  const T = ZH_TXT.tw;
  return boxZh(badgeZh(T.badge) + T.hotel + a(url(TARGET_ZH.twHotel, AD.twHotel), T.hotelA, 'hotel', 'tw-busy', 'inline-context'), T);
}
module.exports.esimZh = esimZh;
module.exports.hotelTw = hotelTw;
