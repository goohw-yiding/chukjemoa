// 🌏 외국어 도시 페이지 — /{lang}/{city}/  (서울·부산·제주 × en·ja·zh·tw·es)
//
// 왜 이 구성인가 — 실측이 「축제 목록」을 부정했다 (2026-09-04)
//   장남 님: 「서울·부산·제주는 외국어 페이지도 좀 더 심도있게」. 그래서 재료를 먼저 셌더니 —
//   ⚠️ **외국어 «축제»는 진행·예정 기준 서울 en 6·ja 4 · 부산 3 · 제주 1건뿐**이다. 축제로는 페이지가 안 선다.
//   ⭐ 본체는 `places_{lang}` 이다 — **공식 번역 개요 + 한글 원제 + 한글 도로명주소**를 가진 곳들.
//     서울 en 199/ja 264 · 부산 85/89 · 제주 111/111. 제주는 축제가 없어도 이걸로 만들 수 있다.
//
// ⭐ 그리고 이 페이지가 «남이 못 쓰는 것»인 이유:
//   **구글맵은 한국 안에서 길찾기가 안 된다**(지도데이터 반출 규제). 그래서 외국인은 이름을 복사해
//   네이버·카카오 지도에 붙여넣어야 하는데, 그 «붙여넣을 한글»을 주는 곳이 거의 없다. 우리는 준다.
//
// ⚠️ **재료 게이트** — 장소 20곳 미만이고 축제도 15건 미만이면 **만들지 않는다.**
//    5개어를 다 켜 두되(장남 님 결정), 재료가 찬 조합만 나간다. 얇은 페이지는 애드센스 심사에 해롭다.
//    → 중문·서어는 `fetch-places.js zh|tw|es` 로 개요가 쌓이면 «저절로» 열린다.
const fs = require('fs'), path = require('path');

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CITIES = [
  { key: 'seoul', sido: '서울', ko: '서울', match: ['서울', 'Seoul', 'ソウル', '首尔', '首爾', 'Seúl'] },
  { key: 'busan', sido: '부산', ko: '부산', match: ['부산', 'Busan', '釜山'] },
  { key: 'jeju', sido: '제주', ko: '제주', match: ['제주', 'Jeju', '済州', '济州', '濟州'] }
];

