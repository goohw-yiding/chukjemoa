// 🗂️ 외국어 축제 «허브» /en/festival/ · /ja/festival/
//
// 왜 (2026-09-01 GSC 90일 실측)
//   개별 축제 영문명 → 이미 6~10위.  머리말은 반대로 바닥이다:
//     korean festivals 82위 · festivals in korea 85위 · festival in korea 73위 ·
//     korea festival 45위 · korean cultural festivals 75위 · koreaanse festivals 54위
//   이 말들을 받고 있는 건 /en/(62.8위)과 /en/search/(61.9위)인데, 둘 다 검색 UI라
//   **읽을 내용이 없다.** 「Korean festivals」로 온 사람에게 보여줄 «목록다운 목록»이 없었다.
//   일본어도 같다 — 韓国 祭り(9.3위) · 韓国の祭り(23.5위) · 韓国お祭り(32위).
//
//   덤으로 고아 문제도 여기서 풀린다. 축제 상세는 지금 사이트맵 말고는 들어갈 문이 없는데
//   (검색 페이지가 JS라 크롤러가 링크로 안 센다), 이 허브가 **크롤 가능한 진짜 링크**를 준다.
const MN = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const T = {
  en: {
    h1: y => `Korean Festivals ${y} — What's On, Month by Month`,
    title: y => `Korean Festivals ${y} — Full List by Month | Chukjemoa`,
    desc: n => `${n} festivals across South Korea with dates, locations, how crowded each area gets, and the Korean names to paste into Naver Map.`,
    lead: `Korea runs several hundred local festivals a year, and most of them are not in Seoul — they are in the county that grows the crop or holds the tradition. This page lists every festival we have an official English description for, grouped by month, upcoming first.`,
    how: 'Three things worth knowing before you plan',
    tips: [
      ['Autumn is the peak, not summer', 'September and October hold the most festivals by a wide margin — harvest season plus mild weather. Summer festivals exist but skew to water and beaches.'],
      ['Google Maps will not give you directions', 'Korean law restricts exporting map data, so Google Maps has no walking or transit routing inside Korea. Use Naver Map or Kakao Map. Every festival page here gives you the Korean name and address to paste in.'],
      ['A country festival often sits next to a 5-day market', 'Rural markets open only on days ending in fixed digits, every 5 days. Where one falls inside a festival\'s dates, we list the actual date on that festival\'s page.']
    ],
    upcoming: 'Happening now and coming up',
    past: 'Earlier this year (dates for reference — most are annual)',
    on: 'Now on',
    n: n => `${n} festivals`,
    back: '← Search all festivals'
  },
  ja: {
    h1: y => `韓国の祭り ${y} — 月別の開催一覧`,
    title: y => `韓国の祭り ${y}｜月別の開催一覧・日程と場所 | 축제모아`,
    desc: n => `韓国全土の祭り${n}件。日程・場所に加えて、その地域の混み具合と、NAVERマップに貼れるハングル名まで載せています。`,
    lead: `韓国では年に数百の地域祭りが開かれますが、その多くはソウルではありません。その作物を育てている郡、その伝統が残っている町で開かれます。ここでは公式の日本語紹介があるものを月ごとに、開催が近い順に並べています。`,
    how: '計画を立てる前に知っておくと違う3つのこと',
    tips: [
      ['一番多いのは夏ではなく秋', '9月と10月に圧倒的に集中します。収穫期であり、気候も穏やかだからです。夏の祭りは水辺・海のものが中心になります。'],
      ['Googleマップでは道案内が出ません', '韓国は地図データの国外持ち出しが制限されているため、Googleマップは韓国国内の徒歩・乗換案内を出せません。NAVERマップかカカオマップを使ってください。各祭りのページに、貼り付け用のハングル名と住所を載せています。'],
      ['地方の祭りの近くには「五日市」が立ちます', '田舎の市場は日付の末尾で決まった日だけ、5日ごとに開きます。祭りの期間中に当たる日は、その祭りのページで実際の日付を計算して出しています。']
    ],
    upcoming: '開催中・これから',
    past: '今年すでに終了したもの（毎年ほぼ同時期に開かれます）',
    on: '開催中',
    n: n => `${n}件`,
    back: '← 祭りをすべて検索する'
  }
};

