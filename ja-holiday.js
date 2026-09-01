// 🇯🇵 /ja/closed/{연휴}/ — 연휴별 「그날 한국 가게가 여나」
//
// 왜 이것부터인가 (2026-09-01 GSC 180일, country=jpn 실측)
//   일본에서 들어온 검색어 «전량»을 뽑아 보니 1·2위가 축제가 아니었다:
//     ハングルの日 お店 休み   노출 5 · 5.2위 · 클릭 1
//     韓国 定休日             노출 3 · 9.7위
//   나머지는 전부 노출 1건짜리다. 즉 **일본인이 우리를 찾은 이유 1위는 「가게가 언제 문을 닫나」**이고,
//   그 트래픽은 전부 /ja/closed/(6.9위) 한 장으로 갔다.
//   → 연휴 «하나하나»가 검색어인데 받을 페이지가 한 장뿐이었다. 연휴별로 쪼갠다.
//
// 무엇을 쓰나 — 전부 우리 데이터. 지어내지 않는다.
//   · 정확한 날짜·요일·대체공휴일·주말이 붙어 며칠 연휴가 되는지
//   · ⭐ **그 연휴 요일에 걸리는 «정기휴무»** — 한글날은 금요일이라 금요일 정기휴무 가게가 겹친다.
//     이건 공휴일 안내만 보는 사람은 절대 알 수 없고, 우리는 영업시간 데이터로 셀 수 있다.
//   · 명절(설·추석)이면 명절 휴무를 명시한 업소 수
//   · 그 연휴에 열리는 축제(일본어판) · 그 연휴에 서는 오일장 날짜
'use strict';
const fs = require('fs'), path = require('path');
const load = f => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { return []; } };
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nf = n => Number(n || 0).toLocaleString('ja-JP');
const WD = ['日', '月', '火', '水', '木', '金', '土'];

// 한국 공휴일 이름 → 일본어. 없으면 만들지 않는다(로마자로 얼버무리지 않는다).
const NAME = {
  '추석': { ja: 'チュソク（秋夕）', slug: 'chuseok', big: true },
  '설날': { ja: 'ソルラル（旧正月）', slug: 'seollal', big: true },
  '개천절': { ja: '開天節', slug: 'gaecheonjeol' },
  '한글날': { ja: 'ハングルの日', slug: 'hangeul-day' },
  '기독탄신일': { ja: 'クリスマス', slug: 'christmas' },
  '1월1일': { ja: '元日', slug: 'new-year' },
  '삼일절': { ja: '三一節', slug: 'samiljeol' },
  '어린이날': { ja: 'こどもの日', slug: 'childrens-day' },
  '현충일': { ja: '顕忠日', slug: 'hyeonchungil' },
  '광복절': { ja: '光復節', slug: 'gwangbokjeol' },
  '부처님오신날': { ja: '釈迦誕生日', slug: 'buddha-birthday' },
  '노동절': { ja: 'メーデー', slug: 'labour-day' }
};
const baseName = n => String(n || '').replace(/^대체공휴일\(|\)$/g, '').trim();

