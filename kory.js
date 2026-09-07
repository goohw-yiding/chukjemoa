// 🇰🇷 코리(kory) 연결 — 도시 페이지 «맨 아래»에 붙이는 한 블록. 2026-09-07 신설
//
// 왜 여기인가 — 지켜야 할 방침이 둘 있고, 이 자리가 둘 다 지킨다
//   ① 「상품을 인위적으로 앞에 빼지 않는다 — 그러면 사이트를 외면한다」(장남 님)
//   ② 「공유를 노리는 페이지에 상품을 얹으면 아무도 공유하지 않는다」(2026-08-19 결정)
//   ⭐ **도시 페이지에 도시 굿즈는 «주제가 같다».** 「축제 페이지에 캠핑의자」는 억지지만
//      「서울 페이지에 SEOUL 이라고 적힌 물건」은 같은 이야기의 끝이다. 그래서 맨 아래, 도시 이야기가 끝난 뒤.
//
// 실물 확인(2026-09-07) — kory.kr 을 직접 열어 URL 을 다 확인했다
//   ✅ EN/KR 전환 있음 `?lang=en`  ✅ 도시별 URL `collections.html#seoul|#busan|#jeju|#korea`
//   ✅ 도시별 상품 `product-hairroll.html?c=seoul`  ✅ 판매처 `stockists.html`
//   ⚠️ `?lang=en` 을 붙여도 **서버 HTML 은 한국어**다(JS 전환). 사람에겐 영어로 보이지만 구글은 한국어로 색인한다.
//
// 🔴 2026-09-07 저녁 — 코리 쪽에서 온 소식으로 **외국어 링크를 좁혔다**
//   ✅ 고쳐진 것: 영어 방문자에게 그랜드오픈 팝업이 더는 안 뜬다. `/en` 리다이렉트(307)도 생겼다.
//   🔴 **그런데 더 큰 것이 있었다 — 영어가 있는 페이지는 «홈과 상품 7장»뿐이다.**
//      `data-i18n` 이 붙은 건 `index.html` 하나이고, 상품은 `product-i18n.js` 로 커버된다.
//      **나머지 23장(About·FAQ·Journal 9편·Collections·Stockists·Wholesale·약관)은 영어가 아예 없다.**
//   ⚠️ 그래서 우리가 처음 깔았던 외국어 링크 4개 중 **3개(collections·products·stockists)가 한글 벽**이었다.
//      → 외국어에서는 «홈 + 상품 페이지»만 건다. 한국어는 전부 한국어라 그대로 둔다.
//   ⭐ 아쉬운 건 **판매처(stockists)** 다 — 여행자에게 제일 쓸모 있는데 영어가 없어 뺐다.
//      코리 번역 우선순위에서 **Stockists 를 맨 앞으로** 올려 달라고 전할 것.
//   ⛔ `?lang=` 파라미터를 직접 붙인다. `/en/...` 도 되지만 리다이렉트를 한 번 더 탄다.
//
// ⚠️ 코리는 **자사 브랜드**다 — 제휴 링크가 아니다. 그래서 파트너스 표기가 아니라 «함께 만든다»고 밝힌다.
'use strict';

const BASE = 'https://www.kory.kr/';
// 도시 에디션이 «실제로 있는» 도시. 나머지 도시에는 KOREA 컬렉션만 건다.
// ⚠️ 없는 도시 상품을 있는 것처럼 쓰지 않는다 — 페이지에 「아직 없다」고 그대로 적는다.
const CITY_EDITION = { seoul: 'seoul', busan: 'busan', jeju: 'jeju' };

// UTM — ⚠️ 이게 없으면 «코리가 데려온 것»과 «자연 유입»을 영영 구분 못 한다.
//    (코리 패키지 QR 의 UTM 미부착이 이미 미결 상태다 — 같은 실수를 반복하지 않는다.)
function url(page, { city, lang, hash, c }) {
  const q = [
    'utm_source=chukjemoa', 'utm_medium=city',
    'utm_campaign=' + encodeURIComponent(city || 'korea'),
    'utm_content=' + encodeURIComponent(lang || 'ko')
  ];
  if (c) q.unshift('c=' + encodeURIComponent(c));
  if (lang && lang !== 'ko') q.push('lang=en');   // 코리는 en/ko 둘뿐 — ja·zh·tw·es 도 en 으로 보낸다
  return BASE + page + '?' + q.join('&') + (hash ? '#' + hash : '');
}

