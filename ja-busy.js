// 🇯🇵 /ja/busy/ — 「混む日」축을 제품으로 세우는 한 장
//
// 왜 이것인가 (2026-09-14 결정)
//   일본 유입 검색어의 51%가 휴무일·공휴일이다. 그런데 일본인이 여행 계획을 세울 때 진짜로 묻는 건
//   «한국의 공휴일이 언제인가»가 아니라 **「내 연휴가 한국의 무슨 날과 겹치나」**다.
//   「韓国に行かない方がいい時期」류 기사가 일본어권에 수두룩한데, 전부 계절 이야기(桜·夏)로 얼버무린다.
//   우리는 날짜로 답할 수 있다 — 두 나라 공식 공휴일 + 8,638곳 영업시간 데이터.
//
// ⚠️ 한 장만 만든다. 153장 중 구글이 크롤한 게 12장이다(2026-09-14 실측).
//    크롤 예산은 트래픽으로 버는 것이지 페이지 수로 버는 게 아니다.
//
// 데이터 (전부 우리 것 · 지어내지 않는다)
//   · data/holidays.json    한국 공휴일 (공공데이터포털)
//   · data/jp_holidays.json 일본 공휴일 (内閣府 공식 CSV — fetch-jp-holidays.js)
//   · data/restaurants_ko.json · cafes_ko.json  영업시간 → 요일별 정기휴무
//   · data/visitors.json    한국관광 데이터랩 시·군·구 「평소 대비 배수」
'use strict';
const fs = require('fs'), path = require('path');
const load = f => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { return []; } };
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nf = n => Number(n || 0).toLocaleString('ja-JP');
const WD = ['日', '月', '火', '水', '木', '金', '土'];
const DN = ['일', '월', '화', '수', '목', '금', '토'];
const d2s = d => {
  const y = d.getFullYear(), m = d.getMonth() + 1, dd = d.getDate();
  return y + '-' + String(m).padStart(2, '0') + '-' + String(dd).padStart(2, '0');
};
const s2d = s => new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const md = s => `${+s.slice(5, 7)}月${+s.slice(8, 10)}日（${WD[s2d(s).getDay()]}）`;
const mdShort = s => `${+s.slice(5, 7)}/${+s.slice(8, 10)}`;
const ymd = s => `${s.slice(0, 4)}年${+s.slice(5, 7)}月${+s.slice(8, 10)}日`;

// 「쉬는 날」 덩어리 — 주말 + 공휴일이 이어지는 구간. 공휴일이 하나도 없는 그냥 주말은 뺀다.
function offBlocks(map, from, to) {
  const out = [];
  let cur = null;
  for (let d = s2d(from); d2s(d) <= to; d = new Date(d.getTime() + 86400000)) {
    const s = d2s(d), w = d.getDay();
    if (w === 0 || w === 6 || map[s]) {
      if (!cur) { cur = { days: [] }; out.push(cur); }
      cur.days.push({ date: s, w, hol: map[s] || null });
    } else cur = null;
  }
  return out.filter(b => b.days.some(x => x.hol))
    .map(b => ({ days: b.days, start: b.days[0].date, end: b.days[b.days.length - 1].date, len: b.days.length }));
}

// 요일별 정기휴무 수 (intl.js·ja-holiday.js 와 같은 규칙 — 세 곳이 같은 숫자를 써야 한다)
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

