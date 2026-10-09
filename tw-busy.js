// 🇹🇼 /tw/busy/ — 「韓國連假 × 台灣連假」 한 장 (2026-09-30 신설)
//
// 왜 이것인가
//   중국어 기획서(프로젝트 문서 claude/기획_2026-09-30_축제모아_중국어.md) 2단계.
//   번체는 90일 13클릭으로 중국어 클릭의 대부분이고, 사람이 친 검색어가 전부 «언제»다
//   (「韓國10月活動」 1위 · 11월 달력 5클릭). 구글 자동완성 실측(2026-09-30, zh-TW):
//     韓國 連假 2026 / 2027 · 韓國 連假 人潮 · 韓國國定假日2026 / 2027 · 韓國 春節 放幾天
//     韓國 過年 店家會開嗎 · 韓國 中秋節 店家會開嗎 / 會休息嗎
//   → 「두 나라 연휴가 언제 겹치나 + 그날 가게가 여나」를 날짜로 답한다. /ja/busy/ 와 같은 구조.
//
// ⚠️ 한 장만 만든다(크롤 예산). 달력 페이지를 늘리지 않는다.
//
// 데이터 (전부 공식·우리 것 · 지어내지 않는다)
//   · data/holidays.json     한국 공휴일 (공공데이터포털)
//   · data/tw_holidays.json  대만 공휴일 (行政院人事行政總處 공식 CSV — fetch-tw-holidays.js)
//   · data/restaurants_ko.json · cafes_ko.json  영업시간 → 요일별 정기휴무 (ja-busy·intl 과 같은 규칙)
//   · data/visitors.json     한국관광 데이터랩 시·군·구 「평소 대비 배수」
'use strict';
const fs = require('fs'), path = require('path');
const { romanizeRegion } = require('./romanize.js');   // 시·군·구 이름 — 번체 달력(intl.js)과 같은 표기 「Inje-gun 인제군」
const load = f => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { return []; } };
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nf = n => Number(n || 0).toLocaleString('zh-TW');
const WD = ['日', '一', '二', '三', '四', '五', '六'];
const DN = ['일', '월', '화', '수', '목', '금', '토'];
const d2s = d => {
  const y = d.getFullYear(), m = d.getMonth() + 1, dd = d.getDate();
  return y + '-' + String(m).padStart(2, '0') + '-' + String(dd).padStart(2, '0');
};
const s2d = s => new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const md = s => `${+s.slice(5, 7)}月${+s.slice(8, 10)}日（週${WD[s2d(s).getDay()]}）`;
const mdShort = s => `${+s.slice(5, 7)}/${+s.slice(8, 10)}`;
const ymd = s => `${s.slice(0, 4)}年${+s.slice(5, 7)}月${+s.slice(8, 10)}日`;
const addDays = (s, n) => d2s(new Date(s2d(s).getTime() + n * 86400000));
// 실물에서 「9/15〜9/15（連假1天）」가 나왔다 → 하루짜리는 날짜 하나, 「連假」라는 말도 3일 이상에만 쓴다
const span = b => b.start === b.end ? `${mdShort(b.start)}（1天）` : `${mdShort(b.start)}〜${mdShort(b.end)}（${b.len >= 3 ? '連假' : ''}${b.len}天）`;

// 「쉬는 날」 덩어리 — 주말 + 공휴일. 補班(주말 근무일)은 덩어리를 끊는다. 공휴일이 없는 그냥 주말은 뺀다.
function offBlocks(map, work, from, to) {
  const out = [];
  let cur = null;
  for (let d = s2d(from); d2s(d) <= to; d = new Date(d.getTime() + 86400000)) {
    const s = d2s(d), w = d.getDay();
    if (!work[s] && (w === 0 || w === 6 || map[s])) {
      if (!cur) { cur = { days: [] }; out.push(cur); }
      cur.days.push({ date: s, w, hol: map[s] || null });
    } else cur = null;
  }
  return out.filter(b => b.days.some(x => x.hol))
    .map(b => ({ days: b.days, start: b.days[0].date, end: b.days[b.days.length - 1].date, len: b.days.length }));
}

// 요일별 정기휴무 수 (intl.js·ja-busy.js 와 같은 규칙 — 같은 숫자를 써야 한다)
function dayStat(list) {
  const day = [0, 0, 0, 0, 0, 0, 0];
  let always = 0, hol = 0;
  list.forEach(x => {
    const s = String(x.rest || '');
    if (!s) return;
    if (/연중무휴|무휴/.test(s)) { always++; return; }
    DN.forEach((d, i) => { if (new RegExp(d + '요일|매주\\s*' + d + '|' + d + '휴').test(s)) day[i]++; });
    if (/명절|설날|추석/.test(s)) hol++;
  });
  return { n: list.length, day, always, hol };
}

