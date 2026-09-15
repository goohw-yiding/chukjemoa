// 🏮 일문 오일장(五日場) 안내 /ja/jangteo/
//
// 2026-08-27: 영문판(jangteo-en.js)에 이어 일본어·스페인어·중국어 간체 사이트에도 오일장 페이지를 만든다.
//   데이터 출처: TourAPI JpnService2 쇼핑(contentTypeId=79) cat3=A04010100(오일장)+A04010200(전통시장).
//   fetch-markets-ja.js 가 미리 수집해 data/markets_ja.json 에 저장해 둔 것을 읽기만 한다.
//   region 필드는 fetch 단계에서 이미 행정구역코드 기반으로 정리돼 있어 여기서는 추가 파싱이 필요 없다.
const fs = require('fs'), path = require('path');

function load(f) { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { return []; } }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
// fairday 문장에서 "5일 간격" 규칙으로 개시일 끝자리 두 개를 뽑는다(한국어판·영문판과 같은 규칙).
function daysFromFair(fair) {
  const nums = (String(fair || '').match(/\d{1,2}/g) || []).map(Number).filter(n => n >= 1 && n <= 31);
  if (nums.length < 2) return null;
  const ends = [...new Set(nums.map(n => n % 10 || 10))].sort((a, b) => a - b);
  if (ends.length !== 2) return null;
  return (ends[1] - ends[0] === 5) ? ends : null;
}

