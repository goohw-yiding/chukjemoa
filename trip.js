// 🌏 방문 차수별 추천 — /{lang}/trip/ 허브 + first/second/third-time 3페이지 × 5개 언어
//
// 왜 이게 우리만 할 수 있나:
//  "두 번째 한국 여행 어디 가지"에 대한 답이 세상엔 전부 블로그 주관이다.
//  우리는 ① 외국인 방문 순위(40개 시군구) ② 한국인 성수기 배수(188개 시군구)
//  ③ 등록 관광지·걷기길·자연 자산 수 — 이 세 숫자로 답할 수 있다.
//  "한국인은 제철에 몰리는데 외국인 순위엔 아예 없는 곳" = 2·3회차의 정답이고, 이건 숫자다.
//
// ⚠️ 정직하게 쓸 것: 등록 관광지 '수'로 뽑기 때문에, 전주 한옥마을처럼 한 곳의 명성으로 유명한 도시는
//    순위에 덜 반영된다. 페이지에 그렇게 적는다. 안 적으면 "전주가 왜 없냐"에서 신뢰를 잃는다.
const fs = require('fs'), path = require('path');
const TD = require('./trip-data.js');

const ASSET_V = '20260809c';
const LANGS = TD.LANGS;
const TIERS = ['first', 'second', 'third'];
const SLUG = { first: 'first-time', second: 'second-time', third: 'third-time' };

// 배수 배지에 "8월"을 숫자 8로만 쓰면 "Koreans in 8: ×1.29" 처럼 읽히지 않는다
const MON = {
  en: ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ja: ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  zh: ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  tw: ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  es: ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
};