const T = {
  en: {
    city: { seoul: 'Seoul', busan: 'Busan', jeju: 'Jeju' },
    h1: c => `${c} — Festivals & Places Worth Going`,
    lead: (c, n, f) => `${n} places in ${c} described in English by the Korea Tourism Organization${f ? `, plus ${f} festivals happening now` : ''}. Every entry comes with the <b>Korean address you can paste into a map app</b>.`,
    whyT: 'Why we give you Korean addresses',
    why: 'Google Maps cannot give driving or transit directions inside South Korea — map data cannot be exported. Paste the Korean address (or the Korean name) into <b>NAVER Map</b> or <b>KakaoMap</b> instead. Both work with what is on this page, and they are what people here actually use.',
    fesT: 'Festivals on now',
    placeT: c => `Places to go in ${c}`,
    addr: 'Korean address for map apps', name: 'Korean name for map search',
    copy: 'Copy', copied: 'Copied',
    when: 'Dates', where: 'Where', fee: 'Admission', how: 'Getting there', free: 'Free',
    more: 'More', other: 'Other cities', srcT: 'Sources',
    src: 'Places and festival descriptions: Korea Tourism Organization (official English translation). Korean addresses come from Korean public data matched by name. Opening hours and admission can change — check the official page before you go.',
    cultT: 'Exhibitions & performances on now',
    cultNote: 'These come from Busan’s Korean-language culture portal, so <b>titles are in Korean only</b>. We do not translate them — a mistranslated venue or date sends you to the wrong place. Copy the Korean title into a map or ticket site and it will find them.',
    cultTitle: 'Korean title — copy to search',
    free: 'Free',
    paid: 'Paid',
    title: (c, m) => `${c} in ${m} — Festivals, Places & Korean Addresses`,
    desc: (c, n) => `${n} places to visit in ${c}, each with the Korean address you can paste into NAVER Map or KakaoMap. Festivals on now, weather, and what to know before you go.`
  },
  ja: {
    city: { seoul: 'ソウル', busan: '釜山', jeju: '済州' },
    h1: c => `${c} — お祭りと行ってみる価値のある場所`,
    lead: (c, n, f) => `韓国観光公社が日本語で案内している${c}の${n}か所${f ? `と、いま開催中のお祭り${f}件` : ''}です。すべてに<b>地図アプリにそのまま貼り付けられる韓国語の住所</b>を付けました。`,
    whyT: 'なぜ韓国語の住所を載せるのか',
    why: 'Googleマップは韓国国内の経路検索ができません（地図データの国外持ち出し規制）。代わりに韓国語の住所（または韓国語の名前）を<b>NAVERマップ</b>・<b>カカオマップ</b>に貼り付けてください。このページの表記でそのまま検索できます。',
    fesT: '開催中のお祭り',
    placeT: c => `${c}で行ってみる場所`,
    addr: '地図に貼り付ける住所（韓国語）', name: '地図検索用の韓国語名',
    copy: 'コピー', copied: 'コピーしました',
    when: '期間', where: '場所', fee: '料金', how: '行き方', free: '無料',
    more: 'もっと見る', other: 'ほかの都市', srcT: '出典',
    src: '場所とお祭りの説明は韓国観光公社の日本語案内です。韓国語の住所は韓国語の公開データと名前で突き合わせて付けました。営業時間や料金は変わることがあるので、出発前に公式ページでご確認ください。',
    cultT: 'いま開催中の展示・公演',
    cultNote: '釜山市の韓国語文化ポータルの情報なので、<b>タイトルは韓国語のみ</b>です。訳しません — 会場名や日付を訳し間違えると別の場所に行くことになるからです。韓国語のまま地図やチケットサイトに貼り付けると見つかります。',
    cultTitle: '韓国語タイトル（検索用にコピー）',
    free: '無料',
    paid: '有料',
    title: (c, m) => `${c} ${m} — お祭り・行き先・韓国語の住所`,
    desc: (c, n) => `${c}で行ける${n}か所を、NAVERマップやカカオマップに貼り付けられる韓国語の住所付きで。開催中のお祭り、天気、行く前に知っておくことも。`
  },
  zh: {
    city: { seoul: '首尔', busan: '釜山', jeju: '济州' },
    h1: c => `${c} — 庆典与值得一去的地方`,
    lead: (c, n, f) => `韩国观光公社以中文介绍的${c}${n}处${f ? `，以及正在举办的${f}个庆典` : ''}。每一条都附上<b>可直接粘贴到地图应用的韩文地址</b>。`,
    whyT: '为什么我们提供韩文地址',
    why: '谷歌地图在韩国境内无法提供路线导航（地图数据出境限制）。请把韩文地址（或韩文名称）粘贴到<b>NAVER地图</b>或<b>Kakao地图</b>，本页的写法可以直接搜索。',
    fesT: '正在举办的庆典', placeT: c => `${c}可以去的地方`,
    addr: '粘贴到地图的地址（韩文）', name: '地图搜索用韩文名称',
    copy: '复制', copied: '已复制',
    when: '时间', where: '地点', fee: '费用', how: '交通', free: '免费',
    more: '更多', other: '其他城市', srcT: '资料来源',
    src: '地点与庆典说明来自韩国观光公社的中文介绍。韩文地址由韩文公开数据按名称匹配而来。营业时间与费用可能变动，出发前请确认官方页面。',
    cultT: '正在举办的展览与演出',
    cultNote: '资料来自釜山市韩文文化门户，因此<b>标题只有韩文</b>。我们不翻译 —— 场馆名或日期译错会让您去错地方。把韩文标题粘贴到地图或购票网站即可找到。',
    cultTitle: '韩文标题（复制后搜索）',
    free: '免费',
    paid: '收费',
    title: (c, m) => `${c} ${m} — 庆典·景点·韩文地址`,
    desc: (c, n) => `${c}值得一去的${n}处，附可粘贴到NAVER地图或Kakao地图的韩文地址。正在举办的庆典与出发前须知。`
  },
  tw: {
    city: { seoul: '首爾', busan: '釜山', jeju: '濟州' },
    h1: c => `${c} — 慶典與值得一去的地方`,
    lead: (c, n, f) => `韓國觀光公社以中文介紹的${c}${n}處${f ? `，以及正在舉辦的${f}個慶典` : ''}。每一條都附上<b>可直接貼到地圖應用的韓文地址</b>。`,
    whyT: '為什麼我們提供韓文地址',
    why: 'Google地圖在韓國境內無法提供路線導航（地圖資料出境限制）。請把韓文地址（或韓文名稱）貼到<b>NAVER地圖</b>或<b>Kakao地圖</b>，本頁的寫法可以直接搜尋。',
    fesT: '正在舉辦的慶典', placeT: c => `${c}可以去的地方`,
    addr: '貼到地圖的地址（韓文）', name: '地圖搜尋用韓文名稱',
    copy: '複製', copied: '已複製',
    when: '時間', where: '地點', fee: '費用', how: '交通', free: '免費',
    more: '更多', other: '其他城市', srcT: '資料來源',
    src: '地點與慶典說明來自韓國觀光公社的中文介紹。韓文地址由韓文公開資料按名稱比對而來。營業時間與費用可能變動，出發前請確認官方頁面。',
    cultT: '正在舉辦的展覽與演出',
    cultNote: '資料來自釜山市韓文文化入口網，因此<b>標題只有韓文</b>。我們不翻譯 —— 場館名或日期譯錯會讓您跑錯地方。把韓文標題貼到地圖或購票網站即可找到。',
    cultTitle: '韓文標題（複製後搜尋）',
    free: '免費',
    paid: '收費',
    title: (c, m) => `${c} ${m} — 慶典·景點·韓文地址`,
    desc: (c, n) => `${c}值得一去的${n}處，附可貼到NAVER地圖或Kakao地圖的韓文地址。正在舉辦的慶典與出發前須知。`
  },
  es: {
    city: { seoul: 'Seúl', busan: 'Busan', jeju: 'Jeju' },
    h1: c => `${c} — Fiestas y lugares que vale la pena visitar`,
    lead: (c, n, f) => `${n} lugares de ${c} descritos en español por la Organización de Turismo de Corea${f ? `, y ${f} fiestas en curso` : ''}. Cada entrada incluye <b>la dirección en coreano que puedes pegar en una app de mapas</b>.`,
    whyT: 'Por qué damos direcciones en coreano',
    why: 'Google Maps no ofrece indicaciones dentro de Corea del Sur (los datos de mapas no pueden exportarse). Pega la dirección en coreano (o el nombre coreano) en <b>NAVER Map</b> o <b>KakaoMap</b>: funcionan con lo que ves en esta página.',
    fesT: 'Fiestas en curso', placeT: c => `Lugares para ir en ${c}`,
    addr: 'Dirección en coreano para mapas', name: 'Nombre coreano para buscar',
    copy: 'Copiar', copied: 'Copiado',
    when: 'Fechas', where: 'Dónde', fee: 'Entrada', how: 'Cómo llegar', free: 'Gratis',
    more: 'Más', other: 'Otras ciudades', srcT: 'Fuentes',
    src: 'Lugares y descripciones: Organización de Turismo de Corea (traducción oficial). Las direcciones en coreano provienen de datos públicos coreanos emparejados por nombre. Horarios y precios pueden cambiar: confirma en la página oficial antes de ir.',
    cultT: 'Exposiciones y espectáculos en cartel',
    cultNote: 'Provienen del portal cultural de Busan en coreano, así que <b>los títulos están solo en coreano</b>. No los traducimos: traducir mal un recinto o una fecha te lleva al lugar equivocado. Copia el título coreano en un mapa o una web de entradas y lo encontrarás.',
    cultTitle: 'Título en coreano — copia para buscar',
    free: 'Gratis',
    paid: 'De pago',
    title: (c, m) => `${c} en ${m} — fiestas, lugares y direcciones en coreano`,
    desc: (c, n) => `${n} lugares para visitar en ${c}, con la dirección en coreano lista para pegar en NAVER Map o KakaoMap. Fiestas en curso y qué saber antes de ir.`
  }
};

