// 🏮 영문 오일장(五日場) 안내 /en/jangteo/
//
// 2026-08-20: 장남 님이 "오일장은 요즘 외국인이 관심 많다"고 해서 추가.
//   데이터 출처: TourAPI EngService2 쇼핑(contentTypeId=79) cat3=A04010100(오일장)+A04010200(전통시장).
//   ⚠️ 한국어판(markets_api.json, 143곳)과 contentId가 전혀 다른 네임스페이스 — 번역이 아니라
//   영문 서비스가 별도로 큐레이션한 34곳을 그대로 쓴다. fairday 필드가 이미 완성된 영문 문장으로
//   온다("On the 2nd, 7th..." 등) — 정규식으로 장날을 추측하지 않고 그 문장을 그대로 보여준다.
//   다음 개시일 카운트다운만 문장에서 끝자리 두 개(5 간격)를 뽑아 보조적으로 계산한다.
const fs = require('fs'), path = require('path');

function load(f) { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { return []; } }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
// 제목 끝에 붙은 한글 괄호(원문 병기, 간혹 안 닫힌 괄호 포함)를 통째로 제거
function cleanName(t) {
  return String(t || '').replace(/\s*[（(][^)）]*$/, '').replace(/\s*[（(][^)）]*[)）]\s*$/, '').trim() || t;
}
// fairday 영문 문장에서 "5 간격" 규칙으로 개시일 끝자리 두 개를 뽑는다(한국어판과 같은 규칙).
function daysFromFair(fair) {
  const nums = (String(fair || '').match(/\d{1,2}/g) || []).map(Number).filter(n => n >= 1 && n <= 31);
  if (nums.length < 2) return null;
  const ends = [...new Set(nums.map(n => n % 10 || 10))].sort((a, b) => a - b);
  if (ends.length !== 2) return null;
  return (ends[1] - ends[0] === 5) ? ends : null;
}
function regionOf(addr) {
  const parts = String(addr || '').split(',').map(s => s.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : 'South Korea';
}

function build(ctx) {
  const { ROOT, layout, writePage, SITE, TODAY } = ctx;
  const raw = load('markets_en.json');
  if (!raw.length) return [];

  const rows = raw.map(m => ({
    id: m.id, name: cleanName(m.name || m.nameRaw), addr: m.addr, region: regionOf(m.addr),
    x: m.x, y: m.y, img: m.img, fair: m.fair, daysNum: daysFromFair(m.fair) || [],
    sale: m.sale, open: m.open, rest: m.rest, park: m.park, tel: m.tel, since: m.since, ov: m.ov
  }));
  const regions = [...new Set(rows.map(r => r.region))].sort();

  const card = r => `<div class="jcard" data-days="${r.daysNum.join(',')}" data-region="${esc(r.region)}">
${r.img ? `<img src="${esc(r.img)}" alt="${esc(r.name)}" loading="lazy" style="width:100%;height:140px;object-fit:cover;border-radius:10px;margin-bottom:10px" onerror="this.remove()">` : ''}
<div class="jhead"><h3>${esc(r.name)}</h3></div>
<div class="jmeta">📍 ${esc(r.region)}</div>
<div class="jdays">${r.fair ? esc(r.fair) : (r.daysNum.length ? '' : 'Market days not officially listed')}<span class="jnext"></span></div>
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
.enbox{background:#fff;border-radius:18px;box-shadow:0 3px 14px rgba(31,41,55,.08);padding:24px 28px;margin:18px 0}
.enbox h2{font-size:1.2rem;font-weight:900;color:#0a6c63;margin-bottom:10px}
.enbox p{margin:9px 0;line-height:1.75;color:#374151}
.enbox li{margin:7px 0 7px 18px;line-height:1.7;color:#374151}
.jfilter{display:flex;flex-wrap:wrap;gap:7px;margin:14px 0}
.jfilter button{border:1.5px solid #a9e5dd;background:#fff;color:#0c7d72;border-radius:20px;padding:8px 15px;font-size:.87rem;font-weight:800;cursor:pointer;font-family:inherit}
.jfilter button.on{background:linear-gradient(135deg,#0f9d8f,#2dd4bf);color:#fff;border-color:transparent}
</style>
<h1 style="font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:10px 0 6px">🏮 Korea's Traditional Markets &amp; 5-Day Markets</h1>
<p style="color:#6b7280;margin-bottom:6px">${rows.length} traditional and five-day markets (오일장) across South Korea, with official info from the Korea Tourism Organization.</p>

<div class="enbox">
<h2>What is a "5-day market" (오일장)?</h2>
<p>Many of Korea's traditional markets aren't open every day — they open on a <b>five-day cycle</b>. A market listed as opening on "days ending in 2 and 7" is open on the 2nd, 7th, 12th, 17th, 22nd and 27th of each month. These recurring markets are called <b>ojang (오일장)</b>.</p>
<p>For visitors who've already seen Myeongdong and Hongdae, a 5-day market is one of the easiest ways to see everyday Korean life. Vendors are local farmers and fishers, prices are local prices, and what's for sale changes with the season.</p>
<h2>Before you go</h2>
<ul>
<li><b>Bring cash.</b> Larger stalls may accept cards or mobile pay, but small vendors are mostly cash-only.</li>
<li><b>Go in the morning.</b> Markets usually start at dawn, peak around midday, and wind down by evening.</li>
<li><b>Street food is the highlight.</b> Pancakes (jeon), Korean sausage (sundae) and soup with rice (gukbap) are made fresh and cheaper than in the city.</li>
<li><b>Dates follow the solar calendar</b>, not the lunar calendar — "2nd and 7th" means the day-of-month number, every month.</li>
</ul>
</div>

<div class="jfilter" id="jf"><button data-r="" class="on">All regions</button>${regions.map(r => `<button data-r="${esc(r)}">${esc(r)}</button>`).join('')}</div>
<div class="jgrid" id="jg">${rows.map(card).join('\n')}</div>

<div class="enbox">
<h2>Combine a market day with a festival</h2>
<p>If a market's opening day lines up with a nearby festival, you can visit both in one trip. Use <a href="/en/search/">Festival Finder</a> to find what's happening on your travel dates.</p>
</div>
<p class="note" style="margin-top:18px;color:#9aa3af;font-size:.85rem">Source: Korea Tourism Organization (TourAPI, official English content). Market days may shift around public holidays (Lunar New Year, Chuseok) — please confirm locally before visiting.</p>
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
  var MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  Array.prototype.forEach.call(g.querySelectorAll('.jcard'),function(c){
    var raw=c.getAttribute('data-days');
    var days=raw?raw.split(',').map(Number).filter(function(n){return n>0;}):[];
    var el=c.querySelector('.jnext');
    if(!days.length){ return; }
    var r=nextDay(days);
    if(!r){ return; }
    var label=MN[r.date.getUTCMonth()]+' '+r.date.getUTCDate();
    el.textContent = r.add===0 ? '🔥 Open today!' : (r.add===1 ? '👉 Tomorrow ('+label+')' : '👉 Next: '+label+' (in '+r.add+' days)');
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
    '@context': 'https://schema.org', '@type': 'ItemList', name: "Korea's Traditional & 5-Day Markets",
    numberOfItems: rows.length,
    itemListElement: rows.map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: r.name }))
  })}</script>`;

  writePage('en/jangteo', layout(
    "Korea's Traditional Markets & 5-Day Markets (Ojang) Guide | Chukjemoa",
    `${rows.length} traditional and five-day markets across South Korea — opening days, location, specialties. Official data from the Korea Tourism Organization.`,
    '/en/jangteo/', content, { lang: 'en', jsonld: ld, ogImage: '/img/jangteo.webp' }));

  console.log(`✓ /en/jangteo/ — ${rows.length}곳`);
  return ['/en/jangteo/'];
}

module.exports = { build };
