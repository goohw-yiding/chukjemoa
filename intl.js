// 🌐 외국어 전용 페이지 — 외국인이 한국에 오기 전에 제일 궁금해하는 것
//
// ⚠️ 2026-08-10 실측에서 나온 방향 전환:
//    처음엔 "외국어 월별 캘린더 5개어 × 12개월"을 만들려 했는데, 외국어 축제 데이터를 세어 보니
//    **지금 진행/예정인 것이 언어당 50~70건뿐이고 그마저 10월에 몰려 있었다**(en 219건 중 67건만 유효).
//    TourAPI가 번역해 주는 축제가 한국어의 1/4밖에 안 되기 때문이다.
//    → 그래서 캘린더의 뼈대는 **한국어 축제 데이터(진행/예정 211건)** 로 깔고,
//      좌표+시작일이 일치하는 것만 공식 번역 제목으로 덮어쓴다(en 124건 일치).
//      번역이 없는 축제는 로마자 + 한글 병기로 보여준다.
//      **외국인에게는 "그런 축제가 있다는 걸 아는 것" 자체가 먼저이고,
//        네이버·카카오 지도에 넣을 한글 원제가 오히려 실질적으로 필요하다.**
//
// 여기서 만드는 것 (언어당):
//   /{lang}/closed/        — 문 닫는 날 (공휴일·요일 휴무·브레이크타임)  ★차별성 최고
//   /{lang}/access/        — 무장애 여행 (한국관광공사 등록 8,919곳)
//   /{lang}/calendar/      — 언제 가야 하나 (달별 축제 수·붐빔·공휴일)
//   /{lang}/calendar/{yyyy-mm}/ — 그 달에 열리는 축제
//
// 원칙: **우리 데이터로 말할 수 있는 것만 쓴다.** K-ETA·T머니·유심은 우리 데이터가 아니라 안 쓴다.
'use strict';
const fs = require('fs'), path = require('path');
const { romanizeMixed } = require('./placename.js');

const LANGS = ['en', 'ja', 'es', 'zh', 'tw'];
const HREF = { en: 'en', ja: 'ja', es: 'es', zh: 'zh-Hans', tw: 'zh-Hant' };

function load(f) { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { return []; } }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
const nf = n => Number(n || 0).toLocaleString('en-US');

// 시도 이름 — 로마자 변환기에 맡기면 '전북'이 'Jeonbuk'이 아니라 이상하게 나올 수 있어 표로 고정한다
const SIDO = {
  '서울': { en: 'Seoul', ja: 'ソウル', es: 'Seúl', zh: '首尔', tw: '首爾' },
  '부산': { en: 'Busan', ja: '釜山', es: 'Busan', zh: '釜山', tw: '釜山' },
  '대구': { en: 'Daegu', ja: '大邱', es: 'Daegu', zh: '大邱', tw: '大邱' },
  '인천': { en: 'Incheon', ja: '仁川', es: 'Incheon', zh: '仁川', tw: '仁川' },
  '광주': { en: 'Gwangju', ja: '光州', es: 'Gwangju', zh: '光州', tw: '光州' },
  '대전': { en: 'Daejeon', ja: '大田', es: 'Daejeon', zh: '大田', tw: '大田' },
  '울산': { en: 'Ulsan', ja: '蔚山', es: 'Ulsan', zh: '蔚山', tw: '蔚山' },
  '세종': { en: 'Sejong', ja: '世宗', es: 'Sejong', zh: '世宗', tw: '世宗' },
  '경기': { en: 'Gyeonggi', ja: '京畿道', es: 'Gyeonggi', zh: '京畿道', tw: '京畿道' },
  '강원': { en: 'Gangwon', ja: '江原道', es: 'Gangwon', zh: '江原道', tw: '江原道' },
  '충북': { en: 'North Chungcheong', ja: '忠清北道', es: 'Chungcheong del Norte', zh: '忠清北道', tw: '忠清北道' },
  '충남': { en: 'South Chungcheong', ja: '忠清南道', es: 'Chungcheong del Sur', zh: '忠清南道', tw: '忠清南道' },
  '전북': { en: 'North Jeolla', ja: '全羅北道', es: 'Jeolla del Norte', zh: '全罗北道', tw: '全羅北道' },
  '전남': { en: 'South Jeolla', ja: '全羅南道', es: 'Jeolla del Sur', zh: '全罗南道', tw: '全羅南道' },
  '경북': { en: 'North Gyeongsang', ja: '慶尚北道', es: 'Gyeongsang del Norte', zh: '庆尚北道', tw: '慶尚北道' },
  '경남': { en: 'South Gyeongsang', ja: '慶尚南道', es: 'Gyeongsang del Sur', zh: '庆尚南道', tw: '慶尚南道' },
  '제주': { en: 'Jeju', ja: '済州', es: 'Jeju', zh: '济州', tw: '濟州' }
};
const sido = (k, lang) => (SIDO[k] && SIDO[k][lang]) || romanizeMixed(k);