const CSS = `<style>
.bzc{background:#fff;border-radius:16px;padding:18px 20px;margin:14px 0;box-shadow:0 2px 10px rgba(31,41,55,.06)}
.bzc h2{font-size:1.06rem;font-weight:900;color:#0a6c63;margin:0 0 8px}
.bzc h3{font-size:.98rem;font-weight:800;color:#1f2937;margin:16px 0 6px}
.bzc p{color:#374151;font-size:.95rem;line-height:1.85;margin:0 0 8px}
.bzw{background:#fff5f2;border-left:5px solid #E0502F;border-radius:0 14px 14px 0;padding:16px 18px;margin:16px 0}
.bzw h2{font-size:1.04rem;font-weight:900;color:#c2410c;margin:0 0 6px}
.bzw p{color:#3f3f46;font-size:.95rem;line-height:1.85;margin:0 0 6px}
.bzt{width:100%;border-collapse:collapse;font-size:.92rem;margin:8px 0}
.bzt th{background:#f6fbfa;color:#0a6c63;font-weight:800;text-align:left;padding:9px 10px;border-bottom:2px solid #dcefeb;white-space:nowrap}
.bzt td{padding:9px 10px;border-bottom:1px solid #eef2f1;color:#374151;vertical-align:top}
.bzt td.n{text-align:right;font-weight:800;white-space:nowrap}
.bzt tr.both td{background:#fff1ec}
.bzt tr.kr td{background:#fffaf0}
.bzt tr.we td{color:#9aa3af}
.bzwrap{overflow-x:auto}
.bzbar{display:flex;align-items:center;gap:9px;margin:5px 0}
.bzbar .l{width:44px;font-weight:800;color:#374151;font-size:.9rem}
.bzbar .b{flex:1;background:#f1f5f4;border-radius:999px;height:15px;overflow:hidden}
.bzbar .b i{display:block;height:100%;background:#cfe9e4;border-radius:999px}
.bzbar.on .b i{background:#f0803c}
.bzbar .v{width:86px;text-align:right;font-weight:800;color:#374151;font-size:.87rem}
.bznav{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}
.bznav a{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.88rem;padding:9px 14px;border-radius:999px;text-decoration:none}
.bznote{color:#9aa3af;font-size:.81rem;line-height:1.65;margin-top:9px}
.bzk{font-weight:800;color:#1c1917;white-space:nowrap}
.bzol{margin:6px 0 0;padding-left:22px}
.bzol li{color:#374151;font-size:.95rem;line-height:1.85;margin-bottom:7px}
</style>`;