/** 앞으로 오는 연휴를 «덩어리»로 묶어 돌려준다(주말이 붙는 것까지 계산). */
function blocks(TODAY) {
  const hol = load('holidays.json').filter(h => h.date >= TODAY)
    .sort((a, b) => a.date.localeCompare(b.date));
  const out = [];
  hol.forEach(h => {
    const last = out[out.length - 1];
    const prev = last && last.days[last.days.length - 1];
    // 사이에 주말만 끼어 있으면 같은 연휴로 본다(개천절 토 + 대체 월 = 3연휴)
    const gap = prev ? (new Date(h.date) - new Date(prev.date)) / 86400000 : 99;
    if (prev && gap <= 3) last.days.push(h); else out.push({ days: [h] });
  });
  return out.map(b => {
    // 주말을 앞뒤로 붙여 «실제로 쉬는 날»을 만든다
    const ds = b.days.map(d => d.date);
    let s = new Date(ds[0]), e = new Date(ds[ds.length - 1]);
    while (s.getDay() === 0 || s.getDay() === 6) s = new Date(s.getTime() - 86400000);
    s = new Date(s.getTime() + 86400000);
    while (e.getDay() === 0 || e.getDay() === 6) e = new Date(e.getTime() + 86400000);
    e = new Date(e.getTime() - 86400000);
    const span = [];
    for (let d = new Date(ds[0]); d <= new Date(ds[ds.length - 1]); d = new Date(d.getTime() + 86400000)) {
      span.push(new Date(d));
    }
    // 앞뒤 주말 확장
    let a = new Date(span[0]), z = new Date(span[span.length - 1]);
    while (true) { const p = new Date(a.getTime() - 86400000); if (p.getDay() === 0 || p.getDay() === 6) { span.unshift(p); a = p; } else break; }
    while (true) { const p = new Date(z.getTime() + 86400000); if (p.getDay() === 0 || p.getDay() === 6) { span.push(p); z = p; } else break; }
    const key = baseName(b.days.find(d => NAME[baseName(d.name)])?.name || b.days[0].name);
    const meta = NAME[key];
    return meta ? {
      key, slug: meta.slug, ja: meta.ja, big: !!meta.big,
      days: b.days, span,
      start: span[0].toISOString().slice(0, 10),
      end: span[span.length - 1].toISOString().slice(0, 10)
    } : null;
  }).filter(Boolean);
}

// ── 영업시간 문자열에서 정기휴무 요일을 센다 (intl.js 의 closeStat 과 같은 규칙)
const DN = ['일', '월', '화', '수', '목', '금', '토'];
function dayStat(list) {
  const day = [0, 0, 0, 0, 0, 0, 0]; let always = 0, hol = 0, brk = 0;
  list.forEach(x => {
    const s = String(x.rest || '');
    if (/브레이크|준비\s*시간|준비시간|라스트오더|마지막\s*주문/.test(String(x.open || ''))) brk++;
    if (!s) return;
    if (/연중무휴|무휴/.test(s)) { always++; return; }
    DN.forEach((d, i) => { if (new RegExp(d + '요일|매주\\s*' + d + '|' + d + '휴').test(s)) day[i]++; });
    if (/명절|설날|추석/.test(s)) hol++;
  });
  return { n: list.length, day, always, hol, brk };
}

const CSS = `
<style>
.hjw{background:#fff7ed;border:1.5px solid #fed7aa;border-radius:15px;padding:16px 18px;margin:14px 0}
.hjw h2{font-size:1.06rem;font-weight:900;color:#9a3412;margin:0 0 7px}
.hjw p{color:#7c2d12;font-size:.95rem;line-height:1.85;margin:0}
.hjc{background:#fff;border-radius:16px;padding:18px 20px;margin:14px 0;box-shadow:0 2px 10px rgba(31,41,55,.06)}
.hjc h2{font-size:1.05rem;font-weight:900;color:#0a6c63;margin:0 0 8px}
.hjc p{color:#374151;font-size:.95rem;line-height:1.85;margin:0 0 8px}
.hjt{width:100%;border-collapse:collapse;font-size:.93rem;margin:8px 0}
.hjt th{background:#f6fbfa;color:#0a6c63;font-weight:800;text-align:left;padding:9px 11px;border-bottom:2px solid #dcefeb}
.hjt td{padding:9px 11px;border-bottom:1px solid #eef2f1;color:#374151}
.hjt td.n{text-align:right;font-weight:800}
.hjt tr.off td{background:#fff7ed}
.hjbar{display:flex;align-items:center;gap:9px;margin:5px 0}
.hjbar .l{width:34px;font-weight:800;color:#374151;font-size:.9rem}
.hjbar .b{flex:1;background:#f1f5f4;border-radius:999px;height:15px;overflow:hidden}
.hjbar .b i{display:block;height:100%;background:#cfe9e4;border-radius:999px}
.hjbar.on .b i{background:#f0803c}
.hjbar .v{width:74px;text-align:right;font-weight:800;color:#374151;font-size:.87rem}
.hjlist{display:grid;gap:8px;margin-top:8px}
.hjlist a,.hjlist div.it{display:block;border:1.5px solid #eef2f1;border-radius:11px;padding:10px 12px;text-decoration:none}
.hjlist .nm{font-weight:800;color:#0c7d72;font-size:.94rem}
.hjlist .mt{color:#6b7280;font-size:.83rem;margin-top:2px}
.hjnav{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}
.hjnav a{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.88rem;padding:9px 14px;border-radius:999px;text-decoration:none}
.hjnote{color:#9aa3af;font-size:.81rem;line-height:1.65;margin-top:9px}
</style>`;