const T = {
  ko: {
    hasCity: (ko) => `🇰🇷 ${ko}를 가져가는 방법`,
    noCity: '🇰🇷 여행을 가져가는 방법',
    intro: '도시 이름이 들어간 작은 여행 기념품을 만드는 곳이 있습니다 — <b>코리(kory)</b>. 헤어롤·헤어끈·집게핀·스카프처럼 매일 쓰는 물건에 도시 이름을 넣습니다.',
    none: (ko) => `⚠️ <b>${ko} 이름이 들어간 상품은 아직 없습니다.</b> 지금 도시 에디션은 서울·부산·제주 세 곳이고, 그 밖에는 <b>KOREA</b> 컬렉션이 있습니다 — 어느 도시 여행에도 맞습니다.`,
    coll: (ko) => `${ko} 컬렉션`, roller: (ko) => `${ko} 헤어롤`,
    korea: 'KOREA 컬렉션', all: '상품 전체', where: '어디서 파나',
    note: '코리는 저희가 함께 만드는 브랜드입니다. 광고료를 받고 싣는 자리가 아니라는 뜻이고, 반대로 <b>저희 이해관계가 걸린 링크</b>라는 뜻이기도 합니다 — 그래서 이 자리에만 둡니다.'
  },
  en: {
    hasCity: (ko) => `Taking ${ko} home`,
    noCity: 'Taking the trip home',
    intro: 'A small Korean brand called <b>kory</b> puts city names on everyday things — hair rollers, hair ties, claw clips, scarves.',
    none: (ko) => `⚠️ <b>There is no ${ko} edition yet.</b> The city editions are Seoul, Busan and Jeju. The <b>KOREA</b> collection works for any trip.`,
    coll: (ko) => `${ko} collection`, roller: (ko) => `${ko} hair roller`,
    korea: 'KOREA collection', all: 'All products', where: '📍 Where to buy',
    slide: 'EVA slide', scarf: 'Scarf', home: 'kory home',
    note: 'We help make kory, so this is not a paid placement — but it is a link we have an interest in. That is why it sits here at the bottom and nowhere else. <b>Product pages and the shop home are in English; a few other pages there are still Korean only.</b>'
  },
  ja: {
    hasCity: (ko) => `${ko}を持ち帰る`,
    noCity: '旅を持ち帰る',
    intro: '都市の名前を日用品に入れる韓国の小さなブランド <b>kory</b> があります — ヘアロール、ヘアゴム、バンスクリップ、スカーフなど。',
    none: (ko) => `⚠️ <b>${ko}の商品はまだありません。</b> 都市エディションはソウル・釜山・済州の3つで、ほかは <b>KOREA</b> コレクションがあります。`,
    coll: (ko) => `${ko}コレクション`, roller: (ko) => `${ko}ヘアロール`,
    korea: 'KOREA コレクション', all: '商品一覧', where: '📍 取扱店',
    slide: 'サンダル', scarf: 'スカーフ', home: 'kory ホーム',
    note: 'kory は私たちが一緒に作っているブランドです。広告費をもらって載せているのではありませんが、<b>利害関係のあるリンク</b>でもあります。だからページの一番下だけに置いています。<b>商品ページとショップのホームは英語表示ですが、一部のページはまだ韓国語のみです。</b>'
  },
  zh: {
    hasCity: (ko) => `把${ko}带回家`,
    noCity: '把这趟旅行带回家',
    intro: '有一个韩国小品牌 <b>kory</b>，把城市名字放进日常用品里 —— 卷发筒、发圈、抓夹、丝巾。',
    none: (ko) => `⚠️ <b>还没有${ko}款。</b> 城市系列目前是首尔·釜山·济州三个，其余有 <b>KOREA</b> 系列，适合任何一趟旅行。`,
    coll: (ko) => `${ko}系列`, roller: (ko) => `${ko}卷发筒`,
    korea: 'KOREA 系列', all: '全部商品', where: '📍 哪里买得到',
    slide: '拖鞋', scarf: '丝巾', home: 'kory 首页',
    note: 'kory 是我们参与制作的品牌。不是收广告费刊登的，但也确实是<b>与我们有利害关系的链接</b>，所以只放在页面最下方。<b>商品页和商店首页有英文，其余部分页面目前只有韩文。</b>'
  },
  tw: {
    hasCity: (ko) => `把${ko}帶回家`,
    noCity: '把這趟旅行帶回家',
    intro: '有一個韓國小品牌 <b>kory</b>，把城市名字放進日常用品裡 —— 髮捲、髮圈、抓夾、絲巾。',
    none: (ko) => `⚠️ <b>還沒有${ko}款。</b> 城市系列目前是首爾·釜山·濟州三個，其餘有 <b>KOREA</b> 系列，適合任何一趟旅行。`,
    coll: (ko) => `${ko}系列`, roller: (ko) => `${ko}髮捲`,
    korea: 'KOREA 系列', all: '全部商品', where: '📍 哪裡買得到',
    slide: '拖鞋', scarf: '絲巾', home: 'kory 首頁',
    note: 'kory 是我們參與製作的品牌。不是收廣告費刊登的，但也確實是<b>與我們有利害關係的連結</b>，所以只放在頁面最下方。<b>商品頁與商店首頁有英文，其餘部分頁面目前只有韓文。</b>'
  },
  es: {
    hasCity: (ko) => `Llevarse ${ko} a casa`,
    noCity: 'Llevarse el viaje a casa',
    intro: 'Hay una pequeña marca coreana, <b>kory</b>, que pone nombres de ciudades en objetos de uso diario: rulos, gomas de pelo, pinzas, pañuelos.',
    none: (ko) => `⚠️ <b>Todavía no hay edición de ${ko}.</b> Las ediciones de ciudad son Seúl, Busan y Jeju. La colección <b>KOREA</b> sirve para cualquier viaje.`,
    coll: (ko) => `Colección ${ko}`, roller: (ko) => `Rulo ${ko}`,
    korea: 'Colección KOREA', all: 'Todos los productos', where: '📍 Dónde comprar',
    slide: 'Sandalias EVA', scarf: 'Pañuelo', home: 'Inicio de kory',
    note: 'Ayudamos a fabricar kory, así que no es un espacio pagado — pero sí es un enlace en el que tenemos interés. Por eso está solo aquí, al final. <b>Las páginas de producto y la portada de la tienda están en inglés; algunas otras páginas siguen solo en coreano.</b>'
  }
};