function build(ctx) {
  const { ROOT, layout, writePage, SITE, TODAY } = ctx;
  const raw = load('markets_ja.json');
  if (!raw.length) return [];

  const rows = raw.map(m => ({
    id: m.id, name: m.name || m.nameRaw, addr: m.addr, region: m.region || '',
    x: m.x, y: m.y, img: m.img, fair: m.fair, daysNum: daysFromFair(m.fair) || [],
    sale: m.sale, open: m.open, rest: m.rest, park: m.park, tel: m.tel, since: m.since, ov: m.ov
  }));
  const regions = [...new Set(rows.map(r => r.region).filter(Boolean))];

  const card = r => `<div class="jcard" data-days="${r.daysNum.join(',')}" data-region="${esc(r.region)}">
${r.img ? `<img src="${esc(r.img)}" alt="${esc(r.name)}" loading="lazy" style="width:100%;height:140px;object-fit:cover;border-radius:10px;margin-bottom:10px" onerror="this.remove()">` : ''}
<div class="jhead"><h3>${esc(r.name)}</h3></div>
<div class="jmeta">📍 ${esc(r.region)}</div>
<div class="jdays">${r.fair ? esc(r.fair) : (r.daysNum.length ? '' : '開催日の公式表記なし')}<span class="jnext"></span></div>
${r.ov ? `<p class="jdesc">${esc(r.ov.slice(0, 160))}${r.ov.length > 160 ? '…' : ''}</p>` : ''}
${r.sale ? `<div class="jfam">🛒 ${esc(r.sale)}</div>` : ''}
</div>`;

  const content = `<main><div class="wrap">
<style>
.jgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin:16px 0}
.jcard{background:#fff;border-radius:16px;box-shadow:0 3px 14px rgba(31,41,55,.08);padding:18px 20px}
.jhead h3{font-size:1.05rem;font-weight:900;color:#0a6c63}
.jmeta{font-size:.85rem;color:#6b7280;margin-top:5px}
.jdays{margin-top:9px;font-size:.88rem;color:#374151;line-height:1.5}
.jnext{display:block;margin-top:5px;font-size:.85rem;color:#0f9d8f;font-weight:800}
.jdesc{margin-top:9px;font-size:.9rem;color:#4b5563;line-height:1.6}
.jfam{margin-top:9px;font-size:.85rem;color:#0a6c63;background:#f2fbfa;border-radius:10px;padding:7px 11px}
.jabox{background:#fff;border-radius:18px;box-shadow:0 3px 14px rgba(31,41,55,.08);padding:24px 28px;margin:18px 0}
.jabox h2{font-size:1.2rem;font-weight:900;color:#0a6c63;margin-bottom:10px}
.jabox p{margin:9px 0;line-height:1.9;color:#374151}
.jabox li{margin:7px 0 7px 18px;line-height:1.85;color:#374151}
.jfilter{display:flex;flex-wrap:wrap;gap:7px;margin:14px 0}
.jfilter button{border:1.5px solid #a9e5dd;background:#fff;color:#0c7d72;border-radius:20px;padding:8px 15px;font-size:.87rem;font-weight:800;cursor:pointer;font-family:inherit}
.jfilter button.on{background:linear-gradient(135deg,#0f9d8f,#2dd4bf);color:#fff;border-color:transparent}
</style>
<h1 style="font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:10px 0 6px">🏮 韓国の伝統市場・五日市場（오일장）完全ガイド</h1>
<p style="color:#6b7280;margin-bottom:6px">韓国観光公社の公式データによる、全国${rows.length}箇所の伝統市場・五日市場。</p>

<div class="jabox">
<h2>「五日市場（오일장）」とは？</h2>
<p>韓国の伝統市場の多くは毎日開くわけではなく、<b>5日に一度のサイクル</b>で開きます。「2日・7日」に開くと表示された市場なら、毎月2、7、12、17、22、27日に店が立ちます。この定期市を<b>오일장（五日場）</b>と呼びます。</p>
<p>明洞やホンデをすでに回った方にとって、五日市場は地元の暮らしに触れる一番手軽な方法のひとつです。売り手は近隣の農家や漁師で、値段は地元価格、品ぞろえは季節ごとに変わります。</p>
<h2>行く前に</h2>
<ul>
<li><b>現金を持参しましょう。</b> 大きな店はカード・モバイル決済に対応していますが、小さな屋台は現金のみのことが多いです。</li>
<li><b>午前中に行きましょう。</b> 市場は夜明けに始まり、昼前後が最も賑わい、夕方には片付き始めます。</li>
<li><b>屋台グルメが一番の楽しみです。</b> チヂミ（전）、スンデ（순대）、クッパ（국밥）はその場で作られ、都市部より安く本場の味です。</li>
<li><b>日付は太陽暦（新暦）基準です</b>、旧暦ではありません — 「2日・7日」は毎月の日付の下一桁を指します。</li>
</ul>
</div>

${/* 🚄 2026-09-15 — 아래(본문 93% 지점)에도 같은 링크가 있지만 카드 3만 자를 지나야 나온다.
     효과를 본 자리가 «본문 31%»였다. 목록을 보기 «전»에 한 줄 둔다. */''}
<p style="color:#4b5563;font-size:.93rem;line-height:1.75;margin:0 0 10px;padding:10px 13px;background:#f6fbfa;border-radius:12px">🚄 五日市はほとんどが<b>地方</b>にあります。ソウルからの<a href="/ja/daytrip/">鉄道の所要時間と運賃</a>を駅ごとに出しています（駅から15km以内の五日市と開催日つき）。名節の前後は開催日がずれるので<a href="/ja/busy/">混む日</a>も先にご覧ください。</p>

<div class="jfilter" id="jf"><button data-r="" class="on">すべての地域</button>${regions.map(r => `<button data-r="${esc(r)}">${esc(r)}</button>`).join('')}</div>
<div class="jgrid" id="jg">${rows.map(card).join('\n')}</div>

<div class="jabox">
<h2>市場の日とお祭りを同じ日に</h2>
<p>市場の開催日が近くのお祭りと重なれば、一度の旅で両方楽しめます。<a href="/ja/search/">お祭り検索</a>で旅行日程に何が開催されているか調べてみましょう。</p>
</div>

${/* 🚄 2026-09-15 — /ja/jangteo/ 는 크롤 9/04 로 홈(8/28)보다 신선하다. 그런데 본문에서
     나가는 링크가 /ja/search/ 하나뿐이었다. 내비 링크는 구글이 안 따라간다(실측:
     /ja/places/ 는 156장 전부가 내비로 링크하는데 crawl=none).
     왜 daytrip 인가: 오일장은 «전부 지방에 있다». 이 페이지를 읽은 사람의 다음 질문이
       「그 시장까지 어떻게 가나」다. daytrip 이 역별 소요시간·운임과 함께 «역 반경 15km 안의
       오일장이 며칠에 서는지»까지 이미 싣고 있다 — 같은 데이터로 이어진다. */''}
<div class="jabox">
<h2>🚄 その市場まで、どう行くか</h2>
<p>五日市はほとんどが<b>地方</b>にあります。ソウルから鉄道で行ける街の<b>所要時間・運賃・1日の本数</b>を駅ごとに出したのが<a href="/ja/daytrip/">日帰りで行ける街</a>です。そこには<b>駅から15km以内に立つ五日市と、その開催日</b>も一緒に載せてあります — 「その日に立つ市場がある街」から選べます。</p>
<p>日程を決める前に、<a href="/ja/busy/">韓国が混む日</a>もご覧ください。<b>名節（ソルラル・チュソク）の前後は市場の開催日そのものがずれます</b>。</p>
</div>
<p class="note" style="margin-top:18px;color:#9aa3af;font-size:.85rem">データ：韓国観光公社（TourAPI、公式日本語コンテンツ）。市場の開催日は祝日（旧正月・秋夕）前後に変更される場合があります。事前に現地でご確認ください。</p>
</div></main>
<script>
(function(){
  var g=document.getElementById('jg'); if(!g) return;
  var now=new Date(Date.now()+9*3600*1000); // KST
  var y=now.getUTCFullYear(), mo=now.getUTCMonth(), d=now.getUTCDate();
  function nextDay(days){
    if(!days.length) return null;
    for(var add=0; add<40; add++){
      var t=new Date(Date.UTC(y,mo,d+add));
      var dd=t.getUTCDate();
      if(days.indexOf(dd)>=0) return {add:add,date:t};
    }
    return null;
  }
  Array.prototype.forEach.call(g.querySelectorAll('.jcard'),function(c){
    var raw=c.getAttribute('data-days');
    var days=raw?raw.split(',').map(Number).filter(function(n){return n>0;}):[];
    var el=c.querySelector('.jnext');
    if(!days.length){ return; }
    var r=nextDay(days);
    if(!r){ return; }
    var label=(r.date.getUTCMonth()+1)+'月'+r.date.getUTCDate()+'日';
    el.textContent = r.add===0 ? '🔥 本日開催！' : (r.add===1 ? '👉 明日（'+label+'）' : '👉 次回：'+label+'（あと'+r.add+'日）');
  });
  var fb=document.getElementById('jf');
  fb.addEventListener('click',function(e){
    var b=e.target.closest('button'); if(!b) return;
    Array.prototype.forEach.call(fb.querySelectorAll('button'),function(x){x.classList.remove('on');});
    b.classList.add('on');
    var r=b.getAttribute('data-r');
    Array.prototype.forEach.call(g.querySelectorAll('.jcard'),function(c){
      c.style.display = (!r || c.getAttribute('data-region')===r) ? '' : 'none';
    });
  });
})();
</script>`;

  const ld = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'ItemList', name: '韓国の伝統市場・五日市場',
    numberOfItems: rows.length,
    itemListElement: rows.map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: r.name }))
  })}</script>`;

  writePage('ja/jangteo', layout(
    '韓国の伝統市場・五日市場（オイルジャン）完全ガイド | Chukjemoa',
    `韓国全国${rows.length}箇所の伝統市場・五日市場を紹介 — 開催日・場所・名物を掲載。韓国観光公社の公式データを使用。`,
    '/ja/jangteo/', content, { lang: 'ja', jsonld: ld, ogImage: '/img/jangteo.webp',
      // 🌏 2026-09-14 — hreflang 양방향. 한국어 /jangteo/ 만 고치면 구글이 무시한다.
      alternates: ctx.jangteoAlts ? ctx.jangteoAlts() : undefined }));

  console.log(`✓ /ja/jangteo/ — ${rows.length}곳`);
  return ['/ja/jangteo/'];
}

module.exports = { build };
