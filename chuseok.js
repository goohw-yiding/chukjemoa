// 🌕 추석 안내 /{lang}/chuseok/ — 「한국 사는 외국인이, 그 무렵 오는 친구에게 보내는 한 장」
//
// 왜 만드나 (2026-08-19, 장남 님 방향):
//   사람이 링크를 공유하는 순간은 «내가 매번 설명하기 귀찮은 것»을 대신 설명해 주는 페이지를 만났을 때다.
//   재한 외국인이 해마다 반복해서 설명하는 것이 정확히 이것 — "추석엔 다 닫아".
//   축제 목록은 어디에나 있지만, **영업일 데이터로 「무엇이 닫히는가」를 숫자로 말하는 곳은 없다.**
//
// ⚠️ 정직성 규칙 (이 페이지의 존재 이유다)
//   1. 「521곳이 명절 휴무라고 적어 놨다」는 「나머지 6,099곳이 연다」는 뜻이 절대 아니다.
//      대부분은 **적어 두지 않은 것**이다. 이 문장을 페이지에 그대로 쓴다.
//   2. 오일장은 «장날 규칙상» 그날이 맞다는 뜻이지 실제로 선다는 보장이 아니다.
//      명절 당일엔 쉬는 장이 많다. 그대로 밝힌다.
//   3. 비자·K-ETA·교통카드·유심은 우리 데이터가 아니라 **쓰지 않는다.** 없는 걸 아는 척하지 않는다.
//   4. 붐빔 지수는 실제로 잰 달이 1·4·8·10월뿐이라 **9월 수치는 만들지 않는다.**
//
// ⚠️ 상품(코리) 배너를 여기 붙이지 않는다 — 공유를 노리는 페이지에 판매를 얹으면 아무도 공유하지 않는다.
//    판매 착지점은 별도 페이지로 만든다.
//
// 날짜는 data/holidays.json 에서 «다음 추석»을 찾아 계산한다 — 해마다 손으로 고치지 않기 위해서다.
'use strict';
const fs = require('fs'), path = require('path');
const { romanizeMixed } = require('./placename.js');

const LANGS = ['en', 'ja', 'es', 'zh', 'tw'];
const HREF = { en: 'en', ja: 'ja', es: 'es', zh: 'zh-Hans', tw: 'zh-Hant' };
const load = f => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { return []; } };
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nf = n => Number(n || 0).toLocaleString('en-US');
const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const parse = s => new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const compact = s => s.replace(/-/g, '');

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
const sidoOf = (k, lang) => (SIDO[k] && SIDO[k][lang]) || romanizeMixed(k || '');

const WD = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ja: ['日', '月', '火', '水', '木', '金', '土'],
  es: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  zh: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  tw: ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
};
const MON = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
};
// 날짜 표기 — 동아시아권은 「9月24日(木)」, 그 외는 「Sep 24 (Thu)」
function dlabel(iso, lang) {
  const d = parse(iso), m = d.getMonth(), dd = d.getDate(), w = WD[lang][d.getDay()];
  if (lang === 'ja') return `${m + 1}月${dd}日(${w})`;
  if (lang === 'zh' || lang === 'tw') return `${m + 1}月${dd}日(${w})`;
  if (lang === 'es') return `${dd} ${MON.es[m]} (${w})`;
  return `${MON.en[m]} ${dd} (${w})`;
}