function md(d) { return `${d.getMonth() + 1}月${d.getDate()}日（${WD[d.getDay()]}）`; }

function build(ctx) {
  const { layout, writePage, TODAY } = ctx;
  const T = String(TODAY).replace(/-/g, '');
  const bs = blocks(TODAY).slice(0, 6);        // 앞으로 6개 연휴까지
  if (!bs.length) return [];

  const R = dayStat(load('restaurants_ko.json'));
  const C = dayStat(load('cafes_ko.json'));
  const jaFes = load('festivals_ja.json');
  const slugs = (() => { try { return load('ja_festival_slugs.json'); } catch (e) { return {}; } })();
  const MKT = load('markets_std.json').filter(m =>
    Array.isArray(m.daysNum) && m.daysNum.length === 2 && Math.abs(m.daysNum[0] - m.daysNum[1]) === 5);

  const urls = [];
  bs.forEach((b, bi) => {
    const wdays = [...new Set(b.span.map(d => d.getDay()))].sort();
    // 이 연휴에 걸리는 요일 중 정기휴무가 많은 순
    const wsort = wdays.slice().sort((x, y) => (R.day[y] + C.day[y]) - (R.day[x] + C.day[x]));
    const worst = wsort[0];

    const rowsH = b.span.map(d => {
      const ymd = d.toISOString().slice(0, 10);
      const h = b.days.find(x => x.date === ymd);
      const wk = d.getDay() === 0 || d.getDay() === 6;
      return `<tr class="${h || wk ? 'off' : ''}"><td>${md(d)}</td><td>${
        h ? esc((NAME[baseName(h.name)] || {}).ja || h.name) + (/대체/.test(h.name) ? '（振替休日）' : '')
          : (wk ? '週末' : '平日')}</td></tr>`;
    }).join('');

    // ⚠️ 처음엔 «요일별»로 그렸더니 어느 연휴든 「일요일 824店」이 1등이라 그 연휴 이야기가 안 됐다.
    //    → 날짜별로 그린다. 「10月9日（金）は28店」처럼 그날 이야기가 되어야 쓸모가 있다.
    const holSet = new Set(b.days.map(d => d.date));
    const cnt = d => R.day[d.getDay()] + C.day[d.getDay()];
    const mx = Math.max(...b.span.map(cnt)) || 1;
    const bars = b.span.map(d => {
      const isHol = holSet.has(d.toISOString().slice(0, 10));
      return `<div class="hjbar${isHol ? ' on' : ''}"><span class="l">${d.getMonth() + 1}/${d.getDate()}</span>
<span class="b"><i style="width:${Math.round(cnt(d) / mx * 100)}%"></i></span><span class="v">${WD[d.getDay()]} ${nf(cnt(d))}店</span></div>`;
    }).join('');
    const holDays = b.span.filter(d => holSet.has(d.toISOString().slice(0, 10)));

    // 이 연휴에 열리는 축제(일본어판)
    // ⚠️ 그냥 「기간이 겹치는 것」으로 뽑았더니 «연중 상설 공연»(01/01〜12/31, 土曜常設公演)이 목록을
    //    도배했다. 그건 「이 연휴에 열리는 축제」가 아니다. 45일 넘게 이어지는 것은 뺀다.
    const s8 = b.start.replace(/-/g, ''), e8 = b.end.replace(/-/g, '');
    const dayLen = f => {
      const a = String(f.start || ''), z = String(f.end || '');
      if (!/^\d{8}$/.test(a) || !/^\d{8}$/.test(z)) return 999;
      return (new Date(`${z.slice(0, 4)}-${z.slice(4, 6)}-${z.slice(6, 8)}`)
        - new Date(`${a.slice(0, 4)}-${a.slice(4, 6)}-${a.slice(6, 8)}`)) / 86400000 + 1;
    };
    const fes = jaFes
      .filter(f => String(f.start || '') <= e8 && String(f.end || '') >= s8 && dayLen(f) <= 45)
      .sort((x, y) => (slugs[String(y.id)] ? 1 : 0) - (slugs[String(x.id)] ? 1 : 0)
        || String(x.start).localeCompare(String(y.start)))
      .slice(0, 8);

    // 이 연휴에 서는 오일장 — 날짜별로 몇 곳인지
    const mdays = [];
    b.span.forEach(d => {
      const last = d.getDate() % 10;
      const n = MKT.filter(m => m.daysNum.some(x => (x % 10) === last)).length;
      if (n) mdays.push({ d, n });
    });

    const content = `<main><div class="wrap">${CSS}
<p style="font-size:.85rem;color:#9aa3af;margin:8px 0"><a href="/ja/" style="color:#0c7d72">ホーム</a> › <a href="/ja/closed/" style="color:#0c7d72">休む日</a> › ${esc(b.ja)}</p>
<h1 style="font-size:1.44rem;font-weight:900;letter-spacing:-.02em;margin:6px 0 4px">${esc(b.ja)}（${
      b.span.length}連休）— 韓国のお店は開いていますか</h1>
<p style="color:#6b7280;font-size:.93rem;line-height:1.75;margin:0 0 6px">${
      md(b.span[0])}〜${md(b.span[b.span.length - 1])}。韓国観光公社に登録された飲食店${nf(R.n)}店・カフェ${nf(C.n)}店の営業時間データから、この連休に何が閉まるのかを数えました。</p>

${b.big ? `<div class="hjw"><h2>⚠️ ${esc(b.ja)}は「街が止まる」連休です</h2>
<p>韓国の二大名節（ソルラル・チュソク）は、多くの個人経営の店が数日まとめて休みます。営業時間データに「名節休業」と明記している店だけでも<b>${nf(R.hol + C.hol)}店</b>あり、明記していない店も当日になって閉まっていることが珍しくありません。宮殿や大型施設は開いていますが、路地の食堂は期待しないでください。</p></div>`
      : `<div class="hjc"><h2>結論から</h2><p>${esc(b.ja)}は名節（ソルラル・チュソク）ではないので、<b>飲食店やカフェが一斉に閉まることはありません</b>。デパート・コンビニ・カフェチェーンは通常営業です。閉まるのは官公庁・銀行・一部の博物館で、注意すべきなのはむしろ下の「曜日の定休日」の方です。</p></div>`}

<div class="hjc"><h2>この連休の日付</h2>
<table class="hjt"><thead><tr><th>日付</th><th>区分</th></tr></thead><tbody>${rowsH}</tbody></table>
<p class="hjnote">韓国は祝日が土日と重なると振替休日になります（すべての祝日ではありません）。上の表は公式の祝日カレンダーに基づいています。</p></div>

<div class="hjc"><h2>⭐ 見落としやすいのは「曜日の定休日」</h2>
<p>祝日カレンダーだけ見ていると気づきませんが、韓国の個人店は<b>曜日で定休日を決めています</b>。この連休に含まれる曜日で、定休日にしている店が何店あるかを数えました。</p>
${bars}
<p>${holDays.map(d => `<b>${md(d)}</b>は${WD[d.getDay()]}曜日で、この曜日を定休日にしている店が<b>${nf(cnt(d))}店</b>あります。`).join('')}
この連休で最も休みが多いのは<b>${md(b.span.reduce((a, d) => cnt(d) > cnt(a) ? d : a, b.span[0]))}</b>です。行きたい店が決まっているなら、その日は営業しているか先に確認してください。</p>
<p class="hjnote">飲食店${nf(R.n)}店・カフェ${nf(C.n)}店のうち、営業時間欄に定休日を書いている店を数えたものです。書いていない店（無休とは限りません）は含みません。年中無休と明記している店は飲食店${nf(R.always)}店・カフェ${nf(C.always)}店あります。</p></div>

${mdays.length ? `<div class="hjc"><h2>🏮 この連休に立つ五日市</h2>
<p>韓国の田舎の市場は日付の末尾で決まった日だけ、5日ごとに開きます。連休中に開く市場の数を日ごとに出しました。</p>
<table class="hjt"><thead><tr><th>日付</th><th class="n">開く市場</th></tr></thead><tbody>${
      mdays.map(x => `<tr><td>${md(x.d)}</td><td class="n">${nf(x.n)}ヶ所</td></tr>`).join('')}</tbody></table>
<p class="hjnote">全国${nf(MKT.length)}ヶ所の五日市（行政安全部の標準データ）から計算しました。場所は<a href="/ja/jangteo/" style="color:#0c7d72;font-weight:700">五日市のページ</a>で探せます。</p></div>` : ''}

${fes.length ? `<div class="hjc"><h2>🎪 この連休に開かれている祭り</h2>
<div class="hjlist">${fes.map(f => {
      const sl = slugs[String(f.id)];
      const inner = `<span class="nm">${esc(f.title)}</span><span class="mt">${String(f.start).slice(4, 6)}/${String(f.start).slice(6, 8)}〜${String(f.end).slice(4, 6)}/${String(f.end).slice(6, 8)} · ${esc(f.addr || f.region || '')}</span>`;
      return sl ? `<a href="/ja/festival/${esc(sl)}/">${inner}</a>` : `<div class="it">${inner}</div>`;
    }).join('')}</div>
<p class="hjnote"><a href="/ja/festival/" style="color:#0c7d72;font-weight:700">韓国の祭り一覧</a>で月ごとに探せます。</p></div>` : ''}

<div class="hjnav">
${bs.filter(o => o.slug !== b.slug).map(o => `<a href="/ja/closed/${o.slug}/">${esc(o.ja)}（${o.span.length}連休）</a>`).join('')}
<a href="/ja/closed/">🚪 休む日まとめ</a><a href="/ja/calendar/">🗓️ いつ行くか</a></div>
</div></main>`;

    writePage(`ja/closed/${b.slug}`, layout(
      `${b.ja}（${b.span.length}連休）韓国のお店は開いてる？定休日と休業を数えました | Chukjemoa`,
      `${md(b.span[0])}〜${md(b.span[b.span.length - 1])}。飲食店${nf(R.n)}店・カフェ${nf(C.n)}店の営業時間データから、この連休に閉まる店と曜日ごとの定休日を数えました。`,
      `/ja/closed/${b.slug}/`, content, { lang: 'ja' }));
    urls.push(`/ja/closed/${b.slug}/`);
  });

  // 유령 정리 — 지난 연휴 페이지는 지운다(날짜로 거르는 페이지는 매번 유령을 만든다)
  const keep = new Set(bs.map(b => b.slug));
  const dir = path.join(ctx.ROOT || __dirname, 'ja', 'closed');
  if (fs.existsSync(dir)) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory() || keep.has(e.name)) continue;
      fs.rmSync(path.join(dir, e.name), { recursive: true, force: true });
      console.log('  🗑 유령 페이지 삭제 /ja/closed/' + e.name + '/');
    }
  }
  console.log(`✓ /ja/closed/{연휴}/ — ${urls.length}개 (${bs.map(b => b.slug + b.span.length + '일').join(' · ')})`);
  return urls;
}

module.exports = { build, blocks, NAME, baseName };