// 공식 번역이 없는 축제는 로마자로 쓸 수밖에 없는데, 그대로 두면 '지상군페스티벌' 이
// "Jisanggunpeseutibeol" 이 된다 — 원어민에게는 읽을 수 없는 글자다.
// 축제 이름의 절반은 「고유명사 + 축제/페스티벌」 구조라, 뒤에 붙는 일반명사만 그 언어로 바꿔 준다.
// (placename.js 가 지명에 하는 것과 같은 처리 — 여기선 축제 이름용)
const FES_SUF = [
  ['페스티벌', { en: 'Festival', ja: 'フェスティバル', es: 'Festival', zh: '庆典', tw: '慶典' }],
  ['페스티발', { en: 'Festival', ja: 'フェスティバル', es: 'Festival', zh: '庆典', tw: '慶典' }],
  ['페스타', { en: 'Festa', ja: 'フェスタ', es: 'Festa', zh: '庆典', tw: '慶典' }],
  ['대축제', { en: 'Grand Festival', ja: '大祭り', es: 'Gran Festival', zh: '大庆典', tw: '大慶典' }],
  ['문화축제', { en: 'Culture Festival', ja: '文化祭り', es: 'Festival Cultural', zh: '文化庆典', tw: '文化慶典' }],
  ['문화제', { en: 'Culture Festival', ja: '文化祭', es: 'Festival Cultural', zh: '文化节', tw: '文化節' }],
  ['예술제', { en: 'Arts Festival', ja: '芸術祭', es: 'Festival de Artes', zh: '艺术节', tw: '藝術節' }],
  ['축제', { en: 'Festival', ja: '祭り', es: 'Festival', zh: '庆典', tw: '慶典' }],
  ['축전', { en: 'Festival', ja: '祭典', es: 'Festival', zh: '庆典', tw: '慶典' }],
  ['박람회', { en: 'Expo', ja: '博覧会', es: 'Feria', zh: '博览会', tw: '博覽會' }],
  ['한마당', { en: 'Festival', ja: '祭り', es: 'Festival', zh: '庆典', tw: '慶典' }]
];
function festName(koTitle, lang) {
  const s = String(koTitle || '').trim();
  for (const [suf, label] of FES_SUF) {
    if (s.length > suf.length + 1 && s.endsWith(suf)) {
      const base = romanizeMixed(s.slice(0, -suf.length)).replace(/[\s·\-]+$/, '');
      if (base) return base + ' ' + (label[lang] || label.en);
    }
  }
  return romanizeMixed(s);
}

// 공휴일 이름 — 한글 그대로 두면 못 읽는다
const HOL = {
  '설날': { en: 'Seollal (Lunar New Year)', ja: '旧正月（ソルラル）', es: 'Seollal (Año Nuevo Lunar)', zh: '春节（韩国新年）', tw: '春節（韓國新年）' },
  '추석': { en: 'Chuseok (Korean Thanksgiving)', ja: '秋夕（チュソク）', es: 'Chuseok (Acción de Gracias coreana)', zh: '中秋节（秋夕）', tw: '中秋節（秋夕）' },
  '1월1일': { en: "New Year's Day", ja: '元日', es: 'Año Nuevo', zh: '元旦', tw: '元旦' },
  '삼일절': { en: 'Independence Movement Day', ja: '三一節', es: 'Día del Movimiento de Independencia', zh: '三一节', tw: '三一節' },
  '노동절': { en: 'Labour Day', ja: 'メーデー', es: 'Día del Trabajo', zh: '劳动节', tw: '勞動節' },
  '어린이날': { en: "Children's Day", ja: 'こどもの日', es: 'Día del Niño', zh: '儿童节', tw: '兒童節' },
  '부처님오신날': { en: "Buddha's Birthday", ja: '釈迦誕生日', es: 'Nacimiento de Buda', zh: '佛诞节', tw: '佛誕節' },
  '현충일': { en: 'Memorial Day', ja: '顕忠日', es: 'Día de los Caídos', zh: '显忠日', tw: '顯忠日' },
  '제헌절': { en: 'Constitution Day', ja: '制憲節', es: 'Día de la Constitución', zh: '制宪节', tw: '制憲節' },
  '광복절': { en: 'Liberation Day', ja: '光復節', es: 'Día de la Liberación', zh: '光复节', tw: '光復節' },
  '개천절': { en: 'National Foundation Day', ja: '開天節', es: 'Día de la Fundación Nacional', zh: '开天节', tw: '開天節' },
  '한글날': { en: 'Hangeul Day', ja: 'ハングルの日', es: 'Día del Hangeul', zh: '韩文日', tw: '韓文日' },
  '기독탄신일': { en: 'Christmas Day', ja: 'クリスマス', es: 'Navidad', zh: '圣诞节', tw: '聖誕節' }
};
function holName(n, lang) {
  const sub = String(n).match(/^대체공휴일\((.+)\)$/);
  if (sub) {
    const base = (HOL[sub[1]] && HOL[sub[1]][lang]) || sub[1];
    const w = { en: 'Substitute holiday', ja: '振替休日', es: 'Día festivo sustitutivo', zh: '替代公休日', tw: '替代公休日' }[lang];
    return `${w} — ${base}`;
  }
  return (HOL[n] && HOL[n][lang]) || n;
}