const CSS = `<style>
.ck-h1{font-size:1.55rem;font-weight:900;letter-spacing:-.02em;margin:10px 0 6px;line-height:1.3}
.ck-lead{color:#4b5563;font-size:1rem;line-height:1.75;margin-bottom:16px}
.ck-warn{background:#fff5f2;border-left:5px solid #E0502F;border-radius:0 14px 14px 0;padding:16px 18px;margin:18px 0}
.ck-warn h2{font-size:1.05rem;font-weight:900;color:#c2410c;margin:0 0 6px}
.ck-warn p{font-size:.95rem;color:#4b5563;line-height:1.7;margin:0}
.ck-card{background:#fff;border-radius:16px;box-shadow:0 3px 14px rgba(31,41,55,.08);padding:18px 20px;margin:16px 0}
.ck-card h2{font-size:1.12rem;font-weight:900;color:#1f2937;margin:0 0 10px}
.ck-card p{font-size:.94rem;color:#4b5563;line-height:1.75;margin:0 0 10px}
.ck-tbl{width:100%;border-collapse:collapse;font-size:.9rem;margin:10px 0}
.ck-tbl th{text-align:left;font-weight:800;color:#0a6c63;border-bottom:2px solid #dcefeb;padding:8px 6px}
.ck-tbl td{border-bottom:1px solid #f0f2f4;padding:8px 6px;color:#374151}
.ck-tbl td.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums;font-weight:700}
.ck-flag{background:#fdf6ec;border:1px solid #f0dcc0;border-radius:12px;padding:13px 15px;font-size:.9rem;color:#7c5a2a;line-height:1.7;margin:10px 0 0}
.ck-days{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0}
.ck-day{background:#f4faf8;border:1px solid #dcefeb;border-radius:13px;padding:11px 15px;min-width:118px}
.ck-day .d{font-weight:800;color:#0a6c63;font-size:.92rem}
.ck-day .v{font-size:1.15rem;font-weight:900;color:#1f2937;margin-top:3px}
.ck-fest{list-style:none;padding:0;margin:10px 0}
.ck-fest li{border-bottom:1px solid #f0f2f4;padding:11px 2px}
.ck-fest li:last-child{border-bottom:0}
.ck-fest .t{font-weight:800;color:#1f2937;font-size:.97rem}
.ck-fest .m{font-size:.85rem;color:#6b7280;margin-top:3px;line-height:1.6}
.ck-kr{font-weight:600;opacity:.72;font-size:.88em}
.ck-note{font-size:.86rem;color:#8a929c;line-height:1.7}
.ck-nav{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}
.ck-nav a{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.88rem;padding:9px 15px;border-radius:999px;text-decoration:none}
.ck-nav a:hover{background:#e2f5f2}
</style>`;

