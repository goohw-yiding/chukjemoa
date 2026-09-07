// 🏛 경주 한국어 페이지 — /gyeongju/ 와 그 하위
//
// 왜 만드는가 (2026-09-07 네이버 월간 검색량 실측 + 재고 실측)
//   ⭐ 수요는 서울·부산·제주급인데 페이지가 0장이었다 —
//     **경주맛집 193,000** > **경주가볼만한곳 168,800** > **경주숙소 86,100** > 경주펜션 46,700
//     > 경주여행 36,660 > 경주카페 34,330 ≫ 경주축제 6,220 · 경주실내 2,090 · 경주1박2일 1,550
//
//   🔴 부산에서 겪은 함정이 그대로 재현됐다 — `spots_ko`(201) · `restaurants_ko`(74) · `stays_ko`(86)에
//     **개요가 한 건도 없다**(전부 0). 그대로 쓰면 「이름만 나열한 페이지」가 된다.
//   ⭐ 그런데 세어 보니 **개요 대신 더 쓸모 있는 필드**가 있었다:
//     · 맛집 → `open`(영업시간) `rest`(휴무일) `menu`(대표메뉴) `park`(주차)
//     · 숙소 → `ci`/`co`(체크인·아웃) `park` `rooms` `kind`(**한옥 45곳**)
//     「경주맛집」으로 검색하는 사람이 원하는 건 설명문이 아니라 **문 여는 시간과 쉬는 날**이다.
//   ⭐ 「가볼만한 곳」은 부산과 같은 방법 — `accessible.json`(무장애여행 정보)에 개요가 있다(경주 117/126).
//
//   ❌ **축제 페이지는 만들지 않는다** — 진행·예정 3건뿐이다(게이트 15건). 검색량 6,220이어도 줄 게 없으면 안 만든다.
//      대신 허브에 3건을 그대로 싣는다(9/18 국가유산야행 · 9/19 황금카니발 · 10/9 신라문화제).
//   ❌ **실내 페이지도 만들지 않는다** — 「경주실내 2,090」은 「경주비올때 340」의 6배로 각도는 맞지만,
//      이름으로 실내가 «확정되는» 곳이 9곳뿐이다. 확정 안 되는 것을 실내라고 우기지 않는다.
//      → 허브에 「비 오는 날」 한 줄로만 싣는다. 재료가 쌓이면 그때 페이지를 연다.
const fs = require('fs'), path = require('path');

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MN = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const d8 = s => /^\d{8}$/.test(String(s || ''));
const fmt = s => d8(s) ? `${+s.slice(4, 6)}월 ${+s.slice(6, 8)}일` : '';
const wd = s => d8(s) ? WD[new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)).getDay()] : '';
const range = (a, b) => (!d8(a)) ? '' : (a === b || !d8(b) ? `${fmt(a)}(${wd(a)})` : `${fmt(a)}(${wd(a)}) ~ ${fmt(b)}(${wd(b)})`);
const norm = s => String(s || '').replace(/[\s()（）·・\-–—_,.'"]/g, '').toLowerCase();

// ⚠️ 파일마다 최상위 모양이 다르다(배열 · {rows} · {items}) — 쓰기 전에 정규화한다.
function load(ROOT, f) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));
    return Array.isArray(d) ? d : (d.rows || d.items || []);
  } catch (e) { return []; }
}
// ⚠️ 경주 판정은 **주소의 「경주시」**로만 한다. 이름에 '경주'가 들어간 다른 지역 업소를 빨아들이지 않기 위해서다
//    (제주에서 `본가제주밥상`(경기)을 삼킨 적이 있다).
const isGJ = r => /경주시/.test(String(r.addr || ''));