const CSS = `<style>
.ky-box{background:#fafaf9;border:1.5px solid #e7e5e4;border-radius:16px;padding:18px 20px;margin:26px 0 8px}
.ky-box h2{font-size:1.06rem;font-weight:900;margin:0 0 8px;color:#1c1917;letter-spacing:-.01em}
.ky-box p{color:#44403c;font-size:.94rem;line-height:1.75;margin:0 0 10px}
.ky-none{background:#fff;border:1.5px solid #e7e5e4;border-radius:10px;padding:9px 12px;font-size:.9rem;color:#57534e;line-height:1.7;margin:0 0 12px}
.ky-links{display:flex;flex-wrap:wrap;gap:8px}
.ky-links a{display:inline-block;padding:9px 15px;border-radius:22px;font-weight:800;font-size:.9rem;text-decoration:none;background:#fff;border:1.5px solid #d6d3d1;color:#292524}
.ky-links a.ky-1{background:#1c1917;border-color:#1c1917;color:#fff}
.ky-note{color:#a8a29e;font-size:.8rem;line-height:1.65;margin:11px 0 0}
</style>`;

/**
 * 도시 페이지 하단 블록.
 * @param cityKey  'seoul' | 'gyeongju' | ... (도시 슬러그)
 * @param cityName 그 언어로 표기한 도시 이름(영어면 'Seoul', 일본어면 '慶州')
 * @param lang     'ko' | 'en' | 'ja' | 'zh' | 'tw' | 'es'
 *
 * ⚠️ 외국어에서는 «판매처»를 맨 앞에 둔다 — 여행자는 배송보다 「지금 여기서 살 수 있나」가 먼저다.
 * ⚠️ `data-bb`·`data-slot`·`data-place` 를 붙인다 — track.js 가 이 값으로 shop_click 을 분류한다.
 */
function block(cityKey, cityName, lang) {
  const t = T[lang] || T.ko;
  const ed = CITY_EDITION[cityKey];          // 이 도시 에디션이 실제로 있나
  const a = (href, label, cls, item) =>
    `<a href="${href}" target="_blank" rel="noopener"${cls ? ` class="${cls}"` : ''}` +
    ` data-bb="kory-${item}" data-slot="city-footer" data-place="${cityKey}">${label}</a>`;

  const c = ed || 'korea';
  const links = [];
  if (lang === 'ko') {
    // 한국어 — 코리 사이트가 전부 한국어라 어디로 보내도 된다.
    links.push(a(url('collections.html', { city: cityKey, lang, hash: c }), ed ? t.coll(cityName) : t.korea, 'ky-1', 'coll-' + c));
    links.push(a(url('product-hairroll.html', { city: cityKey, lang, c }), t.roller(ed ? cityName : 'KOREA'), '', 'roller-' + c));
    links.push(a(url('products.html', { city: cityKey, lang }), t.all, '', 'products'));
    links.push(a(url('stockists.html', { city: cityKey, lang }), t.where, '', 'stockists'));
  } else {
    // ⚠️ 외국어 — **영어가 있는 페이지만** 건다(홈 + 상품 7장). 나머지 23장은 아직 한국어뿐이다.
    //    상품 페이지 하단에 「From the same collection」으로 다른 상품이 이미 붙어 있어,
    //    상품 한 장만 걸어도 탐색이 이어진다. 목록 페이지로 보낼 필요가 없다.
    links.push(a(url('product-hairroll.html', { city: cityKey, lang, c }), t.roller(ed ? cityName : 'KOREA'), 'ky-1', 'roller-' + c));
    links.push(a(url('product-slipper.html', { city: cityKey, lang }), t.slide, '', 'slipper'));
    links.push(a(url('product-scarf.html', { city: cityKey, lang }), t.scarf, '', 'scarf'));
    links.push(a(url('', { city: cityKey, lang }), t.home, '', 'home'));
  }

  return `${CSS}<div class="ky-box">
<h2>${ed ? t.hasCity(cityName) : t.noCity}</h2>
<p>${t.intro}</p>
${ed ? '' : `<div class="ky-none">${t.none(cityName)}</div>`}
<div class="ky-links">${links.join('')}</div>
<p class="ky-note">${t.note}</p>
</div>`;
}

module.exports = { block, CITY_EDITION };