const L = {
  en: {
    hubH1: 'Where to go in Korea — by how many times you have been',
    hubLead: 'Most "best of Korea" lists are somebody\'s opinion. This one is built from three numbers: how many foreign visitors each district actually receives, how much busier it gets in peak season with Korean travellers, and how many registered attractions, walking trails and natural sites it has.',
    hubTitle: n => `Where to Go in Korea — First, Second and Third Visit (${n} destinations)`,
    hubDesc: 'Korea trip ideas ranked by real visitor data. First visit: the places foreign travellers already go. Second and third visit: where Koreans crowd in season but foreigners have not found yet.',
    tier: {
      first: { h1: 'First time in Korea — where to go', lead: 'These are the districts that receive the most foreign visitors in the country. On a first trip that is exactly what you want: everything is signposted in English, transport is easy, and you will not waste a short trip figuring things out.', title: 'First Time in Korea — Where to Go, by Visitor Data', desc: 'The 12 districts that receive the most foreign visitors in Korea, with what is actually in each one — attractions, walking trails, natural sites and how crowded it gets.' },
      second: { h1: 'Second time in Korea — where to go next', lead: 'You have done Seoul, Busan and Jeju. These are the places Koreans themselves travel to in numbers — but which do not appear in the top ranks for foreign visitors. Familiar enough to be easy, different enough to be worth the trip.', title: 'Second Time in Korea — Where to Go Beyond Seoul and Busan', desc: 'Where to go on a second trip to Korea. Chosen from districts Korean travellers visit heavily but that rank low or not at all for foreign visitors.' },
      third: { h1: 'Third time in Korea and beyond — where almost no tourists go', lead: 'These districts do not appear in the foreign-visitor rankings at all. Koreans go — the peak-season multiplier proves it — but you will rarely hear English. Expect fewer signs in your language, and more of the country as it actually is.', title: 'Third Time in Korea — Places Foreign Tourists Have Not Found', desc: 'Korean districts that do not appear in foreign-visitor rankings but where domestic travel spikes in season. For repeat visitors who want somewhere genuinely quiet.' }
    },
    fgnRank: n => `Foreign visitors: ranked #${n} in Korea`,
    fgnNone: 'Not in the top 40 for foreign visitors',
    busy: (m, v) => `In ${m}, Koreans make it ×${v} busier than usual`,
    quiet: (m, v) => `${m} is a calm month here (×${v})`,
    assets: 'What is there',
    a: { spot: 'attractions', walk: 'walking trails', nat: 'mountains & nature', market: 'traditional markets', fes: 'festivals', acc: 'wheelchair-accessible sites' },
    hi: 'A few of them',
    askH: 'Ask about your own trip',
    askLead: 'Tell it where you have already been, or what kind of place you like. It answers only from the destinations on this site — it will not invent a place.',
    q: ['I have been to Seoul and Busan. Where next?', 'I liked Jeju. Somewhere similar but quieter?', 'Where can I go without renting a car?', 'Five days in autumn — where would you send me?'],
    ph: 'e.g. I have been to Seoul twice and want mountains and hot springs',
    send: 'Send',
    limits: 'What this page does not know',
    limitList: [
      'Opening hours, closing days and ticket prices are not in our data. Check before you go.',
      'Rankings come from the number of <b>registered</b> attractions, so a city famous for one single place (Jeonju Hanok Village, Andong Hahoe Village) ranks lower than it deserves.',
      'The crowd multiplier describes the <b>district</b>, not any single place inside it.',
      'Foreign-visitor data covers only the top 40 districts. "Not ranked" means "not in that 40" — not zero.'
    ],
    source: 'Data: Korea Tourism Organization TourAPI (attractions, festivals, restaurants, cafés, accommodation, accessible sites) · National Walking Trail Standard Data · Korea Tourism Data Lab (visitor counts by district).',
    nameNote: 'Korean names are shown next to the romanised name on purpose — show your screen to a taxi driver or ticket clerk.',
    other: 'Other trips'
  },
  ja: {
    hubH1: '韓国どこ行く — 何回目の訪問かで選ぶ',
    hubLead: '「韓国おすすめ」の多くは誰かの主観です。このページは三つの数字で作りました。市郡区ごとの外国人訪問者数、韓国人が繁忙期にどれだけ集まるか（平常比の倍率）、そして登録された観光地・歩く道・自然スポットの数です。',
    hubTitle: n => `韓国どこ行く — 1回目・2回目・3回目で選ぶ（${n}か所）`,
    hubDesc: '実際の訪問データで選んだ韓国の行き先。1回目は外国人がすでに行く場所、2回目・3回目は韓国人が季節に集まるのに外国人はまだ来ていない場所。',
    tier: {
      first: { h1: '韓国はじめて — どこへ行くか', lead: '外国人訪問者が最も多い市郡区です。初回はこれで正解です。案内表示も交通も整っていて、短い日程を迷うことに使わずに済みます。', title: '韓国はじめての旅 — 訪問データで選ぶ行き先', desc: '外国人訪問者が最も多い韓国の12地域と、そこに実際にあるもの（観光地・歩く道・自然・混雑度）。' },
      second: { h1: '韓国2回目 — 次はどこへ', lead: 'ソウル・釜山・済州は済んだ方へ。韓国人自身がよく行くのに、外国人訪問ランキングの上位には出てこない場所を集めました。行きやすさは残しつつ、初回とは違う韓国です。', title: '韓国2回目 — ソウル・釜山の次に行く場所', desc: '韓国2回目の行き先。韓国人の訪問は多いのに外国人ランキングでは下位、または圏外の地域から選びました。' },
      third: { h1: '韓国3回目以降 — 観光客がほぼいない場所', lead: '外国人訪問ランキングに名前すら出てこない地域です。韓国人は行きます（繁忙倍率がそれを示しています）。英語はあまり通じません。その代わり、素の韓国があります。', title: '韓国3回目 — 外国人がまだ見つけていない場所', desc: '外国人訪問ランキング圏外なのに、季節になると韓国人が集まる地域。本当に静かな場所を探すリピーター向け。' }
    },
    fgnRank: n => `外国人訪問：全国 ${n} 位`,
    fgnNone: '外国人訪問トップ40圏外',
    busy: (m, v) => `${m}は韓国人で普段の ×${v}`,
    quiet: (m, v) => `${m}は落ち着いています（×${v}）`,
    assets: '何があるか',
    a: { spot: '観光地', walk: '歩く道', nat: '山・自然', market: '在来市場', fes: '祭り', acc: 'バリアフリー施設' },
    hi: 'たとえば',
    askH: '自分の旅について聞く',
    askLead: 'これまでに行った場所や、好きな雰囲気を書いてください。このサイトにある行き先の中からだけ答えます。存在しない場所は作りません。',
    q: ['ソウルと釜山は行きました。次はどこ？', '済州が良かった。似ていてもっと静かな所は？', 'レンタカーなしで行けますか？', '秋に5日間。どこがいい？'],
    ph: '例）ソウルは2回。山と温泉が好きです',
    send: '送信',
    limits: 'このページが知らないこと',
    limitList: [
      '営業時間・定休日・入場料はデータにありません。訪問前にご確認ください。',
      '順位は<b>登録された</b>観光地の数から出しています。全州韓屋村・安東河回村のように一か所の名声で有名な都市は実際より低く出ます。',
      '混雑倍率はその<b>市郡区</b>の数値で、個々の場所のものではありません。',
      '外国人訪問データは上位40地域のみです。「圏外」はゼロという意味ではありません。'
    ],
    source: '出典：韓国観光公社 TourAPI（観光地・祭り・飲食店・カフェ・宿泊・バリアフリー）／全国歩く道標準データ／韓国観光データラボ（地域別訪問者数）。',
    nameNote: 'ローマ字の横に韓国語を併記しています。タクシーや窓口で画面を見せてください。',
    other: '他の回数'
  },
  zh: {
    hubH1: '韩国去哪儿 — 按第几次来选',
    hubLead: '大多数「韩国推荐」都是个人主观。这一页用三个数字做成：各市郡区实际接待的外国游客数、旺季时韩国人涌入的倍数、以及登记在册的景点·步道·自然景观数量。',
    hubTitle: n => `韩国去哪儿 — 第一次·第二次·第三次（${n}个目的地）`,
    hubDesc: '用真实访客数据选出的韩国目的地。第一次去外国人已经在去的地方，第二三次去韩国人扎堆而外国人还没发现的地方。',
    tier: {
      first: { h1: '第一次来韩国 — 去哪儿', lead: '这些是全国接待外国游客最多的市郡区。第一次来就该这样：标识齐全、交通方便，不用把短短几天花在摸索上。', title: '第一次来韩国 — 用访客数据选行程', desc: '韩国接待外国游客最多的12个地区，以及每个地区实际有什么：景点、步道、自然景观和拥挤程度。' },
      second: { h1: '第二次来韩国 — 接下来去哪儿', lead: '首尔、釜山、济州都去过了。这些是韩国人自己常去、却没进外国游客排行前列的地方。既好走，又和第一次不一样。', title: '第二次来韩国 — 首尔釜山之外去哪儿', desc: '第二次来韩国的目的地。从韩国人访问量大、但外国游客排名靠后或未上榜的地区中选出。' },
      third: { h1: '第三次以后 — 几乎没有游客的地方', lead: '这些地区根本没出现在外国游客排行里。韩国人会去——旺季倍数证明了这一点。英语不太通，但你会看到没有被观光化的韩国。', title: '第三次来韩国 — 外国游客还没发现的地方', desc: '未进入外国游客排行、但到了季节韩国人就涌入的地区。适合想找真正清静地方的回头客。' }
    },
    fgnRank: n => `外国游客：全国第 ${n} 位`,
    fgnNone: '未进入外国游客前40',
    busy: (m, v) => `${m}韩国人是平时的 ×${v}`,
    quiet: (m, v) => `${m}这里比较清静（×${v}）`,
    assets: '这里有什么',
    a: { spot: '景点', walk: '步道', nat: '山与自然', market: '传统市场', fes: '庆典', acc: '无障碍设施' },
    hi: '举几个',
    askH: '问问你自己的行程',
    askLead: '说说你去过哪儿，或者喜欢什么样的地方。它只会从本站收录的目的地里回答，不会编造。',
    q: ['首尔和釜山去过了，接下来呢？', '喜欢济州，有没有类似但更清静的？', '不租车能去哪儿？', '秋天五天，去哪儿好？'],
    ph: '例）首尔去过两次，喜欢山和温泉',
    send: '发送',
    limits: '这一页不知道的事',
    limitList: [
      '营业时间、休息日、门票价格不在我们的数据里，出发前请自行确认。',
      '排名基于<b>登记</b>景点的数量，所以像全州韩屋村、安东河回村这种靠一处出名的城市会被低估。',
      '拥挤倍数说的是那个<b>市郡区</b>，不是里面某一个地点。',
      '外国游客数据只覆盖前40个地区，「未上榜」不等于零。'
    ],
    source: '数据来源：韩国观光公社 TourAPI（景点·庆典·餐饮·咖啡馆·住宿·无障碍）／全国步道标准数据／韩国观光数据实验室（地区访客数）。',
    nameNote: '罗马字旁边特意保留了韩文——可以直接把屏幕给出租车司机或售票员看。',
    other: '其他次数'
  },
  tw: {
    hubH1: '韓國去哪裡 — 依第幾次造訪來選',
    hubLead: '多數「韓國推薦」都是個人主觀。這一頁用三個數字做成：各市郡區實際接待的外國旅客數、旺季時韓國人湧入的倍數，以及登記在案的景點・步道・自然景點數量。',
    hubTitle: n => `韓國去哪裡 — 第一次・第二次・第三次（${n}個目的地）`,
    hubDesc: '用真實旅客資料選出的韓國目的地。第一次去外國人已經在去的地方，第二三次去韓國人聚集而外國人還沒發現的地方。',
    tier: {
      first: { h1: '第一次來韓國 — 去哪裡', lead: '這些是全國接待外國旅客最多的市郡區。第一次來就該這樣：標示清楚、交通方便，不用把短短幾天花在摸索上。', title: '第一次來韓國 — 用旅客資料選行程', desc: '韓國接待外國旅客最多的12個地區，以及每個地區實際有什麼：景點、步道、自然景觀與擁擠程度。' },
      second: { h1: '第二次來韓國 — 接下來去哪裡', lead: '首爾、釜山、濟州都去過了。這些是韓國人自己常去、卻沒進外國旅客排行前段的地方。好走，又和第一次不一樣。', title: '第二次來韓國 — 首爾釜山之外去哪裡', desc: '第二次來韓國的目的地。從韓國人造訪量大、但外國旅客排名靠後或未上榜的地區中選出。' },
      third: { h1: '第三次以後 — 幾乎沒有觀光客的地方', lead: '這些地區根本沒出現在外國旅客排行裡。韓國人會去——旺季倍數證明了這件事。英語不太通，但你會看到沒有被觀光化的韓國。', title: '第三次來韓國 — 外國旅客還沒發現的地方', desc: '未進入外國旅客排行、但到了季節韓國人就湧入的地區。適合想找真正清靜地方的回頭客。' }
    },
    fgnRank: n => `外國旅客：全國第 ${n} 名`,
    fgnNone: '未進入外國旅客前40名',
    busy: (m, v) => `${m}韓國人是平常的 ×${v}`,
    quiet: (m, v) => `${m}這裡比較清靜（×${v}）`,
    assets: '這裡有什麼',
    a: { spot: '景點', walk: '步道', nat: '山與自然', market: '在地市集', fes: '慶典', acc: '無障礙設施' },
    hi: '舉幾個',
    askH: '問問你自己的行程',
    askLead: '說說你去過哪裡，或喜歡什麼樣的地方。它只會從本站收錄的目的地裡回答，不會捏造。',
    q: ['首爾和釜山去過了，接下來呢？', '喜歡濟州，有沒有類似但更安靜的？', '不租車能去哪裡？', '秋天五天，去哪裡好？'],
    ph: '例）首爾去過兩次，喜歡山和溫泉',
    send: '送出',
    limits: '這一頁不知道的事',
    limitList: [
      '營業時間、公休日、門票價格不在我們的資料裡，出發前請自行確認。',
      '排名以<b>登記</b>景點數量為準，所以像全州韓屋村、安東河回村這種靠一處出名的城市會被低估。',
      '擁擠倍數講的是那個<b>市郡區</b>，不是裡面某一個地點。',
      '外國旅客資料只涵蓋前40個地區，「未上榜」不等於零。'
    ],
    source: '資料來源：韓國觀光公社 TourAPI（景點・慶典・餐飲・咖啡廳・住宿・無障礙）／全國步道標準資料／韓國觀光數據實驗室（地區訪客數）。',
    nameNote: '羅馬拼音旁邊刻意保留韓文——可以直接把螢幕給計程車司機或售票員看。',
    other: '其他次數'
  },
  es: {
    hubH1: 'Dónde ir en Corea — según cuántas veces hayas estado',
    hubLead: 'La mayoría de las listas de "lo mejor de Corea" son opiniones. Esta se construye con tres números: cuántos visitantes extranjeros recibe realmente cada distrito, cuánto se llena de viajeros coreanos en temporada alta, y cuántos atractivos, senderos y espacios naturales tiene registrados.',
    hubTitle: n => `Dónde ir en Corea — primera, segunda y tercera visita (${n} destinos)`,
    hubDesc: 'Destinos de Corea elegidos con datos reales de visitantes. Primera visita: donde ya van los extranjeros. Segunda y tercera: donde los coreanos se concentran en temporada y los extranjeros aún no llegan.',
    tier: {
      first: { h1: 'Primera vez en Corea — dónde ir', lead: 'Estos son los distritos que reciben más visitantes extranjeros del país. En un primer viaje eso es justo lo que quieres: señalización en inglés, transporte fácil y ningún día perdido averiguando cómo funciona todo.', title: 'Primera vez en Corea — dónde ir, según los datos', desc: 'Los 12 distritos con más visitantes extranjeros de Corea y lo que hay en cada uno: atractivos, senderos, naturaleza y nivel de aglomeración.' },
      second: { h1: 'Segunda vez en Corea — a dónde ir ahora', lead: 'Ya viste Seúl, Busan y Jeju. Estos son los lugares a los que viajan los propios coreanos pero que no aparecen arriba en el ranking de visitantes extranjeros. Fáciles de recorrer, y distintos del primer viaje.', title: 'Segunda vez en Corea — más allá de Seúl y Busan', desc: 'A dónde ir en un segundo viaje a Corea. Elegido entre distritos muy visitados por coreanos pero con poca o ninguna presencia en el ranking extranjero.' },
      third: { h1: 'Tercera vez o más — donde casi no hay turistas', lead: 'Estos distritos no aparecen en el ranking de visitantes extranjeros. Los coreanos sí van: el multiplicador de temporada lo demuestra. Se habla poco inglés, pero verás el país tal como es.', title: 'Tercera vez en Corea — lugares que los turistas no han encontrado', desc: 'Distritos fuera del ranking de visitantes extranjeros donde el viaje interno se dispara en temporada. Para quien repite y busca algo realmente tranquilo.' }
    },
    fgnRank: n => `Visitantes extranjeros: puesto #${n} del país`,
    fgnNone: 'Fuera del top 40 de visitantes extranjeros',
    busy: (m, v) => `En ${m} los coreanos lo llenan ×${v} más de lo normal`,
    quiet: (m, v) => `${m} es un mes tranquilo aquí (×${v})`,
    assets: 'Qué hay',
    a: { spot: 'atractivos', walk: 'senderos', nat: 'montañas y naturaleza', market: 'mercados tradicionales', fes: 'festivales', acc: 'sitios accesibles' },
    hi: 'Algunos ejemplos',
    askH: 'Pregunta por tu propio viaje',
    askLead: 'Cuenta dónde has estado o qué tipo de lugar te gusta. Responde solo con los destinos de este sitio: no inventa lugares.',
    q: ['Ya estuve en Seúl y Busan. ¿Y ahora?', 'Me gustó Jeju. ¿Algo parecido pero más tranquilo?', '¿A dónde puedo ir sin alquilar coche?', 'Cinco días en otoño, ¿a dónde me mandarías?'],
    ph: 'ej. He estado dos veces en Seúl y me gustan las montañas y las termas',
    send: 'Enviar',
    limits: 'Lo que esta página no sabe',
    limitList: [
      'Horarios, días de cierre y precios no están en nuestros datos. Confírmalos antes de ir.',
      'El ranking usa el número de atractivos <b>registrados</b>, así que una ciudad famosa por un solo lugar (la aldea hanok de Jeonju, Hahoe en Andong) queda más abajo de lo que merece.',
      'El multiplicador de aglomeración describe el <b>distrito</b>, no un lugar concreto dentro de él.',
      'Los datos de visitantes extranjeros solo cubren los 40 primeros distritos. "Sin puesto" no significa cero.'
    ],
    source: 'Datos: Organización de Turismo de Corea TourAPI (atractivos, festivales, restaurantes, cafés, alojamiento, sitios accesibles) · Datos estándar de senderos · Korea Tourism Data Lab (visitantes por distrito).',
    nameNote: 'El nombre en coreano aparece junto al romanizado a propósito: enséñale la pantalla al taxista o en la taquilla.',
    other: 'Otras visitas'
  }
};