// 📷 직접 촬영 사진 11장 (2026-09-05~06). ⭐사이트 콘텐츠는 대부분 관광공사 공식사진인데,
//    이건 «우리가 그 자리에 가서 찍은» 1차 자료다. 외국어 페이지에서도 같은 것을 쓴다.
//    ⚠️ 얼굴이 식별되는 사진은 뺐다. EXIF(GPS 포함)는 변환할 때 지웠다(`-map_metadata -1`).
//    ⚠️ 파일 이름은 «프레임을 열어 보고» 붙였다 — 촬영시각 추론으로 붙였다가 10개를 통째로 틀린 적이 있다.
//    순서는 실제 다닌 순서다(첨성대 저녁 → 이튿날 아침 → 불국사 → 석굴암).
const PHOTOS = [
  ['gyeongju-01-cheomseongdae', '9/5 17:42', '첨성대 — 해 질 무렵', 'Cheomseongdae at dusk', '夕暮れの瞻星台', '黄昏时的瞻星台', '黃昏時的瞻星臺', 'Cheomseongdae al atardecer'],
  ['gyeongju-02-morning-fig', '9/6 09:38', '숙소에서 맞은 아침, 무화과 한 접시', 'Morning at the guesthouse — a plate of figs', '宿の朝、いちじく一皿', '民宿的清晨，一盘无花果', '民宿的清晨，一盤無花果', 'Mañana en el alojamiento — un plato de higos'],
  ['gyeongju-03-bamboo', '9/6 12:07', '불국사 가는 길 대나무숲', 'Bamboo grove on the way to Bulguksa', '仏国寺への道の竹林', '前往佛国寺路上的竹林', '前往佛國寺路上的竹林', 'Bosque de bambú camino a Bulguksa'],
  ['gyeongju-04-bulguksa-gate', '9/6 12:08', '불국사 현판 佛國寺', 'The Bulguksa gate sign (佛國寺)', '仏国寺の扁額（佛國寺）', '佛国寺匾额（佛國寺）', '佛國寺匾額（佛國寺）', 'Cartel del templo Bulguksa (佛國寺)'],
  ['gyeongju-10-okrosu', '9/6 12:17', '토함산 옥로수(玉露水)', 'Okrosu spring water, Mt. Toham', '吐含山の玉露水', '吐含山玉露水', '吐含山玉露水', 'Manantial Okrosu, monte Toham'],
  ['gyeongju-05-dabotap', '9/6 12:20', '다보탑', 'Dabotap Pagoda', '多宝塔', '多宝塔', '多寶塔', 'Pagoda Dabotap'],
  ['gyeongju-06-seokgatap', '9/6 12:26', '석가탑', 'Seokgatap Pagoda', '釈迦塔', '释迦塔', '釋迦塔', 'Pagoda Seokgatap'],
  ['gyeongju-08-eaves-lantern', '9/6 12:35', '처마와 연등', 'Eaves and lotus lanterns', '軒と蓮の提灯', '屋檐与莲花灯', '屋簷與蓮花燈', 'Aleros y farolillos de loto'],
  ['gyeongju-07-lantern-shadow', '9/6 12:35', '바닥에 진 연등 그림자', 'Lantern shadows on the ground', '地面に落ちた提灯の影', '地面上的灯影', '地面上的燈影', 'Sombras de los farolillos en el suelo'],
  ['gyeongju-09-beomjonggak', '9/6 12:42', '범종각', 'Beomjonggak, the bell pavilion', '梵鐘閣', '梵钟阁', '梵鐘閣', 'Beomjonggak, el pabellón de la campana'],
  ['gyeongju-11-seokguram-sign', '9/6 13:34', '석굴암 석굴도 안내판 (석굴 내부는 촬영 금지)', 'Seokguram — the grotto diagram board (photography inside is not allowed)', '石窟庵 石窟図の案内板（内部は撮影禁止）', '石窟庵 石窟图解说牌（内部禁止拍照）', '石窟庵 石窟圖解說牌（內部禁止拍照）', 'Seokguram — panel del diagrama de la gruta (no se permite fotografiar el interior)']
];
const PHOTO_LANG = { ko: 2, en: 3, ja: 4, zh: 5, tw: 6, es: 7 };