const WD = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ja: ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'],
  es: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  zh: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  tw: ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
};
const MONN = {
  en: ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  ja: ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  zh: ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  tw: ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
};
function monthLabel(ym, lang) {
  const y = ym.slice(0, 4), m = +ym.slice(5, 7);
  return (lang === 'ja' || lang === 'zh' || lang === 'tw') ? `${y}年${m}月`
    : (lang === 'es' ? `${MONN.es[m]} de ${y}` : `${MONN.en[m]} ${y}`);
}
function dateLabel(d, lang) {
  const y = d.slice(0, 4), m = +d.slice(5, 7), dd = +d.slice(8, 10);
  const w = WD[lang][new Date(+y, m - 1, dd).getDay()];
  return (lang === 'ja' || lang === 'zh' || lang === 'tw') ? `${m}月${dd}日 (${w})`
    : (lang === 'es' ? `${dd} ${MONN.es[m]} (${w})` : `${MONN.en[m]} ${dd} (${w})`);
}

const CSS = `
.ic-h1{font-size:1.55rem;font-weight:900;letter-spacing:-.02em;margin:10px 0 6px;line-height:1.3}
.ic-lead{color:#4b5563;font-size:1rem;line-height:1.75;margin-bottom:16px}
.ic-warn{background:#fff5f2;border-left:5px solid #E0502F;border-radius:0 14px 14px 0;padding:16px 18px;margin:18px 0}
.ic-warn h2{font-size:1.05rem;font-weight:900;color:#c2410c;margin:0 0 6px}
.ic-warn p{font-size:.95rem;color:#4b5563;line-height:1.7;margin:0}
.ic-card{background:#fff;border-radius:16px;box-shadow:0 3px 14px rgba(31,41,55,.08);padding:18px 20px;margin:16px 0}
.ic-card h2{font-size:1.12rem;font-weight:900;color:#1f2937;margin:0 0 10px}
.ic-card h3{font-size:1rem;font-weight:800;color:#0a6c63;margin:16px 0 6px}
.ic-card p{font-size:.94rem;color:#4b5563;line-height:1.75;margin:0 0 10px}
.ic-tbl{width:100%;border-collapse:collapse;font-size:.9rem;margin:10px 0}
.ic-tbl th{text-align:left;font-weight:800;color:#0a6c63;border-bottom:2px solid #dcefeb;padding:8px 6px;white-space:nowrap}
.ic-tbl td{border-bottom:1px solid #f0f2f4;padding:8px 6px;color:#374151;vertical-align:top}
.ic-tbl td.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.ic-bar{display:flex;align-items:center;gap:8px;margin:5px 0;font-size:.9rem}
.ic-bar .l{width:104px;color:#374151;flex:none}
.ic-bar .b{flex:1;background:#eef2f4;border-radius:999px;height:11px;overflow:hidden}
.ic-bar .b i{display:block;height:100%;background:#0f9d8f;border-radius:999px}
.ic-bar .b i.hot{background:#E0502F}
.ic-bar .v{width:74px;text-align:right;color:#6b7280;flex:none;font-variant-numeric:tabular-nums}
.ic-kr{font-weight:600;opacity:.72;font-size:.88em}
.ic-note{font-size:.86rem;color:#8a929c;line-height:1.7}
.ic-fest{list-style:none;padding:0;margin:10px 0}
.ic-fest li{border-bottom:1px solid #f0f2f4;padding:11px 2px}
.ic-fest li:last-child{border-bottom:0}
.ic-fest .t{font-weight:800;color:#1f2937;font-size:.97rem}
.ic-fest .m{font-size:.85rem;color:#6b7280;margin-top:3px;line-height:1.6}
.ic-fest a.map{font-size:.83rem;font-weight:700;color:#0f9d8f;text-decoration:none}
.ic-nav{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}
.ic-nav a{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.88rem;padding:9px 15px;border-radius:999px;text-decoration:none}
.ic-nav a:hover{background:#e2f5f2}
.ic-nav a.on{background:#0f9d8f;border-color:#0f9d8f;color:#fff}
`;