const CSS = `
.tgrid{display:grid;gap:16px;margin:18px 0}
.tcard{background:#fff;border-radius:18px;box-shadow:0 3px 16px rgba(31,41,55,.08);overflow:hidden}
.tch{padding:16px 18px 12px}
.tch h3{font-size:1.22rem;font-weight:900;color:#0a6c63;margin:0}
.tch h3 em{font-style:normal;color:#9ca3af;font-weight:700;font-size:.72em;margin-left:6px}
.tch .tsido{font-size:.85rem;color:#6b7280;margin-top:2px}
.tbadges{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.tb{font-size:.76rem;font-weight:800;border-radius:999px;padding:5px 11px}
.tb.f{background:#eef2ff;color:#4338ca}
.tb.n{background:#f3f4f6;color:#6b7280}
.tb.hot{background:#fff1e8;color:#c2410c}
.tb.qt{background:#f2fbfa;color:#0a6c63}
.tass{display:flex;flex-wrap:wrap;gap:10px;padding:0 18px 12px;font-size:.84rem;color:#4b5563}
.tass b{color:#0a6c63;font-weight:900}
.thi{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;padding:0 18px 18px}
.thio{background:#f8fafa;border-radius:12px;overflow:hidden}
.thio img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block;background:#f0ece6}
.thio .n{padding:8px 10px;font-size:.82rem;font-weight:700;color:#374151;line-height:1.35}
.thio .n span{display:block;color:#9ca3af;font-weight:500;font-size:.92em}
.thio .k{font-size:.72rem;color:#0f9d8f;font-weight:800;padding:0 10px 8px}
.tnav{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}
.tnav a{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.9rem;padding:10px 16px;border-radius:999px;text-decoration:none}
.tnav a.on{background:#0f9d8f;border-color:#0f9d8f;color:#fff}
.tnote{background:#fff;border-radius:12px;padding:12px 14px;font-size:.83rem;color:#6b7280;line-height:1.65;margin-top:14px}
.tai{margin-top:26px}
#t-log{max-height:420px;overflow-y:auto;padding:4px 2px}
.tmsg{margin:8px 0;padding:11px 14px;border-radius:14px;font-size:.93rem;line-height:1.6;max-width:88%}
.tmsg.me{background:#0f9d8f;color:#fff;margin-left:auto;border-bottom-right-radius:4px}
.tmsg.bot{background:#fff;color:#374151;box-shadow:0 2px 10px rgba(31,41,55,.07);border-bottom-left-radius:4px}
.tqs{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
.tq{background:#fff;border:1.5px solid #dcefeb;color:#4b5563;font-size:.84rem;padding:8px 13px;border-radius:999px;cursor:pointer;font-family:inherit;text-align:left}
.tin{display:flex;gap:8px;margin-top:10px}
.tin input{flex:1;padding:12px 14px;border:1.5px solid #dcefeb;border-radius:12px;font-size:.95rem;font-family:inherit;background:#fff}
.tin button{background:#0f9d8f;color:#fff;border:none;border-radius:12px;padding:12px 20px;font-weight:800;cursor:pointer;font-family:inherit}
`;