const CSS = `
<style>
.ixlead{background:#fff;border-radius:16px;padding:18px 20px;margin:14px 0;box-shadow:0 2px 10px rgba(31,41,55,.06)}
.ixlead p{color:#374151;font-size:.97rem;line-height:1.8;margin:0}
.ixtips{display:grid;gap:10px;margin:14px 0}
.ixtip{background:#f6fbfa;border:1.5px solid #dcefeb;border-radius:13px;padding:13px 15px}
.ixtip b{display:block;color:#0a6c63;font-size:.95rem;font-weight:900;margin-bottom:4px}
.ixtip span{color:#4b5563;font-size:.9rem;line-height:1.72}
.ixmo{font-size:1.12rem;font-weight:900;color:#0a6c63;margin:22px 0 10px;padding-bottom:6px;border-bottom:2px solid #e2f5f2}
.ixgrid{display:grid;gap:8px}
.ixrow{display:grid;grid-template-columns:96px 1fr;gap:12px;align-items:baseline;
  background:#fff;border:1.5px solid #eef2f1;border-radius:12px;padding:11px 14px;text-decoration:none}
.ixrow:hover{border-color:#0f9d8f}
.ixrow .dt{font-size:.83rem;font-weight:800;color:#0a6c63;white-space:nowrap}
.ixrow .nm{font-weight:800;color:#111827;font-size:.96rem;line-height:1.4}
.ixrow .rg{color:#9aa3af;font-size:.82rem;margin-top:2px}
.ixnow{display:inline-block;background:#0f9d8f;color:#fff;font-size:.7rem;font-weight:900;
  padding:2px 7px;border-radius:999px;margin-left:6px;vertical-align:middle}
@media(max-width:520px){.ixrow{grid-template-columns:1fr}.ixrow .dt{margin-bottom:2px}}
</style>`;

/**
 * @param lang 'en'|'ja'
 * @param rows [{title,start,end,region,_slug}]
 * @param TODAY8 'YYYYMMDD'
 * @returns {url, title, desc, html}
 */
// ⭐ 2026-09-30 «그 나라 사람들이 좋아하는 축제» — intl-picks.js 가 기계 검증한 근거로 뽑은 선정표(data/intl_picks.json).
//   허브 맨 위에 조용히 한 줄 묶음으로. 근거 종류를 그 나라 말 꼬리표로만 보여 준다(한국어 근거 문장은 노출하지 않는다).
const PICK_T = {
  en: { h: 'Loved by international visitors', sub: 'Picked from tour-operator listings, booking platforms and Korea Tourism Organization visitor data. The order also reflects whether tickets or tours can be booked online through our partners.',
    // ⚖️ 2026-10-01 장남님 결정 — 선정 순서에 제휴 상품 유무가 가산되므로(intl-picks.js) 영어권(FTC) 기준으로 그 사실을 밝힌다. 「not from ads」는 뺐다.
    tag: { stat: 'Visitor data', agency: 'Tour operators run trips', ota: 'Bookable tours', target: 'Welcomes foreign visitors' } },
  ja: { h: '日本の旅行者に人気の祭り', sub: '日本の旅行会社のツアー、予約サイト、韓国観光公社の訪問データから選んでいます（広告ではありません）。',
    tag: { stat: '訪問データ', agency: '日本発ツアーあり', ota: '現地ツアー予約可', target: '日本からの旅行者を歓迎' } },
};
function picksBlock(lang, rows, TODAY8, rowHtml) {
  const P = PICK_T[lang]; if (!P) return '';
  let picks = []; try { picks = ((JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'data', 'intl_picks.json'), 'utf8')).langs || {})[lang]) || []; } catch (e) { return ''; }
  const byId = {}; rows.forEach(f => { byId[String(f.id)] = f; });
  const items = [];
  for (const p of picks) {
    // 같은 축제의 여러 회차 줄 중 가장 최근 것(검증 날짜가 붙은 줄)
    const f = (p.ids || []).map(id => byId[id]).filter(Boolean).sort((a, b) => String(b.start).localeCompare(String(a.start)))[0];
    if (!f) continue;
    const kinds = [...new Set((p.reasons || []).map(r => r.kind).filter(k => P.tag[k]))].slice(0, 2);
    items.push({ f, kinds });
    if (items.length >= 12) break;
  }
  if (items.length < 3) return '';
  // 곧 열리는 것 먼저(지금 계획할 수 있는 것) — 같은 묶음 안에서는 선정 점수 순서 유지
  items.sort((a, b) => (String(a.f.end || '') < TODAY8) - (String(b.f.end || '') < TODAY8));
  const tagHtml = ks => ks.map(k => `<span style="display:inline-block;font-size:.72rem;font-weight:700;color:#0a6c63;background:#e8f6f3;border-radius:999px;padding:1px 8px;margin:4px 4px 0 0">${esc(P.tag[k])}</span>`).join('');
  return `<h2 style="font-size:1.1rem;font-weight:900;margin:26px 0 2px">${esc(P.h)}</h2>
<p style="color:#9aa3af;font-size:.84rem;margin:2px 0 10px">${esc(P.sub)}</p>
<div class="ixgrid">${items.map(({ f, kinds }) => {
    let h = rowHtml(f);
    // 이미 지난 회차는 날짜 대신 «예년 ○월»로 — 지난 날짜를 인기 목록 맨 위에 걸어 두면 오해를 산다
    if (String(f.end || '') < TODAY8) {
      const m = +String(f.start).slice(4, 6);
      h = h.replace(/<span class="dt">[^<]*<\/span>/, `<span class="dt">${lang === 'ja' ? `例年${m}月` : `Usually ${['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m]}`}</span>`);
    }
    return h.replace('</span></span></a>', `</span>${tagHtml(kinds)}</span></a>`);
  }).join('')}</div>`;
}