function bar(label, v, max, hot) {
  const w = Math.max(3, Math.round(v / max * 100));
  return `<div class="ic-bar"><div class="l">${label}</div><div class="b"><i class="${hot ? 'hot' : ''}" style="width:${w}%"></i></div><div class="v">${nf(v)}</div></div>`;
}
function kakao(name, x, y) {
  return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${y},${x}`;
}

// ─────────────────────────────────────────────────────────────
function build(ctx) {
  const { layout, writePage, TODAY } = ctx;
  const T = TODAY.replace(/-/g, '');
  const urls = [];

  const holidays = load('holidays.json');
  const rests = load('restaurants_ko.json');
  const cafes = load('cafes_ko.json');
  const access = load('accessible.json');
  const visitors = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'visitors.json'), 'utf8')); } catch (e) { return {}; } })();
  const koFes = load('festivals_api.json');

  // ── 휴무 통계 (한 번만 계산해서 5개 언어가 같은 숫자를 쓴다)
  const DN = ['일', '월', '화', '수', '목', '금', '토'];
  function closeStat(list) {
    const day = [0, 0, 0, 0, 0, 0, 0]; let always = 0, none = 0, hol = 0, brk = 0;
    list.forEach(x => {
      const s = String(x.rest || '');
      if (/브레이크|준비\s*시간|준비시간|라스트오더|마지막\s*주문/.test(String(x.open || ''))) brk++;
      if (!s) { none++; return; }
      if (/연중무휴|무휴/.test(s)) { always++; return; }
      DN.forEach((d, i) => { if (new RegExp(d + '요일|매주\\s*' + d + '|' + d + '휴').test(s)) day[i]++; });
      if (/명절|설날|추석/.test(s)) hol++;
    });
    return { n: list.length, day, always, none, hol, brk };
  }
  const RS = closeStat(rests), CS = closeStat(cafes);
  const worstDay = RS.day.indexOf(Math.max(...RS.day));

  // ── 앞으로 남은 공휴일
  const upHol = holidays.filter(h => h.date >= TODAY).sort((a, b) => a.date.localeCompare(b.date));
  // 연휴 덩어리로 묶기 (설·추석은 3일 연속이라 하나로 보여야 의미가 산다)
  const holBlocks = [];
  upHol.forEach(h => {
    const last = holBlocks[holBlocks.length - 1];
    const prev = last && last.days[last.days.length - 1];
    const cont = prev && (new Date(h.date) - new Date(prev.date)) <= 86400000 * 1.5;
    if (cont) last.days.push(h); else holBlocks.push({ days: [h] });
  });
  const bigBlock = holBlocks.find(b => b.days.some(d => /설날|추석/.test(d.name)));

  // ── 무장애
  const accByCat = {}, accBySido = {}, accTag = {};
  access.forEach(a => {
    accByCat[a.cat] = (accByCat[a.cat] || 0) + 1;
    accBySido[a.sido] = (accBySido[a.sido] || 0) + 1;
    (a.acc || []).forEach(k => (accTag[k] = (accTag[k] || 0) + 1));
  });
  const CAT = {
    '관광지': { en: 'Attractions', ja: '観光地', es: 'Atracciones', zh: '景点', tw: '景點' },
    '음식점': { en: 'Restaurants', ja: '飲食店', es: 'Restaurantes', zh: '餐厅', tw: '餐廳' },
    '쇼핑': { en: 'Shopping', ja: 'ショッピング', es: 'Compras', zh: '购物', tw: '購物' },
    '문화시설': { en: 'Cultural facilities', ja: '文化施設', es: 'Instalaciones culturales', zh: '文化设施', tw: '文化設施' },
    '숙박': { en: 'Accommodation', ja: '宿泊', es: 'Alojamiento', zh: '住宿', tw: '住宿' },
    '레포츠': { en: 'Sports & leisure', ja: 'レジャー・スポーツ', es: 'Deporte y ocio', zh: '休闲运动', tw: '休閒運動' },
    '축제·행사': { en: 'Festivals & events', ja: 'お祭り・イベント', es: 'Festivales y eventos', zh: '庆典活动', tw: '慶典活動' }
  };
  // ⚠️ 세부 태그는 강원도 편중이다(휠체어 1,257 중 1,247이 강원). 그대로 쓰면 거짓말이 된다.
  const wheel = access.filter(a => (a.acc || []).includes('휠체어'));
  const wheelBySido = {}; wheel.forEach(a => (wheelBySido[a.sido] = (wheelBySido[a.sido] || 0) + 1));
  const wheelTopSido = Object.keys(wheelBySido).sort((a, b) => wheelBySido[b] - wheelBySido[a])[0];

  // ── 축제 캘린더 뼈대: 한국어 데이터 + 좌표/시작일 일치 시 공식 번역으로 덮어쓰기
  const upKo = koFes.filter(f => String(f.end || '') >= T && f.x && f.y)
    .sort((a, b) => String(a.start).localeCompare(String(b.start)));
  const ckey = f => (+f.x).toFixed(3) + '|' + (+f.y).toFixed(3) + '|' + String(f.start).slice(0, 8);
  const TRANS = {};
  LANGS.forEach(l => {
    const m = new Map();
    load('festivals_' + l + '.json').forEach(f => { if (f.x && f.y) m.set(ckey(f), f); });
    TRANS[l] = m;
  });
  const byMonth = {};
  upKo.forEach(f => { const ym = String(f.start).slice(0, 4) + '-' + String(f.start).slice(4, 6); (byMonth[ym] = byMonth[ym] || []).push(f); });
  // 달 페이지는 축제가 충분히 있는 달만 만든다(얇은 페이지 방지). 나머지는 허브에 줄로만 적는다.
  const MIN_FES = 8;
  const monthKeys = Object.keys(byMonth).filter(k => k >= TODAY.slice(0, 7)).sort();
  const bigMonths = monthKeys.filter(k => byMonth[k].length >= MIN_FES);

  // 붐빔: 실제로 잰 달은 1·4·8·10월뿐이다. 다른 달은 가장 가까운 달로 대신 쓰고 그렇다고 밝힌다.
  const seasonMonths = (visitors.seasonByMonth && visitors.seasonByMonth.months) || {};
  const MEASURED = Object.keys(seasonMonths).map(Number).filter(m => (seasonMonths[m] || []).length >= 20).sort((a, b) => a - b);
  const nearestMeasured = m => MEASURED.reduce((a, b) => (Math.abs(b - m) < Math.abs(a - m) ? b : a), MEASURED[0]);

  // ─────────────────────────────────────────────────────────
  const t = require('./intl-text.js');

  LANGS.forEach(lang => {
    const S = t[lang];
    const alts = k => LANGS.map(l => ({ hreflang: HREF[l], href: `/${l}/${k}` }))
      .concat([{ hreflang: 'x-default', href: `/en/${k}` }]);

    // ══════════ 1) /{lang}/closed/ ══════════
    const holRows = holBlocks.slice(0, 14).map(b => {
      const d = b.days;
      const span = d.length === 1 ? dateLabel(d[0].date, lang)
        : `${dateLabel(d[0].date, lang)} – ${dateLabel(d[d.length - 1].date, lang)}`;
      const names = [...new Set(d.map(x => holName(x.name, lang)))].join(' · ');
      const big = d.some(x => /설날|추석/.test(x.name));
      return `<tr><td>${span}</td><td>${big ? '<b>' : ''}${esc(names)}${big ? '</b>' : ''}</td><td class="n">${d.length}${S.daysUnit(d.length)}</td></tr>`;
    }).join('');

    const dayBars = DN.map((d, i) => ({ i, n: RS.day[i] })).sort((a, b) => b.n - a.n)
      .map(o => bar(WD[lang][o.i], o.n, RS.day[worstDay], o.i === worstDay)).join('');
    const cafeBars = DN.map((d, i) => ({ i, n: CS.day[i] })).sort((a, b) => b.n - a.n).slice(0, 4)
      .map(o => bar(WD[lang][o.i], o.n, Math.max(...CS.day), o.i === CS.day.indexOf(Math.max(...CS.day)))).join('');

    const closedContent = `<main><div class="wrap"><style>${CSS}</style>
<h1 class="ic-h1">${S.cl.h1}</h1>
<p class="ic-lead">${S.cl.lead(nf(RS.n + CS.n), nf(RS.day[worstDay] + CS.day[worstDay]), WD[lang][worstDay])}</p>

${bigBlock ? `<div class="ic-warn"><h2>${S.cl.warnH(holName(bigBlock.days.find(d => /설날|추석/.test(d.name)).name, lang))}</h2>
<p>${S.cl.warnP(dateLabel(bigBlock.days[0].date, lang), dateLabel(bigBlock.days[bigBlock.days.length - 1].date, lang), nf(RS.hol + CS.hol))}</p></div>` : ''}

<div class="ic-card"><h2>${S.cl.h2hol}</h2>
<p>${S.cl.pHol(upHol.length)}</p>
<table class="ic-tbl"><thead><tr><th>${S.cl.thDate}</th><th>${S.cl.thName}</th><th class="n">${S.cl.thDays}</th></tr></thead><tbody>${holRows}</tbody></table>
<p class="ic-note">${S.cl.holNote}</p></div>

<div class="ic-card"><h2>${S.cl.h2week}</h2>
<p>${S.cl.pWeek(nf(RS.n), WD[lang][worstDay], nf(RS.day[worstDay]), Math.round(RS.day[worstDay] / RS.n * 100))}</p>
${dayBars}
<h3>${S.cl.h3cafe}</h3>
<p>${S.cl.pCafe(nf(CS.n), WD[lang][CS.day.indexOf(Math.max(...CS.day))], nf(Math.max(...CS.day)))}</p>
${cafeBars}
<p class="ic-note">${S.cl.weekNote}</p></div>

<div class="ic-card"><h2>${S.cl.h2break}</h2>
<p>${S.cl.pBreak(nf(RS.brk), Math.round(RS.brk / RS.n * 100), nf(CS.brk))}</p>
<p>${S.cl.pBreak2}</p></div>

<div class="ic-card"><h2>${S.cl.h2good}</h2>
<p>${S.cl.pGood(nf(RS.always), Math.round(RS.always / RS.n * 100), nf(CS.always))}</p>
<p>${S.cl.pGood2}</p></div>

<div class="ic-card"><h2>${S.cl.h2how}</h2>
<p>${S.cl.pHow}</p>
<p class="ic-note">${S.cl.src(nf(RS.n), nf(CS.n), TODAY)}</p></div>

<div class="ic-nav">
<a href="/${lang}/calendar/">${S.nav.cal}</a><a href="/${lang}/access/">${S.nav.acc}</a><a href="/${lang}/trend/">${S.nav.trend}</a><a href="/${lang}/search/">${S.nav.search}</a></div>
</div></main>`;
    writePage(lang + '/closed', layout(S.cl.title, S.cl.desc, `/${lang}/closed/`, closedContent, { lang, alternates: alts('closed/') }));
    urls.push(`/${lang}/closed/`);

    // ══════════ 2) /{lang}/access/ ══════════
    const catRows = Object.keys(accByCat).sort((a, b) => accByCat[b] - accByCat[a])
      .map(k => `<tr><td>${esc((CAT[k] && CAT[k][lang]) || k)}</td><td class="n">${nf(accByCat[k])}</td></tr>`).join('');
    const sidoTop = Object.keys(accBySido).sort((a, b) => accBySido[b] - accBySido[a]);
    const sidoMax = accBySido[sidoTop[0]];
    const sidoBars = sidoTop.map(k => bar(sido(k, lang), accBySido[k], sidoMax, false)).join('');

    const accContent = `<main><div class="wrap"><style>${CSS}</style>
<h1 class="ic-h1">${S.ac.h1}</h1>
<p class="ic-lead">${S.ac.lead(nf(access.length))}</p>

<div class="ic-card"><h2>${S.ac.h2cat}</h2>
<p>${S.ac.pCat(nf(accByCat['관광지'] || 0), nf(accByCat['음식점'] || 0))}</p>
<table class="ic-tbl"><thead><tr><th>${S.ac.thCat}</th><th class="n">${S.ac.thN}</th></tr></thead><tbody>${catRows}</tbody></table></div>

<div class="ic-card"><h2>${S.ac.h2region}</h2>
<p>${S.ac.pRegion(sido(sidoTop[0], lang), nf(sidoMax), sido('서울', lang), nf(accBySido['서울'] || 0))}</p>
${sidoBars}</div>

<div class="ic-warn"><h2>${S.ac.h2limit}</h2>
<p>${S.ac.pLimit(nf(accTag['휠체어'] || 0), nf((wheelBySido[wheelTopSido] || 0)), sido(wheelTopSido, lang))}</p></div>

<div class="ic-card"><h2>${S.ac.h2tags}</h2>
<p>${S.ac.pTags}</p>
<table class="ic-tbl"><thead><tr><th>${S.ac.thTag}</th><th class="n">${S.ac.thN}</th></tr></thead><tbody>
${Object.keys(accTag).sort((a, b) => accTag[b] - accTag[a]).map(k => `<tr><td>${esc(S.ac.tag[k] || k)}</td><td class="n">${nf(accTag[k])}</td></tr>`).join('')}
</tbody></table></div>

<div class="ic-card"><h2>${S.ac.h2how}</h2>
<p>${S.ac.pHow}</p>
<p class="ic-note">${S.ac.src(nf(access.length), TODAY)}</p></div>

<div class="ic-nav">
<a href="/${lang}/closed/">${S.nav.closed}</a><a href="/${lang}/calendar/">${S.nav.cal}</a><a href="/${lang}/search/">${S.nav.search}</a></div>
</div></main>`;
    writePage(lang + '/access', layout(S.ac.title, S.ac.desc, `/${lang}/access/`, accContent, { lang, alternates: alts('access/') }));
    urls.push(`/${lang}/access/`);

    // ══════════ 3) /{lang}/calendar/ 허브 ══════════
    const themeM = (visitors.seasonByMonth && visitors.seasonByMonth.themeMonths) || {};
    const monthRows = monthKeys.map(k => {
      const list = byMonth[k], m = +k.slice(5, 7);
      const holHere = upHol.filter(h => h.date.slice(0, 7) === k);
      const big = holHere.some(h => /설날|추석/.test(h.name));
      const link = bigMonths.includes(k) ? `<a href="/${lang}/calendar/${k}/">${monthLabel(k, lang)}</a>` : monthLabel(k, lang);
      return `<tr><td>${link}</td><td class="n">${list.length}</td><td>${holHere.length ? (big ? '<b>' : '') + holHere.map(h => holName(h.name, lang)).filter((v, i, a) => a.indexOf(v) === i).join(', ') + (big ? '</b>' : '') : '—'}</td></tr>`;
    }).join('');

    const seasonRows = Object.keys(themeM).map(k => {
      const lbl = { valley: S.cal.thVal, maple: S.cal.thMap, flower: S.cal.thFlo, onsen: S.cal.thOns }[k];
      return lbl ? `<tr><td>${lbl}</td><td class="n">${(lang === 'en' ? MONN.en : lang === 'es' ? MONN.es : MONN.ja)[themeM[k]]}</td></tr>` : '';
    }).join('');

    // 지금 열리고 있는 것 — 허브에 "오늘 당장" 이 없으면 달력이 아니라 표에 그친다
    const running = upKo.filter(f => String(f.start).slice(0, 8) <= T).slice(0, 12);
    const runTotal = upKo.filter(f => String(f.start).slice(0, 8) <= T).length;
    const runItems = running.map(f => {
      const o = TRANS[lang].get(ckey(f));
      const name = o && o.title ? o.title : festName(f.title, lang);
      const ed = String(f.end);
      return `<li><div class="t">${esc(name)} <span class="ic-kr">${esc(f.title)}</span></div>
<div class="m">${S.cal.until} ${ed.slice(0, 4)}.${ed.slice(4, 6)}.${ed.slice(6, 8)}${f.sido ? ' · ' + esc(sido(f.sido, lang)) : ''}</div>
<a class="map" href="${kakao(f.title, f.x, f.y)}" target="_blank" rel="noopener">${S.cal.mapLink}</a></li>`;
    }).join('');

    // 지역 분포 — "축제가 서울에만 있는 게 아니다"를 숫자로 보여주는 자리
    const regCount = {};
    upKo.forEach(f => { if (f.sido) regCount[f.sido] = (regCount[f.sido] || 0) + 1; });
    const regKeys = Object.keys(regCount).sort((a, b) => regCount[b] - regCount[a]);
    const regMax = regKeys.length ? regCount[regKeys[0]] : 1;
    const regBars = regKeys.map(k => bar(sido(k, lang), regCount[k], regMax, false)).join('');
    // ⚠️ '서울이 몇 %'로 쓰면 서울이 1위일 때 같은 말을 두 번 하게 된다 → 1위 지역의 비중으로 쓴다
    const topShare = regKeys.length ? Math.round(regCount[regKeys[0]] / Math.max(1, upKo.length) * 100) : 0;

    const calHub = `<main><div class="wrap"><style>${CSS}</style>
<h1 class="ic-h1">${S.cal.h1}</h1>
<p class="ic-lead">${S.cal.lead(nf(upKo.length), monthKeys.length)}</p>

${running.length ? `<div class="ic-card"><h2>${S.cal.h2now}</h2>
<p>${S.cal.pNow(runTotal)}</p>
<ul class="ic-fest">${runItems}</ul></div>` : ''}

<div class="ic-card"><h2>${S.cal.h2months}</h2>
<p>${S.cal.pMonths(MIN_FES)}</p>
<table class="ic-tbl"><thead><tr><th>${S.cal.thMonth}</th><th class="n">${S.cal.thFes}</th><th>${S.cal.thHol}</th></tr></thead><tbody>${monthRows}</tbody></table></div>

<div class="ic-card"><h2>${S.cal.h2season}</h2>
<p>${S.cal.pSeason}</p>
<table class="ic-tbl"><thead><tr><th>${S.cal.thWhat}</th><th class="n">${S.cal.thBest}</th></tr></thead><tbody>${seasonRows}</tbody></table>
<p class="ic-note">${S.cal.seasonNote(MEASURED.join(', '))}</p></div>

<div class="ic-card"><h2>${S.cal.h2reg}</h2>
<p>${S.cal.pReg(sido(regKeys[0], lang), nf(regCount[regKeys[0]]), regKeys.length, topShare)}</p>
${regBars}
<p class="ic-note">${S.cal.regNote}</p></div>

<div class="ic-card"><h2>${S.cal.h2names}</h2>
<p>${S.cal.pNames}</p></div>

<div class="ic-nav">
<a href="/${lang}/closed/">${S.nav.closed}</a><a href="/${lang}/access/">${S.nav.acc}</a><a href="/${lang}/trend/">${S.nav.trend}</a><a href="/${lang}/trip/">${S.nav.trip}</a></div>
</div></main>`;
    writePage(lang + '/calendar', layout(S.cal.title, S.cal.desc, `/${lang}/calendar/`, calHub, { lang, alternates: alts('calendar/') }));
    urls.push(`/${lang}/calendar/`);

    // ══════════ 4) /{lang}/calendar/{yyyy-mm}/ ══════════
    bigMonths.forEach((ym, mi) => {
      const list = byMonth[ym], m = +ym.slice(5, 7);
      const tr = TRANS[lang];
      const items = list.map(f => {
        const o = tr.get(ckey(f));
        const name = o && o.title ? o.title : festName(f.title, lang);
        const reg = f.sido ? sido(f.sido, lang) : '';
        const sd = String(f.start), ed = String(f.end);
        const dd = `${sd.slice(0, 4)}.${sd.slice(4, 6)}.${sd.slice(6, 8)} – ${ed.slice(4, 6)}.${ed.slice(6, 8)}`;
        return `<li><div class="t">${esc(name)} <span class="ic-kr">${esc(f.title)}</span></div>
<div class="m">${dd}${reg ? ' · ' + esc(reg) : ''}${o ? '' : ' · ' + S.cal.noTrans}</div>
<a class="map" href="${kakao(f.title, f.x, f.y)}" target="_blank" rel="noopener">${S.cal.mapLink}</a></li>`;
      }).join('');

      const holHere = upHol.filter(h => h.date.slice(0, 7) === ym);
      const measured = nearestMeasured(m);
      const busy = (seasonMonths[measured] || []).slice(0, 10);
      const busyMax = busy.length ? busy[0].idx - 1 : 1;
      const busyBars = busy.map(r => {
        const w = Math.max(4, Math.round((r.idx - 1) / busyMax * 100));
        return `<div class="ic-bar"><div class="l">${esc(sido(r.sido, lang))}</div><div class="b"><i class="hot" style="width:${w}%"></i></div><div class="v">×${r.idx}</div></div>
<div class="ic-note" style="margin:-2px 0 6px 112px">${esc(romanizeMixed(r.name))} <span class="ic-kr">${esc(r.name)}</span></div>`;
      }).join('');

      const prev = bigMonths[mi - 1], next = bigMonths[mi + 1];
      const monthContent = `<main><div class="wrap"><style>${CSS}</style>
<h1 class="ic-h1">${S.cal.mTitle(monthLabel(ym, lang))}</h1>
<p class="ic-lead">${S.cal.mLead(list.length, monthLabel(ym, lang))}</p>

${holHere.length ? `<div class="ic-warn"><h2>${S.cal.mHolH}</h2><p>${holHere.map(h => `${dateLabel(h.date, lang)} — ${holName(h.name, lang)}`).join('<br>')}<br><br>${S.cal.mHolP}</p></div>` : ''}

<div class="ic-card"><h2>${S.cal.mFesH(monthLabel(ym, lang))}</h2>
<p>${S.cal.mFesP}</p>
<ul class="ic-fest">${items}</ul></div>

${busy.length ? `<div class="ic-card"><h2>${S.cal.mBusyH}</h2>
<p>${measured === m ? S.cal.mBusyP(MONN.en[m]) : S.cal.mBusyAlt(MONN.en[m], MONN.en[measured])}</p>
${busyBars}
<p class="ic-note">${S.cal.mBusyNote}</p></div>` : ''}

<div class="ic-nav">
${prev ? `<a href="/${lang}/calendar/${prev}/">← ${monthLabel(prev, lang)}</a>` : ''}
<a href="/${lang}/calendar/" class="on">${S.nav.cal}</a>
${next ? `<a href="/${lang}/calendar/${next}/">${monthLabel(next, lang)} →</a>` : ''}
<a href="/${lang}/closed/">${S.nav.closed}</a></div>
</div></main>`;
      writePage(`${lang}/calendar/${ym}`, layout(S.cal.mMeta(monthLabel(ym, lang)), S.cal.mDesc(list.length, monthLabel(ym, lang)), `/${lang}/calendar/${ym}/`, monthContent, { lang, alternates: alts(`calendar/${ym}/`) }));
      urls.push(`/${lang}/calendar/${ym}/`);
    });
  });

  console.log(`✓ 외국어 실전 정보 — ${urls.length} 페이지 (closed/access/calendar × ${LANGS.length}개어, 달 페이지 ${bigMonths.length}개월)`);
  return urls;
}

module.exports = { build };