const MONTH = {
  en: ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ja: ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  zh: ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  tw: ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  es: ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
};

// 2026-09-04 보강: 장소를 40 → 60 으로 늘렸다(서울 ja 264곳을 40만 보여주고 있었다).
const MIN_PLACES = 20, MIN_FESTS = 15, SHOW_PLACES = 60, SHOW_FESTS = 12, SHOW_CULT = 24;

// 🍊 2026-09-04 추가 — **제주에만** 붙이는 안내.
//   왜: 제주는 「동쪽·서쪽」으로 나눠 다니는 섬인데, 이건 한국 사람은 다 알고 외국인은 아무도 모른다.
//       검색량 실측에서도 「제주동쪽가볼만한곳 16,320 · 제주서쪽가볼만한곳 13,290」으로 확인됐다.
//   ⚠️ 번역해서 옮기는 게 아니라 **각 언어로 직접 썼다** — 읍·면 이름은 한글 그대로 둔다(지도에 넣을 이름이니까).
const JEJU = {
  en: ['Split the island east and west',
    `Jeju is a small island, but driving across it eats your day. Locals split it in two and so should you — <b>one day east, one day west</b>.<br>
<b>East</b> (조천읍 · 구좌읍 · 성산읍 · 표선면 · 남원읍) is the sunrise side: Seongsan Ilchulbong, Seopjikoji, Woljeongri beach.<br>
<b>West</b> (애월읍 · 한림읍 · 한경면 · 대정읍 · 안덕면) is the sunset side: the Aewol coastal cafés, Hyeopjae beach, Sanbangsan.<br>
The Korean place names above are written the way a map app expects them — paste them straight in.`],
  ja: ['島を東と西に分けて回る',
    `済州は小さな島ですが、横断すると一日が終わります。地元の人は東西に分けて回ります — <b>一日は東、一日は西</b>。<br>
<b>東</b>(조천읍 · 구좌읍 · 성산읍 · 표선면 · 남원읍)は日の出側。城山日出峰、涉地可支、月汀里の海。<br>
<b>西</b>(애월읍 · 한림읍 · 한경면 · 대정읍 · 안덕면)は日の入り側。涯月の海沿いカフェ、挾才海水浴場、山房山。<br>
上の韓国語の地名は地図アプリにそのまま貼り付けられる表記です。`],
  zh: ['把岛分成东西两边走',
    `济州岛不大，但横穿一次就是一天。当地人分东西走 — <b>一天东边，一天西边</b>。<br>
<b>东边</b>(조천읍 · 구좌읍 · 성산읍 · 표선면 · 남원읍)是日出的一侧：城山日出峰、涉地可支、月汀里海边。<br>
<b>西边</b>(애월읍 · 한림읍 · 한경면 · 대정읍 · 안덕면)是日落的一侧：涯月海边咖啡馆、挾才海水浴场、山房山。<br>
上面的韩文地名可以直接粘贴到地图应用里。`],
  tw: ['把島分成東西兩邊走',
    `濟州島不大，但橫穿一次就是一天。當地人分東西走 — <b>一天東邊，一天西邊</b>。<br>
<b>東邊</b>(조천읍 · 구좌읍 · 성산읍 · 표선면 · 남원읍)是日出的一側：城山日出峰、涉地可支、月汀里海邊。<br>
<b>西邊</b>(애월읍 · 한림읍 · 한경면 · 대정읍 · 안덕면)是日落的一側：涯月海邊咖啡館、挾才海水浴場、山房山。<br>
上面的韓文地名可以直接貼到地圖應用裡。`],
  es: ['Divide la isla en este y oeste',
    `Jeju es pequeña, pero cruzarla te come el día. Los locales la dividen en dos — <b>un día el este, otro el oeste</b>.<br>
<b>Este</b> (조천읍 · 구좌읍 · 성산읍 · 표선면 · 남원읍): el lado del amanecer. Seongsan Ilchulbong, Seopjikoji, la playa de Woljeongri.<br>
<b>Oeste</b> (애월읍 · 한림읍 · 한경면 · 대정읍 · 안덕면): el lado del atardecer. Los cafés de la costa de Aewol, la playa de Hyeopjae, Sanbangsan.<br>
Los nombres en coreano de arriba están escritos tal como los espera una app de mapas.`]
};

