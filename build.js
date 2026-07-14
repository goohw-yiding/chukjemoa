// 축제모아 정적 사이트 빌드 스크립트
// 사용법: node build.js  (data/*.json 수정 후 재실행하면 페이지 재생성)
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE = 'https://chukjemoa.co.kr';
const SITE_NAME = '축제모아';
const ADSENSE = 'ca-pub-3293445488923111';
const TODAY = new Date().toISOString().slice(0, 10);

const festivals = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/festivals.json'), 'utf8'));
const markets = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/markets.json'), 'utf8'));
const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/posts.json'), 'utf8'));
let apiFests = [];
try { apiFests = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/festivals_api.json'), 'utf8')); }
catch (e) { console.log('⚠ festivals_api.json 없음 — 검색 데이터 비어있음 (node fetch-festivals.js 먼저 실행)'); }
let apiPets = [];
try { apiPets = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/pets.json'), 'utf8')); }
catch (e) { console.log('⚠ pets.json 없음 — 반려견 여행지 데이터 비어있음 (node fetch-pets.js 먼저 실행)'); }
let apiFestsEn = [];
try { apiFestsEn = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/festivals_en.json'), 'utf8')); }
catch (e) { console.log('⚠ festivals_en.json 없음 — 영문 데이터 비어있음 (node fetch-festivals-en.js 먼저 실행)'); }
let apiAccessible = [];
try { apiAccessible = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/accessible.json'), 'utf8')); }
catch (e) { console.log('⚠ accessible.json 없음 — 무장애 데이터 비어있음 (node fetch-accessible.js 먼저 실행)'); }
let apiTrails = [];
try { apiTrails = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/trails.json'), 'utf8')); }
catch (e) { console.log('⚠ trails.json 없음 — 걷기길 데이터 비어있음 (node fetch-trails.js 먼저 실행)'); }
let apiFestsJa = [];
try { apiFestsJa = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/festivals_ja.json'), 'utf8')); }
catch (e) { console.log('⚠ festivals_ja.json 없음 — 일문 데이터 비어있음 (node fetch-festivals-ja.js 먼저 실행)'); }
let apiFestsEs = [];
try { apiFestsEs = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/festivals_es.json'), 'utf8')); }
catch (e) { console.log('⚠ festivals_es.json 없음 — 스페인어 데이터 비어있음 (node fetch-festivals-es.js 먼저 실행)'); }
let apiFestsZh = [];
try { apiFestsZh = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/festivals_zh.json'), 'utf8')); }
catch (e) { console.log('⚠ festivals_zh.json 없음 — 중문 데이터 비어있음 (node fetch-festivals-zh.js 먼저 실행)'); }
let holidays = [];
try { holidays = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/holidays.json'), 'utf8')); }
catch (e) { console.log('⚠ holidays.json 없음 — 공휴일 데이터 비어있음 (node fetch-holidays.js 먼저 실행)'); }
let nearby = {};
try { nearby = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/nearby.json'), 'utf8')); }
catch (e) { console.log('⚠ nearby.json 없음 — 근처 가볼곳 데이터 비어있음 (node fetch-nearby.js 먼저 실행)'); }
let visitors = { ranked: [] };
try { visitors = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/visitors.json'), 'utf8')); }
catch (e) { console.log('⚠ visitors.json 없음 — 방문자수 데이터 비어있음 (node fetch-visitors.js 먼저 실행)'); }

// 다국어 hreflang 세트(데이터 있는 언어만 포함)
const LANGS = ['en','ja','es','zh'];
const LANG_DATA = { en: apiFestsEn, ja: apiFestsJa, es: apiFestsEs, zh: apiFestsZh };
function homeAlts() { const a = [{ hreflang: 'ko', href: '/' }]; LANGS.forEach(l => { if (LANG_DATA[l].length) a.push({ hreflang: l === 'zh' ? 'zh-Hans' : l, href: '/' + l + '/' }); }); a.push({ hreflang: 'x-default', href: '/' }); return a; }
function searchAlts() { const a = [{ hreflang: 'ko', href: '/search/' }]; LANGS.forEach(l => { if (LANG_DATA[l].length) a.push({ hreflang: l === 'zh' ? 'zh-Hans' : l, href: '/' + l + '/search/' }); }); a.push({ hreflang: 'x-default', href: '/search/' }); return a; }

const MONTHS = [
  { key: '2026-07', months: [7], label: '2026년 7월', short: '7월', emoji: '💦' },
  { key: '2026-08', months: [8], label: '2026년 8월', short: '8월', emoji: '🌊' },
  { key: '2026-09', months: [9], label: '2026년 9월', short: '9월', emoji: '🎆' },
  { key: '2026-10', months: [10], label: '2026년 10월', short: '10월', emoji: '🍁' },
  { key: '2026-11', months: [11], label: '2026년 11월', short: '11월', emoji: '🌾' },
  { key: '2026-12', months: [12, 1], label: '2026년 12월~2027년 1월 겨울', short: '12월·겨울', emoji: '⛄' },
];

const CAT_EMOJI = { '물놀이': '💦', '음악': '🎵', '음식': '🍜', '꽃': '🌸', '문화': '🎭', '불꽃': '🎆', '전통': '🏮', '빛': '✨', '눈': '⛄', '기타': '🎪' };
const CAT_IMG = { '물놀이': 'water', '음악': 'music', '음식': 'food', '꽃': 'flower', '문화': 'culture', '불꽃': 'firework', '전통': 'tradition', '빛': 'light', '눈': 'snow', '기타': 'etc' };

// ---------- 실사진 매칭 (큐레이션 축제 ↔ 공공데이터 이미지) ----------
function normTitle(s) {
  return String(s || '')
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/축제|페스티벌|festival/gi, '')
    .replace(/[\s·・…,'"’”“\-~!?]/g, '')
    .toLowerCase();
}
const API_IMG_INDEX = {};
apiFests.forEach(a => {
  if (a.img && String(a.img).trim()) {
    const n = normTitle(a.title);
    if (n.length > 1 && !API_IMG_INDEX[n]) API_IMG_INDEX[n] = a.img;
  }
});
// 큐레이션 축제 → 공공데이터 축제 객체 매칭(개요·공식홈피·근처 enrich용)
const API_BY_NORM = {};
apiFests.forEach(a => { const n = normTitle(a.title); if (n.length > 1 && !API_BY_NORM[n]) API_BY_NORM[n] = a; });
function apiMatch(f) {
  const n = normTitle(f.name); if (!n) return null;
  if (API_BY_NORM[n]) return API_BY_NORM[n];
  for (const k in API_BY_NORM) { if (k.length >= 5 && n.length >= 5 && (k.includes(n) || n.includes(k))) return API_BY_NORM[k]; }
  return null;
}
// HTML 속성값 안전 이스케이프(따옴표 포함)
function escA(s) { return esc(s).replace(/"/g, '&quot;'); }
// 큐레이션 축제(festivals.json)의 실사진 URL을 반환. 확신 매칭만 실사진, 없으면 null.
function realImgOf(f) {
  const n = normTitle(f.name);
  if (!n) return null;
  if (API_IMG_INDEX[n]) return API_IMG_INDEX[n];
  // 안전한 포함 매칭: 짧은 쪽 길이 5자 이상일 때만
  for (const k in API_IMG_INDEX) {
    if (k.length >= 5 && n.length >= 5 && (k.includes(n) || n.includes(k))) return API_IMG_INDEX[k];
  }
  return null;
}
// 카드 썸네일 URL(실사진 우선, 카테고리 폴백)
function thumbOf(f) {
  return realImgOf(f) || ('/img/cat-' + (CAT_IMG[f.category] || 'etc') + '.webp');
}
// JSON-LD·OG용 절대 이미지 URL
function absImgOf(f) {
  const r = realImgOf(f);
  if (r) return r.replace(/^http:/, 'https:');
  return SITE + '/img/cat-' + (CAT_IMG[f.category] || 'etc') + '.webp';
}
// schema.org Event JSON-LD 배열 문자열 생성
function eventsJsonLd(list) {
  const items = list.map(f => {
    const o = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: f.name,
      startDate: f.start,
      endDate: f.end,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: f.place || (f.region + ' ' + f.city),
        address: {
          '@type': 'PostalAddress',
          addressRegion: f.region,
          addressLocality: f.city,
          streetAddress: f.place,
          addressCountry: 'KR'
        }
      },
      image: [absImgOf(f)],
      description: f.desc,
      url: SITE + '/search/'
    };
    return o;
  });
  return items.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
}

// 지역별 대표 좌표 (내 주변 축제·날씨 배지용, "region|city" 키)
const COORDS = {
  '강원|강릉시': [37.75, 128.90], '강원|동해시': [37.52, 129.11], '강원|양양군': [38.07, 128.63],
  '강원|영월군': [37.18, 128.46], '강원|원주시': [37.34, 127.95], '강원|인제군': [38.07, 128.17],
  '강원|정선군': [37.38, 128.66], '강원|춘천시': [37.88, 127.73], '강원|태백시': [37.16, 128.99],
  '강원|평창군': [37.37, 128.39], '강원|홍천군': [37.70, 127.89], '강원|화천군': [38.11, 127.71],
  '경기|가평군': [37.83, 127.51], '경기|수원시': [37.26, 127.03], '경기|시흥시': [37.38, 126.80],
  '경기|안성시': [37.01, 127.27], '경기|이천시': [37.27, 127.44], '경기|파주시': [37.76, 126.78],
  '경기|평택시': [36.99, 127.11],
  '경남|거제시': [34.88, 128.62], '경남|거창군': [35.69, 127.91], '경남|진주시': [35.18, 128.11],
  '경남|통영시': [34.85, 128.43], '경남|합천군': [35.57, 128.17],
  '경북|경산시': [35.83, 128.74], '경북|봉화군': [36.89, 128.73], '경북|안동시': [36.57, 128.73],
  '경북|포항시': [36.02, 129.36],
  '광주|동구': [35.15, 126.92],
  '대구|달서구': [35.83, 128.53], '대구|동구': [35.89, 128.64],
  '대전|중구': [36.33, 127.42],
  '부산|사상구': [35.15, 128.99], '부산|사하구': [35.10, 128.97], '부산|서구': [35.10, 129.02],
  '부산|수영구': [35.15, 129.11], '부산|중구': [35.10, 129.03],
  '서울|관악구': [37.48, 126.95], '서울|마포구': [37.56, 126.91], '서울|서초구': [37.48, 127.03],
  '서울|송파구': [37.51, 127.11], '서울|영등포구': [37.53, 126.90], '서울|종로구': [37.57, 126.98],
  '서울|중구': [37.56, 126.99],
  '세종|조치원읍': [36.60, 127.30],
  '울산|중구': [35.57, 129.33],
  '인천|남동구': [37.45, 126.73], '인천|연수구': [37.41, 126.68],
  '전남|담양군': [35.32, 126.99], '전남|무안군': [34.99, 126.48], '전남|보성군': [34.77, 127.08],
  '전남|순천시': [34.95, 127.49], '전남|장흥군': [34.68, 126.91], '전남|함평군': [35.07, 126.52],
  '전남|해남군·진도군': [34.57, 126.60],
  '전북|김제시': [35.80, 126.88], '전북|무주군': [36.01, 127.66], '전북|부안군': [35.73, 126.73],
  '전북|임실군': [35.62, 127.29], '전북|전주시': [35.82, 127.15], '전북|정읍시': [35.57, 126.86],
  '전북|진안군': [35.79, 127.42],
  '제주|서귀포시': [33.25, 126.56], '제주|제주시': [33.50, 126.53],
  '충남|공주시·부여군': [36.37, 127.02], '충남|금산군': [36.11, 127.49], '충남|논산시': [36.19, 127.10],
  '충남|보령시': [36.33, 126.61], '충남|부여군': [36.28, 126.91], '충남|서산시': [36.78, 126.45],
  '충남|청양군': [36.46, 126.80],
  '충북|괴산군': [36.82, 127.79], '충북|영동군': [36.17, 127.78],
};
const REGION_CENTER = {
  '서울': [37.55, 126.99], '경기': [37.29, 127.05], '인천': [37.45, 126.70], '강원': [37.78, 128.40],
  '충남': [36.55, 126.80], '충북': [36.63, 127.49], '대전': [36.35, 127.38], '세종': [36.48, 127.29],
  '전남': [34.95, 126.90], '전북': [35.72, 127.15], '광주': [35.16, 126.85], '경남': [35.24, 128.25],
  '경북': [36.35, 128.70], '대구': [35.87, 128.60], '울산': [35.54, 129.31], '부산': [35.14, 129.05],
  '제주': [33.38, 126.55],
};
function coordOf(f) {
  return COORDS[f.region + '|' + f.city] || REGION_CENTER[f.region] || [36.5, 127.8];
}

function fmtDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return `${y}.${m}.${d}`;
}
function fmtRange(f) {
  return f.start === f.end ? fmtDate(f.start) : `${fmtDate(f.start)} ~ ${fmtDate(f.end)}`;
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function festCard(f) {
  const emoji = CAT_EMOJI[f.category] || '🎪';
  const img = CAT_IMG[f.category] || 'etc';
  const [la, lo] = coordOf(f);
  const badge = f.confirmed
    ? '<span class="badge ok">일정 확정</span>'
    : '<span class="badge est">예년 기준·변동 가능</span>';
  const mm = apiMatch(f);
  const dOv = mm && mm.ov ? ` data-ov="${escA(mm.ov)}"` : '';
  const dHp = mm && mm.hp ? ` data-hp="${escA(mm.hp)}"` : '';
  const dNear = mm && Array.isArray(nearby[mm.id]) && nearby[mm.id].length ? ` data-near="${encodeURIComponent(JSON.stringify(nearby[mm.id]))}"` : '';
  return `<div class="card" data-region="${esc(f.region)}" data-start="${f.start}" data-end="${f.end}" data-lat="${la}" data-lng="${lo}" data-name="${escA(f.name)}" data-city="${escA(f.city)}" data-place="${escA(f.place)}" data-desc="${escA(f.desc)}" data-cat="${escA(f.category)}" data-img="${escA(thumbOf(f))}"${dOv}${dHp}${dNear}>
  <div class="thumb"><img src="${esc(thumbOf(f))}" alt="${esc(f.name)}" loading="lazy" onerror="this.src=&#39;/img/cat-${img}.webp&#39;"><span class="dday"></span><button class="fav" data-name="${esc(f.name)}" aria-label="찜하기">♡</button><span class="km"></span><span class="cat">${emoji} ${esc(f.category)}</span></div>
  <div class="card-body">
  <div class="card-top">${badge}</div>
  <h3>${esc(f.name)}</h3>
  <p class="date">📅 ${fmtRange(f)}</p>
  <p class="loc">📍 ${esc(f.region)} ${esc(f.city)} · ${esc(f.place)}</p>
  <p class="desc">${esc(f.desc)}</p>
  </div>
</div>`;
}

// 카드 D-day 배지 스크립트 (클라이언트에서 오늘 기준 계산)
const DDAY_JS = `<script>
(function(){
  const t = new Date(); t.setHours(0,0,0,0);
  document.querySelectorAll('.card[data-start]').forEach(c => {
    c.style.cursor = 'pointer';
    c.addEventListener('click', function(ev){
      if (ev.target.closest('.fav') || ev.target.closest('a')) return;
      if (window.openFestModal) { window.openFestModal(c.dataset); return; }
      const n = c.dataset.name; if (!n) return;
      window.open('https://search.naver.com/search.naver?query=' + encodeURIComponent(n + ' 축제'), '_blank', 'noopener');
    });
    const s = new Date(c.dataset.start), e = new Date(c.dataset.end), el = c.querySelector('.dday');
    if (!el) return;
    const d = Math.ceil((s - t) / 86400000);
    if (t >= s && t <= e) { el.textContent = '진행중 🔥'; el.classList.add('on'); }
    else if (d > 0 && d <= 99) { el.textContent = 'D-' + d; }
    else if (t > e) { el.textContent = '종료'; el.classList.add('off'); c.classList.add('ended'); }
  });
})();
</script>`;

// 공용 축제 상세 모달 (메인·월별·연휴 카드 클릭 시 사이트 내에서 표시 — 네이버 이탈 방지)
const FEST_MODAL_HTML = `<div id="festmodal" class="fmodal"><div class="fmbox">
<button class="fmx" id="fm2x" aria-label="닫기">✕</button>
<img id="fm2-img" class="fm-img" alt="">
<h3 id="fm2-title"></h3>
<p id="fm2-meta"></p>
<p id="fm2-ov"></p>
<div id="fm2-near"></div>
<div class="fm-links"><a id="fm2-hp" target="_blank" rel="noopener">🏛️ 공식 홈페이지</a><a id="fm2-naver" target="_blank" rel="noopener">🔎 네이버에서 보기</a></div>
</div></div>`;
const FEST_MODAL_JS = `<script>
(function(){
  var m=document.getElementById('festmodal'); if(!m) return;
  function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function fy(y){y=String(y||'').replace(/[^0-9]/g,'');if(y.length<8)return '';return y.slice(0,4)+'.'+(+y.slice(4,6))+'.'+(+y.slice(6,8));}
  window.openFestModal=function(ds){
    var img=document.getElementById('fm2-img');
    if(ds.img){img.src=ds.img;img.style.display='block';}else{img.style.display='none';}
    document.getElementById('fm2-title').textContent=ds.name||'';
    var loc=[ds.region,ds.city,ds.place].filter(Boolean).join(' ');
    var dr=fy(ds.start)+(ds.end&&String(ds.end).replace(/[^0-9]/g,'')!==String(ds.start).replace(/[^0-9]/g,'')?' ~ '+fy(ds.end):'');
    document.getElementById('fm2-meta').textContent=[dr,loc].filter(Boolean).join('  ·  ');
    document.getElementById('fm2-ov').textContent=ds.ov||ds.desc||'상세 개요는 아래 네이버·공식 홈페이지에서 확인하세요.';
    var nearEl=document.getElementById('fm2-near');nearEl.innerHTML='';
    if(ds.near){try{var arr=JSON.parse(decodeURIComponent(ds.near));if(arr&&arr.length){nearEl.innerHTML='<div style="font-weight:800;color:#0a6c63;margin:16px 0 8px">📍 근처 가볼 곳</div><div style="display:flex;flex-wrap:wrap;gap:8px">'+arr.map(function(n){return '<a href="https://search.naver.com/search.naver?query='+encodeURIComponent(n.t)+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;background:#f4faf8;border:1px solid #dcefeb;border-radius:20px;padding:6px 12px;font-size:.85rem;font-weight:700;color:#374151;text-decoration:none">'+(n.img?'<img src="'+esc(n.img)+'" style="width:22px;height:22px;border-radius:50%;object-fit:cover" onerror="this.style.display=&#39;none&#39;">':'')+esc(n.t)+' <span style="color:#9aa3af;font-weight:600">'+esc(n.ty)+(n.d?' '+n.d+'km':'')+'</span></a>';}).join('')+'</div>';}}catch(e){}}
    var hp=document.getElementById('fm2-hp');
    if(ds.hp){hp.href=(ds.hp.indexOf('http')===0?ds.hp:'http://'+ds.hp);hp.style.display='inline-block';}else{hp.style.display='none';}
    document.getElementById('fm2-naver').href='https://search.naver.com/search.naver?query='+encodeURIComponent((ds.name||'')+' 축제');
    m.classList.add('show');
  };
  function close(){m.classList.remove('show');}
  document.getElementById('fm2x').addEventListener('click',close);
  m.addEventListener('click',function(e){if(e.target.id==='festmodal')close();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
})();
</script>`;

// 공용 장소 모달 (반려견·무장애·걷기 카드 클릭 시 사이트 내 표시 — 네이버 이탈 방지)
const PLACE_MODAL_HTML = `<div id="placemodal" class="fmodal"><div class="fmbox">
<button class="fmx" id="pm2x" aria-label="닫기">✕</button>
<img id="pm2-img" class="fm-img" alt="">
<h3 id="pm2-title"></h3>
<p id="pm2-meta"></p>
<div id="pm2-body"></div>
<div class="fm-links"><a id="pm2-map" target="_blank" rel="noopener">🗺️ 지도</a><a id="pm2-naver" target="_blank" rel="noopener">🔎 네이버에서 보기</a></div>
</div></div>`;
const PLACE_MODAL_JS = `<script>
(function(){
  var m=document.getElementById('placemodal'); if(!m) return;
  window.openPlaceModal=function(o){
    var img=document.getElementById('pm2-img'); if(o.img){img.src=o.img;img.style.display='block';}else{img.style.display='none';}
    document.getElementById('pm2-title').textContent=o.title||'';
    document.getElementById('pm2-meta').textContent=o.meta||'';
    document.getElementById('pm2-body').innerHTML=o.body||'';
    document.getElementById('pm2-naver').href=o.naver||('https://search.naver.com/search.naver?query='+encodeURIComponent(o.title||''));
    var mp=document.getElementById('pm2-map'); if(o.map){mp.href=o.map;mp.style.display='inline-block';}else{mp.style.display='none';}
    m.classList.add('show');
  };
  function close(){m.classList.remove('show');}
  document.getElementById('pm2x').addEventListener('click',close);
  m.addEventListener('click',function(e){if(e.target.id==='placemodal')close();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
})();
</script>`;

// 킥④ 찜하기 (모든 카드 페이지 공통, localStorage)
const FAV_JS = `<script>
(function(){
  const KEY = 'cjm_favs';
  const get = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch(e) { return []; } };
  document.querySelectorAll('.fav').forEach(b => {
    const n = b.dataset.name;
    if (get().indexOf(n) !== -1) { b.textContent = '♥'; b.classList.add('on'); }
    b.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const f = new Set(get());
      if (f.has(n)) { f.delete(n); b.textContent = '♡'; b.classList.remove('on'); }
      else {
        f.add(n); b.textContent = '♥'; b.classList.add('on');
        b.animate([{transform:'scale(1)'},{transform:'scale(1.6)'},{transform:'scale(1)'}], {duration:320});
      }
      localStorage.setItem(KEY, JSON.stringify(Array.from(f)));
      if (window.renderFavs) window.renderFavs();
    });
  });
})();
</script>`;

// 킥③ 내 주변 축제 (geolocation → 가까운 순 정렬 + 거리 배지)
const NEARBY_JS = `<script>
(function(){
  const btn = document.getElementById('nearby-btn');
  if (!btn) return;
  function dist(a, b, c, d) {
    const R = 6371, r = Math.PI / 180;
    const x = Math.pow(Math.sin((c-a)*r/2), 2) + Math.cos(a*r)*Math.cos(c*r)*Math.pow(Math.sin((d-b)*r/2), 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  btn.addEventListener('click', () => {
    if (!navigator.geolocation) { alert('이 브라우저는 위치 기능을 지원하지 않아요.'); return; }
    btn.textContent = '📍 위치 확인 중...';
    navigator.geolocation.getCurrentPosition(pos => {
      const la = pos.coords.latitude, lo = pos.coords.longitude;
      const grid = document.getElementById('nearby-grid') || document.querySelector('.grid');
      const cards = Array.from(grid.querySelectorAll('.card[data-lat]'));
      cards.forEach(c => {
        const km = Math.round(dist(la, lo, +c.dataset.lat, +c.dataset.lng));
        c.dataset.km = km;
        const el = c.querySelector('.km');
        if (el) el.textContent = '📍 ' + km + 'km';
      });
      cards.sort((a, b) => +a.dataset.km - +b.dataset.km).forEach(c => grid.appendChild(c));
      btn.textContent = '📍 가까운 순으로 정렬됨 ✓';
      btn.classList.add('done');
    }, () => {
      btn.textContent = '📍 내 주변 축제 보기';
      alert('위치 권한을 허용하면 가까운 축제부터 보여드려요!');
    }, { timeout: 8000 });
  });
})();
</script>`;

// 입장 불꽃놀이 효과 (세션당 1회)
const FIREWORKS_JS = `<script>
(function(){
  if (sessionStorage.getItem('fw')) return;
  sessionStorage.setItem('fw', '1');
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight;
  const colors = ['#ff6b4a','#ffd93c','#6bcB77','#4d96ff','#ff6bd6','#fff'];
  let parts = [], done = false;
  function burst(x, y) {
    const c = colors[Math.floor(Math.random()*colors.length)];
    for (let i = 0; i < 60; i++) {
      const a = Math.PI*2*i/60, v = 2+Math.random()*3;
      parts.push({x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v, life: 70+Math.random()*30, c});
    }
  }
  let n = 0;
  const iv = setInterval(() => {
    burst(cv.width*(0.15+Math.random()*0.7), cv.height*(0.15+Math.random()*0.4));
    if (++n >= 5) { clearInterval(iv); done = true; }
  }, 450);
  (function loop(){
    ctx.clearRect(0,0,cv.width,cv.height);
    parts = parts.filter(p => p.life > 0);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.life--;
      ctx.globalAlpha = Math.min(1, p.life/50);
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, 7); ctx.fill();
    });
    if (!done || parts.length) requestAnimationFrame(loop);
    else cv.remove();
  })();
})();
</script>`;

function regionFilter(list) {
  const regions = [...new Set(list.map(f => f.region))];
  const btns = regions.map(r => `<button class="rbtn" data-r="${esc(r)}">${esc(r)}</button>`).join('');
  return `<div class="filter"><button class="rbtn active" data-r="all">전체</button>${btns}</div>
<script>
document.querySelectorAll('.rbtn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.rbtn').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  const r = b.dataset.r;
  document.querySelectorAll('.card').forEach(c => {
    c.style.display = (r === 'all' || c.dataset.region === r) ? '' : 'none';
  });
}));
</script>`;
}

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Pretendard Variable',Pretendard,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#1f2937;line-height:1.65;background:#fff;letter-spacing:-.01em}
a{color:inherit;text-decoration:none}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
header{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.92);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid #e4f2ee;padding:13px 0}
header .wrap{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
.logo{font-size:1.35rem;font-weight:900;color:#0f9d8f}
nav a{margin-left:20px;font-weight:600;font-size:.95rem;color:#4b5563;transition:color .15s}
nav a:hover{color:#0f9d8f}
.hero{position:relative;overflow:hidden;background:url('/img/hero.webp') center/cover;color:#fff;text-align:center}
.hero-vid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero-inner{position:relative;z-index:1;padding:88px 20px 96px;background:linear-gradient(180deg,rgba(20,10,25,.28),rgba(20,10,25,.62))}
.hero h1{font-size:clamp(1.7rem,4.2vw,2.7rem);font-weight:900;letter-spacing:-.03em;margin-bottom:12px;text-shadow:0 2px 14px rgba(0,0,0,.45)}
.hero p{font-size:clamp(.98rem,1.8vw,1.15rem);opacity:.96;text-shadow:0 1px 6px rgba(0,0,0,.45)}
.hero-cta{margin-top:26px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.hero-cta a{padding:13px 26px;border-radius:28px;font-weight:800;font-size:.98rem;transition:transform .15s}
.hero-cta a:hover{transform:translateY(-2px)}
.hero-cta .cta1{background:#0f9d8f;color:#fff;box-shadow:0 6px 18px rgba(15,157,143,.45)}
.hero-cta .cta2{background:rgba(255,255,255,.16);color:#fff;border:1.5px solid rgba(255,255,255,.65);backdrop-filter:blur(4px)}
.hero-stats{margin-top:28px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.hero-stats span{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.28);backdrop-filter:blur(4px);padding:6px 15px;border-radius:18px;font-size:.85rem;font-weight:600}
main{padding:36px 0 56px}
h2.sec{position:relative;font-size:1.45rem;font-weight:800;letter-spacing:-.02em;margin:48px 0 18px;padding-left:15px}
h2.sec::before{content:'';position:absolute;left:0;top:14%;width:5px;height:72%;background:linear-gradient(180deg,#0f9d8f,#2dd4bf);border-radius:4px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}
.card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 3px 14px rgba(31,41,55,.08);transition:transform .2s,box-shadow .2s}
.card:hover{transform:translateY(-5px);box-shadow:0 12px 28px rgba(31,41,55,.14)}
.card .card-body{padding:16px 18px 18px}
.card .thumb{position:relative;height:158px;overflow:hidden;background:#d4f1ec}
.card .thumb img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .45s}
.card:hover .thumb img{transform:scale(1.07)}
.card .thumb::after{content:'';position:absolute;inset:auto 0 0 0;height:46%;background:linear-gradient(180deg,transparent,rgba(0,0,0,.28))}
.card .dday{position:absolute;top:10px;left:10px;z-index:2;background:rgba(17,24,39,.72);color:#fff;font-size:.78rem;font-weight:800;padding:4px 11px;border-radius:14px;backdrop-filter:blur(3px)}
.card .dday:empty{display:none}
.card .dday.on{background:#0f9d8f}
.card .dday.off{background:#9ca3af}
.card.ended{opacity:.55}
.card .cat{position:absolute;bottom:10px;left:10px;z-index:2;background:rgba(255,255,255,.94);color:#0c7d72;font-size:.78rem;font-weight:800;padding:3px 11px;border-radius:12px}
.card h3{font-size:1.13rem;font-weight:800;letter-spacing:-.02em;margin:2px 0 6px}
.card .date{font-weight:700;color:#0f9d8f;font-size:.92rem}
.card .loc{font-size:.86rem;color:#6b7280;margin:2px 0 8px}
.card .desc{font-size:.9rem;color:#4b5563}
.card-top{display:flex;justify-content:flex-end;align-items:center;margin-bottom:2px}
.badge{font-size:.72rem;padding:3px 9px;border-radius:10px;font-weight:700}
.badge.ok{background:#e5f6e8;color:#1a7f37}
.badge.est{background:#fff2d6;color:#9a6700}
.filter{margin:14px 0 22px;display:flex;flex-wrap:wrap;gap:8px}
.rbtn{border:1.5px solid #a9e5dd;background:#fff;color:#0c7d72;border-radius:20px;padding:7px 17px;font-size:.88rem;cursor:pointer;font-weight:700;transition:all .15s}
.rbtn:hover{border-color:#0f9d8f}
.rbtn.active{background:linear-gradient(135deg,#0f9d8f,#2dd4bf);color:#fff;border-color:transparent;box-shadow:0 4px 12px rgba(15,157,143,.35)}
.monthnav{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:12px;margin:16px 0}
.monthnav a{background:#fff;border:1.5px solid #dcefeb;border-radius:16px;padding:18px 12px;text-align:center;font-weight:800;color:#374151;box-shadow:0 2px 8px rgba(31,41,55,.05);transition:all .18s}
.monthnav a:hover{transform:translateY(-3px);border-color:#7fd8ce;box-shadow:0 8px 20px rgba(15,157,143,.14);color:#0f9d8f}
.monthnav .mn-emoji{display:block;font-size:1.6rem;margin-bottom:6px}
.monthnav .cnt{display:block;font-size:.8rem;color:#9ca3af;font-weight:500;margin-top:2px}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:16px;overflow:hidden;font-size:.92rem;box-shadow:0 3px 14px rgba(31,41,55,.07)}
th,td{padding:12px 10px;border-bottom:1px solid #e7f5f1;text-align:left}
th{background:#e9f9f5;color:#0a6c63;font-weight:800}
tr:hover td{background:#f3fdfb}
tr.today-open{background:#e5f6e8}
tr.today-open td:first-child::after{content:" 🔴 오늘 장날!";color:#1a7f37;font-size:.78rem;font-weight:700}
.note{font-size:.86rem;color:#7a8a86;margin:10px 0}
body{background:#f4faf8}
footer{background:#12312e;color:#b7ccc6;padding:38px 0;font-size:.86rem;text-align:center;margin-top:20px}
footer a{text-decoration:underline}
footer p{margin:3px 0}
.wkgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(235px,1fr));gap:10px}
.wkchip{background:#fff;border-radius:14px;padding:14px 17px;font-size:.94rem;box-shadow:0 2px 10px rgba(31,41,55,.07);transition:all .18s;border:1.5px solid transparent}
.wkchip:hover{transform:translateY(-3px);border-color:#7fd8ce;box-shadow:0 8px 20px rgba(15,157,143,.14)}
.wkchip span{display:block;font-size:.8rem;color:#9ca3af;margin-top:2px}
.bloglist a{display:block;background:#fff;border-radius:14px;padding:16px 19px;margin-bottom:12px;font-weight:700;box-shadow:0 2px 10px rgba(31,41,55,.07);transition:all .18s;border:1.5px solid transparent}
.bloglist a:hover{transform:translateY(-2px);border-color:#7fd8ce;box-shadow:0 8px 20px rgba(15,157,143,.12)}
.bloglist a span{display:block;font-size:.84rem;color:#9ca3af;font-weight:400;margin-top:3px}
article{background:#fff;border-radius:16px;padding:30px;box-shadow:0 3px 14px rgba(31,41,55,.07)}
article h1{font-size:1.5rem;margin-bottom:14px}
article h2{font-size:1.2rem;margin:22px 0 8px;color:#0a6c63}
article p,article li{margin-bottom:10px;font-size:.96rem}
article ul{padding-left:20px}
.fav{position:absolute;top:8px;right:8px;z-index:3;width:34px;height:34px;border-radius:50%;border:none;background:rgba(255,255,255,.92);color:#d1d5db;font-size:1.15rem;line-height:1;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.18);transition:all .15s}
.fav:hover{transform:scale(1.12)}
.fav.on{color:#ff3b6b;background:#fff}
.km{position:absolute;bottom:10px;right:10px;z-index:2;background:rgba(17,24,39,.72);color:#fff;font-size:.75rem;font-weight:700;padding:3px 9px;border-radius:12px;backdrop-filter:blur(3px)}
.km:empty{display:none}
.nearby-btn{border:1.5px solid #a9e5dd;background:#fff;color:#0c7d72;border-radius:20px;padding:8px 18px;font-size:.9rem;cursor:pointer;font-weight:800;transition:all .15s;box-shadow:0 2px 8px rgba(15,157,143,.12);font-family:inherit}
.nearby-btn:hover{border-color:#0f9d8f;transform:translateY(-1px)}
.nearby-btn.done{background:linear-gradient(135deg,#0f9d8f,#2dd4bf);color:#fff;border-color:transparent}
.wkchip .wx{display:inline-block;margin-left:6px;font-size:.82rem;font-weight:700;color:#2b7fff;font-style:normal}
.wkchip .wx:empty{display:none}
.testbanner{display:block;margin:34px 0 6px;background:linear-gradient(115deg,#3b1a5c,#7a2fbf 55%,#0f9d8f);color:#fff;border-radius:18px;padding:26px 28px;box-shadow:0 8px 24px rgba(122,47,191,.3);transition:transform .18s}
.testbanner:hover{transform:translateY(-3px)}
.testbanner strong{font-size:1.22rem;display:block;margin-bottom:4px}
.testbanner span{opacity:.9;font-size:.92rem}
.quiz{max-width:620px;margin:0 auto;background:#fff;border-radius:20px;padding:34px 30px;box-shadow:0 6px 24px rgba(31,41,55,.1);text-align:center}
.quiz .qnum{font-size:.85rem;font-weight:800;color:#a78bfa;letter-spacing:.06em;margin-bottom:8px}
.quiz h2{font-size:1.3rem;font-weight:900;letter-spacing:-.02em;margin-bottom:22px}
.quiz .opts{display:grid;gap:10px}
.quiz .opts button{border:1.5px solid #e6efec;background:#f4faf8;border-radius:14px;padding:15px 18px;font-size:1rem;font-weight:700;color:#374151;cursor:pointer;transition:all .15s;font-family:inherit}
.quiz .opts button:hover{border-color:#a78bfa;background:#f6f1ff;transform:translateY(-1px)}
.quiz .dots{display:flex;gap:7px;justify-content:center;margin-top:24px}
.quiz .dots i{width:9px;height:9px;border-radius:50%;background:#dce8e4}
.quiz .dots i.on{background:#7a2fbf}
.result-type{font-size:1.55rem;font-weight:900;margin:6px 0 4px;letter-spacing:-.02em}
.result-desc{color:#6b7280;font-size:.95rem;margin-bottom:20px}
.rec{display:block;text-align:left;background:#f4faf8;border:1.5px solid #e6f0ec;border-radius:14px;padding:14px 17px;margin-bottom:10px;transition:all .15s}
.rec:hover{border-color:#7fd8ce;transform:translateY(-1px)}
.rec strong{font-size:1.02rem}
.rec span{display:block;font-size:.84rem;color:#9ca3af;margin-top:2px}
.share-row{display:flex;gap:9px;justify-content:center;flex-wrap:wrap;margin-top:22px}
.share-row button,.share-row a{border:none;cursor:pointer;border-radius:24px;padding:12px 22px;font-weight:800;font-size:.93rem;font-family:inherit;transition:transform .15s}
.share-row .sh1{background:#fee500;color:#191919}
.share-row .sh2{background:#0f9d8f;color:#fff}
.share-row .sh3{background:#f3f4f6;color:#374151}
.share-row button:hover,.share-row a:hover{transform:translateY(-2px)}
.fmodal{display:none;position:fixed;inset:0;z-index:100;background:rgba(17,24,39,.55);align-items:center;justify-content:center;padding:18px}
.fmodal.show{display:flex}
.fmbox{background:#fff;border-radius:18px;max-width:560px;width:100%;max-height:86vh;overflow:auto;padding:22px;position:relative;box-shadow:0 20px 50px rgba(0,0,0,.3)}
.fmx{position:absolute;top:12px;right:12px;border:none;background:#f3f4f6;width:34px;height:34px;border-radius:50%;font-size:1rem;cursor:pointer;color:#374151}
.fm-img{width:100%;max-height:240px;object-fit:cover;border-radius:12px;margin-bottom:14px}
.fmbox h3{font-size:1.3rem;font-weight:900;letter-spacing:-.02em;margin:2px 40px 6px 0}
#fm-meta,#fm2-meta{color:#0a6c63;font-weight:700;font-size:.92rem;margin-bottom:12px}
#fm-ov,#fm2-ov{color:#374151;font-size:.95rem;line-height:1.65}
.fm-links{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
.fm-links a{flex:1;min-width:140px;text-align:center;padding:12px;border-radius:12px;font-weight:800;font-size:.95rem}
#fm-hp,#fm2-hp{background:#0f9d8f;color:#fff}
#fm-naver,#fm2-naver{background:#f3f4f6;color:#374151;border:1.5px solid #dcefeb}
@media(max-width:600px){.hero h1{font-size:1.3rem}nav a{margin-left:9px;font-size:.85rem}}
`;

function layout(title, desc, urlPath, content, opts) {
  opts = opts || {};
  const lang = opts.lang || 'ko';
  const alts = (opts.alternates || []).map(a => `<link rel="alternate" hreflang="${a.hreflang}" href="${SITE}${a.href}">`).join('\n');
  const logoHref = lang === 'ko' ? '/' : '/' + lang + '/';
  const NAVS = {
    en: `<nav><a href="/en/">Home</a><a href="/en/search/">🔎 Festivals</a><a href="/">🇰🇷 한국어</a></nav>`,
    ja: `<nav><a href="/ja/">ホーム</a><a href="/ja/search/">🔎 お祭り検索</a><a href="/">🇰🇷 한국어</a></nav>`,
    es: `<nav><a href="/es/">Inicio</a><a href="/es/search/">🔎 Buscar festivales</a><a href="/">🇰🇷 한국어</a></nav>`,
    zh: `<nav><a href="/zh/">首页</a><a href="/zh/search/">🔎 庆典搜索</a><a href="/">🇰🇷 한국어</a></nav>`
  };
  const nav = lang === 'ko'
    ? `<nav><a href="/2026-07/">월별 축제</a><a href="/search/">🔎 축제 검색</a><a href="/holiday/">🎌 연휴 축제</a><a href="/pet/">🐶 반려견 여행지</a><a href="/accessible/">♿ 무장애 여행</a><a href="/trails/">🥾 걷기 여행</a><a href="/jangteo/">전국 오일장</a><a href="/test/">🔮 취향 테스트</a><a href="/blog/">축제 가이드</a><a href="/en/">EN</a><a href="/ja/">日本語</a><a href="/es/">ES</a><a href="/zh/">中文</a></nav>`
    : NAVS[lang];
  const FOOTERS = {
    en: `<p>Chukjemoa — Korea Festivals &amp; Traditional Markets</p>
<p>Schedules may change; please check the official website before visiting.</p>
<p>Data: Korea Tourism Organization (TourAPI) · Contact: goohw593@gmail.com</p>
<p>© 2026 Chukjemoa</p>`,
    ja: `<p>Chukjemoa — 韓国のお祭り・伝統市場ガイド</p>
<p>日程は変更される場合があります。訪問前に公式サイトをご確認ください。</p>
<p>データ：韓国観光公社（TourAPI） · お問い合わせ：goohw593@gmail.com</p>
<p>© 2026 Chukjemoa</p>`,
    es: `<p>Chukjemoa — Festivales y mercados tradicionales de Corea</p>
<p>Los horarios pueden cambiar; consulte el sitio oficial antes de visitar.</p>
<p>Datos: Organización de Turismo de Corea (TourAPI) · Contacto: goohw593@gmail.com</p>
<p>© 2026 Chukjemoa</p>`,
    zh: `<p>Chukjemoa — 韩国庆典·传统市场指南</p>
<p>活动日程可能变动，出行前请确认官方网站。</p>
<p>数据：韩国观光公社（TourAPI） · 联系：goohw593@gmail.com</p>
<p>© 2026 Chukjemoa</p>`
  };
  const footer = lang === 'ko'
    ? `<p>${SITE_NAME} — 전국 축제·오일장 일정 모음</p>
<p>축제 일정은 주최 측 사정에 따라 변경될 수 있습니다. 방문 전 공식 홈페이지를 확인하세요.</p>
<p><a href="/privacy/">개인정보처리방침</a> · 문의: goohw593@gmail.com</p>
<p>© 2026 ${SITE_NAME}</p>`
    : FOOTERS[lang];
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="google-site-verification" content="yaGGvBqUsyeq_wrJvUrsiCBcGYtHZA_HBFHdSKlD1GU" />
<meta name="naver-site-verification" content="5eaaca3f7a2290de756df104664ced1f008e71eb" />
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-GXJQ4SXMWY"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-GXJQ4SXMWY');</script>
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${urlPath}">
${alts}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}${urlPath}">
<meta property="og:type" content="website">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE}" crossorigin="anonymous"></script>
${opts.jsonld || ''}
<style>${CSS}</style>
</head>
<body>
<header><div class="wrap">
<a class="logo" href="${logoHref}">🎪 ${SITE_NAME}</a>
${nav}
</div></header>
${content}
<footer><div class="wrap">
${footer}
</div></footer>
${lang === 'ko' ? FEST_MODAL_HTML + PLACE_MODAL_HTML : ''}
${DDAY_JS}
${FAV_JS}
${NEARBY_JS}
${lang === 'ko' ? FEST_MODAL_JS + PLACE_MODAL_JS : ''}
${urlPath === '/' ? FIREWORKS_JS : ''}
</body>
</html>`;
}

function writePage(rel, html) {
  const dir = path.join(ROOT, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log('✓', rel + '/index.html');
}

// ---------- 월별 페이지 ----------
const monthNavHtml = `<div class="monthnav">` + MONTHS.map(mm => {
  const cnt = festivals.filter(f => f.month.some(m => mm.months.includes(m))).length;
  return `<a href="/${mm.key}/"><span class="mn-emoji">${mm.emoji}</span>${mm.short} 축제<span class="cnt">${cnt}개</span></a>`;
}).join('') + `</div>`;

MONTHS.forEach(mm => {
  const list = festivals
    .filter(f => f.month.some(m => mm.months.includes(m)))
    .sort((a, b) => a.start.localeCompare(b.start));
  const title = `${mm.label} 축제 일정 총정리 (${list.length}개) | ${SITE_NAME}`;
  const desc = `${mm.label} 전국 축제 일정 한눈에 보기 — 지역별 축제 날짜, 장소, 볼거리 정리. ${list.slice(0, 3).map(f => f.name).join(', ')} 등 ${list.length}개 축제.`;
  const content = `<main><div class="wrap">
<h1 style="font-size:1.5rem;margin-bottom:6px">${mm.label} 전국 축제 일정</h1>
<p class="note">총 ${list.length}개 · 지역 버튼을 눌러 필터링하세요. 일정은 변동될 수 있으니 방문 전 공식 홈페이지를 확인하세요.</p>
<p style="margin:4px 0 12px"><button id="nearby-btn" class="nearby-btn">📍 내 주변 축제 보기</button></p>
${regionFilter(list)}
<div class="grid">${list.map(festCard).join('\n')}</div>
<h2 class="sec">다른 달 축제 보기</h2>
${monthNavHtml}
</div></main>`;
  writePage(mm.key, layout(title, desc, `/${mm.key}/`, content, { jsonld: eventsJsonLd(list) }));
});

// ---------- 오일장 페이지 ----------
const marketRows = markets.map(m =>
  `<tr data-days="${m.daysNum.join(',')}"><td><strong>${esc(m.name)}</strong></td><td class="nextday"></td><td>${esc(m.region)} ${esc(m.city)}</td><td>${esc(m.days)}</td><td>${esc(m.famous)}</td><td>${esc(m.desc)}</td><td class="jt-links"><a href="https://search.naver.com/search.naver?query=${encodeURIComponent(m.name + ' 맛집')}" target="_blank" rel="noopener">🍴 맛집</a><a href="https://map.naver.com/p/search/${encodeURIComponent(m.name)}" target="_blank" rel="noopener">🗺️ 지도</a></td></tr>`
).join('\n');

const jangteoContent = `<main><div class="wrap">
<div style="border-radius:12px;overflow:hidden;margin-bottom:16px"><img src="/img/jangteo.webp" alt="전통 오일장 풍경" style="width:100%;max-height:220px;object-fit:cover;display:block"></div>
<h1 style="font-size:1.5rem;margin-bottom:6px">전국 유명 오일장(5일장) 날짜 총정리</h1>
<style>
.datepick{background:#fff;border-radius:14px;padding:14px 16px;box-shadow:0 2px 10px rgba(31,41,55,.06);margin:12px 0 16px;display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.datepick label{font-weight:700;color:#374151;font-size:.95rem}
.datepick input[type=date]{padding:8px 10px;border:1.5px solid #dcefeb;border-radius:10px;font-family:inherit;font-size:.95rem;background:#f4faf8;color:#374151}
#date-reset{border:1.5px solid #a9e5dd;background:#fff;color:#0c7d72;border-radius:10px;padding:8px 14px;font-weight:700;cursor:pointer;font-family:inherit}
#date-summary{font-weight:800;color:#0a6c63;font-size:.95rem}
.ndbadge{display:inline-block;padding:5px 13px;border-radius:20px;font-size:.85rem;font-weight:800;white-space:nowrap;letter-spacing:-.01em}
.nd0{background:#15803d;color:#fff}.nd1{background:#0d9488;color:#fff}.nd2{background:#2563eb;color:#fff}.nd3{background:#b45309;color:#fff}.nd4{background:#64748b;color:#fff}.nd-js{background:#7c3aed;color:#fff}
tr.open-on td{background:#e5f6e8}
.jt-links a{display:inline-block;margin-right:8px;color:#0c7d72;font-weight:700;font-size:.85rem;white-space:nowrap}
.jt-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
</style>
<p class="note">오일장은 날짜 끝자리 기준으로 열립니다. 예: 4·9일장 → 4, 9, 14, 19, 24, 29일. <strong>가까운 장날 순으로 자동 정렬</strong>되고, 그 날 열리는 장은 초록색으로 표시됩니다.</p>
<div class="datepick">
<label>📅 가려는 날짜: <input type="date" id="visit-date"></label>
<button id="date-reset" type="button">오늘로</button>
<span id="date-summary"></span>
</div>
<div class="jt-scroll"><table>
<thead><tr><th>장터</th><th>다음 장날</th><th>위치</th><th>장날</th><th>대표 품목</th><th>특징</th><th>바로가기</th></tr></thead>
<tbody id="jt-body">${marketRows}</tbody>
</table></div>
<h2 class="sec">이달의 축제도 확인하세요</h2>
${monthNavHtml}
</div></main>
<script>
(function(){
var MS=86400000;
function opensOn(days,dt){ if(!days.length) return true; var ld=dt.getDate()%10; for(var i=0;i<days.length;i++){ if((days[i]%10)===ld) return true; } return false; }
function nextOffset(days,base){ if(!days.length) return 0; for(var o=0;o<5;o++){ if(opensOn(days,new Date(base.getTime()+o*MS))) return o; } return 0; }
var LB=['오늘','내일','모레','3일 후','4일 후'];
var tbody=document.getElementById('jt-body');
var rows=[].slice.call(tbody.querySelectorAll('tr'));
rows.forEach(function(tr,i){ tr.__i=i; });
var input=document.getElementById('visit-date');
function baseDate(){ if(input.value){ var p=input.value.split('-'); return new Date(+p[0],+p[1]-1,+p[2]); } var n=new Date(); return new Date(n.getFullYear(),n.getMonth(),n.getDate()); }
function render(){
  var base=baseDate(); var isToday=!input.value; var openCnt=0;
  rows.forEach(function(tr){
    var raw=(tr.getAttribute('data-days')||'').split(',').filter(Boolean); var days=raw.map(Number);
    var js=!days.length; var open=opensOn(days,base); var o=nextOffset(days,base);
    var lbl, cls;
    if(js){ lbl='상설'; cls='nd-js'; }
    else if(open){ lbl=isToday?'오늘':'이 날 열림'; cls='nd0'; }
    else { lbl=isToday?LB[o]:(o+'일 후'); cls='nd'+Math.min(o,4); }
    tr.querySelector('.nextday').innerHTML='<span class="ndbadge '+cls+'">'+lbl+'</span>';
    tr.__off=js?-1:o;
    if(open){ tr.classList.add('open-on'); openCnt++; } else { tr.classList.remove('open-on'); }
  });
  rows.slice().sort(function(a,b){ return (a.__off-b.__off) || (a.__i-b.__i); }).forEach(function(tr){ tbody.appendChild(tr); });
  document.getElementById('date-summary').textContent=(base.getMonth()+1)+'월 '+base.getDate()+'일'+(isToday?' (오늘)':'')+' 기준 · 그 날 열리는 장 '+openCnt+'곳';
}
input.addEventListener('change',render);
document.getElementById('date-reset').addEventListener('click',function(){ input.value=''; render(); });
render();
})();
</script>`;
writePage('jangteo', layout(
  `전국 오일장(5일장) 날짜 총정리 — 모란장·정선장·봉평장 장날 | ${SITE_NAME}`,
  `전국 유명 오일장 장날 한눈에 보기. 성남 모란장(4·9일), 정선아리랑시장(2·7일), 봉평장(2·7일) 등 27곳 5일장 날짜와 대표 먹거리 정리.`,
  '/jangteo/', jangteoContent));

// ---------- 블로그 ----------
posts.forEach(p => {
  const content = `<main><div class="wrap"><article>
<h1>${esc(p.title)}</h1>
<p class="note">작성일: ${p.date}</p>
${p.body}
</article>
<h2 class="sec">월별 축제 일정 보기</h2>
${monthNavHtml}
</div></main>`;
  writePage(`blog/${p.slug}`, layout(`${p.title} | ${SITE_NAME}`, p.desc, `/blog/${p.slug}/`, content));
});

const blogIndex = `<main><div class="wrap">
<h1 style="font-size:1.5rem;margin-bottom:14px">축제·장터 가이드</h1>
<div class="bloglist">
${posts.map(p => `<a href="/blog/${p.slug}/">${esc(p.title)}<span>${p.date} · ${esc(p.desc)}</span></a>`).join('\n')}
</div>
<h2 class="sec">월별 축제 일정 보기</h2>
${monthNavHtml}
</div></main>`;
writePage('blog', layout(`축제·장터 가이드 | ${SITE_NAME}`, `축제 준비물, 오일장 이용 팁 등 축제·장터를 200% 즐기는 가이드 모음.`, '/blog/', blogIndex));

// ---------- 메인 페이지 ----------
const upcoming = festivals
  .filter(f => f.end >= TODAY)
  .sort((a, b) => a.start.localeCompare(b.start))
  .slice(0, 9);

const slim = festivals.map(f => {
  const co = coordOf(f);
  const mm2 = apiMatch(f);
  return {
    n: f.name, s: f.start, e: f.end, r: f.region, c: f.city, g: f.category, la: co[0], lo: co[1],
    k: (MONTHS.find(mm => f.month.some(m => mm.months.includes(m))) || MONTHS[0]).key,
    p: f.place, d: f.desc, img: thumbOf(f),
    ov: (mm2 && mm2.ov) || '', hp: (mm2 && mm2.hp) || '',
    near: (mm2 && Array.isArray(nearby[mm2.id]) && nearby[mm2.id].length) ? encodeURIComponent(JSON.stringify(nearby[mm2.id])) : ''
  };
});

const WEEKEND_JS = `<script>
(function(){
  const F = ${JSON.stringify(slim)};
  const EMOJI = ${JSON.stringify(CAT_EMOJI)};
  const t = new Date(); t.setHours(0,0,0,0);
  const sat = new Date(t); sat.setDate(t.getDate() + ((6 - t.getDay() + 7) % 7));
  const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
  const iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  const list = F.filter(f => f.s <= iso(sun) && f.e >= iso(sat)).slice(0, 10);
  const box = document.getElementById('weekend');
  if (box) {
    if (!list.length) { box.innerHTML = '<p class="note">이번 주말 예정된 축제 정보가 없어요.</p>'; }
    else {
      document.getElementById('weekend-title').textContent =
        '이번 주말(' + (sat.getMonth()+1) + '/' + sat.getDate() + '~' + (sun.getMonth()+1) + '/' + sun.getDate() + ') 갈 만한 축제';
      box.innerHTML = list.map((f, i) =>
        '<a class="wkchip" data-i="' + i + '" style="cursor:pointer" href="https://search.naver.com/search.naver?query=' + encodeURIComponent(f.n + ' 축제') + '">' + (EMOJI[f.g]||'🎪') + ' <strong>' + f.n + '</strong><span>' + f.r + ' ' + f.c + ' <em class="wx"></em></span></a>'
      ).join('');
      Array.prototype.forEach.call(box.querySelectorAll('.wkchip'), function(ch){ ch.addEventListener('click', function(ev){ if(!window.openFestModal) return; ev.preventDefault(); var f=list[+ch.getAttribute('data-i')]; if(f) window.openFestModal({name:f.n,start:f.s,end:f.e,region:f.r,city:f.c,place:f.p,desc:f.d,img:f.img,ov:f.ov,hp:f.hp,near:f.near}); }); });

      // 킥② 주말 날씨 배지 (Open-Meteo, API 키 불필요)
      const WX = c =>
        c <= 1 ? '☀️' : c <= 3 ? '⛅' : c <= 48 ? '🌫️' :
        (c <= 67 || (c >= 80 && c <= 82)) ? '🌧️' :
        (c <= 77 || c === 85 || c === 86) ? '❄️' : c >= 95 ? '⛈️' : '🌡️';
      const groups = {};
      list.forEach((f, i) => {
        const key = f.la.toFixed(1) + ',' + f.lo.toFixed(1);
        (groups[key] = groups[key] || { la: f.la, lo: f.lo, idx: [] }).idx.push(i);
      });
      Object.values(groups).slice(0, 8).forEach(g => {
        const u = 'https://api.open-meteo.com/v1/forecast?latitude=' + g.la + '&longitude=' + g.lo +
          '&daily=weather_code,temperature_2m_max&start_date=' + iso(sat) + '&end_date=' + iso(sat) + '&timezone=Asia%2FSeoul';
        fetch(u).then(r => r.json()).then(d => {
          if (!d.daily) return;
          const txt = WX(d.daily.weather_code[0]) + ' ' + Math.round(d.daily.temperature_2m_max[0]) + '°';
          g.idx.forEach(i => {
            const el = document.querySelector('.wkchip[data-i="' + i + '"] .wx');
            if (el) el.textContent = txt;
          });
        }).catch(() => {});
      });
    }
  }

  // 킥④ 찜한 축제 D-day (메인)
  window.renderFavs = function(){
    const sec = document.getElementById('myfavs-sec'), fbox = document.getElementById('myfavs');
    if (!sec || !fbox) return;
    let favs = [];
    try { favs = JSON.parse(localStorage.getItem('cjm_favs')) || []; } catch(e) {}
    const mine = F.filter(f => favs.indexOf(f.n) !== -1).sort((a, b) => a.s.localeCompare(b.s));
    if (!mine.length) { sec.style.display = 'none'; return; }
    sec.style.display = '';
    fbox.innerHTML = mine.map((f, idx) => {
      const s = new Date(f.s), e = new Date(f.e);
      const d = Math.ceil((s - t) / 86400000);
      const dd = t > e ? '종료' : (t >= s ? '진행중 🔥' : 'D-' + d);
      const col = t > e ? '#9ca3af' : '#0f9d8f';
      return '<a class="wkchip" data-i="' + idx + '" style="cursor:pointer" href="https://search.naver.com/search.naver?query=' + encodeURIComponent(f.n + ' 축제') + '">' + (EMOJI[f.g]||'🎪') + ' <strong>' + f.n +
        '</strong> <em style="font-style:normal;font-weight:800;color:' + col + '">' + dd + '</em><span>' + f.r + ' ' + f.c + ' · ' + f.s.slice(5).replace('-','/') + ' 시작</span></a>';
    }).join('');
    Array.prototype.forEach.call(fbox.querySelectorAll('.wkchip'), function(ch){ ch.addEventListener('click', function(ev){ if(!window.openFestModal) return; ev.preventDefault(); var f=mine[+ch.getAttribute('data-i')]; if(f) window.openFestModal({name:f.n,start:f.s,end:f.e,region:f.r,city:f.c,place:f.p,desc:f.d,img:f.img,ov:f.ov,hp:f.hp,near:f.near}); }); });
  };
  renderFavs();
})();
</script>`;

const vmax = visitors.ranked && visitors.ranked.length ? visitors.ranked[0].num : 1;
const visitorSection = (visitors.ranked && visitors.ranked.length) ? `
<h2 class="sec">🔥 요즘 방문자 많은 여행지</h2>
<p class="note" style="margin-top:-2px">한국관광공사 관광 빅데이터 기준(외지인+외국인 방문자, ${visitors.updated || '최근'}). 사람이 많이 찾은 지역일수록 축제·볼거리도 풍성해요.</p>
<div style="display:flex;flex-direction:column;gap:8px;margin:12px 0 6px">
${visitors.ranked.slice(0, 9).map(r => { const w = Math.max(10, Math.round(r.num / vmax * 100)); const medal = r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : ('<span style="color:#9aa3af;font-weight:800">' + r.rank + '</span>'); return `<div style="display:flex;align-items:center;gap:10px"><div style="width:26px;text-align:center">${medal}</div><div style="flex:1;background:#eef5f3;border-radius:10px;overflow:hidden"><div style="width:${w}%;background:linear-gradient(90deg,#0f9d8f,#2dd4bf);color:#fff;font-weight:800;font-size:.86rem;padding:6px 11px;white-space:nowrap;border-radius:10px">${esc(r.name)}</div></div><div style="color:#6b7280;font-size:.82rem;font-weight:700;min-width:58px;text-align:right">${(r.num / 10000).toFixed(0)}만명</div></div>`; }).join('')}
</div>` : '';

const FAQ_HOME = [
  ["이번 주말 내 주변에서 열리는 축제는 어떻게 찾나요?","축제모아 홈에서 '내 주변 축제(📍)' 버튼을 누르면 현재 위치 기준 가까운 순으로 정렬됩니다. 검색 페이지에서 지역과 날짜(이번 주말)로도 걸러 볼 수 있습니다."],
  ["2026년 여름에 갈 만한 축제는 무엇이 있나요?","7~8월에는 보령머드축제, 강릉단오제, 부산바다축제처럼 물·불꽃·야시장 축제가 많습니다. 월별 페이지에서 진행 중·예정 축제를 D-day와 함께 볼 수 있습니다."],
  ["반려견과 함께 갈 수 있는 곳도 있나요?","네. '반려견 동반' 필터와 반려동물 동반 여행지 페이지에서 동반 가능한 장소를 찾을 수 있습니다."],
  ["오일장(5일장)은 언제 서나요?","장터 페이지에서 지역별 오일장의 다음 장날을 자동으로 계산해 보여줍니다. 상설시장도 함께 표시됩니다."]
];
const FAQ_HOME_HTML = `<div class="wrap"><section class="card"><h2>자주 묻는 질문</h2>${FAQ_HOME.map(q=>`<h3>${q[0]}</h3><p>${q[1]}</p>`).join('')}</section></div>`;
const FAQ_HOME_LD = `<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'FAQPage',mainEntity:FAQ_HOME.map(q=>({'@type':'Question',name:q[0],acceptedAnswer:{'@type':'Answer',text:q[1]}}))})}</script>`;

const indexContent = `<div class="hero">
<video class="hero-vid" autoplay muted loop playsinline poster="/img/hero.webp" aria-hidden="true"><source src="/img/hero.mp4" type="video/mp4"></video>
<div class="hero-inner">
<h1>이번 주말, 어디로 떠나볼까요?</h1>
<p>전국 축제와 오일장 일정을 한눈에 — 가족 나들이 계획이 3분이면 끝나요.</p>
<div class="hero-cta"><a class="cta1" href="#weekend-title">이번 주말 축제 보기</a><a class="cta2" href="/test/">🔮 축제 취향 테스트</a></div>
<div class="hero-stats"><span>🎪 축제 ${festivals.length}개</span><span>🧺 오일장 ${markets.length}곳</span><span>📅 매달 업데이트</span></div>
</div>
</div>
<main><div class="wrap">
<div id="myfavs-sec" style="display:none">
<h2 class="sec">💖 내가 찜한 축제</h2>
<div class="wkgrid" id="myfavs"></div>
</div>
<h2 class="sec" id="weekend-title">이번 주말 갈 만한 축제</h2>
<div class="wkgrid" id="weekend"></div>
${WEEKEND_JS}
<a class="testbanner" href="/test/"><strong>🔮 30초 축제 취향 테스트</strong><span>4가지 질문으로 나에게 딱 맞는 축제를 찾아드려요 — 결과를 친구에게 공유해보세요!</span></a>
<h2 class="sec">지금 &amp; 곧 열리는 축제 <button id="nearby-btn" class="nearby-btn" style="margin-left:10px;vertical-align:middle">📍 내 주변 축제 보기</button></h2>
<div class="grid" id="nearby-grid">${upcoming.map(festCard).join('\n')}</div>
<h2 class="sec">월별 축제 일정</h2>
${monthNavHtml}
${visitorSection}
<h2 class="sec">전국 오일장 — 오늘 서는 장은?</h2>
<p class="note">성남 모란장, 정선아리랑시장, 봉평장 등 전국 유명 5일장 날짜를 정리했어요.</p>
<p><a href="/jangteo/" style="display:inline-block;background:#ff6b4a;color:#fff;font-weight:700;padding:10px 22px;border-radius:24px">오일장 날짜 보러가기 →</a></p>
<h2 class="sec">축제 가이드</h2>
<div class="bloglist">
${posts.map(p => `<a href="/blog/${p.slug}/">${esc(p.title)}<span>${p.date}</span></a>`).join('\n')}
</div>
</div></main>`;
writePage('.', layout(
  `${SITE_NAME} — 전국 축제·오일장 일정 총정리 (2026)`,
  `2026 전국 축제 일정과 오일장(5일장) 날짜를 한눈에. 월별·지역별 축제 정보, 보령머드축제부터 화천산천어축제까지.`,
  '/', indexContent + FAQ_HOME_HTML, { jsonld: eventsJsonLd(upcoming) + FAQ_HOME_LD, alternates: homeAlts() }));

// ---------- 개인정보처리방침 ----------
const privacyContent = `<main><div class="wrap"><article>
<h1>개인정보처리방침</h1>
<p>시행일: 2026년 7월 11일</p>
<h2>1. 개요</h2>
<p>축제모아(chukjemoa.co.kr, 이하 "사이트")는 이용자의 개인정보를 중요시하며, 관련 법령을 준수합니다. 본 사이트는 회원가입 없이 이용 가능하며, 이용자가 직접 입력하는 개인정보를 수집·저장하지 않습니다.</p>
<h2>2. 쿠키 및 광고</h2>
<p>본 사이트는 Google AdSense 광고를 게재합니다. Google을 포함한 제3자 광고 사업자는 쿠키를 사용하여 이용자의 이전 방문 기록을 바탕으로 광고를 게재할 수 있습니다. Google의 광고 쿠키 사용으로 Google 및 파트너는 사이트 방문 기록에 기반한 맞춤 광고를 제공할 수 있습니다.</p>
<p>이용자는 <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">Google 광고 설정</a>에서 맞춤 광고를 비활성화할 수 있습니다.</p>
<h2>3. 분석 도구</h2>
<p>사이트 개선을 위해 방문 통계 도구를 사용할 수 있으며, 이 과정에서 IP 주소·브라우저 정보 등 비식별 정보가 자동 수집될 수 있습니다.</p>
<h2>4. 위치정보</h2>
<p>"내 주변 축제" 기능은 이용자가 버튼을 눌러 동의한 경우에만 브라우저의 위치정보를 사용하며, 위치정보는 거리 계산에만 일시적으로 사용되고 서버로 전송·저장되지 않습니다.</p>
<h2>5. 외부 링크</h2>
<p>본 사이트는 축제 공식 홈페이지 등 외부 사이트 링크를 포함합니다. 외부 사이트의 개인정보 처리에 대해서는 책임지지 않습니다.</p>
<h2>6. 문의</h2>
<p>개인정보 관련 문의: goohw593@gmail.com</p>
</article></div></main>`;
writePage('privacy', layout(`개인정보처리방침 | ${SITE_NAME}`, `축제모아 개인정보처리방침`, '/privacy/', privacyContent));

// ---------- 킥① 축제 취향 테스트 ----------
const QUIZ_JS = `<script>
(function(){
  const F = ${JSON.stringify(slim)};
  const EMOJI = ${JSON.stringify(CAT_EMOJI)};
  const TYPES = {
    '물놀이': ['💦 여름 물개상', '더위는 정면돌파! 시원하게 젖어야 진짜 축제죠.'],
    '음악': ['🎵 페스티벌 프로참석러', '음악이 울리는 곳이 곧 내 자리. 떼창은 필수!'],
    '음식': ['🍜 축제는 먹으러 가는 편', '축제의 완성은 먹거리. 한 손엔 꼬치, 한 손엔 지도!'],
    '꽃': ['🌸 감성 사진 장인', '꽃길만 걷고 싶은 당신, 인생샷은 덤이에요.'],
    '문화': ['🎭 문화 산책러', '천천히 보고 느끼는 게 좋은 교양파 여행자.'],
    '불꽃': ['🎆 불꽃 낭만러', '밤하늘에 터지는 그 순간을 위해 축제에 갑니다.'],
    '전통': ['🏮 옛멋 탐험가', '장터 국밥에 민속놀이, 정겨운 게 최고죠.'],
    '빛': ['✨ 야경 수집가', '반짝이는 불빛 아래에서 가장 행복한 타입.'],
    '눈': ['⛄ 겨울왕국 주민', '추울수록 신나는 겨울축제 마니아!'],
    '기타': ['🎪 축제 만능러', '어떤 축제든 즐길 준비 완료, 만능 나들이꾼!']
  };
  const QS = [
    { q: '이번 나들이, 누구랑 가세요?', o: [
      ['👨‍👩‍👧 아이들과 가족끼리', {'물놀이':2,'전통':1,'눈':2,'기타':1}],
      ['💕 연인과 둘이서', {'꽃':2,'빛':2,'불꽃':2}],
      ['🍻 친구들과 우르르', {'음악':3,'음식':2,'물놀이':1}],
      ['🎧 혼자 여유롭게', {'문화':3,'꽃':1,'전통':1}]
    ]},
    { q: '축제에서 제일 기대되는 건?', o: [
      ['🍢 길거리 먹거리 털기', {'음식':3,'전통':1}],
      ['🎤 무대·공연·음악', {'음악':3,'불꽃':1}],
      ['📸 인생샷 건지기', {'꽃':2,'빛':2,'눈':1}],
      ['🖐️ 체험하고 구경하기', {'문화':2,'전통':2,'물놀이':1}]
    ]},
    { q: '끌리는 분위기는?', o: [
      ['🌊 시원하고 짜릿하게', {'물놀이':3,'음악':1}],
      ['🌙 로맨틱하고 반짝반짝', {'빛':3,'불꽃':2,'꽃':1}],
      ['🍲 정겹고 구수하게', {'전통':3,'음식':1}],
      ['🍃 조용하고 아늑하게', {'문화':2,'꽃':2,'눈':1}]
    ]},
    { q: '언제 떠나고 싶어요?', o: [
      ['🔥 당장 이번 주말!', {}, 'weekend'],
      ['📅 이번 달 안에', {}, 'month'],
      ['🍁 선선한 가을에', {'꽃':1,'불꽃':1}, 'fall'],
      ['❄️ 눈 오는 겨울에', {'눈':2,'빛':1}, 'winter']
    ]}
  ];
  let step = 0, score = {}, time = 'any';
  const box = document.getElementById('quiz');
  function render() {
    if (step >= QS.length) return result();
    const q = QS[step];
    box.innerHTML = '<div class="qnum">Q' + (step+1) + ' / ' + QS.length + '</div><h2>' + q.q + '</h2>' +
      '<div class="opts">' + q.o.map((o, i) => '<button data-i="' + i + '">' + o[0] + '</button>').join('') + '</div>' +
      '<div class="dots">' + QS.map((x, i) => '<i class="' + (i <= step ? 'on' : '') + '"></i>').join('') + '</div>';
    box.querySelectorAll('.opts button').forEach(b => b.addEventListener('click', () => {
      const o = q.o[+b.dataset.i];
      Object.keys(o[1]).forEach(k => score[k] = (score[k] || 0) + o[1][k]);
      if (o[2]) time = o[2];
      step++; render();
    }));
  }
  function result() {
    const t = new Date(); t.setHours(0,0,0,0);
    const iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    const today = iso(t);
    const sat = new Date(t); sat.setDate(t.getDate() + ((6 - t.getDay() + 7) % 7));
    const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
    const monthEnd = iso(new Date(t.getFullYear(), t.getMonth() + 1, 0));
    const top = Object.keys(score).sort((a, b) => score[b] - score[a]);
    const best = top[0] || '기타';
    const tinfo = TYPES[best] || TYPES['기타'];
    let pool = F.filter(f => f.e >= today);
    if (time === 'weekend') pool = pool.filter(f => f.s <= iso(sun) && f.e >= iso(sat));
    else if (time === 'month') pool = pool.filter(f => f.s <= monthEnd);
    else if (time === 'fall') pool = pool.filter(f => ['09','10','11'].indexOf(f.s.slice(5,7)) !== -1);
    else if (time === 'winter') pool = pool.filter(f => ['12','01','02'].indexOf(f.s.slice(5,7)) !== -1);
    const rank = f => { const i = top.indexOf(f.g); return i === -1 ? 99 : i; };
    pool.sort((a, b) => rank(a) - rank(b) || a.s.localeCompare(b.s));
    const recs = pool.slice(0, 3);
    const recHtml = recs.length ? recs.map(f =>
      '<a class="rec" href="/' + f.k + '/">' + (EMOJI[f.g]||'🎪') + ' <strong>' + f.n + '</strong><span>📍 ' + f.r + ' ' + f.c + ' · 📅 ' + f.s.replace(/-/g,'.') + ' ~ ' + f.e.replace(/-/g,'.') + '</span></a>').join('')
      : '<p class="note">조건에 맞는 축제가 없어요. 다른 계절로 다시 해보세요!</p>';
    box.innerHTML = '<div class="qnum">나의 축제 유형은</div>' +
      '<div class="result-type">' + tinfo[0] + '</div>' +
      '<p class="result-desc">' + tinfo[1] + '</p>' +
      '<h2 style="font-size:1.05rem;margin-bottom:12px">🎯 지금 딱 맞는 추천 축제</h2>' + recHtml +
      '<div class="share-row">' +
      '<button class="sh1" id="share-btn">📤 결과 공유하기</button>' +
      '<button class="sh3" id="retry-btn">🔄 다시 하기</button>' +
      '<a class="sh2" href="/">축제 더 보기</a></div>';
    document.getElementById('retry-btn').addEventListener('click', () => { step = 0; score = {}; time = 'any'; render(); });
    document.getElementById('share-btn').addEventListener('click', () => {
      const txt = '나의 축제 유형은 [' + tinfo[0] + ']! 너도 해봐 👉';
      const url = 'https://chukjemoa.co.kr/test/';
      if (navigator.share) navigator.share({ title: '축제 취향 테스트', text: txt, url: url }).catch(() => {});
      else navigator.clipboard.writeText(txt + ' ' + url).then(() => alert('링크가 복사됐어요! 카톡에 붙여넣어 보세요 💬'));
    });
  }
  render();
})();
</script>`;

const testContent = `<main><div class="wrap" style="padding-top:10px">
<div style="text-align:center;margin-bottom:22px">
<h1 style="font-size:1.6rem;font-weight:900;letter-spacing:-.02em">🔮 30초 축제 취향 테스트</h1>
<p class="note" style="margin-top:4px">4가지 질문으로 나에게 딱 맞는 전국 축제를 찾아드려요.</p>
</div>
<div class="quiz" id="quiz"></div>
${QUIZ_JS}
<h2 class="sec">월별 축제 일정 보기</h2>
${monthNavHtml}
</div></main>`;
writePage('test', layout(
  `축제 취향 테스트 — 나에게 맞는 축제 찾기 | ${SITE_NAME}`,
  `4가지 질문으로 알아보는 나의 축제 유형! 물놀이·음악·먹거리·불꽃놀이… 나에게 딱 맞는 2026 전국 축제를 30초 만에 추천받으세요.`,
  '/test/', testContent));

// ---------- 킥⑤ 축제 검색 (공공데이터 TourAPI) ----------
const SIDO_ORDER = ['서울','경기','인천','강원','충북','충남','대전','세종','전북','전남','광주','경북','경남','대구','울산','부산','제주'];
const sidosPresent = SIDO_ORDER.filter(s => apiFests.some(f => f.sido === s));
const sidoOpts = sidosPresent.map(s => `<option value="${s}">${s} (${apiFests.filter(f => f.sido === s).length})</option>`).join('');
const searchContent = `<main><div class="wrap">
<style>
.srchbar{background:#fff;border-radius:16px;padding:16px 18px;box-shadow:0 3px 14px rgba(31,41,55,.07);margin:14px 0 6px}
.srchbar .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.srchbar select,.srchbar input{padding:10px 13px;border:1.5px solid #dcefeb;border-radius:12px;font-size:.93rem;font-family:inherit;background:#f4faf8;color:#374151}
.srchbar input#fKw{flex:1;min-width:150px}
.srchbar .q{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
.srchbar .q button{border:1.5px solid #a9e5dd;background:#fff;color:#0c7d72;border-radius:20px;padding:8px 16px;font-size:.87rem;font-weight:800;cursor:pointer;font-family:inherit;transition:all .15s}
.srchbar .q button:hover{border-color:#0f9d8f}
.srchbar .q button.on{background:linear-gradient(135deg,#0f9d8f,#2dd4bf);color:#fff;border-color:transparent}
.fmodal{display:none;position:fixed;inset:0;z-index:100;background:rgba(17,24,39,.55);align-items:center;justify-content:center;padding:18px}
.fmodal.show{display:flex}
.fmbox{background:#fff;border-radius:18px;max-width:560px;width:100%;max-height:86vh;overflow:auto;padding:22px;position:relative;box-shadow:0 20px 50px rgba(0,0,0,.3)}
.fmx{position:absolute;top:12px;right:12px;border:none;background:#f3f4f6;width:34px;height:34px;border-radius:50%;font-size:1rem;cursor:pointer;color:#374151}
.fm-img{width:100%;max-height:240px;object-fit:cover;border-radius:12px;margin-bottom:14px}
.fmbox h3{font-size:1.3rem;font-weight:900;letter-spacing:-.02em;margin:2px 40px 6px 0}
#fm-meta{color:#0a6c63;font-weight:700;font-size:.92rem;margin-bottom:12px}
#fm-ov{color:#374151;font-size:.95rem;line-height:1.65}
.fm-links{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
.fm-links a{flex:1;min-width:140px;text-align:center;padding:12px;border-radius:12px;font-weight:800;font-size:.95rem}
#fm-hp{background:#0f9d8f;color:#fff}
#fm-naver{background:#f3f4f6;color:#374151;border:1.5px solid #dcefeb}
.srchbar .chk{display:inline-flex;align-items:center;gap:5px;font-size:.9rem;font-weight:700;color:#0c7d72;cursor:pointer;background:#f4faf8;border:1.5px solid #dcefeb;border-radius:12px;padding:9px 12px}
.srchbar .chk input{accent-color:#0f9d8f}
#fReset{background:#f3f4f6;color:#374151;border:none;cursor:pointer;font-weight:700}
.srch-count{margin:16px 0 12px;font-weight:800;color:#0a6c63;font-size:1.02rem}
.page-h1{font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:6px 0}
.page-sub{color:#6b7280;font-size:.95rem;margin-bottom:6px}
</style>
<h1 class="page-h1">🔎 전국 축제 검색</h1>
<p class="page-sub">공공데이터(한국관광공사) 기반 전국 축제 ${apiFests.length}건 — 날짜·지역·도시로 찾아보세요.</p>
<div class="srchbar">
<div class="row">
<select id="fSido"><option value="">전체 지역</option>${sidoOpts}</select>
<select id="fSigungu"><option value="">전체 도시</option></select>
<input type="text" id="fKw" placeholder="축제명·지역 검색">
<label class="chk"><input type="checkbox" id="fPet"> 🐶 반려견 동반</label>
<label class="chk"><input type="checkbox" id="fPast"> 지난 축제 포함</label>
<button id="fReset">초기화</button>
</div>
<div class="q" id="fQuick">
<button data-q="all" class="on">전체</button>
<button data-q="now">진행중</button>
<button data-q="weekend">이번 주말</button>
<button data-q="month">이번 달</button>
<button data-q="next">다음 달</button>
</div>
</div>
<div class="srch-count" id="fCount"></div>
<div class="grid" id="fGrid"></div>
<p class="note">데이터 출처: 한국관광공사 국문관광정보 서비스(공공데이터포털). 일정은 변동될 수 있으니 방문 전 공식 정보를 확인하세요. 축제 카드를 누르면 <strong>상세 개요·공식 홈페이지·네이버</strong>를 볼 수 있어요.</p>
<div id="fmodal" class="fmodal"><div class="fmbox">
<button class="fmx" id="fmx" aria-label="닫기">✕</button>
<img id="fm-img" class="fm-img" alt="">
<h3 id="fm-title"></h3>
<p id="fm-meta"></p>
<p id="fm-ov"></p>
<div id="fm-near"></div>
<div class="fm-links"><a id="fm-hp" target="_blank" rel="noopener">🏛️ 공식 홈페이지</a><a id="fm-naver" target="_blank" rel="noopener">🔎 네이버에서 보기</a></div>
</div></div>
</div></main>
<script>
(function(){
var F=[],byId={};
var st={sido:'',sigungu:'',kw:'',quick:'all',pet:false,past:false};
function td(){var d=new Date();d.setHours(0,0,0,0);return d;}
function toD(y){return new Date(+y.slice(0,4),+y.slice(4,6)-1,+y.slice(6,8));}
function ov(f,a,b){var s=toD(f.start),e=toD(f.end);return s<=b&&e>=a;}
function fy(y){return y?y.slice(0,4)+'.'+(+y.slice(4,6))+'.'+(+y.slice(6,8)):'';}
function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function dday(f){var t=td(),s=toD(f.start),e=toD(f.end);if(e<t)return{l:'종료',c:'off'};if(s<=t)return{l:'진행중',c:'on'};return{l:'D-'+Math.round((s-t)/86400000),c:'on'};}
function ranges(){var t=td(),w=t.getDay();var sat=new Date(t);sat.setDate(t.getDate()+((6-w+7)%7));var sun=new Date(sat);sun.setDate(sat.getDate()+1);var m0=new Date(t.getFullYear(),t.getMonth(),1),m1=new Date(t.getFullYear(),t.getMonth()+1,0),n0=new Date(t.getFullYear(),t.getMonth()+1,1),n1=new Date(t.getFullYear(),t.getMonth()+2,0);return{t:t,sat:sat,sun:sun,m0:m0,m1:m1,n0:n0,n1:n1};}
function card(f){var d=dday(f),img=f.img||'/img/cat-culture.webp',loc=(f.sido||'')+(f.sigungu?' '+f.sigungu:'');return '<div class="card" data-id="'+esc(f.id)+'" style="cursor:pointer"><div class="thumb"><img loading="lazy" src="'+esc(img)+'" alt="'+esc(f.title)+'" onerror="this.src=&#39;/img/cat-culture.webp&#39;"><span class="dday '+d.c+'">'+d.l+'</span>'+(f.sido?'<span class="cat">'+esc(f.sido)+'</span>':'')+'</div><div class="card-body"><h3>'+esc(f.title)+'</h3><div class="date">'+fy(f.start)+' ~ '+fy(f.end)+'</div><div class="loc">'+esc(loc)+'</div></div></div>';}
function apply(){var r=ranges();var list=F.filter(function(f){if(!st.past&&!st.pet&&toD(f.end)<r.t)return false;if(st.pet&&!f.pet)return false;if(st.sido&&f.sido!==st.sido)return false;if(st.sigungu&&f.sigungu!==st.sigungu)return false;if(st.kw){var k=st.kw.toLowerCase();if((f.title||'').toLowerCase().indexOf(k)<0&&(f.addr||'').indexOf(st.kw)<0)return false;}if(st.quick==='now'&&!ov(f,r.t,r.t))return false;if(st.quick==='weekend'&&!ov(f,r.sat,r.sun))return false;if(st.quick==='month'&&!ov(f,r.m0,r.m1))return false;if(st.quick==='next'&&!ov(f,r.n0,r.n1))return false;return true;});list.sort(function(a,b){return (a.start||'').localeCompare(b.start||'');});document.getElementById('fCount').textContent='총 '+list.length+'개 축제';document.getElementById('fGrid').innerHTML=list.length?list.map(card).join(''):'<p style="grid-column:1/-1;color:#6b7280;padding:24px 0">조건에 맞는 축제가 없어요. 필터를 바꿔보세요.</p>';}
function fillSg(){var set={};F.forEach(function(f){if((!st.sido||f.sido===st.sido)&&f.sigungu)set[f.sigungu]=1;});var arr=Object.keys(set).sort();document.getElementById('fSigungu').innerHTML='<option value="">전체 도시</option>'+arr.map(function(s){return '<option value="'+s+'">'+s+'</option>';}).join('');}
document.getElementById('fSido').addEventListener('change',function(e){st.sido=e.target.value;st.sigungu='';fillSg();apply();});
document.getElementById('fSigungu').addEventListener('change',function(e){st.sigungu=e.target.value;apply();});
document.getElementById('fKw').addEventListener('input',function(e){st.kw=e.target.value.trim();apply();});
document.getElementById('fReset').addEventListener('click',function(){st={sido:'',sigungu:'',kw:'',quick:'all',pet:false,past:false};document.getElementById('fSido').value='';document.getElementById('fKw').value='';document.getElementById('fPet').checked=false;document.getElementById('fPast').checked=false;fillSg();var bs=document.querySelectorAll('#fQuick button');for(var i=0;i<bs.length;i++)bs[i].classList.toggle('on',bs[i].getAttribute('data-q')==='all');apply();});
var qbs=document.querySelectorAll('#fQuick button');for(var i=0;i<qbs.length;i++){qbs[i].addEventListener('click',function(){st.quick=this.getAttribute('data-q');for(var j=0;j<qbs.length;j++)qbs[j].classList.remove('on');this.classList.add('on');apply();});}
document.getElementById('fPet').addEventListener('change',function(e){st.pet=e.target.checked;apply();});
document.getElementById('fPast').addEventListener('change',function(e){st.past=e.target.checked;apply();});
function openModal(f){var m=document.getElementById('fmodal');var img=document.getElementById('fm-img');if(f.img){img.src=f.img;img.style.display='block';}else{img.style.display='none';}document.getElementById('fm-title').textContent=f.title;document.getElementById('fm-meta').textContent=fy(f.start)+' ~ '+fy(f.end)+'  ·  '+((f.sido||'')+(f.sigungu?' '+f.sigungu:''))+(f.tel?'  ·  '+f.tel:'');document.getElementById('fm-ov').textContent=f.ov||'상세 개요는 아직 준비 중이에요. 아래 네이버·공식 홈페이지에서 확인하세요.';var nearEl=document.getElementById('fm-near');if(f.near&&f.near.length){nearEl.innerHTML='<div style="font-weight:800;color:#0a6c63;margin:16px 0 8px">📍 근처 가볼 곳</div><div style="display:flex;flex-wrap:wrap;gap:8px">'+f.near.map(function(n){return '<a href="https://search.naver.com/search.naver?query='+encodeURIComponent(n.t)+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;background:#f4faf8;border:1px solid #dcefeb;border-radius:20px;padding:6px 12px;font-size:.85rem;font-weight:700;color:#374151;text-decoration:none">'+(n.img?'<img src="'+esc(n.img)+'" style="width:22px;height:22px;border-radius:50%;object-fit:cover" onerror="this.style.display=&#39;none&#39;">':'')+esc(n.t)+' <span style="color:#9aa3af;font-weight:600">'+esc(n.ty)+(n.d?' '+n.d+'km':'')+'</span></a>';}).join('')+'</div>';}else{nearEl.innerHTML='';}var hp=document.getElementById('fm-hp');if(f.hp){hp.href=f.hp;hp.style.display='inline-block';}else{hp.style.display='none';}document.getElementById('fm-naver').href='https://search.naver.com/search.naver?query='+encodeURIComponent(f.title+' 축제');m.classList.add('show');}
function closeModal(){document.getElementById('fmodal').classList.remove('show');}
document.getElementById('fmx').addEventListener('click',closeModal);
document.getElementById('fmodal').addEventListener('click',function(e){if(e.target.id==='fmodal')closeModal();});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal();});
document.getElementById('fGrid').addEventListener('click',function(e){var c=e.target.closest('.card');if(!c)return;var f=byId[c.getAttribute('data-id')];if(f)openModal(f);});
document.getElementById('fCount').textContent='불러오는 중…';
fetch('/search/data.json').then(function(r){return r.json();}).then(function(data){F=data;byId={};F.forEach(function(f){byId[f.id]=f;});fillSg();apply();}).catch(function(){document.getElementById('fCount').textContent='데이터를 불러오지 못했습니다. 새로고침 해주세요.';});
})();
</script>`;
writePage('search', layout('전국 축제 검색 — 날짜·지역·도시별 | ' + SITE_NAME, '전국 축제를 날짜·지역·도시로 검색하세요. 공공데이터 기반 최신 축제 ' + apiFests.length + '건. 진행중·이번 주말·이번 달·반려견 동반 축제를 한눈에.', '/search/', searchContent, { alternates: searchAlts() }));
apiFests.forEach(f => { const nb = nearby[f.id]; if (Array.isArray(nb) && nb.length) f.near = nb; });
fs.writeFileSync(path.join(ROOT, 'search', 'data.json'), JSON.stringify(apiFests));

// ---------- 킥⑥ 반려견 동반 여행지 (반려동물 동반여행 API) ----------
const petSidos = SIDO_ORDER.filter(s => apiPets.some(p => p.sido === s));
const petSidoOpts = petSidos.map(s => `<option value="${s}">${s} (${apiPets.filter(p => p.sido === s).length})</option>`).join('');
const petCats = ['관광지','음식점','숙박','레포츠','문화시설'];
const petCatOpts = petCats.filter(c => apiPets.some(p => p.cat === c)).map(c => `<option value="${c}">${c}</option>`).join('');
const petContent = `<main><div class="wrap">
<style>
.srchbar{background:#fff;border-radius:16px;padding:16px 18px;box-shadow:0 3px 14px rgba(31,41,55,.07);margin:14px 0 6px}
.srchbar .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.srchbar select,.srchbar input{padding:10px 13px;border:1.5px solid #dcefeb;border-radius:12px;font-size:.93rem;font-family:inherit;background:#f4faf8;color:#374151}
.srchbar input#pKw{flex:1;min-width:150px}
.srch-count{margin:16px 0 12px;font-weight:800;color:#0a6c63;font-size:1.02rem}
.page-h1{font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:6px 0}
.page-sub{color:#6b7280;font-size:.95rem;margin-bottom:6px}
.pmore{background:#fff;border:1.5px solid #a9e5dd;color:#0c7d72;border-radius:22px;padding:11px 26px;font-weight:800;font-size:.95rem;cursor:pointer;font-family:inherit;transition:all .15s}
.pmore:hover{border-color:#0f9d8f;transform:translateY(-1px)}
.card .petbadge{font-size:.82rem;font-weight:800;color:#0c7d72;margin-top:7px}
.card .petnote{font-size:.79rem;color:#6b7280;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
</style>
<h1 class="page-h1">🐶 반려견 동반 여행지</h1>
<p class="page-sub">공공데이터(한국관광공사 반려동물 동반여행) 기반 전국 반려동물 동반 가능 장소 ${apiPets.length}곳 — 축제 다녀오는 길에 강아지랑 들르기 좋은 곳을 지역별로 찾아보세요.</p>
<div class="srchbar"><div class="row">
<select id="pSido"><option value="">전체 지역</option>${petSidoOpts}</select>
<select id="pSigungu"><option value="">전체 시·군·구</option></select>
<select id="pCat"><option value="">전체 유형</option>${petCatOpts}</select>
<input type="text" id="pKw" placeholder="장소명·주소 검색">
<button id="pReset" class="pmore" style="border-color:#f0e6dc;color:#374151">초기화</button>
</div></div>
<div class="srch-count" id="pCount"></div>
<div class="grid" id="pGrid"></div>
<div style="text-align:center;margin:22px 0"><button id="pMore" class="pmore" style="display:none">더 보기</button></div>
<p class="note">데이터 출처: 한국관광공사 반려동물 동반여행 서비스(공공데이터포털). 반려동물 동반 조건·이용가능 시설은 방문 전 각 장소에 꼭 확인하세요. 카드를 누르면 상세정보와 지도·검색 링크가 표시됩니다.</p>
</div></main>
<script>
(function(){
var P=[];var byId={};var st={sido:'',sigungu:'',cat:'',kw:''};var shown=60;
var CE={'관광지':'🏞️','음식점':'🍴','숙박':'🏨','레포츠':'🚵','문화시설':'🎭'};
function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function card(p){var loc=(p.sido||'')+(p.sigungu?' '+p.sigungu:'');var q=encodeURIComponent(p.title);var img=p.img||'/img/hero.webp';var badge=[p.psbl,p.type].filter(Boolean).join(' · ');var info=[p.need,p.note].filter(Boolean).join(' / ');return '<a class="card" data-id="'+esc(p.id)+'" style="cursor:pointer" href="https://search.naver.com/search.naver?query='+q+'"><div class="thumb"><img loading="lazy" src="'+esc(img)+'" alt="'+esc(p.title)+'" onerror="this.src=&#39;/img/hero.webp&#39;"><span class="cat">'+(CE[p.cat]||'')+' '+esc(p.cat)+'</span></div><div class="card-body"><h3>'+esc(p.title)+'</h3><div class="loc">'+esc(loc)+'</div>'+(badge?'<div class="petbadge">🐾 '+esc(badge)+'</div>':'')+(info?'<div class="petnote" title="'+esc(info)+'">ⓘ '+esc(info)+'</div>':'')+'</div></a>';}
function openPet(p){if(!window.openPlaceModal){window.open('https://search.naver.com/search.naver?query='+encodeURIComponent(p.title),'_blank','noopener');return;}var loc=(p.sido||'')+(p.sigungu?' '+p.sigungu:'');var body='';var badge=[p.psbl,p.type].filter(Boolean).join(' · ');if(badge)body+='<div class="petbadge" style="font-size:.9rem">🐾 동반 가능: '+esc(badge)+'</div>';var info=[p.need,p.note].filter(Boolean).join(' / ');if(info)body+='<div style="color:#6b7280;font-size:.9rem;margin-top:6px">ⓘ '+esc(info)+'</div>';window.openPlaceModal({img:p.img,title:p.title,meta:[(CE[p.cat]||'')+' '+p.cat,loc,p.tel].filter(Boolean).join('  ·  '),body:body,naver:'https://search.naver.com/search.naver?query='+encodeURIComponent(p.title),map:'https://map.naver.com/p/search/'+encodeURIComponent(p.title)});}
function filtered(){return P.filter(function(p){if(st.sido&&p.sido!==st.sido)return false;if(st.sigungu&&p.sigungu!==st.sigungu)return false;if(st.cat&&p.cat!==st.cat)return false;if(st.kw){var k=st.kw.toLowerCase();if((p.title||'').toLowerCase().indexOf(k)<0&&(p.addr||'').indexOf(st.kw)<0)return false;}return true;});}
function render(){var list=filtered();document.getElementById('pCount').textContent='총 '+list.length+'곳';var g=document.getElementById('pGrid');g.innerHTML=list.length?list.slice(0,shown).map(card).join(''):'<p style="grid-column:1/-1;color:#6b7280;padding:24px 0">조건에 맞는 곳이 없어요. 지역·유형을 바꿔보세요.</p>';document.getElementById('pMore').style.display=list.length>shown?'inline-block':'none';}
function fillSg(){var set={};P.forEach(function(p){if((!st.sido||p.sido===st.sido)&&p.sigungu)set[p.sigungu]=1;});var arr=Object.keys(set).sort();document.getElementById('pSigungu').innerHTML='<option value="">전체 시·군·구</option>'+arr.map(function(s){return '<option value="'+s+'">'+s+'</option>';}).join('');}
document.getElementById('pSido').addEventListener('change',function(e){st.sido=e.target.value;st.sigungu='';shown=60;fillSg();render();});
document.getElementById('pSigungu').addEventListener('change',function(e){st.sigungu=e.target.value;shown=60;render();});
document.getElementById('pCat').addEventListener('change',function(e){st.cat=e.target.value;shown=60;render();});
document.getElementById('pKw').addEventListener('input',function(e){st.kw=e.target.value.trim();shown=60;render();});
document.getElementById('pReset').addEventListener('click',function(){st={sido:'',sigungu:'',cat:'',kw:''};shown=60;document.getElementById('pSido').value='';document.getElementById('pCat').value='';document.getElementById('pKw').value='';fillSg();render();});
document.getElementById('pMore').addEventListener('click',function(){shown+=60;render();});
document.getElementById('pGrid').addEventListener('click',function(e){var c=e.target.closest('.card');if(!c||!window.openPlaceModal)return;e.preventDefault();var p=byId[c.getAttribute('data-id')];if(p)openPet(p);});
document.getElementById('pCount').textContent='불러오는 중…';
fetch('/pet/data.json').then(function(r){return r.json();}).then(function(data){P=data;byId={};P.forEach(function(p){byId[p.id]=p;});fillSg();render();}).catch(function(){document.getElementById('pCount').textContent='데이터를 불러오지 못했습니다. 새로고침 해주세요.';});
})();
</script>`;
writePage('pet', layout('반려견 동반 여행지 — 전국 반려동물 동반 관광지·맛집·숙소 | ' + SITE_NAME, '반려동물 동반 가능한 전국 관광지·음식점·숙박·레포츠를 지역별로. 공공데이터 기반 ' + apiPets.length + '곳. 강아지와 함께 갈 곳 찾기.', '/pet/', petContent));
fs.writeFileSync(path.join(ROOT, 'pet', 'data.json'), JSON.stringify(apiPets));

// ---------- 영문판 /en/ (EngService2) ----------
if (apiFestsEn.length) {
  const EN_ORDER = ['Seoul','Gyeonggi','Incheon','Gangwon','Chungbuk','Chungnam','Daejeon','Sejong','Jeonbuk','Jeonnam','Gwangju','Gyeongbuk','Gyeongnam','Daegu','Ulsan','Busan','Jeju'];
  const enRegions = EN_ORDER.filter(r => apiFestsEn.some(f => f.region === r));
  const enRegOpts = enRegions.map(r => `<option value="${r}">${r} (${apiFestsEn.filter(f => f.region === r).length})</option>`).join('');
  const enStyle = `<style>
.srchbar{background:#fff;border-radius:16px;padding:16px 18px;box-shadow:0 3px 14px rgba(31,41,55,.07);margin:14px 0 6px}
.srchbar .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.srchbar select,.srchbar input{padding:10px 13px;border:1.5px solid #dcefeb;border-radius:12px;font-size:.93rem;font-family:inherit;background:#f4faf8;color:#374151}
.srchbar input#fKw{flex:1;min-width:150px}
.srchbar .q{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
.srchbar .q button{border:1.5px solid #a9e5dd;background:#fff;color:#0c7d72;border-radius:20px;padding:8px 16px;font-size:.87rem;font-weight:800;cursor:pointer;font-family:inherit}
.srchbar .q button.on{background:linear-gradient(135deg,#0f9d8f,#2dd4bf);color:#fff;border-color:transparent}
#fReset{background:#f3f4f6;color:#374151;border:none;cursor:pointer;font-weight:700}
.srch-count{margin:16px 0 12px;font-weight:800;color:#0a6c63;font-size:1.02rem}
.page-h1{font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:6px 0}.page-sub{color:#6b7280;font-size:.95rem;margin-bottom:6px}
.fmodal{display:none;position:fixed;inset:0;z-index:100;background:rgba(17,24,39,.55);align-items:center;justify-content:center;padding:18px}.fmodal.show{display:flex}
.fmbox{background:#fff;border-radius:18px;max-width:560px;width:100%;max-height:86vh;overflow:auto;padding:22px;position:relative;box-shadow:0 20px 50px rgba(0,0,0,.3)}
.fmx{position:absolute;top:12px;right:12px;border:none;background:#f3f4f6;width:34px;height:34px;border-radius:50%;font-size:1rem;cursor:pointer;color:#374151}
.fm-img{width:100%;max-height:240px;object-fit:cover;border-radius:12px;margin-bottom:14px}
.fmbox h3{font-size:1.3rem;font-weight:900;letter-spacing:-.02em;margin:2px 40px 6px 0}
#fm-meta{color:#0a6c63;font-weight:700;font-size:.92rem;margin-bottom:12px}#fm-ov{color:#374151;font-size:.95rem;line-height:1.65}
.fm-links{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.fm-links a{flex:1;min-width:140px;text-align:center;padding:12px;border-radius:12px;font-weight:800;font-size:.95rem}
#fm-hp{background:#0f9d8f;color:#fff}#fm-naver{background:#f3f4f6;color:#374151;border:1.5px solid #dcefeb}
</style>`;
  const enSearch = `<main><div class="wrap">
${enStyle}
<h1 class="page-h1">Korea Festival Finder</h1>
<p class="page-sub">Search ${apiFestsEn.length} festivals across South Korea by date and region — official data from the Korea Tourism Organization.</p>
<div class="srchbar"><div class="row">
<select id="fSido"><option value="">All regions</option>${enRegOpts}</select>
<input type="text" id="fKw" placeholder="Search by name or place">
<button id="fReset" class="q" style="border:none">Reset</button>
</div>
<div class="q" id="fQuick">
<button data-q="all" class="on">All</button>
<button data-q="now">Ongoing</button>
<button data-q="weekend">This weekend</button>
<button data-q="month">This month</button>
<button data-q="past">Include past</button>
</div></div>
<div class="srch-count" id="fCount"></div>
<div class="grid" id="fGrid"></div>
<p class="note">Data: Korea Tourism Organization (TourAPI). Schedules may change — please check the official site. Tap a card for the overview, official website, and a Google search.</p>
<div id="fmodal" class="fmodal"><div class="fmbox">
<button class="fmx" id="fmx" aria-label="close">✕</button>
<img id="fm-img" class="fm-img" alt="">
<h3 id="fm-title"></h3><p id="fm-meta"></p><p id="fm-ov"></p>
<div class="fm-links"><a id="fm-hp" target="_blank" rel="noopener">🏛️ Official website</a><a id="fm-naver" target="_blank" rel="noopener">🔎 Search on Google</a></div>
</div></div>
</div></main>
<script>
(function(){
var F=[],byId={};var st={region:'',kw:'',quick:'all'};
function td(){var d=new Date();d.setHours(0,0,0,0);return d;}
function toD(y){return new Date(+y.slice(0,4),+y.slice(4,6)-1,+y.slice(6,8));}
function ov(f,a,b){var s=toD(f.start),e=toD(f.end);return s<=b&&e>=a;}
function fy(y){return y?y.slice(0,4)+'.'+(+y.slice(4,6))+'.'+(+y.slice(6,8)):'';}
function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function dday(f){var t=td(),s=toD(f.start),e=toD(f.end);if(e<t)return{l:'Ended',c:'off'};if(s<=t)return{l:'Ongoing',c:'on'};return{l:'D-'+Math.round((s-t)/86400000),c:'on'};}
function ranges(){var t=td(),w=t.getDay();var sat=new Date(t);sat.setDate(t.getDate()+((6-w+7)%7));var sun=new Date(sat);sun.setDate(sat.getDate()+1);var m0=new Date(t.getFullYear(),t.getMonth(),1),m1=new Date(t.getFullYear(),t.getMonth()+1,0);return{t:t,sat:sat,sun:sun,m0:m0,m1:m1};}
function card(f){var d=dday(f),img=f.img||'/img/cat-culture.webp';return '<div class="card" data-id="'+esc(f.id)+'" style="cursor:pointer"><div class="thumb"><img loading="lazy" src="'+esc(img)+'" alt="'+esc(f.title)+'" onerror="this.src=&#39;/img/cat-culture.webp&#39;"><span class="dday '+d.c+'">'+d.l+'</span>'+(f.region?'<span class="cat">'+esc(f.region)+'</span>':'')+'</div><div class="card-body"><h3>'+esc(f.title)+'</h3><div class="date">'+fy(f.start)+' ~ '+fy(f.end)+'</div><div class="loc">'+esc(f.region)+'</div></div></div>';}
function apply(){var r=ranges();var list=F.filter(function(f){if(st.quick!=='past'&&toD(f.end)<r.t)return false;if(st.region&&f.region!==st.region)return false;if(st.kw){var k=st.kw.toLowerCase();if((f.title||'').toLowerCase().indexOf(k)<0&&(f.addr||'').toLowerCase().indexOf(k)<0)return false;}if(st.quick==='now'&&!ov(f,r.t,r.t))return false;if(st.quick==='weekend'&&!ov(f,r.sat,r.sun))return false;if(st.quick==='month'&&!ov(f,r.m0,r.m1))return false;return true;});list.sort(function(a,b){return (a.start||'').localeCompare(b.start||'');});document.getElementById('fCount').textContent=list.length+' festivals';document.getElementById('fGrid').innerHTML=list.length?list.map(card).join(''):'<p style="grid-column:1/-1;color:#6b7280;padding:24px 0">No festivals match. Try other filters.</p>';}
function openModal(f){var m=document.getElementById('fmodal');var img=document.getElementById('fm-img');if(f.img){img.src=f.img;img.style.display='block';}else{img.style.display='none';}document.getElementById('fm-title').textContent=f.title;document.getElementById('fm-meta').textContent=fy(f.start)+' ~ '+fy(f.end)+'  ·  '+(f.region||'')+(f.tel?'  ·  '+f.tel:'');document.getElementById('fm-ov').textContent=f.ov||'Overview coming soon. Please check the official website or Google.';var hp=document.getElementById('fm-hp');if(f.hp){hp.href=(f.hp.indexOf('http')===0?f.hp:'http://'+f.hp);hp.style.display='inline-block';}else{hp.style.display='none';}document.getElementById('fm-naver').href='https://www.google.com/search?q='+encodeURIComponent(f.title+' Korea festival');m.classList.add('show');}
function closeModal(){document.getElementById('fmodal').classList.remove('show');}
document.getElementById('fSido').addEventListener('change',function(e){st.region=e.target.value;apply();});
document.getElementById('fKw').addEventListener('input',function(e){st.kw=e.target.value.trim();apply();});
document.getElementById('fReset').addEventListener('click',function(){st={region:'',kw:'',quick:'all'};document.getElementById('fSido').value='';document.getElementById('fKw').value='';var bs=document.querySelectorAll('#fQuick button');for(var i=0;i<bs.length;i++)bs[i].classList.toggle('on',bs[i].getAttribute('data-q')==='all');apply();});
var qbs=document.querySelectorAll('#fQuick button');for(var i=0;i<qbs.length;i++){qbs[i].addEventListener('click',function(){st.quick=this.getAttribute('data-q');for(var j=0;j<qbs.length;j++)qbs[j].classList.remove('on');this.classList.add('on');apply();});}
document.getElementById('fmx').addEventListener('click',closeModal);
document.getElementById('fmodal').addEventListener('click',function(e){if(e.target.id==='fmodal')closeModal();});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal();});
document.getElementById('fGrid').addEventListener('click',function(e){var c=e.target.closest('.card');if(!c)return;var f=byId[c.getAttribute('data-id')];if(f)openModal(f);});
document.getElementById('fCount').textContent='Loading...';
fetch('/en/search/data.json').then(function(r){return r.json();}).then(function(data){F=data;byId={};F.forEach(function(f){byId[f.id]=f;});apply();}).catch(function(){document.getElementById('fCount').textContent='Failed to load data.';});
})();
</script>`;
  writePage('en/search', layout('Korea Festival Finder — Search Korean Festivals by Date & Region | Chukjemoa', 'Find festivals across South Korea by date and region. ' + apiFestsEn.length + ' festivals with official overviews from the Korea Tourism Organization.', '/en/search/', enSearch, { lang:'en', alternates: searchAlts() }));
  fs.writeFileSync(path.join(ROOT, 'en', 'search', 'data.json'), JSON.stringify(apiFestsEn));

  const enHome = `<main><div class="wrap">
<div class="hero" style="background:linear-gradient(135deg,#0f9d8f,#2dd4bf);border-radius:18px;overflow:hidden;margin:14px 0">
<div class="hero-inner" style="background:rgba(15,60,55,.18);padding:64px 20px">
<h1>Korea Festivals &amp; Traditional Markets</h1>
<p>Search festivals across South Korea by date and region — official data from the Korea Tourism Organization.</p>
<div class="hero-cta"><a class="cta1" href="/en/search/">Browse all festivals →</a></div>
</div></div>
<h2 class="sec">Plan your trip around Korea's festivals</h2>
<p style="color:#4b5563;line-height:1.75;margin-bottom:14px">South Korea hosts hundreds of festivals every year — summer mud and water festivals, autumn fireworks and fall-foliage events, and winter ice and light festivals. Chukjemoa lets you search ${apiFestsEn.length}+ festivals by date and region, read an official overview, and jump straight to each festival's official website. All schedules and descriptions come from the Korea Tourism Organization (TourAPI).</p>
<div style="text-align:center;margin:26px 0"><a href="/en/search/" style="display:inline-block;background:#0f9d8f;color:#fff;padding:14px 30px;border-radius:28px;font-weight:800;text-decoration:none">🔎 Open the Festival Finder</a></div>
</div></main>`;
  writePage('en', layout('Korea Festivals Calendar 2026 — Festivals & Traditional Markets | Chukjemoa', 'Discover festivals and traditional markets across South Korea. Search by date and region with official Korea Tourism Organization data.', '/en/', enHome, { lang:'en', alternates: homeAlts() }));
}

// ---------- 다국어 일/서 /ja/ /es/ (JpnService2 · SpnService2) ----------
function writeLangSite(lang, data, order, L) {
  if (!data.length) return;
  const n = data.length;
  const regions = order.filter(r => data.some(f => f.region === r));
  const regOpts = regions.map(r => `<option value="${r}">${r} (${data.filter(f => f.region === r).length})</option>`).join('');
  const style = `<style>
.srchbar{background:#fff;border-radius:16px;padding:16px 18px;box-shadow:0 3px 14px rgba(31,41,55,.07);margin:14px 0 6px}
.srchbar .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.srchbar select,.srchbar input{padding:10px 13px;border:1.5px solid #dcefeb;border-radius:12px;font-size:.93rem;font-family:inherit;background:#f4faf8;color:#374151}
.srchbar input#fKw{flex:1;min-width:150px}
.srchbar .q{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}
.srchbar .q button{border:1.5px solid #a9e5dd;background:#fff;color:#0c7d72;border-radius:20px;padding:8px 16px;font-size:.87rem;font-weight:800;cursor:pointer;font-family:inherit}
.srchbar .q button.on{background:linear-gradient(135deg,#0f9d8f,#2dd4bf);color:#fff;border-color:transparent}
#fReset{background:#f3f4f6;color:#374151;border:none;cursor:pointer;font-weight:700}
.srch-count{margin:16px 0 12px;font-weight:800;color:#0a6c63;font-size:1.02rem}
.page-h1{font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:6px 0}.page-sub{color:#6b7280;font-size:.95rem;margin-bottom:6px}
.fmodal{display:none;position:fixed;inset:0;z-index:100;background:rgba(17,24,39,.55);align-items:center;justify-content:center;padding:18px}.fmodal.show{display:flex}
.fmbox{background:#fff;border-radius:18px;max-width:560px;width:100%;max-height:86vh;overflow:auto;padding:22px;position:relative;box-shadow:0 20px 50px rgba(0,0,0,.3)}
.fmx{position:absolute;top:12px;right:12px;border:none;background:#f3f4f6;width:34px;height:34px;border-radius:50%;font-size:1rem;cursor:pointer;color:#374151}
.fm-img{width:100%;max-height:240px;object-fit:cover;border-radius:12px;margin-bottom:14px}
.fmbox h3{font-size:1.3rem;font-weight:900;letter-spacing:-.02em;margin:2px 40px 6px 0}
#fm-meta{color:#0a6c63;font-weight:700;font-size:.92rem;margin-bottom:12px}#fm-ov{color:#374151;font-size:.95rem;line-height:1.65}
.fm-links{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.fm-links a{flex:1;min-width:140px;text-align:center;padding:12px;border-radius:12px;font-weight:800;font-size:.95rem}
#fm-hp{background:#0f9d8f;color:#fff}#fm-naver{background:#f3f4f6;color:#374151;border:1.5px solid #dcefeb}
</style>`;
  const searchContent = `<main><div class="wrap">
${style}
<h1 class="page-h1">${L.h1}</h1>
<p class="page-sub">${L.sub}</p>
<div class="srchbar"><div class="row">
<select id="fSido"><option value="">${L.allRegions}</option>${regOpts}</select>
<input type="text" id="fKw" placeholder="${L.kwPh}">
<button id="fReset" class="q" style="border:none">${L.reset}</button>
</div>
<div class="q" id="fQuick">
<button data-q="all" class="on">${L.q.all}</button>
<button data-q="now">${L.q.now}</button>
<button data-q="weekend">${L.q.weekend}</button>
<button data-q="month">${L.q.month}</button>
<button data-q="past">${L.q.past}</button>
</div></div>
<div class="srch-count" id="fCount"></div>
<div class="grid" id="fGrid"></div>
<p class="note">${L.note}</p>
<div id="fmodal" class="fmodal"><div class="fmbox">
<button class="fmx" id="fmx" aria-label="close">✕</button>
<img id="fm-img" class="fm-img" alt="">
<h3 id="fm-title"></h3><p id="fm-meta"></p><p id="fm-ov"></p>
<div class="fm-links"><a id="fm-hp" target="_blank" rel="noopener">${L.official}</a><a id="fm-naver" target="_blank" rel="noopener">${L.google}</a></div>
</div></div>
</div></main>
<script>
(function(){
var LBL=${JSON.stringify(L.client)};
var F=[],byId={};var st={region:'',kw:'',quick:'all'};
function td(){var d=new Date();d.setHours(0,0,0,0);return d;}
function toD(y){return new Date(+y.slice(0,4),+y.slice(4,6)-1,+y.slice(6,8));}
function ov(f,a,b){var s=toD(f.start),e=toD(f.end);return s<=b&&e>=a;}
function fy(y){return y?y.slice(0,4)+'.'+(+y.slice(4,6))+'.'+(+y.slice(6,8)):'';}
function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function dday(f){var t=td(),s=toD(f.start),e=toD(f.end);if(e<t)return{l:LBL.ended,c:'off'};if(s<=t)return{l:LBL.ongoing,c:'on'};return{l:LBL.dpre+Math.round((s-t)/86400000)+LBL.dpost,c:'on'};}
function ranges(){var t=td(),w=t.getDay();var sat=new Date(t);sat.setDate(t.getDate()+((6-w+7)%7));var sun=new Date(sat);sun.setDate(sat.getDate()+1);var m0=new Date(t.getFullYear(),t.getMonth(),1),m1=new Date(t.getFullYear(),t.getMonth()+1,0);return{t:t,sat:sat,sun:sun,m0:m0,m1:m1};}
function card(f){var d=dday(f),img=f.img||'/img/cat-culture.webp';return '<div class="card" data-id="'+esc(f.id)+'" style="cursor:pointer"><div class="thumb"><img loading="lazy" src="'+esc(img)+'" alt="'+esc(f.title)+'" onerror="this.src=&#39;/img/cat-culture.webp&#39;"><span class="dday '+d.c+'">'+d.l+'</span>'+(f.region?'<span class="cat">'+esc(f.region)+'</span>':'')+'</div><div class="card-body"><h3>'+esc(f.title)+'</h3><div class="date">'+fy(f.start)+' ~ '+fy(f.end)+'</div><div class="loc">'+esc(f.region)+'</div></div></div>';}
function apply(){var r=ranges();var list=F.filter(function(f){if(st.quick!=='past'&&toD(f.end)<r.t)return false;if(st.region&&f.region!==st.region)return false;if(st.kw){var k=st.kw.toLowerCase();if((f.title||'').toLowerCase().indexOf(k)<0&&(f.addr||'').toLowerCase().indexOf(k)<0)return false;}if(st.quick==='now'&&!ov(f,r.t,r.t))return false;if(st.quick==='weekend'&&!ov(f,r.sat,r.sun))return false;if(st.quick==='month'&&!ov(f,r.m0,r.m1))return false;return true;});list.sort(function(a,b){return (a.start||'').localeCompare(b.start||'');});document.getElementById('fCount').textContent=LBL.count.replace('%d',list.length);document.getElementById('fGrid').innerHTML=list.length?list.map(card).join(''):'<p style="grid-column:1/-1;color:#6b7280;padding:24px 0">'+LBL.noMatch+'</p>';}
function openModal(f){var m=document.getElementById('fmodal');var img=document.getElementById('fm-img');if(f.img){img.src=f.img;img.style.display='block';}else{img.style.display='none';}document.getElementById('fm-title').textContent=f.title;document.getElementById('fm-meta').textContent=fy(f.start)+' ~ '+fy(f.end)+'  ·  '+(f.region||'')+(f.tel?'  ·  '+f.tel:'');document.getElementById('fm-ov').textContent=f.ov||LBL.modalFallback;var hp=document.getElementById('fm-hp');if(f.hp){hp.href=(f.hp.indexOf('http')===0?f.hp:'http://'+f.hp);hp.style.display='inline-block';}else{hp.style.display='none';}document.getElementById('fm-naver').href='https://www.google.com/search?q='+encodeURIComponent(f.title+LBL.googleSuffix);m.classList.add('show');}
function closeModal(){document.getElementById('fmodal').classList.remove('show');}
document.getElementById('fSido').addEventListener('change',function(e){st.region=e.target.value;apply();});
document.getElementById('fKw').addEventListener('input',function(e){st.kw=e.target.value.trim();apply();});
document.getElementById('fReset').addEventListener('click',function(){st={region:'',kw:'',quick:'all'};document.getElementById('fSido').value='';document.getElementById('fKw').value='';var bs=document.querySelectorAll('#fQuick button');for(var i=0;i<bs.length;i++)bs[i].classList.toggle('on',bs[i].getAttribute('data-q')==='all');apply();});
var qbs=document.querySelectorAll('#fQuick button');for(var i=0;i<qbs.length;i++){qbs[i].addEventListener('click',function(){st.quick=this.getAttribute('data-q');for(var j=0;j<qbs.length;j++)qbs[j].classList.remove('on');this.classList.add('on');apply();});}
document.getElementById('fmx').addEventListener('click',closeModal);
document.getElementById('fmodal').addEventListener('click',function(e){if(e.target.id==='fmodal')closeModal();});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal();});
document.getElementById('fGrid').addEventListener('click',function(e){var c=e.target.closest('.card');if(!c)return;var f=byId[c.getAttribute('data-id')];if(f)openModal(f);});
document.getElementById('fCount').textContent=LBL.loading;
fetch('/${lang}/search/data.json').then(function(r){return r.json();}).then(function(data){F=data;byId={};F.forEach(function(f){byId[f.id]=f;});apply();}).catch(function(){document.getElementById('fCount').textContent=LBL.fail;});
})();
</script>`;
  writePage(lang + '/search', layout(L.metaTitleSearch, L.metaDescSearch, '/' + lang + '/search/', searchContent, { lang, alternates: searchAlts() }));
  fs.writeFileSync(path.join(ROOT, lang, 'search', 'data.json'), JSON.stringify(data));

  const home = `<main><div class="wrap">
<div class="hero" style="background:linear-gradient(135deg,#0f9d8f,#2dd4bf);border-radius:18px;overflow:hidden;margin:14px 0">
<div class="hero-inner" style="background:rgba(15,60,55,.18);padding:64px 20px">
<h1>${L.heroH1}</h1>
<p>${L.heroP}</p>
<div class="hero-cta"><a class="cta1" href="/${lang}/search/">${L.heroCta}</a></div>
</div></div>
<h2 class="sec">${L.sec}</h2>
<p style="color:#4b5563;line-height:1.75;margin-bottom:14px">${L.lead}</p>
<div style="text-align:center;margin:26px 0"><a href="/${lang}/search/" style="display:inline-block;background:#0f9d8f;color:#fff;padding:14px 30px;border-radius:28px;font-weight:800;text-decoration:none">${L.ctaBtn}</a></div>
</div></main>`;
  writePage(lang, layout(L.metaTitleHome, L.metaDescHome, '/' + lang + '/', home, { lang, alternates: homeAlts() }));
}

const JA_ORDER = ['ソウル','京畿','仁川','江原','忠北','忠南','大田','世宗','全北','全南','光州','慶北','慶南','大邱','蔚山','釜山','済州'];
const ES_ORDER = ['Seúl','Gyeonggi','Incheon','Gangwon','Chungbuk','Chungnam','Daejeon','Sejong','Jeonbuk','Jeonnam','Gwangju','Gyeongbuk','Gyeongnam','Daegu','Ulsan','Busan','Jeju'];
writeLangSite('ja', apiFestsJa, JA_ORDER, {
  h1: '韓国お祭り検索',
  sub: `韓国全国のお祭り${apiFestsJa.length}件を日付・地域で検索 — 韓国観光公社の公式データ。`,
  allRegions: 'すべての地域', kwPh: '名前・場所で検索', reset: 'リセット',
  q: { all: 'すべて', now: '開催中', weekend: '今週末', month: '今月', past: '過去も表示' },
  note: 'データ：韓国観光公社（TourAPI）。日程は変更される場合があります。公式サイトをご確認ください。カードをタップすると概要・公式サイト・Google検索が開きます。',
  official: '🏛️ 公式サイト', google: '🔎 Googleで検索',
  metaTitleSearch: '韓国お祭り検索 — 日付・地域で韓国の祭りを探す | Chukjemoa',
  metaDescSearch: `韓国全国のお祭り${apiFestsJa.length}件を日付・地域で検索。韓国観光公社の公式概要つき。`,
  heroH1: '韓国のお祭り・伝統市場',
  heroP: '韓国全国のお祭りを日付・地域で検索 — 韓国観光公社の公式データ。',
  heroCta: 'すべてのお祭りを見る →', sec: '韓国のお祭りを中心に旅を計画',
  lead: `韓国では毎年数百のお祭りが開催されます — 夏のマッド・水祭り、秋の花火や紅葉イベント、冬の氷・光の祭りなど。Chukjemoaなら${apiFestsJa.length}件以上のお祭りを日付・地域で検索し、公式概要を読んで、各お祭りの公式サイトへ直接アクセスできます。日程と説明はすべて韓国観光公社（TourAPI）提供です。`,
  ctaBtn: '🔎 お祭り検索を開く',
  metaTitleHome: '韓国お祭りカレンダー2026 — 祭り・伝統市場ガイド | Chukjemoa',
  metaDescHome: '韓国全国のお祭り・伝統市場を日付・地域で検索。韓国観光公社の公式データを使用。',
  client: { count: '%d件のお祭り', loading: '読み込み中...', fail: 'データを読み込めませんでした。', noMatch: '該当するお祭りがありません。条件を変えてみてください。', modalFallback: '概要は準備中です。公式サイトまたはGoogleでご確認ください。', ended: '終了', ongoing: '開催中', dpre: 'あと', dpost: '日', googleSuffix: ' 韓国 祭り' }
});
writeLangSite('es', apiFestsEs, ES_ORDER, {
  h1: 'Buscador de Festivales de Corea',
  sub: `Busca ${apiFestsEs.length} festivales por toda Corea del Sur por fecha y región — datos oficiales de la Organización de Turismo de Corea.`,
  allRegions: 'Todas las regiones', kwPh: 'Buscar por nombre o lugar', reset: 'Restablecer',
  q: { all: 'Todos', now: 'En curso', weekend: 'Este fin de semana', month: 'Este mes', past: 'Incluir pasados' },
  note: 'Datos: Organización de Turismo de Corea (TourAPI). Los horarios pueden cambiar — consulte el sitio oficial. Toque una tarjeta para ver el resumen, el sitio oficial y una búsqueda en Google.',
  official: '🏛️ Sitio oficial', google: '🔎 Buscar en Google',
  metaTitleSearch: 'Buscador de Festivales de Corea — Busca por Fecha y Región | Chukjemoa',
  metaDescSearch: `Encuentra festivales por toda Corea del Sur por fecha y región. ${apiFestsEs.length} festivales con resúmenes oficiales de la Organización de Turismo de Corea.`,
  heroH1: 'Festivales y Mercados Tradicionales de Corea',
  heroP: 'Busca festivales por toda Corea del Sur por fecha y región — datos oficiales de la Organización de Turismo de Corea.',
  heroCta: 'Ver todos los festivales →', sec: 'Planifica tu viaje en torno a los festivales de Corea',
  lead: `Corea del Sur celebra cientos de festivales cada año — festivales de barro y agua en verano, fuegos artificiales y follaje en otoño, y festivales de hielo y luces en invierno. Chukjemoa te permite buscar más de ${apiFestsEs.length} festivales por fecha y región, leer un resumen oficial y acceder directamente al sitio oficial de cada festival. Todos los horarios y descripciones provienen de la Organización de Turismo de Corea (TourAPI).`,
  ctaBtn: '🔎 Abrir el buscador de festivales',
  metaTitleHome: 'Calendario de Festivales de Corea 2026 — Festivales y Mercados | Chukjemoa',
  metaDescHome: 'Descubre festivales y mercados tradicionales por toda Corea del Sur. Busca por fecha y región con datos oficiales de la Organización de Turismo de Corea.',
  client: { count: '%d festivales', loading: 'Cargando...', fail: 'No se pudieron cargar los datos.', noMatch: 'Ningún festival coincide. Prueba otros filtros.', modalFallback: 'Resumen próximamente. Consulte el sitio oficial o Google.', ended: 'Finalizado', ongoing: 'En curso', dpre: 'faltan ', dpost: 'd', googleSuffix: ' festival Corea' }
});
const ZH_ORDER = ['首尔','京畿','仁川','江原','忠北','忠南','大田','世宗','全北','全南','光州','庆北','庆南','大邱','蔚山','釜山','济州'];
writeLangSite('zh', apiFestsZh, ZH_ORDER, {
  h1: '韩国庆典搜索',
  sub: `按日期和地区搜索韩国全国的庆典活动，共${apiFestsZh.length}个 — 韩国观光公社官方数据。`,
  allRegions: '所有地区', kwPh: '按名称或地点搜索', reset: '重置',
  q: { all: '全部', now: '进行中', weekend: '本周末', month: '本月', past: '含往期' },
  note: '数据：韩国观光公社（TourAPI）。日程可能变动，出行前请确认官方网站。点击卡片可查看简介、官方网站和谷歌搜索。',
  official: '🏛️ 官方网站', google: '🔎 谷歌搜索',
  metaTitleSearch: '韩国庆典搜索 — 按日期和地区查找韩国庆典 | Chukjemoa',
  metaDescSearch: `按日期和地区搜索韩国全国庆典活动，共${apiFestsZh.length}个，附韩国观光公社官方简介。`,
  heroH1: '韩国庆典·传统市场',
  heroP: '按日期和地区搜索韩国全国的庆典活动 — 韩国观光公社官方数据。',
  heroCta: '浏览所有庆典 →', sec: '围绕韩国庆典规划你的旅程',
  lead: `韩国每年举办数百场庆典 — 夏季的泥浆节和水上庆典，秋季的烟花和红叶活动，冬季的冰雪和灯光节。通过Chukjemoa，你可以按日期和地区搜索${apiFestsZh.length}多个庆典，阅读官方简介，并直接访问每个庆典的官方网站。所有日程和介绍均来自韩国观光公社（TourAPI）。`,
  ctaBtn: '🔎 打开庆典搜索',
  metaTitleHome: '韩国庆典日历2026 — 庆典·传统市场指南 | Chukjemoa',
  metaDescHome: '按日期和地区搜索韩国全国的庆典和传统市场，采用韩国观光公社官方数据。',
  client: { count: '%d个庆典', loading: '加载中...', fail: '数据加载失败。', noMatch: '没有符合条件的庆典，请尝试其他筛选。', modalFallback: '简介即将上线，请查看官方网站或谷歌。', ended: '已结束', ongoing: '进行中', dpre: '还有', dpost: '天', googleSuffix: ' 韩国 庆典' }
});

// ---------- 무장애 여행 /accessible/ (KorWithService2) ----------
if (apiAccessible.length) {
  const accSidos = SIDO_ORDER.filter(s => apiAccessible.some(p => p.sido === s));
  const accSidoOpts = accSidos.map(s => `<option value="${s}">${s} (${apiAccessible.filter(p => p.sido === s).length})</option>`).join('');
  const accCats = ['관광지','문화시설','음식점','숙박','레포츠','쇼핑'];
  const accCatOpts = accCats.filter(c => apiAccessible.some(p => p.cat === c)).map(c => `<option value="${c}">${c}</option>`).join('');
  const ACC_FILTERS = ['휠체어','장애인주차','장애인화장실','엘리베이터','유아·수유','시각약자','청각약자'];
  const accContent = `<main><div class="wrap">
<style>
.srchbar{background:#fff;border-radius:16px;padding:16px 18px;box-shadow:0 3px 14px rgba(31,41,55,.07);margin:14px 0 6px}
.srchbar .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.srchbar select,.srchbar input{padding:10px 13px;border:1.5px solid #dcefeb;border-radius:12px;font-size:.93rem;font-family:inherit;background:#f4faf8;color:#374151}
.srchbar input#aKw{flex:1;min-width:150px}
.srch-count{margin:16px 0 12px;font-weight:800;color:#0a6c63;font-size:1.02rem}
.page-h1{font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:6px 0}
.page-sub{color:#6b7280;font-size:.95rem;margin-bottom:6px}
.pmore{background:#fff;border:1.5px solid #a9e5dd;color:#0c7d72;border-radius:22px;padding:11px 26px;font-weight:800;font-size:.95rem;cursor:pointer;font-family:inherit;transition:all .15s}
.pmore:hover{border-color:#0f9d8f;transform:translateY(-1px)}
.card .accrow{margin-top:8px;display:flex;flex-wrap:wrap;gap:5px}
.card .accbadge{font-size:.74rem;font-weight:800;color:#0c7d72;background:#e6f6f3;border-radius:20px;padding:3px 9px}
</style>
<h1 class="page-h1">♿ 무장애 여행지</h1>
<p class="page-sub">공공데이터(한국관광공사 무장애여행) 기반 휠체어·유아차·고령자도 편하게 갈 수 있는 전국 관광지·문화시설·맛집·숙소 ${apiAccessible.length.toLocaleString()}곳 — 접근성 편의시설을 갖춘 곳을 지역·유형별로 찾아보세요.</p>
<div class="srchbar"><div class="row">
<select id="aSido"><option value="">전체 지역</option>${accSidoOpts}</select>
<select id="aSigungu"><option value="">전체 시·군·구</option></select>
<select id="aCat"><option value="">전체 유형</option>${accCatOpts}</select>
<select id="aAcc"><option value="">모든 편의시설</option>${ACC_FILTERS.map(x => `<option value="${x}">${x} 있는 곳</option>`).join('')}</select>
<input type="text" id="aKw" placeholder="장소명·주소 검색">
<button id="aReset" class="pmore" style="border-color:#f0e6dc;color:#374151">초기화</button>
</div></div>
<div class="srch-count" id="aCount"></div>
<div class="grid" id="aGrid"></div>
<div style="text-align:center;margin:22px 0"><button id="aMore" class="pmore" style="display:none">더 보기</button></div>
<p class="note">데이터 출처: 한국관광공사 무장애여행 서비스(공공데이터포털). 편의시설 정보는 순차적으로 채워지고 있으며, 방문 전 각 시설에 접근성을 꼭 확인하세요. 카드를 누르면 상세정보와 지도·검색 링크가 표시됩니다.</p>
</div></main>
<script>
(function(){
var A=[];var byId={};var st={sido:'',sigungu:'',cat:'',acc:'',kw:''};var shown=60;
var CE={'관광지':'🏞️','문화시설':'🎭','음식점':'🍴','숙박':'🏨','레포츠':'🚵','쇼핑':'🛍️','기타':'📍'};
function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function card(p){var loc=(p.sido||'')+(p.sigungu?' '+p.sigungu:'');var q=encodeURIComponent(p.title);var img=p.img||'/img/hero.webp';var acc=(p.acc&&p.acc.length)?'<div class="accrow">'+p.acc.map(function(a){return '<span class="accbadge">♿ '+esc(a)+'</span>';}).join('')+'</div>':'';return '<a class="card" data-id="'+esc(p.id)+'" style="cursor:pointer" href="https://search.naver.com/search.naver?query='+q+'"><div class="thumb"><img loading="lazy" src="'+esc(img)+'" alt="'+esc(p.title)+'" onerror="this.src=&#39;/img/hero.webp&#39;"><span class="cat">'+(CE[p.cat]||'')+' '+esc(p.cat)+'</span></div><div class="card-body"><h3>'+esc(p.title)+'</h3><div class="loc">'+esc(loc)+'</div>'+acc+'</div></a>';}
function openAcc(p){if(!window.openPlaceModal){window.open('https://search.naver.com/search.naver?query='+encodeURIComponent(p.title),'_blank','noopener');return;}var loc=(p.sido||'')+(p.sigungu?' '+p.sigungu:'');var body=(p.acc&&p.acc.length)?'<div style="font-weight:800;color:#0a6c63;margin:6px 0 8px">♿ 무장애 편의시설</div><div class="accrow">'+p.acc.map(function(a){return '<span class="accbadge">♿ '+esc(a)+'</span>';}).join('')+'</div>':'<div style="color:#6b7280;font-size:.9rem">편의시설 정보는 순차적으로 채워지고 있어요. 방문 전 접근성을 꼭 확인하세요.</div>';window.openPlaceModal({img:p.img,title:p.title,meta:[(CE[p.cat]||'')+' '+p.cat,loc,p.tel].filter(Boolean).join('  ·  '),body:body,naver:'https://search.naver.com/search.naver?query='+encodeURIComponent(p.title),map:'https://map.naver.com/p/search/'+encodeURIComponent(p.title)});}
function filtered(){return A.filter(function(p){if(st.sido&&p.sido!==st.sido)return false;if(st.sigungu&&p.sigungu!==st.sigungu)return false;if(st.cat&&p.cat!==st.cat)return false;if(st.acc&&!(p.acc&&p.acc.indexOf(st.acc)>=0))return false;if(st.kw){var k=st.kw.toLowerCase();if((p.title||'').toLowerCase().indexOf(k)<0&&(p.addr||'').indexOf(st.kw)<0)return false;}return true;});}
function render(){var list=filtered();document.getElementById('aCount').textContent='총 '+list.length.toLocaleString()+'곳';var g=document.getElementById('aGrid');g.innerHTML=list.length?list.slice(0,shown).map(card).join(''):'<p style="grid-column:1/-1;color:#6b7280;padding:24px 0">조건에 맞는 곳이 없어요. 지역·유형·편의시설을 바꿔보세요.</p>';document.getElementById('aMore').style.display=list.length>shown?'inline-block':'none';}
function fillSg(){var set={};A.forEach(function(p){if((!st.sido||p.sido===st.sido)&&p.sigungu)set[p.sigungu]=1;});var arr=Object.keys(set).sort();document.getElementById('aSigungu').innerHTML='<option value="">전체 시·군·구</option>'+arr.map(function(s){return '<option value="'+s+'">'+s+'</option>';}).join('');}
document.getElementById('aSido').addEventListener('change',function(e){st.sido=e.target.value;st.sigungu='';shown=60;fillSg();render();});
document.getElementById('aSigungu').addEventListener('change',function(e){st.sigungu=e.target.value;shown=60;render();});
document.getElementById('aCat').addEventListener('change',function(e){st.cat=e.target.value;shown=60;render();});
document.getElementById('aAcc').addEventListener('change',function(e){st.acc=e.target.value;shown=60;render();});
document.getElementById('aKw').addEventListener('input',function(e){st.kw=e.target.value.trim();shown=60;render();});
document.getElementById('aReset').addEventListener('click',function(){st={sido:'',sigungu:'',cat:'',acc:'',kw:''};shown=60;document.getElementById('aSido').value='';document.getElementById('aCat').value='';document.getElementById('aAcc').value='';document.getElementById('aKw').value='';fillSg();render();});
document.getElementById('aMore').addEventListener('click',function(){shown+=60;render();});
document.getElementById('aGrid').addEventListener('click',function(e){var c=e.target.closest('.card');if(!c||!window.openPlaceModal)return;e.preventDefault();var p=byId[c.getAttribute('data-id')];if(p)openAcc(p);});
document.getElementById('aCount').textContent='불러오는 중…';
fetch('/accessible/data.json').then(function(r){return r.json();}).then(function(data){A=data;byId={};A.forEach(function(p){byId[p.id]=p;});fillSg();render();}).catch(function(){document.getElementById('aCount').textContent='데이터를 불러오지 못했습니다. 새로고침 해주세요.';});
})();
</script>`;
  writePage('accessible', layout('무장애 여행지 — 휠체어·유아차·고령자 접근 가능 관광지 | ' + SITE_NAME, '휠체어·유아차·고령자도 편하게 갈 수 있는 전국 무장애 관광지·문화시설·맛집·숙소를 지역별로. 공공데이터 기반 ' + apiAccessible.length.toLocaleString() + '곳.', '/accessible/', accContent));
  fs.writeFileSync(path.join(ROOT, 'accessible', 'data.json'), JSON.stringify(apiAccessible));
}

// ---------- 걷기 여행 /trails/ (두루누비 걷기길) ----------
if (apiTrails.length) {
  const trThemes = [...new Set(apiTrails.map(t => t.theme).filter(Boolean))];
  const trThemeOpts = trThemes.map(t => `<option value="${t}">${t} (${apiTrails.filter(x => x.theme === t).length})</option>`).join('');
  const trSidos = SIDO_ORDER.filter(s => apiTrails.some(t => t.sido === s));
  const trSidoOpts = trSidos.map(s => `<option value="${s}">${s} (${apiTrails.filter(t => t.sido === s).length})</option>`).join('');
  const trLevels = ['쉬움','보통','어려움','매우 어려움'];
  const trLevelOpts = trLevels.filter(l => apiTrails.some(t => t.level === l)).map(l => `<option value="${l}">${l}</option>`).join('');
  const trailContent = `<main><div class="wrap">
<style>
.srchbar{background:#fff;border-radius:16px;padding:16px 18px;box-shadow:0 3px 14px rgba(31,41,55,.07);margin:14px 0 6px}
.srchbar .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.srchbar select,.srchbar input{padding:10px 13px;border:1.5px solid #dcefeb;border-radius:12px;font-size:.93rem;font-family:inherit;background:#f4faf8;color:#374151}
.srchbar input#tKw{flex:1;min-width:150px}
.srch-count{margin:16px 0 12px;font-weight:800;color:#0a6c63;font-size:1.02rem}
.page-h1{font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:6px 0}
.page-sub{color:#6b7280;font-size:.95rem;margin-bottom:6px}
.pmore{background:#fff;border:1.5px solid #a9e5dd;color:#0c7d72;border-radius:22px;padding:11px 26px;font-weight:800;font-size:.95rem;cursor:pointer;font-family:inherit;transition:all .15s}
.pmore:hover{border-color:#0f9d8f;transform:translateY(-1px)}
.trgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.trcard{display:block;background:#fff;border-radius:16px;padding:16px 18px;box-shadow:0 3px 14px rgba(31,41,55,.07);text-decoration:none;color:inherit;transition:all .15s;border:1.5px solid #eef5f3}
.trcard:hover{transform:translateY(-2px);border-color:#a9e5dd;box-shadow:0 6px 20px rgba(15,157,143,.13)}
.trcard .th{display:inline-block;font-size:.74rem;font-weight:800;color:#0c7d72;background:#e6f6f3;border-radius:20px;padding:3px 10px;margin-bottom:8px}
.trcard h3{font-size:1.06rem;font-weight:800;margin:2px 0 6px;letter-spacing:-.01em}
.trcard .meta{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.trcard .chip{font-size:.78rem;font-weight:700;color:#374151;background:#f4faf8;border:1px solid #dcefeb;border-radius:20px;padding:3px 10px}
.trcard .sm{font-size:.86rem;color:#6b7280;line-height:1.5;margin-top:6px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
</style>
<h1 class="page-h1">🥾 걷기 여행 · 전국 걷기길</h1>
<p class="page-sub">공공데이터(두루누비) 기반 전국 걷기여행 코스 ${apiTrails.length}개 — 해파랑길·서해랑길·남파랑길·DMZ 평화의길 등. 거리·난이도·지역으로 나에게 맞는 코스를 찾아보세요.</p>
<div class="srchbar"><div class="row">
<select id="tTheme"><option value="">전체 길</option>${trThemeOpts}</select>
<select id="tSido"><option value="">전체 지역</option>${trSidoOpts}</select>
<select id="tLevel"><option value="">전체 난이도</option>${trLevelOpts}</select>
<input type="text" id="tKw" placeholder="코스명·지역 검색">
<button id="tReset" class="pmore" style="border-color:#f0e6dc;color:#374151">초기화</button>
</div></div>
<div class="srch-count" id="tCount"></div>
<div class="trgrid" id="tGrid"></div>
<div style="text-align:center;margin:22px 0"><button id="tMore" class="pmore" style="display:none">더 보기</button></div>
<p class="note">데이터 출처: 한국관광공사 두루누비 걷기여행 정보. 코스 상황·통제는 방문 전 두루누비(durunubi.kr)에서 확인하세요. 카드를 누르면 상세정보와 지도·검색 링크가 표시됩니다.</p>
</div></main>
<script>
(function(){
var T=[];var byId={};var st={theme:'',sido:'',level:'',kw:''};var shown=60;
var LC={'쉬움':'#15803d','보통':'#0d9488','어려움':'#b45309','매우 어려움':'#b91c1c'};
function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function hrs(m){if(!m)return '';var h=m/60;return h>=1?('약 '+(h%1===0?h:h.toFixed(1))+'시간'):(m+'분');}
function card(t){var chips='';if(t.dist)chips+='<span class="chip">📏 '+t.dist+'km</span>';var hh=hrs(t.min);if(hh)chips+='<span class="chip">⏱ '+hh+'</span>';if(t.level)chips+='<span class="chip" style="color:'+(LC[t.level]||'#374151')+'">🥾 '+esc(t.level)+'</span>';if(t.cycle)chips+='<span class="chip">'+esc(t.cycle)+'</span>';var reg=t.sigun||t.sido||'';return '<a class="trcard" data-id="'+esc(t.id)+'" style="cursor:pointer" href="https://search.naver.com/search.naver?query='+encodeURIComponent(t.name)+'"><span class="th">'+esc(t.theme)+'</span>'+(reg?'<span class="th" style="background:#f4faf8;color:#6b7280;margin-left:6px">📍 '+esc(reg)+'</span>':'')+'<h3>'+esc(t.name)+'</h3><div class="meta">'+chips+'</div><div class="sm">'+esc(t.summary||t.desc||'')+'</div></a>';}
function tchip(x,col){return '<span style="display:inline-block;font-size:.8rem;font-weight:700;color:'+(col||'#374151')+';background:#f4faf8;border:1px solid #dcefeb;border-radius:20px;padding:3px 10px;margin:0 6px 6px 0">'+x+'</span>';}
function openTrail(t){if(!window.openPlaceModal){window.open('https://search.naver.com/search.naver?query='+encodeURIComponent(t.name),'_blank','noopener');return;}var body='<div style="margin:2px 0 10px">';if(t.dist)body+=tchip('📏 '+t.dist+'km');var hh=hrs(t.min);if(hh)body+=tchip('⏱ '+hh);if(t.level)body+=tchip('🥾 '+esc(t.level),LC[t.level]);if(t.cycle)body+=tchip(esc(t.cycle));body+='</div>';var txt=[t.summary,t.desc,t.tour].filter(Boolean).join(' ');if(txt)body+='<div style="color:#374151;font-size:.92rem;line-height:1.6">'+esc(txt)+'</div>';window.openPlaceModal({img:'',title:t.name,meta:[t.theme,(t.sigun||t.sido||'')].filter(Boolean).join('  ·  '),body:body,naver:'https://search.naver.com/search.naver?query='+encodeURIComponent(t.name),map:'https://map.naver.com/p/search/'+encodeURIComponent(t.name)});}
function filtered(){return T.filter(function(t){if(st.theme&&t.theme!==st.theme)return false;if(st.sido&&t.sido!==st.sido)return false;if(st.level&&t.level!==st.level)return false;if(st.kw){var k=st.kw.toLowerCase();if((t.name||'').toLowerCase().indexOf(k)<0&&(t.sigun||'').indexOf(st.kw)<0)return false;}return true;});}
function render(){var list=filtered();document.getElementById('tCount').textContent='총 '+list.length+'개 코스';var g=document.getElementById('tGrid');g.innerHTML=list.length?list.slice(0,shown).map(card).join(''):'<p style="grid-column:1/-1;color:#6b7280;padding:24px 0">조건에 맞는 코스가 없어요. 필터를 바꿔보세요.</p>';document.getElementById('tMore').style.display=list.length>shown?'inline-block':'none';}
document.getElementById('tTheme').addEventListener('change',function(e){st.theme=e.target.value;shown=60;render();});
document.getElementById('tSido').addEventListener('change',function(e){st.sido=e.target.value;shown=60;render();});
document.getElementById('tLevel').addEventListener('change',function(e){st.level=e.target.value;shown=60;render();});
document.getElementById('tKw').addEventListener('input',function(e){st.kw=e.target.value.trim();shown=60;render();});
document.getElementById('tReset').addEventListener('click',function(){st={theme:'',sido:'',level:'',kw:''};shown=60;document.getElementById('tTheme').value='';document.getElementById('tSido').value='';document.getElementById('tLevel').value='';document.getElementById('tKw').value='';render();});
document.getElementById('tMore').addEventListener('click',function(){shown+=60;render();});
document.getElementById('tGrid').addEventListener('click',function(e){var c=e.target.closest('.trcard');if(!c||!window.openPlaceModal)return;e.preventDefault();var t=byId[c.getAttribute('data-id')];if(t)openTrail(t);});
document.getElementById('tCount').textContent='불러오는 중…';
fetch('/trails/data.json').then(function(r){return r.json();}).then(function(data){T=data;byId={};T.forEach(function(t){byId[t.id]=t;});render();}).catch(function(){document.getElementById('tCount').textContent='데이터를 불러오지 못했습니다. 새로고침 해주세요.';});
})();
</script>`;
  writePage('trails', layout('걷기 여행 — 전국 걷기길 코스(해파랑길·서해랑길·남파랑길) | ' + SITE_NAME, '전국 걷기여행 코스를 거리·난이도·지역별로. 두루누비 공공데이터 기반 ' + apiTrails.length + '개 코스 — 해파랑길·서해랑길·남파랑길·DMZ 평화의길.', '/trails/', trailContent));
  fs.writeFileSync(path.join(ROOT, 'trails', 'data.json'), JSON.stringify(apiTrails));
}

// ---------- Phase4: 연휴에 갈 축제 /holiday/ (공휴일 특일정보 + 축제) ----------
if (holidays.length && apiFests.length) {
  const EXCLUDE_HOL = /제헌절|노동절|근로자/;
  const yd = s => { s = String(s).replace(/-/g, ''); return new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)); };
  const fyy = s => { s = String(s).replace(/-/g, ''); return +s.slice(0, 4) + '.' + (+s.slice(4, 6)) + '.' + (+s.slice(6, 8)); };
  const holName = {};
  holidays.forEach(h => { if (!EXCLUDE_HOL.test(h.name)) holName[h.date] = h.name; });
  const isoOf = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const horizon = new Date(today); horizon.setDate(horizon.getDate() + 400);
  // 연휴(연속 휴무일) 블록 계산
  const blocks = [];
  let cur = new Date(today), run = null;
  while (cur <= horizon) {
    const iso = isoOf(cur), dow = cur.getDay();
    const off = dow === 0 || dow === 6 || holName[iso];
    if (off) {
      if (!run) run = { start: new Date(cur), end: new Date(cur), names: [] };
      run.end = new Date(cur);
      if (holName[iso]) run.names.push(holName[iso].replace(/\(.*?\)/g, ''));
      run.hasHol = run.hasHol || !!holName[iso];
    } else if (run) { if (run.hasHol) blocks.push(run); run = null; }
    cur.setDate(cur.getDate() + 1);
  }
  if (run && run.hasHol) blocks.push(run);
  const upcoming = blocks.filter(b => b.end >= today).slice(0, 8);
  function holCard(f) {
    const img = f.img || '/img/cat-culture.webp';
    const loc = (f.sido || '') + (f.sigungu ? ' ' + f.sigungu : '');
    const iso = s => String(s).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
    const dOv = f.ov ? ` data-ov="${escA(f.ov)}"` : '';
    const dHp = f.hp ? ` data-hp="${escA(f.hp)}"` : '';
    const dNear = Array.isArray(nearby[f.id]) && nearby[f.id].length ? ` data-near="${encodeURIComponent(JSON.stringify(nearby[f.id]))}"` : '';
    return `<div class="card" style="cursor:pointer" data-name="${escA(f.title)}" data-start="${iso(f.start)}" data-end="${iso(f.end)}" data-region="${escA(f.sido || '')}" data-city="${escA(f.sigungu || '')}" data-img="${escA(img)}"${dOv}${dHp}${dNear}><div class="thumb"><img loading="lazy" src="${esc(img)}" alt="${esc(f.title)}" onerror="this.src=&#39;/img/cat-culture.webp&#39;"><span class="dday"></span>${f.sido ? `<span class="cat">${esc(f.sido)}</span>` : ''}</div><div class="card-body"><h3>${esc(f.title)}</h3><div class="date">📅 ${fyy(f.start)} ~ ${fyy(f.end)}</div><div class="loc">📍 ${esc(loc)}</div></div></div>`;
  }
  const sections = upcoming.map(b => {
    const uniq = [...new Set(b.names)];
    const days = Math.round((b.end - b.start) / 86400000) + 1;
    const label = uniq.join('·') + (days >= 2 ? ' 연휴' : '');
    const list = apiFests.filter(f => yd(f.start) <= b.end && yd(f.end) >= b.start)
      .sort((a, b2) => (a.start || '').localeCompare(b2.start || '')).slice(0, 12);
    const range = fyy(isoOf(b.start)) + (days > 1 ? ' ~ ' + fyy(isoOf(b.end)) : '') + ` · ${days}일`;
    const body = list.length
      ? `<div class="grid">${list.map(holCard).join('\n')}</div>`
      : `<p class="note">이 기간에 등록된 축제가 아직 없어요. <a href="/search/">전체 축제 검색에서 찾아보기 →</a></p>`;
    return `<section style="margin:26px 0"><h2 class="sec" style="margin-bottom:2px">🎌 ${esc(label)}</h2><p class="page-sub" style="margin:2px 0 14px">${range} · 이 연휴에 열리는 축제 ${list.length}곳</p>${body}</section>`;
  }).join('\n');
  const holContent = `<main><div class="wrap">
<style>.page-sub{color:#6b7280;font-size:.95rem}</style>
<h1 style="font-size:1.5rem;font-weight:900;margin:8px 0 4px">🎌 2026 연휴에 갈 축제</h1>
<p class="page-sub" style="margin-bottom:8px">다가오는 공휴일·연휴에 맞춰 전국에서 열리는 축제를 모았어요. 황금연휴 나들이 계획을 한눈에 — 설날·추석·광복절·개천절·한글날 등 공휴일 기준입니다.</p>
${sections || '<p class="note">다가오는 연휴 정보를 준비 중이에요.</p>'}
<p class="note" style="margin-top:20px">공휴일 데이터: 한국천문연구원 특일정보(공공데이터포털). 축제 일정은 변경될 수 있으니 방문 전 공식 홈페이지를 확인하세요. 카드를 누르면 상세정보와 지도·검색 링크가 표시됩니다.</p>
</div></main>`;
  const holJsonLd = upcoming.slice(0, 3).flatMap(b => apiFests.filter(f => yd(f.start) <= b.end && yd(f.end) >= b.start).slice(0, 5)).map(f => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Event', name: f.title, startDate: String(f.start).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'), endDate: String(f.end).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'), eventStatus: 'https://schema.org/EventScheduled', location: { '@type': 'Place', name: (f.sido || '') + (f.sigungu ? ' ' + f.sigungu : ''), address: { '@type': 'PostalAddress', addressRegion: f.sido, addressCountry: 'KR' } }, image: f.img ? [String(f.img).replace(/^http:/, 'https:')] : undefined, url: SITE + '/holiday/' })}</script>`).join('\n');
  writePage('holiday', layout('2026 연휴에 갈 축제 — 설날·추석·광복절 황금연휴 축제 총정리 | ' + SITE_NAME, '2026 공휴일·연휴에 열리는 전국 축제를 한눈에. 설날·추석·광복절·개천절·한글날 연휴 나들이 계획을 축제모아에서.', '/holiday/', holContent, { jsonld: holJsonLd }));
}

// ---------- sitemap / robots ----------
const urls = ['/', ...MONTHS.map(m => `/${m.key}/`), '/search/', ...(holidays.length ? ['/holiday/'] : []), '/pet/', ...(apiAccessible.length ? ['/accessible/'] : []), ...(apiTrails.length ? ['/trails/'] : []), '/jangteo/', '/test/', '/blog/', ...posts.map(p => `/blog/${p.slug}/`), '/privacy/', ...(apiFestsEn.length ? ['/en/', '/en/search/'] : []), ...(apiFestsJa.length ? ['/ja/', '/ja/search/'] : []), ...(apiFestsEs.length ? ['/es/', '/es/search/'] : []), ...(apiFestsZh.length ? ['/zh/', '/zh/search/'] : [])];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url><loc>${SITE}${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}
</urlset>`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync(path.join(ROOT, 'ads.txt'), `google.com, pub-3293445488923111, DIRECT, f08c47fec0942fa0\n`);
console.log('✓ sitemap.xml, robots.txt, ads.txt');
console.log('빌드 완료:', urls.length, '페이지');
