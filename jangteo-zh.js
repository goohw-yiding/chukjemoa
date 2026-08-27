// 🏮 중문 간체 오일장(五日場) 안내 /zh/jangteo/
//
// 2026-08-27: 영문판(jangteo-en.js)에 이어 신설. 데이터 출처: TourAPI ChsService2 쇼핑(contentTypeId=79)
//   cat3=A04010100(오일장)+A04010200(전통시장). fetch-markets-zh.js 가 미리 수집해 data/markets_zh.json 에
//   저장해 둔 것을 읽기만 한다. region 필드는 fetch 단계에서 이미 정리돼 있다.
const fs = require('fs'), path = require('path');

function load(f) { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { return []; } }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function daysFromFair(fair) {
  const nums = (String(fair || '').match(/\d{1,2}/g) || []).map(Number).filter(n => n >= 1 && n <= 31);
  if (nums.length < 2) return null;
  const ends = [...new Set(nums.map(n => n % 10 || 10))].sort((a, b) => a - b);
  if (ends.length !== 2) return null;
  return (ends[1] - ends[0] === 5) ? ends : null;
}

function build(ctx) {
  const { ROOT, layout, writePage, SITE, TODAY } = ctx;
  const raw = load('markets_zh.json');
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
<div class="jdays">${r.fair ? esc(r.fair) : (r.daysNum.length ? '' : '官方未列出开市日期')}<span class="jnext"></span></div>
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
.zhbox{background:#fff;border-radius:18px;box-shadow:0 3px 14px rgba(31,41,55,.08);padding:24px 28px;margin:18px 0}
.zhbox h2{font-size:1.22rem;font-weight:900;color:#0a6c63;margin-bottom:10px}
.zhbox p{margin:9px 0;line-height:1.85;color:#374151}
.zhbox li{margin:7px 0 7px 18px;line-height:1.8;color:#374151}
.jfilter{display:flex;flex-wrap:wrap;gap:7px;margin:14px 0}
.jfilter button{border:1.5px solid #a9e5dd;background:#fff;color:#0c7d72;border-radius:20px;padding:8px 15px;font-size:.87rem;font-weight:800;cursor:pointer;font-family:inherit}
.jfilter button.on{background:linear-gradient(135deg,#0f9d8f,#2dd4bf);color:#fff;border-color:transparent}
</style>
<h1 style="font-size:1.55rem;font-weight:900;margin:10px 0 6px">🏮 韩国传统市场・五日集市完全指南</h1>
<p style="color:#6b7280;margin-bottom:6px">全国${rows.length}处传统市场与五日集市（오일장），韩国观光公社官方数据。</p>

<div class="zhbox">
<h2>什么是"五日集市"（오일장）？</h2>
<p>韩国的许多传统市场并非天天营业，而是按<b>5天一个周期</b>开市。标注"逢2、7"开市的市场，就是每月2、7、12、17、22、27日开市。这种定期集市被称为<b>오일장（五日场）</b>。</p>
<p>对已经逛过明洞和弘大的游客来说，五日集市是感受韩国日常生活最简单的方式之一。摊主多是附近的农户和渔民，价格是本地价，商品也随季节变化。</p>
<h2>出发前须知</h2>
<ul>
<li><b>带现金。</b> 大摊位可能支持刷卡或移动支付，但小摊贩大多只收现金。</li>
<li><b>上午前往。</b> 集市通常清晨开市，中午前后最热闹，傍晚逐渐收摊。</li>
<li><b>小吃是亮点。</b> 煎饼（전）、血肠（순대）、汤饭（국밥）现场制作，比市区更便宜、也更地道。</li>
<li><b>日期按阳历计算，与农历无关</b> — "逢2、7"指的是每月日期的个位数。</li>
</ul>
</div>

<div class="jfilter" id="jf"><button data-r="" class="on">全部地区</button>${regions.map(r => `<button data-r="${esc(r)}">${esc(r)}</button>`).join('')}</div>
<div class="jgrid" id="jg">${rows.map(card).join('\n')}</div>

<div class="zhbox">
<h2>把集市和庆典安排在同一天</h2>
<p>如果集市的开市日恰好碰上附近的庆典，一天就能逛两个地方。可以用<a href="/zh/search/">庆典搜索</a>查一下你出行日期附近有什么活动。</p>
</div>
<p class="note" style="margin-top:18px;color:#9aa3af;font-size:.85rem">数据来源：韩国观光公社（TourAPI，官方中文内容）。开市日期可能因法定假日（春节・中秋）而调整，出行前请再次确认。</p>
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
    el.textContent = r.add===0 ? '🔥 今天开市！' : (r.add===1 ? '👉 明天（'+label+'）' : '👉 下次：'+label+'（还有'+r.add+'天）');
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
    '@context': 'https://schema.org', '@type': 'ItemList', name: '韩国传统市场・五日集市',
    numberOfItems: rows.length,
    itemListElement: rows.map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: r.name }))
  })}</script>`;

  writePage('zh/jangteo', layout(
    '韩国传统市场・五日集市完全指南 | Chukjemoa',
    `全国${rows.length}处传统市场与五日集市 — 开市日期、位置与特产一览。数据来自韩国观光公社官方资料。`,
    '/zh/jangteo/', content, { lang: 'zh', jsonld: ld, ogImage: '/img/jangteo.webp' }));

  console.log(`✓ /zh/jangteo/ — ${rows.length}곳`);
  return ['/zh/jangteo/'];
}

module.exports = { build };