function build({ layout, writePage, TODAY }) {
  const urls = [];
  const holidays = load('holidays.json');
  const today = ymd(new Date());

  // ── 「다음 추석」을 찾는다. 손으로 연도를 박지 않는다.
  //    이미 8일 넘게 지난 추석은 지나간 정보라 페이지를 만들지 않는다(철 지난 페이지 = 유령).
  const chu = holidays.filter(h => /추석/.test(h.name || '')).map(h => h.date).sort();
  const future = chu.filter(d => d >= ymd(new Date(Date.now() - 8 * 86400000)));
  if (!future.length) { console.log('⚠ 추석 페이지 건너뜀 — holidays.json 에 다가올 추석이 없음'); return urls; }
  const block = [];
  for (const d of future) {
    if (!block.length) { block.push(d); continue; }
    const prev = parse(block[block.length - 1]);
    if ((parse(d) - prev) / 86400000 <= 1.5) block.push(d); else break;
  }
  const offStart = block[0], offEnd = block[block.length - 1];
  // 연휴 끝이 토요일이면 다음 일요일까지가 실질 연휴다. 그 다음 월요일이 «함정»이다.
  const endD = parse(offEnd);
  let spanEnd = offEnd;
  if (endD.getDay() === 6) spanEnd = ymd(new Date(endD.getTime() + 86400000));
  else if (endD.getDay() === 5) spanEnd = ymd(new Date(endD.getTime() + 2 * 86400000));
  const afterD = new Date(parse(spanEnd).getTime() + 86400000);
  const after = ymd(afterD);
  const YEAR = parse(offStart).getFullYear();

  // ── 영업일 데이터
  const R = load('restaurants_ko.json'), C = load('cafes_ko.json');
  const cnt = (a, re, k) => a.filter(o => re.test(o[k] || '')).length;
  const stat = a => ({
    n: a.length,
    hol: cnt(a, /추석|명절/, 'rest'),
    always: cnt(a, /연중무휴|무휴/, 'rest'),
    mon: cnt(a, /월요일/, 'rest')
  });
  const RS = stat(R), CS = stat(C);

  // ── 연휴에 걸치는 축제. 「기간 45일 초과」는 축제가 아니라 상설 프로그램이라 뺀다(2026-08-18 확립).
  const F = load('festivals_api.json');
  const cs = compact(offStart), ce = compact(spanEnd);
  const durOf = f => {
    const d = s => new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
    return (d(f.end) - d(f.start)) / 86400000 + 1;
  };
  const fests = F.filter(f => f.start && f.end && f.start <= ce && f.end >= cs && durOf(f) <= 45)
    .sort((a, b) => a.start.localeCompare(b.start));

  // ── 연휴 각 날짜에 «장날 규칙상» 서는 오일장
  const M = load('markets_api.json').filter(m => Array.isArray(m.daysNum) && m.daysNum.length);
  const spanDays = [];
  for (let d = parse(offStart); d <= parse(spanEnd); d = new Date(d.getTime() + 86400000)) spanDays.push(ymd(d));
  const mktByDay = spanDays.map(d => {
    const last = +d.slice(-1);
    return { d, n: M.filter(m => m.daysNum.includes(last === 0 ? 10 : last)).length };
  });

  const T = require('./chuseok-text.js');

  LANGS.forEach(lang => {
    const S = T[lang];
    const alts = LANGS.map(l => ({ hreflang: HREF[l], href: `/${l}/chuseok/` }))
      .concat([{ hreflang: 'x-default', href: '/en/chuseok/' }]);
    const span = dlabel(offStart, lang) + ' – ' + dlabel(spanEnd, lang);
    const offSpan = offStart === offEnd ? dlabel(offStart, lang)
      : dlabel(offStart, lang) + ' – ' + dlabel(offEnd, lang);

    const festHtml = fests.length ? `<ul class="ck-fest">${fests.map(f => {
      const rom = romanizeMixed(f.title || '');
      // 공식 번역이 없으니 로마자 + 한글 원제를 같이 준다 —
      // 외국인이 네이버·카카오 지도에 넣어야 하는 건 결국 한글 원제다.
      return `<li><div class="t">${esc(rom)} <span class="ck-kr">${esc(f.title)}</span></div>
<div class="m">📍 ${esc(sidoOf(f.sido, lang))}${f.sigungu ? ' ' + esc(romanizeMixed(f.sigungu)) : ''} · 📅 ${esc(f.start.slice(0, 4) + '.' + f.start.slice(4, 6) + '.' + f.start.slice(6, 8))} – ${esc(f.end.slice(0, 4) + '.' + f.end.slice(4, 6) + '.' + f.end.slice(6, 8))}</div></li>`;
    }).join('')}</ul>` : `<p class="ck-note">${S.festNone}</p>`;

    const dayHtml = `<div class="ck-days">${mktByDay.map(x =>
      `<div class="ck-day"><div class="d">${dlabel(x.d, lang)}</div><div class="v">${S.mktUnit(nf(x.n))}</div></div>`).join('')}</div>`;

    const content = `<main><div class="wrap">
${CSS}
<h1 class="ck-h1">🌕 ${S.h1(YEAR, span)}</h1>
<p class="ck-lead">${S.lead}</p>

<div class="ck-warn"><h2>⚠️ ${S.warnH}</h2>
<p>${S.warnP(offSpan, dlabel(spanEnd, lang), dlabel(after, lang))}</p></div>

<div class="ck-card"><h2>${S.h2close}</h2>
<p>${S.pClose(nf(RS.n), nf(CS.n))}</p>
<table class="ck-tbl"><tr><th>${S.thPlace}</th><th class="n">${S.thR}</th><th class="n">${S.thC}</th></tr>
<tr><td>${S.rowHol}</td><td class="n">${nf(RS.hol)}</td><td class="n">${nf(CS.hol)}</td></tr>
<tr><td>${S.rowAlways}</td><td class="n">${nf(RS.always)}</td><td class="n">${nf(CS.always)}</td></tr>
<tr><td>${S.rowMon}</td><td class="n">${nf(RS.mon)}</td><td class="n">${nf(CS.mon)}</td></tr></table>
<div class="ck-flag">${S.closeWarn(nf(RS.hol), nf(RS.n - RS.hol))}</div></div>

<div class="ck-card"><h2>${S.h2mon}</h2>
<p>${S.pMon(dlabel(after, lang), nf(RS.mon), Math.round(RS.mon / RS.n * 100), nf(CS.mon), Math.round(CS.mon / CS.n * 100))}</p>
<p><a href="/${lang}/closed/" style="color:#0a6c63;font-weight:700">${S.monLink}</a></p></div>

<div class="ck-card"><h2>${S.h2diff}</h2>
<p>${S.pDiff}</p></div>

<div class="ck-card"><h2>${S.h2open}</h2>
<p>${S.pOpen(fests.length)}</p>
${festHtml}</div>

<div class="ck-card"><h2>${S.h2mkt}</h2>
<p>${S.pMkt(nf(M.length))}</p>
${dayHtml}
<div class="ck-flag">${S.mktWarn}</div>
<p style="margin-top:12px"><a href="/jangteo/" style="color:#0a6c63;font-weight:700">${S.mktLink}</a></p></div>

<div class="ck-card"><h2>${S.h2no}</h2>
<p>${S.pNo}</p>
<p class="ck-note">${S.src(nf(RS.n), nf(CS.n), TODAY || today)}</p></div>

<div class="ck-nav">
<a href="/${lang}/closed/">${S.navClosed}</a><a href="/${lang}/calendar/">${S.navCal}</a><a href="/${lang}/access/">${S.navAcc}</a><a href="/${lang}/search/">${S.navSearch}</a></div>
</div></main>`;

    const faq = [
      [S.h2close, String(S.closeWarn(nf(RS.hol), nf(RS.n - RS.hol))).replace(/<[^>]+>/g, '')],
      [S.h2mon, String(S.pMon(dlabel(after, lang), nf(RS.mon), Math.round(RS.mon / RS.n * 100), nf(CS.mon), Math.round(CS.mon / CS.n * 100))).replace(/<[^>]+>/g, '')],
      [S.h2mkt, String(S.mktWarn).replace(/<[^>]+>/g, '')]
    ];
    const ld = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
    })}</script>`;

    writePage(lang + '/chuseok', layout(
      S.title(YEAR, span), S.desc(YEAR, span, nf(RS.n), nf(CS.n)),
      `/${lang}/chuseok/`, content, { lang, alternates: alts, jsonld: ld }));
    urls.push(`/${lang}/chuseok/`);
  });

  // ── 고아 페이지 방지: 이미 쓰인 외국어 실전정보 3종의 내비에 링크를 끼워 넣는다.
  //    ⚠️ 사이트맵에만 넣고 링크를 안 내면 고아다(오늘 시·도별 페이지에서 같은 실수를 할 뻔했다).
  //    intl.js 가 바로 앞에서 파일을 썼기 때문에 여기서 열어 고칠 수 있다.
  const ROOT = __dirname;
  let linked = 0;
  LANGS.forEach(lang => {
    const label = { en: '🌕 Chuseok', ja: '🌕 秋夕', es: '🌕 Chuseok', zh: '🌕 秋夕', tw: '🌕 秋夕' }[lang];
    const tag = `<a href="/${lang}/chuseok/">${label}</a>`;
    for (const p of ['closed', 'calendar', 'access']) {
      const f = path.join(ROOT, lang, p, 'index.html');
      try {
        const s = fs.readFileSync(f, 'utf8');
        if (s.includes(`/${lang}/chuseok/`)) continue;
        const i = s.indexOf('<div class="ic-nav">');
        if (i < 0) continue;
        fs.writeFileSync(f, s.slice(0, i + 20) + tag + s.slice(i + 20));
        linked++;
      } catch (e) { }
    }
  });

  console.log(`✓ 추석 안내 — ${urls.length} 페이지 (${offStart}~${spanEnd} · 축제 ${fests.length}건 · 오일장 ${M.length}곳 기준) · 내비 링크 ${linked}곳`);
  return urls;
}

module.exports = { build };
