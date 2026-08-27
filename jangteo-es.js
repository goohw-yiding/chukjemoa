// 🏮 서어(스페인어) 오일장(五日場) 안내 /es/jangteo/
//
// 2026-08-27: 영문판(jangteo-en.js)에 이어 신설. 데이터 출처: TourAPI SpnService2 쇼핑(contentTypeId=79)
//   cat3=A04010100(오일장)+A04010200(전통시장). fetch-markets-es.js 가 미리 수집해 data/markets_es.json 에
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
  const raw = load('markets_es.json');
  if (!raw.length) return [];

  const rows = raw.map(m => ({
    id: m.id, name: m.name || m.nameRaw, addr: m.addr, region: m.region || '',
    x: m.x, y: m.y, img: m.img, fair: m.fair, daysNum: daysFromFair(m.fair) || [],
    sale: m.sale, open: m.open, rest: m.rest, park: m.park, tel: m.tel, since: m.since, ov: m.ov
  }));
  const regions = [...new Set(rows.map(r => r.region).filter(Boolean))].sort();

  const card = r => `<div class="jcard" data-days="${r.daysNum.join(',')}" data-region="${esc(r.region)}">
${r.img ? `<img src="${esc(r.img)}" alt="${esc(r.name)}" loading="lazy" style="width:100%;height:140px;object-fit:cover;border-radius:10px;margin-bottom:10px" onerror="this.remove()">` : ''}
<div class="jhead"><h3>${esc(r.name)}</h3></div>
<div class="jmeta">📍 ${esc(r.region)}</div>
<div class="jdays">${r.fair ? esc(r.fair) : (r.daysNum.length ? '' : 'Días de mercado no listados oficialmente')}<span class="jnext"></span></div>
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
.esbox{background:#fff;border-radius:18px;box-shadow:0 3px 14px rgba(31,41,55,.08);padding:24px 28px;margin:18px 0}
.esbox h2{font-size:1.2rem;font-weight:900;color:#0a6c63;margin-bottom:10px}
.esbox p{margin:9px 0;line-height:1.75;color:#374151}
.esbox li{margin:7px 0 7px 18px;line-height:1.7;color:#374151}
.jfilter{display:flex;flex-wrap:wrap;gap:7px;margin:14px 0}
.jfilter button{border:1.5px solid #a9e5dd;background:#fff;color:#0c7d72;border-radius:20px;padding:8px 15px;font-size:.87rem;font-weight:800;cursor:pointer;font-family:inherit}
.jfilter button.on{background:linear-gradient(135deg,#0f9d8f,#2dd4bf);color:#fff;border-color:transparent}
</style>
<h1 style="font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:10px 0 6px">🏮 Mercados Tradicionales y de Cinco Días de Corea</h1>
<p style="color:#6b7280;margin-bottom:6px">${rows.length} mercados tradicionales y de cinco días (오일장) por toda Corea del Sur, con información oficial de la Organización de Turismo de Corea.</p>

<div class="esbox">
<h2>¿Qué es un "mercado de cinco días" (오일장)?</h2>
<p>Muchos mercados tradicionales de Corea no abren todos los días — funcionan en un <b>ciclo de cinco días</b>. Un mercado que abre "los días 2 y 7" opera el 2, 7, 12, 17, 22 y 27 de cada mes. Estos mercados recurrentes se llaman <b>ojang (오일장)</b>.</p>
<p>Para quienes ya conocen Myeongdong y Hongdae, un mercado de cinco días es una de las formas más fáciles de ver la vida cotidiana coreana. Los vendedores son agricultores y pescadores locales, los precios son precios locales, y lo que se vende cambia con las estaciones.</p>
<h2>Antes de ir</h2>
<ul>
<li><b>Lleva efectivo.</b> Los puestos más grandes pueden aceptar tarjeta o pago móvil, pero los pequeños suelen ser solo en efectivo.</li>
<li><b>Ve por la mañana.</b> Los mercados suelen empezar al amanecer, alcanzan su punto máximo a mediodía y van cerrando al atardecer.</li>
<li><b>La comida callejera es lo más destacado.</b> Los panqueques (jeon), el embutido coreano (sundae) y la sopa con arroz (gukbap) se preparan al momento y son más baratos que en la ciudad.</li>
<li><b>Las fechas siguen el calendario solar</b>, no el lunar — "2 y 7" se refiere al número de día del mes, cada mes.</li>
</ul>
</div>

<div class="jfilter" id="jf"><button data-r="" class="on">Todas las regiones</button>${regions.map(r => `<button data-r="${esc(r)}">${esc(r)}</button>`).join('')}</div>
<div class="jgrid" id="jg">${rows.map(card).join('\n')}</div>

<div class="esbox">
<h2>Combina un día de mercado con un festival</h2>
<p>Si el día de apertura de un mercado coincide con un festival cercano, puedes visitar ambos en un solo viaje. Usa el <a href="/es/search/">Buscador de Festivales</a> para ver qué ocurre en tus fechas de viaje.</p>
</div>
<p class="note" style="margin-top:18px;color:#9aa3af;font-size:.85rem">Fuente: Organización de Turismo de Corea (TourAPI, contenido oficial en español). Los días de mercado pueden cambiar en torno a festivos (Año Nuevo Lunar, Chuseok) — confirma localmente antes de visitar.</p>
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
  var MN=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  Array.prototype.forEach.call(g.querySelectorAll('.jcard'),function(c){
    var raw=c.getAttribute('data-days');
    var days=raw?raw.split(',').map(Number).filter(function(n){return n>0;}):[];
    var el=c.querySelector('.jnext');
    if(!days.length){ return; }
    var r=nextDay(days);
    if(!r){ return; }
    var label=r.date.getUTCDate()+' de '+MN[r.date.getUTCMonth()];
    el.textContent = r.add===0 ? '🔥 ¡Hoy!' : (r.add===1 ? '👉 Mañana ('+label+')' : '👉 Próximo: '+label+' (en '+r.add+' días)');
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
    '@context': 'https://schema.org', '@type': 'ItemList', name: 'Mercados Tradicionales y de Cinco Días de Corea',
    numberOfItems: rows.length,
    itemListElement: rows.map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: r.name }))
  })}</script>`;

  writePage('es/jangteo', layout(
    'Guía de Mercados Tradicionales y de Cinco Días de Corea | Chukjemoa',
    `${rows.length} mercados tradicionales y de cinco días por toda Corea del Sur — días de apertura, ubicación y especialidades. Datos oficiales de la Organización de Turismo de Corea.`,
    '/es/jangteo/', content, { lang: 'es', jsonld: ld, ogImage: '/img/jangteo.webp' }));

  console.log(`✓ /es/jangteo/ — ${rows.length}곳`);
  return ['/es/jangteo/'];
}

module.exports = { build };
