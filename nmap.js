// 네이버 지도 임베드 (NCP Dynamic Map) — 좌표로 핀을 찍는다.
//
// 왜 넣나 (2026-09-02 결정):
//   ⭐ 구글맵은 «한국 안에서 길찾기가 안 나온다»(지도데이터 반출 규제). 그래서 외국인은 우리 페이지에서
//      이름을 복사 → 네이버 지도 앱 이동 → 붙여넣기 → 검색, 네 단계를 거쳐야 했다.
//   ⭐ 그리고 역지오코딩 표본 검수에서 «주소는 어긋날 수 있지만 좌표는 정확하다»가 확인됐다
//      (예산군 목장이 당진시로 나왔다). 좌표로 찍는 지도가 가장 정확한 안내다.
//
// 비용·성능 설계 (둘이 같은 해법이다)
//   Dynamic Map 은 «지도가 뜰 때마다» 0.1원이 나간다. 그래서 **뷰포트에 들어올 때만 로드**한다.
//   - 안 본 사람은 호출도 안 된다 → 비용 절감
//   - 333KB짜리 maps.js 를 첫 화면에서 안 받는다 → 속도 유지
//   - 컨테이너에 height 를 미리 박아 **레이아웃 밀림(CLS)이 0**이다
//
// ⚠️ client_id 는 HTML 에 그대로 나간다. 이건 설계상 공개값이고, 콘솔에 등록한
//    서비스 URL(chukjemoa.co.kr)에서만 동작하도록 도메인 제한으로 보호된다. Secret 은 절대 안 넣는다.
const fs = require('fs'), path = require('path');

function clientId() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'ncp.json'), 'utf8')).client_id || ''; }
  catch (e) { return ''; }
}

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const LABEL = {
  ko: { open: '네이버 지도에서 열기', wait: '지도를 불러오는 중…', off: '지도를 불러오지 못했습니다' },
  en: { open: 'Open in Naver Map', wait: 'Loading map…', off: 'Map could not be loaded' },
  ja: { open: 'NAVERマップで開く', wait: '地図を読み込み中…', off: '地図を読み込めませんでした' },
};

/**
 * 지도 한 덩어리. 좌표가 없으면 «아무것도 내지 않는다»(빈 회색 상자를 보여주느니 없는 게 낫다).
 * @param {object} o {x, y, title, lang, height, query}
 *   query = 네이버 지도 앱에서 검색할 말(한글 원제). 없으면 title.
 */
function mapBlock(o) {
  const x = Number(o.x), y = Number(o.y);
  if (!x || !y || !isFinite(x) || !isFinite(y)) return '';
  const L = LABEL[o.lang] || LABEL.ko;
  const h = o.height || 300;
  const q = encodeURIComponent(o.query || o.title || '');
  return `<div class="nmap-wrap">
<div class="nmap" style="height:${h}px" data-x="${x}" data-y="${y}" data-t="${esc(o.title || '')}"><span class="nmap-ph">${L.wait}</span></div>
<a class="nmap-open" href="https://map.naver.com/p/search/${q}" target="_blank" rel="noopener">🗺️ ${L.open}</a>
</div>`;
}

// 페이지에 «한 번만» 넣는다. 지도가 하나도 없으면 스크립트도 안 넣는다.
function mapScript(lang) {
  const id = clientId();
  if (!id) return '';
  const L = LABEL[lang] || LABEL.ko;
  return `<style>
.nmap-wrap{margin:14px 0}
.nmap{width:100%;border-radius:12px;overflow:hidden;background:#eef1f4;display:flex;align-items:center;justify-content:center}
.nmap-ph{color:#98a2ad;font-size:.85rem}
.nmap-open{display:inline-block;margin-top:8px;font-size:.88rem;color:#0c7d72;text-decoration:none;font-weight:700}
.nmap-open:hover{text-decoration:underline}
</style>
<script>
(function(){
  var els=[].slice.call(document.querySelectorAll('.nmap'));
  if(!els.length) return;
  var loading=false, loaded=false, queue=[];
  function draw(el){
    if(el.dataset.done) return; el.dataset.done='1';
    try{
      var pos=new naver.maps.LatLng(+el.dataset.y, +el.dataset.x);
      var map=new naver.maps.Map(el,{center:pos,zoom:15,
        scaleControl:false,mapDataControl:false,logoControlOptions:{position:naver.maps.Position.BOTTOM_LEFT}});
      new naver.maps.Marker({position:pos,map:map,title:el.dataset.t});
    }catch(e){ el.innerHTML='<span class="nmap-ph">${L.off}</span>'; }
  }
  function load(){
    if(loaded){queue.splice(0).forEach(draw);return;}
    if(loading) return; loading=true;
    var s=document.createElement('script');
    s.src='https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${id}';
    s.onload=function(){loaded=true;queue.splice(0).forEach(draw);};
    s.onerror=function(){els.forEach(function(el){el.innerHTML='<span class="nmap-ph">${L.off}</span>';});};
    document.head.appendChild(s);
  }
  if(!('IntersectionObserver' in window)){ els.forEach(function(el){queue.push(el);}); load(); return; }
  var io=new IntersectionObserver(function(ent){
    ent.forEach(function(e){
      if(!e.isIntersecting) return;
      io.unobserve(e.target); queue.push(e.target); load();
    });
  },{rootMargin:'200px'});
  els.forEach(function(el){io.observe(el);});
})();
</script>`;
}

module.exports = { mapBlock, mapScript, clientId };