// ja-busy.js 와 같은 스타일(클래스명만 tb- 로 분리 — 같은 페이지에 섞일 일은 없지만 이름 충돌을 피한다)
const CSS = `<style>
.tbc{background:#fff;border-radius:16px;padding:18px 20px;margin:14px 0;box-shadow:0 2px 10px rgba(31,41,55,.06)}
.tbc h2{font-size:1.06rem;font-weight:900;color:#0a6c63;margin:0 0 8px}
.tbc h3{font-size:.98rem;font-weight:800;color:#1f2937;margin:16px 0 6px}
.tbc p{color:#374151;font-size:.95rem;line-height:1.85;margin:0 0 8px}
.tbw{background:#fff5f2;border-left:5px solid #E0502F;border-radius:0 14px 14px 0;padding:16px 18px;margin:16px 0}
.tbw h2{font-size:1.04rem;font-weight:900;color:#c2410c;margin:0 0 6px}
.tbw p{color:#3f3f46;font-size:.95rem;line-height:1.85;margin:0 0 6px}
.tbt{width:100%;border-collapse:collapse;font-size:.92rem;margin:8px 0;min-width:460px}
.tbt th{background:#f6fbfa;color:#0a6c63;font-weight:800;text-align:left;padding:9px 10px;border-bottom:2px solid #dcefeb;white-space:nowrap}
.tbt td{padding:9px 10px;border-bottom:1px solid #eef2f1;color:#374151;vertical-align:top}
.tbt td.n{text-align:right;font-weight:800;white-space:nowrap}
.tbt tr.both td{background:#fff1ec}
.tbt tr.kr td{background:#fffaf0}
.tbt.stack{min-width:0}
.tbwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.tbsw{display:none;color:#9aa3af;font-size:.83rem;margin:2px 0 6px}
@media(max-width:560px){
.tbsw{display:block}
.tbt.stack thead{display:none}
.tbt.stack,.tbt.stack tbody,.tbt.stack tr,.tbt.stack td{display:block;width:auto}
.tbt.stack tr{border-bottom:2px solid #eef2f1;padding:11px 0}
.tbt.stack tr:last-child{border-bottom:0}
.tbt.stack td{border:0;padding:4px 2px}
.tbt.stack td.n{text-align:left}
.tbt.stack td:before{content:attr(data-l);display:block;font-size:.78rem;font-weight:800;color:#0a6c63;margin-bottom:2px}
.tbt.stack td:empty{display:none}
}
.tbbar{display:flex;align-items:center;gap:9px;margin:5px 0}
.tbbar .l{width:44px;font-weight:800;color:#374151;font-size:.9rem}
.tbbar .b{flex:1;background:#f1f5f4;border-radius:999px;height:15px;overflow:hidden}
.tbbar .b i{display:block;height:100%;background:#cfe9e4;border-radius:999px}
.tbbar.on .b i{background:#f0803c}
.tbbar .v{width:86px;text-align:right;font-weight:800;color:#374151;font-size:.87rem}
.tbnav{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}
.tbnav a{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.88rem;padding:9px 14px;border-radius:999px;text-decoration:none}
.tbnote{color:#9aa3af;font-size:.81rem;line-height:1.65;margin-top:9px}
.tbk{font-weight:800;color:#1c1917;white-space:nowrap}
.tbol{margin:6px 0 0;padding-left:22px}
.tbol li{color:#374151;font-size:.95rem;line-height:1.85;margin-bottom:7px}
.tbfaq h3{margin-top:14px}
</style>`;

