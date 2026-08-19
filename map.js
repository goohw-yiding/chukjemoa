// 🗺️ 지도로 보기 /map/
//
// ⚠️ 2026-08-10 발견: 축제 922·걷기길 1,558·관광지 12,649곳의 **좌표를 다 가지고 있으면서 지도가 없었다.**
//    "내 주변 축제"는 검색 수요가 크고, 지도는 한 번 열면 오래 머무는 화면이다.
//
// 설계에서 중요한 것 두 가지:
//   ① 페이로드 — 좌표를 소수점 4자리(약 11m)로 자르고 배열의 배열로 넣는다. 키 이름이 반복되면 그게 곧 용량이다.
//   ② 지도는 무겁다 — Leaflet과 데이터를 **/map/ 에서만** 불러온다. 다른 303페이지는 영향이 없다.
//      카카오/네이버 지도가 아니라 Leaflet+OSM을 쓴 이유는 **키 발급도 도메인 등록도 필요 없어서**다.
//      나중에 카카오맵으로 바꾸고 싶으면 이 파일의 지도 초기화 부분만 갈면 된다.
const fs = require('fs'), path = require('path');
const { inKorea } = require('./geo.js');

function build(ctx) {
  const { ROOT, layout, writePage, SITE_NAME, buyBox, TODAY } = ctx;
  const L = f => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')); } catch (e) { return []; } };
  const r4 = v => Math.round(Number(v) * 1e4) / 1e4;
  const T = TODAY.replace(/-/g, '');

  // 레이어 정의 — [키, 이모지, 이름, 기본표시]
  // [키, 이모지, 이름, 기본표시, 그 레이어 공통 링크]
  // ⚠️ 링크를 항목마다 넣으면 4,102번 반복돼 그게 곧 용량이 된다. 레이어에 한 번만 둔다.
  const LAYERS = [
    ['fes', '🎪', '축제', 1, '/festival/'],
    ['walk', '🥾', '걷기길', 1, '/trails/'],
    ['mt', '⛰️', '명산', 0, '/mountains/'],
    ['vly', '💧', '계곡', 0, '/valley/'],
    ['mpl', '🍁', '단풍', 0, '/maple/'],
    ['ons', '♨️', '온천', 0, '/onsen/'],
    ['flw', '🌸', '봄꽃', 0, '/flower/'],
    ['pet', '🐶', '반려견 동반', 0, '/pet/']
  ];

  // 개별 축제 페이지가 있는 것은 그 페이지로 링크한다(모달만 있던 시절의 실수를 반복하지 않는다)
  const FP = {};
  try { JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'festival_pages.json'), 'utf8')).forEach(r => { FP[r.title] = r.slug; }); } catch (e) {}

  const pts = { fes: [], walk: [], mt: [], vly: [], mpl: [], ons: [], flw: [], pet: [] };

  // 축제 — 아직 안 끝난 것만. 끝난 축제를 지도에 찍으면 "가면 없다".
  L('festivals_api.json').forEach(f => {
    if (!inKorea(f.x, f.y) || String(f.end) < T) return;
    const on = String(f.start) <= T;
    // [x, y, 이름, 기간, 슬러그(있으면), 진행중(1)] — 뒤쪽 빈 값은 넣지 않는다
    const row = [r4(f.x), r4(f.y), f.title, `${String(f.start).slice(4, 6)}/${String(f.start).slice(6, 8)}~${String(f.end).slice(4, 6)}/${String(f.end).slice(6, 8)}`];
    if (FP[f.title] || on) row.push(FP[f.title] || '');
    if (on) row.push(1);
    pts.fes.push(row);
  });

  const walk = L('stret.json').map(w => [w.x, w.y, w.name, w.km, w.min])
    .concat(L('trails.json').map(w => [w.x, w.y, w.name, w.dist, w.min]));
  walk.forEach(([x, y, n, km, min]) => {
    if (!inKorea(x, y) || !n) return;
    const sub = (km ? km + 'km' : '') + (min ? ` 약 ${Math.round(min / 60 * 10) / 10}시간` : '');
    pts.walk.push(sub ? [r4(x), r4(y), n, sub] : [r4(x), r4(y), n]);
  });

  const simple = (file, key) => L(file).forEach(o => {
    if (!inKorea(o.x, o.y)) return;
    const sub = o.addr ? String(o.addr).split(' ').slice(0, 2).join(' ') : '';
    pts[key].push(sub ? [r4(o.x), r4(o.y), o.title || o.name, sub] : [r4(o.x), r4(o.y), o.title || o.name]);
  });
  simple('mountains_ko.json', 'mt');
  simple('valleys.json', 'vly');
  simple('maple.json', 'mpl');
  simple('onsen.json', 'ons');
  simple('flower.json', 'flw');
  simple('pets.json', 'pet');

  fs.writeFileSync(path.join(ROOT, 'map-data.json'), JSON.stringify(pts));
  const total = Object.values(pts).reduce((a, v) => a + v.length, 0);
  const kb = Math.round(fs.statSync(path.join(ROOT, 'map-data.json')).size / 1024);

  const cnt = k => pts[k].length.toLocaleString();
  const live = pts.fes.filter(p => p[5]).length;

  const content = `<main><div class="wrap">
<p class="crumb"><a href="/">홈</a> › 지도로 보기</p>
<h1 style="font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:6px 0 6px">지도로 보기</h1>
<p class="lead">지금 열리는 축제와 걷기길, 자연 명소를 지도 위에 올렸습니다.
「내 위치에서 가까운 순」을 누르면 <b>지금 있는 곳 기준으로 가까운 순서</b>로 다시 정렬합니다.
위치는 브라우저에서만 쓰고 저희 서버로 보내지 않습니다.</p>

<div class="mapbar">
<button class="mapbtn on" id="m-here" type="button">📍 내 위치에서 가까운 순</button>
<span class="mapchips" id="m-layers">${LAYERS.map(([k, e, n, on]) =>
    `<label class="mapchip${on ? ' on' : ''}"><input type="checkbox" data-k="${k}"${on ? ' checked' : ''}> ${e} ${n} <b>${cnt(k)}</b></label>`).join('')}</span>
</div>
<div id="map" class="mapbox"></div>
<p class="note" id="m-msg" style="min-height:1.4em"></p>

<h2 class="sec">가까운 순으로</h2>
<p class="note" style="margin-top:-4px">위치를 허용하면 여기가 가까운 순서로 바뀝니다. 허용하지 않으면 지도 화면 가운데 기준입니다.</p>
<div id="m-list" class="mlist"></div>

<h2 class="sec">이 지도에 무엇이 올라가 있나</h2>
<p>지금 지도 위에 <b>${total.toLocaleString()}개</b> 지점이 있습니다.
아직 끝나지 않은 <b>축제 ${cnt('fes')}곳</b>(그중 지금 열리는 중 <b>${live}곳</b>),
<b>걷기길 ${cnt('walk')}개 코스</b>, <b>명산 ${cnt('mt')}곳</b>, <b>계곡 ${cnt('vly')}곳</b>,
<b>단풍 명소 ${cnt('mpl')}곳</b>, <b>온천 ${cnt('ons')}곳</b>, <b>봄꽃 명소 ${cnt('flw')}곳</b>,
<b>반려견 동반 가능한 곳 ${cnt('pet')}곳</b>입니다.
축제와 걷기길만 먼저 켜 두었습니다. 한 번에 다 켜면 화면이 점으로 덮여서 오히려 안 보입니다.</p>
<p>축제 표시를 누르면 <b>상세 페이지가 있는 축제는 그 페이지로</b> 넘어갑니다. 일정·근처 맛집 영업시간·걷기길·하루 코스까지 정리해 둔 페이지입니다.</p>

<h2 class="sec">이 지도가 못 하는 것</h2>
<p>좌표는 공공데이터에 등록된 값을 그대로 씁니다. <b>주최 측이 좌표를 잘못 넣은 축제는 엉뚱한 데 찍힙니다.</b>
축제장 정문이 아니라 행정 소재지 좌표인 경우도 있어, 실제 입구는 현장 안내를 따르셔야 합니다.
길 안내(내비게이션)와 대중교통 경로는 제공하지 않습니다. 표시를 눌러 나오는 링크로 지도 앱에서 확인하세요.
걷기길은 코스 전체가 아니라 <b>시작 지점 한 점</b>으로 찍혀 있습니다.</p>

<h2 class="sec">이렇게 쓰면 편합니다</h2>
<p>지도는 「무엇을 찾을지 정해 놓고 검색하는 화면」이 아니라 <b>「이 근처에 뭐가 있는지 몰라서 보는 화면」</b>입니다. 목적지가 이미 정해져 있다면 <a href="/search/">축제 검색</a>이 빠르고, 아직 안 정했다면 여기가 낫습니다.</p>
<ul>
<li><b>주말에 갈 데를 정할 때</b> — 축제 층만 켜고 집 주변을 훑어보세요. 반경 한두 시간 안에 뭐가 열리는지 한눈에 들어옵니다.</li>
<li><b>이미 어디 가기로 했을 때</b> — 그 지역으로 지도를 옮긴 뒤 걷기길·계곡·온천 층을 켜면 <b>축제 앞뒤로 붙일 것</b>이 보입니다. 축제 하나만 보고 오면 반나절이 뜨는데, 이 방법으로 하루가 채워집니다.</li>
<li><b>차 없이 갈 때</b> — 표시를 눌러 나오는 지도 앱 링크로 대중교통 경로를 확인하고, 비용은 <a href="/trip-cost/">여행 비용 계산기</a>에서 자동차와 비교해 보세요.</li>
<li><b>반려견과 갈 때</b> — 반려견 층을 켜면 동반 가능한 곳만 남습니다. 동반 조건(견종·구역·입마개)은 <a href="/pet/">반려견 동반 여행지</a>에 정리돼 있습니다.</li>
</ul>

<h2 class="sec">자주 묻는 것</h2>
<p><b>내 위치를 꼭 허용해야 하나요?</b><br>아닙니다. 허용하지 않으면 <b>지도 화면 한가운데</b>를 기준으로 가까운 순서를 계산합니다. 보고 싶은 지역으로 지도를 옮기기만 해도 그 동네 기준 목록이 됩니다. 위치를 허용해도 그 좌표는 브라우저 안에서 거리 계산에만 쓰고 저희 서버로 보내지 않습니다.</p>
<p><b>층을 다 켜면 왜 느려지나요?</b><br>지점이 ${total.toLocaleString()}개라 전부 그리면 지도가 무거워지고, 무엇보다 <b>점이 겹쳐서 안 보입니다.</b> 그래서 축제와 걷기길만 기본으로 켜 두었습니다. 필요한 층만 두세 개 켜서 보시는 걸 권합니다.</p>
<p><b>표시된 곳이 지금도 하는 게 맞나요?</b><br>축제는 <b>아직 끝나지 않은 것만</b> 올립니다(현재 ${cnt('fes')}곳, 그중 지금 열리는 중 ${live}곳). 다만 일정은 주최 측 사정으로 바뀔 수 있어, 멀리 가시기 전에는 상세 페이지의 공식 홈페이지 링크로 한 번 확인해 보시는 게 안전합니다.</p>
<p><b>오일장·카페·무장애 여행지는 왜 지도에 없나요?</b><br>아직 안 올렸습니다. 있는 척하지 않고 그대로 말씀드리면 — <a href="/jangteo/">오일장</a>은 <b>장날이 지역마다 다른</b> 정보라 지도에 점만 찍으면 「오늘 여는 장」인지 알 수가 없어서, 날짜와 같이 보여주는 목록 쪽이 아직 더 쓸모가 있습니다. <a href="/cafe/">감성 카페</a>와 <a href="/accessible/">무장애 여행지</a>는 수가 많아(각 2천·9천 단위) 그대로 얹으면 지도가 점으로 덮입니다. 시·군 단위로 묶어 보여주는 방법을 찾는 중이고, 그때까지는 각 목록 페이지에서 지역으로 좁혀 찾으시는 편이 빠릅니다.</p>

${buyBox ? buyBox('trails') : ''}
</div></main>`;

  const CSS = `<style>
.mapbar{margin:14px 0 10px}
.mapbtn{border:1.5px solid #0f9d8f;background:#0f9d8f;color:#fff;border-radius:22px;padding:10px 18px;font-weight:800;font-size:.93rem;cursor:pointer;font-family:inherit}
.mapbtn:disabled{opacity:.55;cursor:default}
.mapchips{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}
.mapchip{display:inline-flex;align-items:center;gap:5px;border:1px solid #e2efec;background:#fff;border-radius:16px;padding:6px 12px;font-size:.85rem;font-weight:600;color:#5b6470;cursor:pointer;user-select:none}
.mapchip.on{border-color:#0f9d8f;background:#effaf8;color:#0a6c63}
.mapchip input{margin:0;accent-color:#0f9d8f}
.mapchip b{font-weight:800;color:#9aa8b2}
.mapchip.on b{color:#0f9d8f}
.mapbox{height:min(66vh,560px);border-radius:16px;overflow:hidden;box-shadow:0 3px 16px rgba(31,41,55,.1);background:#e8f1ef}
.mlist{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
.mrow{display:block;background:#fff;border:1px solid #eaf3f1;border-radius:13px;padding:12px 14px;font-size:.9rem;color:#374151}
.mrow:hover{border-color:#bfe6df}
.mrow b{display:block;font-weight:800;color:#1f2937;margin-bottom:3px}
.mrow .d{color:#0f9d8f;font-weight:800}
.mrow .s{color:#8b95a1;font-size:.85rem}
.leaflet-popup-content{margin:11px 14px;font-size:.9rem;line-height:1.55}
.leaflet-popup-content b{display:block;font-size:.98rem;margin-bottom:3px}
.leaflet-popup-content a{color:#0f9d8f;font-weight:800}
.mpin{display:flex;align-items:center;justify-content:center;font-size:15px;background:#fff;border:2px solid #0f9d8f;border-radius:50%;width:30px;height:30px;box-shadow:0 2px 6px rgba(0,0,0,.22)}
.mpin.live{border-color:#ff5a3c;box-shadow:0 0 0 4px rgba(255,90,60,.22)}
</style>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.min.css">`;

  const JS = `<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.min.js"><\/script>
<script>
(function(){
  var EL=document.getElementById('map'); if(!EL||!window.L) return;
  var META=${JSON.stringify(LAYERS.map(([k, e, n, on, u]) => [k, e, n, u]))};
  var EMO={},NAME={},URL={};
  META.forEach(function(m){EMO[m[0]]=m[1];NAME[m[0]]=m[2];URL[m[0]]=m[3];});
  var map=L.map(EL,{scrollWheelZoom:false}).setView([36.5,127.9],7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:18, attribution:'&copy; OpenStreetMap'
  }).addTo(map);
  map.on('click',function(){ map.scrollWheelZoom.enable(); });   // 스크롤 중 실수로 확대되는 걸 막는다

  var msg=document.getElementById('m-msg'), listEl=document.getElementById('m-list');
  var DATA=null, groups={}, all=[], center=null;

  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function hav(x1,y1,x2,y2){
    var R=6371,t=Math.PI/180,dy=(y2-y1)*t,dx=(x2-x1)*t;
    var a=Math.sin(dy/2)*Math.sin(dy/2)+Math.cos(y1*t)*Math.cos(y2*t)*Math.sin(dx/2)*Math.sin(dx/2);
    return 2*R*Math.asin(Math.sqrt(a));
  }
  // 축제: [x,y,이름,기간,슬러그?,진행중?] · 그 외: [x,y,이름,부가?]
  function sub(k,p){ return k==='fes' ? (p[3]||'') : (p[3]||''); }
  function href(k,p){ return k==='fes' ? (p[4]?'/festival/'+p[4]+'/':'') : URL[k]; }
  function popup(k,p){
    var t='<b>'+esc(p[2])+'</b>'+(sub(k,p)?esc(sub(k,p))+'<br>':'');
    var u=href(k,p);
    if(k==='fes'&&u) t+='<a href="'+u+'">상세 페이지 보기 →</a>';
    else if(u) t+='<a href="'+u+'">'+esc(NAME[k])+' 목록 →</a>';
    t+='<br><a href="https://map.kakao.com/link/search/'+encodeURIComponent(p[2])+'" target="_blank" rel="noopener nofollow">지도 앱에서 열기 →</a>';
    return t;
  }
  // ⚠️ 마커 4,102개를 한 번에 만들면 모바일에서 몇 초 멈춘다.
  //    켜져 있는 레이어만 그때 만든다. 끈 레이어는 아예 DOM에 안 올라간다.
  function makeGroup(k){
    if(groups[k]) return groups[k];
    var g=L.markerClusterGroup({maxClusterRadius:52,disableClusteringAtZoom:12,chunkedLoading:true});
    (DATA[k]||[]).forEach(function(p){
      var live=k==='fes'&&p[5];
      var mk=L.marker([p[1],p[0]],{icon:L.divIcon({className:'',iconSize:[30,30],
        html:'<div class="mpin'+(live?' live':'')+'">'+EMO[k]+'</div>'})});
      mk.bindPopup(function(){ return popup(k,p); });
      g.addLayer(mk);
    });
    return (groups[k]=g);
  }
  function build(){
    // 목록 정렬용 색인은 가볍다(마커가 아니라 값만)
    META.forEach(function(m){
      var k=m[0];
      (DATA[k]||[]).forEach(function(p){
        all.push({k:k,x:p[0],y:p[1],n:p[2],s:sub(k,p),u:href(k,p)});
      });
    });
    document.querySelectorAll('#m-layers input').forEach(function(c){
      if(c.checked) map.addLayer(makeGroup(c.dataset.k));
      c.addEventListener('change',function(){
        c.closest('.mapchip').classList.toggle('on',c.checked);
        if(c.checked) map.addLayer(makeGroup(c.dataset.k));
        else if(groups[c.dataset.k]) map.removeLayer(groups[c.dataset.k]);
        render();
      });
    });
    render();
  }
  function onKeys(){
    var ks=[];
    document.querySelectorAll('#m-layers input').forEach(function(c){ if(c.checked) ks.push(c.dataset.k); });
    return ks;
  }
  function render(){
    if(!all.length) return;
    var c=center||{x:map.getCenter().lng,y:map.getCenter().lat};
    var ks=onKeys();
    var rows=all.filter(function(o){return ks.indexOf(o.k)>=0;})
      .map(function(o){ o.d=hav(c.x,c.y,o.x,o.y); return o; })
      .sort(function(a,b){return a.d-b.d;}).slice(0,12);
    listEl.innerHTML=rows.map(function(o){
      var inner='<b>'+EMO[o.k]+' '+esc(o.n)+'</b><span class="d">'+o.d.toFixed(1)+'km</span>'
        +(o.s?' <span class="s">'+esc(o.s)+'</span>':'');
      return o.u ? '<a class="mrow" href="'+o.u+'">'+inner+'</a>' : '<div class="mrow">'+inner+'</div>';
    }).join('') || '<div class="mrow">켜 둔 항목이 없습니다. 위에서 하나 이상 켜 주세요.</div>';
  }
  map.on('moveend',function(){ if(!center) render(); });

  document.getElementById('m-here').addEventListener('click',function(){
    var b=this;
    if(!navigator.geolocation){ msg.textContent='이 브라우저는 위치 기능을 지원하지 않습니다.'; return; }
    b.disabled=true; msg.textContent='위치를 확인하는 중…';
    navigator.geolocation.getCurrentPosition(function(pos){
      center={x:pos.coords.longitude,y:pos.coords.latitude};
      map.setView([center.y,center.x],11);
      L.circleMarker([center.y,center.x],{radius:8,color:'#ff5a3c',fillColor:'#ff5a3c',fillOpacity:.9}).addTo(map).bindPopup('현재 위치');
      msg.textContent='현재 위치 기준으로 가까운 순서로 정렬했습니다.';
      b.disabled=false; render();
    },function(){
      msg.textContent='위치를 가져오지 못했습니다. 브라우저 주소창의 위치 권한을 확인해 주세요. 지금은 지도 화면 가운데 기준으로 보여드립니다.';
      b.disabled=false;
    },{timeout:8000,maximumAge:600000});
  });

  msg.textContent='지도 자료를 불러오는 중…';
  fetch('/map-data.json').then(function(r){return r.json();}).then(function(j){
    DATA=j; msg.textContent=''; build();
  }).catch(function(){ msg.textContent='지도 자료를 불러오지 못했습니다. 새로고침해 주세요.'; });
})();
<\/script>`;

  const ld = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'WebPage',
    name: '축제·걷기길 지도',
    description: `전국 축제 ${pts.fes.length}곳과 걷기길 ${pts.walk.length}개 코스를 지도에서 봅니다.`
  })}</script>`;

  writePage('map', layout(
    `내 주변 축제·걷기길 지도 — 지금 열리는 축제 ${live}곳 | ${SITE_NAME}`,
    `아직 끝나지 않은 축제 ${pts.fes.length}곳과 걷기길 ${pts.walk.length}개 코스, 명산·계곡·단풍·온천·반려견 동반 가능한 곳까지 지도 한 장에. 내 위치에서 가까운 순으로 볼 수 있습니다.`,
    '/map/', CSS + content + JS, { jsonld: ld }));

  console.log('✓ /map/ —', total.toLocaleString(), '지점 · map-data.json', kb + 'KB');
  return ['/map/'];
}

module.exports = { build };
