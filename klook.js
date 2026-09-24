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
