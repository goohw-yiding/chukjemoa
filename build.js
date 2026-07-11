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
  return `<div class="card" data-region="${esc(f.region)}" data-start="${f.start}" data-end="${f.end}" data-lat="${la}" data-lng="${lo}" data-name="${esc(f.name)}">
  <div class="thumb"><img src="/img/cat-${img}.webp" alt="${esc(f.category)} 축제" loading="lazy"><span class="dday"></span><button class="fav" data-name="${esc(f.name)}" aria-label="찜하기">♡</button><span class="km"></span><span class="cat">${emoji} ${esc(f.category)}</span></div>
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
    const s = new Date(c.dataset.start), e = new Date(c.dataset.end), el = c.querySelector('.dday');
    if (!el) return;
    const d = Math.ceil((s - t) / 86400000);
    if (t >= s && t <= e) { el.textContent = '진행중 🔥'; el.classList.add('on'); }
    else if (d > 0 && d <= 99) { el.textContent = 'D-' + d; }
    else if (t > e) { el.textContent = '종료'; el.classList.add('off'); c.classList.add('ended'); }
  });
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
@media(max-width:600px){.hero h1{font-size:1.3rem}nav a{margin-left:9px;font-size:.85rem}}
`;

function layout(title, desc, urlPath, content) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="google-site-verification" content="yaGGvBqUsyeq_wrJvUrsiCBcGYtHZA_HBFHdSKlD1GU" />
<meta name="naver-site-verification" content="5eaaca3f7a2290de756df104664ced1f008e71eb" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${urlPath}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}${urlPath}">
<meta property="og:type" content="website">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE}" crossorigin="anonymous"></script>
<style>${CSS}</style>
</head>
<body>
<header><div class="wrap">
<a class="logo" href="/">🎪 ${SITE_NAME}</a>
<nav><a href="/2026-07/">월별 축제</a><a href="/search/">🔎 축제 검색</a><a href="/pet/">🐶 반려견 여행지</a><a href="/jangteo/">전국 오일장</a><a href="/test/">🔮 취향 테스트</a><a href="/blog/">축제 가이드</a></nav>
</div></header>
${content}
<footer><div class="wrap">
<p>${SITE_NAME} — 전국 축제·오일장 일정 모음</p>
<p>축제 일정은 주최 측 사정에 따라 변경될 수 있습니다. 방문 전 공식 홈페이지를 확인하세요.</p>
<p><a href="/privacy/">개인정보처리방침</a> · 문의: goohw593@gmail.com</p>
<p>© 2026 ${SITE_NAME}</p>
</div></footer>
${DDAY_JS}
${FAV_JS}
${NEARBY_JS}
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
  writePage(mm.key, layout(title, desc, `/${mm.key}/`, content));
});

// ---------- 오일장 페이지 ----------
const marketRows = markets.map(m =>
  `<tr data-days="${m.daysNum.join(',')}"><td><strong>${esc(m.name)}</strong></td><td>${esc(m.region)} ${esc(m.city)}</td><td>${esc(m.days)}</td><td>${esc(m.famous)}</td><td>${esc(m.desc)}</td></tr>`
).join('\n');

