// 🛍️ /ja/grandsale/ — コリアグランドセール2027(코리아그랜드세일)
//
// 왜 (2026-10-24): GSC 28일 「コリアグランドセール 2027」 노출 93·클릭 0 — 일본어 2위 검색어인데
//   사이트 어디에도 그랜드세일 내용이 없었다. 쇼핑·할인은 일본인 여행자가 좋아하는 주제다.
// ⚠️ 확인된 사실만 쓴다(아래 SRC). 할인 내용·참여 업체는 «모집 중»이라 발표 전 — 지어내지 않는다.
//   공식 발표(jp.koreagrandsale.co.kr)가 나오면 FACT 를 고친다. 끝나면(2/13 뒤) 자동으로 「終了」 안내.
'use strict';
const fs = require('fs'), path = require('path');
const load = f => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { return null; } };
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── 확인된 사실 (2026-10-24)
const FACT = {
  y2027: { start: '2026-12-23', end: '2027-02-13', days: 53, recruitUntil: '2026-11-30' },
  y2026: { start: '2025-12-17', end: '2026-02-22' },
  officialJa: 'https://jp.koreagrandsale.co.kr/',
  vkcJa: 'https://vkc.or.kr/jp/main-project/korea-grand-sale/',
};
const SRC = [
  ['トラベルデイリー（韓国・2026年10月1日）「コリアグランドセール参加企業募集」', 'https://www.traveldaily.co.kr/news/articleView.html?idxno=72237'],
  ['ディスカバリーニュース（韓国・2026年10月1日）', 'https://www.discoverynews.kr/news/articleView.html?idxno=1103002'],
  ['スポーツワールド（韓国・2026年10月5日）', 'https://www.sportsworldi.com/newsView/20261005502761'],
  ['韓国訪問の年委員会 日本語ページ（2026年版の概要）', FACT.vkcJa],
  ['ニューシス（韓国・2025年12月17日）2026年版の開幕', 'https://www.newsis.com/view/NISX20251217_0003445359'],
];
const WD = ['日', '月', '火', '水', '木', '金', '土'];
const dObj = s => new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const md = s => { const d = dObj(s); return `${d.getMonth() + 1}月${d.getDate()}日（${WD[d.getDay()]}）`; };
const ymdJ = s => { const d = dObj(s); return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WD[d.getDay()]}）`; };
const KR_JA = { '기독탄신일': 'クリスマス', '1월1일': '元日', '설날': 'ソルラル（旧正月）', '대체공휴일(설날)': 'ソルラルの振替休日' };

const CSS = `<style>
.gs h1{font-size:1.45rem;font-weight:900;letter-spacing:-.02em;margin:8px 0 6px;line-height:1.4}
.gs .lead{color:#374151;font-size:1rem;line-height:1.85;margin:0 0 12px}
.gs .card{background:#fff;border:1px solid #e6eaee;border-radius:14px;padding:16px 18px;margin:14px 0}
.gs .card h2{font-size:1.06rem;font-weight:900;color:#0a6c63;margin:0 0 8px}
.gs .card p,.gs .card li{color:#374151;font-size:.95rem;line-height:1.8}
.gs .card ul{margin:4px 0 0 18px;padding:0}
.gs table{width:100%;border-collapse:collapse;font-size:.92rem;margin-top:6px}
.gs th,.gs td{border-top:1px solid #eef2f5;padding:8px 6px;text-align:left;vertical-align:top}
.gs th{color:#6b7280;font-weight:700;width:30%;white-space:nowrap}
.gs .note{color:#6b7280;font-size:.84rem;line-height:1.7;margin-top:8px}
.gs .hl{background:#fff8ef;border:1.5px solid #f6e2c4;border-radius:14px;padding:14px 17px;margin:12px 0}
.gs .hl p{color:#5b4a35;margin:0;line-height:1.8}
.gs a{color:#0c7d72;font-weight:700}
.gs .nav{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}
.gs .nav a{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.88rem;padding:9px 14px;border-radius:999px;text-decoration:none}
</style>`;

function build(ctx) {
  const { layout, writePage, TODAY } = ctx;
  const T = String(TODAY || '').slice(0, 10);
  const F = FACT.y2027;
  const ended = T > F.end;
  const running = !ended && T >= F.start;

  // 기간 안의 한·일 공휴일 — 데이터에서 계산(손으로 쓰지 않는다)
  const inRange = d => d >= F.start && d <= F.end;
  const kr = (load('holidays.json') || []).filter(h => inRange(h.date));
  const jp = (load('jp_holidays.json') || []).filter(h => inRange(h.date));
  const holRows = [
    ...kr.map(h => ({ d: h.date, c: '韓国', n: KR_JA[h.name] || h.name })),
    ...jp.map(h => ({ d: h.date, c: '日本', n: h.name })),
  ].sort((a, b) => a.d.localeCompare(b.d))
    .map(r => `<tr><td>${md(r.d)}</td><td>${r.c === '韓国' ? '🇰🇷 韓国' : '🇯🇵 日本'}</td><td>${esc(r.n)}</td></tr>`).join('');
  const seollal = kr.filter(h => /설날/.test(h.name)).map(h => h.date).sort();

  // 날씨 — ja-climate 와 같은 데이터(일본 기상청 평년값)
  const C = load('climate_normals_ja.json');
  const wRows = C ? [11, 0, 1].map(i => `<tr><td>${i + 1}月</td><td>${C.cities.seoul.temp[i].toFixed(1)}℃</td><td>${C.cities.tokyo.temp[i].toFixed(1)}℃</td></tr>`).join('') : '';

  const status = ended
    ? `<div class="hl"><p>🛑 <b>2027年版は${md(F.end)}で終了しました。</b>次回の日程は、発表があり次第このページを更新します。</p></div>`
    : running
      ? `<div class="hl"><p>🛍️ <b>開催中です</b>（${md(F.end)}まで）。参加店と特典は<a href="${FACT.officialJa}" target="_blank" rel="noopener">公式日本語サイト</a>で確認してください。</p></div>`
      : `<div class="hl"><p>📅 <b>2027年版は ${ymdJ(F.start)} 〜 ${ymdJ(F.end)} の${F.days}日間</b>の予定です。参加企業の募集が${md(F.recruitUntil)}まで続いているため、<b>どの店で何%引きか、といった特典の中身はまだ発表されていません。</b></p></div>`;

  const content = `<main><div class="wrap gs">${CSS}
<p style="font-size:.85rem;color:#9aa3af;margin:8px 0"><a href="/ja/" style="font-weight:400">ホーム</a> › コリアグランドセール</p>
<h1>コリアグランドセール2027 — 日程は12月23日〜2月13日、特典の分野と行く前に知っておくこと</h1>
<p class="lead">「コリアグランドセール（코리아그랜드세일）」は、韓国を訪れる<b>外国人旅行者向け</b>に、冬のあいだ全国で開かれる観光・ショッピングの割引イベントです。2011年から開かれています。2027年版の日程と、いまわかっていること・まだわからないことを、韓国側の発表と報道から整理しました。</p>
${status}

<div class="card"><h2>2027年版でわかっていること</h2>
<table><tbody>
<tr><th>期間</th><td>${ymdJ(F.start)} 〜 ${ymdJ(F.end)}（${F.days}日間）</td></tr>
<tr><th>対象</th><td>韓国を訪れる外国人旅行者</td></tr>
<tr><th>運営</th><td>韓国訪問の年委員会（한국방문의해위원회）</td></tr>
<tr><th>特典の分野</th><td>参加企業を募集している7分野：<br>ショッピング（百貨店・免税店・大型スーパー・伝統市場など）／宿泊（ホテル・ゲストハウス・リゾート）／飲食（レストラン・カフェ・食品ブランド）／体験（伝統文化・韓流・公演・展示）／交通（航空・鉄道・シティツアーバス）／ビューティー・健康（化粧品・美容店・健康食品）／便利サービス（決済・通信・観光交通パス・荷物の預かりと配送）</td></tr>
<tr><th>ウェルカムセンター</th><td>ソウル・釜山・江原など主な観光地に設けられる予定。移動式のポップアップ「プレイトラック」も出ます。</td></tr>
<tr><th>まだ未発表</th><td>参加店の一覧、割引率、クーポンの受け取り方。参加企業の募集は${md(F.recruitUntil)}まで。</td></tr>
</tbody></table>
<p class="note">日程は、韓国訪問の年委員会が2026年10月に出した参加企業募集の告知（韓国の報道3紙で確認）に書かれた予定です。変更があれば<a href="${FACT.officialJa}" target="_blank" rel="noopener">公式日本語サイト</a>の発表が優先です。</p></div>

<div class="card"><h2>参考：2026年版はこうでした</h2>
<p>前回は<b>${ymdJ(FACT.y2026.start)} 〜 ${ymdJ(FACT.y2026.end)}</b>に開かれました。主催は韓国の文化体育観光部、運営は韓国訪問の年委員会。ショッピングに加えて、航空・交通、宿泊、体験、フード、エンターテインメントまで特典が用意され、ウェルカムセンターでは外国語の案内、無料Wi-Fi、景品イベントなどが行われました。</p>
<p class="note">2027年版の期間は前回より少し短い${F.days}日間で、年末から旧正月（ソルラル）の後までをカバーします。</p></div>

${holRows ? `<div class="card"><h2>期間中の日韓の祝日 — 混む日・店が休む日</h2>
<table><thead><tr><th style="width:auto">日付</th><th style="width:auto">国</th><th style="width:auto">祝日</th></tr></thead><tbody>${holRows}</tbody></table>
<ul>
<li>日本の<b>年末年始・成人の日・建国記念の日</b>の休みは、どれもセール期間に入ります。航空券とホテルが高くなる時期なので、<a href="/ja/busy/">韓国が混む日</a>で前後の空き具合を先に見てください。</li>
${seollal.length ? `<li><b>ソルラル（旧正月）連休（${md(seollal[0])}〜${md(seollal[seollal.length - 1])}）は、個人経営の店が数日まとめて休みます。</b>セールで買い物をするなら、連休は外すのが確実です。くわしくは<a href="/ja/closed/seollal/">ソルラルに店は開いてる？</a></li>` : ''}
<li>元日は名節ではないので、デパート・コンビニ・カフェチェーンは基本的に開いています（<a href="/ja/closed/new-year/">元日に店は開いてる？</a>）。</li>
</ul>
<p class="note">祝日は韓国の公式祝日カレンダーと日本の内閣府「国民の祝日」から。</p></div>` : ''}

${wRows ? `<div class="card"><h2>真冬のセールです — ソウルは東京よりずっと寒い</h2>
<table><thead><tr><th style="width:auto">月</th><th style="width:auto">ソウルの平均気温</th><th style="width:auto">東京の平均気温</th></tr></thead><tbody>${wRows}</tbody></table>
<p>1月のソウルは平均で氷点下です。ダウンコート・手袋・帽子を用意してください。月ごとの天気は<a href="/ja/calendar/">いつ行くか</a>にあります。</p>
<p class="note">気象庁「世界の天候データツール（ClimatView）」地点別平年値（1991〜2020年）。</p></div>` : ''}

<div class="card"><h2>特典を使うまでの流れ</h2>
<ol style="margin:4px 0 0 20px;padding:0;color:#374151;font-size:.95rem;line-height:1.85">
<li>出発前に<a href="${FACT.officialJa}" target="_blank" rel="noopener">公式日本語サイト（jp.koreagrandsale.co.kr）</a>で、参加店と特典の条件を見る（参加店の一覧は、発表され次第ここにも追記します）。</li>
<li>行きたい店の住所は韓国語でメモしておく — 韓国ではGoogleマップの経路案内が使えないので、NAVERマップかカカオマップに貼ります。地域ごとの住所は<a href="/ja/places/">行ってみる場所</a>に。</li>
<li>現地ではウェルカムセンター（ソウル・釜山・江原などに設置予定）で、外国語での案内を受けられます（2026年版では通訳・無料Wi-Fiもありました）。</li>
</ol>
${require('./klook.js').esim('ja-grandsale')}</div>

<div class="card"><h2>出典</h2>
<ul style="font-size:.86rem">${SRC.map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener nofollow" style="font-weight:400">${esc(t)}</a></li>`).join('')}</ul>
<p class="note">2026年10月24日に確認。特典の中身は発表され次第、このページに追記します。</p></div>

<div class="nav">
<a href="/ja/busy/">📅 韓国が混む日</a><a href="/ja/closed/">🚪 休む日 — 店は開いているか</a><a href="/ja/calendar/">🗓️ いつ行くか</a><a href="/ja/places/">📍 行ってみる場所</a></div>
</div></main>`;

  writePage('ja/grandsale', layout(
    'コリアグランドセール2027 日程は12/23〜2/13 — 特典の分野と行く前に知っておくこと | チュクチェモア',
    '外国人旅行者向けの韓国の割引イベント「コリアグランドセール」2027年版は2026年12月23日〜2027年2月13日（53日間）。特典の7分野、2026年版の内容、期間中の日韓の祝日とソルラル休業、真冬の気温をまとめました。',
    '/ja/grandsale/', content, { lang: 'ja' }));
  console.log(`✓ /ja/grandsale/ — ${F.start}~${F.end}${ended ? ' (終了)' : running ? ' (開催中)' : ''} · 祝日 ${kr.length + jp.length}件`);
  return ['/ja/grandsale/'];
}

module.exports = { build, FACT };
