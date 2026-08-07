// 축제모아 정적 사이트 빌드 스크립트
// 사용법: node build.js  (data/*.json 수정 후 재실행하면 페이지 재생성)
const fs = require('fs');
const romanize = require('./romanize');
const romanizeRegion = romanize.romanizeRegion;

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
let apiValleys = [];
try { apiValleys = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/valleys.json'), 'utf8')); }
catch (e) { console.log('⚠ valleys.json 없음 — 계곡 데이터 비어있음 (node fetch-valleys.js 먼저 실행)'); }
let apiMaple = [];
try { apiMaple = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/maple.json'), 'utf8')); } catch (e) {}
let apiFlower = [];
try { apiFlower = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/flower.json'), 'utf8')); } catch (e) {}
let apiOnsen = [];
try { apiOnsen = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/onsen.json'), 'utf8')); } catch (e) {}
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

[apiValleys, apiMaple, apiFlower, apiOnsen].forEach(normalizeSido);

// ---------- 쿠팡 파트너스 ----------
// ★ 제휴링크 교체는 아래 items[].url 한 줄씩만 바꾸면 전 사이트에 반영됩니다.
//   url이 비어 있으면 일반 쿠팡 검색 URL로 폴백(=수수료 없음). 발급 후 반드시 채울 것.
//   발급법: partners.coupang.com → 링크 생성 → '검색결과 링크'에 q 값 입력 → 생성된 https://link.coupang.com/a/XXXX 붙여넣기
const COUPANG = {
  enabled: true,
  disc: '※ 이 링크는 쿠팡 파트너스 활동의 일환으로, 구매 시 일정 수수료를 제공받습니다.',
  items: {
    festival: { ico: '🧺', t: '축제 가서 앉을 자리, 챙기셨나요', s: '휴대용 접이식 돗자리', q: '접이식 돗자리', url: 'https://link.coupang.com/a/fXNSDlRDwa' },
    flower:   { ico: '🧺', t: '봄꽃 나들이 준비물', s: '피크닉 돗자리', q: '접이식 돗자리', url: 'https://link.coupang.com/a/fXNSDlRDwa' },
    maple:    { ico: '🥾', t: '단풍 산행 준비물', s: '가벼운 등산화', q: '등산화', url: 'https://link.coupang.com/a/fXNZ2GivM4' },
    trails:   { ico: '🥾', t: '걷기 여행 준비물', s: '발 편한 등산화', q: '등산화', url: 'https://link.coupang.com/a/fXNZ2GivM4' },
    car:      { ico: '🚗', t: '장거리 운전 전에', s: '차량용 휴대폰 거치대', q: '차량용 휴대폰 거치대', url: 'https://link.coupang.com/a/fXN2IYC66m' },
    jangteo:  { ico: '🛍️', t: '장 보러 갈 때', s: '접이식 장바구니', q: '접이식 장바구니', url: 'https://link.coupang.com/a/fXN6sYwwNg' },
    valley:   { ico: '🩴', t: '계곡에서 미끄러지지 않으려면', s: '미끄럼 방지 아쿠아슈즈', q: '아쿠아슈즈', url: 'https://link.coupang.com/a/fXOzzPw6mW' },
    onsen:    { ico: '🧖', t: '온천 갈 때 챙기면 좋은 것', s: '가볍게 마르는 여행용 타월', q: '여행용 타월', url: 'https://link.coupang.com/a/fXOCpczJqC' },
    pet:      { ico: '🐾', t: '반려견과 떠난다면', s: '강아지 이동가방', q: '강아지 이동가방', url: 'https://link.coupang.com/a/fXOFfqmH4S' }
  }
};
function cpHref(key) {
  const it = COUPANG.items[key];
  return (it && it.url) ? it.url : 'https://www.coupang.com/np/search?q=' + encodeURIComponent(it ? it.q : '여행용품');
}
// 페이지당 1개 원칙. 클릭 시 중간 페이지 없이 바로 쿠팡으로 이동.
function buyBox(key) {
  if (!COUPANG.enabled) return '';
  const it = COUPANG.items[key]; if (!it) return '';
  return `<a class="buybox" href="${cpHref(key)}" target="_blank" rel="nofollow sponsored noopener">`
    + `<span class="bb-ico">${it.ico}</span>`
    + `<span class="bb-txt"><b>${esc(it.t)}</b><span class="bb-sub">${esc(it.s)}</span></span>`
    + `<span class="bb-arrow">›</span></a>`
    + `<div class="bb-disc">${COUPANG.disc}</div>`;
}

// ★ 전남광주통합 보정: TourAPI가 전남 시·군을 '광주'로 주는 경우가 있다.
//   둘째 토큰이 '구'로 끝나면 진짜 광주광역시, '시/군'이면 전라남도다.
//   (축제·반려동물 수집기는 이미 처리하지만 계절명소 수집기는 안 해서 여기서 한 번 더 거른다)
function normalizeSido(list) {
  (list || []).forEach(p => {
    if (p && p.sido === '광주' && p.sigungu && !String(p.sigungu).endsWith('구')) p.sido = '전남';
  });
  return list;
}
// 목록 페이지 첫 화면을 HTML에 실어두는 서버 렌더 카드
// (JS가 로드 후 같은 데이터로 다시 그리므로 내용은 동일하다)
function ssrCards(list, n, f) {
  return (list || []).slice(0, n || 60).map(p => {
    const o = f(p);
    const img = o.img ? String(o.img).replace(/^http:/, 'https:') : '';
    return '<div class="card">'
      + (img ? '<div class="thumb"><img src="' + escA(img) + '" alt="' + escA(o.title) + '" loading="lazy"></div>' : '')
      + '<div class="card-body"><h3>' + esc(o.title) + '</h3>'
      + (o.loc ? '<p class="loc">📍 ' + esc(o.loc) + '</p>' : '')
      + (o.desc ? '<p class="desc">' + esc(String(o.desc).slice(0, 120)) + '</p>' : '')
      + '</div></div>';
  }).join('');
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

// 모달 안 인라인 여행비용 계산기 (도착지=카드에서 자동, 출발지=localStorage 기억) — /api/tripcost 호출
const MODAL_CALC_JS = `<script>
(function(){
  var KEY='cjm_from';
  window.cjmDest={};
  function won(n){return (n||0).toLocaleString()+'원';}
  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  // 장소 문자열 정리: 괄호·구분자·꼬리말 제거 → 카카오 검색이 찾을 수 있는 형태로
  function clean(s){
    s=String(s||'').replace(/\\(.*?\\)|\\[.*?\\]/g,' ').split(/[·,\\/]/)[0];
    s=s.replace(/\\s*(일원|일대|인근|주변|앞|내|정문|등)\\s*$/,'');
    return s.replace(/\\s+/g,' ').trim();
  }
  // 후보 목록(앞에서부터 시도) 만들기 — 중복·빈값 제거
  window.cjmCands=function(){
    var out=[],seen={};
    for(var i=0;i<arguments.length;i++){
      var v=String(arguments[i]||'').replace(/\\s+/g,' ').trim();
      if(v&&v.length>1&&!seen[v]){seen[v]=1;out.push(v);}
    }
    return out;
  };
  window.cjmClean=clean;
  window.cjmResetCalc=function(p,cands){
    window.cjmDest[p]=Array.isArray(cands)?cands:[cands].filter(Boolean);
    var o=document.getElementById(p+'-out'); if(o)o.innerHTML='';
  };
  window.cjmBindCalc=function(p){
    var i=document.getElementById(p+'-from'),b=document.getElementById(p+'-go'),o=document.getElementById(p+'-out');
    if(!i||!b||!o)return;
    try{var sv=localStorage.getItem(KEY);if(sv)i.value=sv;}catch(e){}
    function render(d){
      var opts=[],h='<div class="res">',c=d.car;
      if(c){h+='<div class="rbox"><div class="m">🚗 자동차</div><div class="v">'+won(c.total)+'</div><div class="s">'+c.distanceKm+'km · '+c.durationMin+'분</div></div>';opts.push({n:'🚗 자동차',c:c.total});}
      var pt=d.transit;
      if(pt&&pt.fare){h+='<div class="rbox"><div class="m">🚌 대중교통</div><div class="v">'+won(pt.fare)+'</div><div class="s">'+pt.durationMin+'분'+(pt.transfer?' · 환승'+pt.transfer:'')+'</div></div>';opts.push({n:'🚌 대중교통',c:pt.fare});}
      else if(d.intercityBus){h+='<div class="rbox"><div class="m">🚌 시외버스</div><div class="v">'+won(d.intercityBus.fare)+'</div><div class="s">'+esc(d.intercityBus.dep)+'→'+esc(d.intercityBus.arr)+'</div></div>';opts.push({n:'🚌 시외버스',c:d.intercityBus.fare});}
      else if(d.intercity){h+='<div class="rbox"><div class="m">🚌 '+esc(d.intercity.busLabel||'대중교통')+'</div><div class="v">'+won(d.intercity.busEstimate)+'</div><div class="s">거리 추정</div></div>';opts.push({n:'🚌 대중교통(추정)',c:d.intercity.busEstimate});}
      if(d.ktx){h+='<div class="rbox"><div class="m">🚄 KTX</div><div class="v">'+won(d.ktx.fare)+'</div><div class="s">'+esc(d.ktx.depStation)+'→'+esc(d.ktx.arrStation)+'</div></div>';opts.push({n:'🚄 KTX',c:d.ktx.fare});}
      h+='</div>';
      opts.sort(function(a,b2){return a.c-b2.c;});
      if(opts.length>1)h+='<div class="best">💰 가장 저렴: '+opts[0].n+' '+won(opts[0].c)+' (편도 1인 기준)</div>';
      o.innerHTML=h;
    }
    function done(){b.disabled=false;b.textContent='계산';}
    function fail(){
      done();
      o.innerHTML='<div class="err">이 장소는 자동으로 못 찾았어요.<br><a href="/trip-cost/" style="color:#e0502f;text-decoration:underline">계산기에서 직접 입력해 보기 →</a></div>';
    }
    // 도착지 후보를 앞에서부터 순서대로 시도 (축제명 → 정리된 장소명 → 시·군)
    function tryList(from,list,k){
      if(k>=list.length){fail();return;}
      fetch('/api/tripcost?from='+encodeURIComponent(from)+'&to='+encodeURIComponent(list[k]))
        .then(function(r){return r.json();})
        .then(function(d){
          if(d.error||!d.car){tryList(from,list,k+1);return;}
          done();render(d);
        })
        .catch(function(){tryList(from,list,k+1);});
    }
    function run(){
      var from=i.value.trim(),list=window.cjmDest[p]||[];
      if(!from){o.innerHTML='<div class="err">출발지를 입력해주세요.</div>';i.focus();return;}
      if(!list.length){o.innerHTML='<div class="err">도착지를 확인할 수 없어요.</div>';return;}
      try{localStorage.setItem(KEY,from);}catch(e){}
      b.disabled=true;b.textContent='계산 중…';o.innerHTML='';
      tryList(from,list,0);
    }
    b.addEventListener('click',run);
    i.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();run();}});
  };
  window.cjmBindCalc('fmc');
  window.cjmBindCalc('pmc');
  window.cjmBindCalc('smc');
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
<div class="fmcalc">
<h4>🧮 여기까지 가는 비용, 얼마나 들까?</h4>
<div class="row"><input id="fmc-from" type="text" placeholder="출발지 (예: 서울역, 수원시청)" autocomplete="off"><button id="fmc-go" type="button">계산</button></div>
<div id="fmc-out"></div>
<p class="hint">자동차(연료+통행료+주차) vs 대중교통·KTX 편도 비용 비교 · <a href="/trip-cost/" style="color:#e0502f;font-weight:700">연비·유가 바꿔서 자세히 계산 →</a></p>
</div>
${buyBox('festival')}
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
    if(window.cjmResetCalc){var cp=window.cjmClean(ds.place);window.cjmResetCalc('fmc',window.cjmCands(ds.name,(ds.city?ds.city+' ':'')+cp,cp,(ds.region||'')+' '+(ds.city||''),ds.city));}
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
<div class="fmcalc">
<h4>🧮 여기까지 가는 비용, 얼마나 들까?</h4>
<div class="row"><input id="pmc-from" type="text" placeholder="출발지 (예: 서울역, 수원시청)" autocomplete="off"><button id="pmc-go" type="button">계산</button></div>
<div id="pmc-out"></div>
<p class="hint">자동차(연료+통행료+주차) vs 대중교통·KTX 편도 비용 비교 · <a href="/trip-cost/" style="color:#e0502f;font-weight:700">연비·유가 바꿔서 자세히 계산 →</a></p>
</div>
<div id="pmc-buy"></div>
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
    if(window.cjmResetCalc)window.cjmResetCalc('pmc',window.cjmCands(o.title,window.cjmClean(o.title),o.dest,o.meta));
    var pb=document.getElementById('pmc-buy'); if(pb) pb.innerHTML=window.CJM_BUYBOX||'';
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
.meta{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;border-top:1px solid #e6f0ec;border-bottom:1px solid #e6f0ec;padding:10px 0;margin:0 0 18px;font-size:.85rem;color:#6b7280}
.meta .by{font-weight:800;color:#0a6c63}
.meta a{color:#0f9d8f;font-weight:700;text-decoration:underline}
.notice{background:#fff8ed;border:1.5px solid #f6dfb8;border-left:4px solid #e9a23b;border-radius:12px;padding:13px 16px;margin:20px 0;font-size:.9rem;color:#6b4f22;line-height:1.6}
.notice b{color:#a86a12}
.refs{background:#f4faf8;border:1.5px solid #dcefeb;border-radius:14px;padding:16px 19px;margin:24px 0 4px}
.refs h3{font-size:1rem;font-weight:800;color:#0a6c63;margin-bottom:8px}
.refs ul{margin:0;padding-left:19px}
.refs li{font-size:.88rem;color:#4b5563;margin-bottom:5px}
.refs a{color:#0c7d72;font-weight:700;text-decoration:underline}
.srcnote{margin-top:14px;padding-top:12px;border-top:1px solid rgba(183,204,198,.28);font-size:.82rem;color:#9db3ad;line-height:1.7}
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
.fmcalc{margin-top:18px;border:1.5px solid #ffd9cf;background:#fff8f6;border-radius:14px;padding:14px}
.fmcalc h4{font-size:.98rem;font-weight:900;color:#e0502f;margin-bottom:9px}
.fmcalc .row{display:flex;gap:8px;flex-wrap:wrap}
.fmcalc input{flex:1;min-width:150px;padding:11px 13px;border:1.5px solid #ffd0c4;border-radius:11px;font-size:.95rem;font-family:inherit;background:#fff;box-sizing:border-box}
.fmcalc button{background:#ff5a3c;color:#fff;border:none;border-radius:11px;padding:11px 20px;font-weight:800;font-size:.95rem;cursor:pointer;font-family:inherit;white-space:nowrap}
.fmcalc button:disabled{opacity:.6;cursor:default}
.fmcalc .hint{font-size:.78rem;color:#9ca3af;margin-top:8px;line-height:1.55}
.fmcalc .res{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}
.fmcalc .rbox{flex:1;min-width:104px;background:#fff;border:1.5px solid #ffd9cf;border-radius:11px;padding:11px 10px;text-align:center}
.fmcalc .rbox .m{font-size:.79rem;font-weight:700;color:#6b7280}
.fmcalc .rbox .v{font-size:1.16rem;font-weight:900;color:#e0502f;letter-spacing:-.02em}
.fmcalc .rbox .s{font-size:.72rem;color:#9ca3af}
.fmcalc .best{margin-top:10px;font-weight:800;font-size:.9rem;color:#0a6c63;text-align:center}
.fmcalc .err{color:#dc2626;font-weight:700;font-size:.88rem;margin-top:9px;text-align:center}
.buybox{display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,#0f9d8f,#0d7d72);color:#fff;border-radius:14px;padding:14px 18px;margin:16px 0 0;text-decoration:none;box-shadow:0 6px 18px rgba(15,157,143,.28);transition:transform .15s}
.buybox:hover{transform:translateY(-2px)}
.buybox .bb-ico{font-size:1.5rem;flex:none}
.buybox .bb-txt{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}
.buybox .bb-txt b{font-size:.98rem;font-weight:800}
.buybox .bb-sub{font-size:.82rem;opacity:.88}
.buybox .bb-arrow{font-size:1.5rem;opacity:.75;flex:none}
.bb-disc{font-size:.74rem;color:#9ca3af;margin:6px 2px 2px;line-height:1.5}
@media(max-width:600px){.buybox{padding:13px 15px;gap:10px}.buybox .bb-txt b{font-size:.92rem}}
.faqbox{background:#fff;border-radius:18px;box-shadow:0 3px 14px rgba(31,41,55,.08);padding:26px 30px 22px;margin:10px 0 34px}
.faqbox h2{font-size:1.3rem;font-weight:900;letter-spacing:-.02em;margin-bottom:6px;color:#0a6c63}
.faqbox details{border-top:1px solid #eef5f3;padding:2px 0}
.faqbox details:first-of-type{border-top:none}
.faqbox summary{list-style:none;cursor:pointer;font-weight:800;font-size:1rem;color:#1f2937;padding:14px 30px 14px 0;position:relative}
.faqbox summary::-webkit-details-marker{display:none}
.faqbox summary::after{content:'+';position:absolute;right:4px;top:50%;transform:translateY(-50%);font-size:1.25rem;font-weight:700;color:#0f9d8f;line-height:1}
.faqbox details[open] summary::after{content:'−'}
.faqbox summary:hover{color:#0f9d8f}
.faqbox details p{font-size:.94rem;color:#4b5563;line-height:1.75;padding:0 8px 16px 0;margin-top:-2px}
@media(max-width:600px){.faqbox{padding:20px 18px 16px;border-radius:14px}.faqbox summary{font-size:.95rem;padding:13px 26px 13px 0}}
.ranklegend{font-size:.82rem;color:#9ca3af;margin:-8px 0 14px;line-height:1.6}
.ranklegend b{color:#6b7280}
.ranklegend a{color:#0f9d8f;font-weight:700;text-decoration:underline}
.explain{background:#fff;border-radius:18px;box-shadow:0 3px 14px rgba(31,41,55,.08);padding:28px 30px 24px;margin:34px 0 10px;scroll-margin-top:80px}
.explain h2{font-size:1.22rem;font-weight:900;letter-spacing:-.02em;color:#0a6c63;margin-bottom:4px}
.explain h3{font-size:1rem;font-weight:800;color:#1f2937;margin:20px 0 6px;padding-top:16px;border-top:1px solid #eef5f3}
.explain h3:first-of-type{border-top:none;padding-top:8px}
.explain p{font-size:.93rem;color:#4b5563;line-height:1.78;margin:6px 0}
.explain b{color:#111827}
.explain ul{margin:8px 0 6px;padding-left:2px;list-style:none}
.explain li{font-size:.93rem;color:#4b5563;line-height:1.75;padding:3px 0 3px 16px;position:relative}
.explain li::before{content:'·';position:absolute;left:4px;color:#0f9d8f;font-weight:900}
.explain a{color:#0f9d8f;font-weight:700;text-decoration:underline}
@media(max-width:600px){.explain{padding:22px 18px 18px;border-radius:14px}.explain h2{font-size:1.1rem}}
.crumb{font-size:.84rem;color:#9aa3af;margin:6px 0 2px}
.crumb a{color:#0f9d8f;font-weight:700}
.insight{display:flex;align-items:stretch;gap:10px;background:#fff;border:1.5px solid #dcefeb;border-radius:16px;padding:16px;margin:14px 0 8px}
.insight .ins-col{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0}
.insight .ins-h{font-size:.8rem;font-weight:800;color:#0a6c63}
.insight .ins-col.fgn .ins-h{color:#6d28d9}
.insight .ins-col b{font-size:1.22rem;font-weight:900;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.insight .ins-s{font-size:.8rem;color:#9aa3af}
.insight .ins-vs{align-self:center;font-weight:900;color:#cbd5d1;font-size:.9rem;flex:none}
.spotchips{display:flex;flex-wrap:wrap;gap:7px;margin:6px 0 4px}
.spotchip{display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid #dcefeb;border-radius:20px;padding:7px 13px;font-size:.87rem;font-weight:700;color:#374151;transition:all .15s}
.spotchip:hover{border-color:#7fd8ce;color:#0a6c63;transform:translateY(-1px)}
.spotchip span{color:#9aa3af;font-weight:600;font-size:.8rem}
.sidonav{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0 4px}
.sidonav a,.sidonav span{display:inline-block;padding:8px 15px;border-radius:20px;font-size:.9rem;font-weight:700;border:1.5px solid #dcefeb;background:#fff;color:#374151;transition:all .15s}
.sidonav a:hover{border-color:#0f9d8f;color:#0f9d8f}
.sidonav span.on{background:linear-gradient(135deg,#0f9d8f,#2dd4bf);color:#fff;border-color:transparent}
@media(max-width:600px){.insight{flex-direction:column;gap:6px}.insight .ins-vs{display:none}.insight .ins-col b{font-size:1.1rem}}
.datebadge{background:#f4faf8;border:1px solid #dcefeb;border-radius:12px;padding:12px 15px;font-size:.85rem;color:#374151;line-height:1.6;margin:12px 0 4px}
.datebadge b{color:#0a6c63}
.datebadge span{color:#9ca3af;font-size:.8rem}
.rank-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 18px}
.rank-tabs button{border:1.5px solid #a9e5dd;background:#fff;color:#0c7d72;border-radius:20px;padding:9px 18px;font-size:.9rem;font-weight:800;cursor:pointer;font-family:inherit;transition:all .15s}
.rank-tabs button:hover{border-color:#0f9d8f}
.rank-tabs button.on{background:linear-gradient(135deg,#0f9d8f,#2dd4bf);color:#fff;border-color:transparent;box-shadow:0 4px 12px rgba(15,157,143,.32)}
.ranklist{display:flex;flex-direction:column;gap:7px;margin:6px 0 4px}
.rankrow{display:flex;align-items:center;gap:10px}
.rankrow .no{width:26px;text-align:center;font-weight:800;color:#9aa3af;flex:none;font-size:.9rem}
.rankrow .nm{flex:none;width:134px;font-weight:700;font-size:.9rem;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rankrow .nm:hover{color:#0f9d8f;text-decoration:underline}
.rankrow.wide .nm{width:212px}
.rankrow.mini .nm{width:104px;font-size:.85rem}
.rankrow .bar{flex:1;background:#eef5f3;border-radius:7px;height:20px;overflow:hidden;min-width:0}
.rankrow .bar>i{display:block;height:100%;border-radius:7px;background:linear-gradient(90deg,#0f9d8f,#2dd4bf)}
.rankrow.fgn .bar>i{background:linear-gradient(90deg,#6d28d9,#a78bfa)}
.rankrow.hot .bar>i{background:linear-gradient(90deg,#ff5a3c,#ff9a5c)}
.rankrow.mini .bar{height:16px}
.rankrow .val{color:#4b5563;font-size:.82rem;font-weight:800;min-width:64px;text-align:right;flex:none}
.rankrow .val em{font-style:normal;color:#e0502f}
@media(max-width:600px){
.rankrow{gap:7px}
.rankrow .no{width:20px;font-size:.82rem}
.rankrow .nm{width:96px;font-size:.82rem}
.rankrow.wide .nm{width:118px}
.rankrow.mini .nm{width:86px;font-size:.8rem}
.rankrow .val{min-width:52px;font-size:.76rem}
.rankrow .bar{height:16px}
}
nav{display:flex;align-items:center;gap:2px}
nav>a{margin-left:18px;font-weight:600;font-size:.95rem;color:#4b5563}
.ndrop{position:relative}
.nbtn{display:inline-flex;align-items:center;gap:5px;border:none;background:none;font-family:inherit;font-weight:700;font-size:.95rem;color:#4b5563;padding:8px 12px;border-radius:10px;cursor:pointer;transition:all .15s}
.nbtn:hover,.ndrop:hover .nbtn,.ndrop:focus-within .nbtn{color:#0f9d8f;background:#effaf8}
.nbtn .arw{font-size:.6rem;opacity:.5}
.nmenu{display:none;position:absolute;top:calc(100% + 9px);right:0;min-width:198px;background:#fff;border:1px solid #e4f2ee;border-radius:14px;box-shadow:0 14px 34px rgba(17,24,39,.15);padding:7px;z-index:60}
.nmenu::before{content:'';position:absolute;top:-11px;left:0;right:0;height:11px}
.ndrop:hover .nmenu,.ndrop:focus-within .nmenu{display:block}
.nmenu a{display:block;margin:0;padding:9px 12px;border-radius:9px;font-size:.92rem;font-weight:600;color:#374151;white-space:nowrap}
.nmenu a:hover{background:#effaf8;color:#0a6c63}
nav>a.nhot{margin-left:8px;padding:8px 15px;border-radius:20px;background:linear-gradient(135deg,#ff5a3c,#ff8a5c);color:#fff;font-weight:800;font-size:.92rem;box-shadow:0 4px 12px rgba(255,90,60,.3)}
nav>a.nhot:hover{filter:brightness(1.06)}
.navtoggle{display:none;border:1.5px solid #dcefeb;background:#fff;color:#0f9d8f;font-size:1.15rem;width:44px;height:38px;border-radius:11px;cursor:pointer;line-height:1;font-family:inherit}
@media(max-width:880px){
.navtoggle{display:block}
nav{display:none;order:3;width:100%;flex-direction:column;align-items:stretch;gap:0;padding-top:10px;margin-top:10px;border-top:1px solid #e4f2ee}
nav.open{display:flex}
nav>a{display:block;margin:0;padding:10px 4px}
nav>a.nhot{margin:10px 0 4px;text-align:center;padding:12px}
.ndrop{position:static}
.nbtn{width:100%;justify-content:flex-start;font-size:.8rem;color:#9aa3af;padding:11px 4px 4px;letter-spacing:.03em;cursor:default}
.nbtn:hover,.ndrop:hover .nbtn{background:none;color:#9aa3af}
.nbtn .arw{display:none}
.nmenu{display:block;position:static;border:none;box-shadow:none;padding:0 0 6px;min-width:0}
.nmenu::before{display:none}
.nmenu a{display:inline-block;padding:7px 12px;margin:3px 6px 3px 0;background:#f4faf8;border:1px solid #e4f2ee;font-size:.88rem}
}
@media(max-width:600px){.hero h1{font-size:1.3rem}}
`;

// ---------- 상단 네비게이션 (카테고리 드롭다운 + 모바일 햄버거) ----------
const CUR_MONTH_KEY = (MONTHS.find(m => m.months.includes(new Date().getMonth() + 1)) || MONTHS[0]).key;
const KO_NAV = `<button class="navtoggle" id="navtoggle" aria-label="메뉴 열기" aria-expanded="false">☰</button>
<nav id="mainnav">
<div class="ndrop"><button class="nbtn" type="button">🎪 축제<span class="arw">▼</span></button><div class="nmenu">
<a href="/search/">🔎 축제 검색</a>
<a href="/${CUR_MONTH_KEY}/">📅 월별 축제</a>
<a href="/trend/">🔥 인기 여행지 랭킹</a>
<a href="/holiday/">🎌 연휴 축제</a>
<a href="/blog/">📖 축제 가이드</a>
<a href="/test/">🔮 취향 테스트</a>
</div></div>
<div class="ndrop"><button class="nbtn" type="button">🗺️ 여행지<span class="arw">▼</span></button><div class="nmenu">
<a href="/valley/">💧 계곡명소</a>
<a href="/maple/">🍁 단풍명소</a>
<a href="/flower/">🌸 봄꽃명소</a>
<a href="/onsen/">♨️ 온천</a>
<a href="/trails/">🥾 걷기 여행</a>
<a href="/pet/">🐶 반려견 여행지</a>
<a href="/accessible/">♿ 무장애 여행</a>
<a href="/jangteo/">🏮 전국 오일장</a>
</div></div>
<a class="nhot" href="/trip-cost/">🧮 여행비용 계산기</a>
<div class="ndrop"><button class="nbtn" type="button">🌐<span class="arw">▼</span></button><div class="nmenu">
<a href="/en/">English</a>
<a href="/ja/">日本語</a>
<a href="/es/">Español</a>
<a href="/zh/">中文</a>
</div></div>
</nav>`;
const NAV_JS = `<script>
(function(){
  var t=document.getElementById('navtoggle'),n=document.getElementById('mainnav');
  if(!t||!n)return;
  t.addEventListener('click',function(){
    var o=n.classList.toggle('open');
    t.setAttribute('aria-expanded',o?'true':'false');
    t.textContent=o?'✕':'☰';
  });
})();
</script>`;

function layout(title, desc, urlPath, content, opts) {
  opts = opts || {};
  const lang = opts.lang || 'ko';
  const alts = (opts.alternates || []).map(a => `<link rel="alternate" hreflang="${a.hreflang}" href="${SITE}${a.href}">`).join('\n');
  const logoHref = lang === 'ko' ? '/' : '/' + lang + '/';
  const NAVS = {
    en: `<nav><a href="/en/">Home</a><a href="/en/search/">🔎 Festivals</a><a href="/en/trend/">🔥 Rankings</a><a href="/">🇰🇷 한국어</a></nav>`,
    ja: `<nav><a href="/ja/">ホーム</a><a href="/ja/search/">🔎 お祭り検索</a><a href="/ja/trend/">🔥 人気ランキング</a><a href="/">🇰🇷 한국어</a></nav>`,
    es: `<nav><a href="/es/">Inicio</a><a href="/es/search/">🔎 Buscar festivales</a><a href="/es/trend/">🔥 Rankings</a><a href="/">🇰🇷 한국어</a></nav>`,
    zh: `<nav><a href="/zh/">首页</a><a href="/zh/search/">🔎 庆典搜索</a><a href="/zh/trend/">🔥 人气排行</a><a href="/">🇰🇷 한국어</a></nav>`
  };
  const nav = lang === 'ko'
    ? KO_NAV
    : `<button class="navtoggle" id="navtoggle" aria-label="menu" aria-expanded="false">☰</button>` + NAVS[lang].replace('<nav>', '<nav id="mainnav">');
  const FOOTERS = {
    en: `<p>Chukjemoa — Korea Festivals &amp; Traditional Markets</p>
<p>Schedules may change; please check the official website before visiting.</p>
<p><a href="/about/">About</a> · <a href="/editorial/">Editorial Policy</a> · <a href="/contact/">Contact</a> · <a href="/privacy/">Privacy</a></p>
<p>Data: Korea Tourism Organization (TourAPI) · Contact: goohw593@gmail.com</p>
<p class="srcnote">Festival data source: Korea Tourism Organization TourAPI and other open public data. Last updated ${TODAY}.</p>
<p>© 2026 Chukjemoa</p>`,
    ja: `<p>Chukjemoa — 韓国のお祭り・伝統市場ガイド</p>
<p>日程は変更される場合があります。訪問前に公式サイトをご確認ください。</p>
<p><a href="/about/">サイト紹介</a> · <a href="/editorial/">編集方針</a> · <a href="/contact/">お問い合わせ</a> · <a href="/privacy/">プライバシー</a></p>
<p>データ：韓国観光公社（TourAPI） · お問い合わせ：goohw593@gmail.com</p>
<p class="srcnote">お祭り情報の出典：韓国観光公社 TourAPI ほか公共オープンデータ。最終更新 ${TODAY}。</p>
<p>© 2026 Chukjemoa</p>`,
    es: `<p>Chukjemoa — Festivales y mercados tradicionales de Corea</p>
<p>Los horarios pueden cambiar; consulte el sitio oficial antes de visitar.</p>
<p><a href="/about/">Acerca de</a> · <a href="/editorial/">Política editorial</a> · <a href="/contact/">Contacto</a> · <a href="/privacy/">Privacidad</a></p>
<p>Datos: Organización de Turismo de Corea (TourAPI) · Contacto: goohw593@gmail.com</p>
<p class="srcnote">Fuente de los datos: TourAPI de la Organización de Turismo de Corea y otros datos públicos abiertos. Última actualización ${TODAY}.</p>
<p>© 2026 Chukjemoa</p>`,
    zh: `<p>Chukjemoa — 韩国庆典·传统市场指南</p>
<p>活动日程可能变动，出行前请确认官方网站。</p>
<p><a href="/about/">关于我们</a> · <a href="/editorial/">编辑方针</a> · <a href="/contact/">联系</a> · <a href="/privacy/">隐私政策</a></p>
<p>数据：韩国观光公社（TourAPI） · 联系：goohw593@gmail.com</p>
<p class="srcnote">庆典信息来源：韩国观光公社 TourAPI 等公共开放数据。最后更新 ${TODAY}。</p>
<p>© 2026 Chukjemoa</p>`
  };
  const footer = lang === 'ko'
    ? `<p>${SITE_NAME} — 전국 축제·오일장 일정 모음</p>
<p>축제 일정은 주최 측 사정에 따라 변경될 수 있습니다. 방문 전 공식 홈페이지를 확인하세요.</p>
<p><a href="/about/">소개</a> · <a href="/editorial/">편집 원칙</a> · <a href="/contact/">문의</a> · <a href="/privacy/">개인정보처리방침</a></p>
<p>문의: goohw593@gmail.com</p>
<p class="srcnote">축제 정보 출처: 한국관광공사 TourAPI 등 <a href="https://www.data.go.kr/" target="_blank" rel="noopener nofollow">공공데이터포털</a> 개방 데이터. 최종 갱신 ${TODAY}.<br>일정·요금은 주최 측 사정으로 변경될 수 있으니 방문 전 주최 측 공식 채널에서 확인하시기 바랍니다. 잘못된 정보는 <a href="/contact/">문의</a>로 알려주시면 확인 후 정정합니다.</p>
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
<link rel="alternate" type="application/rss+xml" title="${SITE_NAME} 축제 가이드" href="${SITE}/rss.xml">
${alts}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}${urlPath}">
<meta property="og:type" content="website">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE}" crossorigin="anonymous"></script>
${opts.jsonld || ''}
<style>${CSS}</style>
<script>window.__onesignalAppId="8d4d29df-1dba-4f43-9efb-0c3745441e1f";(function(){var id=window.__onesignalAppId;if(!id||id.indexOf("PASTE")===0)return;if(location.protocol!=="https:")return;var s=document.createElement("script");s.src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";s.defer=true;document.head.appendChild(s);window.OneSignalDeferred=window.OneSignalDeferred||[];window.OneSignalDeferred.push(function(OneSignal){OneSignal.init({appId:id});});})();</script>
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
${NAV_JS}
${DDAY_JS}
${FAV_JS}
${NEARBY_JS}
${lang === 'ko' ? MODAL_CALC_JS + FEST_MODAL_JS + PLACE_MODAL_JS : ''}
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
  '/jangteo/', jangteoContent + buyBox('jangteo')));

// ---------- 신뢰 요소(E-E-A-T) 공통 블록 ----------
// 편집 원칙: /editorial/ · 저자 명의: 축제모아 편집팀
const AUTHOR_NAME = '축제모아 편집팀';
const EDITORIAL_URL = '/editorial/';
const LAST_REVIEWED = '2026-07-27'; // 신뢰 블록(저자·출처·고지) 최종 검수일

// 참고 자료 — 실존이 확인된 기관 도메인 루트만 사용한다. 세부 경로는 쓰지 않는다.
const REF_NATIONAL = [
  ['https://www.visitkorea.or.kr/', '한국관광공사', '전국 축제·관광 정보 원천 데이터(TourAPI) 제공 기관'],
  ['https://www.mcst.go.kr/', '문화체육관광부', '문화관광축제 지정·관광 정책 주관 부처'],
  ['https://www.data.go.kr/', '공공데이터포털', '축제·반려동물 동반·무장애 정보 개방 데이터 원본']
];
const POST_REFS = {
  'boryeong-mud-guide': [
    ['https://www.brcn.go.kr/', '보령시청', '보령머드축제 개최 지자체 공식 홈페이지']
  ],
  'muju-firefly-festival-guide': [
    ['https://www.muju.go.kr/', '무주군청', '무주반딧불축제 개최 지자체 공식 홈페이지']
  ],
  'jangheung-water-festival-guide': [
    ['https://www.jangheung.go.kr/', '장흥군청', '정남진 장흥 물축제 개최 지자체 공식 홈페이지']
  ],
  'andong-mask-dance-festival-guide': [
    ['https://www.andong.go.kr/', '안동시청', '안동국제탈춤페스티벌 개최 지자체 공식 홈페이지']
  ],
  'summer-water-festivals-2026': [
    ['https://www.jangheung.go.kr/', '장흥군청', '정남진 장흥 물축제 개최 지자체'],
    ['https://www.brcn.go.kr/', '보령시청', '보령머드축제 개최 지자체'],
    ['https://www.bonghwa.go.kr/', '봉화군청', '봉화 은어축제 개최 지자체']
  ],
  'ojang-train-trip-course': [
    ['https://www.seongnam.go.kr/', '성남시청', '모란민속5일장 소재 지자체 공식 홈페이지'],
    ['https://www.yesan.go.kr/', '예산군청', '예산장 소재 지자체 공식 홈페이지'],
    ['https://www.korail.com/', '한국철도공사(코레일)', '열차 시각·승차권 확인']
  ],
  'pet-friendly-festival-guide': [
    ['https://www.animal.go.kr/', '동물보호관리시스템(농림축산식품부)', '반려동물 등록·동반 관련 공식 정보']
  ]
};

function metaBlock(date) {
  return `<div class="meta">
<span class="by">${AUTHOR_NAME}</span>
<span>최초 작성 ${date}</span>
<span>최종 수정 ${LAST_REVIEWED}</span>
<span><a href="${EDITORIAL_URL}">편집 원칙 보기</a></span>
</div>`;
}

const SCHEDULE_NOTICE = `<div class="notice">
<b>일정 확인 안내</b> — 축제 일정·요금·프로그램은 기상 상황이나 주최 측 사정으로 변경되거나 취소될 수 있습니다. 이 글의 정보는 작성 시점을 기준으로 정리한 것이므로, <b>방문 전 반드시 주최 측 공식 채널(지자체 홈페이지·축제 공식 홈페이지·대표 전화)에서 최종 일정을 확인</b>하시기 바랍니다. 잘못된 정보를 발견하시면 <a href="/contact/">문의 페이지</a>로 알려주세요.
</div>`;

function refsBlock(slug) {
  const list = REF_NATIONAL.concat(POST_REFS[slug] || []);
  return `<div class="refs">
<h3>참고 자료</h3>
<ul>
${list.map(r => `<li><a href="${r[0]}" target="_blank" rel="noopener nofollow">${esc(r[1])}</a> — ${esc(r[2])}</li>`).join('\n')}
</ul>
<p class="note" style="margin:10px 0 0">축제 일정·장소·요금·반려동물 동반·무장애 정보는 한국관광공사 TourAPI 등 공공데이터를 기준으로 정리하며 주기적으로 갱신합니다. 수집·검증 기준은 <a href="${EDITORIAL_URL}">편집 원칙</a>에 정리해 두었습니다.</p>
</div>`;
}

function articleLd(p) {
  return `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title,
    description: p.desc,
    inLanguage: 'ko',
    datePublished: p.date,
    dateModified: LAST_REVIEWED,
    author: { '@type': 'Organization', name: AUTHOR_NAME, url: SITE + EDITORIAL_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE + '/' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': SITE + '/blog/' + p.slug + '/' }
  })}</script>`;
}

// ---------- 블로그 ----------
posts.forEach(p => {
  const content = `<main><div class="wrap"><article>
<h1>${esc(p.title)}</h1>
${metaBlock(p.date)}
${p.body}
${SCHEDULE_NOTICE}
${refsBlock(p.slug)}
</article>
<h2 class="sec">월별 축제 일정 보기</h2>
${monthNavHtml}
</div></main>`;
  writePage(`blog/${p.slug}`, layout(`${p.title} | ${SITE_NAME}`, p.desc, `/blog/${p.slug}/`, content, { jsonld: articleLd(p) }));
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

// ---------- 편집 원칙 (/editorial/) ----------
const editorialContent = `<main><div class="wrap"><article>
<h1>편집 원칙</h1>
<p class="desc" style="color:#6b7280;margin-bottom:16px">축제 정보는 틀리면 누군가의 하루를 헛걸음으로 만듭니다. 그래서 우리가 어디서 데이터를 가져오고, 무엇을 확인하며, 무엇은 하지 않는지 공개합니다.</p>

<div class="meta">
<span class="by">${AUTHOR_NAME}</span>
<span>최종 수정 ${LAST_REVIEWED}</span>
</div>

<div class="notice">
<b>가장 중요한 고지</b> — 축제 일정·요금·프로그램은 기상 상황과 주최 측 사정에 따라 <b>언제든 변경되거나 취소될 수 있습니다</b>. 축제모아의 정보는 수집 시점 기준이며, 주최 측 최신 공지를 실시간으로 반영하지 못할 수 있습니다. <b>방문 전에는 반드시 주최 측 공식 채널(지자체 홈페이지·축제 공식 홈페이지·대표 전화)에서 최종 일정을 다시 확인해 주세요.</b> 이동·숙박을 예약하기 전이라면 특히 그렇습니다.
</div>

<h2>1. 누가 만드나요</h2>
<p>축제모아는 1인이 운영하는 무료 정보 사이트입니다. 기획·개발·데이터 수집·글 작성을 운영자가 직접 하며, 콘텐츠는 <b>${AUTHOR_NAME}</b> 이름으로 발행합니다. 우리는 축제 주최 측도, 지자체도, 관광 기관도 아닙니다. 그래서 스스로를 '공식'이라고 소개하지 않습니다.</p>
<p>대신 우리가 맡은 역할은 분명합니다. <b>여러 기관에 흩어진 공공 축제 데이터를 한곳에 모아 읽기 쉽게 정리하고, 그 데이터가 어디서 왔는지 숨기지 않는 것</b>입니다. 현장 취재로 확인하지 않은 것은 확인한 것처럼 쓰지 않습니다.</p>

<h2>2. 데이터를 어디서 가져오나요</h2>
<p>축제모아의 축제·장소 정보는 대부분 정부와 공공기관이 공개한 개방 데이터(Open API)에서 자동으로 수집합니다. 항목별 출처는 다음과 같습니다.</p>
<table class="rt" style="width:100%;border-collapse:collapse;margin:12px 0;font-size:.92rem">
<tr><th style="text-align:left;padding:8px;border-bottom:2px solid #dcefeb;background:#f4faf8">정보 항목</th><th style="text-align:left;padding:8px;border-bottom:2px solid #dcefeb;background:#f4faf8">출처</th></tr>
<tr><td style="padding:8px;border-bottom:1px solid #eef5f3">축제명·기간·장소·주소·대표 이미지·개요</td><td style="padding:8px;border-bottom:1px solid #eef5f3">한국관광공사 TourAPI (공공데이터포털)</td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #eef5f3">요금·문의 전화·공식 홈페이지 주소</td><td style="padding:8px;border-bottom:1px solid #eef5f3">한국관광공사 TourAPI 상세 정보</td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #eef5f3">반려동물 동반 가능 여부·동반 조건</td><td style="padding:8px;border-bottom:1px solid #eef5f3">한국관광공사 반려동물 동반 여행 정보</td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #eef5f3">무장애(휠체어·유아차) 접근 정보</td><td style="padding:8px;border-bottom:1px solid #eef5f3">한국관광공사 무장애 관광정보</td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #eef5f3">공휴일·연휴 날짜</td><td style="padding:8px;border-bottom:1px solid #eef5f3">한국천문연구원 특일정보 (공공데이터포털)</td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #eef5f3">걷기 여행길 코스</td><td style="padding:8px;border-bottom:1px solid #eef5f3">두루누비 걷기여행길 정보 (공공데이터포털)</td></tr>
<tr><td style="padding:8px">오일장(5일장) 장날 주기</td><td style="padding:8px">각 지자체·시장 공개 자료를 정리</td></tr>
</table>

<h2>3. 얼마나 자주 갱신하나요</h2>
<p>공공 API에서 가져오는 데이터는 <b>정기적으로 다시 내려받아 사이트 전체를 재생성</b>합니다. 모든 페이지 하단에는 그 사이트가 마지막으로 갱신된 날짜를 적어 두었습니다. 다만 갱신 주기 사이에 주최 측이 일정을 바꾸면 그 변경은 다음 갱신 때까지 반영되지 않습니다. 이것이 방문 전 재확인을 반복해서 안내하는 이유입니다.</p>
<p>블로그 가이드 글에는 <b>최초 작성일과 최종 수정일</b>을 함께 표시합니다. 인용한 정보가 바뀌었거나 오류를 확인한 경우 글을 고치고 수정일을 갱신합니다.</p>

<h2>4. 정확성의 한계 — 솔직하게 말씀드립니다</h2>
<ul>
<li><b>일정과 요금은 확정 정보가 아닙니다.</b> 공공 데이터에 등록된 시점의 예정 일정이며, 우천 취소·기간 연장·유료 전환 등은 반영이 늦을 수 있습니다.</li>
<li><b>공공 데이터 자체에 빠진 항목이 있습니다.</b> 요금이나 반려동물 동반 정보가 비어 있는 축제가 적지 않습니다. 우리는 <b>없는 값을 추측해서 채우지 않습니다.</b> 모르면 비워 두거나 "정보 없음"으로 표시합니다.</li>
<li><b>지난 축제의 정보가 남아 있을 수 있습니다.</b> 종료된 축제는 '종료' 표시로 구분하지만, 내년 일정이 아직 공개되지 않은 경우 작년 정보가 참고용으로 보일 수 있습니다.</li>
<li><b>현장 상황은 우리가 알 수 없습니다.</b> 주차장 혼잡도, 대기 시간, 당일 날씨는 사이트에서 확인할 수 없는 영역입니다.</li>
</ul>

<h2>5. 하지 않는 것</h2>
<ul>
<li><b>확인되지 않은 일정을 게재하지 않습니다.</b> 출처가 불분명한 커뮤니티 글이나 SNS 게시물만 근거로 축제 일정을 올리지 않습니다. 공공 데이터나 주최 측 공식 발표가 근거여야 합니다.</li>
<li><b>협찬 여부를 숨긴 추천을 하지 않습니다.</b> 지자체·주최 측의 요청이나 대가를 받고 작성한 글이 있다면 해당 글에 그 사실을 표시합니다. 현재까지 협찬을 받고 작성한 글은 없습니다.</li>
<li><b>가보지 않은 축제의 후기를 창작하지 않습니다.</b> "직접 가보니 좋았다" 같은 문장은 실제 경험이 있을 때만 씁니다. 그 외에는 공개된 정보를 정리한 안내라는 점이 드러나게 씁니다.</li>
<li><b>과장된 표현을 쓰지 않습니다.</b> "인생 축제", "무조건 가야 할" 같은 단정 대신 무엇이 있고 누구에게 맞는지를 씁니다.</li>
<li><b>방문객 수·규모를 근거 없이 부풀리지 않습니다.</b> 수치를 쓸 때는 어느 기관의 몇 년 자료인지 밝힙니다.</li>
</ul>

<h2>6. 잘못된 정보를 발견하셨다면</h2>
<p>정정 요청은 가장 높은 우선순위로 처리합니다. <a href="/contact/">문의 페이지</a>의 이메일로 아래 내용을 보내주세요.</p>
<ul>
<li>어느 페이지의 어떤 축제·장소인지 (가능하면 주소 링크)</li>
<li>어떤 내용이 잘못되었는지, 올바른 정보는 무엇인지</li>
<li>가능하다면 근거 (주최 측 공지 링크, 지자체 공고 등)</li>
</ul>
<p>확인 후 사실이면 즉시 수정하고 수정일을 갱신합니다. 원본 공공 데이터 자체가 틀린 경우에는 사이트에서 바로잡되, 데이터 제공 기관에도 정정을 요청합니다. 목록에 없는 축제·오일장 제보도 같은 경로로 받습니다.</p>

<h2>7. 운영 재원</h2>
<p>축제모아는 회원가입도 결제도 없는 무료 사이트입니다. 서버·도메인·데이터 운영비는 <b>광고 수익</b>으로 충당합니다. 광고는 콘텐츠와 분리되어 표시되며, <b>광고주는 어떤 축제를 싣고 어떻게 소개할지에 관여하지 않습니다.</b> 광고 때문에 특정 축제를 상단에 올리거나 부정적인 내용을 지우지 않습니다. 개인정보 처리에 관한 사항은 <a href="/privacy/">개인정보처리방침</a>에서 확인하실 수 있습니다.</p>

<div class="refs">
<h3>이 페이지에서 언급한 데이터의 출처</h3>
<ul>
${REF_NATIONAL.map(r => `<li><a href="${r[0]}" target="_blank" rel="noopener nofollow">${esc(r[1])}</a> — ${esc(r[2])}</li>`).join('\n')}
</ul>
<p class="note" style="margin:10px 0 0">축제모아는 위 기관의 개방 데이터를 이용해 만든 민간 사이트이며, 해당 기관과 제휴하거나 그 기관을 대표하지 않습니다.</p>
</div>
</article>
</div></main>`;
const editorialLd =`<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: '편집 원칙',
  description: '축제모아가 축제 정보를 어떤 공공 데이터에서 수집하고, 어떻게 갱신·검증하며, 무엇은 하지 않는지에 대한 기준',
  inLanguage: 'ko',
  dateModified: LAST_REVIEWED,
  url: SITE + EDITORIAL_URL,
  publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE + '/' }
})}</script>`;
writePage('editorial', layout(
  `편집 원칙 — 축제 정보를 어디서 가져오고 어떻게 검증하는가 | ${SITE_NAME}`,
  '축제모아가 축제 일정·요금·반려동물 동반·무장애 정보를 어떤 공공 데이터에서 수집하고 얼마나 자주 갱신하는지, 정확성의 한계와 정정 절차를 공개합니다.',
  EDITORIAL_URL, editorialContent, { jsonld: editorialLd }));

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

// 홈 요약: 한국인·외국인·급상승 TOP5 3열 + /trend/ 전체보기
function homeMini(list, cls, mode) {
  if (!list || !list.length) return '';
  const isS = mode === 'season';
  const top = isS ? list[0].idx : list[0].num;
  const span = isS ? Math.max(0.01, top - 1) : top;
  return list.slice(0, 5).map(r => {
    const v = isS ? (r.idx - 1) : r.num;
    const w = Math.max(6, Math.min(100, Math.round(v / span * 100)));
    const label = r.sido ? esc(r.sido) + ' ' + esc(r.name) : esc(r.name);
    const q = r.sido ? `/search/?sido=${encodeURIComponent(r.sido)}&sigungu=${encodeURIComponent(r.name)}`
      : `/search/?sido=${encodeURIComponent(r.name)}`;
    const val = isS ? `<em>${r.idx}배</em>` : `${(r.num / 10000).toFixed(0)}만`;
    return `<div class="rankrow mini ${cls}"><div class="no">${r.rank}</div><a class="nm" href="${q}">${label}</a><div class="bar"><i style="width:${w}%"></i></div><div class="val">${val}</div></div>`;
  }).join('');
}
const HOME_M = (visitors.season && visitors.season.month) || (new Date().getMonth() + 1);
const HOME_SEASON = (visitors.season && visitors.season.list) || [];
const visitorSection = (visitors.kor && visitors.kor.length) ? `
<h2 class="sec">🔥 사람들이 많이 가는 곳</h2>
<p class="note" style="margin-top:-2px">한국관광공사 관광 빅데이터 기준 · 지역을 누르면 그곳에서 열리는 축제를 볼 수 있어요.</p>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(272px,1fr));gap:18px;margin:14px 0 6px">
<div><div style="font-weight:800;color:#0a6c63;margin-bottom:8px">🇰🇷 한국인이 많이 가는 곳</div><div class="ranklist">${homeMini(visitors.kor, '', 'num')}</div><div style="font-size:.75rem;color:#9ca3af;margin-top:6px">${visitors.period || ''} 기준</div></div>
<div><div style="font-weight:800;color:#6d28d9;margin-bottom:8px">🌏 외국인이 많이 가는 곳</div><div class="ranklist">${homeMini(visitors.fgn, 'fgn', 'num')}</div><div style="font-size:.75rem;color:#9ca3af;margin-top:6px">${visitors.period || ''} 기준</div></div>
<div><div style="font-weight:800;color:#e0502f;margin-bottom:8px">🌞 ${HOME_M}월엔 여기가 붐벼요</div><div class="ranklist">${homeMini(HOME_SEASON, 'hot', 'season')}</div><div style="font-size:.75rem;color:#9ca3af;margin-top:6px">평소 대비 배수 · 작년 ${HOME_M}월 실적</div></div>
</div>
<p style="margin:10px 0 4px"><a href="/trend/" style="display:inline-block;background:#0f9d8f;color:#fff;font-weight:800;padding:10px 22px;border-radius:24px">인기 여행지 랭킹 전체 보기 →</a></p>` : '';

const FAQ_HOME = [
  ["이번 주말 내 주변에서 열리는 축제는 어떻게 찾나요?","축제모아 홈에서 '내 주변 축제(📍)' 버튼을 누르면 현재 위치 기준 가까운 순으로 정렬됩니다. 검색 페이지에서 지역과 날짜(이번 주말)로도 걸러 볼 수 있습니다."],
  ["2026년 여름에 갈 만한 축제는 무엇이 있나요?","7~8월에는 보령머드축제, 강릉단오제, 부산바다축제처럼 물·불꽃·야시장 축제가 많습니다. 월별 페이지에서 진행 중·예정 축제를 D-day와 함께 볼 수 있습니다."],
  ["반려견과 함께 갈 수 있는 곳도 있나요?","네. '반려견 동반' 필터와 반려동물 동반 여행지 페이지에서 동반 가능한 장소를 찾을 수 있습니다."],
  ["오일장(5일장)은 언제 서나요?","장터 페이지에서 지역별 오일장의 다음 장날을 자동으로 계산해 보여줍니다. 상설시장도 함께 표시됩니다."]
];
const FAQ_HOME_HTML = `<div class="wrap"><section class="faqbox"><h2>❓ 자주 묻는 질문</h2>${FAQ_HOME.map(q=>`<details><summary>${q[0]}</summary><p>${q[1]}</p></details>`).join('')}</section></div>`;
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
${buyBox('jangteo')}
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
<section class="explain" style="margin-top:30px">
<h2>어떤 테스트인가요</h2>
<p>축제는 취향을 많이 탑니다. 사람 많은 곳에서 신나게 노는 걸 좋아하는 사람이 있고, 조용한 곳에서 야경이나 꽃을 보며 걷는 걸 좋아하는 사람이 있습니다. 같은 주말에 같은 지역을 가도 어떤 축제를 고르느냐에 따라 만족도가 완전히 달라집니다.</p>
<p>이 테스트는 <b>네 가지 질문</b>으로 취향을 가늠해 <b>10가지 유형</b> 중 하나를 알려드리고, 그 유형에 맞는 축제 세 곳을 추천합니다. 30초면 끝나고, 결과는 링크로 친구에게 공유할 수 있습니다.</p>
<h3>이런 걸 물어봅니다</h3>
<ul>
<li>북적이는 분위기가 좋은지, 한적한 곳이 편한지</li>
<li>낮에 활동하는 편인지, 밤 풍경을 좋아하는지</li>
<li>먹거리·공연·체험 중 무엇을 우선하는지</li>
<li>가까운 곳 위주인지, 멀어도 괜찮은지</li>
</ul>
<h3>추천은 무엇을 기준으로 하나요</h3>
<p>결과 유형에 맞는 카테고리(물놀이·음악·음식·꽃·문화·불꽃·전통·빛·눈)를 골라, 지금 진행 중이거나 곧 열리는 축제 중에서 추천합니다. 축제 정보는 한국관광공사 공공데이터 기준이라 일정이 지난 축제는 빠집니다.</p>
<p>결과가 마음에 안 들면 다시 해보셔도 됩니다. 취향은 계절과 같이 가는 사람에 따라 바뀌니까요. 추천받은 축제를 눌러 상세 정보와 <a href="/trip-cost/">가는 비용</a>까지 바로 확인해 보세요.</p>
</section>
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
<div class="grid" id="fGrid">${ssrCards(apiFests.filter(f => String(f.end || '') >= TODAY.replace(/-/g, '')), 60, p => ({ title: p.title, img: p.img, loc: (p.sido || '') + ' ' + (p.sigungu || ''), desc: p.ov }))}</div>
<p class="note">데이터 출처: 한국관광공사 국문관광정보 서비스(공공데이터포털). 일정은 변동될 수 있으니 방문 전 공식 정보를 확인하세요. 축제 카드를 누르면 <strong>상세 개요·공식 홈페이지·네이버</strong>를 볼 수 있어요.</p>
<div id="fmodal" class="fmodal"><div class="fmbox">
<button class="fmx" id="fmx" aria-label="닫기">✕</button>
<img id="fm-img" class="fm-img" alt="">
<h3 id="fm-title"></h3>
<p id="fm-meta"></p>
<p id="fm-ov"></p>
<div id="fm-near"></div>
<div class="fmcalc">
<h4>🧮 여기까지 가는 비용, 얼마나 들까?</h4>
<div class="row"><input id="smc-from" type="text" placeholder="출발지 (예: 서울역, 수원시청)" autocomplete="off"><button id="smc-go" type="button">계산</button></div>
<div id="smc-out"></div>
<p class="hint">자동차(연료+통행료+주차) vs 대중교통·KTX 편도 비용 비교 · <a href="/trip-cost/" style="color:#e0502f;font-weight:700">연비·유가 바꿔서 자세히 계산 →</a></p>
</div>
${buyBox('festival')}
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
function openModal(f){var m=document.getElementById('fmodal');var img=document.getElementById('fm-img');if(f.img){img.src=f.img;img.style.display='block';}else{img.style.display='none';}document.getElementById('fm-title').textContent=f.title;document.getElementById('fm-meta').textContent=fy(f.start)+' ~ '+fy(f.end)+'  ·  '+((f.sido||'')+(f.sigungu?' '+f.sigungu:''))+(f.tel?'  ·  '+f.tel:'');document.getElementById('fm-ov').textContent=f.ov||'상세 개요는 아직 준비 중이에요. 아래 네이버·공식 홈페이지에서 확인하세요.';var nearEl=document.getElementById('fm-near');if(f.near&&f.near.length){nearEl.innerHTML='<div style="font-weight:800;color:#0a6c63;margin:16px 0 8px">📍 근처 가볼 곳</div><div style="display:flex;flex-wrap:wrap;gap:8px">'+f.near.map(function(n){return '<a href="https://search.naver.com/search.naver?query='+encodeURIComponent(n.t)+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;background:#f4faf8;border:1px solid #dcefeb;border-radius:20px;padding:6px 12px;font-size:.85rem;font-weight:700;color:#374151;text-decoration:none">'+(n.img?'<img src="'+esc(n.img)+'" style="width:22px;height:22px;border-radius:50%;object-fit:cover" onerror="this.style.display=&#39;none&#39;">':'')+esc(n.t)+' <span style="color:#9aa3af;font-weight:600">'+esc(n.ty)+(n.d?' '+n.d+'km':'')+'</span></a>';}).join('')+'</div>';}else{nearEl.innerHTML='';}var hp=document.getElementById('fm-hp');if(f.hp){hp.href=f.hp;hp.style.display='inline-block';}else{hp.style.display='none';}document.getElementById('fm-naver').href='https://search.naver.com/search.naver?query='+encodeURIComponent(f.title+' 축제');if(window.cjmResetCalc)window.cjmResetCalc('smc',window.cjmCands(f.title,window.cjmClean(f.addr),f.addr,((f.sido||'')+' '+(f.sigungu||'')).trim(),f.sigungu));m.classList.add('show');}
function closeModal(){document.getElementById('fmodal').classList.remove('show');}
document.getElementById('fmx').addEventListener('click',closeModal);
document.getElementById('fmodal').addEventListener('click',function(e){if(e.target.id==='fmodal')closeModal();});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal();});
document.getElementById('fGrid').addEventListener('click',function(e){var c=e.target.closest('.card');if(!c)return;var f=byId[c.getAttribute('data-id')];if(f)openModal(f);});
document.getElementById('fCount').textContent='불러오는 중…';
function applyQuery(){ // 인기 여행지 랭킹 등에서 넘어온 ?sido=&sigungu=&kw= 반영
  var q=new URLSearchParams(location.search), sd=q.get('sido'), sg=q.get('sigungu'), kw=q.get('kw'), touched=false;
  if(sd){var opts=document.getElementById('fSido').options;for(var i=0;i<opts.length;i++){var ov=opts[i].value;if(!ov)continue;if(ov===sd||ov.indexOf(sd)===0||sd.indexOf(ov)===0){st.sido=ov;document.getElementById('fSido').value=ov;touched=true;break;}}}
  fillSg();
  if(sg){var o2=document.getElementById('fSigungu').options;for(var j=0;j<o2.length;j++){if(o2[j].value===sg){st.sigungu=sg;document.getElementById('fSigungu').value=sg;touched=true;break;}}}
  if(kw){st.kw=kw;document.getElementById('fKw').value=kw;touched=true;}
  if(touched){st.quick='all';var bs=document.querySelectorAll('#fQuick button');for(var k=0;k<bs.length;k++)bs[k].classList.toggle('on',bs[k].getAttribute('data-q')==='all');}
}
fetch('/search/data.json').then(function(r){return r.json();}).then(function(data){F=data;byId={};F.forEach(function(f){byId[f.id]=f;});applyQuery();apply();}).catch(function(){document.getElementById('fCount').textContent='데이터를 불러오지 못했습니다. 새로고침 해주세요.';});
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
<div class="grid" id="pGrid">${ssrCards(apiPets, 60, p => ({ title: p.title, img: p.img, loc: (p.sido || '') + ' ' + (p.sigungu || ''), desc: p.cat }))}</div>
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
writePage('pet', layout('반려견 동반 여행지 — 전국 반려동물 동반 관광지·맛집·숙소 | ' + SITE_NAME, '반려동물 동반 가능한 전국 관광지·음식점·숙박·레포츠를 지역별로. 공공데이터 기반 ' + apiPets.length + '곳. 강아지와 함께 갈 곳 찾기.', '/pet/', petContent + '<script>window.CJM_BUYBOX=' + JSON.stringify(buyBox('pet')) + ';</script>'));
fs.writeFileSync(path.join(ROOT, 'pet', 'data.json'), JSON.stringify(apiPets));

// ---------- 계곡명소 ----------
if (apiValleys.length) {
  const vSidos = SIDO_ORDER.filter(s => apiValleys.some(p => p.sido === s));
  const vSidoOpts = vSidos.map(s => `<option value="${s}">${s} (${apiValleys.filter(p => p.sido === s).length})</option>`).join('');
  const valleyContent = `<main><div class="wrap">