const jangteoContent = `<main><div class="wrap">
<div style="border-radius:12px;overflow:hidden;margin-bottom:16px"><img src="/img/jangteo.webp" alt="전통 오일장 풍경" style="width:100%;max-height:220px;object-fit:cover;display:block"></div>
<h1 style="font-size:1.5rem;margin-bottom:6px">전국 유명 오일장(5일장) 날짜 총정리</h1>
<p class="note">오일장은 날짜 끝자리 기준으로 열립니다. 예: 4·9일장 → 4, 9, 14, 19, 24, 29일. <strong>오늘 열리는 장은 초록색으로 표시됩니다.</strong></p>
<p id="today-info" class="note" style="font-weight:700;color:#1a7f37"></p>
<table>
<thead><tr><th>장터</th><th>위치</th><th>장날</th><th>대표 품목</th><th>특징</th></tr></thead>
<tbody>${marketRows}</tbody>
</table>
<h2 class="sec">이달의 축제도 확인하세요</h2>
${monthNavHtml}
</div></main>
<script>
(function(){
  const now = new Date();
  const d = now.getDate() % 10;
  let openCnt = 0;
  document.querySelectorAll('tr[data-days]').forEach(tr => {
    const days = tr.dataset.days.split(',').filter(Boolean).map(Number).map(x => x % 10);
    if (days.includes(d)) { tr.classList.add('today-open'); openCnt++; }
  });
  const info = document.getElementById('today-info');
  info.textContent = '오늘은 ' + (now.getMonth()+1) + '월 ' + now.getDate() + '일 — ' +
    (openCnt ? '오늘 서는 오일장 ' + openCnt + '곳!' : '오늘 서는 오일장이 없어요. 장날을 확인해보세요.');
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
  return {
    n: f.name, s: f.start, e: f.end, r: f.region, c: f.city, g: f.category, la: co[0], lo: co[1],
    k: (MONTHS.find(mm => f.month.some(m => mm.months.includes(m))) || MONTHS[0]).key
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
        '<a class="wkchip" data-i="' + i + '" href="/' + f.k + '/">' + (EMOJI[f.g]||'🎪') + ' <strong>' + f.n + '</strong><span>' + f.r + ' ' + f.c + ' <em class="wx"></em></span></a>'
      ).join('');

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
    fbox.innerHTML = mine.map(f => {
      const s = new Date(f.s), e = new Date(f.e);
      const d = Math.ceil((s - t) / 86400000);
      const dd = t > e ? '종료' : (t >= s ? '진행중 🔥' : 'D-' + d);
      const col = t > e ? '#9ca3af' : '#0f9d8f';
      return '<a class="wkchip" href="/' + f.k + '/">' + (EMOJI[f.g]||'🎪') + ' <strong>' + f.n +
        '</strong> <em style="font-style:normal;font-weight:800;color:' + col + '">' + dd + '</em><span>' + f.r + ' ' + f.c + ' · ' + f.s.slice(5).replace('-','/') + ' 시작</span></a>';
    }).join('');
  };
  renderFavs();
})();
</script>`;

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
  '/', indexContent));

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
<p class="note">데이터 출처: 한국관광공사 국문관광정보 서비스(공공데이터포털). 일정은 변동될 수 있으니 방문 전 공식 정보를 확인하세요. 축제 카드를 누르면 네이버 검색으로 연결됩니다.</p>
</div></main>
<script>
(function(){
var F=[];
var st={sido:'',sigungu:'',kw:'',quick:'all',pet:false,past:false};
function td(){var d=new Date();d.setHours(0,0,0,0);return d;}
function toD(y){return new Date(+y.slice(0,4),+y.slice(4,6)-1,+y.slice(6,8));}
function ov(f,a,b){var s=toD(f.start),e=toD(f.end);return s<=b&&e>=a;}
function fy(y){return y?y.slice(0,4)+'.'+(+y.slice(4,6))+'.'+(+y.slice(6,8)):'';}
function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function dday(f){var t=td(),s=toD(f.start),e=toD(f.end);if(e<t)return{l:'종료',c:'off'};if(s<=t)return{l:'진행중',c:'on'};return{l:'D-'+Math.round((s-t)/86400000),c:'on'};}
function ranges(){var t=td(),w=t.getDay();var sat=new Date(t);sat.setDate(t.getDate()+((6-w+7)%7));var sun=new Date(sat);sun.setDate(sat.getDate()+1);var m0=new Date(t.getFullYear(),t.getMonth(),1),m1=new Date(t.getFullYear(),t.getMonth()+1,0),n0=new Date(t.getFullYear(),t.getMonth()+1,1),n1=new Date(t.getFullYear(),t.getMonth()+2,0);return{t:t,sat:sat,sun:sun,m0:m0,m1:m1,n0:n0,n1:n1};}
function card(f){var d=dday(f),img=f.img||'/img/cat-culture.webp',loc=(f.sido||'')+(f.sigungu?' '+f.sigungu:'');var q=encodeURIComponent(f.title+' 축제');return '<a class="card" href="https://search.naver.com/search.naver?query='+q+'" target="_blank" rel="noopener"><div class="thumb"><img loading="lazy" src="'+esc(img)+'" alt="'+esc(f.title)+'" onerror="this.src=&#39;/img/cat-culture.webp&#39;"><span class="dday '+d.c+'">'+d.l+'</span>'+(f.sido?'<span class="cat">'+esc(f.sido)+'</span>':'')+'</div><div class="card-body"><h3>'+esc(f.title)+'</h3><div class="date">'+fy(f.start)+' ~ '+fy(f.end)+'</div><div class="loc">'+esc(loc)+'</div></div></a>';}
function apply(){var r=ranges();var list=F.filter(function(f){if(!st.past&&!st.pet&&toD(f.end)<r.t)return false;if(st.pet&&!f.pet)return false;if(st.sido&&f.sido!==st.sido)return false;if(st.sigungu&&f.sigungu!==st.sigungu)return false;if(st.kw){var k=st.kw.toLowerCase();if((f.title||'').toLowerCase().indexOf(k)<0&&(f.addr||'').indexOf(st.kw)<0)return false;}if(st.quick==='now'&&!ov(f,r.t,r.t))return false;if(st.quick==='weekend'&&!ov(f,r.sat,r.sun))return false;if(st.quick==='month'&&!ov(f,r.m0,r.m1))return false;if(st.quick==='next'&&!ov(f,r.n0,r.n1))return false;return true;});list.sort(function(a,b){return (a.start||'').localeCompare(b.start||'');});document.getElementById('fCount').textContent='총 '+list.length+'개 축제';document.getElementById('fGrid').innerHTML=list.length?list.map(card).join(''):'<p style="grid-column:1/-1;color:#6b7280;padding:24px 0">조건에 맞는 축제가 없어요. 필터를 바꿔보세요.</p>';}
function fillSg(){var set={};F.forEach(function(f){if((!st.sido||f.sido===st.sido)&&f.sigungu)set[f.sigungu]=1;});var arr=Object.keys(set).sort();document.getElementById('fSigungu').innerHTML='<option value="">전체 도시</option>'+arr.map(function(s){return '<option value="'+s+'">'+s+'</option>';}).join('');}
document.getElementById('fSido').addEventListener('change',function(e){st.sido=e.target.value;st.sigungu='';fillSg();apply();});
document.getElementById('fSigungu').addEventListener('change',function(e){st.sigungu=e.target.value;apply();});
document.getElementById('fKw').addEventListener('input',function(e){st.kw=e.target.value.trim();apply();});
document.getElementById('fReset').addEventListener('click',function(){st={sido:'',sigungu:'',kw:'',quick:'all',pet:false,past:false};document.getElementById('fSido').value='';document.getElementById('fKw').value='';document.getElementById('fPet').checked=false;document.getElementById('fPast').checked=false;fillSg();var bs=document.querySelectorAll('#fQuick button');for(var i=0;i<bs.length;i++)bs[i].classList.toggle('on',bs[i].getAttribute('data-q')==='all');apply();});
var qbs=document.querySelectorAll('#fQuick button');for(var i=0;i<qbs.length;i++){qbs[i].addEventListener('click',function(){st.quick=this.getAttribute('data-q');for(var j=0;j<qbs.length;j++)qbs[j].classList.remove('on');this.classList.add('on');apply();});}
document.getElementById('fPet').addEventListener('change',function(e){st.pet=e.target.checked;apply();});
document.getElementById('fPast').addEventListener('change',function(e){st.past=e.target.checked;apply();});
document.getElementById('fCount').textContent='불러오는 중…';
fetch('/search/data.json').then(function(r){return r.json();}).then(function(data){F=data;fillSg();apply();}).catch(function(){document.getElementById('fCount').textContent='데이터를 불러오지 못했습니다. 새로고침 해주세요.';});
})();
</script>`;
writePage('search', layout('전국 축제 검색 — 날짜·지역·도시별 | ' + SITE_NAME, '전국 축제를 날짜·지역·도시로 검색하세요. 공공데이터 기반 최신 축제 ' + apiFests.length + '건. 진행중·이번 주말·이번 달·반려견 동반 축제를 한눈에.', '/search/', searchContent));
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
<p class="note">데이터 출처: 한국관광공사 반려동물 동반여행 서비스(공공데이터포털). 반려동물 동반 조건·이용가능 시설은 방문 전 각 장소에 꼭 확인하세요. 카드를 누르면 네이버 검색으로 연결됩니다.</p>
</div></main>
<script>
(function(){
var P=[];var st={sido:'',sigungu:'',cat:'',kw:''};var shown=60;
var CE={'관광지':'🏞️','음식점':'🍴','숙박':'🏨','레포츠':'🚵','문화시설':'🎭'};
function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function card(p){var loc=(p.sido||'')+(p.sigungu?' '+p.sigungu:'');var q=encodeURIComponent(p.title);var img=p.img||'/img/hero.webp';var badge=[p.psbl,p.type].filter(Boolean).join(' · ');var info=[p.need,p.note].filter(Boolean).join(' / ');return '<a class="card" href="https://search.naver.com/search.naver?query='+q+'" target="_blank" rel="noopener"><div class="thumb"><img loading="lazy" src="'+esc(img)+'" alt="'+esc(p.title)+'" onerror="this.src=&#39;/img/hero.webp&#39;"><span class="cat">'+(CE[p.cat]||'')+' '+esc(p.cat)+'</span></div><div class="card-body"><h3>'+esc(p.title)+'</h3><div class="loc">'+esc(loc)+'</div>'+(badge?'<div class="petbadge">🐾 '+esc(badge)+'</div>':'')+(info?'<div class="petnote" title="'+esc(info)+'">ⓘ '+esc(info)+'</div>':'')+'</div></a>';}
function filtered(){return P.filter(function(p){if(st.sido&&p.sido!==st.sido)return false;if(st.sigungu&&p.sigungu!==st.sigungu)return false;if(st.cat&&p.cat!==st.cat)return false;if(st.kw){var k=st.kw.toLowerCase();if((p.title||'').toLowerCase().indexOf(k)<0&&(p.addr||'').indexOf(st.kw)<0)return false;}return true;});}
function render(){var list=filtered();document.getElementById('pCount').textContent='총 '+list.length+'곳';var g=document.getElementById('pGrid');g.innerHTML=list.length?list.slice(0,shown).map(card).join(''):'<p style="grid-column:1/-1;color:#6b7280;padding:24px 0">조건에 맞는 곳이 없어요. 지역·유형을 바꿔보세요.</p>';document.getElementById('pMore').style.display=list.length>shown?'inline-block':'none';}
function fillSg(){var set={};P.forEach(function(p){if((!st.sido||p.sido===st.sido)&&p.sigungu)set[p.sigungu]=1;});var arr=Object.keys(set).sort();document.getElementById('pSigungu').innerHTML='<option value="">전체 시·군·구</option>'+arr.map(function(s){return '<option value="'+s+'">'+s+'</option>';}).join('');}
document.getElementById('pSido').addEventListener('change',function(e){st.sido=e.target.value;st.sigungu='';shown=60;fillSg();render();});
document.getElementById('pSigungu').addEventListener('change',function(e){st.sigungu=e.target.value;shown=60;render();});
document.getElementById('pCat').addEventListener('change',function(e){st.cat=e.target.value;shown=60;render();});
document.getElementById('pKw').addEventListener('input',function(e){st.kw=e.target.value.trim();shown=60;render();});
document.getElementById('pReset').addEventListener('click',function(){st={sido:'',sigungu:'',cat:'',kw:''};shown=60;document.getElementById('pSido').value='';document.getElementById('pCat').value='';document.getElementById('pKw').value='';fillSg();render();});
document.getElementById('pMore').addEventListener('click',function(){shown+=60;render();});
document.getElementById('pCount').textContent='불러오는 중…';
fetch('/pet/data.json').then(function(r){return r.json();}).then(function(data){P=data;fillSg();render();}).catch(function(){document.getElementById('pCount').textContent='데이터를 불러오지 못했습니다. 새로고침 해주세요.';});
})();
</script>`;
writePage('pet', layout('반려견 동반 여행지 — 전국 반려동물 동반 관광지·맛집·숙소 | ' + SITE_NAME, '반려동물 동반 가능한 전국 관광지·음식점·숙박·레포츠를 지역별로. 공공데이터 기반 ' + apiPets.length + '곳. 강아지와 함께 갈 곳 찾기.', '/pet/', petContent));
fs.writeFileSync(path.join(ROOT, 'pet', 'data.json'), JSON.stringify(apiPets));

// ---------- sitemap / robots ----------
const urls = ['/', ...MONTHS.map(m => `/${m.key}/`), '/search/', '/pet/', '/jangteo/', '/test/', '/blog/', ...posts.map(p => `/blog/${p.slug}/`), '/privacy/'];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url><loc>${SITE}${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}
</urlset>`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync(path.join(ROOT, 'ads.txt'), `google.com, pub-3293445488923111, DIRECT, f08c47fec0942fa0\n`);
console.log('✓ sitemap.xml, robots.txt, ads.txt');
console.log('빌드 완료:', urls.length, '페이지');