// 🥾 2026-09-05 추가 — **올레길 26코스**를 외국어에도 붙인다.
//   왜 이게 값어치가 큰가: 코스번호·거리·소요시간·«휠체어 가능 여부»는 **숫자와 참/거짓이라 번역이 필요 없다.**
//   지어낼 여지가 없고, 휠체어 정보는 영어권에 거의 없다(제주올레 공식 데이터 26/26 중 10코스 가능).
//   ⚠️ 코스명·출발지·도착지는 **한글 그대로** 둔다 — 그게 지도에 붙여넣을 이름이다(우리 강점).
//      「시흥초등학교」를 "Siheung Elementary School" 로 옮기면 네이버 지도에서 안 찾아진다.
const OLLE = {
  en: { t: 'The Jeju Olle Trail — all 26 routes', n: `The Olle Trail rings the island in 26 numbered routes. What follows is the official route data: length, walking time, and <b>which routes are wheelchair-accessible</b> — that last one is hard to find in English anywhere else.<br>Route and trailhead names stay in Korean on purpose. Paste the start point into NAVER Map or KakaoMap and it will take you there; an English translation will not.`, wc: 'Wheelchair', km: 'km', hr: 'h', s2e: 'Start → Finish', cpS: 'Start point (Korean) — paste into a map', route: 'Route' },
  ja: { t: '済州オルレ — 全26コース', n: `オルレは島を一周する26のコースです。以下は公式データで、距離・所要時間・<b>車いすで歩けるコースかどうか</b>まで載せました。最後のものは日本語ではほとんど見つかりません。<br>コース名と起終点は<b>あえて韓国語のまま</b>にしています。出発地をNAVERマップやカカオマップに貼り付ければそこへ案内されます — 訳した名前では出てきません。`, wc: '車いす可', km: 'km', hr: '時間', s2e: '起点 → 終点', cpS: '出発地（韓国語）— 地図に貼り付け', route: 'コース名' },
  zh: { t: '济州偶来小路 — 全26条路线', n: `偶来小路以26条编号路线环岛。以下是官方数据：长度、步行时间，以及<b>哪几条轮椅可通行</b> — 最后这一项在中文资料里几乎找不到。<br>路线名与起终点<b>特意保留韩文</b>。把出发地粘贴到NAVER地图或Kakao地图就能导航过去，翻译过的名字搜不到。`, wc: '轮椅可通行', km: '公里', hr: '小时', s2e: '起点 → 终点', cpS: '出发地（韩文）— 粘贴到地图', route: '路线名' },
  tw: { t: '濟州偶來小路 — 全26條路線', n: `偶來小路以26條編號路線環島。以下是官方資料：長度、步行時間，以及<b>哪幾條輪椅可通行</b> — 最後這一項在中文資料裡幾乎找不到。<br>路線名與起終點<b>特意保留韓文</b>。把出發地貼到NAVER地圖或Kakao地圖就能導航過去，翻譯過的名字搜不到。`, wc: '輪椅可通行', km: '公里', hr: '小時', s2e: '起點 → 終點', cpS: '出發地（韓文）— 貼到地圖', route: '路線名' },
  es: { t: 'Sendero Olle de Jeju — las 26 rutas', n: `El Olle rodea la isla en 26 rutas numeradas. Abajo van los datos oficiales: distancia, tiempo a pie y <b>qué rutas son accesibles en silla de ruedas</b> — esto último casi no existe en español.<br>Los nombres de ruta y de los puntos de inicio se quedan <b>en coreano a propósito</b>. Pega el punto de inicio en NAVER Map o KakaoMap y te llevará; el nombre traducido no aparece.`, wc: 'Silla de ruedas', km: 'km', hr: 'h', s2e: 'Inicio → Final', cpS: 'Punto de inicio (coreano) — pégalo en el mapa', route: 'Ruta' }
};