function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
const IMG_PRE = ['http://tong.visitkorea.or.kr/cms/resource/', 'https://tong.visitkorea.or.kr/cms/resource/'];
function unimg(v) { if (!v) return ''; const i = v.indexOf('|'); if (i < 0) return v; const p = v.slice(0, i), r = v.slice(i + 1); return p === 'x' ? r : (IMG_PRE[+p] || '') + r; }

function card(d, T, monthLabel) {
  const badges = [];
  badges.push(d.fgn ? `<span class="tb f">${esc(T.fgnRank(d.fgn))}</span>` : `<span class="tb n">${esc(T.fgnNone)}</span>`);
  if (d.idx) badges.push(d.idx >= 1.15
    ? `<span class="tb hot">${esc(T.busy(monthLabel, d.idx.toFixed(2)))}</span>`
    : `<span class="tb qt">${esc(T.quiet(monthLabel, d.idx.toFixed(2)))}</span>`);

  const A = d.a || {};
  const ass = ['spot', 'walk', 'nat', 'market', 'fes', 'acc']
    .filter(k => A[k]).map(k => `<span><b>${A[k]}</b> ${esc(T.a[k])}</span>`).join('');

  const hi = (d.hi || []).slice(0, 6).map(h => {
    const img = unimg(h.g);
    const sub = h.ko ? `<span>${esc(h.ko)}</span>` : '';
    const tag = h.km ? `${h.km}km` : (h.cat === 'market' ? T.a.market : '');
    return `<div class="thio">${img ? `<img src="${esc(img)}" alt="${esc(h.n)}" loading="lazy">` : ''}`
      + `<div class="n">${esc(h.n)}${sub}</div>${tag ? `<div class="k">${esc(tag)}</div>` : ''}</div>`;
  }).join('');

  return `<div class="tcard"><div class="tch">
<h3>${esc(d.sg)} <em>${esc(d.sgKo)}</em></h3>
<div class="tsido">${esc(d.sido)}</div>
<div class="tbadges">${badges.join('')}</div>
</div>
${ass ? `<div class="tass">${ass}</div>` : ''}
${hi ? `<div class="thi">${hi}</div>` : ''}
</div>`;
}

