// 클룩(Klook) 제휴 — 영어 페이지 전용. 2026-09-30 신설.
//
// 근거(2026-09-30 실측): /en/ 에서 180일간 사람이 누른 바깥 링크 13건 중 9건이 «지도(가는 길)»였다.
//   영어 방문자의 실제 막힘 = 축제장까지 가는 것. 구글맵은 한국에서 도보·대중교통 길찾기가 안 되고
//   네이버·카카오맵은 된다 — 그 앱을 밖에서 쓰려면 모바일 데이터가 필요하다. → eSIM 을 «그 사실 바로 뒤»에.
// 방침: 상품을 앞으로 빼지 않는다(klook.js 와 같다). 진행/예정 축제에만 붙인다(끝난 축제엔 안 붙인다).
// ⚖️ 영어권(미국 FTC): 링크 가까이, 명확하게 — 「affiliate link」만으로는 불충분. 「Paid link」 + 수수료 문장.
// 📏 track.js 가 affiliate.klook.com → shop_click merchant='klook'. data-place='en-festival'.
// 광고 ID 는 영어 전용(아래 AD_EN). 클룩 대시보드에서 영어/일본어 실적이 따로 잡힌다.
const { url, AD } = require('./klook.js');
// 2026-09-30 대시보드에서 영어용 광고 ID 발급(라벨1=en-festival). eSIM=1466582 · KTX=1466585(KTX는 아직 미사용)
const AD_EN = { esim: '1466582', ktx: '1466585' };
void AD;
const ESIM = 'https://www.klook.com/en-US/search/result/?query=' + encodeURIComponent('Korea eSIM');

const PAID = '<span style="display:inline-block;font-size:.72rem;font-weight:700;color:#8a8178;border:1px solid #cfc6b8;border-radius:4px;padding:0 5px;margin-right:6px;vertical-align:1px">Paid link</span>';
const NOTE = '<span style="display:block;font-size:.78rem;color:#8a8178;margin-top:4px">We earn a commission if you book through this link. Your price is the same.</span>';

// 지도 상자 안, 한글 복사 칸 바로 뒤. 본문 길이 게이트에서는 빼고 잰다(festival-en.js).
function esimAfterMap(place) {
  return `<p class="aff-en" style="background:#faf7f1;border:1px solid #eee5d6;border-radius:10px;padding:10px 12px;margin:12px 0 0;font-size:.92rem;line-height:1.6">${PAID}Both apps need mobile data while you are out and about. A Korea eSIM can be bought before you fly → `
    + `<a href="${url(ESIM, AD_EN.esim)}" target="_blank" rel="sponsored noopener" data-bb="klook-esim" data-slot="inline-context" data-place="${place || 'en-festival'}" style="color:#0c7d72;font-weight:700">Compare Korea eSIMs on Klook</a>${NOTE}</p>`;
}

module.exports = { esimAfterMap, AD_EN };