// 🌧 2026-09-05 추가 — 비 올 때 갈 실내 장소.
//   ⚠️ 관광공사가 «실내»라고 표시한 곳만 넣는다. 표시 없는 곳을 실내로 밀어넣지 않는다
//      — 비 오는 날 헛걸음이 제일 나쁘다(한국어 /jeju/rainy/ 와 같은 규칙).
//   ⚠️ 이름·주소는 한국어뿐이라 **번역하지 않는다** — 부산 전시·공연과 같은 방식으로 «붙여넣을 한글»을 준다.
const RAIN = {
  en: { t: 'If it rains — indoor places', n: `Rain is what ruins a Jeju trip. These are places the Jeju Tourism Organization has tagged <b>indoors</b> — only those, nothing guessed. Names and addresses are Korean-only in the source and we do not translate them: a mistranslated venue sends you to the wrong door. Copy the Korean and paste it into a map app.`, ind: 'Indoors', name: 'Korean name — copy to search', addr: 'Korean address — paste into a map', air: 'Near the airport' },
  ja: { t: '雨が降ったら — 屋内の行き先', n: `済州旅行で一番つらいのが雨です。ここは済州観光公社が<b>屋内</b>と分類した場所だけを集めました — 推測は入れていません。原本の名前と住所は韓国語のみで、<b>訳しません</b>。訳し間違えると別の場所に着いてしまうからです。韓国語のままコピーして地図アプリに貼り付けてください。`, ind: '屋内', name: '韓国語名（検索用にコピー）', addr: '韓国語の住所（地図に貼り付け）', air: '空港の近く' },
  zh: { t: '下雨的话 — 室内去处', n: `济州旅行最怕下雨。这里只收录济州观光公社标注为<b>室内</b>的地方 — 没有猜测的。原始资料的名称与地址只有韩文，我们<b>不翻译</b>：译错场馆名会让您走错地方。请复制韩文粘贴到地图应用。`, ind: '室内', name: '韩文名称（复制后搜索）', addr: '韩文地址（粘贴到地图）', air: '机场附近' },
  tw: { t: '下雨的話 — 室內去處', n: `濟州旅行最怕下雨。這裡只收錄濟州觀光公社標註為<b>室內</b>的地方 — 沒有猜測的。原始資料的名稱與地址只有韓文，我們<b>不翻譯</b>：譯錯場館名會讓您走錯地方。請複製韓文貼到地圖應用。`, ind: '室內', name: '韓文名稱（複製後搜尋）', addr: '韓文地址（貼到地圖）', air: '機場附近' },
  es: { t: 'Si llueve — sitios bajo techo', n: `La lluvia es lo que arruina un viaje a Jeju. Aquí solo van los sitios que la Organización de Turismo de Jeju marca como <b>interiores</b> — nada supuesto. En la fuente los nombres y direcciones están solo en coreano y <b>no los traducimos</b>: un nombre mal traducido te lleva a otra puerta. Copia el coreano y pégalo en el mapa.`, ind: 'Interior', name: 'Nombre en coreano — cópialo para buscar', addr: 'Dirección en coreano — pégala en el mapa', air: 'Cerca del aeropuerto' }
};

// 소요시간은 값이 5가지뿐인 «고정 문구»라 언어별로 그대로 대응시킨다(자유 번역이 아니다).
const HRS = {
  '1시간': { en: '1 hour', ja: '1時間', zh: '1小时', tw: '1小時', es: '1 hora' },
  '1~2시간': { en: '1–2 hours', ja: '1~2時間', zh: '1~2小时', tw: '1~2小時', es: '1–2 horas' },
  '2~3시간': { en: '2–3 hours', ja: '2~3時間', zh: '2~3小时', tw: '2~3小時', es: '2–3 horas' },
  '3시간 이상': { en: '3+ hours', ja: '3時間以上', zh: '3小时以上', tw: '3小時以上', es: 'más de 3 h' }
};
// ⚠️ 화면에 48개만 싣고 배지·설명문엔 288이라고 적으면 «없는 것을 약속»하는 셈이다.
//    한국어 /jeju/rainy/ 와 맞춰 80개를 싣고, 숫자는 «실은 개수»로 통일한다.
const SHOW_OLLE = 26, SHOW_RAIN = 80, MIN_RAIN = 30;

// 검색 결과에 뜨는 문장은 «남이 안 주는 것»을 말해야 한다 — 제주만 설명문을 갈아 끼운다.
const JEJU_DESC = {
  en: (n, o, r) => `${n} places in Jeju with the Korean address you can paste into NAVER Map, all ${o} Olle Trail routes with distance, walking time and wheelchair access, and ${r} indoor places for when it rains.`,
  ja: (n, o, r) => `済州の${n}か所を地図に貼り付けられる韓国語の住所付きで。オルレ全${o}コースの距離・所要時間・車いす可否、雨の日の屋内${r}か所も。`,
  zh: (n, o, r) => `济州${n}处景点，附可粘贴到NAVER地图的韩文地址。偶来小路全${o}条路线的距离、步行时间与轮椅通行情况，以及下雨天的${r}处室内去处。`,
  tw: (n, o, r) => `濟州${n}處景點，附可貼到NAVER地圖的韓文地址。偶來小路全${o}條路線的距離、步行時間與輪椅通行情況，以及下雨天的${r}處室內去處。`,
  es: (n, o, r) => `${n} sitios de Jeju con la dirección en coreano para pegar en NAVER Map, las ${o} rutas del sendero Olle con distancia, tiempo y accesibilidad en silla de ruedas, y ${r} sitios bajo techo para cuando llueve.`
};

function load(ROOT, f) {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')); } catch (e) { return null; }
}