function build({ ROOT, layout, writePage, SITE, SITE_NAME, TODAY, WX }) {
  const T8 = String(TODAY).replace(/-/g, '');
  const mn = +T8.slice(4, 6);
  const urls = [];

  // ── 재료
  const spotsKo = load(ROOT, 'spots_ko.json').filter(isGJ);     // 사진용(개요 없음)
  const rest = load(ROOT, 'restaurants_ko.json').filter(isGJ);  // 74 — 영업시간·휴무·대표메뉴·주차
  const stays = load(ROOT, 'stays_ko.json').filter(isGJ);       // 86 — 한옥 45·체크인/아웃·주차·객실
  const acc = load(ROOT, 'accessible.json').filter(isGJ);       // 126 — 개요 117
  const pets = load(ROOT, 'pets.json').filter(isGJ);            // 36
  const trr = load(ROOT, 'trrsrt.json').filter(r => /경주시/.test(String(r.addr || '')));

  // 축제 — 오늘 이후 끝나는 것만. ⚠️ festival_pages 의 날짜는 `20260918` 꼴이다(하이픈 없음).
  //    형식을 맞추지 않고 'YYYY-MM-DD' 와 비교하면 종료된 축제가 전부 「예정」으로 뒤집힌다.
  const fes = load(ROOT, 'festival_pages.json')
    .filter(f => f.sigungu === '경주시' && d8(String(f.end)) && String(f.end) >= T8)
    .sort((a, b) => String(a.start).localeCompare(String(b.start)));

  // ── ① 가볼만한 곳 (168,800) — 부산과 같은 방법
  const GO_CAT = ['관광지', '문화시설', '레포츠'];
  const imgIdx = new Map();
  spotsKo.forEach(r => { const k = norm(r.title); if (k && r.img && !imgIdx.has(k)) imgIdx.set(k, r.img); });
  const trrIdx = new Map();
  trr.forEach(r => { const k = norm(r.title || r.name); if (k && !trrIdx.has(k)) trrIdx.set(k, r); });
  const petSet = new Set(pets.map(r => norm(r.title)));
  const spot = acc
    .filter(r => GO_CAT.includes(r.cat) && String(r.ov || '').length >= 120 && +r.x && +r.y)
    .map(r => ({
      ...r, img: r.img || imgIdx.get(norm(r.title)) || '',
      t: trrIdx.get(norm(r.title)) || null, pet: petSet.has(norm(r.title))
    }))
    .sort((a, b) => (b.img ? 1 : 0) - (a.img ? 1 : 0));

  // ── ② 맛집 (⭐193,000) — 개요는 없지만 «영업시간·휴무일·대표메뉴·주차»가 있다
  const food = rest.filter(r => +r.x && +r.y)
    .sort((a, b) => (b.img ? 1 : 0) - (a.img ? 1 : 0) || ((b.open ? 1 : 0) - (a.open ? 1 : 0)));

  // ── ③ 숙소 (86,100 · 펜션 46,700 · 한옥스테이 7,620)
  const stay = stays.filter(r => +r.x && +r.y)
    .sort((a, b) => (b.img ? 1 : 0) - (a.img ? 1 : 0) || ((b.rooms ? 1 : 0) - (a.rooms ? 1 : 0)));
  const hanok = stay.filter(r => /한옥/.test(String(r.kind || '')));

  // ── ④ 비 오는 날 — «이름으로 실내가 확정되는 것»만. 확정 안 되는 것을 실내라 하지 않는다.
  const IN_RE = /박물관|미술관|전시관|기념관|과학관|아쿠아리움|수족관|체험관|영화관|공연장|아트센터|문화관|온천|스파/;
  const indoor = acc.filter(r => IN_RE.test(String(r.title)) && String(r.ov || '').length >= 120);

  const CSS = `<style>
.gj-h1{font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:8px 0 6px}
.gj-lead{color:#374151;font-size:1rem;line-height:1.8;margin:0 0 12px}
.gj-nav{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 18px}
.gj-nav a,.gj-nav span{display:inline-block;padding:9px 15px;border-radius:22px;font-weight:800;font-size:.92rem;text-decoration:none}
.gj-nav a{background:#fff;border:1.5px solid #e6dfd2;color:#4b4237}
.gj-nav span{background:#8a6d3b;color:#fff}
.gj-stat{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0 6px}
.gj-stat div{background:#faf7f1;border:1.5px solid #ece2d2;border-radius:12px;padding:10px 16px;font-size:.86rem;color:#6b5430;font-weight:700}
.gj-stat b{display:block;font-size:1.25rem;color:#6b5430}
.gj-grid{display:grid;gap:13px;grid-template-columns:repeat(auto-fill,minmax(262px,1fr))}
.gj-card{background:#fff;border:1px solid #ebe5db;border-radius:14px;overflow:hidden}
.gj-img{width:100%;height:150px;object-fit:cover}
.gj-body{padding:12px 14px}
.gj-body h3{font-size:1rem;font-weight:800;margin:0 0 5px;line-height:1.45;color:#111827}
.gj-meta{font-size:.86rem;color:#6b7280;margin:0 0 4px;line-height:1.6}
.gj-desc{font-size:.88rem;color:#374151;line-height:1.7;margin:6px 0}
.gj-key{font-size:.86rem;color:#374151;background:#faf7f1;border-radius:8px;padding:8px 10px;margin:6px 0;line-height:1.7}
.gj-tag{display:inline-block;background:#f1e8d8;color:#6b5430;font-size:.78rem;font-weight:800;border-radius:6px;padding:2px 8px;margin-right:4px}
.gj-note{color:#9aa3af;font-size:.82rem;line-height:1.7;margin-top:16px}
.gj-line{color:#6b7280;font-size:.93rem;line-height:1.9;margin:6px 0 0}
.gj-photos{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));margin:10px 0 4px}
.gj-photos figure{margin:0;background:#fff;border:1px solid #ebe5db;border-radius:14px;overflow:hidden}
.gj-photos img{width:100%;height:210px;object-fit:cover;display:block}
.gj-photos figcaption{padding:9px 12px;font-size:.86rem;color:#374151;line-height:1.55}
.gj-photos figcaption span{display:block;color:#9aa3af;font-size:.79rem;margin-top:2px}
</style>`;

  const nav = cur => `<div class="gj-nav">${[
    ['', '🏛 경주 전체'], ['spot', '📍 가볼만한 곳'], ['food', '🍽 맛집'], ['stay', '🛏 숙소']
  ].map(([k, label]) => cur === k ? `<span>${label}</span>`
    : `<a href="/gyeongju/${k ? k + '/' : ''}">${label}</a>`).join('')}</div>`;

  const kindLine = (list, label) => {
    const c = {};
    list.forEach(r => { const g = r.kind || r.cat || '기타'; c[g] = (c[g] || 0) + 1; });
    const top = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 12);
    return top.length ? `<p class="gj-line">${label}: ${top.map(([k, n]) => `${esc(k)} <b>${n}</b>`).join(' · ')}</p>` : '';
  };

  // ⭐ 카드에 설명이 없는 페이지(맛집·숙소)는 그대로 두면 얇아진다(첫 빌드에서 숙소 2,693자).
  //    지어내서 채우지 않고 **가진 값을 세어서** 말한다 — 축제모아가 다른 데서 쓰는 방법 그대로다.
  const pct = (n, d) => d ? Math.round(n / d * 100) : 0;
  const countBy = (list, fn) => list.filter(fn).length;
  const hourOf = s => { const m = String(s || '').match(/(\d{1,2})\s*:\s*(\d{2})\s*[~-]/); return m ? +m[1] : null; };
  const closeHourOf = s => { const m = String(s || '').match(/[~-]\s*(\d{1,2})\s*:\s*(\d{2})/); return m ? +m[1] : null; };

  const SRC_ACC = `<p class="gj-note">데이터 출처: 한국관광공사 <b>무장애여행 정보</b>(장소·설명) · 행정안전부 전국관광지정보표준데이터(주차 대수·수용 인원) · Open-Meteo(날씨).
⚠️ <b>「무장애여행 정보에 등록된 곳」이라는 뜻이지, 모든 시설이 완전히 무장애라는 뜻은 아닙니다.</b>
경사·출입구·화장실 같은 실제 접근성은 방문 전 각 시설에 확인하세요.</p>`;
  const SRC_TOUR = `<p class="gj-note">데이터 출처: 한국관광공사 TourAPI. <b>영업시간·휴무일·대표메뉴·주차는 업소가 등록한 시점의 값</b>이라 현장과 다를 수 있습니다 —
가시기 전에 전화로 확인하세요. <b>등록돼 있지 않은 항목은 비워 뒀습니다</b>(추측해서 채우지 않습니다).</p>`;

  // ⭐ 「숫자로 본 …」 — 전부 위 데이터를 «세어서» 나온 값이다. 하나도 지어내지 않았다.
  const foodFacts = () => {
    const n = food.length;
    const noRest = countBy(food, r => /연중무휴|무휴/.test(String(r.rest || '')));
    const sun = countBy(food, r => /일요일|일\s*요일/.test(String(r.rest || '')));
    const mon = countBy(food, r => /월요일/.test(String(r.rest || '')));
    const late = countBy(food, r => { const h = closeHourOf(r.open); return h !== null && (h >= 21 || h <= 3); });
    const early = countBy(food, r => { const h = hourOf(r.open); return h !== null && h <= 8; });
    const park = countBy(food, r => /가능/.test(String(r.park || '')));
    const noPark = countBy(food, r => /불가|없음/.test(String(r.park || '')));
    const hansik = countBy(food, r => String(r.kind || '') === '한식');
    return `<div class="gj-key" style="padding:14px 16px;margin:0 0 16px">
<b style="font-size:1.02rem">숫자로 본 경주 맛집 ${n}곳</b><br>
· <b>한식이 ${hansik}곳(${pct(hansik, n)}%)</b>입니다. 경주는 메뉴 폭이 넓은 도시가 아니라 <b>한 종류가 두꺼운</b> 도시입니다.<br>
· <b>연중무휴로 등록된 곳이 ${noRest}곳</b>입니다. 나머지는 쉬는 날이 있습니다 — 일요일 휴무 ${sun}곳, 월요일 휴무 ${mon}곳.<br>
· <b>밤 9시 이후까지 여는 곳이 ${late}곳</b>, <b>아침 8시 전에 여는 곳이 ${early}곳</b>입니다.
저녁 늦게 도착하는 일정이라면 이 ${late}곳 안에서 고르는 편이 안전합니다.<br>
· <b>주차 가능 ${park}곳</b>${noPark ? ` · 주차 불가로 명시된 곳 ${noPark}곳` : ''}. 경주는 시내 골목 식당이 많아 주차가 실제로 갈리는 조건입니다.<br>
⚠️ 여기 숫자는 <b>업소가 공공데이터에 등록한 값</b>을 센 것입니다. 등록하지 않은 곳은 어느 쪽으로도 세지 않았습니다.
</div>`;
  };

  const stayFacts = () => {
    const n = stay.length;
    const ci15 = countBy(stay, r => /^15/.test(String(r.ci || '')));
    const co11 = countBy(stay, r => /^11/.test(String(r.co || '')));
    const park = countBy(stay, r => /가능/.test(String(r.park || '')));
    const small = countBy(stay, r => +r.rooms > 0 && +r.rooms <= 5);
    const big = countBy(stay, r => +r.rooms >= 20);
    const roomsN = countBy(stay, r => +r.rooms > 0);
    return `<div class="gj-key" style="padding:14px 16px;margin:0 0 16px">
<b style="font-size:1.02rem">숫자로 본 경주 숙소 ${n}곳</b><br>
· <b>한옥이 ${hanok.length}곳(${pct(hanok.length, n)}%)</b>으로 절반 가까이입니다. 다른 도시에서는 보기 어려운 비율입니다.<br>
· 객실 수가 등록된 ${roomsN}곳 중 <b>5실 이하가 ${small}곳</b>, <b>20실 이상이 ${big}곳</b>입니다.
작은 곳이 많다는 것은 <b>주말·연휴에 금방 찬다</b>는 뜻이기도 합니다.<br>
· <b>체크인 15시가 ${ci15}곳 · 체크아웃 11시가 ${co11}곳</b>으로 가장 흔합니다.
경주는 불국사·석굴암이 오전에 덜 붐비니, 체크아웃 뒤가 아니라 <b>도착 전날 또는 이른 오전</b>에 붙이는 편이 낫습니다.<br>
· <b>주차 가능으로 등록된 곳이 ${park}곳</b>입니다.<br>
⚠️ <b>가격은 싣지 않습니다.</b> 공개 데이터에 없고, 날짜마다 달라지는 값을 적어 두면 그게 틀린 정보가 됩니다.
</div>`;
  };

  // 📷 직접 찍은 사진 — 이 사이트가 다른 데서 못 가져오는 유일한 재료다.
  const photoStrip = () => `<h2 class="sec">직접 다녀와서 찍었습니다 — 2026년 9월</h2>
<p class="gj-lead">아래 <b>${PHOTOS.length}장</b>은 관광공사 사진이 아니라 <b>2026년 9월 5~6일에 저희가 직접 찍은 사진</b>입니다.
보도블록 상태, 그날 하늘, 안내판에 실제로 뭐라고 적혀 있는지 — 공식 사진에는 안 나오는 것들입니다.</p>
<div class="gj-photos">${PHOTOS.map(p => `<figure>
<img src="/img/${p[0]}.webp" alt="${esc(p[2])}" loading="lazy" width="900" onerror="this.closest('figure').remove()">
<figcaption><b>${esc(p[2])}</b><span>${esc(p[1])}</span></figcaption></figure>`).join('')}</div>
<p class="gj-note">직접 촬영 · 얼굴이 나오는 사진은 싣지 않았습니다. 촬영 위치정보(EXIF)는 지웠습니다.</p>`;

  const spotCard = p => {
    const wx = (WX && p.x && p.y) ? WX.now(p.x, p.y) : '';
    const t = p.t;
    return `<div class="gj-card">
${p.img ? `<img class="gj-img" src="${esc(String(p.img).replace(/^http:/, 'https:'))}" alt="${esc(p.title)}" loading="lazy" onerror="this.remove()">` : ''}
<div class="gj-body"><h3>${esc(p.title)}</h3>
<p class="gj-meta">📍 경주${p.cat ? ` · ${esc(p.cat)}` : ''}${wx}</p>
${t && (t.park || t.cap) ? `<p class="gj-meta">${t.park ? `🅿️ 주차 ${esc(String(t.park))}대 ` : ''}${t.cap ? `· 수용 ${esc(String(t.cap))}명` : ''}</p>` : ''}
<p class="gj-desc">${esc(String(p.ov).slice(0, 190))}…</p>
<p class="gj-meta"><span class="gj-tag">♿ 무장애여행 등록</span>${p.pet ? '<span class="gj-tag">🐾 반려견 동반</span>' : ''}</p>
</div></div>`;
  };

  // ⭐ 맛집 카드 — 설명이 없는 대신 «가기 전에 확인해야 하는 것»을 준다.
  const foodCard = r => {
    const wx = (WX && r.x && r.y) ? WX.now(r.x, r.y) : '';
    const bits = [];
    if (r.open) bits.push(`🕘 ${esc(String(r.open).slice(0, 46))}`);
    if (r.rest) bits.push(`🚫 ${esc(String(r.rest).slice(0, 26))}`);
    if (r.menu) bits.push(`🍽 ${esc(String(r.menu).slice(0, 40))}`);
    if (r.park) bits.push(`🅿️ 주차 ${esc(String(r.park).slice(0, 18))}`);
    return `<div class="gj-card">
${r.img ? `<img class="gj-img" src="${esc(String(r.img).replace(/^http:/, 'https:'))}" alt="${esc(r.title)}" loading="lazy" onerror="this.remove()">` : ''}
<div class="gj-body"><h3>${esc(r.title)}</h3>
<p class="gj-meta">${r.kind ? `<span class="gj-tag">${esc(r.kind)}</span>` : ''}${esc(String(r.addr).replace('경상북도 경주시 ', '').slice(0, 34))}${wx}</p>
${bits.length ? `<div class="gj-key">${bits.join('<br>')}</div>` : ''}
</div></div>`;
  };

  const stayCard = r => {
    const bits = [];
    if (r.ci || r.co) bits.push(`🕒 체크인 ${esc(r.ci || '-')} · 체크아웃 ${esc(r.co || '-')}`);
    if (r.rooms) bits.push(`🚪 객실 ${esc(String(r.rooms))}실`);
    if (r.park) bits.push(`🅿️ 주차 ${esc(String(r.park).slice(0, 18))}`);
    return `<div class="gj-card">
${r.img ? `<img class="gj-img" src="${esc(String(r.img).replace(/^http:/, 'https:'))}" alt="${esc(r.title)}" loading="lazy" onerror="this.remove()">` : ''}
<div class="gj-body"><h3>${esc(r.title)}</h3>
<p class="gj-meta">${r.kind ? `<span class="gj-tag">${esc(r.kind)}</span>` : ''}${esc(String(r.addr).replace('경상북도 경주시 ', '').slice(0, 34))}</p>
${bits.length ? `<div class="gj-key">${bits.join('<br>')}</div>` : ''}
</div></div>`;
  };

  const fesCard = f => `<div class="gj-card">
${f.img ? `<img class="gj-img" src="${esc(String(f.img).replace(/^http:/, 'https:'))}" alt="${esc(f.title)}" loading="lazy" onerror="this.remove()">` : ''}
<div class="gj-body"><h3><a href="/festival/${esc(f.slug)}/" style="color:#111827;text-decoration:none">${esc(f.title)}</a></h3>
<p class="gj-meta">📅 ${esc(range(String(f.start), String(f.end)))}</p>
<p class="gj-meta"><a href="/festival/${esc(f.slug)}/" style="color:#8a6d3b;font-weight:800">자세히 보기 →</a></p>
</div></div>`;

  const mk = (slug, title, desc, h1, lead, cur, body) => {
    const content = `<main><div class="wrap">${CSS}
${slug ? `<p style="font-size:.85rem;color:#9aa3af;margin:8px 0"><a href="/" style="color:#8a6d3b">홈</a> › <a href="/gyeongju/" style="color:#8a6d3b">경주</a></p>` : ''}
<h1 class="gj-h1">${h1}</h1>
<p class="gj-lead">${lead}</p>
${nav(cur)}
${body}
</div></main>`;
    writePage('gyeongju' + (slug ? '/' + slug : ''), layout(title, desc, `/gyeongju/${slug ? slug + '/' : ''}`, content));
    urls.push(`/gyeongju/${slug ? slug + '/' : ''}`);
  };

  // ── 페이지 ①  가볼만한 곳 (168,800)
  if (spot.length >= 30) {
    mk('spot',
      `경주 가볼만한 곳 ${MN[mn]} — 관광지 ${spot.length}곳 총정리 | ${SITE_NAME}`,
      `경주 가볼만한 곳 ${spot.length}곳을 설명·주차·오늘 날씨와 함께 정리했습니다. 한국관광공사 공개 데이터 기준.`,
      `📍 경주 가볼만한 곳 ${spot.length}곳`,
      `경주에서 가볼 만한 곳 <b>${spot.length}곳</b>입니다. 설명이 등록된 <b>관광지·문화시설·레포츠</b>만 골랐고(숙박·쇼핑·음식점은 뺐습니다),
좌표가 있는 곳에는 <b>오늘 날씨</b>가 붙습니다. 이 목록은 한국관광공사 <b>무장애여행 정보</b>에 등록된 곳이라
<b>휠체어·유모차로 갈 만한지</b> 참고가 됩니다.`,
      'spot',
      `${photoStrip()}${kindLine(spot, '분류별')}<div class="gj-grid">${spot.slice(0, 80).map(spotCard).join('')}</div>${SRC_ACC}`);
  }

  // ── 페이지 ②  맛집 (⭐193,000 — 경주에서 가장 큰 검색어)
  if (food.length >= 30) {
    const openN = food.filter(r => r.open).length, restN = food.filter(r => r.rest).length;
    const menuN = food.filter(r => r.menu).length, parkN = food.filter(r => r.park).length;
    mk('food',
      `경주 맛집 ${food.length}곳 — 영업시간·휴무일·대표메뉴·주차 총정리 | ${SITE_NAME}`,
      `경주 맛집 ${food.length}곳의 영업시간 ${openN}곳, 휴무일 ${restN}곳, 대표메뉴 ${menuN}곳, 주차 가능 여부 ${parkN}곳을 한 번에. 한국관광공사 공개 데이터 기준.`,
      `🍽 경주 맛집 ${food.length}곳`,
      `경주 음식점 <b>${food.length}곳</b>입니다. 맛 평가는 하지 않습니다 — 대신 <b>가기 전에 확인해야 하는 것</b>을 모았습니다.
<b>영업시간 ${openN}곳 · 휴무일 ${restN}곳 · 대표메뉴 ${menuN}곳 · 주차 ${parkN}곳</b>에 등록된 값이 있습니다.
⚠️ 헛걸음의 대부분은 맛이 아니라 <b>쉬는 날</b> 때문에 생깁니다.`,
      'food',
      `${foodFacts()}${kindLine(food, '음식 종류별')}<div class="gj-grid">${food.slice(0, 74).map(foodCard).join('')}</div>${SRC_TOUR}`);
  }

  // ── 페이지 ③  숙소 (86,100 · 펜션 46,700 · 한옥스테이 7,620)
  if (stay.length >= 30) {
    const ciN = stay.filter(r => r.ci).length, parkN = stay.filter(r => r.park).length;
    mk('stay',
      `경주 숙소 ${stay.length}곳 — 한옥 ${hanok.length}곳·체크인 시간·주차 총정리 | ${SITE_NAME}`,
      `경주 숙소 ${stay.length}곳을 종류별로 정리했습니다. 한옥 ${hanok.length}곳, 체크인·체크아웃 시간 ${ciN}곳, 주차 정보 ${parkN}곳.`,
      `🛏 경주 숙소 ${stay.length}곳`,
      `경주 숙박시설 <b>${stay.length}곳</b>입니다. 그중 <b>한옥이 ${hanok.length}곳</b>으로 가장 많습니다 — 경주 숙소 검색에서 한옥을 찾는 사람이 많은 이유이기도 합니다.
가격은 싣지 않습니다(공개 데이터에 없고, 날짜마다 달라집니다). 대신 <b>체크인·체크아웃 시간 ${ciN}곳 · 주차 ${parkN}곳 · 객실 수</b>를 실었습니다.`,
      'stay',
      `${stayFacts()}${kindLine(stay, '종류별')}<div class="gj-grid">${stay.slice(0, 86).map(stayCard).join('')}</div>${SRC_TOUR}`);
  }

  // ── 외국어 링크는 «실제로 만들어진 언어»만 건다.
  // ⚠️ intl-city.js 에 게이트(장소 20곳)가 있다. 전체 언어를 찍으면 404 내부 링크가 생긴다
  //    — 2026-09-04에 `/tw/seoul/` 등으로 끊긴 링크 4건을 만든 적이 있다.
  //    그래서 «같은 판정식»을 여기서 다시 돌려 통과한 언어만 링크한다.
  const LANG_NAME = { en: 'English', ja: '日本語', zh: '简体中文', tw: '繁體中文', es: 'Español' };
  const intlReady = Object.keys(LANG_NAME).filter(lang => {
    const p = load(ROOT, `places_${lang}.json`)
      .filter(r => r.sido === '경북' && +r.x && +r.y
        && String(r.ov || '').length >= 120 && r.addrKo && /경주시/.test(String(r.addrKo)));
    return p.length >= 20;
  });

  // ── 허브
  const hub = `<div class="gj-stat">
<div><b>${spot.length}</b>가볼만한 곳</div><div><b>${food.length}</b>맛집</div>
<div><b>${stay.length}</b>숙소</div><div><b>${hanok.length}</b>한옥</div>${fes.length ? `<div><b>${fes.length}</b>다가오는 축제</div>` : ''}
<div><b>${PHOTOS.length}</b>직접 찍은 사진</div>
</div>
${photoStrip()}
${fes.length ? `<h2 class="sec">다가오는 축제</h2>
<div class="gj-grid">${fes.map(fesCard).join('')}</div>
<p class="gj-note">진행·예정인 축제만 실었습니다. 경주는 지금 <b>${fes.length}건</b>이라 별도 축제 페이지는 만들지 않았습니다 — 목록이 짧은데 페이지를 나누면 읽을 게 없어집니다.</p>` : ''}
<h2 class="sec">가볼만한 곳</h2>
<div class="gj-grid">${spot.slice(0, 8).map(spotCard).join('')}</div>
<p style="margin:10px 0"><a href="/gyeongju/spot/" style="color:#8a6d3b;font-weight:800">경주 가볼만한 곳 ${spot.length}곳 전체 보기 →</a></p>
<h2 class="sec">맛집</h2>
<div class="gj-grid">${food.slice(0, 6).map(foodCard).join('')}</div>
<p style="margin:10px 0"><a href="/gyeongju/food/" style="color:#8a6d3b;font-weight:800">경주 맛집 ${food.length}곳 전체 보기 →</a></p>
<h2 class="sec">숙소</h2>
<div class="gj-grid">${stay.slice(0, 6).map(stayCard).join('')}</div>
<p style="margin:10px 0"><a href="/gyeongju/stay/" style="color:#8a6d3b;font-weight:800">경주 숙소 ${stay.length}곳 전체 보기 →</a></p>
${indoor.length ? `<h2 class="sec">비 오는 날</h2>
<p class="gj-lead">이름만으로 <b>실내인 것이 확실한 곳</b> ${indoor.length}곳입니다. 애매한 곳은 넣지 않았습니다.</p>
<p class="gj-line">${indoor.map(r => esc(r.title)).join(' · ')}</p>` : ''}
<h2 class="sec">다른 곳도 보기</h2>
<div class="gj-nav"><a href="/seoul/">🏙 서울</a><a href="/busan/">🌊 부산</a><a href="/jeju/">🍊 제주</a><a href="/search/?region=경북">🔎 경북 축제 검색</a>${
    intlReady.map(l => `<a href="/${l}/gyeongju/">🌏 ${LANG_NAME[l]}</a>`).join('')}</div>
${SRC_ACC}`;

  mk('', `경주 가볼만한 곳·맛집·숙소 ${MN[mn]} — 지금 갈 만한 ${spot.length + food.length + stay.length}곳 | ${SITE_NAME}`,
    `경주 가볼만한 곳 ${spot.length}곳, 맛집 ${food.length}곳, 숙소 ${stay.length}곳(한옥 ${hanok.length}곳)을 한곳에. 영업시간·휴무일·주차·날씨까지 공공데이터 기준으로.`,
    `🏛 경주 — 가볼만한 곳·맛집·숙소`,
    `경주에서 <b>지금 갈 만한 곳</b>을 한곳에 모았습니다. 가볼만한 곳 ${spot.length}곳 · 맛집 ${food.length}곳 · 숙소 ${stay.length}곳(<b>한옥 ${hanok.length}곳</b>)${fes.length ? ` · 다가오는 축제 ${fes.length}건` : ''}.`,
    '', hub);

  console.log(`✓ /gyeongju/ — ${urls.length}페이지 (가볼만한곳 ${spot.length} · 맛집 ${food.length} · 숙소 ${stay.length}(한옥 ${hanok.length}) · 축제 ${fes.length} · 실내 ${indoor.length})`);
  if (intlReady.length) console.log(`   🌏 외국어 링크: ${intlReady.join(', ')}`);
  else console.log('   ⚠️ 외국어 게이트 통과 언어 없음 — 링크를 걸지 않았습니다');
  return urls;
}

// ⭐ PHOTOS 는 intl-city.js 가 가져다 쓴다(외국어 페이지에도 같은 사진·같은 순서로 싣는다).
module.exports = { build, PHOTOS, PHOTO_LANG };