function build(ctx) {
  const { layout, writePage, TODAY } = ctx;
  const { holName } = require('./intl.js');

  const kr = load('holidays.json'), twAll = load('tw_holidays.json');
  const tw = twAll.filter(h => !h.work), twWork = twAll.filter(h => h.work);
  if (!kr.length || !tw.length) { console.log('⚠️ /tw/busy/ 건너뜀 — 공휴일 데이터 없음'); return []; }

  // 범위: 오늘부터 두 달력이 «둘 다» 가진 마지막 날까지. 한쪽만 있는 구간을 그리면 거짓말이 된다.
  const END = [kr[kr.length - 1].date, tw[tw.length - 1].date].sort()[0];
  const krMap = {}, twMap = {}, workMap = {};
  kr.forEach(h => { if (h.date >= TODAY && h.date <= END) (krMap[h.date] = krMap[h.date] || []).push(h.name); });
  tw.forEach(h => { if (h.date >= TODAY && h.date <= END) (twMap[h.date] = twMap[h.date] || []).push(h.name); });
  twWork.forEach(h => { workMap[h.date] = true; });

  const tb = offBlocks(twMap, workMap, TODAY, END), kb = offBlocks(krMap, {}, TODAY, END);

  // 한국 공휴일 번체 이름 — intl.js 의 HOL 표를 그대로 쓴다(달력·休息日 페이지와 같은 이름).
  // ⚠️ 한국 광복절(8/15)과 대만 光復節(10/25)은 이름이 같아서 한 표에 두면 헷갈린다 → 한국 쪽에 날짜를 붙인다.
  const krName = n => {
    const base = String(n).replace(/^대체공휴일\((.+)\)$/, '$1');
    let t = holName(base, 'tw');
    if (base === '광복절') t = '光復節（韓國 8/15）';
    if (base === '추석') t = '中秋節（韓國秋夕）';
    return /^대체공휴일/.test(n) ? t + '・補假' : t;
  };
  // 대만 쪽 이름 — CSV 원문. 「補假」 단독은 그대로 두고, 긴 공식명만 줄인다.
  const twName = n => String(n).replace('臺灣光復暨金門古寧頭大捷紀念日', '臺灣光復節').replace('孔子誕辰紀念日/教師節', '教師節');

  // 겹침: 두 연휴가 겹치거나 2일 이내로 붙어 있으면 «사실상 하나의 혼잡 구간»이다.
  const laps = [];
  tb.forEach(t => kb.forEach(k => {
    const touch = !(k.start > t.end || k.end < t.start);
    const gap = touch ? 0 : Math.min(
      Math.abs(Math.round((s2d(k.start) - s2d(t.end)) / 86400000)),
      Math.abs(Math.round((s2d(t.start) - s2d(k.end)) / 86400000)));
    if (gap <= 2) laps.push({ t, k, gap, start: [t.start, k.start].sort()[0], end: [t.end, k.end].sort()[1] });
  }));
  laps.sort((a, b) => a.start.localeCompare(b.start));
  const lapRows = [];
  laps.forEach(L => {
    const prev = lapRows[lapRows.length - 1];
    if (prev && L.start <= prev.end) { prev.end = [prev.end, L.end].sort()[1]; prev.parts.push(L); return; }
    lapRows.push({ start: L.start, end: L.end, parts: [L] });
  });

  const R = dayStat(load('restaurants_ko.json')), C = dayStat(load('cafes_ko.json'));
  const TOT = R.n + C.n;
  const cntW = w => R.day[w] + C.day[w];

  const isBig = n => /설날|추석/.test(n);
  const bigBlocks = kb.filter(b => b.days.some(x => x.hol && x.hol.some(isBig)));
  const uniq = a => [...new Set(a)];

  function lapWhat(row) {
    const krHols = [];
    for (let d = s2d(row.start); d2s(d) <= row.end; d = new Date(d.getTime() + 86400000)) (krMap[d2s(d)] || []).forEach(n => krHols.push(n));
    const big = krHols.some(isBig);
    const sameDay = Object.keys(krMap).some(s => s >= row.start && s <= row.end && twMap[s]);
    const overlap = row.parts.some(p => !(p.k.start > p.t.end || p.k.end < p.t.start));
    if (big) return '🔴 <b>韓國正逢名節</b>。巷弄小店會連休好幾天，台韓兩地機票也同時漲';
    if (sameDay) return '🟠 <b>同一天兩國都放假</b>。去程回程航班都滿，首爾市中心也擠滿韓國人';
    if (overlap) return '🟠 <b>兩邊的連假互相重疊</b>。假日不是同一天，但放假期間重疊，航班和飯店會同時被訂走';
    return '🟡 <b>兩邊連假接連而來</b>。一邊收假另一邊才開始放，實際上整段都擠';
  }

  // ── ① 겹치는 구간 표
  const lapTable = lapRows.map(row => {
    const days = Math.round((s2d(row.end) - s2d(row.start)) / 86400000) + 1;
    const tparts = uniq(row.parts.map(p => p.t)), kparts = uniq(row.parts.map(p => p.k));
    const tTxt = tparts.map(t => `${span(t)}<br><span style="color:#6b7280;font-size:.86em">${
      uniq(t.days.filter(x => x.hol).map(x => esc(twName(x.hol[0]))).filter(n => n !== '補假')).join('・')}</span>`).join('<br>');
    const kTxt = kparts.map(k => `${span(k)}<br><span style="color:#6b7280;font-size:.86em">${
      uniq(k.days.filter(x => x.hol).map(x => esc(krName(x.hol[0]).replace('・補假', '')))).join('・')}</span>`).join('<br>');
    return `<tr class="both"><td data-l="期間"><b>${ymd(row.start)}</b> 〜${mdShort(row.end)}<span style="color:#6b7280;font-size:.86em">（${days}天）</span></td>
<td data-l="🇹🇼 台灣">${tTxt}</td><td data-l="🇰🇷 韓國">${kTxt}</td><td data-l="會發生什麼">${lapWhat(row)}</td></tr>`;
  }).join('');

  // ── ② 韓國國定假日 一覽 (「韓國國定假日2026/2027」「韓國 連假 2026」 검색에 바로 답하는 표)
  const krBlockTable = kb.map(k => {
    const names = uniq(k.days.filter(x => x.hol).map(x => krName(x.hol[0]).replace('・補假', '')));
    const hasSub = k.days.some(x => x.hol && x.hol.some(n => /^대체공휴일/.test(n)));
    return `<tr class="${k.days.some(x => x.hol && x.hol.some(isBig)) ? 'kr' : ''}"><td data-l="假日"><b>${esc(names.join('・'))}</b>${hasSub ? '<span style="color:#6b7280;font-size:.86em">（含補假）</span>' : ''}</td>
<td data-l="日期" style="white-space:nowrap">${k.start.slice(0, 4)}/${mdShort(k.start)}${k.len > 1 ? '〜' + mdShort(k.end) : ''}</td><td class="n" data-l="連假">${k.len}天</td></tr>`;
  }).join('');
  const krYears = uniq(kb.map(k => k.start.slice(0, 4)));

  // ── ③ 두 나라 달력 겹쳐 보기
  const allDates = uniq([...Object.keys(krMap), ...Object.keys(twMap)]).sort();
  let curMonth = '';
  const calTable = allDates.map(s => {
    const w = s2d(s).getDay();
    const k = krMap[s], t = twMap[s];
    const cls = (k && t) ? 'both' : (k ? 'kr' : '');
    let head = '';
    if (s.slice(0, 7) !== curMonth) {
      curMonth = s.slice(0, 7);
      head = `<tr><td colspan="4" style="background:#f6fbfa;font-weight:900;color:#0a6c63;padding:8px 10px">${s.slice(0, 4)}年${+s.slice(5, 7)}月</td></tr>`;
    }
    return head + `<tr class="${cls}"><td>${+s.slice(8, 10)}日（週${WD[w]}）</td>
<td>${k ? '<b>' + k.map(n => esc(krName(n))).join('・') + '</b>' : (w === 0 || w === 6 ? '週末' : '—')}</td>
<td>${t ? '<b>' + esc(t.map(twName).join('・')) + '</b>' : (w === 0 || w === 6 ? '週末' : '—')}</td>
<td style="white-space:nowrap">${(k && t) ? '🔴 兩國都放假' : (k ? '🟠 只有韓國' : '🔵 只有台灣')}</td></tr>`;
  }).join('');

  // ── ④ 요일별 정기휴무
  const worstW = R.day.indexOf(Math.max(...R.day));
  const mxW = Math.max(...WD.map((_, w) => cntW(w))) || 1;
  const wBars = WD.map((_, w) => w).sort((a, b) => cntW(b) - cntW(a)).map(w =>
    `<div class="tbbar${w === worstW ? ' on' : ''}"><span class="l">週${WD[w]}</span>
<span class="b"><i style="width:${Math.round(cntW(w) / mxW * 100)}%"></i></span><span class="v">${nf(cntW(w))}家</span></div>`).join('');
  const lapWorst = lapRows.slice(0, 3).map(row => {
    let best = null;
    for (let d = s2d(row.start); d2s(d) <= row.end; d = new Date(d.getTime() + 86400000)) {
      const s = d2s(d), n = cntW(d.getDay());
      if (!best || n > best.n) best = { s, n, w: d.getDay() };
    }
    return `<li><b>${ymd(row.start)}〜${mdShort(row.end)}</b> — 這段期間公休店家最多的是<b>${md(best.s)}</b>，固定週${WD[best.w]}公休的店有<b>${nf(best.n)}家</b>。</li>`;
  }).join('');

  // ── ⑤ 「平常的幾倍」 — 측정된 달만
  const visitors = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'visitors.json'), 'utf8')); } catch (e) { return {}; } })();
  const SBM = (visitors.seasonByMonth && visitors.seasonByMonth.months) || {};
  const SYEAR = (visitors.seasonByMonth && visitors.seasonByMonth.year) || '';
  const SIDO_TW = {
    '서울': '首爾', '부산': '釜山', '대구': '大邱', '인천': '仁川', '광주': '光州', '대전': '大田',
    '울산': '蔚山', '세종': '世宗', '경기': '京畿道', '강원': '江原道', '충북': '忠清北道', '충남': '忠清南道',
    '전북': '全羅北道', '전남': '全羅南道', '경북': '慶尚北道', '경남': '慶尚南道', '제주': '濟州'
  };
  const measured = Object.keys(SBM).map(Number).filter(m => (SBM[m] || []).length >= 20).sort((a, b) => a - b);
  const busyTable = measured.map(m => {
    const top = (SBM[m] || []).slice(0, 4);
    return `<tr><td data-l="月份"><b>${m}月</b></td><td data-l="比平常擠的市郡區">${top.map(x =>
      `${esc(romanizeRegion(x.name))} <span style="color:#9aa3af">${esc(x.name)}（${esc(SIDO_TW[x.sido] || x.sido)}）</span> <b>×${x.idx}</b>`).join('<br>')}</td>
<td class="n" data-l="比平常擠的市郡區數">${nf((SBM[m] || []).length)}</td></tr>`;
  }).join('');

  // ── ⑥ 反而適合去的月份 — 겹침도 명절도 없고, 한국인 국내여행 성수기도 아닌 달
  const months = [];
  { let d = s2d(TODAY.slice(0, 8) + '01');
    for (let i = 0; i < 16; i++) { const key = d2s(d).slice(0, 7); if (key <= END.slice(0, 7)) months.push(key); d = new Date(d.getFullYear(), d.getMonth() + 1, 1); } }
  const lapDays = new Set();
  lapRows.forEach(row => { for (let d = s2d(row.start); d2s(d) <= row.end; d = new Date(d.getTime() + 86400000)) lapDays.add(d2s(d)); });
  const PEAK = 1.35;
  const peakMonths = Object.keys(SBM).map(Number).filter(m => (SBM[m] || []).length >= 20 && (SBM[m][0] || {}).idx >= PEAK);
  const quiet = months.filter(k => {
    if (k === TODAY.slice(0, 7)) return false;
    const hasLap = [...lapDays].some(s => s.slice(0, 7) === k);
    const hasBig = bigBlocks.some(b => b.start.slice(0, 7) === k || b.end.slice(0, 7) === k);
    return !hasLap && !hasBig && !peakMonths.includes(+k.slice(5, 7));
  });
  const quietTxt = quiet.map(k => `<b>${k.slice(0, 4)}年${+k.slice(5, 7)}月</b>`).join('、');
  const peakTxt = peakMonths.length
    ? `另外，<b>${peakMonths.map(m => m + '月').join('、')}</b>雖然沒有連假重疊，但如下表所示是<b>韓國人國內旅遊最集中的月份</b>，所以沒有列進來。` : '';
  // 只有台灣放假 = 韓國照常 — 台灣 연휴 중 한국 공휴일과 2일 이내로 붙지 않는 것
  const twOnly = tb.filter(t => t.len >= 3 && !laps.some(L => L.t === t));   // 하루짜리는 「連假」가 아니다

  // ── ⑦ FAQ — 자동완성에 뜬 질문을 그대로 받는다. 답은 위 데이터에서 만든다(손으로 날짜를 안 적는다).
  const nextBig = n => bigBlocks.find(b => b.days.some(x => x.hol && x.hol.some(h => h.includes(n))));
  const seol = nextBig('설날'), chu = nextBig('추석');
  const blockTxt = b => {
    if (!b) return '';
    const wk = b.days.some(x => x.w === 0 || x.w === 6), sub = b.days.some(x => x.hol && x.hol.some(n => /^대체공휴일/.test(n)));
    const inc = wk && sub ? '（含週末與補假）' : wk ? '（含週末）' : sub ? '（含補假）' : '';
    return `${ymd(b.start)}〜${mdShort(b.end)}，共<b>${b.len}天</b>${inc}`;
  };
  const faq = [];
  // 2026-10-09 중국어 회차 — 사람 검색어 「2027韓國過年」「韓國 2027 假期」(GSC 28일) → 질문에 연도·「過年」을 넣는다(연도는 데이터에서).
  const seolY = seol ? (String(ymd(seol.start)).match(/\d{4}/) || [''])[0] : '';
  if (seol) faq.push([`${seolY}韓國過年（春節·설날）放幾天？`, `${seolY}年韓國過年連假是${blockTxt(seol)}。韓國的法定春節是農曆除夕、初一、初二這三天，碰到週末時會另外補放「替代公休日」。`]);
  faq.push(['韓國過年、中秋店家會開嗎？', `大型百貨、連鎖咖啡廳、便利商店、宮殿等觀光景點大多照常營業；最常關門的是巷弄小吃店、傳統市場和個人小店。我們統計的${nf(TOT)}家餐廳與咖啡廳中，營業資料上<b>明寫「名節公休」的就有${nf(R.hol + C.hol)}家</b>，沒寫但當天關門的店也不少。`]);
  if (chu) faq.push(['韓國中秋節（추석）是哪幾天？', `下一次是${blockTxt(chu)}。韓國的中秋是農曆八月十五前後共三天，和台灣只放一天不同。`]);
  // 2026-10-06 — GSC 「韓國清明節有放假嗎」(5.0위). 4월에 한국 공휴일이 있는지는 holidays.json 으로 판정(손으로 안 적는다).
  //   사실: 청명·한식은 한국 공휴일이 아니고, 식목일(4/5)은 2006년부터 공휴일에서 빠졌다.
  try {
    const KH = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'data', 'holidays.json'), 'utf8'));
    const yrs = [...new Set(KH.map(h => h.date.slice(0, 4)))].filter(y => y >= TODAY.slice(0, 4)).sort();
    const aprY = yrs.find(y => `${y}-04-30` >= TODAY);
    if (aprY && !KH.some(h => h.date.slice(0, 7) === `${aprY}-04`))
      faq.push(['韓國清明節有放假嗎？', `<b>不放。</b>韓國的國定假日裡沒有清明節（청명）與寒食（한식），4月5日的植樹節（식목일）也從2006年起不再是公休日。${aprY}年4月韓國沒有任何國定假日，店家、景點都照常營業 — 台灣清明連假去韓國，反而碰不到韓國人的連假人潮。`]);
  } catch (e) {}
  faq.push(['韓國連假人潮最多是哪幾天？', lapRows.length
    ? `和台灣連假重疊的期間最擠：${lapRows.slice(0, 3).map(r => `<b>${ymd(r.start)}〜${mdShort(r.end)}</b>`).join('、')}。詳見上方表格。`
    : '請看上方的韓國國定假日表。']);

  const next = lapRows[0];
  const daysTo = next ? Math.round((s2d(next.start) - s2d(TODAY)) / 86400000) : 0;
  const Y1 = TODAY.slice(0, 4), Y2 = END.slice(0, 4);

  const content = `<main><div class="wrap">${CSS}
<p style="font-size:.85rem;color:#9aa3af;margin:8px 0"><a href="/tw/" style="color:#0c7d72">首頁</a> › 韓國連假</p>
<h1 style="font-size:1.46rem;font-weight:900;letter-spacing:-.02em;margin:6px 0 6px">韓國連假 ${Y1}–${Y2} — 韓國國定假日與台灣連假重疊的日子</h1>
<p style="color:#6b7280;font-size:.94rem;line-height:1.8;margin:0 0 4px">「什麼時候去韓國比較不擠？」這個問題的答案不是季節，而是<b>日期</b>。我們把台灣的連假（行政院人事行政總處公布的辦公日曆表）和韓國的國定假日（韓國政府公休日資料）放在同一張表上，再疊上韓國觀光公社登錄的餐廳${nf(R.n)}家、咖啡廳${nf(C.n)}家的營業資料，算出「每個星期幾有多少店固定公休」。範圍是${ymd(TODAY)}到${ymd(END)}。</p>

${next ? `<div class="tbw"><h2>⚠️ 最近的注意期間 — ${ymd(next.start)}〜${mdShort(next.end)}</h2>
<p>${daysTo <= 0 ? '<b>已經開始了。</b>' : `距今天還有<b>${daysTo}天</b>。`}${lapWhat(next).replace(/^[^ ]+ /, '')}。如果這段時間有去韓國的計畫，請先看下表是什麼和什麼重疊。</p></div>` : ''}

<div class="tbc"><h2>🔴 台韓連假重疊的期間</h2>
<p>只挑出台灣連假和韓國連假<b>重疊、或相隔不到兩天接連而來</b>的期間。這段時間從台灣出發的航班擠，韓國國內也在移動，機票、飯店和當地交通會同時變難訂。<b>碰上韓國兩大名節（설날 春節、추석 中秋）</b>的更要注意——巷弄裡的小店會一起休好幾天。</p>
<div class="tbwrap"><table class="tbt stack"><thead><tr><th>期間</th><th>🇹🇼 台灣</th><th>🇰🇷 韓國</th><th>會發生什麼</th></tr></thead><tbody>${lapTable}</tbody></table></div>
<p class="tbnote">台灣假日依行政院人事行政總處「中華民國政府行政機關辦公日曆表」（政府資料開放平臺），韓國假日依韓國政府公休日資料。新的年度公布後本頁會自動更新。</p>
${require('./klook.js').hotelTw()}</div>

<div class="tbc"><h2>🇰🇷 韓國國定假日 ${krYears.join('・')} — 連假一覽</h2>
<p>把韓國的國定假日連同前後週末算成「連假」，一共 ${kb.length} 段。<b>韓國的春節和中秋各放三天</b>，碰到週末還會補假，所以常常變成四、五天的長假。</p>
${/* 📱 2026-09-30 실물(375px) 실측: 카드로 펴니 16장·3,016px 이었다. 짧은 3열이라 표 그대로 둔다. */''}<div class="tbwrap"><table class="tbt" style="min-width:0"><thead><tr><th>假日</th><th>日期</th><th class="n">連假</th></tr></thead><tbody>${krBlockTable}</tbody></table></div>
<p class="tbnote">韓國的國定假日若碰上週日（部分節日也包括週六），會補放「替代公休日」。這張表已經包含補假。2026年起韓國的勞動節（5/1）與制憲節（7/17）也列為公休日。</p></div>

<div class="tbc"><h2>⭐ 光看假日表看不出來的 — 每週固定公休日</h2>
<p>韓國的個人小店是用<b>星期幾</b>來決定公休的。這在國定假日表上完全查不到，卻是「特地連假去，結果店沒開」最常見的原因。以下是營業資料上有寫公休日的${nf(TOT)}家店，按星期統計：</p>
${wBars}
<p>最多的是<b>週${WD[worstW]}</b>，共${nf(cntW(worstW))}家。另外，明寫<b class="tbk">연중무휴</b>（全年無休）的有餐廳${nf(R.always)}家、咖啡廳${nf(C.always)}家——這些店連假期間也照開。</p>
${lapWorst ? `<h3>重疊期間裡，關門的店最多的一天</h3><ol class="tbol">${lapWorst}</ol>` : ''}
<p class="tbnote">只統計營業資料欄有寫公休日的店；沒寫的店（不等於全年無休）不列入。門口韓文告示怎麼讀，請看<a href="/tw/closed/" style="color:#0c7d72;font-weight:700">哪天休息</a>。</p></div>

<div class="tbc tbfaq"><h2>💬 常見問題</h2>
${faq.map(([q, a]) => `<h3>${q}</h3><p>${a}</p>`).join('\n')}
</div>

<div class="tbc"><h2>🗓️ 台韓假日對照表 — 全部列出</h2>
<p>${ymd(TODAY)}到${ymd(END)}，只要其中一國放假的日子<b>全部</b>列出。<b>🔴 兩國都放假</b>＝移動最擠的日子；<b>🟠 只有韓國</b>＝台灣要上班，但韓國當地店家會關；<b>🔵 只有台灣</b>＝韓國照常營業，反而適合出發。</p>
<p class="tbsw">↔ 表格可以左右滑動</p>
<div class="tbwrap"><table class="tbt"><thead><tr><th>日期</th><th>🇰🇷 韓國</th><th>🇹🇼 台灣</th><th>判斷</th></tr></thead><tbody>${calTable}</tbody></table></div>
<p class="tbnote">「補假」是台灣行政院公布的調整放假日。韓國上班族週六、週日也放假。</p></div>

${busyTable ? `<div class="tbc"><h2>📊 「比平常多幾倍」— 韓國人國內旅遊集中的月份與地區</h2>
<p>除了假日，還有一個因素是韓國人自己的國內旅遊。這是韓國觀光公社「韓國觀光數據實驗室」各市郡區的訪客數，算成<b>當月訪客數 ÷ 該地區全年平均</b>。<b>×1.5</b> 表示那裡的人是平常的1.5倍（${SYEAR}年實績）。</p>
<div class="tbwrap"><table class="tbt stack"><thead><tr><th>月份</th><th>比平常擠的市郡區（前幾名）</th><th class="n">符合數</th></tr></thead><tbody>${busyTable}</tbody></table></div>
<p>排在前面的多是<b>江原道、慶尚北道的郡</b>——韓國人夏天去海邊、秋天去賞楓都往這裡跑。反過來說，<b>首爾、釜山市中心在這個指標上變化不大</b>，因為那裡一年到頭都很多人。</p>
<p class="tbnote">只有${measured.map(m => m + '月').join('、')}有實測資料，沒有資料的月份我們不會硬補。這是依通訊與信用卡資料推估的數字，描述的是整個市郡區，不是單一景點。各月的慶典與擁擠地區請看<a href="/tw/calendar/" style="color:#0c7d72;font-weight:700">什麼時候去</a>。</p></div>` : ''}

${(quietTxt || twOnly.length) ? `<div class="tbc"><h2>✅ 反而適合去的時候</h2>
${quietTxt ? `<p>這段期間裡，<b>台韓連假不重疊、也不是韓國名節</b>的月份有 ${quietTxt}。要請特休，但同樣的目的地機票比較平穩，店家也都正常營業。${peakTxt}</p>` : ''}
${twOnly.length ? `<p>另一個方法是抓<b>只有台灣放假的連假</b>——這時韓國是平日，店家、機關照常運作，景點的韓國人也比較少：${twOnly.map(t => `<b>${ymd(t.start)}〜${mdShort(t.end)}</b>（${esc(uniq(t.days.filter(x => x.hol).map(x => twName(x.hol[0])).filter(n => n !== '補假')).join('・'))}，${t.len}天）`).join('、')}。</p>` : ''}
</div>` : ''}

<div class="tbc"><h2>出發前，照這個順序確認</h2>
<ol class="tbol">
<li><b>日期有沒有落在上面的「重疊期間」</b> — 有的話，機票和飯店要早點訂。</li>
<li><b>有沒有碰上韓國名節（春節、中秋）</b> — 碰上的話，想去的小店多半會關，行程以百貨、連鎖店、宮殿為主。</li>
<li><b>待的是星期幾</b> — 週${WD[worstW]}固定公休的店最多（${nf(cntW(worstW))}家），那天就排大型設施或連鎖店。</li>
<li><b>看店家門口的韓文</b> — <b class="tbk">연중무휴</b>是全年無休，<b class="tbk">매주 ○요일</b>是每週那天公休。讀法整理在<a href="/tw/closed/" style="color:#0c7d72;font-weight:700">哪天休息</a>。</li>
</ol></div>

<div class="tbnav">
<a href="/tw/closed/">🚪 哪天休息 — 店有沒有開</a>
<a href="/tw/calendar/">🗓️ 什麼時候去 — 各月慶典</a>
<a href="/tw/jangteo/">🧺 韓國五日市集</a>
<a href="/tw/cities/">🏙️ 韓國城市</a>
<a href="/tw/trip/">🧭 第幾次去韓國</a>
</div>

<p style="color:#57534e;font-size:.93rem;line-height:1.8;margin:22px 0 0">🎁 <b>打算最後一天再一次買伴手禮的話，先看看那天有沒有落在上面的表裡。</b>名節期間個人商店也會休息，週${WD[worstW]}有${nf(cntW(worstW))}家店固定公休。百貨公司和機場照開，但市場和路邊小店會關。</p>
</div></main>`;

  writePage('tw/busy', layout(
    `韓國連假 ${Y1}-${Y2}｜韓國國定假日×台灣連假重疊日期、人潮與店家公休 | Chukjemoa`,
    `韓國國定假日${Y1}、${Y2}一覽，和台灣連假（人事行政總處辦公日曆表）放在同一張表：哪幾天兩國都放假最擠、韓國春節中秋放幾天、店家會不會開——用${nf(R.n)}家餐廳與${nf(C.n)}家咖啡廳的營業資料回答。`,
    '/tw/busy/', content, { lang: 'tw' }));

  console.log(`✓ /tw/busy/ — 겹치는 구간 ${lapRows.length}개 · 한국 연휴 ${kb.length}개 · 달력 ${allDates.length}일 (${TODAY}~${END})`);
  return ['/tw/busy/'];
}

module.exports = { build };