function build({ ROOT, layout, writePage, SITE, TODAY, WX }) {
  const T8 = String(TODAY).replace(/-/g, '');
  const mn = +T8.slice(4, 6);
  const busan = load(ROOT, 'busan_festivals.json');
  // ⭐ 2026-09-04 보강 — 부산 전시·공연 126건을 외국어에도 싣는다.
  //   ⚠️ 원본이 한국어뿐이다. **번역하지 않는다** — 회장명·날짜를 잘못 옮기면 엉뚱한 곳으로 보낸다.
  //     대신 «한글 제목을 복사»하게 해 준다. 지도·티켓 사이트에 그대로 붙여넣으면 찾아진다.
  //     이건 우리 강점(붙여넣을 한글)과 정확히 맞고, 지어내지 않는다는 원칙도 지킨다.
  //   ⚠️ busan_culture.json 은 «배열이 아니라 {generated,source,stat,rows}» 다.
  //      이 파일의 load() 는 파싱만 하고 배열로 바꾸지 않는다 — .rows 를 꺼내야 한다(안 그러면 빌드가 죽는다).
  const busanCult = ((load(ROOT, 'busan_culture.json') || {}).rows || [])
    .filter(r => r.end >= String(TODAY).replace(/-/g, ''))
    .sort((a, b) => (b.x ? 1 : 0) - (a.x ? 1 : 0) || a.start.localeCompare(b.start));

  // 🍊 제주 전용 재료 — 올레 26코스 + 비 올 때 실내.
  //   ⚠️ 코스 번호는 「1코스·1-1코스·10코스」라 문자열 정렬하면 10이 2보다 앞에 온다 → 숫자로 쪼개 정렬한다.
  const olle = ((load(ROOT, 'jeju_hub.json') || {}).olle || []).slice().sort((a, b) => {
    const p = s => { const m = String(s).match(/^(\d+)(?:-(\d+))?/); return m ? [+m[1], +(m[2] || 0)] : [999, 0]; };
    const [a1, a2] = p(a.no), [b1, b2] = p(b.no);
    return a1 - b1 || a2 - b2;
  });
  //   ⚠️ 「모름」을 실내로 밀어넣지 않는다 — indoor === true 인 것만.
  const rain = ((load(ROOT, 'visitjeju.json') || {}).rows || [])
    .filter(o => o.indoor === true && o.x && o.y && o.addr && o.title);
  const urls = [];
  const skipped = [];
  const LANGS = ['en', 'ja', 'zh', 'tw', 'es'];
  const LANG_NAME = { en: 'English', ja: '日本語', zh: '简体中文', tw: '繁體中文', es: 'Español' };
  // 🔴 2026-09-04 수정(2) — **모든 언어의 통과 여부를 먼저 다 계산한 뒤에 한 장도 그리지 않는다.**
  //   그래야 「같은 도시의 다른 언어」 줄을 «실제로 만든 것만»으로 찍을 수 있다.
  //   이 줄이 없어서 `/tw/busan/`·`/zh/busan/` 이 **홈에서 도달 불가(고아) 2건**이었다
  //   — 그 두 장을 가리키는 링크가 사이트 어디에도 없었다.
  const READY = {};

  for (const pass of [1, 2]) {
  for (const lang of LANGS) {
    const t = T[lang];
    const places = load(ROOT, `places_${lang}.json`) || [];
    const fests = load(ROOT, `festivals_${lang}.json`) || [];

    // 🔴 2026-09-04 수정 — **먼저 「어느 도시가 통과하나」를 다 정하고 나서 렌더한다.**
    //   전에는 도시를 하나씩 만들면서 하단 「다른 도시」 링크를 CITIES 전체로 찍었다.
    //   그래서 게이트로 **만들지 않은** `/tw/seoul/`·`/tw/jeju/` 로 링크가 나가 **끊긴 내부 링크 4건**이 됐다.
    //   ⚠️ 게이트가 있는 곳엔 «게이트를 통과한 것만 링크한다»가 따라와야 한다 — 하나만 넣으면 404를 만든다.
    const mats = C => {
      const P = places.filter(p => p.sido === C.sido && +p.x && +p.y
        && String(p.ov || '').length >= 120 && p.addrKo);
      let F = fests.filter(f => String(f.end || '') >= T8
        && C.match.some(k => String(f.region || '').includes(k) || String(f.addr || '').includes(k)))
        .map(f => ({ title: f.title, start: f.start, end: f.end, place: f.addr, img: f.img, x: f.x, y: f.y, ko: '', desc: '', traffic: '', fee: '' }));

      // ⭐ 부산만 «공식 5개어 번역»이 따로 있다 — 우선 쓴다(교통안내·요금·한글원제까지 붙는다).
      if (C.key === 'busan' && busan && busan.rows) {
        const bf = busan.rows.filter(r => r.langs && r.langs[lang] && r.langs[lang].title)
          .map(r => ({
            title: r.langs[lang].title, sub: r.langs[lang].sub, ko: r.ko,
            place: r.langs[lang].place, day: r.langs[lang].day, time: r.langs[lang].time,
            fee: r.langs[lang].fee, traffic: r.langs[lang].traffic,
            desc: r.langs[lang].desc, img: r.img, x: r.x, y: r.y
          }));
        if (bf.length) F = bf;
      }
      return { C, P, F };
    };
    const ready = CITIES.map(mats).filter(m => {
      // ── 게이트: 재료가 없으면 «만들지 않는다»
      if (m.P.length < MIN_PLACES && m.F.length < MIN_FESTS) {
        if (pass === 1) skipped.push(`${lang}/${m.C.key}(장소 ${m.P.length}·축제 ${m.F.length})`);
        return false;
      }
      return true;
    });
    const madeKeys = new Set(ready.map(m => m.C.key));
    if (pass === 1) { READY[lang] = madeKeys; continue; }   // 1회차는 «누가 통과했나»만 모은다

    for (const { C, P, F } of ready) {

      const city = t.city[C.key];
      const cp = (label, val) => val ? `<div class="xcopy"><div><span class="lb">${esc(label)}</span><span class="vl">${esc(val)}</span></div>
<button data-v="${esc(val)}" data-done="${esc(t.copied)}">${esc(t.copy)}</button></div>` : '';

      const fesCard = f => {
        const wx = (WX && f.x && f.y) ? WX.now(f.x, f.y) : '';
        const dates = f.start ? `${String(f.start).slice(4, 6)}/${String(f.start).slice(6, 8)} – ${String(f.end).slice(4, 6)}/${String(f.end).slice(6, 8)}` : (f.day || '');
        return `<li class="ic-item">
<div class="ic-h"><b>${esc(f.title)}</b>${f.ko ? `<span class="ic-ko">${esc(f.ko)}</span>` : ''}${wx}</div>
${f.sub ? `<p class="ic-sub">${esc(f.sub)}</p>` : ''}
<p class="ic-meta">${dates ? `📅 ${esc(t.when)}: ${esc(dates)}` : ''}${f.place ? ` · 📍 ${esc(String(f.place).slice(0, 60))}` : ''}${f.fee ? ` · 💳 ${esc(String(f.fee).slice(0, 50))}` : ''}</p>
${f.desc ? `<p class="ic-ov">${esc(String(f.desc).slice(0, 260))}</p>` : ''}
${f.traffic ? `<p class="ic-tr">🚇 ${esc(t.how)}: ${esc(String(f.traffic).slice(0, 200))}</p>` : ''}
${cp(t.name, f.ko)}
</li>`;
      };

      const plCard = p => `<li class="ic-item">
<div class="ic-h"><b>${esc(p.title)}</b>${p.ko ? `<span class="ic-ko">${esc(p.ko)}</span>` : ''}</div>
<p class="ic-ov">${esc(String(p.ov).replace(/\s+/g, ' ').slice(0, 190))}…</p>
${cp(t.addr, p.addrKo)}
</li>`;

      // ⚠️ «실제로 만든» 도시만 링크한다(madeKeys). CITIES 전체로 찍으면 404가 생긴다.
      const others = CITIES.filter(o => o.key !== C.key && madeKeys.has(o.key))
        .map(o => `<a href="/${lang}/${o.key}/">${esc(t.city[o.key])}</a>`).join('');
      // 같은 도시의 «다른 언어» — 실제로 만든 것만. 이 줄이 고아 페이지를 없앤다.
      const langRow = LANGS.filter(l => l !== lang && READY[l] && READY[l].has(C.key))
        .map(l => `<a href="/${l}/${C.key}/">${LANG_NAME[l]}</a>`).join('')
        + `<a href="/${C.key}/">한국어</a>`;

      const content = `<main><div class="wrap">${CSS}
<p class="ic-crumb"><a href="/${lang}/">${lang === 'ja' ? 'ホーム' : lang === 'zh' ? '首页' : lang === 'tw' ? '首頁' : lang === 'es' ? 'Inicio' : 'Home'}</a> › ${esc(city)}</p>
<h1 class="ic-h1">${esc(t.h1(city))}</h1>
<p class="ic-lead">${t.lead(esc(city), P.length, F.length)}</p>

<div class="ic-why"><h2>${esc(t.whyT)}</h2><p>${t.why}</p></div>

${F.length ? `<h2 class="sec">${esc(t.fesT)}</h2>
<ul class="ic-list">${F.slice(0, SHOW_FESTS).map(fesCard).join('')}</ul>` : ''}

${P.length ? `<h2 class="sec">${esc(t.placeT(city))}</h2>
<ul class="ic-list">${P.slice(0, SHOW_PLACES).map(plCard).join('')}</ul>` : ''}

${C.key === 'busan' && busanCult.length ? `<h2 class="sec">${esc(t.cultT)} <span class="ic-n">${busanCult.length}</span></h2>
<p class="ic-cnote">${t.cultNote}</p>
<ul class="ic-list">${busanCult.slice(0, SHOW_CULT).map(r => `<li class="ic-item">
<div class="ic-h"><b>${esc(r.title)}</b><span class="ic-tag">${r.pay ? esc(t.paid) : esc(t.free)}</span></div>
<p class="ic-meta">📅 ${esc(String(r.start).slice(4, 6))}/${esc(String(r.start).slice(6, 8))} – ${esc(String(r.end).slice(4, 6))}/${esc(String(r.end).slice(6, 8))} · 📍 ${esc(r.place)}</p>
${cp(t.cultTitle, r.title)}
${r.addr ? cp(t.addr, r.addr) : ''}
</li>`).join('')}</ul>` : ''}

${C.key === 'jeju' && JEJU[lang] ? `<div class="ic-why"><h2>${esc(JEJU[lang][0])}</h2><p>${JEJU[lang][1]}</p></div>` : ''}

${C.key === 'jeju' && olle.length ? (() => { const o = OLLE[lang]; return `<h2 class="sec">${esc(o.t)} <span class="ic-n">${olle.length}</span></h2>
<p class="ic-cnote">${o.n}</p>
<ul class="ic-list">${olle.slice(0, SHOW_OLLE).map(c => `<li class="ic-item">
<div class="ic-h"><b>${esc(String(c.no).replace('코스', ''))}</b><span class="ic-ko">${esc(c.name)}</span>${c.wheelchair ? `<span class="ic-tag">♿ ${esc(o.wc)}</span>` : ''}</div>
<p class="ic-meta">${c.km ? `📏 ${c.km} ${esc(o.km)}` : ''}${c.hours ? ` · ⏱ ${esc(c.hours)} ${esc(o.hr)}` : ''}${c.start ? ` · 🚩 ${esc(c.start)} → ${esc(c.end || '')}` : ''}</p>
${cp(o.cpS, c.start)}
</li>`).join('')}</ul>` })() : ''}

${C.key === 'jeju' && rain.length >= MIN_RAIN ? (() => { const r = RAIN[lang], shown = Math.min(rain.length, SHOW_RAIN); return `<h2 class="sec">${esc(r.t)} <span class="ic-n">${shown}</span></h2>
<p class="ic-cnote">${r.n}</p>
<ul class="ic-list">${rain.slice(0, SHOW_RAIN).map(p => {
        const hh = HRS[p.hours] && HRS[p.hours][lang];
        return `<li class="ic-item">
<div class="ic-h"><b>${esc(p.title)}</b><span class="ic-tag">🏠 ${esc(r.ind)}</span>${p.airport ? `<span class="ic-tag">✈️ ${esc(r.air)}</span>` : ''}</div>
<p class="ic-meta">${hh ? `⏱ ${esc(hh)}` : ''}${p.region ? `${hh ? ' · ' : ''}📍 ${esc(p.region)}` : ''}</p>
${cp(r.name, p.title)}
${cp(r.addr, p.addr)}
</li>`;
      }).join('')}</ul>` })() : ''}

${others ? `<h2 class="sec">${esc(t.other)}</h2>
<div class="ic-nav">${others}</div>` : ''}
<div class="ic-nav" style="margin-top:10px">${langRow}</div>

<p class="ic-src"><b>${esc(t.srcT)}</b> — ${esc(t.src)}</p>
</div></main>`;

      const desc = (C.key === 'jeju' && olle.length && rain.length >= MIN_RAIN && JEJU_DESC[lang])
        ? JEJU_DESC[lang](P.length, olle.length, Math.min(rain.length, SHOW_RAIN))
        : t.desc(city, P.length);
      writePage(`${lang}/${C.key}`, layout(
        t.title(city, MONTH[lang][mn]),
        desc,
        `/${lang}/${C.key}/`, content, { lang }));
      urls.push(`/${lang}/${C.key}/`);
    }
  }
  }   // pass 1(통과 여부 수집) → pass 2(렌더)

  console.log(`✓ /{lang}/{city}/ — ${urls.length}페이지`);
  if (skipped.length) console.log(`   재료 부족으로 «만들지 않음» ${skipped.length}개: ${skipped.join(' · ')}`);
  return urls;
}