function aiBox(T, lang, tier) {
  return `<div class="tai">
<h2 class="sec">💬 ${esc(T.askH)}</h2>
<p style="color:#6b7280;font-size:.93rem">${esc(T.askLead)}</p>
<div id="t-log"></div>
<div class="tqs">${T.q.map(q => `<button class="tq" type="button">${esc(q)}</button>`).join('')}</div>
<div class="tin"><input id="t-in" type="text" maxlength="220" placeholder="${esc(T.ph)}"><button id="t-send" type="button">${esc(T.send)}</button></div>
</div>
<script>window.TRIP={lang:'${lang}',tier:'${tier}'};</script>
<script src="/trip/app.js?v=${ASSET_V}" defer></script>`;
}

function limitsBlock(T) {
  return `<h2 class="sec">${esc(T.limits)}</h2><ul>${T.limitList.map(x => `<li>${x}</li>`).join('')}</ul>`;
}

function faqLd(items) {
  return `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: String(a).replace(/<[^>]+>/g, '') } }))
  })}</script>`;
}

function build(ctx) {
  const { ROOT, layout, writePage, SITE_NAME } = ctx;
  const urls = [];
  const HREF = { zh: 'zh-Hans', tw: 'zh-Hant' };

  LANGS.forEach(lang => {
    let pack; try { pack = JSON.parse(fs.readFileSync(path.join(ROOT, 'trip', 'd', lang + '.json'), 'utf8')); } catch (e) { return; }
    const T = L[lang]; if (!T) return;
    const month = pack.month;
    const monthLabel = (MON[lang] || MON.en)[month] || String(month);
    const total = TIERS.reduce((a, t) => a + (pack.tiers[t] || []).length, 0);
    const alts = LANGS.map(l => ({ hreflang: HREF[l] || l, href: `/${l}/trip/` }));

    const nav = cur => `<div class="tnav">` +
      `<a href="/${lang}/trip/"${cur === 'hub' ? ' class="on"' : ''}>${esc(T.hubH1.split('—')[0].trim())}</a>` +
      TIERS.map(t => `<a href="/${lang}/trip/${SLUG[t]}/"${cur === t ? ' class="on"' : ''}>${esc(T.tier[t].h1.split('—')[0].trim())}</a>`).join('') +
      `</div>`;

    // ── 허브
    {
      const preview = TIERS.map(t => {
        const list = pack.tiers[t] || [];
        return `<h2 class="sec">${esc(T.tier[t].h1)}</h2><p>${esc(T.tier[t].lead)}</p>`
          + `<div class="tgrid">${list.slice(0, 3).map(d => card(d, T, monthLabel)).join('')}</div>`
          + `<p><a class="cplink" href="/${lang}/trip/${SLUG[t]}/">${esc(T.tier[t].h1)} (${list.length}) →</a></p>`;
      }).join('');
      const faq = [
        [T.tier.first.h1, T.tier.first.lead],
        [T.tier.second.h1, T.tier.second.lead],
        [T.tier.third.h1, T.tier.third.lead]
      ];
      const content = `<main><div class="wrap"><style>${CSS}</style>
<h1 style="font-size:1.5rem;font-weight:900;margin:8px 0 6px">${esc(T.hubH1)}</h1>
<p style="color:#6b7280;font-size:.96rem">${esc(T.hubLead)}</p>
${nav('hub')}
${preview}
${aiBox(T, lang, 'all')}
${limitsBlock(T)}
<p class="tnote">${esc(T.nameNote)}</p>
<p class="note" style="margin-top:14px">${esc(T.source)}</p>
</div></main>`;
      writePage(`${lang}/trip`, layout(T.hubTitle(total) + ` | ${SITE_NAME}`, T.hubDesc, `/${lang}/trip/`, content,
        { lang, alternates: alts, jsonld: faqLd(faq), ogImage: '/img/hero.webp' }));
      urls.push(`/${lang}/trip/`);
    }

    // ── 티어 3페이지
    TIERS.forEach(t => {
      const list = pack.tiers[t] || [];
      if (list.length < 5) return;
      const TT = T.tier[t];
      const others = TIERS.filter(x => x !== t);
      const content = `<main><div class="wrap"><style>${CSS}</style>
<h1 style="font-size:1.5rem;font-weight:900;margin:8px 0 6px">${esc(TT.h1)}</h1>
<p style="color:#6b7280;font-size:.96rem">${esc(TT.lead)}</p>
${nav(t)}
<div class="tgrid">${list.map(d => card(d, T, monthLabel)).join('')}</div>
${aiBox(T, lang, t)}
${limitsBlock(T)}
<p class="tnote">${esc(T.nameNote)}</p>
<h2 class="sec">${esc(T.other)}</h2>
<div class="tnav">${others.map(x => `<a href="/${lang}/trip/${SLUG[x]}/">${esc(T.tier[x].h1)}</a>`).join('')}</div>
<p class="note" style="margin-top:14px">${esc(T.source)}</p>
</div></main>`;
      writePage(`${lang}/trip/${SLUG[t]}`, layout(TT.title + ` | ${SITE_NAME}`, TT.desc, `/${lang}/trip/${SLUG[t]}/`, content,
        { lang, alternates: LANGS.map(l => ({ hreflang: HREF[l] || l, href: `/${l}/trip/${SLUG[t]}/` })), jsonld: faqLd([[TT.h1, TT.lead]]), ogImage: '/img/hero.webp' }));
      urls.push(`/${lang}/trip/${SLUG[t]}/`);
    });
  });

  console.log('✓ /{lang}/trip/ —', urls.length, '페이지');
  return urls;
}

module.exports = { build, L, LANGS, SLUG };