function build(ctx) {
  const { layout, writePage, TODAY } = ctx;
  const JH = require('./ja-holiday.js');

  const kr = load('holidays.json'), jp = load('jp_holidays.json');
  if (!kr.length || !jp.length) { console.log('⚠️ /ja/busy/ 건너뜀 — 공휴일 데이터 없음'); return []; }

  // 범위: 오늘부터 두 달력이 «둘 다» 가진 마지막 날까지. 한쪽만 있는 구간을 그리면 거짓말이 된다.
  const END = [kr[kr.length - 1].date, jp[jp.length - 1].date].sort()[0];
  const krMap = {}, jpMap = {};
  kr.forEach(h => { if (h.date >= TODAY && h.date <= END) (krMap[h.date] = krMap[h.date] || []).push(h.name); });
  jp.forEach(h => { if (h.date >= TODAY && h.date <= END) (jpMap[h.date] = jpMap[h.date] || []).push(h.name); });

  const jb = offBlocks(jpMap, TODAY, END), kb = offBlocks(krMap, TODAY, END);

  // 겹침: 두 연휴가 겹치거나 2일 이내로 붙어 있으면 «사실상 하나의 혼잡 구간»이다.
  const laps = [];
  jb.forEach(j => kb.forEach(k => {
    const touch = !(k.start > j.end || k.end < j.start);
    const gap = touch ? 0 : Math.min(
      Math.abs(Math.round((s2d(k.start) - s2d(j.end)) / 86400000)),
      Math.abs(Math.round((s2d(j.start) - s2d(k.end)) / 86400000)));
    if (gap <= 2) laps.push({ j, k, gap, start: [j.start, k.start].sort()[0], end: [j.end, k.end].sort()[1] });
  }));
  laps.sort((a, b) => a.start.localeCompare(b.start));
  // 같은 구간이 두 번 나오지 않게(일본 연휴 하나에 한국 연휴 둘이 붙는 경우)
  const lapRows = [];
  laps.forEach(L => {
    const prev = lapRows[lapRows.length - 1];
    if (prev && L.start <= prev.end) { prev.end = [prev.end, L.end].sort()[1]; prev.parts.push(L); return; }
    lapRows.push({ start: L.start, end: L.end, parts: [L] });
  });

  const R = dayStat(load('restaurants_ko.json')), C = dayStat(load('cafes_ko.json'));
  const TOT = R.n + C.n;
  const cntW = w => R.day[w] + C.day[w];               // 그 요일에 정기휴무인 가게 수
  // ja-holiday.js 의 NAME 은 «상세 페이지를 만드는 연휴»만 들고 있다. 여기선 달력에 전부 적어야 하므로
  // 거기 없는 공휴일의 일본어 이름을 보탠다. ⚠️ NAME 쪽에 넣으면 /ja/closed/ 하위 페이지가 늘어난다 — 안 넣는다.
  const EXTRA = { '제헌절': '制憲節', '전국동시지방선거': '統一地方選挙の日' };
  const krName = n => {
    const base = JH.baseName(n);
    const ja = (JH.NAME[base] || {}).ja || EXTRA[base] || base;
    return /^대체공휴일/.test(n) ? ja + '（振替休日）' : ja;
  };
  const krSlug = n => (JH.NAME[JH.baseName(n)] || {}).slug || '';
  // 연휴별 상세 페이지가 실제로 만들어지는 것만 링크한다(ja-holiday.js 가 앞 6개만 만든다)
  const madeSlugs = new Set(JH.blocks(TODAY).slice(0, 6).map(b => b.slug));
  const closedLink = n => {
    const s = krSlug(n);
    return s && madeSlugs.has(s)
      ? `<a href="/ja/closed/${s}/" style="color:#0c7d72;font-weight:700">${esc(krName(n))}</a>` : esc(krName(n));
  };

  // 「日本の休み」判定 — 일본은 토·일도 쉰다. 「韓国の休み」는 가게 기준으로 명절만 진짜 위험하다.
  const isBig = n => /설날|추석/.test(n);
  const bigBlocks = kb.filter(b => b.days.some(x => x.hol && x.hol.some(isBig)));

  // 겹침 구간 한 줄 설명 — 손으로 안 적는다. 무엇이 겹치는지에서 만든다.
  function lapWhat(row) {
    const krHols = [], jpHols = [];
    for (let d = s2d(row.start); d2s(d) <= row.end; d = new Date(d.getTime() + 86400000)) {
      const s = d2s(d);
      (krMap[s] || []).forEach(n => krHols.push(n));
      (jpMap[s] || []).forEach(n => jpHols.push(n));
    }
    const big = krHols.some(isBig);
    const sameDay = Object.keys(krMap).some(s => s >= row.start && s <= row.end && jpMap[s]);
    // ⚠️ 「같은 날 둘 다 공휴일」이 아니어도 두 연휴 구간이 겹칠 수 있다(2026-10: 한글날 금 + 스포츠의 날 월).
    //    실물 페이지에서 이걸 「연달아 온다」고 써 놔서 읽다가 걸렸다 — 겹침과 연접은 다른 말이다.
    const overlap = row.parts.some(p => !(p.k.start > p.j.end || p.k.end < p.j.start));
    if (big) return '🔴 <b>韓国は名節</b>。個人店がまとめて休みます。航空券も日韓とも高くなります';
    if (sameDay) return '🟠 <b>同じ日に両国とも祝日</b>。往復とも便が混み、ソウル中心部も韓国人客で埋まります';
    if (overlap) return '🟠 <b>連休どうしが重なります</b>。祝日は別の日ですが、休みの期間そのものが重なるので便もホテルも同時に埋まります';
    return '🟡 連休が続けて来ます。片方が明けてももう片方が始まるので、実質ずっと混みます';
  }

  // 같은 이름이 3번 나오는 걸 실물에서 봤다(「チュソク・チュソク・チュソク」). 연휴는 날짜가 여러 개라 그렇다.
  const uniq = a => [...new Set(a)];

  // ── ① 겹치는 구간 표
  const lapTable = lapRows.map(row => {
    const days = Math.round((s2d(row.end) - s2d(row.start)) / 86400000) + 1;
    const jparts = [...new Set(row.parts.map(p => p.j))];
    const kparts = [...new Set(row.parts.map(p => p.k))];
    const jTxt = jparts.map(j => `${mdShort(j.start)}〜${mdShort(j.end)}（${j.len}連休）<br><span style="color:#6b7280;font-size:.86em">${
      uniq(j.days.filter(x => x.hol).map(x => esc(x.hol.join('・')))).join('・')}</span>`).join('<br>');
    const kTxt = kparts.map(k => {
      // 같은 명절이 3일이면 이름도 3번 나온다 → 이름으로 접고, 며칠인지는 «連休» 숫자가 이미 말해 준다
      const names = uniq(k.days.filter(x => x.hol).map(x => krName(x.hol[0])));
      const html = names.map(n => {
        const src = k.days.find(x => x.hol && krName(x.hol[0]) === n);
        return closedLink(src.hol[0]);
      }).join('・');
      return `${mdShort(k.start)}〜${mdShort(k.end)}（${k.len}連休）<br><span style="color:#6b7280;font-size:.86em">${html}</span>`;
    }).join('<br>');
    return `<tr class="both"><td><b>${ymd(row.start)}</b><br>〜${mdShort(row.end)}<br><span style="color:#6b7280;font-size:.86em">${days}日間</span></td>
<td>${jTxt}</td><td>${kTxt}</td><td>${lapWhat(row)}</td></tr>`;
  }).join('');

  // ── ② 두 나라 달력 겹쳐 보기
  const allDates = [...new Set([...Object.keys(krMap), ...Object.keys(jpMap)])].sort();
  let curMonth = '';
  const calTable = allDates.map(s => {
    const w = s2d(s).getDay();
    const k = krMap[s], j = jpMap[s];
    const cls = (k && j) ? 'both' : (k ? 'kr' : '');
    let head = '';
    if (s.slice(0, 7) !== curMonth) {
      curMonth = s.slice(0, 7);
      head = `<tr><td colspan="4" style="background:#f6fbfa;font-weight:900;color:#0a6c63;padding:8px 10px">${
        s.slice(0, 4)}年${+s.slice(5, 7)}月</td></tr>`;
    }
    return head + `<tr class="${cls}"><td>${+s.slice(8, 10)}日（${WD[w]}）</td>
<td>${k ? '<b>' + k.map(n => esc(krName(n))).join('・') + '</b>' : '—'}</td>
<td>${j ? '<b>' + esc(j.join('・')) + '</b>' : (w === 0 || w === 6 ? '週末' : '—')}</td>
<td>${(k && j) ? '🔴 両国とも休み' : (k ? '🟠 韓国だけ休み — 店に注意'
      : (w === 0 || w === 6 ? '🔵 日本だけ休み（週末と重なります）' : '🔵 日本だけ休み — 韓国は平常'))}</td></tr>`;
  }).join('');

  // ── ③ 요일별 정기휴무 (공휴일 달력만 보면 절대 모르는 것)
  const worstW = R.day.indexOf(Math.max(...R.day));
  const mxW = Math.max(...WD.map((_, w) => cntW(w))) || 1;
  const wBars = WD.map((_, w) => w).sort((a, b) => cntW(b) - cntW(a)).map(w =>
    `<div class="bzbar${w === worstW ? ' on' : ''}"><span class="l">${WD[w]}曜</span>
<span class="b"><i style="width:${Math.round(cntW(w) / mxW * 100)}%"></i></span><span class="v">${nf(cntW(w))}店</span></div>`).join('');

  // 겹침 구간에 걸리는 요일 — 「その連休のどの日がいちばん閉まるか」
  const lapWorst = lapRows.slice(0, 3).map(row => {
    let best = null;
    for (let d = s2d(row.start); d2s(d) <= row.end; d = new Date(d.getTime() + 86400000)) {
      const s = d2s(d), n = cntW(d.getDay());
      if (!best || n > best.n) best = { s, n, w: d.getDay() };
    }
    return `<li><b>${ymd(row.start)}〜${mdShort(row.end)}</b> — この期間でいちばん定休日が多いのは<b>${
      md(best.s)}</b>で、${WD[best.w]}曜を定休にしている店が<b>${nf(best.n)}店</b>あります。</li>`;
  }).join('');

  // ── ④ 「普段の何倍」 — 측정된 달만. 없는 달을 채워 넣지 않는다.
  const visitors = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'visitors.json'), 'utf8')); } catch (e) { return {}; } })();
  const SBM = (visitors.seasonByMonth && visitors.seasonByMonth.months) || {};
  const SYEAR = (visitors.seasonByMonth && visitors.seasonByMonth.year) || '';
  const SIDO_JA = {
    '서울': 'ソウル', '부산': '釜山', '대구': '大邱', '인천': '仁川', '광주': '光州', '대전': '大田',
    '울산': '蔚山', '세종': '世宗', '경기': '京畿道', '강원': '江原道', '충북': '忠清北道', '충남': '忠清南道',
    '전북': '全羅北道', '전남': '全羅南道', '경북': '慶尚北道', '경남': '慶尚南道', '제주': '済州'
  };
  const measured = Object.keys(SBM).map(Number).filter(m => (SBM[m] || []).length >= 20).sort((a, b) => a - b);
  const busyTable = measured.map(m => {
    const top = (SBM[m] || []).slice(0, 4);
    return `<tr><td><b>${m}月</b></td><td>${top.map(x =>
      `${esc(x.name)}<span style="color:#9aa3af">（${esc(SIDO_JA[x.sido] || x.sido)}）</span> <b>×${x.idx}</b>`).join('<br>')}</td>
<td class="n">${nf((SBM[m] || []).length)}</td></tr>`;
  }).join('');

  // ── ⑤ 逆に空いている月 — 겹침도 명절도 없는 달
  const months = [];
  {
    let d = s2d(TODAY.slice(0, 8) + '01');
    for (let i = 0; i < 13; i++) {
      const key = d2s(d).slice(0, 7);
      if (key <= END.slice(0, 7)) months.push(key);
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
  }
  const lapDays = new Set();
  lapRows.forEach(row => {
    for (let d = s2d(row.start); d2s(d) <= row.end; d = new Date(d.getTime() + 86400000)) lapDays.add(d2s(d));
  });
  // ⚠️ 실물에서 걸린 것: 공휴일만 보고 고르면 «8월»이 狙い目 로 나온다. 그런데 바로 아래 표에서
  //    8월은 ×1.54 로 한국인 국내여행이 제일 몰리는 달이다. 한 페이지 안에서 서로 반대말을 하면 안 된다.
  //    → 측정된 달 중 배수가 높은 달은 뺀다. 무엇을 뺐는지도 적는다.
  const PEAK = 1.35;
  const peakMonths = Object.keys(SBM).map(Number)
    .filter(m => (SBM[m] || []).length >= 20 && (SBM[m][0] || {}).idx >= PEAK);
  const quiet = months.filter(k => {
    if (k === TODAY.slice(0, 7)) return false;           // 이번 달은 이미 시작됐다
    const hasLap = [...lapDays].some(s => s.slice(0, 7) === k);
    const hasBig = bigBlocks.some(b => b.start.slice(0, 7) === k || b.end.slice(0, 7) === k);
    return !hasLap && !hasBig && !peakMonths.includes(+k.slice(5, 7));
  });
  const quietTxt = quiet.length
    ? quiet.map(k => `<b>${k.slice(0, 4)}年${+k.slice(5, 7)}月</b>`).join('・')
    : '';
  const peakTxt = peakMonths.length
    ? `なお<b>${peakMonths.map(m => m + '月').join('・')}</b>は祝日こそ重なりませんが、下の表のとおり<b>韓国人の国内旅行がいちばん集中する月</b>なので外しました。`
    : '';

  const next = lapRows[0];
  const daysTo = next ? Math.round((s2d(next.start) - s2d(TODAY)) / 86400000) : 0;

  const content = `<main><div class="wrap">${CSS}
<p style="font-size:.85rem;color:#9aa3af;margin:8px 0"><a href="/ja/" style="color:#0c7d72">ホーム</a> › 混む日</p>
<h1 style="font-size:1.46rem;font-weight:900;letter-spacing:-.02em;margin:6px 0 6px">韓国が混む日 — 日本と韓国の祝日を1枚に重ねました</h1>
<p style="color:#6b7280;font-size:.94rem;line-height:1.8;margin:0 0 4px">「韓国に行かない方がいい時期はいつですか」。この質問の答えは、桜や夏といった<b>季節</b>ではなく<b>日付</b>です。日本の祝日（内閣府の公式カレンダー）と韓国の祝日（韓国政府）を同じ表に並べ、さらに韓国観光公社に登録された飲食店${nf(R.n)}店・カフェ${nf(C.n)}店の営業時間データから「その曜日に定休日の店が何店あるか」を重ねました。${ymd(TODAY)}から${ymd(END)}までです。</p>

${next ? `<div class="bzw"><h2>⚠️ いちばん近い注意期間 — ${ymd(next.start)}〜${mdShort(next.end)}</h2>
<p>${daysTo <= 0 ? '<b>すでに始まっています。</b>' : `今日から<b>${daysTo}日後</b>です。`}${lapWhat(next).replace(/^[^ ]+ /, '')}。この期間に旅行の予定があるなら、下の表で何が重なっているかを先に見てください。</p></div>` : ''}

<div class="bzc"><h2>🔴 日韓の連休が重なる期間</h2>
<p>日本の連休と韓国の連休が<b>重なる、または2日以内で続けて来る</b>期間だけを抜き出しました。この期間は、日本発の便が混むのと同時に韓国国内も動くので、航空券・ホテル・現地の移動が同時に厳しくなります。<b>韓国の名節（ソルラル・チュソク）と重なる回</b>はさらに別で、個人経営の店がまとめて休みます。</p>
<div class="bzwrap"><table class="bzt"><thead><tr><th>期間</th><th>🇯🇵 日本</th><th>🇰🇷 韓国</th><th>何が起きるか</th></tr></thead><tbody>${lapTable}</tbody></table></div>
<p class="bznote">日本の祝日は内閣府「国民の祝日について」の公式CSV、韓国の祝日は韓国政府の公休日データによります。春分の日・秋分の日は毎年決まるため、このページは元データから自動で作り直しています。</p></div>

<div class="bzc"><h2>⭐ 祝日カレンダーだけでは分からないこと — 曜日の定休日</h2>
<p>韓国の個人店は、休む日を<b>曜日</b>で決めています。祝日カレンダーをいくら見ても出てこない情報で、これが「せっかく連休に来たのに閉まっていた」のいちばん多い原因です。営業時間データに定休日を書いている${nf(TOT)}店を曜日別に数えました。</p>
${wBars}
<p>いちばん多いのは<b>${WD[worstW]}曜</b>で${nf(cntW(worstW))}店。なお<b class="bzk">연중무휴</b>（年中無休）と明記している店は飲食店${nf(R.always)}店・カフェ${nf(C.always)}店あり、この店たちは連休でも開いています。</p>
${lapWorst ? `<h3>重なる期間のうち、いちばん閉まる日</h3><ol class="bzol">${lapWorst}</ol>` : ''}
<p class="bznote">営業時間欄に定休日を書いている店だけを数えた数字です。書いていない店（＝無休とは限りません）は含みません。連休ごとの詳しい内訳は<a href="/ja/closed/" style="color:#0c7d72;font-weight:700">休む日のページ</a>にあります。</p></div>

<div class="bzc"><h2>🚪 韓国だけが休む日 — ここは「混む」より「閉まる」</h2>
<p>日本の祝日と関係なく韓国だけが休む日は、混雑よりも<b>店が開いているか</b>が問題になります。とくに韓国の二大名節（<b class="bzk">설날</b> ソルラル＝旧正月、<b class="bzk">추석</b> チュソク＝秋夕）は、路地の食堂や個人商店が数日まとめて閉まります。営業時間データに「名節休業」と明記している店だけでも<b>${nf(R.hol + C.hol)}店</b>あり、明記していない店も当日閉まっていることが珍しくありません。宮殿・大型デパート・コンビニ・カフェチェーンは通常どおりです。</p>
${bigBlocks.length ? `<div class="bzwrap"><table class="bzt"><thead><tr><th>名節</th><th>期間</th><th>詳しく</th></tr></thead><tbody>${
    bigBlocks.map(b => {
      const n = b.days.find(x => x.hol && x.hol.some(isBig)).hol.find(isBig);
      const sl = krSlug(n);
      return `<tr class="kr"><td><b>${esc(krName(n))}</b></td><td>${ymd(b.start)}〜${mdShort(b.end)}（${b.len}連休）</td><td>${
        sl && madeSlugs.has(sl) ? `<a href="/ja/closed/${sl}/" style="color:#0c7d72;font-weight:700">この連休に閉まる店を数えました →</a>` : '—'}</td></tr>`;
    }).join('')}</tbody></table></div>` : ''}
<p class="bznote">韓国は祝日が日曜と重なると振替休日になります（すべての祝日ではありません）。上の表は公式の公休日データに基づいています。</p></div>

<div class="bzc"><h2>🗓️ 日韓の祝日カレンダー — 全部並べました</h2>
<p>${ymd(TODAY)}から${ymd(END)}まで、どちらかの国が祝日である日を<b>すべて</b>並べました。赤い行は両国とも休み、黄色い行は韓国だけ休み（＝店に注意）です。日本だけが休みの日は、韓国側は平常営業なので旅行にはむしろ good です。</p>
<div class="bzwrap"><table class="bzt"><thead><tr><th>日付</th><th>🇰🇷 韓国</th><th>🇯🇵 日本</th><th>判定</th></tr></thead><tbody>${calTable}</tbody></table></div>
<p class="bznote">日本側の「週末」は祝日ではありませんが、旅行の混み方に効くので表示しています。韓国の会社員も土日は休みです。</p></div>

${busyTable ? `<div class="bzc"><h2>📊 「普段の何倍」— 韓国人の国内旅行が集中する月と場所</h2>
<p>祝日のほかにもう一つ、韓国国内の人の動きがあります。韓国観光公社「韓国観光データラボ」の市郡区別訪問者数から、<b>その月の訪問者数 ÷ その地域の年平均</b>を出したものです。<b>×1.5</b> は「普段の1.5倍の人がそこにいる」という意味になります（${SYEAR}年の実績）。</p>
<div class="bzwrap"><table class="bzt"><thead><tr><th>月</th><th>普段より混む市郡区（上位）</th><th class="n">対象</th></tr></thead><tbody>${busyTable}</tbody></table></div>
<p>上位に並ぶのは<b>江原道や慶尚北道の郡部</b>で、これは海（8月）と紅葉（10月）に韓国人が集中するからです。逆に言えば、<b>ソウル・釜山の都心部はこの指標では大きく動きません</b> — 年間を通して人が多い場所だからです。ソウルの数字が9月に上がるのは新学期など生活の移動も含まれるためで、観光の混雑そのものではありません。</p>
<p class="bznote">測定されているのは${measured.map(m => m + '月').join('・')}のみです。データのない月をそれらしく埋めることはしていません。通信・カードデータに基づく推計値で、観光地単位ではなく市郡区全体の数字です。月ごとの詳しい一覧は<a href="/ja/calendar/" style="color:#0c7d72;font-weight:700">いつ行くかのページ</a>にあります。</p></div>` : ''}

${quietTxt ? `<div class="bzc"><h2>✅ 逆に、狙い目の月</h2>
<p>この期間のうち、<b>日韓の連休が重ならず、韓国の名節もない月</b>は ${quietTxt} です。日本側の連休に合わせて動けないぶん有給が要りますが、同じ行き先でも航空券が落ち着き、店も普通に開いています。${peakTxt}</p>
<p>もう一つの狙い方は、<b>日本だけが休みの日</b>に合わせることです。上のカレンダーで「🔵 日本だけ休み」と出ている日は、こちらは休みなのに韓国は平日 — 店も役所も通常どおり動いていて、観光地は韓国人が少ない状態です。</p></div>` : ''}

<div class="bzc"><h2>出かける前に、この順番で確認してください</h2>
<ol class="bzol">
<li><b>自分の日程が上の「重なる期間」に入っていないか</b> — 入っているなら航空券とホテルは早めに。</li>
<li><b>名節（ソルラル・チュソク）に当たっていないか</b> — 当たっているなら、行きたい店はほぼ閉まると考えてください。</li>
<li><b>滞在する曜日</b> — ${WD[worstW]}曜が${nf(cntW(worstW))}店といちばん定休日が多い曜日です。その日は大型施設やチェーン店を中心に予定を組むと安全です。</li>
<li><b>行きたい店の表記</b> — <b class="bzk">연중무휴</b>なら年中無休、<b class="bzk">매주 ○요일</b>ならその曜日が定休です。読み方は<a href="/ja/closed/" style="color:#0c7d72;font-weight:700">休む日のページ</a>にまとめました。</li>
</ol></div>

<div class="bznav">
<a href="/ja/closed/">🚪 休む日 — 店は開いているか</a>
<a href="/ja/calendar/">🗓️ いつ行くか — 月別</a>
<a href="/ja/places/">📍 行ける場所を探す</a>
<a href="/ja/festival/">🎪 韓国のお祭り</a>
</div>
</div></main>`;

  writePage('ja/busy', layout(
    '韓国が混む日 2026-2027 — 日韓の祝日が重なる期間と、店が閉まる日 | チュクチェモア',
    `日本の祝日（内閣府）と韓国の祝日を1枚に重ねました。両国とも連休になる期間、韓国だけ店が閉まる日を、飲食店${nf(R.n)}店・カフェ${nf(C.n)}店の営業時間データと合わせて日付で出しています。`,
    '/ja/busy/', content, { lang: 'ja' }));

  console.log(`✓ /ja/busy/ — 겹치는 구간 ${lapRows.length}개 · 달력 ${allDates.length}일 (${TODAY}~${END})`);
  return ['/ja/busy/'];
}

module.exports = { build };