function indexPage(lang, rows, TODAY8) {
  const t = T[lang], base = `/${lang}/festival/`;
  const year = TODAY8.slice(0, 4);
  const live = rows.filter(f => String(f.end || '') >= TODAY8)
    .sort((a, b) => String(a.start).localeCompare(String(b.start)));
  const done = rows.filter(f => String(f.end || '') < TODAY8)
    .sort((a, b) => String(b.start).localeCompare(String(a.start)));

  const fmt = s => lang === 'ja'
    ? `${+String(s).slice(4, 6)}/${+String(s).slice(6, 8)}`
    : `${MN[+String(s).slice(4, 6)].slice(0, 3)} ${+String(s).slice(6, 8)}`;
  const moLabel = m => lang === 'ja' ? `${+m}月` : MN[+m];

  const rowHtml = f => `<a class="ixrow" href="${base}${esc(f._slug)}/">
<span class="dt">${fmt(f.start)}–${fmt(f.end)}</span>
<span><span class="nm">${esc(f.title)}${
  String(f.start) <= TODAY8 && String(f.end) >= TODAY8 ? `<span class="ixnow">${esc(t.on)}</span>` : ''
}</span><span class="rg">${esc(f.region || '')}</span></span></a>`;

  const group = list => {
    const by = {};
    list.forEach(f => { (by[String(f.start).slice(4, 6)] = by[String(f.start).slice(4, 6)] || []).push(f); });
    return Object.keys(by).sort((a, b) => list === done ? b.localeCompare(a) : a.localeCompare(b))
      .map(m => `<h3 class="ixmo">${esc(moLabel(m))} <span style="font-weight:700;color:#9aa3af;font-size:.86rem">${
        esc(t.n(by[m].length))}</span></h3><div class="ixgrid">${by[m].map(rowHtml).join('')}</div>`).join('');
  };

  const html = `<main><div class="wrap">
${CSS}
<h1 style="font-size:1.52rem;font-weight:900;letter-spacing:-.02em;margin:14px 0 4px">${esc(t.h1(year))}</h1>
<div class="ixlead"><p>${esc(t.lead)}</p></div>
<h2 style="font-size:1.04rem;font-weight:900;color:#0a6c63;margin:20px 0 8px">${esc(t.how)}</h2>
<div class="ixtips">${t.tips.map(([a, b]) => `<div class="ixtip"><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('')}</div>
${picksBlock(lang, rows, TODAY8, rowHtml)}
<h2 style="font-size:1.1rem;font-weight:900;margin:26px 0 2px">${esc(t.upcoming)} <span style="color:#9aa3af;font-weight:700;font-size:.9rem">${esc(t.n(live.length))}</span></h2>
${group(live)}
${done.length ? `<h2 style="font-size:1.1rem;font-weight:900;margin:30px 0 2px">${esc(t.past)} <span style="color:#9aa3af;font-weight:700;font-size:.9rem">${esc(t.n(done.length))}</span></h2>${group(done)}` : ''}
<p style="margin:22px 0"><a href="/${lang}/search/" style="color:#0c7d72;font-weight:700">${esc(t.back)}</a></p>
</div></main>`;

  return { url: base, title: t.title(year), desc: t.desc(rows.length), html };
}

module.exports = { indexPage };