<style>
.srchbar{background:#fff;border-radius:16px;padding:16px 18px;box-shadow:0 3px 14px rgba(31,41,55,.07);margin:14px 0 6px}
.srchbar .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.srchbar select,.srchbar input{padding:10px 13px;border:1.5px solid #cfe7f2;border-radius:12px;font-size:.93rem;font-family:inherit;background:#f2f9fc;color:#374151}
.srchbar input#vKw{flex:1;min-width:150px}
.srch-count{margin:16px 0 12px;font-weight:800;color:#0c6d9c;font-size:1.02rem}
.page-h1{font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:6px 0}
.page-sub{color:#6b7280;font-size:.95rem;margin-bottom:6px}
.vmore{background:#fff;border:1.5px solid #a9d8ec;color:#0c6d9c;border-radius:22px;padding:11px 26px;font-weight:800;font-size:.95rem;cursor:pointer;font-family:inherit;transition:all .15s}
.vmore:hover{border-color:#1288b7;transform:translateY(-1px)}
.card .vov{font-size:.82rem;color:#6b7280;margin-top:7px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
</style>
<h1 class="page-h1">💧 전국 계곡명소</h1>
<p class="page-sub">공공데이터(한국관광공사) 기반 전국 계곡 ${apiValleys.length}곳 — 여름 피서·물놀이 가기 좋은 계곡을 지역별로 찾아보세요. 카드를 누르면 상세정보와 지도·검색 링크가 열립니다.</p>
<div class="srchbar"><div class="row">
<select id="vSido"><option value="">전체 지역</option>${vSidoOpts}</select>
<select id="vSigungu"><option value="">전체 시·군·구</option></select>
<input type="text" id="vKw" placeholder="계곡명·주소 검색">
<button id="vReset" class="vmore" style="border-color:#e6eef2;color:#374151">초기화</button>
</div></div>
<div class="srch-count" id="vCount"></div>
<div class="grid" id="vGrid">${ssrCards(apiValleys, 60, p => ({ title: p.title, img: p.img, loc: (p.sido || '') + ' ' + (p.sigungu || ''), desc: p.ov }))}</div>
<div style="text-align:center;margin:22px 0"><button id="vMore" class="vmore" style="display:none">더 보기</button></div>
<p class="note">데이터 출처: 한국관광공사(공공데이터포털). 계곡 개방 여부·수심·주차·취사 가능 여부는 계절과 현장 사정에 따라 다르니 방문 전 꼭 확인하세요. 안전한 물놀이를 위해 기상·계곡 수량을 반드시 살피시기 바랍니다.</p>
</div></main>
<script>
(function(){
var P=[];var byId={};var st={sido:'',sigungu:'',kw:''};var shown=60;
function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function card(p){var loc=(p.sido||'')+(p.sigungu?' '+p.sigungu:'');var q=encodeURIComponent(p.title);var img=p.img||'/img/hero.webp';return '<a class="card" data-id="'+esc(p.id)+'" style="cursor:pointer" href="https://search.naver.com/search.naver?query='+q+'"><div class="thumb"><img loading="lazy" src="'+esc(img)+'" alt="'+esc(p.title)+'" onerror="this.src=&#39;/img/hero.webp&#39;"><span class="cat">💧 계곡</span></div><div class="card-body"><h3>'+esc(p.title)+'</h3><div class="loc">'+esc(loc)+'</div>'+(p.ov?'<div class="vov">'+esc(p.ov)+'</div>':'')+'</div></a>';}
function openValley(p){if(!window.openPlaceModal){window.open('https://search.naver.com/search.naver?query='+encodeURIComponent(p.title),'_blank','noopener');return;}var loc=(p.sido||'')+(p.sigungu?' '+p.sigungu:'');var body=p.ov?'<div style="color:#374151;font-size:.92rem;line-height:1.6">'+esc(p.ov)+'</div>':'<div style="color:#6b7280;font-size:.9rem">계곡 개방·수심·주차 정보는 방문 전 확인하세요. 여름철 급류·수량 변화에 유의하시기 바랍니다.</div>';window.openPlaceModal({img:p.img,title:p.title,meta:['💧 계곡',loc,p.tel].filter(Boolean).join('  ·  '),body:body,naver:'https://search.naver.com/search.naver?query='+encodeURIComponent(p.title),map:'https://map.naver.com/p/search/'+encodeURIComponent(p.title)});}
function filtered(){return P.filter(function(p){if(st.sido&&p.sido!==st.sido)return false;if(st.sigungu&&p.sigungu!==st.sigungu)return false;if(st.kw){var k=st.kw.toLowerCase();if((p.title||'').toLowerCase().indexOf(k)<0&&(p.addr||'').indexOf(st.kw)<0)return false;}return true;});}
function render(){var list=filtered();document.getElementById('vCount').textContent='총 '+list.length+'곳';var g=document.getElementById('vGrid');g.innerHTML=list.length?list.slice(0,shown).map(card).join(''):'<p style="grid-column:1/-1;color:#6b7280;padding:24px 0">조건에 맞는 계곡이 없어요. 지역을 바꿔보세요.</p>';document.getElementById('vMore').style.display=list.length>shown?'inline-block':'none';}
function fillSg(){var set={};P.forEach(function(p){if((!st.sido||p.sido===st.sido)&&p.sigungu)set[p.sigungu]=1;});var arr=Object.keys(set).sort();document.getElementById('vSigungu').innerHTML='<option value="">전체 시·군·구</option>'+arr.map(function(s){return '<option value="'+s+'">'+s+'</option>';}).join('');}
document.getElementById('vSido').addEventListener('change',function(e){st.sido=e.target.value;st.sigungu='';shown=60;fillSg();render();});
document.getElementById('vSigungu').addEventListener('change',function(e){st.sigungu=e.target.value;shown=60;render();});
document.getElementById('vKw').addEventListener('input',function(e){st.kw=e.target.value.trim();shown=60;render();});
document.getElementById('vReset').addEventListener('click',function(){st={sido:'',sigungu:'',kw:''};shown=60;document.getElementById('vSido').value='';document.getElementById('vKw').value='';fillSg();render();});
document.getElementById('vMore').addEventListener('click',function(){shown+=60;render();});
document.getElementById('vGrid').addEventListener('click',function(e){var c=e.target.closest('.card');if(!c||!window.openPlaceModal)return;e.preventDefault();var p=byId[c.getAttribute('data-id')];if(p)openValley(p);});
document.getElementById('vCount').textContent='불러오는 중…';
fetch('/valley/data.json').then(function(r){return r.json();}).then(function(data){P=data;byId={};P.forEach(function(p){byId[p.id]=p;});fillSg();render();}).catch(function(){document.getElementById('vCount').textContent='데이터를 불러오지 못했습니다. 새로고침 해주세요.';});
})();
</script>`;
  writePage('valley', layout('전국 계곡명소 — 여름 피서·물놀이 좋은 전국 계곡 총정리 | ' + SITE_NAME, '여름 피서·물놀이 가기 좋은 전국 계곡 ' + apiValleys.length + '곳을 지역별로. 공공데이터 기반 계곡 명소 정보와 지도.', '/valley/', valleyContent + '<script>window.CJM_BUYBOX=' + JSON.stringify(buyBox('valley')) + ';</script>'));
  fs.writeFileSync(path.join(ROOT, 'valley', 'data.json'), JSON.stringify(apiValleys));
// ---------- 계절 명소(단풍·꽃·온천) — 범용 루프 ----------
const SPOT_THEMES = [
  { data: apiMaple, slug: 'maple', title: '전국 단풍 명소 — 가을 산·단풍 여행 명소 총정리 | ' + SITE_NAME,
    metaDesc: '가을 단풍 구경 좋은 전국 산·단풍 명소를 지역별로. 공공데이터 기반 단풍 명소 정보와 지도.',
    h1: '🍁 전국 단풍 명소', catLabel: '🍁 단풍', accent: '#c2410c', bd: '#f0c9a6', bg: '#fdf5ee', ph: '산·명소명·주소 검색',
    sub: '공공데이터(한국관광공사) 기반 전국 산·단풍 명소 __N__곳 — 가을 단풍 구경 좋은 곳을 지역별로 찾아보세요. 카드를 누르면 상세정보와 지도·검색 링크가 열립니다.',
    note: '데이터 출처: 한국관광공사(공공데이터포털). 단풍 절정 시기는 해마다·고도에 따라 다르니 방문 전 단풍 예상 시기를 확인하세요.' },
  { data: apiFlower, slug: 'flower', title: '전국 봄꽃·정원 명소 — 벚꽃·수목원·꽃구경 명소 총정리 | ' + SITE_NAME,
    metaDesc: '봄 꽃구경·정원 나들이 좋은 전국 수목원·꽃 명소를 지역별로. 공공데이터 기반 정보와 지도.',
    h1: '🌸 전국 봄꽃·정원 명소', catLabel: '🌸 봄꽃·정원', accent: '#db2777', bd: '#f4c6dc', bg: '#fdf2f8', ph: '수목원·명소명·주소 검색',
    sub: '공공데이터(한국관광공사) 기반 전국 수목원·정원 __N__곳 — 봄 꽃구경·나들이 좋은 곳을 지역별로 찾아보세요. 카드를 누르면 상세정보와 지도·검색 링크가 열립니다.',
    note: '데이터 출처: 한국관광공사(공공데이터포털). 꽃 개화 시기는 해마다 날씨에 따라 크게 달라지니 방문 전 개화 상황을 확인하세요.' },
  { data: apiOnsen, slug: 'onsen', title: '전국 온천·스파 명소 — 겨울 온천 여행지 총정리 | ' + SITE_NAME,
    metaDesc: '겨울 온천 여행·찜질하기 좋은 전국 온천·스파를 지역별로. 공공데이터 기반 온천 명소 정보와 지도.',
    h1: '♨️ 전국 온천·스파 명소', catLabel: '♨️ 온천·스파', accent: '#0369a1', bd: '#bcdcec', bg: '#eff8fc', ph: '온천·명소명·주소 검색',
    sub: '공공데이터(한국관광공사) 기반 전국 온천·스파 __N__곳 — 겨울에 몸 녹이기 좋은 온천을 지역별로 찾아보세요. 카드를 누르면 상세정보와 지도·검색 링크가 열립니다.',
    note: '데이터 출처: 한국관광공사(공공데이터포털). 운영시간·요금·휴관일은 계절과 시설 사정에 따라 다르니 방문 전 꼭 확인하세요.' },
];
SPOT_THEMES.forEach(function (T) {
  if (!T.data.length) return;
  const sidos = SIDO_ORDER.filter(s => T.data.some(p => p.sido === s));
  const sidoOpts = sidos.map(s => `<option value="${s}">${s} (${T.data.filter(p => p.sido === s).length})</option>`).join('');
  const sub = T.sub.replace('__N__', T.data.length);
  const content = `<main><div class="wrap">
<style>
.srchbar{background:#fff;border-radius:16px;padding:16px 18px;box-shadow:0 3px 14px rgba(31,41,55,.07);margin:14px 0 6px}
.srchbar .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.srchbar select,.srchbar input{padding:10px 13px;border:1.5px solid ${T.bd};border-radius:12px;font-size:.93rem;font-family:inherit;background:${T.bg};color:#374151}
.srchbar input#sKw{flex:1;min-width:150px}
.srch-count{margin:16px 0 12px;font-weight:800;color:${T.accent};font-size:1.02rem}
.page-h1{font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:6px 0}
.page-sub{color:#6b7280;font-size:.95rem;margin-bottom:6px}
.smore{background:#fff;border:1.5px solid ${T.bd};color:${T.accent};border-radius:22px;padding:11px 26px;font-weight:800;font-size:.95rem;cursor:pointer;font-family:inherit;transition:all .15s}
.smore:hover{border-color:${T.accent};transform:translateY(-1px)}
.card .sov{font-size:.82rem;color:#6b7280;margin-top:7px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
</style>
<h1 class="page-h1">${T.h1}</h1>
<p class="page-sub">${sub}</p>
<div class="srchbar"><div class="row">
<select id="sSido"><option value="">전체 지역</option>${sidoOpts}</select>
<select id="sSigungu"><option value="">전체 시·군·구</option></select>
<input type="text" id="sKw" placeholder="${T.ph}">
<button id="sReset" class="smore" style="border-color:#e6eef2;color:#374151">초기화</button>
</div></div>
<div class="srch-count" id="sCount"></div>
<div class="grid" id="sGrid">${ssrCards(T.data, 60, p => ({ title: p.title, img: p.img, loc: (p.sido || '') + ' ' + (p.sigungu || ''), desc: p.ov }))}</div>
<div style="text-align:center;margin:22px 0"><button id="sMore" class="smore" style="display:none">더 보기</button></div>
<p class="note">${T.note} 카드를 누르면 상세정보와 지도·검색 링크가 표시됩니다.</p>
</div></main>
<script>
(function(){
var P=[];var byId={};var st={sido:'',sigungu:'',kw:''};var shown=60;
var CATLABEL=${JSON.stringify(T.catLabel)};var DURL='/'+${JSON.stringify(T.slug)}+'/data.json';
function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function card(p){var loc=(p.sido||'')+(p.sigungu?' '+p.sigungu:'');var q=encodeURIComponent(p.title);var img=p.img||'/img/hero.webp';return '<a class="card" data-id="'+esc(p.id)+'" style="cursor:pointer" href="https://search.naver.com/search.naver?query='+q+'"><div class="thumb"><img loading="lazy" src="'+esc(img)+'" alt="'+esc(p.title)+'" onerror="this.src=&#39;/img/hero.webp&#39;"><span class="cat">'+CATLABEL+'</span></div><div class="card-body"><h3>'+esc(p.title)+'</h3><div class="loc">'+esc(loc)+'</div>'+(p.ov?'<div class="sov">'+esc(p.ov)+'</div>':'')+'</div></a>';}
function openSpot(p){if(!window.openPlaceModal){window.open('https://search.naver.com/search.naver?query='+encodeURIComponent(p.title),'_blank','noopener');return;}var loc=(p.sido||'')+(p.sigungu?' '+p.sigungu:'');var body=p.ov?'<div style="color:#374151;font-size:.92rem;line-height:1.6">'+esc(p.ov)+'</div>':'<div style="color:#6b7280;font-size:.9rem">운영·요금·시기 정보는 방문 전 확인하세요.</div>';window.openPlaceModal({img:p.img,title:p.title,meta:[CATLABEL,loc,p.tel].filter(Boolean).join('  ·  '),body:body,naver:'https://search.naver.com/search.naver?query='+encodeURIComponent(p.title),map:'https://map.naver.com/p/search/'+encodeURIComponent(p.title)});}
function filtered(){return P.filter(function(p){if(st.sido&&p.sido!==st.sido)return false;if(st.sigungu&&p.sigungu!==st.sigungu)return false;if(st.kw){var k=st.kw.toLowerCase();if((p.title||'').toLowerCase().indexOf(k)<0&&(p.addr||'').indexOf(st.kw)<0)return false;}return true;});}
function render(){var list=filtered();document.getElementById('sCount').textContent='총 '+list.length+'곳';var g=document.getElementById('sGrid');g.innerHTML=list.length?list.slice(0,shown).map(card).join(''):'<p style="grid-column:1/-1;color:#6b7280;padding:24px 0">조건에 맞는 곳이 없어요. 지역을 바꿔보세요.</p>';document.getElementById('sMore').style.display=list.length>shown?'inline-block':'none';}
function fillSg(){var set={};P.forEach(function(p){if((!st.sido||p.sido===st.sido)&&p.sigungu)set[p.sigungu]=1;});var arr=Object.keys(set).sort();document.getElementById('sSigungu').innerHTML='<option value="">전체 시·군·구</option>'+arr.map(function(s){return '<option value="'+s+'">'+s+'</option>';}).join('');}
document.getElementById('sSido').addEventListener('change',function(e){st.sido=e.target.value;st.sigungu='';shown=60;fillSg();render();});
document.getElementById('sSigungu').addEventListener('change',function(e){st.sigungu=e.target.value;shown=60;render();});
document.getElementById('sKw').addEventListener('input',function(e){st.kw=e.target.value.trim();shown=60;render();});
document.getElementById('sReset').addEventListener('click',function(){st={sido:'',sigungu:'',kw:''};shown=60;document.getElementById('sSido').value='';document.getElementById('sKw').value='';fillSg();render();});
document.getElementById('sMore').addEventListener('click',function(){shown+=60;render();});
document.getElementById('sGrid').addEventListener('click',function(e){var c=e.target.closest('.card');if(!c||!window.openPlaceModal)return;e.preventDefault();var p=byId[c.getAttribute('data-id')];if(p)openSpot(p);});
document.getElementById('sCount').textContent='불러오는 중…';
fetch(DURL).then(function(r){return r.json();}).then(function(data){P=data;byId={};P.forEach(function(p){byId[p.id]=p;});fillSg();render();}).catch(function(){document.getElementById('sCount').textContent='데이터를 불러오지 못했습니다. 새로고침 해주세요.';});
})();
</script>`;
  writePage(T.slug, layout(T.title, T.metaDesc, '/' + T.slug + '/', content + '<script>window.CJM_BUYBOX=' + JSON.stringify(buyBox(T.slug)) + ';</script>'));
  fs.writeFileSync(path.join(ROOT, T.slug, 'data.json'), JSON.stringify(T.data));
});

}


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
<div class="grid" id="fGrid">${ssrCards(apiFestsEn.filter(f => String(f.end || '') >= TODAY.replace(/-/g, '')), 40, p => ({ title: p.title, img: p.img, loc: p.region || '', desc: p.ov }))}</div>
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
(function(){var q=new URLSearchParams(location.search),kw=q.get('kw'),rg=q.get('region');if(kw){st.kw=kw;var e1=document.getElementById('fKw');if(e1)e1.value=kw;}if(rg){st.region=rg;var e2=document.getElementById('fSido');if(e2)e2.value=rg;}if(kw||rg){st.quick='all';var bs=document.querySelectorAll('#fQuick button');for(var i=0;i<bs.length;i++)bs[i].classList.toggle('on',bs[i].getAttribute('data-q')==='all');}})();fetch('/en/search/data.json').then(function(r){return r.json();}).then(function(data){F=data;byId={};F.forEach(function(f){byId[f.id]=f;});apply();}).catch(function(){document.getElementById('fCount').textContent='Failed to load data.';});
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
<h2 class="sec">Upcoming festivals</h2>
${ssrCards(apiFestsEn.filter(f => String(f.end || '') >= TODAY.replace(/-/g, '')).sort((a,b)=>String(a.start).localeCompare(String(b.start))), 24, p => ({ title: p.title, img: p.img, loc: p.region || '', desc: p.ov })) ? '<div class="grid">' + ssrCards(apiFestsEn.filter(f => String(f.end || '') >= TODAY.replace(/-/g, '')).sort((a,b)=>String(a.start).localeCompare(String(b.start))), 24, p => ({ title: p.title, img: p.img, loc: p.region || '', desc: p.ov })) + '</div>' : ''}
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
<div class="grid" id="fGrid">${ssrCards(data.filter(f => String(f.end || '') >= TODAY.replace(/-/g, '')), 40, p => ({ title: p.title, img: p.img, loc: p.region || '', desc: p.ov }))}</div>
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
(function(){var q=new URLSearchParams(location.search),kw=q.get('kw'),rg=q.get('region');if(kw){st.kw=kw;var e1=document.getElementById('fKw');if(e1)e1.value=kw;}if(rg){st.region=rg;var e2=document.getElementById('fSido');if(e2)e2.value=rg;}if(kw||rg){st.quick='all';var bs=document.querySelectorAll('#fQuick button');for(var i=0;i<bs.length;i++)bs[i].classList.toggle('on',bs[i].getAttribute('data-q')==='all');}})();fetch('/${lang}/search/data.json').then(function(r){return r.json();}).then(function(data){F=data;byId={};F.forEach(function(f){byId[f.id]=f;});apply();}).catch(function(){document.getElementById('fCount').textContent=LBL.fail;});
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
<h2 class="sec">${L.upcoming || "Upcoming festivals"}</h2>
${ssrCards(data.filter(f => String(f.end || '') >= TODAY.replace(/-/g, '')).sort((a,b)=>String(a.start).localeCompare(String(b.start))), 24, p => ({ title: p.title, img: p.img, loc: p.region || '', desc: p.ov })) ? '<div class="grid">' + ssrCards(data.filter(f => String(f.end || '') >= TODAY.replace(/-/g, '')).sort((a,b)=>String(a.start).localeCompare(String(b.start))), 24, p => ({ title: p.title, img: p.img, loc: p.region || '', desc: p.ov })) + '</div>' : ''}
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
<div class="grid" id="aGrid">${ssrCards(apiAccessible, 60, p => ({ title: p.title, img: p.img, loc: (p.sido || '') + ' ' + (p.sigungu || ''), desc: p.cat }))}</div>
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
  writePage('accessible', layout('무장애 여행지 — 휠체어·유아차·고령자 접근 가능 관광지 | ' + SITE_NAME, '휠체어·유아차·고령자도 편하게 갈 수 있는 전국 무장애 관광지·문화시설·맛집·숙소를 지역별로. 공공데이터 기반 ' + apiAccessible.length.toLocaleString() + '곳.', '/accessible/', accContent + '<script>window.CJM_BUYBOX=' + JSON.stringify(buyBox('trails')) + ';</script>'));
  fs.writeFileSync(path.join(ROOT, 'accessible', 'data.json'), JSON.stringify(apiAccessible));
}

// ---------- 걷기길 노선별 페이지 (/trails/{slug}/) ----------
let trailRoutes = [];
try { trailRoutes = require('./data/trail_routes.json'); } catch (e) {}
const ROUTE_SLUG = { '해파랑길': 'haeparang', '남파랑길': 'namparang', '서해랑길': 'seohaerang', 'DMZ 평화의 길': 'dmz', 'DMZ': 'dmz' };
const ROUTE_META = {
  '해파랑길': { emoji: '🌅', color: '#e0502f', bg: '#fff6f3', bd: '#ffd9cf', tag: '동해안' },
  '남파랑길': { emoji: '🌊', color: '#0c6d9c', bg: '#f2f9fc', bd: '#cfe7f2', tag: '남해안' },
  '서해랑길': { emoji: '🌇', color: '#b45309', bg: '#fdf7ee', bd: '#f0dcc0', tag: '서해안' },
  'DMZ': { emoji: '🕊️', color: '#0a6c63', bg: '#f2faf8', bd: '#cfe9e3', tag: '접경지역' }
};
// 코스명에서 번호 추출 → 정렬용 (해파랑길 29코스 → 29)
function crsNo(n) {
  const m = String(n || '').match(/(\d+)\s*코스/);
  return m ? +m[1] : 999;
}
function levelChip(lv) {
  const c = { '쉬움': '#15803d', '보통': '#0d9488', '어려움': '#b45309', '매우 어려움': '#b91c1c' }[lv] || '#374151';
  return `<span class="chip" style="color:${c}">🥾 ${esc(lv || '-')}</span>`;
}
function hrs(m) { if (!m) return ''; const h = m / 60; return h >= 1 ? ('약 ' + (h % 1 === 0 ? h : h.toFixed(1)) + '시간') : (m + '분'); }
const TRAIL_URLS = [];


// ---------- 시도별 인기 여행지 랭킹 (/trend/{slug}/) ----------
let rlte = { bySido: {} };
try { rlte = require('./data/rlte.json'); } catch (e) {}
const SIDO_SLUG = {};
const SIDO_FULL = { 서울: '서울특별시', 부산: '부산광역시', 대구: '대구광역시', 인천: '인천광역시', 광주: '광주광역시', 대전: '대전광역시', 울산: '울산광역시', 세종: '세종특별자치시', 경기: '경기도', 충북: '충청북도', 충남: '충청남도', 전남: '전라남도', 경북: '경상북도', 경남: '경상남도', 제주: '제주특별자치도', 강원: '강원특별자치도', 전북: '전북특별자치도' };
Object.keys(visitors.bySido || {}).forEach(nm => { SIDO_SLUG[nm] = romanizeRegion(nm).toLowerCase().replace(/[^a-z]/g, ''); });
const SIDO_URLS = [];

// 그 지역 축제 카드(공공데이터 apiFests 기준, 진행중·예정만)
function sidoFestCard(f) {
  const img = f.img ? String(f.img).replace(/^http:/, 'https:') : '/img/cat-culture.webp';
  const fy = y => y ? y.slice(0, 4) + '.' + (+y.slice(4, 6)) + '.' + (+y.slice(6, 8)) : '';
  return `<div class="card" data-name="${escA(f.title)}" data-start="${f.start}" data-end="${f.end}" data-region="${escA(f.sido || '')}" data-city="${escA(f.sigungu || '')}" data-place="${escA(f.addr || '')}" data-img="${escA(img)}"${f.ov ? ` data-ov="${escA(f.ov)}"` : ''}${f.hp ? ` data-hp="${escA(f.hp)}"` : ''}>
  <div class="thumb"><img src="${esc(img)}" alt="${esc(f.title)}" loading="lazy" onerror="this.src='/img/cat-culture.webp'"><span class="dday"></span></div>
  <div class="card-body"><h3>${esc(f.title)}</h3>
  <p class="date">📅 ${fy(f.start)} ~ ${fy(f.end)}</p>
  <p class="loc">📍 ${esc((f.sido || '') + ' ' + (f.sigungu || ''))}</p></div>
</div>`;
}
function spotChips(list, emoji, href) {
  if (!list.length) return '';
  return `<div class="spotchips">` + list.slice(0, 8).map(p =>
    `<a href="${href}" class="spotchip">${emoji} ${esc(p.title)}<span>${esc(p.sigungu || '')}</span></a>`).join('') + `</div>`;
}

// ---------- 전국 걷기길: 브랜드별 / 지역별 (/trails/{brand}/, /trails/area/{sido}/) ----------
let stret = [];
try { stret = require('./data/stret.json'); } catch (e) {}
let WG = { brands: [], rest: [], korea: [] };
try { if (stret.length) WG = require('./walkgroups').group(stret); } catch (e) { console.error('walkgroups 실패:', e.message); }
const WALK_URLS = [];

// 길 카드 한 장 (아코디언)
function walkCard(t, i) {
  const spots = (t.spots || []).slice(0, 24);
  return `<details class="crs">
<summary>
  <span class="crs-no">${i + 1}</span>
  <span class="crs-nm">${esc(t.name)}</span>
  <span class="crs-meta">${t.kmOk ? t.km + 'km' : ''}${t.time ? (t.kmOk ? ' · ' : '') + esc(t.time) : ''}</span>
</summary>
<div class="crs-body">
  <div class="meta">${t.sido ? `<span class="chip">📍 ${esc(t.sido)}${t.sigungu ? ' ' + esc(t.sigungu) : ''}</span>` : ''}${t.kmOk ? `<span class="chip">📏 ${t.km}km</span>` : ''}${t.time ? `<span class="chip">⏱ ${esc(t.time)}</span>` : ''}</div>
  ${t.intro ? `<p>${esc(t.intro)}</p>` : ''}
  ${(t.begin || t.end) ? `<p class="crs-se"><b>시작</b> ${esc(t.begin || '-')} &nbsp;→&nbsp; <b>도착</b> ${esc(t.end || '-')}${t.addr ? `<br><span class="ad">${esc(t.addr)}</span>` : ''}</p>` : ''}
  ${spots.length ? `<p class="crs-tour"><b>지나는 곳</b><br>${spots.map(s => esc(s)).join(' › ')}</p>` : ''}
  <p class="crs-links"><a href="https://search.naver.com/search.naver?query=${encodeURIComponent(t.name)}" target="_blank" rel="noopener">🔎 검색</a>
  <a href="https://map.naver.com/p/search/${encodeURIComponent(t.begin || t.name)}" target="_blank" rel="noopener">🗺️ 시작점 지도</a>
  ${t.sido ? `<a href="/search/?sido=${encodeURIComponent(t.sido)}">🎪 이 지역 축제</a>` : ''}</p>
  ${(t.org || t.tel) ? `<p class="crs-org">${esc(t.org || '')}${t.tel ? ' · ' + esc(t.tel) : ''}${t.updated ? ' · 기준 ' + esc(t.updated) : ''}</p>` : ''}
</div>
</details>`;
}
const WALK_CSS = `<style>
.crs{background:#fff;border:1px solid #e9f2ef;border-radius:12px;margin:7px 0;overflow:hidden}
.crs[open]{border-color:#a9e5dd;box-shadow:0 3px 12px rgba(31,41,55,.07)}
.crs summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:11px;padding:13px 16px}
.crs summary::-webkit-details-marker{display:none}
.crs summary:hover{background:#f4faf8}
.crs-no{flex:none;width:30px;height:30px;border-radius:50%;background:#effaf8;color:#0a6c63;font-weight:900;font-size:.85rem;display:flex;align-items:center;justify-content:center;border:1px solid #dcefeb}
.crs-nm{flex:1;font-weight:800;font-size:.98rem;color:#1f2937;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.crs-meta{flex:none;font-size:.83rem;color:#9aa3af;font-weight:700}
.crs-body{padding:2px 16px 16px;border-top:1px solid #f1f6f4}
.crs-body p{font-size:.92rem;color:#4b5563;line-height:1.75;margin:9px 0}
.crs-body .meta{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 4px}
.crs-body .chip{font-size:.78rem;font-weight:700;color:#374151;background:#f4faf8;border:1px solid #dcefeb;border-radius:20px;padding:3px 10px}
.crs-se{background:#f4faf8;border-radius:10px;padding:11px 13px}
.crs-se .ad{color:#9aa3af;font-size:.85rem}
.crs-tour{background:#f9fafb;border-radius:10px;padding:11px 13px;font-size:.88rem;line-height:1.8}
.crs-org{color:#9ca3af;font-size:.8rem}
.crs-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px!important}
.crs-links a{font-size:.85rem;font-weight:700;color:#0a6c63;border:1.5px dashed #dcefeb;border-radius:9px;padding:7px 13px}
.crs-links a:hover{background:#f4faf8}
@media(max-width:600px){.crs summary{padding:11px 12px;gap:9px}.crs-meta{display:none}}
</style>`;

// 브랜드/지역 공통 페이지 생성기
function writeWalkPage(o) {
  const km = Math.round(o.items.reduce((a, t) => a + (t.kmOk ? t.km : 0), 0));
  const sidos = [...new Set(o.items.map(t => t.sido).filter(Boolean))];
  const gus = [...new Set(o.items.map(t => t.sigungu).filter(Boolean))];
  const sorted = [...o.items].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
  const content = `<main><div class="wrap">
${WALK_CSS}
<p class="crumb"><a href="/trails/">🥾 걷기 여행</a> › ${esc(o.title)}</p>
<h1 style="font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:6px 0 4px">${o.emoji} ${esc(o.title)}</h1>
<p class="note" style="margin-top:0">${o.lead}</p>
<div class="rt-stats" style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 4px">
<span>코스 <b>${o.items.length}개</b></span>${km ? `<span>총 거리 <b>${km.toLocaleString()}km</b></span>` : ''}${sidos.length > 1 ? `<span>지역 <b>${sidos.length}개 시·도</b></span>` : (gus.length ? `<span>지역 <b>${gus.length}개 시·군·구</b></span>` : '')}
</div>
<h2 class="sec">코스 안내 <span style="font-size:.9rem;font-weight:600;color:#9aa3af">${o.items.length}개 · 눌러서 펼치기</span></h2>
<p class="note" style="margin-top:-4px">각 코스를 누르면 소개와 거리·소요 시간, 시작·도착 지점, 지나는 곳이 나옵니다.</p>
${sorted.map(walkCard).join('\n')}
${buyBox('trails')}
${o.nav}
<p class="note" style="margin-top:18px">데이터 출처: 행정안전부 <b>전국길관광정보 표준데이터</b>(공공데이터포털) — 각 지자체·관리기관이 등록한 정보입니다. 코스 통제·우회는 방문 전 관리기관에 확인하세요.</p>
</div></main>`;
  const ld = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'ItemList', name: o.title,
    numberOfItems: sorted.length,
    itemListElement: sorted.slice(0, 50).map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name }))
  })}</script>`;
  writePage(o.path, layout(o.title2, o.desc, '/' + o.path + '/', content, { jsonld: ld }));
  WALK_URLS.push('/' + o.path + '/');
}

// 내비게이션 조각
function walkNav(curBrand, curSido) {
  const bs = WG.brands.map(b => b.slug === curBrand
    ? `<span class="on">${b.emoji} ${esc(b.label)}</span>`
    : `<a href="/trails/${b.slug}/">${b.emoji} ${esc(b.label)}</a>`).join('');
  const areaSidos = [...new Set(WG.rest.map(t => t.sido).filter(Boolean))].sort();
  const as = areaSidos.map(s => s === curSido
    ? `<span class="on">${esc(s)}</span>`
    : `<a href="/trails/area/${SIDO_SLUG[s] || romanizeRegion(s).toLowerCase()}/">${esc(s)}</a>`).join('');
  return `<h2 class="sec">이름난 길</h2><div class="sidonav">${bs}</div>
<h2 class="sec">지역별 걷기길</h2><div class="sidonav">${as}</div>
<p style="margin:14px 0 4px"><a href="/trails/" style="display:inline-block;background:#0f9d8f;color:#fff;font-weight:800;padding:10px 22px;border-radius:24px">🥾 걷기 여행 전체 보기 →</a></p>`;
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
<style>
.rt-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin:14px 0 6px}
.rt-card{display:block;background:#fff;border:1.5px solid #e9f2ef;border-radius:16px;padding:17px 19px;transition:all .18s}
.rt-card:hover{transform:translateY(-3px);box-shadow:0 8px 22px rgba(31,41,55,.11)}
.rt-card .e{font-size:1.7rem;display:block;margin-bottom:6px}
.rt-card b{display:block;font-size:1.08rem;font-weight:900;letter-spacing:-.02em;margin-bottom:3px}
.rt-card .ln{font-size:.86rem;color:#6b7280;line-height:1.5;display:block;margin-bottom:8px}
.rt-card .st{font-size:.8rem;color:#9aa3af;font-weight:700}
</style>
<div class="rt-cards">${(() => {
  const TH = [...new Set(apiTrails.map(t => t.theme).filter(Boolean))];
  return TH.map(x => {
    const M = ROUTE_META[x] || { emoji: '🥾', color: '#0f9d8f', bd: '#dcefeb' };
    const L = apiTrails.filter(t => t.theme === x);
    const km = Math.round(L.reduce((a, b) => a + (+b.dist || 0), 0));
    const xk = x.replace(/\s/g, '');
    const info = trailRoutes.find(r => { const k = r.name.replace(/\s/g, ''); return k === xk || k.startsWith(xk) || xk.startsWith(k); });
    return `<a class="rt-card" href="/trails/${ROUTE_SLUG[x] || ''}/" style="border-color:${M.bd}">
<span class="e">${M.emoji}</span><b style="color:${M.color}">${esc((info && info.name) || x)}</b>
<span class="ln">${esc(info && info.line ? info.line : M.tag + ' 걷기길')}</span>
<span class="st">${L.length}개 코스 · ${km.toLocaleString()}km</span></a>`;
  }).join('');
})()}</div>
<p class="note" style="margin:8px 0 2px">길 이름을 누르면 <b>코스별 거리·소요 시간·난이도와 구간 설명</b>을 볼 수 있어요. 아래에서는 전체 코스를 조건으로 검색할 수 있습니다.</p>
${(() => {   /* 걷기길 허브 섹션 — 표준데이터 기반 이름난 길·지역별 */
  if (!WG.brands.length) return '';
  const bcards = WG.brands.map(b => {
    const km = Math.round(b.items.reduce((a, t) => a + (t.kmOk ? t.km : 0), 0));
    return `<a class="rt-card" href="/trails/${b.slug}/">
<span class="e">${b.emoji}</span><b>${esc(b.label)}</b>
<span class="ln">${esc(b.region || '')}</span>
<span class="st">${b.items.length}개 코스${km ? ' · ' + km.toLocaleString() + 'km' : ''}</span></a>`;
  }).join('');
  const sidos = [...new Set(WG.rest.map(t => t.sido).filter(Boolean))].sort();
  const areas = sidos.map(x => {
    const c = WG.rest.filter(t => t.sido === x).length;
    return `<a href="/trails/area/${SIDO_SLUG[x] || romanizeRegion(x).toLowerCase()}/">${esc(x)} <b style="color:#0f9d8f">${c}</b></a>`;
  }).join('');
  const totalW = WG.brands.reduce((a, b) => a + b.items.length, 0) + WG.rest.length;
  return `<h2 class="sec">🚶 이름난 길</h2>
<p class="note" style="margin-top:-4px">제주올레·갈맷길처럼 이름이 붙은 길은 따로 모았어요. 코리아둘레길 외에도 전국에 <b>${totalW.toLocaleString()}개</b>의 길이 있습니다.</p>
<div class="rt-cards">${bcards}</div>
<h2 class="sec">📍 지역별 걷기길</h2>
<p class="note" style="margin-top:-4px">동네 둘레길·산책로·숲길을 시·도별로 모았습니다.</p>
<div class="sidonav">${areas}</div>`;
})()}
<p class="page-sub">공공데이터(두루누비) 기반 전국 걷기여행 코스 ${apiTrails.length}개 — 해파랑길·서해랑길·남파랑길·DMZ 평화의길 등. 거리·난이도·지역으로 나에게 맞는 코스를 찾아보세요.</p>
<div class="srchbar"><div class="row">
<select id="tTheme"><option value="">전체 길</option>${trThemeOpts}</select>
<select id="tSido"><option value="">전체 지역</option>${trSidoOpts}</select>
<select id="tLevel"><option value="">전체 난이도</option>${trLevelOpts}</select>
<input type="text" id="tKw" placeholder="코스명·지역 검색">
<button id="tReset" class="pmore" style="border-color:#f0e6dc;color:#374151">초기화</button>
</div></div>
<div class="srch-count" id="tCount"></div>
<div class="trgrid" id="tGrid">${ssrCards(apiTrails, 60, p => ({ title: p.name, loc: p.sigun || p.sido, desc: p.summary }))}</div>
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
  writePage('trails', layout('걷기 여행 — 전국 걷기길 코스(해파랑길·서해랑길·남파랑길) | ' + SITE_NAME, '전국 걷기여행 코스를 거리·난이도·지역별로. 두루누비 공공데이터 기반 ' + apiTrails.length + '개 코스 — 해파랑길·서해랑길·남파랑길·DMZ 평화의길.', '/trails/', trailContent + '<script>window.CJM_BUYBOX=' + JSON.stringify(buyBox('trails')) + ';</script>'));
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

if (apiTrails.length) {
  const themes = [...new Set(apiTrails.map(t => t.theme).filter(Boolean))];
  themes.forEach(TH => {
    const slug = ROUTE_SLUG[TH] || romanizeRegion(TH).toLowerCase().replace(/[^a-z]/g, '');
    const M = ROUTE_META[TH] || { emoji: '🥾', color: '#0f9d8f', bg: '#f4faf8', bd: '#dcefeb', tag: '걷기길' };
    const key = TH.replace(/\s/g, '');
    const info = trailRoutes.find(r => { const k = r.name.replace(/\s/g, ''); return k === key || k.startsWith(key) || key.startsWith(k); });
    const TITLE = (info && info.name) || TH;   // 공식 노선명 우선(예: 'DMZ' → 'DMZ 평화의 길')
    const list = apiTrails.filter(t => t.theme === TH).sort((a, b) => crsNo(a.name) - crsNo(b.name));
    const totalKm = Math.round(list.reduce((s, t) => s + (+t.dist || 0), 0));
    const totalH = Math.round(list.reduce((s, t) => s + (+t.min || 0), 0) / 60);
    const sidos = [...new Set(list.map(t => t.sido).filter(Boolean))];
    const guides = [...new Set(list.map(t => t.sigun).filter(Boolean))];

    const courseCards = list.map(t => `<details class="crs">
<summary>
  <span class="crs-no">${crsNo(t.name) === 999 ? '·' : crsNo(t.name)}</span>
  <span class="crs-nm">${esc(t.name)}</span>
  <span class="crs-meta">${t.dist ? t.dist + 'km' : ''}${t.min ? ' · ' + hrs(t.min) : ''}</span>
</summary>
<div class="crs-body">
  <div class="meta">${t.sigun ? `<span class="chip">📍 ${esc(t.sigun)}</span>` : ''}${t.dist ? `<span class="chip">📏 ${t.dist}km</span>` : ''}${t.min ? `<span class="chip">⏱ ${hrs(t.min)}</span>` : ''}${levelChip(t.level)}${t.cycle ? `<span class="chip">${esc(t.cycle)}</span>` : ''}</div>
  ${t.summary ? `<p class="crs-sum">${esc(t.summary)}</p>` : ''}
  ${t.desc ? `<p>${esc(t.desc)}</p>` : ''}
  ${t.tour ? `<p class="crs-tour"><b>주변 볼거리</b><br>${esc(t.tour)}</p>` : ''}
  <p class="crs-links"><a href="https://search.naver.com/search.naver?query=${encodeURIComponent(t.name)}" target="_blank" rel="noopener">🔎 코스 검색</a>
  <a href="https://map.naver.com/p/search/${encodeURIComponent(t.name)}" target="_blank" rel="noopener">🗺️ 지도</a>
  ${t.sigun ? `<a href="/search/?sido=${encodeURIComponent(t.sido || '')}">🎪 이 지역 축제</a>` : ''}</p>
</div>
</details>`).join('\n');

    const content = `<main><div class="wrap">
<style>
.rt-hero{background:${M.bg};border:1.5px solid ${M.bd};border-radius:18px;padding:22px 24px;margin:10px 0 6px}
.rt-hero h1{font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:0 0 4px;color:${M.color}}
.rt-hero .line{font-size:1rem;font-weight:700;color:#374151;margin-bottom:10px}
.rt-hero p{font-size:.93rem;color:#4b5563;line-height:1.75;margin:6px 0}
.rt-stats{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.rt-stats span{background:#fff;border:1px solid ${M.bd};border-radius:20px;padding:7px 14px;font-size:.86rem;font-weight:700;color:#374151}
.rt-stats b{color:${M.color}}
.crs{background:#fff;border:1px solid #e9f2ef;border-radius:12px;margin:7px 0;overflow:hidden}
.crs[open]{border-color:${M.bd};box-shadow:0 3px 12px rgba(31,41,55,.07)}
.crs summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:11px;padding:13px 16px}
.crs summary::-webkit-details-marker{display:none}
.crs summary:hover{background:${M.bg}}
.crs-no{flex:none;width:30px;height:30px;border-radius:50%;background:${M.bg};color:${M.color};font-weight:900;font-size:.85rem;display:flex;align-items:center;justify-content:center;border:1px solid ${M.bd}}
.crs-nm{flex:1;font-weight:800;font-size:.98rem;color:#1f2937;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.crs-meta{flex:none;font-size:.83rem;color:#9aa3af;font-weight:700}
.crs-body{padding:2px 16px 16px;border-top:1px solid #f1f6f4}
.crs-body p{font-size:.92rem;color:#4b5563;line-height:1.75;margin:9px 0}
.crs-sum{white-space:pre-line;color:#374151}
.crs-tour{background:#f9fafb;border-radius:10px;padding:11px 13px;font-size:.88rem}
.crs-body .meta{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 4px}
.crs-body .chip{font-size:.78rem;font-weight:700;color:#374151;background:#f4faf8;border:1px solid #dcefeb;border-radius:20px;padding:3px 10px}
.crs-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px!important}
.crs-links a{font-size:.85rem;font-weight:700;color:${M.color};border:1.5px dashed ${M.bd};border-radius:9px;padding:7px 13px}
.crs-links a:hover{background:${M.bg}}
@media(max-width:600px){.rt-hero{padding:18px 16px}.crs summary{padding:11px 12px;gap:9px}.crs-meta{display:none}}
</style>
<p class="crumb"><a href="/trails/">🥾 걷기 여행</a> › ${esc(TITLE)}</p>
<div class="rt-hero">
<h1>${M.emoji} ${esc(TITLE)}</h1>
${info && info.line ? `<div class="line">${esc(info.line)}</div>` : ''}
${info && info.paras.length ? info.paras.map(p => `<p>${esc(p)}</p>`).join('') : `<p>${esc(TITLE)}는 코리아둘레길을 이루는 노선 중 하나입니다. 아래에서 코스별 거리·소요 시간·난이도와 상세 안내를 확인하세요.</p>`}
<div class="rt-stats"><span>총 <b>${list.length}개</b> 코스</span><span>총 거리 <b>${totalKm.toLocaleString()}km</b></span><span>총 소요 <b>약 ${totalH.toLocaleString()}시간</b></span><span>지나는 지역 <b>${sidos.length}개 시·도</b></span></div>
</div>
<p class="note">지나는 지역: ${esc(sidos.join(' · '))}</p>

<h2 class="sec">코스별 안내 <span style="font-size:.9rem;font-weight:600;color:#9aa3af">${list.length}개 · 눌러서 펼치기</span></h2>
<p class="note" style="margin-top:-4px">각 코스를 누르면 거리·소요 시간·난이도와 함께 구간 설명, 주변 볼거리가 나옵니다.</p>
${courseCards}

${buyBox('trails')}

<h2 class="sec">다른 길 보기</h2>
<div class="sidonav">${themes.map(x => x === TH
      ? `<span class="on">${(ROUTE_META[x] || {}).emoji || '🥾'} ${esc(TITLE)}</span>`
      : `<a href="/trails/${ROUTE_SLUG[x] || ''}/">${(ROUTE_META[x] || {}).emoji || '🥾'} ${esc((trailRoutes.find(r => r.name.replace(/\s/g, '').startsWith(x.replace(/\s/g, ''))) || {}).name || x)}</a>`).join('')}</div>
<p style="margin:14px 0 4px"><a href="/trails/" style="display:inline-block;background:#0f9d8f;color:#fff;font-weight:800;padding:10px 22px;border-radius:24px">🥾 전국 걷기길 ${apiTrails.length}개 코스 전체 검색 →</a></p>
<p class="note" style="margin-top:16px">데이터 출처: 한국관광공사 두루누비 걷기여행 정보(공공데이터포털). 코스 통제·우회 여부는 방문 전 <a href="https://www.durunubi.kr/" target="_blank" rel="noopener nofollow">두루누비</a>에서 확인하세요.</p>
</div></main>`;

    const ld = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org', '@type': 'ItemList', name: TITLE + ' 코스 안내',
      numberOfItems: list.length,
      itemListElement: list.slice(0, 50).map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name }))
    })}</script>`;
    writePage('trails/' + slug, layout(
      `${TITLE} 코스 총정리 — ${list.length}개 코스 거리·난이도·상세 안내 | ${SITE_NAME}`,
      `${TITLE} 전체 ${list.length}개 코스를 한눈에. 코스별 거리(총 ${totalKm}km)·소요 시간·난이도와 구간 설명, 주변 볼거리까지 정리했습니다.`,
      `/trails/${slug}/`, content, { jsonld: ld }));
    TRAIL_URLS.push(`/trails/${slug}/`);
  });
}

// ① 브랜드 페이지
WG.brands.forEach(b => {
  writeWalkPage({
    path: 'trails/' + b.slug, title: b.label, emoji: b.emoji, items: b.items,
    lead: `${esc(b.label)}의 코스를 한자리에 모았습니다. ${b.region ? esc(b.region) + ' 일대 ' : ''}총 ${b.items.length}개 코스의 거리·소요 시간과 지나는 곳을 확인하세요.`,
    title2: `${b.label} 코스 총정리 — ${b.items.length}개 코스 거리·소요시간·경유지 | ${SITE_NAME}`,
    desc: `${b.label} 전체 ${b.items.length}개 코스 안내. 코스별 거리와 소요 시간, 시작·도착 지점, 지나는 곳을 공공데이터 기준으로 정리했습니다.`,
    nav: walkNav(b.slug, null)
  });
});

// ② 지역 페이지
const bySidoWalk = {};
WG.rest.forEach(t => { if (t.sido) (bySidoWalk[t.sido] = bySidoWalk[t.sido] || []).push(t); });
Object.entries(bySidoWalk).forEach(([sd, items]) => {
  const slug = SIDO_SLUG[sd] || romanizeRegion(sd).toLowerCase().replace(/[^a-z]/g, '');
  if (!slug) return;
  writeWalkPage({
    path: 'trails/area/' + slug, title: `${sd} 걷기길`, emoji: '🚶', items,
    lead: `${esc(sd)} 지역의 둘레길·산책로·숲길 ${items.length}개를 모았습니다. 가까운 곳부터 골라 보세요.`,
    title2: `${sd} 걷기길 ${items.length}곳 — 둘레길·산책로·숲길 총정리 | ${SITE_NAME}`,
    desc: `${sd}에서 걸을 수 있는 길 ${items.length}곳. 코스별 거리·소요 시간과 지나는 곳, 시작 지점을 공공데이터 기준으로 정리했습니다.`,
    nav: walkNav(null, sd)
  });
});

// ---------- 테마 랭킹 (/trend/valley·maple·flower·onsen/) ----------
const THEME_URLS = [];
const SBM = (visitors.seasonByMonth && visitors.seasonByMonth.months) || {};
const SBM_YEAR = (visitors.seasonByMonth && visitors.seasonByMonth.year) || SEASON_Y;
// '시도|시군구' → 성수기 배수
function seasonIdxMap(month) {
  const m = {};
  (SBM[month] || []).forEach(r => { m[r.sido + '|' + r.name] = r.idx; });
  return m;
}
function themeBars(rows, cls, unit) {
  if (!rows.length) return '<p class="note">해당하는 지역이 없어요.</p>';
  const isX = unit === 'x';
  const top = rows[0].v || 1;
  const span = isX ? Math.max(0.01, top - 1) : top;
  return `<div class="ranklist">` + rows.map((r, i) => {
    const v = isX ? (r.v - 1) : r.v;
    const w = Math.max(6, Math.min(100, Math.round(v / span * 100)));
    const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : (i + 1);
    return `<div class="rankrow ${cls}"><div class="no">${medal}</div>`
      + `<a class="nm" href="/search/?sido=${encodeURIComponent(r.sido)}&sigungu=${encodeURIComponent(r.name)}" title="${esc(r.sido)} ${esc(r.name)} 축제 보기">${esc(r.sido)} ${esc(r.name)}</a>`
      + `<div class="bar"><i style="width:${w}%"></i></div>`
      + `<div class="val">${isX ? `<em>${r.v}배</em>` : `${r.v}${unit}`}</div></div>`;
  }).join('') + `</div>`;
}
const THEMES = [
  { slug: 'valley', data: apiValleys, emoji: '💧', name: '계곡', many: '계곡이 많은 지역', month: 8, listUrl: '/valley/', cp: 'valley',
    lead: '여름 물놀이 계곡을 지역별로 정리했어요. 계곡이 많은 곳, 성수기에 붐비는 곳, 그리고 사람이 적어 한적한 곳까지 나눠서 봅니다.' },
  { slug: 'maple', data: apiMaple, emoji: '🍁', name: '단풍', many: '단풍 명소가 많은 지역', month: 10, listUrl: '/maple/', cp: 'maple',
    lead: '가을 단풍 명소를 지역별로 정리했어요. 단풍 명소가 많은 곳과 단풍철에 사람이 몰리는 곳을 나눠서 봅니다.' },
  { slug: 'flower', data: apiFlower, emoji: '🌸', name: '봄꽃', many: '봄꽃 명소가 많은 지역', month: 4, listUrl: '/flower/', cp: 'flower',
    lead: '봄꽃·수목원 명소를 지역별로 정리했어요. 꽃 구경 갈 곳이 많은 지역과 봄철에 붐비는 지역을 나눠서 봅니다.' },
  { slug: 'onsen', data: apiOnsen, emoji: '♨️', name: '온천', many: '온천이 많은 지역', month: 1, listUrl: '/onsen/', cp: 'onsen',
    lead: '전국 온천을 지역별로 정리했어요. 온천이 많은 지역과 한겨울에 사람이 몰리는 지역을 나눠서 봅니다.' }
];
const MONTH_SEASON = { 1: '한겨울', 4: '봄', 8: '한여름', 10: '가을' };

// ---------- 인기 여행지 랭킹 (/trend/) ----------
function rankBars(list, cls, mode) {
  if (!list || !list.length) return '<p class="note">데이터를 준비 중이에요.</p>';
  // 성수기 배수는 '1.0 = 평소'가 기준점이라 0부터 재면 차이가 안 보인다 → 초과분만 스케일링
  const isS = mode === 'season';
  const top = isS ? list[0].idx : list[0].num;
  const span = isS ? Math.max(0.01, top - 1) : top;
  return `<div class="ranklist">` + list.map(r => {
    const v = isS ? (r.idx - 1) : r.num;
    const w = Math.max(6, Math.min(100, Math.round(v / span * 100)));
    const medal = r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank;
    const label = r.sido ? `${esc(r.sido)} ${esc(r.name)}` : esc(r.name);
    const q = r.sido ? `/search/?sido=${encodeURIComponent(r.sido)}&sigungu=${encodeURIComponent(r.name)}`
      : `/search/?sido=${encodeURIComponent(r.name)}`;
    const val = isS ? `<em>${r.idx}배</em>` : `${(r.num / 10000).toFixed(0)}만명`;
    return `<div class="rankrow ${cls}"><div class="no">${medal}</div>`
      + `<a class="nm" href="${q}" title="${label} 축제 보기">${label}</a>`
      + `<div class="bar"><i style="width:${w}%"></i></div>`
      + `<div class="val">${val}</div></div>`;
  }).join('') + `</div>`;
}
const SEASON_M = (visitors.season && visitors.season.month) || (new Date().getMonth() + 1);
const SEASON_Y = (visitors.season && visitors.season.year) || (new Date().getFullYear() - 1);
const SEASON_LIST = (visitors.season && visitors.season.list) || [];
const TREND_TABS = [
  { id: 'season', label: `🌞 ${SEASON_M}월엔 여기가 붐벼요`, cls: 'hot', mode: 'season', list: SEASON_LIST,
    desc: `<b>${SEASON_Y}년 ${SEASON_M}월</b>에 실제로 사람이 몰린 정도를 그 해 평소(연 일평균)와 비교한 <b>성수기 배수</b>입니다. ×1.5면 평소보다 1.5배 붐볐다는 뜻이에요. 방문 데이터는 한 달가량 늦게 공개되기 때문에, '지금 어디가 붐비는지'는 <b>작년 같은 달 실적</b>으로 보는 편이 더 정확합니다. 해수욕장·계곡·산처럼 계절을 타는 곳이 올라옵니다.` },
  { id: 'kor', label: '🇰🇷 한국인이 많이 가는 곳', cls: '', mode: 'num', list: visitors.kor || [],
    desc: '해당 지역 주민이 아닌 <b>국내 방문객(외지인)</b> 수 기준입니다. 통근·쇼핑 방문도 함께 잡혀 수도권 대도시가 상위에 오릅니다.' },
  { id: 'fgn', label: '🌏 외국인이 많이 가는 곳', cls: 'fgn', mode: 'num', list: visitors.fgn || [],
    desc: '외국인 방문자 수 기준입니다. 명동·인사동이 있는 서울 중구·종로구, 공항이 있는 인천 중구, 제주가 강세입니다.' },
  { id: 'sido', label: '🗺️ 시·도 종합', cls: '', mode: 'num', list: visitors.sido || [],
    desc: '시·도 단위 전체 방문자(국내 여행객 + 외국인) 합계입니다.' }
];
const trendUpdated = visitors.updated ? String(visitors.updated).replace(/^(\d{4})(\d{2})(\d{2})~(\d{4})(\d{2})(\d{2})$/, '$1.$2.$3~$4.$5.$6') : '최근';
// ---------- 랭킹 숫자 해설 + 출처 (한국어) ----------
const DL_URL = 'https://datalab.visitkorea.or.kr/';
const DATAGO_URL = 'https://www.data.go.kr/data/15100731/openapi.do';
const trendLegend = `<p class="ranklegend">막대 길이 = 방문 규모 · 오른쪽 숫자 = <b>성수기 탭은 배수</b>, 나머지 탭은 <b>30일 방문자 합계</b>입니다. <a href="#howto">숫자 읽는 법 자세히 ↓</a></p>`;
const trendExplain = `<section class="explain" id="howto">
<h2>📖 이 숫자는 어떻게 나온 건가요?</h2>

<h3>1. 무엇을 센 숫자인가요</h3>
<p>한국관광공사가 <b>통신사 기지국 데이터와 카드 결제 데이터</b>를 조합해 추계한 <b>지역별 방문자 수</b>입니다. 설문이나 입장권 집계가 아니라, 실제로 그 지역에 머문 사람을 추정한 값이에요.</p>
<p>방문자는 세 갈래로 나뉘는데, 이 랭킹에서는 <b>여행객에 해당하는 두 가지만</b> 씁니다.</p>
<ul>
<li><b>현지인</b> — 그 시·군·구에 사는 사람. <b>랭킹에서 제외</b>합니다.</li>
<li><b>외지인</b> — 그 지역에 살지 않는 국내 방문자. 이 사이트에서 <b>'한국인'</b>으로 표기합니다.</li>
<li><b>외국인</b> — 외국인 방문자. <b>'외국인'</b> 랭킹의 기준입니다.</li>
</ul>

<h3>2. '1,787만명'은 1,787만 명이 다녀갔다는 뜻인가요?</h3>
<p>아닙니다. <b>연인원</b>입니다. 하루 단위 방문자 수를 30일간 더한 값이라, <b>같은 사람이 5일 방문하면 5명으로 셉니다.</b> 그래서 실제 방문한 사람 수보다 큽니다. 지역끼리 규모를 <b>비교</b>하는 용도로 보시면 됩니다.</p>

<h3>3. 왜 강남구·수원시 같은 대도시가 1위인가요?</h3>
<p>'외지인'에는 여행객뿐 아니라 <b>출퇴근·통학·쇼핑·업무 방문</b>이 모두 포함되기 때문입니다. 옆 동네에서 매일 출근하는 사람도 외지인으로 잡힙니다. 그래서 <b>순수한 여행지 순위로 보기에는 대도시가 과대평가</b>돼요.</p>
<p>여행지로서 어디가 좋은지 보고 싶다면 <b>${SEASON_M}월 성수기 탭</b>을 보세요. 통근 인구는 계절을 타지 않아서 자동으로 걸러집니다.</p>

<h3>4. 성수기 배수(예: 1.54배)는 어떻게 계산했나요</h3>
<p style="text-align:center;background:#f4faf8;border:1px solid #dcefeb;border-radius:10px;padding:13px;font-weight:700;color:#0a6c63;margin:10px 0">
성수기 배수 = ${SEASON_Y}년 ${SEASON_M}월 하루 평균 방문자 ÷ ${SEASON_Y}년 평소 하루 평균 방문자
</p>
<p>예를 들어 <b>경북 울릉군 1.54배</b>는, 울릉군이 ${SEASON_Y}년 ${SEASON_M}월에 <b>그 해 평소보다 하루 1.54배 많은 사람</b>을 받았다는 뜻입니다. 절대 방문자 수가 아니라 <b>'평소 대비 얼마나 붐볐나'</b>라서, 작은 지역도 성수기만 되면 상위에 오를 수 있어요.</p>
<p>기준선이 되는 '평소'는 ${SEASON_Y}년 <b>12개월치를 골고루 표본 추출</b>해 구한 하루 평균입니다. 방문자가 너무 적어 배수가 크게 튀는 곳(하루 평균 5,000명 미만)은 제외했습니다.</p>

<h3>5. 왜 작년 데이터인가요?</h3>
<p>이 데이터는 <b>약 한 달 늦게 공개</b>됩니다(현재 최신 집계일 ${visitors.latest ? String(visitors.latest).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1년 $2월 $3일') : '-'}). 그래서 "지금 ${SEASON_M}월에 어디가 붐비나"를 지연된 최신 데이터로 답하면 <b>엉뚱한 계절의 결과</b>가 나옵니다. 대신 <b>작년 같은 달 실적</b>을 쓰면 계절이 정확히 맞습니다.</p>
<p>한국인·외국인·시·도 랭킹은 계절보다 규모 비교가 목적이라 <b>최신 30일(${trendUpdated})</b>을 그대로 씁니다.</p>

<h3>6. 알아두실 한계</h3>
<ul>
<li>통신·카드 기반 <b>추계치</b>라 실제 관광객 수와 차이가 있습니다.</li>
<li>같은 이름의 시·군·구가 있어(서울 중구·인천 중구 등) <b>시·도를 함께 표기</b>했습니다.</li>
<li>시·군·구 단위라, 한 지역 안에서 어느 명소가 붐볐는지까지는 알 수 없습니다.</li>
</ul>

<h3>📌 데이터 출처</h3>
<p>한국관광공사 <a href="${DL_URL}" target="_blank" rel="noopener">한국관광 데이터랩</a> — 지역별(시군구·시도) 일자별 방문자 수<br>
공공데이터포털 <a href="${DATAGO_URL}" target="_blank" rel="noopener">한국관광공사_관광 빅데이터 정보 서비스</a> (DataLabService) 를 통해 수집<br>
집계 기간: 성수기 랭킹 ${SEASON_Y}년 ${SEASON_M}월 / 방문자 랭킹 ${trendUpdated} · 매주 월요일 자동 갱신</p>
</section>`;

const trendContent = `<main><div class="wrap">
<h1 style="font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:8px 0 4px">🔥 인기 여행지 랭킹</h1>
<p class="note" style="margin-top:0">한국관광공사 관광 빅데이터로 <b>사람이 실제로 많이 간 시·군·구</b>를 정리했어요. 막대를 누르면 그 지역에서 열리는 축제를 바로 볼 수 있습니다.</p>
<div class="datebadge">📅 <b>${SEASON_M}월 성수기</b> 랭킹은 <b>${SEASON_Y}년 ${SEASON_M}월</b> 실적 기준 · <b>한국인·외국인·시도</b> 랭킹은 <b>${trendUpdated}</b> 기준<br><span>방문 데이터는 공공데이터 특성상 약 한 달 늦게 공개돼요. 그래서 계절 랭킹은 작년 같은 달 실적으로 보여드립니다.</span></div>
<div class="rank-tabs" id="trendTabs">
${TREND_TABS.map((t, i) => `<button type="button" data-t="${t.id}"${i === 0 ? ' class="on"' : ''}>${t.label}</button>`).join('')}
</div>
${trendLegend}
${TREND_TABS.map((t, i) => `<section class="trendpane" data-p="${t.id}"${i === 0 ? '' : ' style="display:none"'}>
<h2 class="sec" style="margin-top:6px">${t.label}</h2>
<p class="note" style="margin-top:-4px">${t.desc}</p>
${rankBars(t.list, t.cls, t.mode)}
</section>`).join('\n')}
<h2 class="sec">🗺️ 테마별로 보기</h2>
<p class="note" style="margin-top:-4px">계절 명소는 테마별 랭킹이 따로 있어요. 어디가 붐비고 어디가 한적한지 나눠서 볼 수 있습니다.</p>
<div class="sidonav">${THEMES.filter(x => x.data && x.data.length).map(x => `<a href="/trend/${x.slug}/">${x.emoji} ${x.name}</a>`).join('')}</div>
<h2 class="sec">📍 지역별로 자세히 보기</h2>
<p class="note" style="margin-top:-4px">시·도를 고르면 그 안에서 어느 시·군·구에 사람이 몰리는지, 한국인과 외국인이 어떻게 다른지 볼 수 있어요.</p>
<div class="sidonav">${Object.entries(visitors.bySido || {}).filter(([, o]) => o.total >= 2).map(([x]) => `<a href="/trend/${SIDO_SLUG[x]}/">${esc(x)}</a>`).join('')}</div>
${trendExplain}
</div></main>
<script>
(function(){
  var tabs=document.getElementById('trendTabs'); if(!tabs)return;
  tabs.addEventListener('click',function(e){
    var b=e.target.closest('button[data-t]'); if(!b)return;
    var id=b.getAttribute('data-t');
    tabs.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b);});
    document.querySelectorAll('.trendpane').forEach(function(p){p.style.display=(p.getAttribute('data-p')===id)?'':'none';});
  });
})();
</script>`;
const trendLd = (visitors.kor && visitors.kor.length) ? `<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org', '@type': 'ItemList', name: '한국인이 많이 가는 여행지 랭킹',
  itemListOrder: 'https://schema.org/ItemListOrderDescending',
  numberOfItems: Math.min(20, visitors.kor.length),
  itemListElement: visitors.kor.slice(0, 20).map(r => ({ '@type': 'ListItem', position: r.rank, name: (r.sido ? r.sido + ' ' : '') + r.name }))
})}</script>` : '';
writePage('trend', layout(
  `인기 여행지 랭킹 — ${SEASON_M}월 성수기, 한국인·외국인이 많이 가는 곳 | ` + SITE_NAME,
  `한국관광공사 관광 빅데이터 기준 인기 여행지 랭킹. ${SEASON_M}월에 평소보다 붐비는 성수기 여행지, 한국인이 많이 가는 시·군·구, 외국인이 많이 가는 곳을 한눈에 보고 그 지역 축제까지 바로 확인하세요.`,
  '/trend/', trendContent, { jsonld: trendLd }));

const TREND_LANG_URLS = [];
// ---------- 다국어 인기 여행지 랭킹 (/{lang}/trend/) ----------
const TREND_L = {
  en: {
    h1: '🔥 Where Koreans and Visitors Actually Go',
    intro: 'Rankings built from Korea Tourism Organization big data — the districts people really visited. Tap a bar to see festivals held there.',
    badge: (Y, M, P) => `The <b>${['','January','February','March','April','May','June','July','August','September','October','November','December'][M]}</b> peak-season ranking uses <b>${['','January','February','March','April','May','June','July','August','September','October','November','December'][M]} ${Y}</b> actuals · the visitor rankings use <b>${P}</b>`,
    badgeNote: 'Visit data is published about a month late, so the seasonal ranking uses the same month of last year.',
    tabs: { season: m => `🌞 Busiest in ${['','January','February','March','April','May','June','July','August','September','October','November','December'][m]}`, kor: '🇰🇷 Where Koreans go', fgn: '🌏 Where visitors go', sido: '🗺️ By province' },
    desc: {
      season: (y, m) => `How much busier a district was in <b>${['','January','February','March','April','May','June','July','August','September','October','November','December'][m]} ${y}</b> compared with its own yearly average — a <b>peak-season multiplier</b>. ×1.5 means 1.5× busier than usual. Beaches, valleys and mountains rise here.`,
      kor: 'By number of <b>domestic visitors from outside the district</b>. Commuting and shopping trips are included, so large metro districts rank high.',
      fgn: 'By number of <b>international visitors</b>. Jung-gu and Jongno-gu in Seoul (Myeongdong, Insadong), Jung-gu in Incheon (airport) and Jeju lead.',
      sido: 'Total visitors (domestic + international) by province.'
    },
    unit: '', times: '×', legend: `Bar length = visit volume · right-hand figure = <b>multiplier</b> on the peak-season tab, <b>30-day visitor total</b> on the others. <a href="#howto">How to read these numbers ↓</a>`, src: 'Source: Korea Tourism Organization «Korea Tourism Data Lab» regional visitor counts (data.go.kr). Estimates based on telecom and card data. Updated weekly.',
    title: m => `Where People Actually Travel in Korea — ${['','January','February','March','April','May','June','July','August','September','October','November','December'][m]} Peak Season Ranking | Chukjemoa`,
    metad: 'Korea travel destination rankings from official tourism big data — peak-season hotspots this month, where Koreans go, and where international visitors go, with festivals in each area.'
  },
  ja: {
    h1: '🔥 実際に人が多く行く場所ランキング',
    intro: '韓国観光公社の観光ビッグデータをもとに、実際に人が多く訪れた市・郡・区をまとめました。バーを押すとその地域のお祭りが見られます。',
    badge: (Y, M, P) => `<b>${M}月</b>の繁忙期ランキングは <b>${Y}年${M}月</b> の実績基準 · 訪問者ランキングは <b>${P}</b> 基準`,
    badgeNote: '訪問データは約1か月遅れて公開されるため、季節ランキングは昨年同月の実績を使っています。',
    tabs: { season: m => `🌞 ${m}月に混む場所`, kor: '🇰🇷 韓国人が多く行く場所', fgn: '🌏 外国人が多く行く場所', sido: '🗺️ 道・広域市別' },
    desc: {
      season: (y, m) => `<b>${y}年${m}月</b>に実際どれだけ人が集まったかを、その年の平常時（年平均）と比べた<b>繁忙期倍率</b>です。×1.5なら普段の1.5倍混んでいたという意味。海水浴場・渓谷・山など季節性の高い場所が上位に来ます。`,
      kor: 'その地域の住民以外の<b>国内訪問者</b>数基準です。通勤・買い物も含まれるため首都圏の大都市が上位に来ます。',
      fgn: '<b>外国人訪問者</b>数基準です。明洞・仁寺洞のあるソウル中区・鍾路区、空港のある仁川中区、済州が強いです。',
      sido: '道・広域市単位の総訪問者（国内＋外国人）です。'
    },
    unit: '', times: '×', legend: `バーの長さ＝訪問規模 · 右の数字＝繁忙期タブは<b>倍率</b>、その他は<b>30日間の延べ訪問者</b>です。<a href="#howto">数字の読み方 ↓</a>`, src: '出典：韓国観光公社「韓国観光データラボ」地域別訪問者数（公共データポータル）。通信・カードデータに基づく推計値です。毎週更新。',
    title: m => `韓国で実際に人が多く行く場所 — ${m}月の繁忙期ランキング | チュクチェモア`,
    metad: '韓国観光公社の観光ビッグデータによる人気旅行先ランキング。今月の繁忙期スポット、韓国人が多く行く場所、外国人が多く行く場所を市・郡・区単位で。'
  },
  es: {
    h1: '🔥 Adónde va realmente la gente en Corea',
    intro: 'Rankings elaborados con los datos oficiales de turismo de Corea — los distritos que la gente visitó de verdad. Pulsa una barra para ver los festivales de esa zona.',
    badge: (Y, M, P) => `El ranking de temporada alta de <b>${['','enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][M]}</b> se basa en datos reales de <b>${['','enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][M]} de ${Y}</b> · los rankings de visitantes, en <b>${P}</b>`,
    badgeNote: 'Los datos de visitas se publican con un mes de retraso, por eso el ranking estacional usa el mismo mes del año pasado.',
    tabs: { season: m => `🌞 Más concurrido en ${['','enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][m]}`, kor: '🇰🇷 Adónde van los coreanos', fgn: '🌏 Adónde van los extranjeros', sido: '🗺️ Por provincia' },
    desc: {
      season: (y, m) => `Cuánto más concurrido estuvo un distrito en <b>${['','enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][m]} de ${y}</b> frente a su propia media anual — un <b>multiplicador de temporada alta</b>. ×1,5 significa 1,5 veces más concurrido de lo habitual. Playas, valles y montañas destacan aquí.`,
      kor: 'Por número de <b>visitantes nacionales de fuera del distrito</b>. Incluye desplazamientos por trabajo y compras, por eso los grandes distritos metropolitanos encabezan la lista.',
      fgn: 'Por número de <b>visitantes internacionales</b>. Destacan Jung-gu y Jongno-gu en Seúl (Myeongdong, Insadong), Jung-gu en Incheon (aeropuerto) y Jeju.',
      sido: 'Visitantes totales (nacionales + internacionales) por provincia.'
    },
    unit: '', times: '×', legend: `Longitud de la barra = volumen de visitas · cifra de la derecha = <b>multiplicador</b> en la pestaña de temporada alta, <b>total de 30 días</b> en las demás. <a href="#howto">Cómo leer estas cifras ↓</a>`, src: 'Fuente: Organización de Turismo de Corea «Korea Tourism Data Lab», visitantes por región (data.go.kr). Estimaciones basadas en datos de telefonía y tarjetas. Actualización semanal.',
    title: m => `Adónde viaja la gente en Corea — Ranking de temporada alta de ${['','enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][m]} | Chukjemoa`,
    metad: 'Ranking de destinos en Corea según los datos oficiales de turismo: puntos de temporada alta de este mes, adónde van los coreanos y adónde van los extranjeros, con los festivales de cada zona.'
  },
  zh: {
    h1: '🔥 韩国人气目的地排行',
    intro: '基于韩国观光公社旅游大数据，整理出人们实际前往最多的市·郡·区。点击条形即可查看当地庆典。',
    badge: (Y, M, P) => `<b>${M}月</b>旺季排行以 <b>${Y}年${M}月</b> 实绩为准 · 访客排行以 <b>${P}</b> 为准`,
    badgeNote: '访问数据约延迟一个月公开，因此季节排行采用去年同月的实绩。',
    tabs: { season: m => `🌞 ${m}月最热闹的地方`, kor: '🇰🇷 韩国人常去的地方', fgn: '🌏 外国人常去的地方', sido: '🗺️ 按道·广域市' },
    desc: {
      season: (y, m) => `将 <b>${y}年${m}月</b> 的实际人流与该年平常水平（年均）相比得出的<b>旺季倍数</b>。×1.5 表示比平时热闹 1.5 倍。海水浴场、溪谷、山岳等季节性强的地方会上榜。`,
      kor: '以<b>非本地居民的国内访客</b>人数为准。因包含通勤与购物出行，首都圈大城市排名靠前。',
      fgn: '以<b>外国访客</b>人数为准。明洞·仁寺洞所在的首尔中区·钟路区、机场所在的仁川中区以及济州名列前茅。',
      sido: '按道·广域市统计的访客总数（国内＋外国）。'
    },
    unit: '', times: '×', legend: `条形长度＝访问规模 · 右侧数字＝旺季标签为<b>倍数</b>，其余为<b>30天访客人次合计</b>。<a href="#howto">数字怎么看 ↓</a>`, src: '数据来源：韩国观光公社《韩国观光数据实验室》地区访客数（公共数据门户）。基于通信与卡片数据的推算值，每周更新。',
    title: m => `韩国人气目的地排行 — ${m}月旺季榜 | 庆典集`,
    metad: '基于韩国观光公社旅游大数据的人气目的地排行：本月旺季热点、韩国人常去与外国人常去的市·郡·区，并可直接查看当地庆典。'
  }
};


Object.entries(visitors.bySido || {}).forEach(([SD, G]) => {
  const slug = SIDO_SLUG[SD]; if (!slug) return;
  // 시군구가 1개뿐인 곳(세종)은 '지역 내 순위'가 성립하지 않아 페이지를 만들지 않는다
  if (!G.total || G.total < 2) return;
  const full = SIDO_FULL[SD] || SD;
  const k1 = G.kor[0], f1 = G.fgn[0], s1 = (G.season || [])[0];
  const diff = k1 && f1 && k1.name !== f1.name;

  // 이 지역 축제(진행중·예정)
  const today = TODAY.replace(/-/g, '');
  const fests = apiFests.filter(f => f.sido === SD && String(f.end || '') >= today)
    .sort((a, b) => String(a.start).localeCompare(String(b.start))).slice(0, 12);
  // 이 지역 계절 명소
  const vv = apiValleys.filter(p => p.sido === SD);
  const mm2 = apiMaple.filter(p => p.sido === SD);
  const ff = apiFlower.filter(p => p.sido === SD);
  const oo = apiOnsen.filter(p => p.sido === SD);
  const R = rlte.bySido[SD] || { hot: [], pairs: [] };

  const tabs = [
    { id: 'kor', label: '🇰🇷 한국인이 많이 가는 곳', cls: '', mode: 'num', list: G.kor.slice(0, 20),
      desc: `${esc(SD)} 안에서 <b>그 지역 주민이 아닌 국내 방문객</b>이 많았던 시·군·구 순위입니다.` },
    { id: 'fgn', label: '🌏 외국인이 많이 가는 곳', cls: 'fgn', mode: 'num', list: G.fgn.slice(0, 20),
      desc: `${esc(SD)} 안에서 <b>외국인 방문자</b>가 많았던 시·군·구 순위입니다. 한국인 순위와 비교해 보세요.` },
    { id: 'season', label: `🌞 ${SEASON_M}월엔 여기가 붐벼요`, cls: 'hot', mode: 'season', list: (G.season || []).slice(0, 20),
      desc: `${SEASON_Y}년 ${SEASON_M}월에 <b>평소보다 몇 배 붐볐는지</b>(성수기 배수)로 매긴 순위입니다.` }
  ].filter(t => t.list.length);

  const insight = (k1 && f1) ? `<div class="insight">
<div class="ins-col"><span class="ins-h">🇰🇷 한국인 1위</span><b>${esc(k1.name)}</b><span class="ins-s">${(k1.num / 10000).toFixed(0)}만명</span></div>
<div class="ins-vs">vs</div>
<div class="ins-col fgn"><span class="ins-h">🌏 외국인 1위</span><b>${esc(f1.name)}</b><span class="ins-s">${(f1.num / 10000).toFixed(0)}만명</span></div>
</div>
<p class="note">${diff
    ? `${esc(SD)}에서는 한국인과 외국인이 <b>서로 다른 곳</b>으로 갑니다. 한국인은 <b>${esc(k1.name)}</b>, 외국인은 <b>${esc(f1.name)}</b>가 1위예요. 현지인이 가는 곳이 궁금하다면 한국인 탭을, 관광객이 몰리는 곳이 궁금하다면 외국인 탭을 보세요.`
    : `${esc(SD)}에서는 한국인과 외국인 모두 <b>${esc(k1.name)}</b>를 가장 많이 찾았습니다.`}${s1 ? ` ${SEASON_M}월 기준으로 평소보다 가장 붐비는 곳은 <b>${esc(s1.name)}</b>(${s1.idx}배)입니다.` : ''}</p>` : '';

  const content = `<main><div class="wrap">
<p class="crumb"><a href="/trend/">🔥 인기 여행지 랭킹</a> › ${esc(full)}</p>
<h1 style="font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:6px 0 4px">${esc(SD)}에서 사람들이 가장 많이 가는 곳</h1>
<p class="note" style="margin-top:0">한국관광공사 관광 빅데이터로 본 <b>${esc(full)}</b> 안 ${G.total}개 시·군·구 방문 순위입니다. 한국인·외국인을 나눠서 보고, 그 지역에서 열리는 축제까지 바로 확인하세요.</p>
<div class="datebadge">📅 <b>${SEASON_M}월 성수기</b>는 <b>${SEASON_Y}년 ${SEASON_M}월</b> 실적 기준 · <b>한국인·외국인</b>은 <b>${trendUpdated}</b> 기준<br><span>방문 데이터는 약 한 달 늦게 공개돼요. <a href="/trend/#howto">숫자 읽는 법 →</a></span></div>
${insight}
<div class="rank-tabs" id="trendTabs">
${tabs.map((t, i) => `<button type="button" data-t="${t.id}"${i === 0 ? ' class="on"' : ''}>${t.label}</button>`).join('')}
</div>
${tabs.map((t, i) => `<section class="trendpane" data-p="${t.id}"${i === 0 ? '' : ' style="display:none"'}>
<h2 class="sec" style="margin-top:6px">${t.label}</h2>
<p class="note" style="margin-top:-4px">${t.desc}</p>
${rankBars(t.list, t.cls, t.mode)}
</section>`).join('\n')}
${R.hot && R.hot.length ? `<h2 class="sec">🔗 ${esc(SD)}에서 함께 많이 가는 곳</h2>
<p class="note" style="margin-top:-4px">한 곳을 방문한 사람들이 같은 여행에서 자주 함께 들른 장소입니다. 동선을 짤 때 참고하세요.</p>
<div class="spotchips">${R.hot.slice(0, 12).map(h => `<a class="spotchip" href="https://search.naver.com/search.naver?query=${encodeURIComponent(h.name)}" target="_blank" rel="noopener">${esc(h.name)}<span>${esc(h.cat || '')}</span></a>`).join('')}</div>` : ''}
${fests.length ? `<h2 class="sec">🎪 ${esc(SD)}에서 열리는 축제 <span style="font-size:.9rem;font-weight:600;color:#9aa3af">${fests.length}곳</span></h2>
<div class="grid">${fests.map(sidoFestCard).join('\n')}</div>
<p style="margin:14px 0 4px"><a href="/search/?sido=${encodeURIComponent(SD)}" style="display:inline-block;background:#0f9d8f;color:#fff;font-weight:800;padding:10px 22px;border-radius:24px">${esc(SD)} 축제 전체 보기 →</a></p>` : ''}
${(vv.length || mm2.length || ff.length || oo.length) ? `<h2 class="sec">🗺️ ${esc(SD)}의 계절 명소</h2>
${vv.length ? `<p class="note" style="margin:10px 0 4px"><b>💧 계곡 ${vv.length}곳</b></p>${spotChips(vv, '💧', '/valley/')}` : ''}
${oo.length ? `<p class="note" style="margin:10px 0 4px"><b>♨️ 온천 ${oo.length}곳</b></p>${spotChips(oo, '♨️', '/onsen/')}` : ''}
${mm2.length ? `<p class="note" style="margin:10px 0 4px"><b>🍁 단풍 명소 ${mm2.length}곳</b></p>${spotChips(mm2, '🍁', '/maple/')}` : ''}
${ff.length ? `<p class="note" style="margin:10px 0 4px"><b>🌸 봄꽃 명소 ${ff.length}곳</b></p>${spotChips(ff, '🌸', '/flower/')}` : ''}` : ''}
${buyBox('festival')}
<h2 class="sec">다른 지역 랭킹 보기</h2>
<div class="sidonav">${Object.keys(visitors.bySido).filter(x => (visitors.bySido[x].total || 0) >= 2).map(x => x === SD
    ? `<span class="on">${esc(x)}</span>`
    : `<a href="/trend/${SIDO_SLUG[x]}/">${esc(x)}</a>`).join('')}</div>
<p class="note" style="margin-top:18px">출처: 한국관광공사 «한국관광 데이터랩» 지역별 방문자 수(공공데이터포털). 통신·카드 기반 추계치입니다. 계산 방식과 한계는 <a href="/trend/#howto">숫자 읽는 법</a>에서 자세히 설명합니다.</p>
</div></main>
<script>
(function(){
  var tabs=document.getElementById('trendTabs'); if(!tabs)return;
  tabs.addEventListener('click',function(e){
    var b=e.target.closest('button[data-t]'); if(!b)return;
    var id=b.getAttribute('data-t');
    tabs.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b);});
    document.querySelectorAll('.trendpane').forEach(function(p){p.style.display=(p.getAttribute('data-p')===id)?'':'none';});
  });
})();
</script>`;
  const ld = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'ItemList',
    name: `${SD} 인기 여행지 랭킹`, itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: Math.min(20, G.kor.length),
    itemListElement: G.kor.slice(0, 20).map(r => ({ '@type': 'ListItem', position: r.rank, name: SD + ' ' + r.name }))
  })}</script>`;
  writePage('trend/' + slug, layout(
    `${SD} 인기 여행지 랭킹 — 한국인·외국인이 많이 가는 곳 (${SEASON_M}월) | ${SITE_NAME}`,
    `${full} 시·군·구별 방문자 랭킹. 한국인이 많이 가는 곳, 외국인이 많이 가는 곳, ${SEASON_M}월 성수기 지역을 관광 빅데이터로 정리하고 ${SD} 축제·계절 명소까지 한눈에.`,
    `/trend/${slug}/`, content, { jsonld: ld }));
  SIDO_URLS.push(`/trend/${slug}/`);
});

THEMES.forEach(T => {
  if (!T.data || !T.data.length) return;
  const idxMap = seasonIdxMap(T.month);
  // 시군구별 집계
  const byGu = {};
  T.data.forEach(p => {
    if (!p.sido || !p.sigungu) return;
    const k = p.sido + '|' + p.sigungu;
    if (!byGu[k]) byGu[k] = { sido: p.sido, name: p.sigungu, spots: [] };
    byGu[k].spots.push(p.title);
  });
  const all = Object.entries(byGu).map(([k, o]) => ({ ...o, key: k, cnt: o.spots.length, idx: idxMap[k] || 0 }));
  if (!all.length) return;

  const many = [...all].sort((a, b) => b.cnt - a.cnt || a.sido.localeCompare(b.sido)).slice(0, 15)
    .map(r => ({ sido: r.sido, name: r.name, v: r.cnt, spots: r.spots }));
  const busy = all.filter(r => r.idx > 1).sort((a, b) => b.idx - a.idx).slice(0, 15)
    .map(r => ({ sido: r.sido, name: r.name, v: r.idx, spots: r.spots }));
  const manyKeys = new Set([...all].sort((a, b) => b.cnt - a.cnt).slice(0, 5).map(r => r.key));
  const calm = all.filter(r => r.cnt >= 2 && !r.idx && !manyKeys.has(r.key)).sort((a, b) => b.cnt - a.cnt).slice(0, 15)
    .map(r => ({ sido: r.sido, name: r.name, v: r.cnt, spots: r.spots }));

  const chips = rows => rows.slice(0, 6).map(r =>
    `<a class="spotchip" href="${T.listUrl}">${T.emoji} ${esc(r.spots[0])}<span>${esc(r.sido)} ${esc(r.name)}</span></a>`).join('');

  const content = `<main><div class="wrap">
<p class="crumb"><a href="/trend/">🔥 인기 여행지 랭킹</a> › ${T.emoji} ${T.name} 랭킹</p>
<h1 style="font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:6px 0 4px">${T.emoji} 전국 ${T.name} 랭킹 — ${T.month}월엔 어디로 갈까</h1>
<p class="note" style="margin-top:0">${T.lead} 공공데이터 ${T.name} 명소 <b>${T.data.length}곳</b>과 한국관광공사 방문자 데이터를 겹쳐 만들었습니다.</p>
<div class="datebadge">📅 붐빔 정도는 <b>${SBM_YEAR}년 ${T.month}월</b>(${MONTH_SEASON[T.month]}) 실적 기준 · ${T.name} 명소는 한국관광공사 관광정보<br><span>방문 데이터는 약 한 달 늦게 공개돼서, ${T.month}월 상황은 작년 같은 달 실적으로 봅니다. <a href="/trend/#howto">숫자 읽는 법 →</a></span></div>

<h2 class="sec">${T.emoji} ${T.many}</h2>
<p class="note" style="margin-top:-4px">선택지가 많은 곳입니다. 한 지역에서 여러 곳을 둘러보려면 여기가 유리해요.</p>
${themeBars(many, '', '곳')}
<div class="spotchips">${chips(many)}</div>

${busy.length >= 3 ? `<h2 class="sec">🔥 ${T.month}월에 붐비는 ${T.name} 지역</h2>
<p class="note" style="margin-top:-4px">${T.month}월에 평소보다 방문자가 많이 늘어난 지역입니다. 그만큼 인기 있다는 뜻이지만, 주차·숙소는 미리 잡는 게 좋아요.</p>
${themeBars(busy, 'hot', 'x')}
<div class="spotchips">${chips(busy)}</div>` : ''}

${calm.length >= 3 ? `<h2 class="sec">😌 사람이 덜 몰리는 ${T.name} 지역</h2>
<p class="note" style="margin-top:-4px">${T.name} 명소가 2곳 이상 있는데도 ${T.month}월 방문자가 <b>평소 수준에 머무는</b> 지역입니다. 붐비는 걸 싫어하신다면 여기를 보세요.</p>
${themeBars(calm, '', '곳')}
<div class="spotchips">${chips(calm)}</div>` : ''}

${buyBox(T.cp)}

<h2 class="sec">${T.name} 명소 전체 보기</h2>
<p style="margin:6px 0 4px"><a href="${T.listUrl}" style="display:inline-block;background:#0f9d8f;color:#fff;font-weight:800;padding:10px 22px;border-radius:24px">${T.emoji} 전국 ${T.name} ${T.data.length}곳 보러가기 →</a></p>

<h2 class="sec">다른 테마 랭킹</h2>
<div class="sidonav">${THEMES.filter(x => x.data && x.data.length).map(x => x.slug === T.slug
    ? `<span class="on">${x.emoji} ${x.name}</span>`
    : `<a href="/trend/${x.slug}/">${x.emoji} ${x.name}</a>`).join('')}</div>
<h2 class="sec">지역별 랭킹</h2>
<div class="sidonav">${Object.entries(visitors.bySido || {}).filter(([, o]) => o.total >= 2).map(([x]) => `<a href="/trend/${SIDO_SLUG[x]}/">${esc(x)}</a>`).join('')}</div>
<p class="note" style="margin-top:18px">출처: ${T.name} 명소 — 한국관광공사 국문관광정보(공공데이터포털) / 방문자 — 한국관광공사 «한국관광 데이터랩». 통신·카드 기반 추계치이며, 계산 방식은 <a href="/trend/#howto">숫자 읽는 법</a>에 있습니다.</p>
</div></main>`;
  const ld = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'ItemList', name: `전국 ${T.name} 지역 랭킹`,
    itemListOrder: 'https://schema.org/ItemListOrderDescending', numberOfItems: many.length,
    itemListElement: many.map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: r.sido + ' ' + r.name }))
  })}</script>`;
  writePage('trend/' + T.slug, layout(
    `전국 ${T.name} 랭킹 — ${T.month}월에 붐비는 곳·한적한 곳 | ${SITE_NAME}`,
    `전국 ${T.name} 명소 ${T.data.length}곳을 지역별로 정리. ${T.name}이 많은 지역, ${T.month}월에 사람이 몰리는 지역, 상대적으로 한적한 지역을 관광 빅데이터로 비교해 보세요.`,
    `/trend/${T.slug}/`, content, { jsonld: ld }));
  THEME_URLS.push(`/trend/${T.slug}/`);
});

// ---------- 다국어 랭킹 숫자 해설 ----------
const EXPLAIN_L = {
  en: (Y, M, P, LAT, MN) => `<section class="explain" id="howto">
<h2>📖 How to read these numbers</h2>
<h3>1. What is being counted</h3>
<p>Visitor estimates published by the <b>Korea Tourism Organization</b>, derived from <b>mobile network and card payment data</b>. They are not survey answers or ticket sales — they estimate who actually spent time in an area.</p>
<ul>
<li><b>Residents</b> — people who live in that district. <b>Excluded</b> from these rankings.</li>
<li><b>Domestic visitors from elsewhere</b> — Koreans who do not live there. Shown here as <b>"Koreans"</b>.</li>
<li><b>International visitors</b> — the basis of the <b>"visitors"</b> ranking.</li>
</ul>
<h3>2. Does "17.9M" mean 17.9 million different people?</h3>
<p>No. It is a <b>person-day total</b>: daily counts added up over 30 days. <b>Someone who visits on five days is counted five times.</b> Use it to <b>compare scale between districts</b>, not as a headcount.</p>
<h3>3. Why do big cities like Gangnam-gu top the list?</h3>
<p>Because "visitors from elsewhere" also includes <b>commuting, school, shopping and business trips</b>. Someone who drives in from the next town every morning counts too. So large metro districts are <b>overstated as travel destinations</b>.</p>
<p>For actual travel appeal, use the <b>${MN[M]} peak-season tab</b> — commuters don't change with the seasons, so they cancel out.</p>
<h3>4. How the peak-season multiplier (e.g. ×1.54) is calculated</h3>
<p style="text-align:center;background:#f4faf8;border:1px solid #dcefeb;border-radius:10px;padding:13px;font-weight:700;color:#0a6c63;margin:10px 0">
multiplier = average daily visitors in ${MN[M]} ${Y} ÷ average daily visitors across ${Y}
</p>
<p><b>Ulleung-gun ×1.54</b> means Ulleung-gun received <b>1.54 times its usual daily crowd</b> during ${MN[M]} ${Y}. It measures <b>how much busier than normal</b> a place gets, not raw size — so small towns can rank high in their season.</p>
<p>The "usual" baseline is a daily average sampled evenly across all 12 months of ${Y}. Districts averaging under 5,000 visitors a day are excluded, since tiny bases produce wild multipliers.</p>
<h3>5. Why last year's data?</h3>
<p>This data is <b>published about a month late</b> (latest available day: ${LAT}). Answering "where is busy in ${MN[M]}?" with delayed data would return <b>the wrong season entirely</b>. Using the <b>same month of last year</b> matches the season correctly.</p>
<p>The Koreans / international / province rankings compare scale rather than season, so they use the <b>latest 30 days (${P})</b>.</p>
<h3>6. Limitations worth knowing</h3>
<ul>
<li>These are <b>estimates</b> from telecom and card data, not exact tourist counts.</li>
<li>Several districts share a name (Jung-gu in Seoul and in Incheon), so the <b>province is always shown</b>.</li>
<li>Data is per district — it cannot tell you which specific attraction was busy.</li>
</ul>
<h3>📌 Data source</h3>
<p>Korea Tourism Organization — <a href="${DL_URL}" target="_blank" rel="noopener">Korea Tourism Data Lab</a>, daily visitor counts by district and province<br>
Collected via <a href="${DATAGO_URL}" target="_blank" rel="noopener">Tourism Big Data Service (DataLabService)</a> on Korea's public data portal<br>
Periods: peak season ${MN[M]} ${Y} · visitor rankings ${P} · refreshed automatically every Monday</p>
</section>`,
  ja: (Y, M, P, LAT, MN) => `<section class="explain" id="howto">
<h2>📖 この数字の読み方</h2>
<h3>1. 何を数えた数字か</h3>
<p><b>韓国観光公社</b>が<b>通信キャリアの基地局データとカード決済データ</b>から推計した<b>地域別訪問者数</b>です。アンケートや入場券の集計ではなく、実際にその地域に滞在した人を推定した値です。</p>
<ul>
<li><b>地元住民</b> — その市・郡・区に住む人。ランキングからは<b>除外</b>しています。</li>
<li><b>域外からの国内訪問者</b> — そこに住んでいない韓国人。本サイトでは<b>「韓国人」</b>と表記します。</li>
<li><b>外国人訪問者</b> — <b>「外国人」</b>ランキングの基準です。</li>
</ul>
<h3>2. 「1,787万」は1,787万人が訪れたという意味ですか</h3>
<p>いいえ。<b>延べ人数</b>です。1日ごとの訪問者数を30日分合計した値なので、<b>同じ人が5日訪れれば5人として数えます。</b>実際の人数より大きくなります。<b>地域どうしの規模を比べる</b>目安としてご覧ください。</p>
<h3>3. なぜ江南区・水原市のような大都市が上位なのですか</h3>
<p>「域外からの訪問者」には旅行者だけでなく<b>通勤・通学・買い物・出張</b>も全て含まれるからです。隣町から毎朝通勤する人も1人として数えられます。そのため<b>純粋な旅行先ランキングとしては大都市が過大評価</b>されます。</p>
<p>旅行先として見たい場合は<b>${M}月の繁忙期タブ</b>をご覧ください。通勤人口は季節で変わらないため自動的に相殺されます。</p>
<h3>4. 繁忙期倍率（例：×1.54）の計算方法</h3>
<p style="text-align:center;background:#f4faf8;border:1px solid #dcefeb;border-radius:10px;padding:13px;font-weight:700;color:#0a6c63;margin:10px 0">
繁忙期倍率 ＝ ${Y}年${M}月の1日平均訪問者 ÷ ${Y}年の平常時1日平均訪問者
</p>
<p><b>鬱陵郡 ×1.54</b> は、鬱陵郡が${Y}年${M}月に<b>その年の平常時より1日あたり1.54倍多い人</b>を迎えたという意味です。訪問者の絶対数ではなく<b>「普段よりどれだけ混んだか」</b>なので、小さな地域でも季節になれば上位に来ます。</p>
<p>基準となる「平常時」は${Y}年の12か月分をまんべんなく標本抽出した1日平均です。母数が小さく倍率が大きく振れる地域（1日平均5,000人未満）は除外しました。</p>
<h3>5. なぜ昨年のデータなのですか</h3>
<p>このデータは<b>約1か月遅れて公開</b>されます（現在の最新集計日：${LAT}）。「今の${M}月にどこが混むか」を遅れた最新データで答えると<b>まったく違う季節の結果</b>になります。<b>昨年同月の実績</b>を使えば季節が正確に一致します。</p>
<p>韓国人・外国人・道別ランキングは季節より規模の比較が目的なので、<b>最新30日（${P}）</b>をそのまま使っています。</p>
<h3>6. 知っておきたい限界</h3>
<ul>
<li>通信・カードデータに基づく<b>推計値</b>で、実際の観光客数とは差があります。</li>
<li>同名の市・郡・区があるため（ソウル中区・仁川中区など）、<b>道・広域市を併記</b>しています。</li>
<li>市・郡・区単位のため、地域内のどの名所が混んだかまでは分かりません。</li>
</ul>
<h3>📌 データ出典</h3>
<p>韓国観光公社 <a href="${DL_URL}" target="_blank" rel="noopener">韓国観光データラボ</a> — 地域別（市郡区・道）日別訪問者数<br>
公共データポータル <a href="${DATAGO_URL}" target="_blank" rel="noopener">韓国観光公社_観光ビッグデータ情報サービス</a>（DataLabService）経由で収集<br>
集計期間：繁忙期ランキング ${Y}年${M}月 / 訪問者ランキング ${P} · 毎週月曜に自動更新</p>
</section>`,
  es: (Y, M, P, LAT, MN) => `<section class="explain" id="howto">
<h2>📖 Cómo leer estas cifras</h2>
<h3>1. Qué se está contando</h3>
<p>Estimaciones de visitantes publicadas por la <b>Organización de Turismo de Corea</b>, obtenidas a partir de <b>datos de antenas de telefonía móvil y pagos con tarjeta</b>. No son encuestas ni venta de entradas: estiman quién estuvo realmente en la zona.</p>
<ul>
<li><b>Residentes</b> — quienes viven en ese distrito. <b>Excluidos</b> de estos rankings.</li>
<li><b>Visitantes nacionales de fuera</b> — coreanos que no viven allí. Aquí aparecen como <b>«coreanos»</b>.</li>
<li><b>Visitantes internacionales</b> — base del ranking de <b>«extranjeros»</b>.</li>
</ul>
<h3>2. ¿«17,9M» significa 17,9 millones de personas distintas?</h3>
<p>No. Es un total de <b>personas-día</b>: la suma de los recuentos diarios durante 30 días. <b>Quien visita cinco días cuenta cinco veces.</b> Sirve para <b>comparar la escala entre distritos</b>, no como número de personas.</p>
<h3>3. ¿Por qué encabezan la lista grandes ciudades como Gangnam-gu?</h3>
<p>Porque «visitantes de fuera» incluye también los desplazamientos por <b>trabajo, estudios, compras y negocios</b>. Quien entra cada mañana desde el pueblo vecino también cuenta. Por eso los grandes distritos metropolitanos están <b>sobrevalorados como destinos turísticos</b>.</p>
<p>Para ver el atractivo turístico real, use la pestaña de <b>temporada alta de ${MN[M]}</b>: los desplazamientos diarios no cambian con las estaciones, así que se anulan.</p>
<h3>4. Cómo se calcula el multiplicador de temporada alta (p. ej. ×1,54)</h3>
<p style="text-align:center;background:#f4faf8;border:1px solid #dcefeb;border-radius:10px;padding:13px;font-weight:700;color:#0a6c63;margin:10px 0">
multiplicador = media diaria de visitantes en ${MN[M]} de ${Y} ÷ media diaria de visitantes en todo ${Y}
</p>
<p><b>Ulleung-gun ×1,54</b> significa que Ulleung-gun recibió <b>1,54 veces su afluencia diaria habitual</b> durante ${MN[M]} de ${Y}. Mide <b>cuánto más concurrido de lo normal</b> está un lugar, no su tamaño — por eso municipios pequeños pueden encabezar la lista en su temporada.</p>
<p>La base «habitual» es una media diaria muestreada de forma uniforme en los 12 meses de ${Y}. Se excluyen los distritos con menos de 5.000 visitantes diarios de media, porque una base pequeña dispara el multiplicador.</p>
<h3>5. ¿Por qué datos del año pasado?</h3>
<p>Estos datos se <b>publican con un mes de retraso</b> (último día disponible: ${LAT}). Responder «¿dónde hay ambiente en ${MN[M]}?» con datos retrasados daría <b>resultados de otra estación</b>. Usar el <b>mismo mes del año anterior</b> encaja con la temporada.</p>
<p>Los rankings de coreanos, extranjeros y provincias comparan escala, no estacionalidad, así que usan los <b>últimos 30 días (${P})</b>.</p>
<h3>6. Limitaciones a tener en cuenta</h3>
<ul>
<li>Son <b>estimaciones</b> basadas en datos de telefonía y tarjetas, no recuentos exactos de turistas.</li>
<li>Varios distritos comparten nombre (Jung-gu en Seúl y en Incheon), por eso <b>siempre se indica la provincia</b>.</li>
<li>El dato es por distrito: no indica qué atracción concreta estuvo concurrida.</li>
</ul>
<h3>📌 Fuente de los datos</h3>
<p>Organización de Turismo de Corea — <a href="${DL_URL}" target="_blank" rel="noopener">Korea Tourism Data Lab</a>, visitantes diarios por distrito y provincia<br>
Recopilado mediante el <a href="${DATAGO_URL}" target="_blank" rel="noopener">Servicio de Big Data Turístico (DataLabService)</a> del portal de datos abiertos de Corea<br>
Periodos: temporada alta ${MN[M]} de ${Y} · rankings de visitantes ${P} · actualización automática cada lunes</p>
</section>`,
  zh: (Y, M, P, LAT, MN) => `<section class="explain" id="howto">
<h2>📖 这些数字怎么看</h2>
<h3>1. 统计的是什么</h3>
<p>由<b>韩国观光公社</b>结合<b>通信基站数据与刷卡消费数据</b>推算的<b>各地区访客人数</b>。并非问卷调查或门票统计，而是对实际在该地区停留人群的估算。</p>
<ul>
<li><b>本地居民</b> — 居住在该市·郡·区的人，本排行<b>不计入</b>。</li>
<li><b>外地国内访客</b> — 不住在当地的韩国人，本站标记为<b>「韩国人」</b>。</li>
<li><b>外国访客</b> — <b>「外国人」</b>排行的统计口径。</li>
</ul>
<h3>2.「1787万」是指1787万人来过吗</h3>
<p>不是。这是<b>人次</b>。把每日访客数累加30天所得，<b>同一人来5天就算5人次。</b>因此高于实际人数，请作为<b>地区之间规模比较</b>的参考。</p>
<h3>3. 为什么江南区、水原市这类大城市排在前面</h3>
<p>因为「外地访客」不仅包括游客，还包括<b>通勤、上学、购物、出差</b>。每天从邻近城市通勤的人也会被计入。所以<b>作为纯粹的旅游地排名，大城市被高估了</b>。</p>
<p>若想看旅游吸引力，请看<b>${M}月旺季</b>标签页——通勤人口不随季节变化，会自动被抵消。</p>
<h3>4. 旺季倍数（如 ×1.54）如何计算</h3>
<p style="text-align:center;background:#f4faf8;border:1px solid #dcefeb;border-radius:10px;padding:13px;font-weight:700;color:#0a6c63;margin:10px 0">
旺季倍数 ＝ ${Y}年${M}月日均访客 ÷ ${Y}年平常日均访客
</p>
<p><b>郁陵郡 ×1.54</b> 表示郁陵郡在${Y}年${M}月接待的人流是<b>该年平常水平的1.54倍</b>。衡量的是<b>「比平时热闹多少」</b>而非绝对人数，因此小地方在自己的旺季也能登上榜首。</p>
<p>作为基准的「平常」，取${Y}年12个月均匀抽样得出的日均值。日均访客不足5,000人的地区已剔除，因为基数过小会让倍数剧烈波动。</p>
<h3>5. 为什么用去年的数据</h3>
<p>该数据<b>约延迟一个月公开</b>（当前最新统计日：${LAT}）。若用延迟的最新数据回答「现在${M}月哪里热闹」，得到的会是<b>完全不同季节的结果</b>。改用<b>去年同月实绩</b>，季节才能对得上。</p>
<p>韩国人·外国人·道别排行以规模比较为目的而非季节，因此直接使用<b>最新30天（${P}）</b>。</p>
<h3>6. 需要了解的局限</h3>
<ul>
<li>基于通信与卡片数据的<b>推算值</b>，与实际游客数存在差异。</li>
<li>存在同名的市·郡·区（首尔中区与仁川中区等），故<b>一律标注道·广域市</b>。</li>
<li>统计到市·郡·区一级，无法得知区域内具体哪个景点热闹。</li>
</ul>
<h3>📌 数据来源</h3>
<p>韩国观光公社 <a href="${DL_URL}" target="_blank" rel="noopener">韩国观光数据实验室</a> — 各地区（市郡区·道）每日访客数<br>
经公共数据门户 <a href="${DATAGO_URL}" target="_blank" rel="noopener">韩国观光公社_观光大数据信息服务</a>（DataLabService）采集<br>
统计期间：旺季排行 ${Y}年${M}月 / 访客排行 ${P} · 每周一自动更新</p>
</section>`
};

// 지역명: 로마자 + 한글 병기 (외국인이 현지에서 검색·길찾기 할 때 한글이 실제로 도움됨)
function bilingual(name) {
  return `${esc(romanizeRegion(name))} <span class="kr">${esc(name)}</span>`;
}
// 로마자 지명이 해당 언어 축제 데이터(제목·주소)에 실제로 존재할 때만 검색 딥링크를 건다.
// (영문·서문 주소는 로마자, 일문·중문 주소는 가나/한자라 매칭이 안 됨)
function langSearchLink(lang, name) {
  const base = romanizeRegion(name).split(' ').pop().split('-')[0];
  if (base.length < 3) return `/${lang}/search/`;
  const k = base.toLowerCase();
  // 종료되지 않은 축제가 있을 때만 딥링크 (검색 기본값이 '지난 축제 제외'라 0건 착지 방지)
  const today = TODAY.replace(/-/g, '');
  const hit = (LANG_DATA[lang] || []).some(f =>
    String(f.end || '') >= today &&
    (String(f.title || '').toLowerCase().includes(k) || String(f.addr || '').toLowerCase().includes(k)));
  return hit ? `/${lang}/search/?kw=${encodeURIComponent(base)}` : `/${lang}/search/`;
}
function bigNum(n, lang) {
  return (lang === 'ja' || lang === 'zh')
    ? (n / 10000).toFixed(0) + '万'
    : (n / 1000000).toFixed(1) + 'M';
}
function rankBarsLang(list, cls, mode, lang, L) {
  if (!list || !list.length) return '<p class="note">-</p>';
  const isS = mode === 'season';
  const top = isS ? list[0].idx : list[0].num;
  const span = isS ? Math.max(0.01, top - 1) : top;
  return `<div class="ranklist">` + list.map(r => {
    const v = isS ? (r.idx - 1) : r.num;
    const w = Math.max(6, Math.min(100, Math.round(v / span * 100)));
    const medal = r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank;
    const label = r.sido ? `${bilingual(r.sido)} ${bilingual(r.name)}` : bilingual(r.name);
    const val = isS ? `<em>${L.times}${r.idx}</em>` : bigNum(r.num, lang);
    return `<div class="rankrow wide ${cls}"><div class="no">${medal}</div>`
      + `<a class="nm" href="${langSearchLink(lang, r.name)}">${label}</a>`
      + `<div class="bar"><i style="width:${w}%"></i></div>`
      + `<div class="val">${val}</div></div>`;
  }).join('') + `</div>`;
}

LANGS.forEach(lang => {
  if (!LANG_DATA[lang] || !LANG_DATA[lang].length) return;
  if (!visitors.kor || !visitors.kor.length) return;
  const L = TREND_L[lang]; if (!L) return;
  const M = SEASON_M, Y = SEASON_Y;
  const tabs = [
    { id: 'season', label: L.tabs.season(M), cls: 'hot', mode: 'season', list: SEASON_LIST, desc: L.desc.season(Y, M) },
    { id: 'kor', label: L.tabs.kor, cls: '', mode: 'num', list: visitors.kor || [], desc: L.desc.kor },
    { id: 'fgn', label: L.tabs.fgn, cls: 'fgn', mode: 'num', list: visitors.fgn || [], desc: L.desc.fgn },
    { id: 'sido', label: L.tabs.sido, cls: '', mode: 'num', list: visitors.sido || [], desc: L.desc.sido }
  ];
  const MN = (lang === 'es')
    ? ['','enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
    : ['','January','February','March','April','May','June','July','August','September','October','November','December'];
  const LATD = visitors.latest ? String(visitors.latest).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1.$2.$3') : '-';
  L.explainHtml = EXPLAIN_L[lang](Y, M, trendUpdated, LATD, MN);
  const content = `<main><div class="wrap">
<style>.rankrow .kr{font-weight:600;opacity:.72;font-size:.86em}</style>
<h1 style="font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:8px 0 4px">${L.h1}</h1>
<p class="note" style="margin-top:0">${L.intro}</p>
<div class="datebadge">📅 ${L.badge(Y, M, trendUpdated)}<br><span>${L.badgeNote}</span></div>
<div class="rank-tabs" id="trendTabs">
${tabs.map((t, i) => `<button type="button" data-t="${t.id}"${i === 0 ? ' class="on"' : ''}>${t.label}</button>`).join('')}
</div>
<p class="ranklegend">${L.legend}</p>
${tabs.map((t, i) => `<section class="trendpane" data-p="${t.id}"${i === 0 ? '' : ' style="display:none"'}>
<h2 class="sec" style="margin-top:6px">${t.label}</h2>
<p class="note" style="margin-top:-4px">${t.desc}</p>
${rankBarsLang(t.list, t.cls, t.mode, lang, L)}
</section>`).join('\n')}
${L.explainHtml}
</div></main>
<script>
(function(){
  var tabs=document.getElementById('trendTabs'); if(!tabs)return;
  tabs.addEventListener('click',function(e){
    var b=e.target.closest('button[data-t]'); if(!b)return;
    var id=b.getAttribute('data-t');
    tabs.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b);});
    document.querySelectorAll('.trendpane').forEach(function(p){p.style.display=(p.getAttribute('data-p')===id)?'':'none';});
  });
})();
</script>`;
  const alts = [{ hreflang: 'ko', href: '/trend/' }]
    .concat(LANGS.filter(l => LANG_DATA[l] && LANG_DATA[l].length && TREND_L[l])
      .map(l => ({ hreflang: l === 'zh' ? 'zh-Hans' : l, href: '/' + l + '/trend/' })))
    .concat([{ hreflang: 'x-default', href: '/trend/' }]);
  writePage(lang + '/trend', layout(L.title(M), L.metad, `/${lang}/trend/`, content, { lang, alternates: alts }));
  TREND_LANG_URLS.push(`/${lang}/trend/`);
});

// ---------- 여행 비용 계산기 (/trip-cost/) ----------
const tripCostContent = `<main><div class="wrap">
<style>
.tc-wrap{max-width:720px;margin:0 auto}
.tc-h1{font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:8px 0 4px}
.tc-sub{color:#6b7280;font-size:.95rem;margin-bottom:16px}
.tc-card{background:#fff;border-radius:16px;box-shadow:0 3px 14px rgba(31,41,55,.08);padding:20px;margin-bottom:16px}
.tc-row{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.tc-field{flex:1;min-width:180px}
.tc-field label{display:block;font-weight:800;font-size:.9rem;color:#374151;margin-bottom:6px}
.tc-field input{width:100%;padding:12px 14px;border:1.5px solid #ffd9cf;border-radius:12px;font-size:1rem;font-family:inherit;background:#fff8f6;box-sizing:border-box}
.tc-adv{margin:6px 0 4px}
.tc-adv summary{cursor:pointer;font-weight:700;font-size:.88rem;color:#e0502f;list-style:none}
.tc-adv summary::-webkit-details-marker{display:none}
.tc-adv .tc-row{margin-top:12px}
.tc-adv input{font-size:.92rem;padding:10px 12px}
.tc-adv label{font-size:.82rem}
.tc-btn{width:100%;background:#ff5a3c;color:#fff;border:none;border-radius:14px;padding:15px;font-weight:800;font-size:1.05rem;cursor:pointer;font-family:inherit;box-shadow:0 6px 18px rgba(255,90,60,.35)}
.tc-btn:disabled{opacity:.6;cursor:default}
.tc-res{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:4px}
@media(max-width:560px){.tc-res{grid-template-columns:1fr}}
.tc-box{border-radius:14px;padding:18px;border:2px solid}
.tc-box.car{border-color:#ffd9cf;background:#fff8f6}
.tc-box.pt{border-color:#cfe7f2;background:#f2f9fc}
.tc-box .mode{font-weight:800;font-size:.95rem;margin-bottom:2px}
.tc-box .amt{font-size:1.7rem;font-weight:900;letter-spacing:-.02em}
.tc-box.car .amt{color:#e0502f}.tc-box.pt .amt{color:#0c6d9c}
.tc-box .sub{font-size:.82rem;color:#6b7280;margin-top:2px}
.tc-break{background:#f9fafb;border-radius:12px;padding:14px 16px;margin-top:14px;font-size:.88rem;color:#374151;line-height:1.7}
.tc-break b{color:#111827}
.tc-verdict{text-align:center;font-weight:800;margin-top:14px;font-size:1.02rem}
.tc-note{color:#9ca3af;font-size:.8rem;margin-top:10px;line-height:1.6}
.tc-err{color:#dc2626;font-weight:700;padding:12px;text-align:center}
</style>
<div class="tc-wrap">
<h1 class="tc-h1">🧮 여행 비용 계산기 — 자동차 vs 대중교통</h1>
<p class="tc-sub">출발지와 도착지를 넣으면 <b>자동차(연료+통행료+주차)</b>와 <b>대중교통(요금)</b> 비용을 비교해 드려요. 어떻게 계산했는지도 다 보여드립니다.</p>
<div class="tc-card">
<div class="tc-row">
<div class="tc-field"><label>출발지</label><input id="tcFrom" type="text" placeholder="예: 서울역, 강남역, 수원시청"></div>
<div class="tc-field"><label>도착지</label><input id="tcTo" type="text" placeholder="예: 보령머드축제, 해운대, 가평"></div>
</div>
<details class="tc-adv"><summary>⚙️ 계산 기준 바꾸기 (연비·유가·주차)</summary>
<div class="tc-row">
<div class="tc-field"><label>연비 (km/L)</label><input id="tcKmpl" type="number" value="12" min="1"></div>
<div class="tc-field"><label>유가 (원/L)</label><input id="tcFuel" type="number" value="1700" min="1"></div>
<div class="tc-field"><label>주차비 (원)</label><input id="tcPark" type="number" value="0" min="0"></div>
</div></details>
<button id="tcGo" class="tc-btn">비용 계산하기</button>
</div>
<div id="tcOut"></div>
<section class="explain" style="margin-top:26px">
<h2>🧮 여행 비용, 어떻게 계산하나요</h2>
<h3>무엇을 비교해 주나요</h3>
<p>출발지에서 목적지까지 <b>자동차로 갈 때</b>와 <b>대중교통으로 갈 때</b>의 편도 비용을 나란히 보여드립니다. 자동차는 연료비에 통행료와 주차비를 더하고, 대중교통은 실제 요금을 가져옵니다. 기차 구간이 있으면 KTX 운임도 함께 계산합니다.</p>
<h3>자동차 비용은 이렇게 나옵니다</h3>
<p style="text-align:center;background:#f4faf8;border:1px solid #dcefeb;border-radius:10px;padding:13px;font-weight:700;color:#0a6c63;margin:10px 0">
자동차 비용 = (주행거리 ÷ 연비) × 유가 + 통행료 + 주차비
</p>
<p>주행거리와 통행료는 실제 내비게이션 경로를 기준으로 합니다. 연비는 12km/L, 유가는 1,700원/L을 기본값으로 두었는데, <b>'계산 기준 바꾸기'</b>를 열면 본인 차에 맞게 고칠 수 있습니다. 경차나 하이브리드라면 연비를 올리고, 대형차라면 낮춰서 계산해 보세요.</p>
<h3>대중교통은 어떻게 되나요</h3>
<p>시내 구간은 버스·지하철 최적 경로의 실제 요금을, 시외 구간은 시외버스 실요금을 우선 사용합니다. 요금 데이터가 없는 구간은 거리를 기준으로 추정하며, 이 경우 화면에 '거리 추정'이라고 표시됩니다. 기차역이 가까우면 KTX 운임표 기준 요금도 같이 보여드립니다.</p>
<h3>왜 실제와 다를 수 있나요</h3>
<p>유가는 매일 바뀌고, 통행료는 차종에 따라 다릅니다. 정체가 심하면 연료가 더 들고, 주말·명절에는 대중교통 요금이 달라지기도 합니다. 그래서 이 계산은 <b>'자동차가 나을까, 대중교통이 나을까'를 가늠하는 용도</b>로 보시는 게 맞습니다. 정확한 금액이 필요하면 각 운송사 앱에서 확인하세요.</p>
<h3>혼자 가면? 넷이 가면?</h3>
<p>여기 나오는 금액은 <b>편도 1대·1인 기준</b>입니다. 자동차는 몇 명이 타든 비용이 같지만 대중교통은 인원수만큼 곱해야 합니다. 그래서 <b>혼자면 대중교통, 셋 이상이면 자동차</b>가 유리해지는 경우가 많습니다. 왕복이라면 두 배로 보시면 됩니다.</p>
</section>
<p class="tc-note">거리·통행료는 카카오내비, 대중교통 요금은 ODsay 기준입니다. 실제 요금은 차종·유종·실시간 유가·할인·정체 등에 따라 달라질 수 있어 <b>비교 참고용</b>입니다. 시외버스·기차(KTX 등) 요금은 ODsay가 제공하지 않아 <b>요금 정보 없음</b>으로 표시돼요. 이땐 코레일·시외버스 앱에서 확인하세요.</p>
</div>
</div></main>
<script>
(function(){
var out=document.getElementById('tcOut');var btn=document.getElementById('tcGo');
function won(n){return (n||0).toLocaleString()+'원';}
function run(){
  var from=document.getElementById('tcFrom').value.trim();var to=document.getElementById('tcTo').value.trim();
  if(!from||!to){out.innerHTML='<div class="tc-err">출발지와 도착지를 모두 입력해주세요.</div>';return;}
  try{localStorage.setItem('cjm_from',from);}catch(e){}
  var kmpl=document.getElementById('tcKmpl').value||12;var fuel=document.getElementById('tcFuel').value||1700;var park=document.getElementById('tcPark').value||0;
  btn.disabled=true;btn.textContent='계산 중…';out.innerHTML='';
  var qs='?from='+encodeURIComponent(from)+'&to='+encodeURIComponent(to)+'&kmpl='+kmpl+'&fuel='+fuel+'&parking='+park;
  fetch('/api/tripcost'+qs).then(function(r){return r.json();}).then(function(d){
    btn.disabled=false;btn.textContent='비용 계산하기';
    if(d.error){out.innerHTML='<div class="tc-err">'+d.error+'</div>';return;}
    var car=d.car;var pt=d.transit;
    var html='<div class="tc-card">';
    html+='<div style="font-size:.9rem;color:#6b7280;margin-bottom:10px">📍 <b>'+d.from.name+'</b> → <b>'+d.to.name+'</b> · 자동차 '+car.distanceKm+'km·'+car.durationMin+'분</div>';
    html+='<div class="tc-res">';
    html+='<div class="tc-box car"><div class="mode">🚗 자동차</div><div class="amt">'+won(car.total)+'</div><div class="sub">편도 기준</div></div>';
    var ptCost=null;
    if(pt&&pt.fare){ptCost=pt.fare;html+='<div class="tc-box pt"><div class="mode">🚌 대중교통</div><div class="amt">'+won(pt.fare)+'</div><div class="sub">'+pt.durationMin+'분'+(pt.transfer?' · 환승 '+pt.transfer+'회':'')+'</div></div>';}
    else if(d.intercityBus){var ib=d.intercityBus;ptCost=ib.fare;html+='<div class="tc-box pt"><div class="mode">🚌 시외버스</div><div class="amt">'+won(ib.fare)+'</div><div class="sub">'+(ib.grade?ib.grade+' · ':'')+ib.dep+'→'+ib.arr+' 터미널</div></div>';}
    else if(d.intercity){var ic=d.intercity;ptCost=ic.busEstimate;html+='<div class="tc-box pt"><div class="mode">🚌 '+(ic.busLabel||'대중교통')+'</div><div class="amt">'+won(ic.busEstimate)+'</div><div class="sub">거리 추정 · <a href="'+ic.routeSearch+'" target="_blank" rel="noopener" style="color:#0c6d9c;font-weight:700">정확히 🔎</a></div></div>';}
    else html+='<div class="tc-box pt"><div class="mode">🚌 대중교통</div><div class="amt" style="font-size:1.05rem">경로 없음</div><div class="sub">안내 어려움</div></div>';
    if(d.ktx){var k=d.ktx;html+='<div class="tc-box ktx" style="border:2px solid #d8c9ef;border-radius:14px;padding:18px;background:#f7f3fd"><div class="mode" style="font-weight:800;font-size:.95rem">🚄 KTX</div><div class="amt" style="font-size:1.7rem;font-weight:900;color:#6d28d9">'+won(k.fare)+'</div><div class="sub" style="font-size:.82rem;color:#6b7280;margin-top:2px">'+k.depStation+'역→'+k.arrStation+'역'+((k.depKm||k.arrKm)?' · 역까지 '+k.depKm+'/'+k.arrKm+'km':'')+'</div></div>';}
    html+='</div>';
    html+='<div class="tc-break"><b>🧮 이렇게 계산했어요</b><br>· 자동차: '+car.formula+'<br>· 기준: 연비 '+d.assumptions.kmpl+'km/L, 유가 '+won(d.assumptions.fuelPrice)+'/L'+(d.assumptions.parking?', 주차 '+won(d.assumptions.parking):'')+((pt&&pt.fare)?'<br>· 대중교통: ODsay 최적경로 요금':(d.intercityBus?'<br>· 시외버스: 국토부 TAGO 실요금('+(d.intercityBus.grade||'')+', '+d.intercityBus.dep+'~'+d.intercityBus.arr+' 터미널)':(d.intercity?'<br>· 대중교통: 거리 추정(요금 데이터 없어 근사)':'')))+(d.ktx?'<br>· KTX: 한국철도공사 운임표 '+d.ktx.depStation+'~'+d.ktx.arrStation:'')+'</div>';
    var opts=[{n:'🚗 자동차',c:car.total}];
    if(ptCost!=null)opts.push({n:(pt&&pt.fare)?'🚌 대중교통':('🚌 '+((d.intercity&&d.intercity.busLabel)||'대중교통')+'(추정)'),c:ptCost});
    if(d.ktx)opts.push({n:'🚄 KTX',c:d.ktx.fare});
    opts.sort(function(a,b){return a.c-b.c;});
    if(opts.length>1)html+='<div class="tc-verdict">가장 저렴: '+opts[0].n+' '+won(opts[0].c)+'</div>';
    html+='</div>';
    html+=${JSON.stringify(buyBox('car'))};
    out.innerHTML=html;
  }).catch(function(){btn.disabled=false;btn.textContent='비용 계산하기';out.innerHTML='<div class="tc-err">계산에 실패했어요. 잠시 후 다시 시도해주세요.</div>';});
}
btn.addEventListener('click',run);
document.getElementById('tcTo').addEventListener('keydown',function(e){if(e.key==='Enter')run();});
document.getElementById('tcFrom').addEventListener('keydown',function(e){if(e.key==='Enter')run();});
(function(){
  var qp=new URLSearchParams(location.search);
  var qTo=qp.get('to'),qFrom=qp.get('from');
  var eF=document.getElementById('tcFrom'),eT=document.getElementById('tcTo');
  try{var sv=localStorage.getItem('cjm_from');if(sv)eF.value=sv;}catch(e){}
  if(qFrom)eF.value=qFrom;
  if(qTo)eT.value=qTo;
  if(qTo&&eF.value.trim())run();
})();
})();
</script>`;
writePage('trip-cost', layout('여행 비용 계산기 — 자동차 vs 대중교통 비용 비교 | ' + SITE_NAME, '축제·여행지까지 자동차(연료+통행료+주차)와 대중교통 비용을 비교 계산. 출발지·도착지만 넣으면 끝. 계산 과정도 투명하게 공개.', '/trip-cost/', tripCostContent));

// ---------- sitemap / robots ----------
const urls = ['/', ...MONTHS.map(m => `/${m.key}/`), '/search/', ...(holidays.length ? ['/holiday/'] : []), '/pet/', ...(apiAccessible.length ? ['/accessible/'] : []), ...(apiTrails.length ? ['/trails/'] : []), ...(apiValleys.length ? ['/valley/'] : []), ...(apiMaple.length ? ['/maple/'] : []), ...(apiFlower.length ? ['/flower/'] : []), ...(apiOnsen.length ? ['/onsen/'] : []), '/jangteo/', '/test/', '/trip-cost/', ...(visitors.kor && visitors.kor.length ? ['/trend/'] : []), ...SIDO_URLS, ...THEME_URLS, ...TRAIL_URLS, ...WALK_URLS, ...TREND_LANG_URLS, '/blog/', ...posts.map(p => `/blog/${p.slug}/`), '/about/', EDITORIAL_URL, '/contact/', '/privacy/',...(apiFestsEn.length ? ['/en/', '/en/search/'] : []), ...(apiFestsJa.length ? ['/ja/', '/ja/search/'] : []), ...(apiFestsEs.length ? ['/es/', '/es/search/'] : []), ...(apiFestsZh.length ? ['/zh/', '/zh/search/'] : [])];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url><loc>${SITE}${u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}
</urlset>`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);

// ---------- RSS 2.0 피드 (네이버 서치어드바이저 RSS 제출 / 구글 뉴스 / 피드 구독) ----------
// 원문 전체(content:encoded)를 실어 색인에 유리하게. 최신순 정렬.
function rfc822(d) { return new Date(d + 'T09:00:00+09:00').toUTCString(); }
function cdata(s) { return `<![CDATA[${String(s || '').replace(/\]\]>/g, ']]&gt;')}]]>`; }
const rssPosts = [...posts].sort((a, b) => String(b.date).localeCompare(String(a.date)));
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${SITE_NAME} — 전국 축제·오일장 가이드</title>
<link>${SITE}/</link>
<atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
<description>전국 축제·오일장 일정과 나들이 가이드. 월별 축제, 반려견 동반, 무장애 여행, 오일장 장날까지 한눈에.</description>
<language>ko</language>
<lastBuildDate>${rssPosts.length ? rfc822(rssPosts[0].date) : new Date().toUTCString()}</lastBuildDate>
<generator>chukjemoa build.js</generator>
${rssPosts.map(p => `<item>
<title>${cdata(p.title)}</title>
<link>${SITE}/blog/${p.slug}/</link>
<guid isPermaLink="true">${SITE}/blog/${p.slug}/</guid>
<pubDate>${rfc822(p.date)}</pubDate>
<description>${cdata(p.desc)}</description>
<content:encoded>${cdata(p.body)}</content:encoded>
</item>`).join('\n')}
</channel>
</rss>`;
fs.writeFileSync(path.join(ROOT, 'rss.xml'), rss);
console.log('✓ rss.xml —', rssPosts.length, '개 글');

fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync(path.join(ROOT, 'ads.txt'), `google.com, pub-3293445488923111, DIRECT, f08c47fec0942fa0\n`);
console.log('✓ sitemap.xml, robots.txt, ads.txt');
console.log('빌드 완료:', urls.length, '페이지');