const CSS = `<style>
.ic-crumb{font-size:.85rem;color:#9aa3af;margin:8px 0}
.ic-crumb a{color:#0c7d72}
.ic-h1{font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:6px 0 8px}
.ic-lead{color:#374151;font-size:1rem;line-height:1.8;margin:0 0 14px}
.ic-why{background:#f4faf8;border:1.5px solid #dcefeb;border-radius:14px;padding:14px 17px;margin:14px 0}
.ic-why h2{font-size:1rem;font-weight:900;color:#0a6c63;margin:0 0 6px}
.ic-why p{color:#0a6c63;font-size:.94rem;line-height:1.75;margin:0}
.ic-list{list-style:none;padding:0;margin:0;display:grid;gap:11px}
.ic-item{border:1px solid #e6eaee;border-radius:12px;padding:13px 15px;background:#fff}
.ic-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px}
.ic-h b{font-size:1rem;font-weight:800;color:#111827}
.ic-ko{font-size:.84rem;color:#6b7280;font-weight:700}
.ic-sub{font-size:.9rem;color:#0a6c63;font-weight:700;margin:0 0 5px}
.ic-meta{font-size:.85rem;color:#6b7280;margin:0 0 6px;line-height:1.6}
.ic-ov{font-size:.9rem;line-height:1.7;color:#374151;margin:0 0 8px}
.ic-tr{font-size:.86rem;line-height:1.65;color:#374151;background:#f7fafc;border-radius:8px;padding:8px 10px;margin:0 0 8px}
.ic-nav{display:flex;flex-wrap:wrap;gap:8px}
.ic-nav a{display:inline-block;padding:9px 16px;border-radius:22px;background:#fff;border:1.5px solid #dfe6ea;color:#374151;font-weight:800;font-size:.92rem;text-decoration:none}
.ic-src{font-size:.8rem;color:#9aa3af;line-height:1.7;margin-top:18px}
.ic-n{font-size:.85rem;font-weight:800;color:#0a6c63;background:#e7f6f3;border-radius:999px;padding:2px 10px;margin-left:6px}
.ic-cnote{font-size:.88rem;color:#6b7280;line-height:1.75;margin:0 0 12px}
.ic-tag{font-size:.74rem;font-weight:800;color:#0a6c63;background:#e7f6f3;border-radius:6px;padding:2px 8px}
.xcopy{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;
  background:#f6fbfa;border:1.5px solid #dcefeb;border-radius:12px;padding:10px 12px;margin:6px 0}
.xcopy .lb{font-size:.74rem;font-weight:800;color:#0a6c63;display:block;margin-bottom:3px}
.xcopy .vl{font-size:.98rem;font-weight:800;color:#111827;word-break:keep-all;line-height:1.45}
.xcopy button{background:#0f9d8f;color:#fff;border:0;border-radius:9px;padding:9px 14px;font-weight:800;font-size:.84rem;cursor:pointer;white-space:nowrap}
</style>
<script>
if(!window.__xcopyBound){window.__xcopyBound=1;
document.addEventListener('click',function(e){
  var b=e.target.closest('.xcopy button'); if(!b) return;
  var t=b.getAttribute('data-v')||'';
  var done=function(){var o=b.textContent;b.textContent=b.getAttribute('data-done')||'OK';
    setTimeout(function(){b.textContent=o;},1400);};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,function(){});}
  else{var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);
    ta.select();try{document.execCommand('copy');done();}catch(_){}document.body.removeChild(ta);}
});}
</script>`;

module.exports = { build };
