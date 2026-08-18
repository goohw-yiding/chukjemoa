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
// ⚠️ toISOString()은 UTC라 KST 오전 9시 이전에 빌드하면 날짜가 하루 밀린다(지난 축제가 남고 sitemap lastmod가 어제로 찍힘).
//    그래서 KST로 고정해서 뽑는다.
const TODAY = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

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
let apiFestsTw = [];
try { apiFestsTw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/festivals_tw.json'), 'utf8')); }
catch (e) { console.log('⚠ festivals_tw.json 없음 — 번체(대만) 데이터 비어있음 (공공데이터포털에서 ChtService2 활용신청 후 node fetch-festivals-tw.js)'); }
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
// tw = 중국어 번체(대만·홍콩). 대만은 2026 방한 3위(연 193만)인데 번체판이 없어서 신설.
// ⚠️ ChtService2는 공공데이터포털에서 별도 활용신청이 필요하다(키는 같아도 서비스별 승인).
const LANGS = ['en','ja','es','zh','tw'];
const LANG_DATA = { en: apiFestsEn, ja: apiFestsJa, es: apiFestsEs, zh: apiFestsZh, tw: apiFestsTw };
const HREFLANG = { zh: 'zh-Hans', tw: 'zh-Hant' };
function homeAlts() { const a = [{ hreflang: 'ko', href: '/' }]; LANGS.forEach(l => { if (LANG_DATA[l].length) a.push({ hreflang: HREFLANG[l] || l, href: '/' + l + '/' }); }); a.push({ hreflang: 'x-default', href: '/' }); return a; }
function searchAlts() { const a = [{ hreflang: 'ko', href: '/search/' }]; LANGS.forEach(l => { if (LANG_DATA[l].length) a.push({ hreflang: HREFLANG[l] || l, href: '/' + l + '/search/' }); }); a.push({ hreflang: 'x-default', href: '/search/' }); return a; }

const MONTHS = [
  { key: '2026-07', months: [7], label: '2026년 7월', short: '7월', emoji: '💦' },
  { key: '2026-08', months: [8], label: '2026년 8월', short: '8월', emoji: '🌊' },
  { key: '2026-09', months: [9], label: '2026년 9월', short: '9월', emoji: '🎆' },
  { key: '2026-10', months: [10], label: '2026년 10월', short: '10월', emoji: '🍁' },
  { key: '2026-11', months: [11], label: '2026년 11월', short: '11월', emoji: '🌾' },
  { key: '2026-12', months: [12, 1], label: '2026년 12월~2027년 1월 겨울', short: '12월·겨울', emoji: '⛄' },
  // 2026-08-18: 월별 페이지가 사이트 최고 CTR(8.45%, GSC 59일)인데 6개뿐이었다 —
  // 2~6월은 페이지 자체가 없어 "내년 봄 축제"를 검색해도 도착할 곳이 없었다.
  // data/festivals.json에 apiFests(TourAPI 915건)에서 실제 봄 축제 70건을 골라 보강(_p11.js 로직,
  // 조건: 기간≤45일·개요≥80자·같은 시도 3건 상한). 기존 7~12월 페이지 로직·데이터는 그대로 둔다.
  { key: '2027-02', months: [2], label: '2027년 2월', short: '2월', emoji: '⛄' },
  { key: '2027-03', months: [3], label: '2027년 3월', short: '3월', emoji: '🌱' },
  { key: '2027-04', months: [4], label: '2027년 4월', short: '4월', emoji: '🌸' },
  { key: '2027-05', months: [5], label: '2027년 5월', short: '5월', emoji: '🌷' },
  { key: '2027-06', months: [6], label: '2027년 6월', short: '6월', emoji: '🌿' },
];

const CAT_EMOJI = { '물놀이': '💦', '음악': '🎵', '음식': '🍜', '꽃': '🌸', '문화': '🎭', '불꽃': '🎆', '전통': '🏮', '빛': '✨', '눈': '⛄', '기타': '🎪' };
const CAT_IMG = { '물놀이': 'water', '음악': 'music', '음식': 'food', '꽃': 'flower', '문화': 'culture', '불꽃': 'firework', '전통': 'tradition', '빛': 'light', '눈': 'snow', '기타': 'etc' };
// ⚠️ 2026-08-10: 카테고리 일러스트가 10장뿐이라 같은 그림이 계속 반복되고 전부 붉은 톤이라
//    목록이 답답해 보였다(장남님 지적). 카테고리마다 색을 완전히 다르게 잡아 새로 만들고,
//    많이 쓰이는 카테고리는 변형을 2개씩 둬서 나란히 있어도 같은 그림이 안 뜨게 한다.
//    (사진이 있는 축제는 원래대로 실사 사진이 우선이다 — 이건 사진 없는 40개용 폴백이다)
const CAT_VARIANTS = { water: 2, music: 2, food: 2, flower: 2, culture: 4, firework: 1, tradition: 3, light: 2, snow: 2, etc: 3 };
// ⚠️ 이름 해시만 쓰면 같은 카테고리 두 장이 나란히 붙을 때 우연히 같은 그림이 나온다(실측: 변산비치펍·대전0시).
//    카드 목록은 순서대로 그려지므로, **카테고리별 회전 카운터**를 쓰면 인접 중복이 원천 차단된다.
const _catTurn = {};
function catImgTurn(f) {
  const key = CAT_IMG[f.category] || 'etc';
  const n = CAT_VARIANTS[key] || 1;
  const i = (_catTurn[key] = (_catTurn[key] || 0) + 1) - 1;
  return '/img/cat2-' + key + '-' + 'abcd'[i % n] + '.webp';
}
// og:image·JSON-LD 처럼 **고정되어야 하는 자리**는 이름 해시로 뽑는다(공유 썸네일이 매번 바뀌면 안 된다)
function catImgOf(f) {
  const key = CAT_IMG[f.category] || 'etc';
  const n = CAT_VARIANTS[key] || 1;
  let h = 0; const s2 = String(f.name || f.title || '');
  for (let i = 0; i < s2.length; i++) h = (h * 31 + s2.charCodeAt(i)) >>> 0;
  return '/img/cat2-' + key + '-' + 'abcd'[h % n] + '.webp';
}

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
  return realImgOf(f) || catImgTurn(f);
}
// JSON-LD·OG용 절대 이미지 URL
function absImgOf(f) {
  const r = realImgOf(f);
  if (r) return r.replace(/^http:/, 'https:');
  return SITE + catImgOf(f);
}
// ---------- og:image ----------
// 109페이지 전부 og:image가 없어서 카톡·SNS·숏폼에 링크를 붙여도 썸네일이 안 떴다.
// 페이지 성격에 맞는 대표 이미지를 자동으로 물린다. 개별 지정은 layout opts.ogImage로.
function ogImageFor(urlPath) {
  const u = String(urlPath || '/');
  if (/^\/valley\//.test(u) || /\/trend\/valley\//.test(u)) return '/img/cat2-water-b.webp';
  if (/^\/maple\//.test(u) || /\/trend\/maple\//.test(u)) return '/img/cat2-tradition-b.webp';
  if (/^\/flower\//.test(u) || /\/trend\/flower\//.test(u)) return '/img/cat2-flower-a.webp';
  if (/^\/onsen\//.test(u) || /\/trend\/onsen\//.test(u)) return '/img/cat2-light-b.webp';
  if (/^\/jangteo\//.test(u)) return '/img/jangteo.webp';
  if (/^\/trails\//.test(u)) return '/img/olle1-07-coast.webp';
  if (/^\/blog\/jeju-olle/.test(u)) return '/img/olle1-01-daepyo.webp';
  if (/^\/2026-1[12]\//.test(u)) return '/img/cat2-snow-a.webp';
  if (/^\/2026-0[678]\//.test(u)) return '/img/cat2-water-a.webp';
  if (/^\/holiday\//.test(u)) return '/img/cat2-firework-a.webp';
  if (/^\/pet\//.test(u)) return '/img/cat2-etc-a.webp';
  return '/img/hero.webp';
}

// Event 스키마의 description — 서치콘솔이 '누락되었습니다'로 잡던 항목(2026-08-06, 15건).
// 공공데이터에 개요(ov)가 없는 축제가 많아 없으면 일정·장소로 한 문장을 만들어 채운다.
function evDesc(f) {
  const ov = String(f.ov || f.desc || '').trim();
  if (ov.length >= 10) return ov;
  const loc = [f.sido, f.sigungu].filter(Boolean).join(' ');
  const d = String(f.start || '').replace(/(\d{4})(\d{2})(\d{2})/, '$1년 $2월 $3일');
  const e = String(f.end || '').replace(/(\d{4})(\d{2})(\d{2})/, '$1년 $2월 $3일');
  return `${f.title || f.name}${loc ? ' — ' + loc + '에서' : ''} ${d}${e && e !== d ? '부터 ' + e + '까지' : ''} 열리는 축제입니다. 일정·장소·요금은 주최 측 사정으로 변경될 수 있으니 방문 전 확인하세요.`;
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
      description: evDesc(f),
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
//   own:true      자사(쿠웅샵) 판매 — 제휴가 아니므로 고지문구·rel이 다르고 nt_* 유입 파라미터가 붙는다.
//   bySeason:{}   계절별로 다른 상품을 노출한다(값 = items의 다른 키). 없으면 연중 동일.
//   up:[]         함께 파는 부속품(업셀). 메인 버튼 아래 작은 알약 링크로 붙는다. upT = 그 링크 문구.

// 빌드 시각을 KST로 고정한다. Vercel 빌드는 UTC라 그냥 getMonth()를 쓰면 월말·월초에 한 달 밀린다.
const KST_NOW = new Date(Date.now() + 9 * 3600 * 1000);
const NOW_MONTH = KST_NOW.getUTCMonth() + 1;
const NOW_SEASON = NOW_MONTH >= 3 && NOW_MONTH <= 5 ? 'spring'
  : NOW_MONTH >= 6 && NOW_MONTH <= 8 ? 'summer'
    : NOW_MONTH >= 9 && NOW_MONTH <= 11 ? 'autumn' : 'winter';

const COUPANG = {
  enabled: true,
  disc: '※ 이 링크는 쿠팡 파트너스 활동의 일환으로, 구매 시 일정 수수료를 제공받습니다.',
  // own:true 인 항목은 자사(쿠웅샵) 판매 상품 — 제휴가 아니므로 고지문구·rel이 다르다
  discOwn: '※ 축제모아를 운영하는 쿠웅샵에서 직접 판매하는 상품입니다.',
  // 스마트스토어 통계 > 마케팅분석 > 사용자정의채널 에서 유입을 구분하는 값
  nt: { source: 'chukjemoa', medium: 'site' },
  items: {
    festival: { ico: '🪵', t: '축제·나들이 갈 때', s: '3단 폴딩 캠핑테이블 · 120x60cm', own: true, q: '캠핑테이블', url: 'https://brand.naver.com/guung/products/4972833368',
                // 여름은 bySeason으로 일괄 교체하지 않는다 — 물축제만 썬캡, 나머지는 캠핑테이블(FEST_BB_WATER 참고)
                bySeason: { winter: 'tripcost', spring: 'flower' } },
    flower:   { ico: '🧺', t: '봄꽃 나들이 준비물', s: '피크닉 돗자리', q: '접이식 돗자리', url: 'https://link.coupang.com/a/fXNSDlRDwa' },
    maple:    { ico: '🪑', t: '단풍 보면서 앉아 쉴 자리', s: '접어서 드는 폴딩 스툴 + 메쉬백', own: true, q: '캠핑의자', url: 'https://brand.naver.com/guung/products/13026204364',
                up: ['gakline', 'chairs'] },
    // 걷기길 39페이지 — 자사 걷기용품이 아직 없어 제휴로 채운다. 등산스틱·무릎보호대는 발주 완료라 입고되면 자사로 교체.
    trails:   { ico: '🥾', t: '걷기 여행 준비물', s: '발 편한 등산화', q: '등산화', url: 'https://link.coupang.com/a/fXNZ2GivM4',
                up: ['pole', 'knee'] },
    // 20인치가 24인치보다 잘 팔린다(64개·177만 vs 34개·108만). 사이즈 선택은 검색 업셀로.
    tripcost: { ico: '🧳', t: '떠나기 전에, 가방부터', s: '초경량 여행 캐리어 20인치', own: true, q: '초경량 캐리어', url: 'https://brand.naver.com/guung/products/13159625424',
                up: ['carriers', 'passport', 'nametag'] },
    car:      { ico: '🚗', t: '장거리 운전 전에', s: '차량용 휴대폰 거치대', q: '차량용 휴대폰 거치대', url: 'https://link.coupang.com/a/fXN2IYC66m' },
    // 5색 동일가(12,900)인데 엑셀은 레드 119개=222만으로 계산이 안 맞는다(과거 고가 시절 매출로 추정).
    //   리뷰 수(네이비70 · 블루28 · 블랙17 · 레드13 · 와인9)와 최근 판매일 모두 네이비 우위 → 메인은 네이비 유지.
    jangteo:  { ico: '🛒', t: '장 보러 갈 때 손이 편하려면', s: '바퀴달린 접이식 장보기 카트 · 5색', own: true, q: '바퀴달린 장바구니', url: 'https://brand.naver.com/guung/products/12580509879',
                up: ['jangcolors'] },
    // 파라솔 3색 중 레드 스트라이프가 최다판매(161개·346만) — 베이지/옐로우는 스토어 검색으로 흡수
    valley:   { ico: '⛱️', t: '계곡 자리에 그늘 하나', s: '각도·높이 조절 UV차단 파라솔 · 3색', own: true, q: '그늘막 파라솔', url: 'https://brand.naver.com/guung/products/10181585601',
                up: ['psbases', 'aqua', 'pstray'], bySeason: { autumn: 'maple', winter: 'tripcost' } },
    onsen:    { ico: '🧖', t: '온천 갈 때 챙기면 좋은 것', s: '가볍게 마르는 여행용 타월', q: '여행용 타월', url: 'https://link.coupang.com/a/fXOCpczJqC' },
    pet:      { ico: '🐾', t: '반려견과 떠난다면', s: '강아지 이동가방', q: '강아지 이동가방', url: 'https://link.coupang.com/a/fXOFfqmH4S' },
    // ↓ 아래 3종은 단독 페이지가 없고 bySeason·up 을 통해서만 노출된다(쿠웅샵 자사상품)
    suncap:   { ico: '🧢', t: '물축제 가는 날, 얼굴은 지키고', s: '투명썬캡 · 자외선 86.3% 차단(FITI 시험 성적)', own: true, q: '투명썬캡', url: 'https://brand.naver.com/guung/products/4545903063' },
    psbase:   { ico: '🪣', t: '계곡 바닥엔 파라솔이 안 꽂힙니다', s: '물·모래 채우는 파라솔 받침대 20kg', own: true, q: '파라솔 물통 받침대', url: 'https://brand.naver.com/guung/products/10227650214',
                upT: '🪣 물통 받침대 20kg — 돌바닥·모래에도 세워집니다' },
    aqua:     { ico: '🩴', t: '계곡 돌바닥, 맨발은 위험합니다', s: '미끄럼 방지 아쿠아슈즈 230~270', own: true, q: '아쿠아슈즈', url: 'https://brand.naver.com/guung/products/13302370033',
                upT: '🩴 아쿠아슈즈 — 이끼 낀 돌에서 안 미끄러집니다' },
    pstray:   { ico: '🥤', t: '파라솔에 끼우는 테이블', s: '다용도 파라솔 트레이 · 컵홀더', own: true, q: '파라솔 트레이', url: 'https://brand.naver.com/guung/products/10258766453',
                upT: '🥤 파라솔 트레이 — 음료·핸드폰 놓을 데가 생깁니다' },
    // 잔디·모래처럼 단단한 바닥용. 물통받침대와 성격이 달라 별도 항목으로 둔다.
    psteel:   { ico: '🔩', t: '단단한 바닥이라면', s: '스틸 사각 파라솔 받침대 · 3단 지름조절', own: true, q: '스틸 파라솔 받침대', url: 'https://brand.naver.com/guung/products/10240115222',
                upT: '🔩 스틸 사각 받침대 — 잔디·데크에 고정' },
    // 받침대는 바닥에 따라 골라야 해서 3종(물통20kg·스틸고정·튜브8.5kg)을 스토어 검색 한 칸으로 묶는다.
    //   페이지당 업셀 2~3칸 원칙을 지키면서 3개 상품을 다 노출하는 방법. 개별키(psbase/psteel)는 블로그용으로 남겨둠.
    psbases:  { ico: '🪣', t: '계곡 바닥엔 파라솔이 안 꽂힙니다', s: '파라솔 받침대 3종 · 물통 20kg / 스틸 고정 / 튜브 8.5kg', own: true, q: '파라솔 받침대',
                url: 'https://brand.naver.com/guung/search?q=' + encodeURIComponent('파라솔 받침대'),
                upT: '🪣 받침대 고르기 — 물통 20kg · 스틸 고정 · 튜브 8.5kg' },
    // 투명(86.3%)이 345개로 더 팔린다 = 사람들은 차단율보다 투명을 고른다. 그래서 98.1%는 메인이 아닌 업셀.
    suncap98: { ico: '🧢', t: '더 강하게 막고 싶다면', s: '썬캡 워터밤 · 자외선 98.1% 차단(FITI 시험 성적)', own: true, q: '썬캡', url: 'https://brand.naver.com/guung/products/4545903062',
                upT: '🧢 98.1% 차단형 — 자외선을 더 막습니다' },
    // 2026년 입고했는데 노출 자리가 없어 2개 판매. 여름 축제 모달 업셀로 8월 남은 기간 판단한다.
    necool:   { ico: '❄️', t: '더위, 목부터 식히세요', s: 'PCM 넥쿨러 아이스넥링 · 28도에서 다시 언다', own: true, q: '넥쿨러', url: 'https://brand.naver.com/guung/products/13490127630',
                upT: '❄️ PCM 넥쿨러 — 28도에서 다시 얼어 반복 사용' },
    // 오일장 — 카트 5색은 검색 한 칸으로, 폴딩박스는 '장 본 걸 담아 온다'는 다음 행동
    jangcolors: { ico: '🎨', t: '색상 고르기', s: '장보기카트 5색 · 네이비/레드/블랙/블루/와인', own: true, q: '장보기카트',
                url: 'https://brand.naver.com/guung/search?q=' + encodeURIComponent('장보기카트'),
                upT: '🎨 색상 고르기 — 네이비 · 레드 · 블랙 · 블루 · 와인' },
    // 여행준비 — 20/24/세트는 검색 한 칸, 네임택·여권지갑은 2026년 입고인데 노출 자리가 없던 것
    carriers: { ico: '📏', t: '사이즈 고르기', s: '20인치 · 24인치 · 20+24 세트', own: true, q: '여행캐리어',
                url: 'https://brand.naver.com/guung/search?q=' + encodeURIComponent('캐리어'),
                upT: '📏 사이즈 고르기 — 20인치 · 24인치 · 두 개 세트' },
    passport: { ico: '🛂', t: '여권은 따로 챙기세요', s: '여권지갑 케이스 · RFID 차단 자석형', own: true, q: '여권지갑', url: 'https://brand.naver.com/guung/products/13302183883',
                upT: '🛂 여권지갑 RFID 차단 — 스캔 도난을 막습니다' },
    nametag:  { ico: '🏷️', t: '수하물 찾을 때', s: '캐리어 네임택 러기지택', own: true, q: '캐리어 네임택', url: 'https://brand.naver.com/guung/products/13302496481',
                upT: '🏷️ 네임택 — 컨베이어에서 내 가방을 바로 찾습니다' },
    // 축제 좌석 — [gak] 페스티벌 3종(세트·스툴 단품·메쉬백 단품)은 검색 한 칸으로 묶는다
    gakline:  { ico: '🪑', t: '세트로 살까 단품으로 살까', s: '[gak] 페스티벌 · 메쉬백&스툴 세트 / 스툴 단품 / 메쉬백 단품', own: true, q: '페스티벌 스툴',
                url: 'https://brand.naver.com/guung/search?q=' + encodeURIComponent('페스티벌'),
                upT: '🪑 세트 · 스툴 단품 · 메쉬백 단품 — 골라 담기' },
    // 스툴은 등받이가 없다. 오래 앉는 축제엔 등받이 의자가 객단가도 높다(34개·235만, 개당 6.9만)
    chairs:   { ico: '💺', t: '오래 앉을 거라면 등받이', s: '접이식 테라스 폴딩 캠핑의자 · 4색', own: true, q: '접이식 캠핑의자', url: 'https://brand.naver.com/guung/products/11585759983',
                upT: '💺 등받이 폴딩 의자 — 스툴보다 오래 앉습니다' },
    // ⛰️ 명산 페이지용(가을 등산). 걷기길 자사상품이 없어 우선 스툴로 대응 — 걷기용품 소싱되면 교체
    mountain: { ico: '🪑', t: '정상에서 앉아 쉴 자리', s: '접어서 드는 폴딩 스툴 + 메쉬백', own: true, q: '폴딩 스툴', url: 'https://brand.naver.com/guung/products/13026204364',
                up: ['pole', 'knee'] },

    // ───── 자사 상품이 없는 자리를 우선 쿠팡으로 메운 것 (2026-08-10) ─────
    // ⚠️ url 이 비어 있으면 일반 쿠팡 검색으로 폴백한다 = 링크는 살아 있지만 **수수료가 안 붙는다.**
    //    partners.coupang.com → 검색결과 링크 → 아래 q 값 입력 → 나온 https://link.coupang.com/a/XXXX 를 url 에 넣을 것.
    // ★ 교체 방법: 자사 상품이 입고되면 이 항목의 url 을 스마트스토어 주소로 바꾸고 own:true 를 켜면
    //    고지 문구·rel·유입 파라미터까지 전부 자동으로 자사 모드로 바뀐다. 다른 곳은 손댈 필요 없다.
    // 🔜 등산스틱·무릎보호대는 2026-08 발주 완료(등산스틱 Seabuo · 무릎보호대 途愫). 입고되면 여기부터 교체.
    pole:     { ico: '🦯', t: '오래 걸을 거라면', s: '경량 등산스틱 (2단·손목스트랩)', q: '등산스틱', url: 'https://link.coupang.com/a/f55oqk7CGi',
                upT: '🦯 등산스틱 — 내리막에서 무릎 부담을 줄입니다' },
    knee:     { ico: '🦵', t: '내리막에서 무릎이 시큰하면', s: '무릎보호대 (압박형)', q: '무릎보호대', url: 'https://link.coupang.com/a/f55ro9jebQ',
                upT: '🦵 무릎보호대 — 긴 코스일수록 차이가 납니다' },
    hotpack:  { ico: '🔥', t: '겨울 축제는 추위와의 싸움', s: '손난로 핫팩 (붙이는 것·쥐는 것)', q: '핫팩', url: 'https://link.coupang.com/a/f55uDRMZ9o',
                upT: '🔥 핫팩 — 눈축제는 서 있는 시간이 깁니다' }
  }
};

// ---------- 축제 상세 페이지의 상품 매칭 ----------
// ⚠️ 2026-08-10: 축제 상세 140개가 **전부 같은 상품 세트**를 보여주고 있었다.
//    안동 탈춤 보러 온 사람에게 아쿠아슈즈를 권하고 있던 셈이다.
//    축제 이름으로 성격을 갈라 맞는 것만 붙인다(모달의 CJM_WATER_RE와 같은 사고).
//
// 📏 2026-08-10 확장(상세 140 → 377개). 넓히고 나서 실측하니 **377개 중 239개(63%)가
//    아무 규칙에도 안 걸려 기본값(캠핑테이블)으로 떨어지고 있었다.** 페이지를 늘려도
//    안 걸리는 비율이 그대로면 늘린 만큼 그냥 버리는 셈이라 규칙을 12줄로 넓혔다.
//    안 걸리던 것들의 실제 정체: 맥주·커피·빵 / 수산물·특산물 / 마라톤 / 궁궐·유산 재현 /
//    반려동물 / 어린이·가족 / 드론쇼 / 여름 나잇페스타.
//
// ⚠️ 순서가 곧 우선순위다(먼저 걸리는 규칙이 이긴다). 구체적인 것을 위에 둔다.
//    · 걷기를 맨 위에 — '스프링워크서울'이 아래 꽃 규칙('봄')에 먼저 잡히면 안 된다
//    · 물을 여름보다 위에 — '안동 수(水)페스타'는 여름이지만 '봉화은어축제'는 물에 들어간다
//    · 음식을 유산보다 위에 — '산청농특산물대제전'의 '대제'가 종묘대제 규칙에 잡히면 안 된다
// ⚠️ 절대 넣으면 안 되는 글자: 홑글자 `술`(→ 서울·예술제가 다 걸린다), 홑글자 `차`(→ 차 없는 잠수교).
//    그래서 술은 `막걸리|맥주|와인|주류|가맥`, 차는 `야생차|찻사발|차문화` 처럼 두 글자 이상으로만 쓴다.
const FEST_KIND = [
  // 많이 걷는 축제 — 마라톤·3종·뚜벅뚜벅도 결국 다리가 아프다
  [/걷기|둘레길|올레|트레킹|도보|순례|숲길|마라톤|워크|뚜벅|3종|트레일|산행|등반/,                    ['trails', 'pole', 'knee']],
  [/펫스타|펫 |반려동물|반려견|댕댕|강아지|멍멍/,                                                    ['pet', 'suncap']],
  // ⚠️ `물축제` 앞에 (?<!나) 가 붙은 이유 — '홍천 산나물축제'가 물축제로 잡혀서 아쿠아슈즈를 권하고 있었다.
  [/(?<!나)물축제|물놀이|물싸움|머드|워터|해수욕|해변|바다축제|비치|계곡|서핑|모래|백사장|갯벌|갯골|조개|바지락|은어|바닷길|어방/, ['aqua', 'suncap', 'necool']],
  // 여름 나잇페스타 계열 — 물에 안 들어가도 더위가 본체다
  [/썸머|서머|여름|시원|쿨밸리|水|바캉스|납량|피서/,                                                 ['necool', 'suncap', 'chairs']],
  [/눈꽃|눈축제|얼음|빙어|송어|산천어|겨울|한파|스키|썰매|빙등|해맞이|정월대보름/,                    ['hotpack', 'chairs']],
  [/벚꽃|유채|장미|연꽃|국화|철쭉|코스모스|튤립|수국|해바라기|꽃축제|꽃무릇|상사화|매화|진달래|군항제|봄꽃|봄빛|봄나들이|봄맞이|봄축제|가든|Garden|정원|라벤더|양귀비|맥문동|청보리|보리밭|작약|메밀꽃|꽃 |꽃별|꽃빛|꽃대림/, ['flower', 'gakline']],
  [/불꽃|불빛|빛축제|등축제|야행|야간|미디어아트|루미나리에|별빛|달빛|드론|라이트쇼|나잇|반딧불/,     ['chairs', 'gakline']],
  [/음악|재즈|록페|뮤직|콘서트|가요|트로트|밴드|힙합|EDM|아리랑|버스킹|국제음악/,                     ['gakline', 'chairs']],
  // 술·커피·빵은 '앉아서 오래 마신다'가 본질이라 먹거리(테이블)와 달리 스툴을 앞에 둔다
  [/막걸리|맥주|와인|주류|가맥|꿀맥|하맥|양조|전통주|수제맥주|술페스타|커피|카페|빵 |빵지/,           ['gakline', 'chairs']],
  [/김치|막국수|치맥|포도|사과|대추|한우|먹거리|음식|맛|푸드|미식|인삼|산나물|수박|딸기|감귤|삼계탕|장류|홍삼|산삼|약초|고추|참외|옥수수|곶감|메밀|전병|우럭|전어|대문어|멸치|소라|꼴갑|수산물|농특산|특산물|대제전|지평선|생명축제|한방|야생차|찻사발|차문화|다과|포구축제|항구축제|요리축제|시식|수라간/, ['festival', 'chairs']],
  // 온천·족욕은 앉아 쉬는 축제 — 자사 온천 상품이 따로 있다
  [/온천|족욕|찜질/,                                                                                ['onsen', 'chairs']],
  // 문화·전통·공연은 '오래 서서 보거나 앉을 데가 없다'가 실제 불편이다. 등받이 의자가 객단가도 높다(개당 6.9만).
  // 궁궐 의식·성곽·대첩 재현도 결국 같은 불편이라 한 줄로 묶는다.
  [/탈춤|국악|전통|문화제|민속|역사|재현|한마당|예술제|공연|연극|마당놀이|축제한마당|궁|종묘|수문장|파수|대제|산성|읍성|성제|고분|왕실|왕가|유산|불교|서원|향교|대첩|이순신|거북선|장군|의병|동학|선비|한복|도자|공예|자기|단오|춘향|문화축제|문화축전|예술축제|거리극|마임|서커스|춤축제|마당극|풍물|한글|선사|대나무/, ['gakline', 'chairs']],
  // 어린이·가족은 짐이 많고 앉을 데가 없다. 메쉬백이 붙은 스툴 세트가 맞다.
  [/어린이|키즈|가족|동화|유아|아동|인형극|만화|캐릭터|놀이/,                                        ['gakline', 'chairs']]
];
// 월별 축제 페이지(7~12월) — 그 달 날씨에 맞는 준비물. 여름은 더위, 가을은 앉을 자리, 겨울은 추위.
function monthBuyBox(m) {
  const keys = m >= 6 && m <= 8 ? ['festival', 'necool', 'suncap']
    : m >= 9 && m <= 10 ? ['maple', 'gakline', 'chairs']
      : (m >= 11 || m <= 2) ? ['hotpack', 'chairs']
        : ['flower', 'gakline'];
  return `<div class="wrap">${renderBuyBox(keys[0], keys.slice(1), 'month-' + m)}</div>`;
}
// 위 어디에도 안 걸리면(문화·전통·기타) 계절 로테이션 기본값을 쓴다.
function festBuyBox(title) {
  const t = String(title || '');
  for (const [re, keys] of FEST_KIND) {
    if (re.test(t)) return renderBuyBox(keys[0], keys.slice(1), 'festival-page');
  }
  return buyBox('festival');
}
// 페이지 키 → 이번 달에 실제로 노출할 상품 키 (bySeason 이 없으면 그대로)
function seasonKey(pageKey) {
  const it = COUPANG.items[pageKey];
  const alt = it && it.bySeason && it.bySeason[NOW_SEASON];
  return (alt && COUPANG.items[alt]) ? alt : pageKey;
}
// detail = 스마트스토어 유입 통계에 남길 값. 계절 로테이션·업셀에서는 "어느 페이지에서 눌렀는지"를
//          남겨야 하므로 호출부가 페이지 키를 넘긴다. 안 넘기면 예전처럼 상품 키를 쓴다.
function cpHref(key, detail) {
  const it = COUPANG.items[key];
  if (!it) return 'https://www.coupang.com/np/search?q=' + encodeURIComponent('여행용품');
  if (!it.url) return 'https://www.coupang.com/np/search?q=' + encodeURIComponent(it.q);
  if (!it.own) return it.url;
  const sep = it.url.indexOf('?') >= 0 ? '&' : '?';
  return it.url + sep + 'nt_source=' + COUPANG.nt.source
    + '&nt_medium=' + COUPANG.nt.medium + '&nt_detail=' + (detail || key);
}
// 페이지당 1개 원칙. 클릭 시 중간 페이지 없이 바로 쿠팡으로 이동.
// ---------- 블로그 글별 고정 매칭 ----------
// 블로그는 "이 축제에 뭘 챙겨가지"를 이미 읽고 있는 사람이라 구매의도가 가장 높다.
// 그래서 계절 로테이션에 맡기지 않고 글 내용에 맞는 상품을 고정으로 붙인다.
// 배열 = [메인상품키, 업셀키...]  · 없는 slug는 아무것도 안 붙는다.
const BLOG_BUYBOX = {
  // 여름 물놀이 — 본문에 이미 "아쿠아슈즈"·"방수팩 필수"라고 써 있는 글들
  'boryeong-mud-guide':               ['aqua', 'suncap'],
  'summer-water-festivals-2026':      ['suncap', 'aqua'],
  'jangheung-water-festival-guide':   ['suncap', 'aqua'],
  'valley-summer-guide-2026':         ['valley', 'psbases', 'aqua'],
  'busan-sea-festival-guide':         ['valley', 'psbases', 'suncap'],
  // 가을·야간 축제 — 앉을 자리가 관건
  'muju-firefly-festival-guide':      ['maple', 'chairs'],
  'andong-mask-dance-festival-guide': ['maple', 'chairs'],
  'bongpyeong-buckwheat-festival-guide': ['maple', 'jangteo'],   // 봉평장 연계 코스가 본문에 있음
  'autumn-festivals-2026':            ['maple', 'gakline', 'chairs'],
  // 오일장
  'ojang-day-guide':                  ['jangteo', 'jangcolors'],
  'ojang-train-trip-course':          ['jangteo', 'jangcolors'],
  // 반려견 (여름 준비물 글)
  'pet-friendly-festival-guide':      ['pet', 'suncap'],
  // 걷기 — 현재 자사 걷기용품이 없어 제휴 등산화. 소싱 완료되면 교체할 것
  'jeju-olle-course-guide':           ['trails', 'pole', 'knee'],
  'jeju-olle-course-1':               ['trails', 'pole', 'knee'],
  // 2026-08-10 추가 — 21편 중 6편이 아무 상품도 안 붙어 있었다
  'walking-trails-by-distance':       ['trails', 'pole', 'knee'],   // 평균 13.5km라고 본문이 말하는 글
  'maple-october-crowd-guide':        ['maple', 'chairs'],
  'sangsahwa-kkotmuret-guide':        ['flower', 'gakline'],
  'chuseok-2026-holiday-guide':       ['tripcost', 'carriers', 'car'],
  'festival-food-hours-data':         ['festival', 'chairs'],
  'national-treasure-cities-data':    ['trails', 'knee']            // 유적 답사는 결국 많이 걷는다
};
function buyBox(pageKey) {
  const key = seasonKey(pageKey);
  return renderBuyBox(key, (COUPANG.items[key] || {}).up, pageKey);
}
// ⚠️ 2026-08-18 전체 점검에서 발견한 구조적 누수:
//    BLOG_BUYBOX 는 «손으로 적는 표»인데 자동 글쓰기는 여기에 항목을 추가하지 않는다.
//    그래서 자동 발행된 글 8편(27편 중 30%)에 상품이 하나도 없었고, 매일 1편씩 늘고 있었다.
//    → 표에 없으면 제목·태그로 자동 매칭하고, 그것도 안 걸리면 계절 기본값을 쓴다. 이제 0인 글은 없다.
const BLOG_AUTO = [
  [/걷기|둘레길|올레|해파랑|남파랑|서해랑|갈맷|트레킹|등산|산행|명산|코스 고르|완주/, ['trails', 'pole', 'knee']],
  [/오일장|5일장|장날|장터|전통시장/, ['jangteo', 'jangcolors']],
  [/물놀이|계곡|워터|머드|해수욕|물축제|피서/, ['valley', 'psbases', 'aqua']],
  [/단풍|가을꽃|국화|억새/, ['maple', 'gakline', 'chairs']],
  [/봄꽃|벚꽃|유채|철쭉|진달래|튤립|상사화|꽃무릇/, ['flower', 'gakline']],
  [/반려|강아지|댕댕|펫/, ['pet', 'suncap']],
  [/온천|족욕|스파/, ['onsen', 'tripcost']],
  [/눈꽃|얼음|빙어|산천어|겨울|스키|송어/, ['hotpack', 'chairs']],
  [/숙소|숙박|교통|대중교통|이동|거리|연휴|추석|여행비용|캐리어|짐/, ['tripcost', 'carriers', 'car']],
  [/유등|야행|불꽃|등불|야간|탈춤|국악|전통|문화제|공연/, ['gakline', 'chairs']]
];
function blogAutoKeys(p) {
  const t = [p.title || '', (p.tags || []).join(' '), p.slug || ''].join(' ');
  for (const [re, keys] of BLOG_AUTO) if (re.test(t)) return keys;
  return null;
}
function blogBuyBox(p) {
  const slug = typeof p === 'string' ? p : p.slug;
  const m = BLOG_BUYBOX[slug] || (typeof p === 'object' ? blogAutoKeys(p) : null);
  if (m && m.length) return renderBuyBox(m[0], m.slice(1), 'blog-' + slug);
  return buyBox('festival');                 // 마지막 안전망 — 빈 채로 나가지 않는다
}
function renderBuyBox(mainKey, upKeys, detail) {
  if (!COUPANG.enabled) return '';
  const key = mainKey;
  const it = COUPANG.items[key]; if (!it) return '';
  const ups = (upKeys || []).map(uk => {
    const u = COUPANG.items[uk]; if (!u) return '';
    const urel = u.own ? 'nofollow noopener' : 'nofollow sponsored noopener';
    // ⚠️ 쿠팡 제휴 링크에는 우리 파라미터를 못 붙인다(딥링크가 고정 주소다).
    //    그래서 «무슨 상품을 어느 자리에서» 눌렀는지는 data 속성으로 남긴다 — 안 그러면 GA에 전부 'coupang'으로 뭉개진다.
    return `<a class="bb-up" data-bb="${esc(uk)}" data-slot="upsell" data-place="${esc(detail || '')}" href="${cpHref(uk, detail + '-' + uk)}" target="_blank" rel="${urel}">${esc(u.upT || u.s)}</a>`;
  }).filter(Boolean).join('');
  // 메인·업셀에 자사상품과 제휴상품이 섞일 수 있으므로 고지문구도 섞어서 낸다
  const hasOwn = it.own || (upKeys || []).some(uk => COUPANG.items[uk] && COUPANG.items[uk].own);
  const hasAff = !it.own || (upKeys || []).some(uk => COUPANG.items[uk] && !COUPANG.items[uk].own);
  const disc = [hasOwn ? COUPANG.discOwn : '', hasAff ? COUPANG.disc : ''].filter(Boolean).join(' ');
  const rel = it.own ? 'nofollow noopener' : 'nofollow sponsored noopener';
  return `<a class="buybox" data-bb="${esc(key)}" data-slot="main" data-place="${esc(detail || '')}" href="${cpHref(key, detail)}" target="_blank" rel="${rel}">`
    + `<span class="bb-ico">${it.ico}</span>`
    + `<span class="bb-txt"><b>${esc(it.t)}</b><span class="bb-sub">${esc(it.s)}</span></span>`
    + `<span class="bb-arrow">›</span></a>`
    + (ups ? `<div class="bb-ups">${ups}</div>` : '')
    + `<div class="bb-disc">${disc}</div>`;
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
  <div class="thumb"><img src="${esc(thumbOf(f))}" alt="${esc(f.name)}" loading="lazy" onerror="this.src=&#39;${catImgOf(f)}&#39;"><span class="dday"></span><button class="fav" data-name="${esc(f.name)}" aria-label="찜하기">♡</button><span class="km"></span><span class="cat">${emoji} ${esc(f.category)}</span></div>
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

// ---------- 축제 모달 버이박스: 물축제 분기 ----------
// 여름이라고 모든 축제에 썬캡을 띄우면 실내·야간 축제에서 어색하다.
// 축제 이름이 물축제 계열일 때만 썬캡+아쿠아슈즈, 아니면 계절 기본값(여름·가을=캠핑테이블)을 쓴다.
// ⚠️ '물' 한 글자로 매칭하면 '박물관축제'가 걸린다 — 반드시 아래 토큰 목록으로만 판정할 것.
// 여름 축제는 물축제가 아니어도 덥다 → 기본값(캠핑테이블)에 넥쿨러를 업셀로 붙인다.
// 물축제 13건보다 일반 여름축제가 훨씬 많아서 넥쿨러 노출은 여기가 맞다.
const FEST_MAIN = seasonKey('festival');
// 축제 모달은 922건 전체에 뜨는 최대 노출 자리다. 메인이 캠핑테이블일 때(여름·가을)만 좌석 업셀을 붙이고,
// 겨울(캐리어)·봄(돗자리)로 바뀌면 그 상품이 원래 갖고 있는 업셀을 그대로 쓴다.
const FEST_UP = FEST_MAIN === 'festival'
  ? (NOW_SEASON === 'summer' ? ['necool', 'chairs'] : ['chairs', 'gakline'])
  : (COUPANG.items[FEST_MAIN] || {}).up;
const FEST_BB_BASE = renderBuyBox(FEST_MAIN, FEST_UP, 'festival');
const FEST_BB_WATER = NOW_SEASON === 'summer'
  ? renderBuyBox('suncap', ['suncap98', 'aqua'], 'festival-water')
  : FEST_BB_BASE;
const FEST_BB_JS = `<script>
window.CJM_FEST_BB={base:${JSON.stringify(FEST_BB_BASE)},water:${JSON.stringify(FEST_BB_WATER)}};
// 축제명에 나오면 물축제로 보는 말 (바다·해변 같은 낱말은 '여수밤바다 불꽃축제'까지 걸려서 뺐다)
window.CJM_WATER_RE=/물축제|물놀이|물싸움|머드|워터밤|워터파크|해수욕|해변축제|바다축제|비치페스티벌|계곡|서핑|썸머|피서|모래축제|백사장/;
// 장소·주소는 '진짜 물가'인 것만 본다
window.CJM_WATER_VENUE_RE=/해수욕장|워터파크|계곡|수영장|물놀이장/;
// 이게 걸리면 물가에 있어도 썬캡이 아니다 (야간·실내·겨울)
// ⚠️ '물축제'는 반려동'물축제'·수산'물축제'·산나'물축제'에도 들어간다. 한글엔 단어 경계가 없어
//    정규식으로 못 막으니, 걸리는 앞말을 여기에 모아 제외한다. 새 오탐이 보이면 여기에 추가할 것.
window.CJM_NOTWATER_RE=/반려동물|수산물|농산물|특산물|해산물|임산물|나물|먹거리|야행|야시장|나이트|나잇|불꽃|밤바다|야간|실내|박물관|미술관|겨울|동장군|눈꽃|얼음|성탄|크리스마스|해넘이|해돋이/;
// 축제명만 보면 '해운대 모래축제'처럼 해변인데 못 잡는 게 생긴다 → 장소·주소까지 같이 판정한다.
window.cjmFestBB=function(elId,name,place){
  var el=document.getElementById(elId); if(!el||!window.CJM_FEST_BB) return;
  var n=String(name||''), p=String(place||'');
  var water=(window.CJM_WATER_RE.test(n)||window.CJM_WATER_VENUE_RE.test(p))
            && !window.CJM_NOTWATER_RE.test(n+' '+p);
  el.innerHTML=water?window.CJM_FEST_BB.water:window.CJM_FEST_BB.base;
};
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
          // 서버는 ODsay 를 못 부른다(데이터센터 IP 차단) → 브라우저에서 직접 채운다. odsay.js 머리말 참고.
          if(d.error||!d.car||!d.geo||!window.cjmOdsay)return d;
          return window.cjmOdsay(d.geo.ox,d.geo.oy,d.geo.dx,d.geo.dy).then(function(t){
            if(t&&t.fare){d.transit=t;d.intercity=null;d.diff=d.car.total-t.fare;}
            return d;
          });
        })
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
<div id="fm2-bb">${FEST_BB_BASE}</div>
<div class="fm-links"><a id="fm2-page" class="fm-page">📄 이 축제 상세 페이지</a><a id="fm2-hp" target="_blank" rel="noopener">🏛️ 공식 홈페이지</a><a id="fm2-naver" target="_blank" rel="noopener">🔎 네이버에서 보기</a></div>
</div></div>`;
const FEST_MODAL_JS = `<script>
(function(){
  var m=document.getElementById('festmodal'); if(!m) return;
  function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function fy(y){y=String(y||'').replace(/[^0-9]/g,'');if(y.length<8)return '';return y.slice(0,4)+'.'+(+y.slice(4,6))+'.'+(+y.slice(6,8));}
  window.openFestModal=function(ds){
    var img=document.getElementById('fm2-img');
    if(ds.img){img.src=ds.img;img.alt=(ds.name||'')+' 사진';img.style.display='block';}else{img.alt='';img.style.display='none';}
    document.getElementById('fm2-title').textContent=ds.name||'';
    if(window.cjmFestBB)window.cjmFestBB('fm2-bb',ds.name,ds.place);
    var loc=[ds.region,ds.city,ds.place].filter(Boolean).join(' ');
    var dr=fy(ds.start)+(ds.end&&String(ds.end).replace(/[^0-9]/g,'')!==String(ds.start).replace(/[^0-9]/g,'')?' ~ '+fy(ds.end):'');
    document.getElementById('fm2-meta').textContent=[dr,loc].filter(Boolean).join('  ·  ');
    var ovTxt=ds.ov||ds.desc||'';
    document.getElementById('fm2-ov').innerHTML=ovTxt&&window.cjmProse?window.cjmProse(ovTxt):esc(ovTxt||'상세 개요는 아래 네이버·공식 홈페이지에서 확인하세요.');
    var nearEl=document.getElementById('fm2-near');nearEl.innerHTML='';
    if(ds.near){try{var arr=JSON.parse(decodeURIComponent(ds.near));if(arr&&arr.length){nearEl.innerHTML='<div style="font-weight:800;color:#0a6c63;margin:16px 0 8px">📍 근처 가볼 곳</div><div style="display:flex;flex-wrap:wrap;gap:8px">'+arr.map(function(n){return '<a href="https://search.naver.com/search.naver?query='+encodeURIComponent(n.t)+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;background:#f4faf8;border:1px solid #dcefeb;border-radius:20px;padding:6px 12px;font-size:.85rem;font-weight:700;color:#374151;text-decoration:none">'+(n.img?'<img src="'+esc(n.img)+'" alt="'+esc(n.t)+'" loading="lazy" style="width:22px;height:22px;border-radius:50%;object-fit:cover" onerror="this.style.display=&#39;none&#39;">':'')+esc(n.t)+' <span style="color:#9aa3af;font-weight:600">'+esc(n.ty)+(n.d?' '+n.d+'km':'')+'</span></a>';}).join('')+'</div>';}}catch(e){}}
    var hp=document.getElementById('fm2-hp');
    if(ds.hp){hp.href=(ds.hp.indexOf('http')===0?ds.hp:'http://'+ds.hp);hp.style.display='inline-block';}else{hp.style.display='none';}
    document.getElementById('fm2-naver').href='https://search.naver.com/search.naver?query='+encodeURIComponent((ds.name||'')+' 축제');
    // 이 축제에 상세 페이지가 있으면 그리로 보낸다.
    // ⚠️ 상세 140개를 만들어 놓고 모달에서 링크를 안 걸어 둬서, 사이트 절반이 사람 눈에 안 보였다(2026-08-10).
    (function(){
      var btn=document.getElementById('fm2-page'); if(!btn) return;
      btn.style.display='none';
      var show=function(map){ var s=map&&map[ds.name]; if(s){ btn.href='/festival/'+s+'/'; btn.style.display='inline-block'; } };
      if(!window.__fpP) window.__fpP=fetch('/festival/map.json').then(function(r){return r.json();}).catch(function(){return {};});
      window.__fpP.then(show);
    })();
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

// ---------- 「이 근처 또 어디 가지」 AI 상담 (공용) ----------
// ⚠️ 그동안 AI 상담은 /course/ 와 외국어 방문차수에만 있었다. 정작 페이지가 제일 많은
//    축제 상세 140개·걷기길에는 없어서, 다 읽고 나면 갈 데가 없었다(2026-08-10).
// 비용: 세션(3턴) 약 20~25원. api/plan.js 의 4중 캡(Referer·IP 12회/일·전체 400회/일·max_tokens 900)을 그대로 탄다.
// ★ 접었다 펴는 형태 — 안 누르면 호출이 아예 없다. 그래서 페이지 수를 늘려도 비용이 안 늘어난다.
const NEAR_AI_CSS = `
.nai{margin:34px 0 8px;border:2px solid #9fdcd3;border-radius:16px;background:#f2fbf9;overflow:hidden;box-shadow:0 3px 14px rgba(15,157,143,.09)}
.nai>summary{list-style:none;cursor:pointer;padding:15px 18px;font-weight:900;font-size:1.03rem;color:#0a6c63;display:flex;align-items:center;gap:9px;background:#e4f6f2}
.nai>summary::-webkit-details-marker{display:none}
.nai>summary::after{content:'＋';margin-left:auto;font-weight:700;color:#8fc9c1}
.nai[open]>summary::after{content:'−'}
.nai .naib{padding:0 18px 18px}
.nai .naih{font-size:.88rem;color:#5b6470;line-height:1.6;margin-bottom:12px}
.nai .nailog{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}
.nai .naimsg{padding:11px 14px;border-radius:13px;font-size:.92rem;line-height:1.66;white-space:pre-wrap}
.nai .naimsg.u{background:#0f9d8f;color:#fff;align-self:flex-end;max-width:82%;border-bottom-right-radius:4px}
.nai .naimsg.a{background:#fff;border:1px solid #e4f2ee;align-self:flex-start;max-width:94%;border-bottom-left-radius:4px}
.nai .naichips{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:11px}
.nai .naichips button{border:1px solid #d9ece8;background:#fff;color:#41525c;border-radius:15px;padding:7px 12px;font-size:.85rem;font-weight:600;cursor:pointer;font-family:inherit;transition:border-color .16s,color .16s}
.nai .naichips button:hover{border-color:#0f9d8f;color:#0f9d8f}
.nai .nairow{display:flex;gap:8px}
.nai .nairow input{flex:1;min-width:0;padding:11px 14px;border:1.5px solid #e0efec;border-radius:12px;font-family:inherit;font-size:.93rem}
.nai .nairow input:focus{outline:none;border-color:#5ac8ba}
.nai .nairow button{flex:none;padding:11px 18px;border:0;border-radius:12px;background:#0f9d8f;color:#fff;font-weight:800;font-size:.92rem;cursor:pointer;font-family:inherit}
.nai .nairow button:disabled{background:#b9d6d1;cursor:default}
.nai .naifoot{margin-top:10px;font-size:.79rem;color:#93a0a8;line-height:1.55}
`;
// place = 이 페이지가 다루는 곳 이름 · data = 이 페이지가 이미 보여주고 있는 근처 목록(JSON)
function nearAiBox(place, data, chips) {
  const cs = (chips || ['축제 말고 근처에 뭐가 더 있나요?', '비 오면 어디로 갈까요?', '아이랑 가도 괜찮은 곳은?'])
    .map(c => `<button type="button">${esc(c)}</button>`).join('');
  // ⚠️ 2026-08-10: 원래 접혀 있었는데, 장남 님이 "AI 상담이 어디 있냐"고 물으셨다. 못 찾으신 게 맞다.
  //    접어둔 이유가 "비용"이라고 적어 뒀었는데 **틀린 인과였다** — API 호출은 칩이나 「보내기」를 눌러야 일어난다.
  //    펼치는 것만으로는 호출이 0이다. 즉 접어둔 건 비용을 한 푼도 안 아끼면서 발견성만 죽이고 있었다.
  return `<details class="nai" id="nai" open>
<summary>💬 이 근처, 또 어디 가면 좋을지 물어보세요</summary>
<div class="naib">
<p class="naih">이 페이지에 정리해 둔 <b>${esc(place)}</b> 주변 자료만 보고 답합니다. 없는 곳을 지어내지 않습니다.</p>
<div class="nailog" id="nailog"></div>
<div class="naichips" id="naichips">${cs}</div>
<div class="nairow"><input id="naiin" type="text" placeholder="예) 걷기 좋은 곳부터 보고 싶어요" maxlength="200"><button id="naisend" type="button">보내기</button></div>
<p class="naifoot">답변은 AI가 만듭니다. 영업시간·요금·예약은 저희 데이터에 없어 답하지 않습니다 — 가시기 전에 직접 확인하세요.</p>
</div>
<script type="application/json" id="naidata">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
</details>`;
}
const NEAR_AI_JS = `<script>
(function(){
  var box=document.getElementById('nai'); if(!box) return;
  var log=document.getElementById('nailog'), inp=document.getElementById('naiin'),
      btn=document.getElementById('naisend'), chips=document.getElementById('naichips'),
      raw=document.getElementById('naidata');
  var DATA={}; try{ DATA=JSON.parse(raw.textContent); }catch(e){}
  var hist=[], busy=false;
  function add(role,txt){
    var d=document.createElement('div');
    d.className='naimsg '+(role==='user'?'u':'a');
    d.textContent=txt; log.appendChild(d); d.scrollIntoView({block:'nearest',behavior:'smooth'});
    return d;
  }
  function ask(q){
    if(busy||!q) return;
    busy=true; btn.disabled=true; inp.value='';
    if(window.cjmTrack) window.cjmTrack('ai_ask', { turn: hist.length/2 + 1, place: (DATA.place||'').slice(0,60) });
    if(chips) chips.style.display='none';
    add('user',q);
    var wait=add('a','…');
    fetch('/api/plan',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({mode:'near',q:q,place:DATA.place,near:DATA.near,history:hist.slice(-4)})})
      .then(function(r){return r.json();})
      .then(function(j){
        var t=j.text||'답을 만들지 못했습니다.';
        wait.textContent=t;
        hist.push({role:'user',content:q},{role:'assistant',content:t});
      })
      .catch(function(){ wait.textContent='연결에 문제가 있었습니다. 잠시 후 다시 시도해 주세요.'; })
      .then(function(){ busy=false; btn.disabled=false; inp.focus(); });
  }
  btn.addEventListener('click',function(){ ask(inp.value.trim()); });
  inp.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); ask(inp.value.trim()); } });
  if(chips) chips.addEventListener('click',function(e){ if(e.target.tagName==='BUTTON') ask(e.target.textContent); });
})();
<\/script>`;


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
.hero-stats span b{font-weight:900;font-variant-numeric:tabular-nums}
/* 라이브 배지 — 매일 바뀌는 문구가 여기 돈다 */
.hero-live{display:inline-flex;align-items:center;gap:8px;background:rgba(0,0,0,.34);border:1px solid rgba(255,255,255,.3);backdrop-filter:blur(6px);padding:7px 16px 7px 13px;border-radius:999px;font-size:.87rem;font-weight:700;margin-bottom:16px;max-width:92vw}
.hero-live #hero-live-txt{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:opacity .45s}
.hero-live b{font-weight:900;color:#ffd9a8}
.hero-live .dot{flex:none;width:8px;height:8px;border-radius:50%;background:#4ade80;box-shadow:0 0 0 0 rgba(74,222,128,.7);animation:hpulse 2.2s infinite}
@keyframes hpulse{0%{box-shadow:0 0 0 0 rgba(74,222,128,.6)}70%{box-shadow:0 0 0 9px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}
/* 스크롤 등장 */
.reveal{opacity:0;transform:translateY(14px);transition:opacity .55s ease,transform .55s ease}
.reveal.on{opacity:1;transform:none}
/* ⚠️ 모바일에서는 비디오를 아예 틀지 않는다 — 이 사이트 모바일 비중이 65~93%라 LCP가 곧 이탈이다 */
@media(max-width:820px){.hero-vid{display:none}}
.reveal.d1{transition-delay:.06s}.reveal.d2{transition-delay:.12s}
/* 읽기 진행바 — 긴 페이지에서만 JS가 붙인다 */
#readbar{position:fixed;top:0;left:0;height:3px;width:0;z-index:60;background:linear-gradient(90deg,#0f9d8f,#2dd4bf,#f59e0b);transition:width .12s linear;pointer-events:none}
/* 자동 목차 — h2가 5개 이상인 페이지에 JS가 삽입 */
.autotoc{margin:22px 0 4px;background:#f4fbfa;border:1px solid #d9f0ec;border-radius:14px;padding:14px 17px}
.autotoc>b{display:block;font-size:.86rem;color:#0c7d72;margin-bottom:9px;font-weight:800;letter-spacing:-.01em}
.autotoc ol{list-style:none;display:flex;flex-wrap:wrap;gap:7px}
.autotoc a{display:inline-block;font-size:.86rem;font-weight:600;color:#4b5563;padding:5px 12px;border-radius:15px;background:#fff;border:1px solid #e2efec;transition:color .18s,border-color .18s,transform .18s,background .18s}
.autotoc a:hover{color:#0f9d8f;border-color:#9fdcd3;transform:translateY(-1px)}
.autotoc a.cur{background:#0f9d8f;color:#fff;border-color:#0f9d8f}
/* 숫자 하이라이트 — 화면에 들어올 때 형광펜이 왼쪽에서 칠해진다 */
.hl{background:linear-gradient(90deg,#ffe9b8,#ffe0a3);background-size:0 42%;background-repeat:no-repeat;background-position:0 86%;transition:background-size .75s cubic-bezier(.22,1,.36,1);border-radius:2px}
.hl.on{background-size:100% 42%}
/* 홈 진입 카드 — 안쪽 페이지로 가는 문 */
.egrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(228px,1fr));gap:14px}
.ecard{display:block;position:relative;overflow:hidden;background:#fff;border:1px solid #e4f2ee;border-radius:16px;padding:20px 18px 18px;box-shadow:0 2px 10px rgba(31,41,55,.05);transition:transform .2s,box-shadow .2s,border-color .2s}
.ecard::after{content:'';position:absolute;left:0;top:0;height:3px;width:0;background:linear-gradient(90deg,#0f9d8f,#2dd4bf);transition:width .35s ease}
.ecard:hover{transform:translateY(-4px);border-color:#bfe6df;box-shadow:0 14px 30px rgba(31,41,55,.12)}
.ecard:hover::after{width:100%}
.ecard .ei{display:block;font-size:1.6rem;margin-bottom:8px}
.ecard b{display:block;font-size:1.06rem;font-weight:800;letter-spacing:-.02em;margin-bottom:6px;color:#0c7d72}
.ecard span:not(.ei){display:block;font-size:.88rem;color:#5b6470;line-height:1.6}
@media(prefers-reduced-motion:reduce){.hero-vid{display:none}.hero-live .dot{animation:none}.reveal{opacity:1;transform:none;transition:none}#readbar{display:none}.hl{background-size:100% 42%;transition:none}}
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
.fm-links a.fm-page{display:none;background:#0f9d8f;color:#fff;box-shadow:0 4px 14px rgba(15,157,143,.34)}
.fm-links a.fm-page:hover{background:#0c8579}
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
.bb-ups{display:flex;flex-wrap:wrap;gap:8px;margin:9px 0 0}
.bb-up{display:inline-block;background:#f2fbfa;border:1.5px solid #b9e4de;color:#0a6c63;border-radius:999px;padding:7px 13px;font-size:.82rem;font-weight:700;text-decoration:none;line-height:1.35;transition:all .15s}
.bb-up:hover{background:#e3f6f3;border-color:#0f9d8f;transform:translateY(-1px)}
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
/* 헤더 검색 — 로고와 메뉴 사이 빈 공간. 축제 이름을 아는 사람이 가장 많은데 검색이 메뉴 안에 숨어 있었다 */
.hsrch{position:relative;flex:1;max-width:330px;margin:0 18px}
/* 히어로 검색창 — 모바일 메인 화면에 검색이 안 보인다는 지적(2026-08-16)으로 추가. 데스크톱은 헤더 검색으로 충분해 기본은 숨김 */
.hsrch-hero{display:none}
.hsrch input{width:100%;padding:9px 14px 9px 36px;border:1.5px solid #e0efec;border-radius:20px;background:#f7fbfa url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230f9d8f' stroke-width='2.4' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='M20 20l-3.6-3.6'/%3E%3C/svg%3E") no-repeat 12px center/15px;font-family:inherit;font-size:.92rem;color:#1f2937;transition:border-color .18s,background-color .18s,box-shadow .18s}
.hsrch input::placeholder{color:#9aa8b2}
.hsrch input:focus{outline:none;border-color:#5ac8ba;background-color:#fff;box-shadow:0 0 0 3px rgba(15,157,143,.12)}
.hsrch .hres{display:none;position:absolute;top:calc(100% + 7px);left:0;right:0;background:#fff;border:1px solid #e4f2ee;border-radius:14px;box-shadow:0 14px 34px rgba(31,41,55,.16);padding:6px;max-height:62vh;overflow:auto;z-index:70}
.hsrch.open .hres{display:block}
.hsrch .hres a{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:10px;font-size:.9rem;color:#374151;line-height:1.35}
.hsrch .hres a:hover,.hsrch .hres a.sel{background:#effaf8;color:#0a6c63}
.hsrch .hres a i{flex:none;font-style:normal;font-size:.7rem;font-weight:800;color:#0c7d72;background:#e6f6f3;border-radius:7px;padding:3px 7px}
.hsrch .hres a b{font-weight:800;color:#0f9d8f}
.hsrch .hres .hall{border-top:1px solid #f0f6f5;margin-top:4px;color:#6b7280;font-weight:700}
.hsrch .hres .hnone{padding:12px;font-size:.88rem;color:#8b95a1}
@media(max-width:1080px){.hsrch{max-width:230px;margin:0 12px}}
@media(max-width:880px){
.navtoggle{display:block}
.hsrch{display:none}
.hsrch-hero{display:block;position:relative;flex:none;width:100%;max-width:460px;margin:16px auto 0}
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
${NEAR_AI_CSS}
@media(max-width:600px){.hero h1{font-size:1.3rem}}
`;

// ---------- 상단 네비게이션 (카테고리 드롭다운 + 모바일 햄버거) ----------
const CUR_MONTH_KEY = (MONTHS.find(m => m.months.includes(new Date().getMonth() + 1)) || MONTHS[0]).key;
const KO_NAV = `<button class="navtoggle" id="navtoggle" aria-label="메뉴 열기" aria-expanded="false">☰</button>
<nav id="mainnav">
<div class="ndrop"><button class="nbtn" type="button">🎪 축제<span class="arw">▼</span></button><div class="nmenu">
<a href="/search/">🔎 축제 검색</a>
<a href="/festival/">📄 축제 상세 페이지</a>
<a href="/${CUR_MONTH_KEY}/">📅 월별 축제</a>
<a href="/trend/">🔥 인기 여행지 랭킹</a>
<a href="/holiday/">🎌 연휴 축제</a>
<a href="/winter/">❄️ 겨울 축제</a>
<a href="/blog/">📖 축제 가이드</a>
<a href="/test/">🔮 취향 테스트</a>
</div></div>
<div class="ndrop"><button class="nbtn" type="button">🗺️ 여행지<span class="arw">▼</span></button><div class="nmenu">
<a href="/valley/">💧 계곡명소</a>
<a href="/maple/">🍁 단풍명소</a>
<a href="/flower/">🌸 봄꽃명소</a>
<a href="/onsen/">♨️ 온천</a>
<a href="/trails/">🥾 걷기 여행</a>
<a href="/mountains/">⛰️ 전국 명산</a>
<a href="/cafe/">☕ 요즘 가는 카페</a>
<a href="/pet/">🐶 반려견 여행지</a>
<a href="/accessible/">♿ 무장애 여행</a>
<a href="/jangteo/">🏮 전국 오일장</a>
</div></div>
<div class="ndrop"><button class="nbtn" type="button">🧭 코스<span class="arw">▼</span></button><div class="nmenu">
<a href="/map/">🗺️ 지도로 보기</a>
<a href="/course/">🗓️ 추천 코스 보기</a>
<a href="/course/#c-form">🛠️ 내 조건으로 짜기</a>
<a href="/trip-cost/">🧮 여행비용 계산기</a>
</div></div>
<a class="nhot" href="/hot/">🔥 요즘 어디 가지</a>
<div class="ndrop"><button class="nbtn" type="button">🌐<span class="arw">▼</span></button><div class="nmenu">
<a href="/en/">English</a>
<a href="/ja/">日本語</a>
<a href="/es/">Español</a>
<a href="/zh/">简体中文</a>
<a href="/tw/">繁體中文</a>
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

// ───────────────────────────────────────────────────────────
// 공통 모션 레이어 — 전 페이지(303개)에 들어간다
// 홈만 살아 있고 내부 페이지는 정적 문서였던 걸 고친다.
// 마크업은 하나도 안 고치고 DOM을 읽어서 붙이는 방식이라, 새 페이지가 늘어도 자동 적용된다.
// ⚠️ prefers-reduced-motion 이면 전부 정지. 모바일 비중 65~93%라 scroll 은 전부 passive + rAF.
// ⚠️ 홈(.hero 존재)에는 목차를 안 만든다 — 홈은 이미 자체 구조가 있다.
// 헤더 검색 — 인덱스는 첫 타이핑 때 1회만 받는다(초기 로딩에 부담 주지 않기 위해)
const HSEARCH_JS = `<script>
(function(){
  // ⚠️ 헤더(데스크톱) 검색창과 히어로(모바일 메인 화면, 2026-08-16 추가) 검색창이 같은 로직을 쓴다.
  // id 하나짜리 getElementById 대신 .hsrch 클래스로 여러 개를 동시에 지원한다 — id는 문서에 하나만 있어야 하기 때문.
  var boxes=[].slice.call(document.querySelectorAll('.hsrch'));
  if(!boxes.length) return;
  var IDX=null;
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function load(){ if(IDX) return Promise.resolve(IDX);
    return fetch('/hsearch.json').then(function(r){return r.json();}).then(function(j){IDX=j;return j;}).catch(function(){IDX=[];return IDX;}); }
  function mark(t,q){ var i=t.toLowerCase().indexOf(q); if(i<0) return esc(t);
    return esc(t.slice(0,i))+'<b>'+esc(t.slice(i,i+q.length))+'</b>'+esc(t.slice(i+q.length)); }
  boxes.forEach(function(box){
    var inp=box.querySelector('input'), res=box.querySelector('.hres');
    if(!inp||!res) return;
    var sel=-1, items=[];
    function render(q){
      var ql=q.toLowerCase();
      var hit=IDX.filter(function(r){return r[0].toLowerCase().indexOf(ql)>=0;});
      // 앞에서 걸린 것 먼저, 그다음 짧은 제목 먼저
      hit.sort(function(a,b){ var ai=a[0].toLowerCase().indexOf(ql), bi=b[0].toLowerCase().indexOf(ql);
        return ai-bi || a[0].length-b[0].length; });
      hit=hit.slice(0,8);
      var h=hit.map(function(r){return '<a href="'+r[1]+'"><i>'+esc(r[2])+'</i><span>'+mark(r[0],ql)+'</span></a>';}).join('');
      h+='<a class="hall" href="/search/?kw='+encodeURIComponent(q)+'">🔎 「'+esc(q)+'」 전체 축제에서 찾기</a>';
      if(!hit.length) h='<div class="hnone">이름이 딱 맞는 페이지는 없습니다. 아래로 전체 축제를 찾아보세요.</div>'+h;
      res.innerHTML=h; box.classList.add('open'); sel=-1;
      // 검색어와 "결과가 있었는지"를 같이 남긴다 — 0건이 많은 말이 곧 만들어야 할 페이지다
      if(window.cjmTrack) window.cjmTrack('search_use', { q: q.slice(0,40), hits: hit.length });
      items=[].slice.call(res.querySelectorAll('a'));
    }
    var tm;
    inp.addEventListener('input',function(){
      var q=inp.value.trim();
      clearTimeout(tm);
      if(q.length<1){ box.classList.remove('open'); return; }
      // ⚠️ 첫 검색은 hsearch.json 을 그때 처음 받아오느라 1초 넘게 걸릴 수 있는데
      // 그동안 화면이 비어 있어서 "검색해도 안 나온다"로 보였다(2026-08-12). 로딩 문구를 바로 띄운다.
      if(!IDX){ res.innerHTML='<div class="hnone">검색 중…</div>'; box.classList.add('open'); }
      tm=setTimeout(function(){ load().then(function(){ render(q); }); },120);
    });
    inp.addEventListener('focus',function(){ if(inp.value.trim()) box.classList.add('open'); load(); });
    inp.addEventListener('keydown',function(e){
      if(!box.classList.contains('open')){ if(e.key==='Enter'&&inp.value.trim()) location.href='/search/?kw='+encodeURIComponent(inp.value.trim()); return; }
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){
        e.preventDefault();
        if(!items.length) return;
        if(sel>=0) items[sel].classList.remove('sel');
        sel=(sel+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;
        items[sel].classList.add('sel'); items[sel].scrollIntoView({block:'nearest'});
      } else if(e.key==='Enter'){
        e.preventDefault();
        if(sel>=0&&items[sel]) location.href=items[sel].getAttribute('href');
        else if(inp.value.trim()) location.href='/search/?kw='+encodeURIComponent(inp.value.trim());
      } else if(e.key==='Escape'){ box.classList.remove('open'); inp.blur(); }
    });
    document.addEventListener('click',function(e){ if(!box.contains(e.target)) box.classList.remove('open'); });
  });
  // 데스크톱에서 / 키로, 지금 화면에 보이는 검색창에 포커스
  document.addEventListener('keydown',function(e){
    if(e.key==='/'&&!/^(INPUT|TEXTAREA|SELECT)\$/.test((document.activeElement||{}).tagName||'')){
      var vis=boxes.filter(function(b){return b.offsetParent!==null;})[0];
      if(vis){ e.preventDefault(); vis.querySelector('input').focus(); }
    }
  });
})();
<\/script>`;

const TOC_LABEL = {
  ko: '이 페이지에서 볼 수 있는 것', en: 'On this page', ja: 'このページの内容',
  es: 'En esta página', zh: '本页内容', tw: '本頁內容'
};
// 📖 긴 설명문 문단 나눔 + 핵심 강조 (prose.js) — 장남 님 지적 "글자가 쭉 나열돼 읽기 힘들다"
const { prose, PROSE_JS, PROSE_CSS } = require('./prose.js');
// 📈 GA4 전환 이벤트 — 「주요 이벤트 0」이던 원인(커스텀 이벤트가 하나도 없었다)
const { TRACK_JS } = require('./track.js');
// 🚌 브라우저에서 ODsay 직접 호출 (서버는 IP 때문에 막힌다 — odsay.js 머리말 참고)
const { ODSAY_JS } = require('./odsay.js');

const motionJs = (lang) => `<script>
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var main = document.querySelector('main'); if(!main) return;
  var wrap = main.querySelector('.wrap') || main;
  var isHome = !!document.querySelector('.hero');

  // 1) 읽기 진행바 — 스크롤할 게 많은 페이지에서만
  if (!reduce && document.body.scrollHeight > 2400){
    var bar = document.createElement('div'); bar.id = 'readbar'; document.body.appendChild(bar);
    var t1 = false;
    addEventListener('scroll', function(){
      if (t1) return; t1 = true;
      requestAnimationFrame(function(){
        var h = document.documentElement.scrollHeight - innerHeight;
        bar.style.width = (h > 0 ? Math.min(scrollY / h * 100, 100) : 0) + '%';
        t1 = false;
      });
    }, {passive:true});
  }

  // 2) 자동 목차 — h2가 5개 이상인 긴 페이지만
  var hs = [].slice.call(wrap.querySelectorAll('h2')).filter(function(h){ return h.textContent.trim().length > 1; });
  var links = [];
  if (!isHome && hs.length >= 5){
    hs.forEach(function(h,i){ if(!h.id) h.id = 'sec' + (i+1); });
    var toc = document.createElement('nav');
    toc.className = 'autotoc';
    var ol = document.createElement('ol');
    hs.forEach(function(h){
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent.trim().replace(/\\s+/g,' ').slice(0, 24);
      li.appendChild(a); ol.appendChild(li);
    });
    var lb = document.createElement('b'); lb.textContent = ${JSON.stringify(TOC_LABEL[lang] || TOC_LABEL.ko)};
    toc.appendChild(lb); toc.appendChild(ol);
    hs[0].parentNode.insertBefore(toc, hs[0]);
    links = [].slice.call(toc.querySelectorAll('a'));
  }

  // 3) 스크롤 등장 — 제목과 그 직후 블록 2개까지만 (전부 하면 산만하다)
  if (!reduce){
    hs.forEach(function(h){
      h.classList.add('reveal');
      var n = h.nextElementSibling, c = 0;
      while (n && c < 2 && n.tagName !== 'H2'){
        n.classList.add('reveal'); n.classList.add('d' + (c+1));
        n = n.nextElementSibling; c++;
      }
    });
  }

  // 4) 숫자 형광펜 — 본문 굵은 글씨 중 숫자가 든 짧은 것
  var hl = [];
  if (!reduce){
    [].slice.call(wrap.querySelectorAll('p b, li b, td b')).forEach(function(b){
      var t = b.textContent;
      if (/[0-9]/.test(t) && t.length <= 14 && !b.querySelector('*')) { b.classList.add('hl'); hl.push(b); }
    });
  }

  // 5) 관찰 시작
  var rev = [].slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduce){
    var ro = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('on'); ro.unobserve(e.target); } });
    }, {threshold:.12});
    rev.forEach(function(el){ ro.observe(el); });
    var ho = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('on'); ho.unobserve(e.target); } });
    }, {threshold:.85});
    hl.forEach(function(el){ ho.observe(el); });
  } else {
    rev.forEach(function(el){ el.classList.add('on'); });
    hl.forEach(function(el){ el.classList.add('on'); });
  }

  // 6) 목차 현재 위치 표시
  if (links.length){
    var spy = function(){
      var y = scrollY + 150, cur = 0;
      for (var i = 0; i < hs.length; i++){ if (hs[i].getBoundingClientRect().top + scrollY <= y) cur = i; }
      for (var j = 0; j < links.length; j++){ links[j].classList.toggle('cur', j === cur); }
    };
    var t2 = false;
    addEventListener('scroll', function(){
      if (t2) return; t2 = true;
      requestAnimationFrame(function(){ spy(); t2 = false; });
    }, {passive:true});
    spy();
  }
})();
<\/script>`;

function layout(title, desc, urlPath, content, opts) {
  opts = opts || {};
  const lang = opts.lang || 'ko';
  // 2026-08-18: en/ja/zh 74페이지 중 59일 노출은 있는데 클릭이 0에 가깝다(en 108imp/0clk,
  // ja 61imp/0clk, zh 2imp/0clk — GSC 실측). 애드센스 "가치 낮은 콘텐츠" 반려와 겹쳐 보여
  // 전량 noindex(follow)로 접는다. tw(오일장 실적 있음)·es(약하지만 클릭 있음)는 그대로 둔다.
  // 링크·hreflang은 유지 — 검색으로 들어온 외국인 방문자 동선은 안 끊는다.
  const forceNoindex = ['en', 'ja', 'zh'].includes(lang);
  const alts = (opts.alternates || []).map(a => `<link rel="alternate" hreflang="${a.hreflang}" href="${SITE}${a.href}">`).join('\n');
  const logoHref = lang === 'ko' ? '/' : '/' + lang + '/';
  const NAVS = {
    // ⚠️ 2026-08-10: 외국어 내비에 실전 3종(언제 가나·문 닫는 날·무장애)을 **앞쪽에** 넣었다.
    //    외국인이 오기 전에 제일 먼저 찾는 게 그것인데, 축제 검색보다 뒤에 두면 안 눌린다.
    en: `<nav><a href="/en/">Home</a><a href="/en/calendar/">🗓️ When to go</a><a href="/en/closed/">🚪 What closes</a><a href="/en/access/">♿ Barrier-free</a><a href="/en/search/">🔎 Festivals</a><a href="/en/mountains/">⛰️ Mountains</a><a href="/en/cafe/">☕ Cafés</a><a href="/en/trend/">🔥 Rankings</a><a href="/en/trip/">🧳 1st/2nd/3rd visit</a><a href="/">🇰🇷 한국어</a></nav>`,
    ja: `<nav><a href="/ja/">ホーム</a><a href="/ja/calendar/">🗓️ いつ行くか</a><a href="/ja/closed/">🚪 休む日</a><a href="/ja/access/">♿ バリアフリー</a><a href="/ja/search/">🔎 お祭り検索</a><a href="/ja/mountains/">⛰️ 名山</a><a href="/ja/cafe/">☕ カフェ</a><a href="/ja/trend/">🔥 人気ランキング</a><a href="/ja/trip/">🧳 何回目の訪韓</a><a href="/">🇰🇷 한국어</a></nav>`,
    es: `<nav><a href="/es/">Inicio</a><a href="/es/calendar/">🗓️ Cuándo ir</a><a href="/es/closed/">🚪 Qué cierra</a><a href="/es/access/">♿ Accesibilidad</a><a href="/es/search/">🔎 Buscar festivales</a><a href="/es/trend/">🔥 Rankings</a><a href="/es/trip/">🧳 Según tu visita</a><a href="/">🇰🇷 한국어</a></nav>`,
    zh: `<nav><a href="/zh/">首页</a><a href="/zh/calendar/">🗓️ 什么时候去</a><a href="/zh/closed/">🚪 哪天关门</a><a href="/zh/access/">♿ 无障碍</a><a href="/zh/search/">🔎 庆典搜索</a><a href="/zh/mountains/">⛰️ 名山</a><a href="/zh/cafe/">☕ 咖啡馆</a><a href="/zh/trend/">🔥 人气排行</a><a href="/zh/trip/">🧳 第几次来韩国</a><a href="/">🇰🇷 한국어</a></nav>`,
    // 번체는 오일장이 주력 콘텐츠라 내비에 올린다(간체엔 없음 — 언어별 무기가 다르다)
    tw: `<nav><a href="/tw/">首頁</a><a href="/tw/calendar/">🗓️ 什麼時候去</a><a href="/tw/closed/">🚪 哪天休息</a><a href="/tw/access/">♿ 無障礙</a><a href="/tw/search/">🔎 慶典搜尋</a><a href="/tw/jangteo/">🏮 五日市集</a><a href="/tw/mountains/">⛰️ 名山</a><a href="/tw/cafe/">☕ 咖啡廳</a><a href="/tw/trend/">🔥 人氣排行</a><a href="/tw/trip/">🧳 第幾次來韓國</a><a href="/">🇰🇷 한국어</a></nav>`
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
<p>© 2026 Chukjemoa</p>`,
    tw: `<p>Chukjemoa — 韓國慶典・五日市集指南</p>
<p>活動日程可能變動，出發前請確認官方網站。</p>
<p><a href="/about/">關於我們</a> · <a href="/editorial/">編輯方針</a> · <a href="/contact/">聯絡</a> · <a href="/privacy/">隱私權政策</a></p>
<p>資料：韓國觀光公社（TourAPI） · 聯絡：goohw593@gmail.com</p>
<p class="srcnote">慶典資訊來源：韓國觀光公社 TourAPI 等公共開放資料。最後更新 ${TODAY}。</p>
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
  // ⚠️ 아래 템플릿에서 «속성값» 안에는 반드시 escA(따옴표까지 이스케이프)를 쓴다. esc()는 " 를 안 바꾼다.
  //    2026-08-18 전체 점검에서 발견: 제목에 큰따옴표가 든 축제·카페·명산 3페이지의
  //    <meta description> 이 첫 따옴표에서 잘리고 나머지가 깨진 속성으로 새어 나가고 있었다.
  //    ⚠️ 이 경고를 «HTML 주석»으로 템플릿 안에 넣었더니 611페이지 head 에 그대로 실려 나갔다(같은 날 발견).
  //        개발용 메모는 반드시 여기처럼 템플릿 «바깥»의 JS 주석으로 둘 것.
  return `<!DOCTYPE html>
<html lang="${lang === 'tw' ? 'zh-Hant' : lang === 'zh' ? 'zh-Hans' : lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="google-site-verification" content="yaGGvBqUsyeq_wrJvUrsiCBcGYtHZA_HBFHdSKlD1GU" />
<meta name="naver-site-verification" content="5eaaca3f7a2290de756df104664ced1f008e71eb" />
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#E0502F">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-GXJQ4SXMWY"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-GXJQ4SXMWY');</script>
<title>${esc(title)}</title>
<meta name="description" content="${escA(desc)}">
<link rel="canonical" href="${SITE}${urlPath}">
<link rel="alternate" type="application/rss+xml" title="${SITE_NAME} 축제 가이드" href="${SITE}/rss.xml">
${alts}
<meta property="og:title" content="${escA(title)}">
<meta property="og:description" content="${escA(desc)}">
<meta property="og:url" content="${SITE}${urlPath}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:locale" content="${lang === 'ko' ? 'ko_KR' : lang === 'ja' ? 'ja_JP' : lang === 'zh' ? 'zh_CN' : lang === 'es' ? 'es_ES' : 'en_US'}">
<meta property="og:image" content="${SITE}${opts.ogImage || ogImageFor(urlPath)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escA(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escA(title)}">
<meta name="twitter:description" content="${escA(desc)}">
<meta name="twitter:image" content="${SITE}${opts.ogImage || ogImageFor(urlPath)}">${(opts.noindex || forceNoindex) ? '\n<meta name="robots" content="noindex, follow">' : ''}
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE}" crossorigin="anonymous"></script>
${opts.jsonld || ''}
<style>${CSS}${PROSE_CSS}</style>
<script>window.__onesignalAppId="8d4d29df-1dba-4f43-9efb-0c3745441e1f";(function(){var id=window.__onesignalAppId;if(!id||id.indexOf("PASTE")===0)return;if(location.protocol!=="https:")return;var s=document.createElement("script");s.src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";s.defer=true;document.head.appendChild(s);window.OneSignalDeferred=window.OneSignalDeferred||[];window.OneSignalDeferred.push(function(OneSignal){OneSignal.init({appId:id});});})();</script>
</head>
<body>
<header><div class="wrap">
<a class="logo" href="${logoHref}">🎪 ${SITE_NAME}</a>
${lang === 'ko' ? `<div class="hsrch" id="hsrch"><input type="search" id="hsrch-in" placeholder="축제·코스·걷기길 검색" autocomplete="off" aria-label="사이트 검색"><div class="hres" id="hsrch-res"></div></div>` : ''}
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
${lang === 'ko' ? FEST_BB_JS + MODAL_CALC_JS + FEST_MODAL_JS + PLACE_MODAL_JS : ''}
${urlPath === '/' ? FIREWORKS_JS : ''}
${lang === 'ko' ? HSEARCH_JS : ''}
${String(content).indexOf('id="nai"') >= 0 ? NEAR_AI_JS : ''}
${PROSE_JS}
${TRACK_JS}
${ODSAY_JS}
${motionJs(lang)}
</body>
</html>`;
}

// 허브 페이지에 그 주제에 맞는 상품을 붙인다.
// ⚠️ 2026-08-18 전체 점검에서 발견: 걷기길·반려·온천·봄꽃·계곡·단풍 허브에 자기 상품이 하나도 없었다.
//    (축제 모달 안의 공통 상품은 모달을 열어야 보인다 = 허브 방문자에겐 없는 것과 같다)
//    억지 매칭은 하지 않는다 — /cafe/·/accessible/ 는 정직하게 맞는 상품이 없어 비워 둔다.
const PAGE_BUYBOX = {
  trails: 'trails', pet: 'pet', onsen: 'onsen', flower: 'flower',
  valley: 'valley', maple: 'maple', course: 'tripcost', festival: 'festival',
  // 정적 코스 12개 — 그 코스의 조건(걷기·온천·반려·아이·물놀이)에 맞춰 각각 다르게
  'course/jeju-walk-2n3d': 'trails', 'course/jeonbuk-walk-1d': 'trails', 'course/chungbuk-nature-1n2d': 'trails',
  'course/gangwon-onsen-1n2d': 'onsen', 'course/gyeongnam-pet-1n2d': 'pet',
  'course/gangwon-water-1n2d': 'valley', 'course/gyeonggi-kid-1d': 'gakline',
  'course/busan-1d': 'festival', 'course/chungnam-food-1d': 'festival',
  'course/jeonnam-quiet-1n2d': 'tripcost', 'course/gyeongbuk-quiet-1n2d': 'tripcost',
  'course/gyeongbuk-accessible-1d': 'tripcost'
};
function writePage(rel, html) {
  const key = PAGE_BUYBOX[rel];
  if (key && !/class="buybox"[\s\S]*?<\/main>/.test(html.slice(html.indexOf('<main')))) {
    const bb = `<div class="wrap">${buyBox(key)}</div>`;
    const i = html.lastIndexOf('</main>');
    if (i > 0) html = html.slice(0, i) + bb + html.slice(i);
  }
  const dir = path.join(ROOT, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log('✓', rel + '/index.html');
}

// ---------- 🎪 개별 축제 페이지 /festival/ ----------
// 축제 사이트인데 개별 축제 페이지가 0개였다(2026-08-09 발견). 검색 수요의 대부분이 개별 축제명인데 받을 페이지가 없었다.
const FESTIVAL_URLS = require('./festival.js').build({ ROOT, layout, writePage, SITE_NAME, SITE, buyBox, festBuyBox, nearAiBox, TODAY });
const MAP_URLS = require('./map.js').build({ ROOT, layout, writePage, SITE_NAME, buyBox, TODAY });

// ---------- 🌐 외국어 실전 정보 (/{lang}/closed·access·calendar) ----------
// 외국인이 오기 전에 제일 궁금한 것 = 문 여나 / 언제 가나 / 휠체어로 갈 수 있나.
// K-ETA·환율·유심은 우리 데이터가 아니라 안 다룬다. 자세한 배경은 intl.js 머리말 참고.
const INTL_URLS = require('./intl.js').build({ layout, writePage, TODAY });

let FEST_PAGES = [];
try { FEST_PAGES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/festival_pages.json'), 'utf8')); } catch (e) { }

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
  // 이 달의 숫자 — 지역 분포와 붐빔 상위는 우리만 낼 수 있는 문장이다
  const M = mm.months[0];
  const bySido = {}; list.forEach(f => { const r = (f.region || '').split(' ')[0]; if (r) bySido[r] = (bySido[r] || 0) + 1; });
  const topSido = Object.entries(bySido).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const repM = [1, 4, 8, 10].reduce((a, b) => (Math.abs(b - M) < Math.abs(a - M) ? b : a), 1);
  const busyList = (((visitors.seasonByMonth || {}).months || {})[String(repM)] || [])
    .filter(r => r.idx).sort((x, z) => z.idx - x.idx).slice(0, 6);
  const quietList = (((visitors.seasonByMonth || {}).months || {})[String(repM)] || [])
    .filter(r => r.idx && r.num > 800000).sort((x, z) => x.idx - z.idx).slice(0, 5);
  // 개별 축제 페이지가 있는 것 = 이 달의 '깊게 볼 축제'
  const deep = FEST_PAGES.filter(f => +String(f.start).slice(4, 6) === M || +String(f.end).slice(4, 6) === M);
  const mFaq = [
    [`${mm.label}에는 어떤 축제가 몇 개나 열리나요?`, `${mm.label} 기준 ${list.length}개를 정리해 두었습니다. 지역별로는 ${topSido.slice(0, 3).map(([r, c]) => `${r} ${c}개`).join(', ')} 순으로 많습니다. 한국관광공사 TourAPI 등록 기준이라 마을 단위 소규모 행사는 빠져 있을 수 있습니다.`],
    [`${mm.label}에 사람이 가장 몰리는 지역은 어디인가요?`, busyList.length ? `${busyList.slice(0, 3).map(r => `${r.sido} ${r.name}(평소의 ×${r.idx})`).join(', ')} 순입니다. 한국관광공사 「한국관광 데이터랩」의 시·군·구 방문자 수를 그 지역 평소 하루 평균과 비교한 값입니다.` : `방문자 데이터가 준비되면 표시됩니다.`],
    [`붐비는 곳을 피하고 싶습니다.`, quietList.length ? `방문 규모가 어느 정도 있으면서 ${repM}월 배수가 낮은 곳은 ${quietList.slice(0, 3).map(r => `${r.sido} ${r.name}(×${r.idx})`).join(', ')}입니다. 사람이 없는 게 아니라 <b>평소 대비 덜 몰린다</b>는 뜻입니다.` : `요즘 어디 가지 페이지에서 배수가 낮은 지역을 볼 수 있습니다.`],
    [`일정이 바뀌면 어떻게 되나요?`, `공공데이터를 주기적으로 다시 받아 갱신하지만, 주최 측이 먼저 바꾸고 데이터가 늦게 반영되는 경우가 있습니다. 출발 전에는 각 축제 페이지의 문의 전화로 확인하시는 편이 안전합니다.`]
  ];

  const content = `<main><div class="wrap">
<h1 style="font-size:1.5rem;margin-bottom:6px">${mm.label} 전국 축제 일정</h1>
<p class="note">총 ${list.length}개 · 지역 버튼을 눌러 필터링하세요. 일정은 변동될 수 있으니 방문 전 공식 홈페이지를 확인하세요.</p>
<p style="margin:4px 0 12px"><button id="nearby-btn" class="nearby-btn">📍 내 주변 축제 보기</button></p>
${regionFilter(list)}
<div class="grid">${list.map(festCard).join('\n')}</div>

${deep.length ? `<h2 class="sec">${mm.short}에 자세히 볼 축제 ${deep.length}곳</h2>
<p>아래 축제는 <b>개별 페이지</b>가 있습니다. 축제 소개뿐 아니라 그 동네가 이달 얼마나 붐비는지, 근처 맛집·카페의 영업시간, 걷기 좋은 길, 숙소, 그리고 축제를 중심으로 한 하루 코스까지 한 페이지에 정리해 두었습니다.</p>
<div class="frelm">${deep.slice(0, 40).map(f => `<a href="/festival/${f.slug}/">${esc(f.title)}<span>${esc(f.sido)} ${esc(f.sigungu || '')}</span></a>`).join('')}</div>
<style>.frelm{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;margin:12px 0}
.frelm a{background:#fff;border:1.5px solid #dcefeb;border-radius:12px;padding:10px 13px;text-decoration:none;color:#374151;font-weight:700;font-size:.9rem;line-height:1.4}
.frelm a span{display:block;color:#9ca3af;font-weight:600;font-size:.82em;margin-top:2px}
.frelm a:hover{background:#e2f5f2}</style>` : ''}

<h2 class="sec">${mm.short} 축제, 어느 지역에 몰려 있나</h2>
<p>${mm.label}에 열리는 ${list.length}개를 지역별로 세어 보면 ${topSido.map(([r, c]) => `<b>${esc(r)} ${c}개</b>`).join(' · ')} 순입니다. 축제 수가 많다고 다 붐비는 건 아닙니다. 실제로 사람이 얼마나 몰리는지는 아래 방문자 데이터가 더 정확합니다.</p>

${busyList.length ? `<h2 class="sec">${repM}월에 실제로 사람이 몰리는 동네</h2>
<p>한국관광공사 「한국관광 데이터랩」의 시·군·구 방문자 수를, 그 지역의 <b>평소 하루 평균</b>과 비교한 배수입니다. 절대 방문자 수가 아니라 '평소 대비'라서 작은 지역도 제철이 되면 위로 올라옵니다.</p>
<ul class="flistm">${busyList.map(r => `<li>🔥 <b>${esc(r.sido)} ${esc(r.name)}</b> — 평소의 <b>×${r.idx}</b></li>`).join('')}</ul>
${quietList.length ? `<p style="margin-top:10px">반대로, 방문 규모는 어느 정도 있으면서 ${repM}월 배수가 낮은 곳은 이렇습니다. 사람이 없다는 뜻이 아니라 <b>평소보다 덜 몰린다</b>는 뜻입니다.</p>
<ul class="flistm">${quietList.map(r => `<li>🤫 <b>${esc(r.sido)} ${esc(r.name)}</b> — 평소의 ×${r.idx}</li>`).join('')}</ul>` : ''}
<style>.flistm{list-style:none;padding:0;margin:10px 0}
.flistm li{background:#fff;border-radius:12px;padding:10px 14px;margin-bottom:7px;box-shadow:0 2px 8px rgba(31,41,55,.06);font-size:.92rem;color:#374151}
.flistm li b{color:#0a6c63}</style>
<p class="note">방문자 데이터는 약 한 달 늦게 공개돼, 계절을 맞추기 위해 <b>작년 같은 달</b> 실적을 씁니다. 이 배수는 축제장이 아니라 그 <b>시·군·구 전체</b>의 값입니다.</p>` : ''}

<h2 class="sec">${mm.short}에 같이 보면 좋은 것</h2>
<div class="frel2">
<a href="/hot/">🔥 요즘 사람 몰리는 동네</a>
<a href="/course/">🧭 조건 넣으면 코스가 나옵니다</a>
<a href="/jangteo/">🏮 그날 열리는 오일장</a>
<a href="/trails/">🥾 걷기 좋은 길</a>
<a href="/trip-cost/">🧮 여행비용 계산기</a>
</div>
<style>.frel2{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}
.frel2 a{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.88rem;padding:9px 15px;border-radius:999px;text-decoration:none}
.frel2 a:hover{background:#e2f5f2}</style>

<h2 class="sec">자주 묻는 것</h2>
${mFaq.map(q => `<p><b>${esc(q[0])}</b><br>${q[1]}</p>`).join('')}

<h2 class="sec">다른 달 축제 보기</h2>
${monthNavHtml}
<p class="note" style="margin-top:16px">데이터 출처: 한국관광공사 TourAPI(축제 정보) · 한국관광공사 「한국관광 데이터랩」(시·군·구 방문자 수).</p>
</div></main>`;
  const mFaqLd = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: mFaq.map(q => ({ '@type': 'Question', name: q[0], acceptedAnswer: { '@type': 'Answer', text: String(q[1]).replace(/<[^>]+>/g, '') } })) })}</script>`;
  // ⚠️ 2026-08-10: 월별 6페이지에 구매박스가 아예 없었다. "8월에 어디 갈까"를 보러 온 사람이라
  //    준비물 구매의도가 오히려 높은 자리다. 그 달 날씨에 맞는 것을 붙인다.
  writePage(mm.key, layout(title, desc, `/${mm.key}/`,
    content.indexOf('</main>') >= 0 ? content.replace('</main>', monthBuyBox(M) + '</main>') : content + monthBuyBox(M),
    { jsonld: eventsJsonLd(list) + mFaqLd }));
});

// ---------- 오일장 페이지 ----------
// ⚠️ 2026-08-18 전체 점검: 손으로 관리하던 markets.json 이 27곳뿐이었고 좌표가 0건이었다.
//    서울·부산·대구·광주·대전·세종·전북이 아예 없는데 제목은 「전국」이었다.
//    → fetch-markets.js 로 TourAPI 전통시장 143곳(전부 좌표 있음)을 받아 합친다.
//    손큐레이션 27곳은 «대표 품목·특징» 서술이 좋으므로 이름이 겹치면 그쪽을 살린다.
//    ⚠️ 장날을 못 뽑은 곳은 daysNum 을 비운 채 두고 **표에 넣지 않는다** —
//       표의 JS가 빈 배열을 「상설」로 표시하기 때문에, 모르는 것을 안다고 말하게 된다.
const marketsAll = (() => {
  let api = [];
  try { api = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/markets_api.json'), 'utf8')); } catch (e) { }
  const key = s => String(s).replace(/[\s()（）]/g, '').replace(/\d+[일]?[,·ㆍ]\d+일?/g, '')
    .replace(/5일장|오일장|민속시장|전통시장|공설시장|중앙시장|시장|장$/g, '');
  // 이름에 붙은 「(1, 6일)」「(3일,8일)」은 장날 칸과 중복이라 표시용 이름에서 뗀다
  const tidy = s => String(s).replace(/\s*[（(]\s*\d{1,2}\s*일?\s*[,·ㆍ、\s]+\s*\d{1,2}\s*일?\s*[)）]/g, '').trim();
  // ⚠️ 「경기 안성장」과 「안성장」, 「용인 백암장」과 「백암장」이 따로 잡혔다.
  //    앞에 붙은 지역 접두어를 뗀 이름으로도 한 번 더 맞춰 본다.
  const drop1 = s => { const t = String(s).trim().split(/\s+/); return t.length > 1 ? t.slice(1).join(' ') : ''; };
  const byKey = new Map(), alias = new Map();
  const reg = (k, v) => { if (k && !byKey.has(k)) byKey.set(k, v); };
  const firstSent = s => { const t = String(s || '').trim(); const m = t.match(/^[\s\S]{20,160}?다\.(\s|$)/); return (m ? m[0] : t.slice(0, 120)).trim(); };
  api.forEach(m => {
    const k1 = key(m.name), k2 = key(drop1(m.name));
    reg(k1, {
      name: tidy(m.name), region: m.sido, city: m.city, days: m.days, daysNum: m.daysNum || [],
      // ⭐ detailIntro2 의 saleitem = 공공데이터가 적어 둔 «판매 품목». 143곳 중 139곳에 있다.
      famous: m.sale || '', desc: firstSent(m.ov).slice(0, 120),
      ov: m.ov || '', open: m.open || '', rest: m.rest || '', park: m.park || '', tel: m.tel || '',
      fair: m.fair || '', addr: m.addr || '', img: m.img || '', x: m.x, y: m.y, src: 'api'
    });
    if (k2 && k2 !== k1 && !alias.has(k2)) alias.set(k2, k1);
  });
  markets.forEach(o => {                       // 손큐레이션이 이긴다(설명·대표품목이 훨씬 낫다)
    const k1 = key(o.name), k2 = key(drop1(o.name));
    const hit = [k1, alias.get(k1), k2, alias.get(k2)].find(k => k && byKey.has(k)) || k1;
    const a = byKey.get(hit) || {};
    byKey.set(hit, Object.assign({}, a, {
      name: o.name, region: o.region, city: o.city, days: o.days, daysNum: o.daysNum || [],
      famous: o.famous || a.famous || '', desc: o.desc || a.desc || '', src: 'hand'
    }));
  });
  return [...byKey.values()];
})();
const marketsDay = marketsAll.filter(m => (m.daysNum || []).length);   // 장날 아는 곳
const marketsNoDay = marketsAll.filter(m => !(m.daysNum || []).length); // 장날 미확인
console.log(`✓ 오일장 — 합계 ${marketsAll.length}곳(손 ${markets.length} + API ${marketsAll.length - markets.length}) · 장날 확인 ${marketsDay.length} · 미확인 ${marketsNoDay.length}`);

const marketRows = marketsDay.map(m =>
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

<h2 class="sec">시·도별로 보면</h2>
<p style="color:#6b7280;font-size:.94rem">장날이 확인된 <b>${marketsDay.length}곳</b>의 분포입니다. 오일장은 농촌 지역에 몰려 있어 대도시에는 적습니다. <b>시장이 6곳 이상인 지역은 「무엇을 파는지·언제 여는지·주차가 되는지」까지 정리한 페이지</b>가 따로 있습니다.</p>
<div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0">${(() => {
    const S = { 경기: 'gyeonggi', 강원: 'gangwon', 충북: 'chungbuk', 충남: 'chungnam', 전북: 'jeonbuk', 전남: 'jeonnam', 경북: 'gyeongbuk', 경남: 'gyeongnam', 제주: 'jeju', 대구: 'daegu', 부산: 'busan', 대전: 'daejeon', 울산: 'ulsan', 인천: 'incheon' };
    const cnt = {}; marketsAll.forEach(m => { if (m.region) cnt[m.region] = (cnt[m.region] || 0) + 1; });
    return Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([r, n]) => (S[r] && n >= 6)
      ? `<a href="/jangteo/${S[r]}/" style="background:#e2f5f2;border:1.5px solid #a9e5dd;color:#0a6c63;font-weight:800;font-size:.92rem;padding:9px 15px;border-radius:999px">${esc(r)} ${n}곳 →</a>`
      : `<span style="background:#f4faf8;border:1.5px solid #dcefeb;color:#6b7280;font-weight:700;font-size:.92rem;padding:9px 15px;border-radius:999px">${esc(r)} ${n}곳</span>`).join('');
  })()}</div>

<h2 class="sec">끝자리별로 모아 보기</h2>
<p style="color:#6b7280;font-size:.94rem">오늘이 며칠인지만 알면 갈 수 있는 장이 정해집니다. 끝자리가 같은 날에 열리는 장끼리 묶었습니다.</p>
${[[1, 6], [2, 7], [3, 8], [4, 9], [5, 10]].map(([a, b]) => {
  const list = marketsDay.filter(m => m.daysNum.includes(a) || m.daysNum.includes(b));
  if (!list.length) return '';
  return `<h3 style="margin:16px 0 4px;font-size:1.02rem;font-weight:800">${a}·${b}일장 <span style="color:#9ca3af;font-weight:600">${list.length}곳</span></h3>
<p style="color:#374151;font-size:.95rem;line-height:1.9">${list.map(m => `${esc(m.name)}<span style="color:#9ca3af">(${esc(m.region)})</span>`).join(' · ')}</p>`;
}).join('')}

${marketsNoDay.length ? `<h2 class="sec">장날을 확인하지 못한 시장 ${marketsNoDay.length}곳</h2>
<p style="color:#6b7280;font-size:.94rem">아래는 전통시장으로 등록돼 있지만 <b>공공데이터에 장날이 적혀 있지 않은 곳</b>입니다. 상설시장일 수도 있고 오일장일 수도 있어, <b>추측해서 날짜를 적지 않았습니다.</b> 방문 전 확인이 필요합니다.</p>
<p style="color:#374151;font-size:.95rem;line-height:1.9">${marketsNoDay.map(m => `${esc(m.name)}<span style="color:#9ca3af">(${esc(m.region)})</span>`).join(' · ')}</p>` : ''}

<h2 class="sec">이 데이터는 어디서 왔나</h2>
<p style="color:#374151;font-size:.95rem;line-height:1.8">한국관광공사 TourAPI의 전통시장 정보 <b>${marketsAll.length - markets.length}곳</b>에, 저희가 직접 정리한 유명 장터 <b>${markets.length}곳</b>(대표 품목·특징 서술)을 합쳤습니다. 장날은 공공데이터 설명문에서 뽑아낸 뒤 <b>끝자리 간격이 정확히 5일 때만</b> 오일장으로 인정했습니다 — 그래서 「23·28일」 같은 표기도 3·8일장으로 바르게 읽습니다. 명절·기상에 따라 쉬는 날이 있으니 먼 길이라면 확인 후 출발하세요.</p>

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
  `전국 오일장(5일장) 장날 ${marketsDay.length}곳 총정리 — 오늘 열리는 장 바로 확인 | ${SITE_NAME}`,
  `전국 오일장 장날 ${marketsDay.length}곳을 한눈에. 날짜를 넣으면 그 날 열리는 장이 초록색으로 표시되고 가까운 장날 순으로 정렬됩니다. 모란장(4·9일)·정선아리랑시장(2·7일)·봉평장(2·7일) 등 시·도별, 끝자리별 정리.`,
  '/jangteo/', jangteoContent + buyBox('jangteo')));

// ---------- 🏮 시·도별 오일장 /jangteo/{시도}/ ----------
// 왜 나누나: 시장마다 «판매 품목·영업시간·휴무·주차·문의»가 다 있는데(공공데이터 detailIntro2)
//   그걸 한 페이지에 다 넣으면 본문이 6만 자·330KB가 된다. 방금 홈에서 무게를 덜어낸 참이라 그럴 수 없다.
//   그리고 「전남 오일장」·「경북 오일장 장날」은 실제로 따로 검색되는 말이다.
// ⚠️ 얇은 페이지 양산은 하지 않는다 — **시장이 6곳 이상인 시도만** 만든다.
//    기준을 4로 두고 지어 보니 대구(4곳)가 본문 2,463자로 사이트 하한(걷기길 최소 2,999자)에 못 미쳤다.
//    6으로 올리니 가장 얇은 페이지가 경남 3,076자가 된다. 부산3·대전2·울산2·인천1·대구4는 허브에만 싣는다.
const JANGTEO_SIDO_URLS = [];
{
  const SLUG = { 서울: 'seoul', 부산: 'busan', 대구: 'daegu', 인천: 'incheon', 광주: 'gwangju', 대전: 'daejeon', 울산: 'ulsan', 세종: 'sejong', 경기: 'gyeonggi', 강원: 'gangwon', 충북: 'chungbuk', 충남: 'chungnam', 전북: 'jeonbuk', 전남: 'jeonnam', 경북: 'gyeongbuk', 경남: 'gyeongnam', 제주: 'jeju' };
  const bySido = {};
  marketsAll.forEach(m => { if (m.region) (bySido[m.region] = bySido[m.region] || []).push(m); });
  const big = Object.entries(bySido).filter(([s, a]) => SLUG[s] && a.length >= 6)
    .sort((a, b) => b[1].length - a[1].length);
  const linkRow = cur => `<div class="cpresets" style="display:flex;flex-wrap:wrap;gap:8px;margin:14px 0">${big.filter(([s]) => s !== cur).map(([s, a]) =>
    `<a href="/jangteo/${SLUG[s]}/" style="background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.9rem;padding:8px 14px;border-radius:999px">${s} ${a.length}</a>`).join('')}</div>`;

  big.forEach(([sido, list]) => {
    const withDay = list.filter(m => (m.daysNum || []).length).sort((a, b) => (a.daysNum[0] - b.daysNum[0]) || a.name.localeCompare(b.name));
    const noDay = list.filter(m => !(m.daysNum || []).length);
    const cityCnt = {}; list.forEach(m => { if (m.city) cityCnt[m.city] = (cityCnt[m.city] || 0) + 1; });
    const endCnt = {}; withDay.forEach(m => { const k = m.daysNum.join('·'); endCnt[k] = (endCnt[k] || 0) + 1; });

    const cardOf = m => `<div style="background:#fff;border-radius:14px;padding:16px 18px;box-shadow:0 2px 10px rgba(31,41,55,.06);margin:0 0 14px">
<h3 style="font-size:1.06rem;font-weight:800;margin:0 0 4px">${esc(m.name)}${m.daysNum.length ? ` <span style="background:#e2f5f2;color:#0a6c63;font-size:.82rem;font-weight:800;border-radius:999px;padding:3px 10px;margin-left:4px">${m.daysNum.join('·')}일장</span>` : ''}</h3>
<div style="color:#6b7280;font-size:.9rem;margin-bottom:8px">${esc(m.region)} ${esc(m.city)}${m.addr ? ' · ' + esc(m.addr) : ''}</div>
${m.famous ? `<p style="margin:0 0 6px;font-size:.96rem"><b>파는 것</b> — ${esc(m.famous)}</p>` : ''}
${m.desc ? `<p style="margin:0 0 8px;color:#374151;font-size:.95rem;line-height:1.75">${esc(m.desc)}</p>` : ''}
<div style="color:#6b7280;font-size:.9rem;line-height:1.8">
${m.fair ? `📅 장날 <b>${esc(m.fair)}</b><br>` : ''}
${m.open ? `🕘 ${esc(m.open)}` : ''}${m.rest ? ` · 휴무 ${esc(m.rest)}` : ''}${(m.open || m.rest) ? '<br>' : ''}
${m.park ? `🅿️ 주차 ${esc(m.park)}<br>` : ''}
${m.tel ? `☎️ ${esc(m.tel)}` : ''}
</div>
<div style="margin-top:10px"><a href="https://map.naver.com/p/search/${encodeURIComponent(m.name)}" target="_blank" rel="noopener" style="color:#0c7d72;font-weight:700;font-size:.88rem;margin-right:10px">🗺️ 지도</a><a href="https://search.naver.com/search.naver?query=${encodeURIComponent(m.name + ' 맛집')}" target="_blank" rel="noopener" style="color:#0c7d72;font-weight:700;font-size:.88rem">🍴 근처 맛집</a></div>
</div>`;

    const faq = [
      [`${sido}에서 오늘 열리는 오일장은 어디인가요?`,
        `오일장은 날짜 끝자리로 열립니다. ${sido}에는 ${Object.entries(endCnt).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}일장 ${n}곳`).join(' · ')}이 있습니다. 전국 표에서 날짜를 넣으면 그 날 열리는 장이 초록색으로 표시됩니다.`],
      [`${sido} 오일장에서는 주로 무엇을 파나요?`,
        (() => { const items = withDay.filter(m => m.famous).slice(0, 6).map(m => `${m.name}은 ${m.famous}`); return items.length ? items.join(', ') + ' 등으로 알려져 있습니다. 품목은 한국관광공사 공공데이터에 등록된 판매 품목입니다.' : '시장마다 다릅니다. 각 시장 카드의 「파는 것」을 참고하세요.'; })()],
      ['장날이 명절이나 비 오는 날에도 서나요?',
        '장날은 정해진 날짜에 서지만 명절 당일이나 기상 악화 시 쉬는 곳이 있습니다. 먼 길이라면 각 시장 문의처로 확인 후 출발하시길 권합니다.']
    ];

    const content = `<main><div class="wrap">
<h1 style="font-size:1.5rem;font-weight:900;margin:8px 0 6px">${sido} 오일장 ${withDay.length}곳 — 장날·파는 것·영업시간</h1>
<p style="color:#374151;font-size:1rem;line-height:1.8">${sido}에서 장날이 확인된 오일장 <b>${withDay.length}곳</b>을 정리했습니다${noDay.length ? `(장날을 확인하지 못한 ${noDay.length}곳은 아래에 따로 적었습니다)` : ''}. 시장마다 <b>무엇을 파는지·언제 여는지·주차가 되는지</b>를 한국관광공사 공공데이터에서 가져와 함께 실었습니다.</p>
<p style="color:#6b7280;font-size:.95rem">시·군 분포: ${Object.entries(cityCnt).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${esc(c)} ${n}`).join(' · ')}</p>
<p style="color:#6b7280;font-size:.95rem">끝자리별: ${Object.entries(endCnt).sort((a, b) => a[0].localeCompare(b[0])).map(([k, n]) => `<b>${k}일장</b> ${n}곳`).join(' · ')}</p>
<div style="background:#f4faf8;border:1.5px solid #dcefeb;border-radius:14px;padding:13px 17px;margin:14px 0;color:#0a6c63;font-size:.94rem;line-height:1.75">
오일장은 <b>날짜 끝자리</b>로 열립니다. 예를 들어 4·9일장이면 4, 9, 14, 19, 24, 29일에 섭니다.
<a href="/jangteo/" style="color:#0a6c63;font-weight:800">전국 표에서 날짜를 넣으면</a> 그 날 열리는 장을 한 번에 볼 수 있습니다.
</div>

<h2 class="sec">${sido}의 오일장</h2>
${withDay.map(cardOf).join('')}

${noDay.length ? `<h2 class="sec">장날을 확인하지 못한 시장 ${noDay.length}곳</h2>
<p style="color:#6b7280;font-size:.94rem">전통시장으로 등록돼 있지만 공공데이터에 장날이 적혀 있지 않습니다. <b>추측해서 날짜를 적지 않았습니다.</b></p>
${noDay.map(cardOf).join('')}` : ''}

<h2 class="sec">다른 지역 오일장</h2>
${linkRow(sido)}

<h2 class="sec">자주 묻는 것</h2>
${faq.map(([q, a]) => `<p style="line-height:1.8"><b>${esc(q)}</b><br>${esc(a)}</p>`).join('')}

<p class="note" style="margin-top:18px">데이터 출처: 한국관광공사 TourAPI 전통시장 정보(판매 품목·장날·영업시간·주차·문의처)와 축제모아가 직접 정리한 유명 장터 자료. 장날은 <b>끝자리 간격이 5일 때만</b> 오일장으로 인정했습니다. 명절·기상에 따라 쉬는 날이 있으니 방문 전 확인하세요.</p>
</div></main>`;

    const ld = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) })}</script>`;
    writePage('jangteo/' + SLUG[sido], layout(
      `${sido} 오일장 ${withDay.length}곳 — 장날·파는 것·영업시간 총정리 | ${SITE_NAME}`,
      `${sido} 오일장 ${withDay.length}곳의 장날과 판매 품목, 영업시간·휴무·주차·문의처를 한곳에. ${Object.entries(endCnt).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, n]) => `${k}일장 ${n}곳`).join(' · ')}.`,
      `/jangteo/${SLUG[sido]}/`, content, { jsonld: ld }));
    JANGTEO_SIDO_URLS.push(`/jangteo/${SLUG[sido]}/`);
  });
  // ⚠️ 빌드는 페이지를 «쓰기»만 하고 지우지 않는다. 기준을 4→6으로 올렸을 때 대구 폴더가 그대로 남아
  //    사이트맵엔 없는데 파일은 살아 있는 «유령 페이지»가 됐다(축제 상세에서 겪은 것과 같은 사고).
  //    이번 빌드가 만들지 않은 하위 폴더는 지운다.
  const keep = new Set(JANGTEO_SIDO_URLS.map(u => u.split('/')[2]));
  let gone = 0;
  for (const e of fs.readdirSync(path.join(ROOT, 'jangteo'), { withFileTypes: true })) {
    if (!e.isDirectory() || keep.has(e.name)) continue;
    fs.rmSync(path.join(ROOT, 'jangteo', e.name), { recursive: true, force: true });
    console.log('  🗑 유령 페이지 삭제 /jangteo/' + e.name + '/');
    gone++;
  }
  console.log('✓ /jangteo/{시도}/ —', JANGTEO_SIDO_URLS.length, '페이지 (시장 6곳 이상인 시도만)' + (gone ? ` · 정리 ${gone}개` : ''));
}

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
${blogBuyBox(p)}
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

// ⚠️ 2026-08-18 전체 점검: 홈 445KB 중 **228KB가 이 배열 하나**였다(사람이 읽는 본문은 6KB).
//    같은 배열을 /test/ 도 통째로 안고 있었다. 외부 파일 하나로 빼서 두 페이지가 같이 받는다.
//    첫 화면 렌더에 필요한 것이 아니라(주말 카드·찜 목록은 원래 JS로 그린다) 지연 로드해도 안전하다.
// ⚠️ 그런데 이 배열의 58%가 `near`(근처 관광지)였다 — 모달을 열어야 쓰는 값인데
//    첫 화면 렌더를 기다리게 만든다. 그래서 두 개로 나눈다:
//      fest.json      = 카드·검색·찜에 필요한 것 (바로 받음)
//      fest-near.json = 모달에서만 쓰는 근처 정보 (카드 그린 뒤에 배경으로 받아 합침)
{
  const light = slim.map(f => { const o = Object.assign({}, f); delete o.near; return o; });
  const near = {}; slim.forEach(f => { if (f.near) near[f.n] = f.near; });
  fs.writeFileSync(path.join(ROOT, 'fest.json'), JSON.stringify(light));
  fs.writeFileSync(path.join(ROOT, 'fest-near.json'), JSON.stringify(near));
  console.log('✓ fest.json', Math.round(JSON.stringify(light).length / 1024) + 'KB',
    '+ fest-near.json', Math.round(JSON.stringify(near).length / 1024) + 'KB',
    `(${slim.length}건 · 홈·취향테스트 공유)`);
}

const WEEKEND_JS = `<script>
(function(){
  const EMOJI = ${JSON.stringify(CAT_EMOJI)};
  window.renderFavs = window.renderFavs || function(){};   // 데이터 오기 전에 불려도 안 터지게
  fetch('/fest.json').then(function(r){ return r.json(); }).then(function(F){
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
  // 근처 정보는 카드가 다 그려진 뒤에 배경으로 받아 같은 객체에 합친다.
  // (모달은 클릭 시점에 F를 읽으므로 그때까지 오면 된다. 못 받으면 근처 칸만 비고 나머지는 정상)
  fetch('/fest-near.json').then(function(r){ return r.json(); }).then(function(N){
    F.forEach(function(f){ if (N[f.n]) f.near = N[f.n]; });
  }).catch(function(){});
  }).catch(function(){});
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

// ---------- 히어로 라이브 문구 ----------
// "살아있는 사이트" 느낌은 영상이 아니라 **매일 바뀌는 숫자**에서 나온다.
// 빌드가 매일 돌므로(자동글쓰기 09:32) 아래 문구도 매일 달라진다.
const HERO_LIVE = (() => {
  // ⚠️ stret/trails 는 이 시점보다 뒤에서 로드되므로 파일에서 직접 센다
  const cntFile = f => { try { const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')); return Array.isArray(j) ? j.length : 0; } catch (e) { return 0; } };
  const nWalk = cntFile('stret.json') + cntFile('trails.json');
  const nSpot = cntFile('spots_ko.json');
  const today = TODAY.replace(/-/g, '');
  const d0 = new Date(+TODAY.slice(0, 4), +TODAY.slice(5, 7) - 1, +TODAY.slice(8, 10));
  const ymd = d => d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
  // 이번 주말(다가오는 토·일)
  const sat = new Date(d0); sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7));
  const sun = new Date(sat); sun.setDate(sun.getDate() + 1);
  const inRange = (f, a, b) => String(f.start) <= b && String(f.end) >= a;

  const now = apiFests.filter(f => String(f.start) <= today && String(f.end) >= today);
  const wk = apiFests.filter(f => inRange(f, ymd(sat), ymd(sun)));
  // 곧 시작하는 축제 (7일 이내)
  const soon = apiFests.filter(f => {
    const s = String(f.start); if (s <= today) return false;
    const dt = new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
    return Math.round((dt - d0) / 86400e3) <= 7;
  }).sort((a, b) => String(a.start).localeCompare(String(b.start)));

  // 이달 가장 붐비는 곳 / 한산한 곳
  const M = d0.getMonth() + 1;
  const rep = [1, 4, 8, 10].reduce((a, b) => (Math.abs(b - M) < Math.abs(a - M) ? b : a), 1);
  const list = ((visitors.seasonByMonth || {}).months || {})[String(rep)] || [];
  const hot = list.filter(r => r.idx).sort((a, b) => b.idx - a.idx)[0];
  // ⚠️ '한적한 곳'에 서울 동작구 같은 자치구가 뽑히면 여행지로 안 읽힌다. 광역시 구는 뺀다.
  const METRO_SIDO = ['서울', '부산', '대구', '인천', '광주', '대전', '울산'];
  const quiet = list.filter(r => r.idx && r.num > 1500000
    && !(METRO_SIDO.indexOf(r.sido) >= 0 && /구$/.test(r.name)))
    .sort((a, b) => a.idx - b.idx)[0];

  // 롤링 문구 — 방문할 때마다 순환한다
  const lines = [];
  if (now.length) lines.push(`🎪 지금 <b>${now.length}개</b> 축제가 열리고 있어요`);
  if (wk.length) lines.push(`📅 이번 주말엔 <b>${wk.length}개</b>가 열립니다`);
  if (soon.length) lines.push(`⏳ <b>${esc(soon[0].title)}</b> 개막이 코앞이에요`);
  if (hot) lines.push(`🔥 이달 가장 붐비는 곳 · <b>${esc(hot.sido)} ${esc(hot.name)}</b> 평소의 ×${hot.idx}`);
  if (quiet) lines.push(`🤫 사람 적은 곳 찾는다면 · <b>${esc(quiet.sido)} ${esc(quiet.name)}</b> ×${quiet.idx}`);
  lines.push(`🥾 걷기길 <b>${nWalk.toLocaleString()}</b>개 코스를 거리·소요시간까지`);
  if (!lines.length) lines.push('🎪 전국 축제와 오일장 일정을 한눈에');

  return {
    lines,
    stats: [
      ['🎪', now.length || festivals.length, now.length ? '지금 열리는 축제' : '축제'],
      ['📅', wk.length, '이번 주말'],
      ['🧭', nSpot, '관광지'],
      ['🥾', nWalk, '걷기길 코스']
    ]
  };
})();


// 히어로 인터랙션 — 카운트업 · 라이브 문구 롤링 · 스크롤 등장
// ⚠️ prefers-reduced-motion 이면 전부 끈다(접근성). 모션이 과하면 오히려 싸구려로 보인다.
const HERO_JS = `<script>
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1) 숫자 카운트업
  function countUp(el){
    var to = +el.getAttribute('data-to') || 0;
    if (reduce || to === 0){ el.textContent = to.toLocaleString('ko-KR'); return; }
    var dur = 900, t0 = null;
    function step(t){
      if(!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e).toLocaleString('ko-KR');
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var cnts = [].slice.call(document.querySelectorAll('.hero-stats .cnt'));
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ countUp(e.target); io.unobserve(e.target); } });
    }, {threshold:.4});
    cnts.forEach(function(el){ io.observe(el); });
  } else { cnts.forEach(countUp); }

  // 2) 라이브 문구 롤링
  var box = document.getElementById('hero-live-txt');
  var raw = document.getElementById('hero-live-data');
  if (box && raw && !reduce){
    var lines = [];
    try { lines = JSON.parse(raw.textContent); } catch(e){}
    if (lines.length > 1){
      var i = 0;
      setInterval(function(){
        i = (i + 1) % lines.length;
        box.style.opacity = 0;
        setTimeout(function(){ box.innerHTML = lines[i]; box.style.opacity = 1; }, 450);
      }, 4200);
    }
  }

  // 3) 스크롤 등장
  if (!reduce && 'IntersectionObserver' in window){
    var ro = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('on'); ro.unobserve(e.target); } });
    }, {threshold:.12});
    [].slice.call(document.querySelectorAll('.reveal')).forEach(function(el){ ro.observe(el); });
  } else {
    [].slice.call(document.querySelectorAll('.reveal')).forEach(function(el){ el.classList.add('on'); });
  }
})();
<\/script>`;

const indexContent = `<div class="hero">
<video class="hero-vid" autoplay muted loop playsinline preload="none" poster="/img/hero.webp" aria-hidden="true"><source src="/img/hero.mp4" type="video/mp4"></video>
<div class="hero-inner">
<div class="hero-live"><span class="dot"></span><span id="hero-live-txt">${HERO_LIVE.lines[0]}</span></div>
<h1>이번 주말, 어디로 떠나볼까요?</h1>
<p>전국 축제와 오일장 일정을 한눈에 — 가족 나들이 계획이 3분이면 끝나요.</p>
<div class="hsrch hsrch-hero" id="hsrch-hero"><input type="search" placeholder="축제·지역·계곡 검색" autocomplete="off" aria-label="사이트 검색"><div class="hres"></div></div>
<div class="hero-cta"><a class="cta1" href="#weekend-title">이번 주말 축제 보기</a><a class="cta2" href="/course/">🧭 내 조건으로 코스 짜기</a></div>
<div class="hero-stats">${HERO_LIVE.stats.map(([e, n, l]) => `<span>${e} <b class="cnt" data-to="${n}">0</b> ${l}</span>`).join('')}</div>
</div>
<script id="hero-live-data" type="application/json">${JSON.stringify(HERO_LIVE.lines)}</script>
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

// ---------- 홈 하단 '이 사이트가 가진 것' ----------
// 홈이 사이트에서 가장 얇았다(2026-08-08 진단). 광고 문구가 아니라 **실제 보유 데이터를 숫자로** 적는다.
// 숫자는 하드코딩하지 않고 파일에서 세어 쓴다 — 데이터가 늘면 문장도 같이 늘어난다.
const HOME_DEPTH = (() => {
  const cnt = f => { try { const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')); return Array.isArray(j) ? j.length : 0; } catch (e) { return 0; } };
  const nFes = cnt('festivals_api.json'), nSpot = cnt('spots_ko.json'), nWalk = cnt('stret.json') + cnt('trails.json');
  const nAcc = cnt('accessible.json'), nFood = cnt('restaurants_ko.json'), nCafe = cnt('cafes_ko.json');
  const nStay = cnt('stays_ko.json'), nPet = cnt('pets.json'), nMt = cnt('mountains_ko.json');
  const nVly = cnt('valleys.json'), nMpl = cnt('maple.json'), nOns = cnt('onsen.json'), nMkt = marketsDay.length;
  let openPct = 0;
  try { const a = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/restaurants_ko.json'), 'utf8')); openPct = Math.round(a.filter(x => x.open).length / a.length * 100); } catch (e) { }
  const nFesPage = FEST_PAGES.length;
  const nSg = (((visitors.seasonByMonth || {}).months || {})['8'] || []).length;

  // ⚠️ 2026-08-10: 상세 140개·코스 13개를 만들어 놓고 홈에서 가는 길을 안 만들었다.
  //    "만들었는데 못 찾겠다"는 지적이 나온 이유. 홈 상단부에 진입 카드를 둔다.
  return `<div class="wrap">
<h2 class="sec">깊이 보고 싶으면 여기부터</h2>
<div class="egrid">
<a class="ecard" href="/festival/"><span class="ei">📄</span><b>축제 상세 ${nFesPage}곳</b>
<span>일정만이 아니라 그 동네 붐빔 정도, 근처 맛집·카페 영업시간, 걷기길 거리, 축제 중심 하루 코스까지 한 페이지에.</span></a>
<a class="ecard" href="/course/"><span class="ei">🧭</span><b>추천 코스 13개</b>
<span>지역·테마별로 짜 둔 당일치기~2박3일. 날짜와 조건을 넣으면 이동시간까지 계산해 새로 짜 드립니다.</span></a>
<a class="ecard" href="/trails/"><span class="ei">🥾</span><b>걷기길 ${nWalk.toLocaleString()}개 코스</b>
<span>제주올레·해파랑길·갈맷길까지 브랜드별·지역별로. 거리와 소요시간을 붙여 놨습니다.</span></a>
<a class="ecard" href="/trend/"><span class="ei">🔥</span><b>인기 여행지 랭킹</b>
<span>작년 같은 달 대비 성수기 배수로 계산합니다. 지금 붐비는 곳과 한적한 곳을 같이 보여드립니다.</span></a>
</div>
</div>
<div class="wrap">
<h2 class="sec">축제모아가 가진 것</h2>
<p>여행 정보를 '많이 모은' 사이트는 이미 많습니다. 저희가 다르게 하려는 건 <b>숫자로 답하는 것</b>입니다.
어디가 예쁘다는 말 대신, 그 동네가 이번 달 평소보다 몇 배 붐비는지를 방문자 데이터로 보여드립니다.
전국 ${nSg}개 시·군·구의 방문자 수를 그 지역 자신의 평소 하루 평균과 비교한 값이라, 큰 도시가 아니라 <b>제철을 맞은 작은 지역</b>도 위로 올라옵니다.</p>

<div class="hdgrid">
<div><b>${nFes.toLocaleString()}</b><span>축제 (개별 페이지 ${nFesPage}곳)</span></div>
<div><b>${nSpot.toLocaleString()}</b><span>관광지</span></div>
<div><b>${nWalk.toLocaleString()}</b><span>걷기길 코스 (거리·소요시간·난이도)</span></div>
<div><b>${nAcc.toLocaleString()}</b><span>무장애 여행 정보</span></div>
<div><b>${nFood.toLocaleString()}</b><span>음식점 (영업시간 ${openPct}%)</span></div>
<div><b>${nCafe.toLocaleString()}</b><span>카페</span></div>
<div><b>${nStay.toLocaleString()}</b><span>숙소</span></div>
<div><b>${nPet.toLocaleString()}</b><span>반려동물 동반 가능</span></div>
<div><b>${(nMt + nVly + nMpl + nOns).toLocaleString()}</b><span>명산·계곡·단풍·온천</span></div>
<div><b>${nMkt.toLocaleString()}</b><span>오일장 (다음 장날 자동 계산)</span></div>
</div>
<style>
.hdgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:10px;margin:14px 0}
.hdgrid div{background:#fff;border-radius:14px;padding:13px 15px;box-shadow:0 2px 10px rgba(31,41,55,.06)}
.hdgrid b{display:block;font-size:1.32rem;font-weight:900;color:#0a6c63;line-height:1.2}
.hdgrid span{display:block;font-size:.79rem;color:#6b7280;margin-top:3px;line-height:1.45}
.hdlist{list-style:none;padding:0;margin:12px 0}
.hdlist li{background:#fff;border-radius:12px;padding:12px 15px;margin-bottom:8px;box-shadow:0 2px 8px rgba(31,41,55,.06);font-size:.93rem;color:#374151;line-height:1.65}
.hdlist li b{color:#0a6c63}
</style>

<h2 class="sec">여기서 할 수 있는 것</h2>
<ul class="hdlist">
<li><b><a href="/course/">코스 짜기</a></b> — 지역·날짜·동행(아이·부모님·반려견·휠체어)·중점만 고르면 그 지역의 축제·걷기길·자연·식당·카페·숙소를 <b>동선 순서로</b> 묶어 시간표를 만듭니다. 걷기길은 실제 거리와 소요시간이 있어서 하루에 무리인지 아닌지를 계산할 수 있습니다. 만든 코스를 두고 AI에게 "2일차가 빡빡해요" 같은 걸 물어볼 수도 있습니다.</li>
<li><b><a href="/hot/">요즘 어디 가지</a></b> — 이번 달 실제로 사람이 몰린 동네를 평소 대비 배수로 줄 세웠습니다. 광고나 인기 순위가 아닙니다.</li>
<li><b><a href="/trip-cost/">여행비용 계산기</a></b> — 출발지와 목적지를 넣으면 자차(유류비·통행료)와 대중교통(KTX·시외버스)을 비교합니다.</li>
<li><b><a href="/trails/">걷기 여행</a></b> — 전국 걷기길 ${nWalk.toLocaleString()}개 코스를 브랜드별(해파랑길·남파랑길·제주올레·지리산둘레길 등)과 지역별로 정리했습니다. 코스마다 거리·소요시간·난이도가 있습니다.</li>
<li><b><a href="/accessible/">무장애 여행</a></b> — 휠체어·유아차로 갈 수 있는 곳만 모았습니다. 이 정보를 이 정도 규모로 정리한 곳은 많지 않습니다.</li>
<li><b><a href="/jangteo/">오일장</a></b> — 날짜 끝자리로 다음 장날을 자동 계산합니다. 가려는 날짜를 넣으면 그날 열리는 장이 표시됩니다.</li>
</ul>

<h2 class="sec">저희가 모르는 것</h2>
<p>쓸모 있으려면 못 하는 것부터 밝히는 게 맞다고 봅니다.
<b>영업시간과 휴무일</b>은 공공데이터에 등록된 곳만 표시하며, 없는 곳은 "정보 없음"으로 비워 둡니다. 추정해서 채우지 않습니다.
<b>이동시간</b>은 직선거리에 보정계수를 곱한 추정치입니다. 실제 도로 경로가 아닙니다.
<b>숙소 가격과 빈방</b>은 저희 데이터에 없습니다. 위치와 유형만 보여드립니다.
<b>붐빔 배수</b>는 특정 장소가 아니라 그 시·군·구 전체의 방문자 수 기준입니다.
축제 일정은 주최 측이 먼저 바꾸고 공공데이터가 늦게 반영되는 경우가 있으니, 출발 전 문의 전화로 확인하시는 편이 안전합니다.</p>

<p class="note">데이터 출처: 한국관광공사 TourAPI · 전국길관광정보 표준데이터 · 한국관광공사 「한국관광 데이터랩」 · 국가유산청 · 한국철도공사 운임 · 국토교통부 TAGO.</p>
</div>`;
})();

writePage('.', layout(
  `${SITE_NAME} — 전국 축제·오일장 일정 총정리 (2026)`,
  `2026 전국 축제 일정과 오일장(5일장) 날짜를 한눈에. 월별·지역별 축제 정보, 보령머드축제부터 화천산천어축제까지.`,
  '/', indexContent + HOME_DEPTH + FAQ_HOME_HTML + HERO_JS, { jsonld: eventsJsonLd(upcoming) + FAQ_HOME_LD, alternates: homeAlts() }));

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
writePage('privacy', layout(`개인정보처리방침 | ${SITE_NAME}`, `축제모아가 수집하는 정보와 쓰임, 보관 기간, 광고·분석 도구(구글 애널리틱스·애드센스)의 쿠키 사용, 이용자의 열람·삭제 요청 방법을 정리했습니다.`, '/privacy/', privacyContent));

// ---------- 킥① 축제 취향 테스트 ----------
const QUIZ_JS = `<script>
(function(){
  // 축제 배열은 /fest.json 하나로 뺐다(2026-08-18) — 홈과 이 페이지가 같은 파일을 쓴다.
  let F = [];
  fetch('/fest.json').then(function(r){ return r.json(); }).then(function(d){ F = d; }).catch(function(){});
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
.fm-links a.fm-page{display:none;background:#0f9d8f;color:#fff;box-shadow:0 4px 14px rgba(15,157,143,.34)}
.fm-links a.fm-page:hover{background:#0c8579}
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
<div id="fm-bb">${FEST_BB_BASE}</div>
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
function card(f){var d=dday(f),img=f.img||'/img/cat2-culture-a.webp',loc=(f.sido||'')+(f.sigungu?' '+f.sigungu:'');return '<div class="card" data-id="'+esc(f.id)+'" style="cursor:pointer"><div class="thumb"><img loading="lazy" src="'+esc(img)+'" alt="'+esc(f.title)+'" onerror="this.src=&#39;/img/cat2-culture-a.webp&#39;"><span class="dday '+d.c+'">'+d.l+'</span>'+(f.sido?'<span class="cat">'+esc(f.sido)+'</span>':'')+'</div><div class="card-body"><h3>'+esc(f.title)+'</h3><div class="date">'+fy(f.start)+' ~ '+fy(f.end)+'</div><div class="loc">'+esc(loc)+'</div></div></div>';}
function apply(){var r=ranges();var list=F.filter(function(f){if(!st.past&&!st.pet&&toD(f.end)<r.t)return false;if(st.pet&&!f.pet)return false;if(st.sido&&f.sido!==st.sido)return false;if(st.sigungu&&f.sigungu!==st.sigungu)return false;if(st.kw){var k=st.kw.toLowerCase();if((f.title||'').toLowerCase().indexOf(k)<0&&(f.addr||'').indexOf(st.kw)<0)return false;}if(st.quick==='now'&&!ov(f,r.t,r.t))return false;if(st.quick==='weekend'&&!ov(f,r.sat,r.sun))return false;if(st.quick==='month'&&!ov(f,r.m0,r.m1))return false;if(st.quick==='next'&&!ov(f,r.n0,r.n1))return false;return true;});list.sort(function(a,b){return (a.start||'').localeCompare(b.start||'');});document.getElementById('fCount').textContent='총 '+list.length+'개 축제';document.getElementById('fGrid').innerHTML=list.length?list.map(card).join(''):'<p style="grid-column:1/-1;color:#6b7280;padding:24px 0">조건에 맞는 축제가 없어요. 필터를 바꿔보세요.</p>';}
function fillSg(){var set={};F.forEach(function(f){if((!st.sido||f.sido===st.sido)&&f.sigungu)set[f.sigungu]=1;});var arr=Object.keys(set).sort();document.getElementById('fSigungu').innerHTML='<option value="">전체 도시</option>'+arr.map(function(s){return '<option value="'+s+'">'+s+'</option>';}).join('');}
document.getElementById('fSido').addEventListener('change',function(e){st.sido=e.target.value;st.sigungu='';fillSg();apply();});
document.getElementById('fSigungu').addEventListener('change',function(e){st.sigungu=e.target.value;apply();});
document.getElementById('fKw').addEventListener('input',function(e){st.kw=e.target.value.trim();apply();});
document.getElementById('fReset').addEventListener('click',function(){st={sido:'',sigungu:'',kw:'',quick:'all',pet:false,past:false};document.getElementById('fSido').value='';document.getElementById('fKw').value='';document.getElementById('fPet').checked=false;document.getElementById('fPast').checked=false;fillSg();var bs=document.querySelectorAll('#fQuick button');for(var i=0;i<bs.length;i++)bs[i].classList.toggle('on',bs[i].getAttribute('data-q')==='all');apply();});
var qbs=document.querySelectorAll('#fQuick button');for(var i=0;i<qbs.length;i++){qbs[i].addEventListener('click',function(){st.quick=this.getAttribute('data-q');for(var j=0;j<qbs.length;j++)qbs[j].classList.remove('on');this.classList.add('on');apply();});}
document.getElementById('fPet').addEventListener('change',function(e){st.pet=e.target.checked;apply();});
document.getElementById('fPast').addEventListener('change',function(e){st.past=e.target.checked;apply();});
function openModal(f){var m=document.getElementById('fmodal');var img=document.getElementById('fm-img');if(f.img){img.src=f.img;img.alt=(f.title||'')+' 사진';img.style.display='block';}else{img.alt='';img.style.display='none';}document.getElementById('fm-title').textContent=f.title;if(window.cjmFestBB)window.cjmFestBB('fm-bb',f.title,f.addr);document.getElementById('fm-meta').textContent=fy(f.start)+' ~ '+fy(f.end)+'  ·  '+((f.sido||'')+(f.sigungu?' '+f.sigungu:''))+(f.tel?'  ·  '+f.tel:'');document.getElementById('fm-ov').textContent=f.ov||'상세 개요는 아직 준비 중이에요. 아래 네이버·공식 홈페이지에서 확인하세요.';var nearEl=document.getElementById('fm-near');if(f.near&&f.near.length){nearEl.innerHTML='<div style="font-weight:800;color:#0a6c63;margin:16px 0 8px">📍 근처 가볼 곳</div><div style="display:flex;flex-wrap:wrap;gap:8px">'+f.near.map(function(n){return '<a href="https://search.naver.com/search.naver?query='+encodeURIComponent(n.t)+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;background:#f4faf8;border:1px solid #dcefeb;border-radius:20px;padding:6px 12px;font-size:.85rem;font-weight:700;color:#374151;text-decoration:none">'+(n.img?'<img src="'+esc(n.img)+'" alt="'+esc(n.t)+'" loading="lazy" style="width:22px;height:22px;border-radius:50%;object-fit:cover" onerror="this.style.display=&#39;none&#39;">':'')+esc(n.t)+' <span style="color:#9aa3af;font-weight:600">'+esc(n.ty)+(n.d?' '+n.d+'km':'')+'</span></a>';}).join('')+'</div>';}else{nearEl.innerHTML='';}var hp=document.getElementById('fm-hp');if(f.hp){hp.href=f.hp;hp.style.display='inline-block';}else{hp.style.display='none';}document.getElementById('fm-naver').href='https://search.naver.com/search.naver?query='+encodeURIComponent(f.title+' 축제');if(window.cjmResetCalc)window.cjmResetCalc('smc',window.cjmCands(f.title,window.cjmClean(f.addr),f.addr,((f.sido||'')+' '+(f.sigungu||'')).trim(),f.sigungu));m.classList.add('show');}
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
function openValley(p){if(!window.openPlaceModal){window.open('https://search.naver.com/search.naver?query='+encodeURIComponent(p.title),'_blank','noopener');return;}var loc=(p.sido||'')+(p.sigungu?' '+p.sigungu:'');var body=p.ov?(window.cjmProse?window.cjmProse(p.ov):'<div>'+esc(p.ov)+'</div>'):'<div style="color:#6b7280;font-size:.9rem">계곡 개방·수심·주차 정보는 방문 전 확인하세요. 여름철 급류·수량 변화에 유의하시기 바랍니다.</div>';window.openPlaceModal({img:p.img,title:p.title,meta:['💧 계곡',loc,p.tel].filter(Boolean).join('  ·  '),body:body,naver:'https://search.naver.com/search.naver?query='+encodeURIComponent(p.title),map:'https://map.naver.com/p/search/'+encodeURIComponent(p.title)});}
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
function openSpot(p){if(!window.openPlaceModal){window.open('https://search.naver.com/search.naver?query='+encodeURIComponent(p.title),'_blank','noopener');return;}var loc=(p.sido||'')+(p.sigungu?' '+p.sigungu:'');var body=p.ov?(window.cjmProse?window.cjmProse(p.ov):'<div>'+esc(p.ov)+'</div>'):'<div style="color:#6b7280;font-size:.9rem">운영·요금·시기 정보는 방문 전 확인하세요.</div>';window.openPlaceModal({img:p.img,title:p.title,meta:[CATLABEL,loc,p.tel].filter(Boolean).join('  ·  '),body:body,naver:'https://search.naver.com/search.naver?query='+encodeURIComponent(p.title),map:'https://map.naver.com/p/search/'+encodeURIComponent(p.title)});}
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
function card(f){var d=dday(f),img=f.img||'/img/cat2-culture-a.webp';return '<div class="card" data-id="'+esc(f.id)+'" style="cursor:pointer"><div class="thumb"><img loading="lazy" src="'+esc(img)+'" alt="'+esc(f.title)+'" onerror="this.src=&#39;/img/cat2-culture-a.webp&#39;"><span class="dday '+d.c+'">'+d.l+'</span>'+(f.region?'<span class="cat">'+esc(f.region)+'</span>':'')+'</div><div class="card-body"><h3>'+esc(f.title)+'</h3><div class="date">'+fy(f.start)+' ~ '+fy(f.end)+'</div><div class="loc">'+esc(f.region)+'</div></div></div>';}
function apply(){var r=ranges();var list=F.filter(function(f){if(st.quick!=='past'&&toD(f.end)<r.t)return false;if(st.region&&f.region!==st.region)return false;if(st.kw){var k=st.kw.toLowerCase();if((f.title||'').toLowerCase().indexOf(k)<0&&(f.addr||'').toLowerCase().indexOf(k)<0)return false;}if(st.quick==='now'&&!ov(f,r.t,r.t))return false;if(st.quick==='weekend'&&!ov(f,r.sat,r.sun))return false;if(st.quick==='month'&&!ov(f,r.m0,r.m1))return false;return true;});list.sort(function(a,b){return (a.start||'').localeCompare(b.start||'');});document.getElementById('fCount').textContent=list.length+' festivals';document.getElementById('fGrid').innerHTML=list.length?list.map(card).join(''):'<p style="grid-column:1/-1;color:#6b7280;padding:24px 0">No festivals match. Try other filters.</p>';}
function openModal(f){var m=document.getElementById('fmodal');var img=document.getElementById('fm-img');if(f.img){img.src=f.img;img.alt=(f.title||'')+' 사진';img.style.display='block';}else{img.alt='';img.style.display='none';}document.getElementById('fm-title').textContent=f.title;if(window.cjmFestBB)window.cjmFestBB('fm-bb',f.title,f.addr);document.getElementById('fm-meta').textContent=fy(f.start)+' ~ '+fy(f.end)+'  ·  '+(f.region||'')+(f.tel?'  ·  '+f.tel:'');document.getElementById('fm-ov').innerHTML=f.ov&&window.cjmProse?window.cjmProse(f.ov):'Overview coming soon. Please check the official website or Google.';var hp=document.getElementById('fm-hp');if(f.hp){hp.href=(f.hp.indexOf('http')===0?f.hp:'http://'+f.hp);hp.style.display='inline-block';}else{hp.style.display='none';}document.getElementById('fm-naver').href='https://www.google.com/search?q='+encodeURIComponent(f.title+' Korea festival');m.classList.add('show');}
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
function card(f){var d=dday(f),img=f.img||'/img/cat2-culture-a.webp';return '<div class="card" data-id="'+esc(f.id)+'" style="cursor:pointer"><div class="thumb"><img loading="lazy" src="'+esc(img)+'" alt="'+esc(f.title)+'" onerror="this.src=&#39;/img/cat2-culture-a.webp&#39;"><span class="dday '+d.c+'">'+d.l+'</span>'+(f.region?'<span class="cat">'+esc(f.region)+'</span>':'')+'</div><div class="card-body"><h3>'+esc(f.title)+'</h3><div class="date">'+fy(f.start)+' ~ '+fy(f.end)+'</div><div class="loc">'+esc(f.region)+'</div></div></div>';}
function apply(){var r=ranges();var list=F.filter(function(f){if(st.quick!=='past'&&toD(f.end)<r.t)return false;if(st.region&&f.region!==st.region)return false;if(st.kw){var k=st.kw.toLowerCase();if((f.title||'').toLowerCase().indexOf(k)<0&&(f.addr||'').toLowerCase().indexOf(k)<0)return false;}if(st.quick==='now'&&!ov(f,r.t,r.t))return false;if(st.quick==='weekend'&&!ov(f,r.sat,r.sun))return false;if(st.quick==='month'&&!ov(f,r.m0,r.m1))return false;return true;});list.sort(function(a,b){return (a.start||'').localeCompare(b.start||'');});document.getElementById('fCount').textContent=LBL.count.replace('%d',list.length);document.getElementById('fGrid').innerHTML=list.length?list.map(card).join(''):'<p style="grid-column:1/-1;color:#6b7280;padding:24px 0">'+LBL.noMatch+'</p>';}
function openModal(f){var m=document.getElementById('fmodal');var img=document.getElementById('fm-img');if(f.img){img.src=f.img;img.alt=(f.title||'')+' 사진';img.style.display='block';}else{img.alt='';img.style.display='none';}document.getElementById('fm-title').textContent=f.title;if(window.cjmFestBB)window.cjmFestBB('fm-bb',f.title,f.addr);document.getElementById('fm-meta').textContent=fy(f.start)+' ~ '+fy(f.end)+'  ·  '+(f.region||'')+(f.tel?'  ·  '+f.tel:'');document.getElementById('fm-ov').innerHTML=f.ov&&window.cjmProse?window.cjmProse(f.ov):LBL.modalFallback;var hp=document.getElementById('fm-hp');if(f.hp){hp.href=(f.hp.indexOf('http')===0?f.hp:'http://'+f.hp);hp.style.display='inline-block';}else{hp.style.display='none';}document.getElementById('fm-naver').href='https://www.google.com/search?q='+encodeURIComponent(f.title+LBL.googleSuffix);m.classList.add('show');}
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

// ---------- 중국어 번체(대만·홍콩) ----------
// 간체(zh)와 문구를 따로 쓴다. 번체권은 재방문율이 높아 "관광지"보다 "현지인이 가는 곳"을 찾는다 →
// 홍보 문구도 그 각도로 쓰고, 차별화 콘텐츠로 오일장(5일장)을 따로 붙인다(/tw/jangteo/).
const TW_ORDER = ['首爾','京畿','仁川','江原','忠北','忠南','大田','世宗','全北','全南','光州','慶北','慶南','大邱','蔚山','釜山','濟州'];
const TW_EXTRA_URLS = [];   // 번체 전용 추가 페이지(오일장 등) — 사이트맵에 넣는다
writeLangSite('tw', apiFestsTw, TW_ORDER, {
  h1: '韓國慶典搜尋',
  sub: `依日期與地區搜尋全韓國${apiFestsTw.length}場慶典 — 韓國觀光公社官方資料。`,
  allRegions: '所有地區', kwPh: '以名稱或地點搜尋', reset: '重設',
  q: { all: '全部', now: '進行中', weekend: '本週末', month: '本月', past: '含已結束' },
  note: '資料來源：韓國觀光公社（TourAPI）。日程可能變動，出發前請確認官方網站。點選卡片可查看簡介、官方網站與 Google 搜尋。',
  official: '🏛️ 官方網站', google: '🔎 Google 搜尋',
  metaTitleSearch: '韓國慶典搜尋 — 依日期與地區查詢韓國慶典 | Chukjemoa',
  metaDescSearch: `依日期與地區搜尋全韓國${apiFestsTw.length}場慶典，附韓國觀光公社官方簡介。`,
  heroH1: '韓國慶典・傳統市場',
  heroP: '依日期與地區搜尋全韓國的慶典 — 韓國觀光公社官方資料。',
  heroCta: '瀏覽所有慶典 →', sec: '把行程排在慶典上',
  lead: `第二次、第三次來韓國的話，明洞和弘大大概已經走過了。韓國每年舉辦數百場慶典 — 夏天的泥漿節與水戰、秋天的煙火與楓葉、冬天的冰雪與燈節，而且大多在首爾以外的地方。Chukjemoa 可以依日期與地區搜尋${apiFestsTw.length}場以上的慶典，閱讀官方簡介，並直接前往各慶典的官方網站。所有日程與介紹皆來自韓國觀光公社（TourAPI）。想更貼近在地生活，可以看看<a href="/tw/jangteo/">全韓國的五日市集</a>。`,
  ctaBtn: '🔎 開啟慶典搜尋',
  metaTitleHome: '韓國慶典行事曆 2026 — 慶典・五日市集指南 | Chukjemoa',
  metaDescHome: '依日期與地區搜尋全韓國的慶典與傳統市場。韓國觀光公社官方資料，另有五日市集（五日場）開市日查詢。',
  client: { count: '%d 場慶典', loading: '載入中...', fail: '資料載入失敗。', noMatch: '沒有符合條件的慶典，請調整篩選。', modalFallback: '簡介準備中，請參考官方網站或 Google。', ended: '已結束', ongoing: '進行中', dpre: '還有', dpost: '天', googleSuffix: ' 韓國 慶典' }
});

// ---------- 번체 전용: 오일장(五日市集) /tw/jangteo/ ----------
// 이게 번체판의 차별화 콘텐츠다. 축제 목록은 어디에나 있지만 5일장 개념을 번체로 설명하고
// 다음 개시일까지 계산해 주는 곳은 없다. 대만·홍콩은 야시장 문화가 있어 "장날"이라는 개념이 바로 통한다.
if (apiFestsTw.length) {
  const TWM = require('./twmarkets');
  const twRows = markets.map(m => {
    const t = TWM.market[m.name] || {};
    return {
      ko: m.name, tw: t.n || m.name, desc: t.d || '', famous: t.f || m.famous,
      region: TWM.region[m.region] || m.region, city: TWM.city[m.city] || m.city,
      days: m.days, daysNum: m.daysNum || []
    };
  });
  const twRegions = [...new Set(twRows.map(r => r.region))];
  const card = r => `<div class="jcard" data-days="${(r.daysNum || []).join(',')}" data-region="${esc(r.region)}">
<div class="jhead"><h3>${esc(r.tw)}</h3><span class="jko">${esc(r.ko)}</span></div>
<div class="jmeta">📍 ${esc(r.region)} ${esc(r.city)}</div>
<div class="jdays">${(r.daysNum || []).length ? `逢 <b>${(r.daysNum || []).join('・')}</b> 日開市` : '<b>每日開市</b>'}<span class="jnext"></span></div>
${r.desc ? `<p class="jdesc">${esc(r.desc)}</p>` : ''}
<div class="jfam">🛒 ${esc(r.famous)}</div>
</div>`;
  const content = `<main><div class="wrap">
<style>
.jgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin:16px 0}
.jcard{background:#fff;border-radius:16px;box-shadow:0 3px 14px rgba(31,41,55,.08);padding:18px 20px}
.jhead{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.jhead h3{font-size:1.08rem;font-weight:900;color:#0a6c63}
.jko{font-size:.78rem;color:#9aa3af}
.jmeta{font-size:.85rem;color:#6b7280;margin-top:5px}
.jdays{margin-top:9px;font-size:.92rem;color:#374151}
.jdays b{color:#e0502f}
.jnext{display:block;margin-top:5px;font-size:.85rem;color:#0f9d8f;font-weight:800}
.jdesc{margin-top:9px;font-size:.9rem;color:#4b5563;line-height:1.6}
.jfam{margin-top:9px;font-size:.85rem;color:#0a6c63;background:#f2fbfa;border-radius:10px;padding:7px 11px}
.twbox{background:#fff;border-radius:18px;box-shadow:0 3px 14px rgba(31,41,55,.08);padding:24px 28px;margin:18px 0}
.twbox h2{font-size:1.22rem;font-weight:900;color:#0a6c63;margin-bottom:10px}
.twbox p{margin:9px 0;line-height:1.75;color:#374151}
.twbox li{margin:7px 0 7px 18px;line-height:1.7;color:#374151}
.jfilter{display:flex;flex-wrap:wrap;gap:7px;margin:14px 0}
.jfilter button{border:1.5px solid #a9e5dd;background:#fff;color:#0c7d72;border-radius:20px;padding:8px 15px;font-size:.87rem;font-weight:800;cursor:pointer;font-family:inherit}
.jfilter button.on{background:linear-gradient(135deg,#0f9d8f,#2dd4bf);color:#fff;border-color:transparent}
</style>
<h1 style="font-size:1.55rem;font-weight:900;margin:10px 0 6px">🏮 韓國五日市集（오일장）完整指南</h1>
<p style="color:#6b7280;margin-bottom:6px">台灣有夜市，韓國有「五日市集」。全韓國 ${twRows.length} 處，每5天開市一次 — 附下次開市日自動計算。</p>

<div class="twbox">
<h2>什麼是「五日市集」？</h2>
<p>韓國的傳統市集大多不是天天開，而是<b>每5天開一次</b>。例如標示「2・7」的市集，就是每月 2、7、12、17、22、27 日開市。這種市集叫做 <b>오일장（五日場）</b>。</p>
<p>對第二次、第三次來韓國的人來說，這是最容易碰到「真正的當地生活」的場合。攤販是附近的農民和漁民，價格是當地人的價格，賣的東西隨季節換。明洞和弘大看不到這些。</p>
<h2>去之前先知道這幾件</h2>
<ul>
<li><b>帶現金。</b> 大攤位能刷卡或用行動支付，但小攤位還是收現金為主。</li>
<li><b>上午去。</b> 通常清晨開始，中午前後最熱鬧，傍晚就陸續收攤了。</li>
<li><b>小吃是重點。</b> 煎餅（전）、血腸（순대）、湯飯（국밥）在市集現做，比市區便宜也更道地。</li>
<li><b>下雨天會縮小規模。</b> 露天攤位多，天氣不好時攤數會明顯減少。</li>
<li><b>日期與農曆無關。</b> 「2・7日」指的是國曆（陽曆）日期的尾數，不是農曆。</li>
</ul>
</div>

<div class="jfilter" id="jf"><button data-r="" class="on">全部</button>${twRegions.map(r => `<button data-r="${esc(r)}">${esc(r)}</button>`).join('')}</div>
<div class="jgrid" id="jg">${twRows.map(card).join('\n')}</div>

<div class="twbox">
<h2>把慶典和市集排在同一天</h2>
<p>五日市集的開市日如果剛好碰上附近的慶典，一天可以走兩個地方。可以先用 <a href="/tw/search/">慶典搜尋</a> 找出當天的活動，再對照上面的開市日。</p>
<p>想知道哪些地區<b>韓國人自己常去、外國遊客反而少</b>，可以看 <a href="/tw/trend/">人氣旅遊地排行</a> — 那是用韓國觀光公社的觀光大數據做的，外國人比例低的地方通常更有生活感。</p>
</div>
<p class="note" style="margin-top:18px">資料來源：各地方政府公告與韓國觀光公社資料。開市日可能因節日（春節・中秋）調整，出發前請再確認。</p>
</div></main>
<script>
(function(){
  var g=document.getElementById('jg'); if(!g) return;
  // 다음 장날 계산 — 5일장은 음력이 아니라 양력 날짜의 끝자리 기준으로 선다
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
    if(!days.length){ el.textContent='✅ 每日開市'; return; }
    var r=nextDay(days);
    if(!r){ el.textContent=''; return; }
    var label=(r.date.getUTCMonth()+1)+'月'+r.date.getUTCDate()+'日';
    el.textContent = r.add===0 ? '🔥 今天開市！' : (r.add===1 ? '👉 明天（'+label+'）' : '👉 下次 '+label+'（還有'+r.add+'天）');
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
  const twJangteoLd = `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'ItemList', name: '韓國五日市集',
    numberOfItems: twRows.length,
    itemListElement: twRows.map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: r.tw }))
  })}</script>`;
  writePage('tw/jangteo', layout(
    '韓國五日市集完整指南 — 全韓國27處開市日查詢 | Chukjemoa',
    '韓國傳統五日市集（오일장）全韓國27處：開市日、位置、必吃小吃與特產一次看。附下次開市日自動計算，適合第二次以上來韓國、想看當地生活的旅客。',
    '/tw/jangteo/', content, { lang: 'tw', jsonld: twJangteoLd, ogImage: '/img/jangteo.webp' }));
  TW_EXTRA_URLS.push('/tw/jangteo/');
}

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
  const img = f.img ? String(f.img).replace(/^http:/, 'https:') : '/img/cat2-culture-a.webp';
  const fy = y => y ? y.slice(0, 4) + '.' + (+y.slice(4, 6)) + '.' + (+y.slice(6, 8)) : '';
  return `<div class="card" data-name="${escA(f.title)}" data-start="${f.start}" data-end="${f.end}" data-region="${escA(f.sido || '')}" data-city="${escA(f.sigungu || '')}" data-place="${escA(f.addr || '')}" data-img="${escA(img)}"${f.ov ? ` data-ov="${escA(f.ov)}"` : ''}${f.hp ? ` data-hp="${escA(f.hp)}"` : ''}>
  <div class="thumb"><img src="${esc(img)}" alt="${esc(f.title)}" loading="lazy" onerror="this.src='/img/cat2-culture-a.webp'"><span class="dday"></span></div>
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
  ${t.intro ? prose(t.intro) : ''}
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
${nearAiBox(o.title, {
    place: `${o.title} — 코스 ${o.items.length}개${km ? ` · 총 거리 ${km.toLocaleString()}km` : ''}${sidos.length ? ` · ${sidos.join('·')}` : ''}`,
    near: {
      코스: sorted.slice(0, 40).map(t => `${t.name}${t.kmOk && t.km ? ` ${t.km}km` : ''}${t.min ? ` 약 ${Math.round(t.min / 60 * 10) / 10}시간` : ''}${t.level ? ` 난이도 ${t.level}` : ''}${t.sigungu ? ` ${t.sido || ''} ${t.sigungu}` : ''}`)
    }
  }, ['처음이면 어느 코스부터 걷는 게 좋을까요?', '3시간 안에 끝나는 코스는?', '난이도 낮은 코스만 알려주세요', '가장 짧은 코스가 어디인가요?'])}

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
    const img = f.img || '/img/cat2-culture-a.webp';
    const loc = (f.sido || '') + (f.sigungu ? ' ' + f.sigungu : '');
    const iso = s => String(s).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
    const dOv = f.ov ? ` data-ov="${escA(f.ov)}"` : '';
    const dHp = f.hp ? ` data-hp="${escA(f.hp)}"` : '';
    const dNear = Array.isArray(nearby[f.id]) && nearby[f.id].length ? ` data-near="${encodeURIComponent(JSON.stringify(nearby[f.id]))}"` : '';
    return `<div class="card" style="cursor:pointer" data-name="${escA(f.title)}" data-start="${iso(f.start)}" data-end="${iso(f.end)}" data-region="${escA(f.sido || '')}" data-city="${escA(f.sigungu || '')}" data-img="${escA(img)}"${dOv}${dHp}${dNear}><div class="thumb"><img loading="lazy" src="${esc(img)}" alt="${esc(f.title)}" onerror="this.src=&#39;/img/cat2-culture-a.webp&#39;"><span class="dday"></span>${f.sido ? `<span class="cat">${esc(f.sido)}</span>` : ''}</div><div class="card-body"><h3>${esc(f.title)}</h3><div class="date">📅 ${fyy(f.start)} ~ ${fyy(f.end)}</div><div class="loc">📍 ${esc(loc)}</div></div></div>`;
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
  const holJsonLd = upcoming.slice(0, 3).flatMap(b => apiFests.filter(f => yd(f.start) <= b.end && yd(f.end) >= b.start).slice(0, 5)).map(f => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Event', name: f.title, startDate: String(f.start).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'), endDate: String(f.end).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'), eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', description: evDesc(f), location: { '@type': 'Place', name: (f.sido || '') + (f.sigungu ? ' ' + f.sigungu : ''), address: { '@type': 'PostalAddress', addressRegion: f.sido, addressLocality: f.sigungu || undefined, streetAddress: f.addr || undefined, addressCountry: 'KR' } }, image: [f.img ? String(f.img).replace(/^http:/, 'https:') : SITE + '/img/cat2-firework-a.webp'], url: SITE + '/holiday/' })}</script>`).join('\n');
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
  ${t.summary ? prose(t.summary, 'crs-sum') : ''}
  ${t.desc ? prose(t.desc) : ''}
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
${nearAiBox(TITLE, {
      place: `${TITLE} — 총 ${list.length}개 코스 · 총 거리 ${totalKm}km · 지나는 시·도 ${sidos.length}곳`,
      near: {
        코스: list.slice(0, 40).map(t => `${t.name}${t.dist ? ` ${t.dist}km` : ''}${t.min ? ` 약 ${Math.round(t.min / 60 * 10) / 10}시간` : ''}${t.level ? ` 난이도 ${t.level}` : ''}${t.sigun ? ` ${String(t.sigun).split(' ').slice(0, 2).join(' ')}` : ''}`)
      }
    }, ['처음이면 어느 코스부터 걷는 게 좋을까요?', '3시간 안에 끝나는 코스는?', '난이도 낮은 코스만 알려주세요', '바다가 보이는 구간은 어디인가요?'])}

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
  },
  // 번체 — "외국인이 적은 곳 = 로컬" 각도를 전면에 세운다. 재방문객이 원하는 게 그거다.
  tw: {
    h1: '🔥 韓國人自己會去的地方',
    intro: '用韓國觀光公社的觀光大數據整理出「實際上人去最多」的市・郡・區。外國遊客少的地方，通常更有生活感。點擊長條可查看當地慶典。',
    badge: (Y, M, P) => `<b>${M}月</b>旺季排行以 <b>${Y}年${M}月</b> 實績為準 · 訪客排行以 <b>${P}</b> 為準`,
    badgeNote: '訪問資料約延遲一個月公開，因此季節排行採用去年同月的實績。',
    tabs: { season: m => `🌞 ${m}月最熱鬧的地方`, kor: '🇰🇷 韓國人常去的地方', fgn: '🌏 外國人常去的地方', sido: '🗺️ 依道・廣域市' },
    desc: {
      season: (y, m) => `把 <b>${y}年${m}月</b> 的實際人流跟該年平常水準（年平均）相比得出的<b>旺季倍數</b>。×1.5 就是比平常熱鬧 1.5 倍。海水浴場、溪谷、山岳這類季節性強的地方會上榜。`,
      kor: '以<b>非當地居民的國內訪客</b>人次為準。因為包含通勤與購物移動，首都圈大城市排名會偏前。',
      fgn: '以<b>外國訪客</b>人次為準。明洞・仁寺洞所在的首爾中區・鍾路區、機場所在的仁川中區以及濟州名列前茅。<b>反過來說，沒出現在這張榜上的地方，就是外國人少的地方。</b>',
      sido: '依道・廣域市統計的訪客總數（國內＋外國）。'
    },
    unit: '', times: '×', legend: `長條長度＝造訪規模 · 右邊數字＝旺季標籤是<b>倍數</b>，其餘是<b>30天訪客人次合計</b>。<a href="#howto">數字怎麼看 ↓</a>`, src: '資料來源：韓國觀光公社《韓國觀光數據實驗室》地區訪客數（公共資料入口網）。基於通信與信用卡資料的推估值，每週更新。',
    title: m => `韓國人氣旅遊地排行 — ${m}月旺季榜・在地人常去的地方 | Chukjemoa`,
    metad: '用韓國觀光公社觀光大數據做的人氣旅遊地排行：本月旺季熱點、韓國人常去與外國人常去的市・郡・區對照。想避開觀光客、找有生活感的地方時看這個。'
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
    // noindex: 고유 콘텐츠 평균 680자짜리 양산형 페이지 20개(지역16+테마4)가 사이트 전체 품질
    // 평가를 끌어내리고 있다(2026-08-08 진단). 색인에서만 빼고 링크는 살린다(follow).
    // 나중에 '이번 주말 ○○ 갈 만한 곳'으로 두껍게 고치면 이 옵션만 지우면 된다.
    `/trend/${slug}/`, content, { jsonld: ld, noindex: true }));
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
    `/trend/${T.slug}/`, content, { jsonld: ld, noindex: true }));   // 위 지역 랭킹과 같은 이유
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
</section>`,
  tw: (Y, M, P, LAT, MN) => `<section class="explain" id="howto">
<h2>📖 這些數字怎麼看</h2>
<h3>1. 統計的是什麼</h3>
<p><b>韓國觀光公社</b>公開的訪客推估值，來源是<b>通信與信用卡資料</b>。不是問卷、也不是門票數，而是推估「實際上有多少人待在那個地區」。</p>
<ul>
<li><b>韓國人</b>：非該地區居民的國內訪客</li>
<li><b>外國人</b>：使用國外電信漫遊或外國卡的訪客</li>
<li>單位是<b>人次</b> — 同一個人去兩次算兩次</li>
</ul>
<h3>2. 為什麼首爾・京畿總是在前面</h3>
<p>因為「外地訪客」不只有觀光客，還包含<b>通勤、通學、購物、出差</b>。每天從鄰近城市通勤的人也會被算進去。所以<b>單看這張榜，大城市是被高估的</b>。</p>
<p>想看純粹的旅遊吸引力，請看 <b>${M}月旺季</b> 分頁 — 通勤人口不隨季節變動，會自動被抵銷。</p>
<h3>3. 想找「觀光客少的地方」的話</h3>
<p>這是重點。<b>外國人榜上沒出現的地區，就是外國遊客少的地方。</b>首爾中區（明洞）、鍾路區（仁寺洞）、仁川中區（機場）、濟州以外的地方，多半還維持著在地生活的樣子。第二次、第三次來韓國的話，可以用這張榜<b>反過來挑</b>。</p>
<h3>4. 旺季倍數（例如 ×1.54）怎麼算</h3>
<p style="text-align:center;background:#f4faf8;border:1px solid #dcefeb;border-radius:10px;padding:13px;font-weight:700;color:#0a6c63;margin:10px 0">
旺季倍數 ＝ ${Y}年${M}月的日均訪客 ÷ ${Y}年平常的日均訪客
</p>
<p><b>鬱陵郡 ×1.54</b> 表示鬱陵郡在 ${Y}年${M}月的人流是<b>該年平常水準的 1.54 倍</b>。衡量的是<b>「比平常熱鬧多少」</b>而不是絕對人數，所以小地方在自己的旺季也能排第一。</p>
<p>作為基準的「平常」，是用 ${Y} 年 12 個月平均抽樣得到的日均值。日均訪客不到 5,000 人的地區已排除，因為母數太小會讓倍數劇烈跳動。</p>
<h3>5. 為什麼用去年的資料</h3>
<p>這份資料<b>大約延遲一個月才公開</b>（目前最新統計日：${LAT}）。如果用延遲的最新資料回答「現在 ${M} 月哪裡熱鬧」，得到的會是<b>完全不同季節的答案</b>。改用<b>去年同月的實績</b>，季節才對得上。</p>
<p>韓國人・外國人・道別排行是為了比較規模而非季節，所以直接使用<b>最新 30 天（${P}）</b>。</p>
<h3>6. 要知道的限制</h3>
<ul>
<li>基於通信與信用卡資料的<b>推估值</b>，與實際旅客數有落差。</li>
<li>有同名的市・郡・區（首爾中區與仁川中區等），所以<b>一律標註道・廣域市</b>。</li>
<li>統計只到市・郡・區層級，看不出區域內具體哪個景點熱鬧。</li>
</ul>
<h3>📌 資料來源</h3>
<p>韓國觀光公社 <a href="${DL_URL}" target="_blank" rel="noopener">韓國觀光數據實驗室</a> — 各地區（市郡區・道）每日訪客數<br>
透過公共資料入口網 <a href="${DATAGO_URL}" target="_blank" rel="noopener">韓國觀光公社_觀光大數據資訊服務</a>（DataLabService）採集<br>
統計期間：旺季排行 ${Y}年${M}月 / 訪客排行 ${P} · 每週一自動更新</p>
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
    // 서버는 ODsay 를 못 부른다(데이터센터 IP 차단) → 브라우저에서 직접 채운다
    if(d.error||!d.car||!d.geo||!window.cjmOdsay)return d;
    return window.cjmOdsay(d.geo.ox,d.geo.oy,d.geo.dx,d.geo.dy).then(function(t){
      if(t&&t.fare){d.transit=t;d.intercity=null;d.diff=d.car.total-t.fare;}
      return d;
    });
  }).then(function(d){
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
    html+=${JSON.stringify(buyBox('tripcost'))};
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

// ---------- 전국 명산 /mountains/ + 다국어 ----------
// 요즘 외국인의 한국 등산 수요가 늘고 있는데, 산 목록 자체는 어디에나 있다.
// 우리만 할 수 있는 건 "그 산이 있는 지역이 지금 붐비는가 / 외국인이 많은가"를 얹는 것.
// 관광 빅데이터(visitors.json)를 시군구 코드로 조인해서 붐빔 지표를 붙인다.
const MOUNTAIN_URLS = [];
{
  const MT = {};
  ['ko', 'en', 'ja', 'zh', 'tw'].forEach(l => {
    try { MT[l] = JSON.parse(fs.readFileSync(path.join(ROOT, `data/mountains_${l}.json`), 'utf8')); }
    catch (e) { MT[l] = []; }
  });
  // 시군구 코드 → 10월 성수기 배수 / 외국인 상위 여부
  const OCT = {}; ((visitors.seasonByMonth && visitors.seasonByMonth.months && visitors.seasonByMonth.months['10']) || [])
    .forEach(r => { OCT[r.code] = r.idx; });
  const FGN = {}; (visitors.fgn || []).forEach(r => { FGN[r.code] = r.rank; });
  const KOR = {}; (visitors.kor || []).forEach(r => { KOR[r.code] = r.rank; });

  const ML = {
    ko: { h1: '⛰️ 전국 명산', sub: n => `공공데이터(한국관광공사) 기반 전국 산 ${n}곳 — 어느 산이 단풍철에 붐비고 어디가 한적한지까지 함께 봅니다.`,
      title: n => `전국 명산 ${n}곳 — 단풍철 붐비는 산·한적한 산 | ${SITE_NAME}`,
      desc: n => `전국 산 ${n}곳을 지역별로. 한국관광공사 공공데이터 기반 정보에 관광 빅데이터로 본 "10월 성수기 배수"와 외국인 방문 지표를 더했습니다.`,
      all: '전체 지역', kw: '산 이름·주소 검색', reset: '초기화', cnt: n => `총 ${n}곳`,
      none: '조건에 맞는 산이 없어요. 지역을 바꿔보세요.',
      oct: v => `🍁 10월엔 이 지역이 평소의 ×${v}배`, quiet: '🤫 외국인 발길이 적은 편',
      busy: '🌏 외국인이 많이 찾는 지역', korbusy: '🇰🇷 한국인이 많이 찾는 지역',
      walkCta: '이 지역 걷기길 보기 →', walkH: '산 말고 완만한 길을 찾는다면',
      note: '데이터 출처: 한국관광공사(공공데이터포털) 관광지 정보 · 붐빔 지표는 한국관광공사 「한국관광 데이터랩」 지역별 방문자 수를 시·군·구 단위로 조인한 것입니다. 산 자체가 아니라 <b>그 산이 속한 시·군·구</b>의 수치라는 점에 유의하세요. 등산로 상태·입산 통제·기상은 반드시 국립공원공단·산림청·지자체 공지를 확인하시기 바랍니다.',
      hundred: '※ 산림청이 2002년 세계 산의 해를 기념해 선정한 「100대 명산」 공식 목록은 <a href="https://www.forest.go.kr/kfsweb/kfi/kfs/foreston/main/contents/FmmntSrch/selectFmmntSrchList.do?mn=AR02_02_05_01" target="_blank" rel="noopener nofollow">산림청 홈페이지</a>에서 확인하실 수 있습니다.' },
    en: { h1: '⛰️ Mountains of Korea', sub: n => `${n} mountains across South Korea — with a crowd index showing which areas fill up in autumn and which stay quiet.`,
      title: n => `Mountains of Korea — ${n} Peaks, Crowded vs Quiet in Autumn | Chukjemoa`,
      desc: n => `Browse ${n} mountains across South Korea by region. Official Korea Tourism Organization data plus a peak-season multiplier and foreign-visitor index from tourism big data.`,
      all: 'All regions', kw: 'Search by name or address', reset: 'Reset', cnt: n => `${n} mountains`,
      none: 'No mountains match. Try another region.',
      oct: v => `🍁 ×${v} busier than usual in October`, quiet: '🤫 Few foreign visitors here',
      busy: '🌏 Popular with foreign visitors', korbusy: '🇰🇷 Popular with Koreans',
      walkCta: 'See walking trails in this region →', walkH: 'Prefer a gentler walk?',
      note: 'Source: Korea Tourism Organization (Open Data Portal). The crowd index joins KTO "Korea Tourism Data Lab" visitor counts at the city/county level — it describes <b>the district the mountain sits in</b>, not the mountain itself. Always check the Korea National Park Service, Korea Forest Service or the local authority for trail closures and weather before you go.',
      hundred: '※ The official "100 Famous Mountains" list selected by the Korea Forest Service in 2002 is published on the <a href="https://www.forest.go.kr/kfsweb/kfi/kfs/foreston/main/contents/FmmntSrch/selectFmmntSrchList.do?mn=AR02_02_05_01" target="_blank" rel="noopener nofollow">Korea Forest Service website</a>.' },
    ja: { h1: '⛰️ 韓国の名山', sub: n => `韓国全国の山 ${n}か所 — 紅葉シーズンに混む地域と、静かな地域まで一緒に見られます。`,
      title: n => `韓国の名山 ${n}か所 — 紅葉期に混む山・静かな山 | Chukjemoa`,
      desc: n => `韓国全国の山 ${n}か所を地域別に。韓国観光公社の公共データに、観光ビッグデータによる「10月の繁忙倍率」と外国人訪問指標を加えました。`,
      all: 'すべての地域', kw: '山名・住所で検索', reset: 'リセット', cnt: n => `全 ${n}か所`,
      none: '該当する山がありません。地域を変えてみてください。',
      oct: v => `🍁 10月はこの地域が普段の ×${v} 倍`, quiet: '🤫 外国人が少なめのエリア',
      busy: '🌏 外国人に人気のエリア', korbusy: '🇰🇷 韓国人に人気のエリア',
      walkCta: 'この地域の歩く道を見る →', walkH: '山より穏やかな道をお探しなら',
      note: '出典：韓国観光公社（公共データポータル）観光地情報 · 混雑指標は韓国観光公社「韓国観光データラボ」の地域別訪問者数を市・郡・区単位で結合したものです。山そのものではなく<b>その山が属する市・郡・区</b>の数値である点にご注意ください。登山道の状況・入山規制・天候は必ず国立公園公団・山林庁・自治体の告知をご確認ください。',
      hundred: '※ 山林庁が2002年「国際山岳年」を記念して選定した「100大名山」の公式リストは<a href="https://www.forest.go.kr/kfsweb/kfi/kfs/foreston/main/contents/FmmntSrch/selectFmmntSrchList.do?mn=AR02_02_05_01" target="_blank" rel="noopener nofollow">山林庁ホームページ</a>で確認できます。' },
    zh: { h1: '⛰️ 韩国名山', sub: n => `韩国全国 ${n} 座山 — 还能看到哪些地区在红叶季拥挤、哪些地区清静。`,
      title: n => `韩国名山 ${n}座 — 红叶季拥挤的山与清静的山 | Chukjemoa`,
      desc: n => `按地区浏览韩国全国 ${n} 座山。韩国观光公社公共数据，另加旅游大数据的「10月旺季倍数」与外国人访问指标。`,
      all: '所有地区', kw: '按名称或地址搜索', reset: '重置', cnt: n => `共 ${n} 座`,
      none: '没有符合条件的山，请更换地区。',
      oct: v => `🍁 10月该地区是平时的 ×${v} 倍`, quiet: '🤫 外国游客较少的地区',
      busy: '🌏 外国游客较多的地区', korbusy: '🇰🇷 韩国人常去的地区',
      walkCta: '查看该地区的步道 →', walkH: '想找比登山更平缓的路线',
      note: '数据来源：韩国观光公社（公共数据门户）景点信息 · 拥挤指标是把韩国观光公社《韩国观光数据实验室》的地区访客数按市·郡·区结合而成。请注意这是<b>该山所在市·郡·区</b>的数值，而非山本身。登山道状况、入山管制与天气请务必查阅国立公园公团、山林厅或当地政府公告。',
      hundred: '※ 山林厅于2002年国际山岳年评选的「100大名山」官方名单，可在<a href="https://www.forest.go.kr/kfsweb/kfi/kfs/foreston/main/contents/FmmntSrch/selectFmmntSrchList.do?mn=AR02_02_05_01" target="_blank" rel="noopener nofollow">山林厅官网</a>查看。' },
    tw: { h1: '⛰️ 韓國名山', sub: n => `韓國全國 ${n} 座山 — 還能看到哪些地區在楓葉季會擠、哪些地區還很安靜。`,
      title: n => `韓國名山 ${n}座 — 楓葉季會擠的山與安靜的山 | Chukjemoa`,
      desc: n => `依地區瀏覽韓國全國 ${n} 座山。韓國觀光公社公共資料，再加上觀光大數據的「10月旺季倍數」與外國遊客指標 — 想避開人潮的話特別好用。`,
      all: '所有地區', kw: '以名稱或地址搜尋', reset: '重設', cnt: n => `共 ${n} 座`,
      none: '沒有符合條件的山，請換個地區。',
      oct: v => `🍁 10月這一帶是平常的 ×${v} 倍`, quiet: '🤫 外國遊客少的地區',
      busy: '🌏 外國遊客多的地區', korbusy: '🇰🇷 韓國人常去的地區',
      walkCta: '看看這個地區的步道 →', walkH: '想找比登山更平緩的路',
      note: '資料來源：韓國觀光公社（公共資料入口網）景點資訊 · 擁擠指標是把韓國觀光公社《韓國觀光數據實驗室》的地區訪客數以市・郡・區為單位結合而成。請注意那是<b>該座山所在的市・郡・區</b>的數字，不是山本身。登山道狀況、入山管制與天氣，出發前務必확認國立公園公團・山林廳或當地政府公告。',
      hundred: '※ 山林廳在2002年國際山岳年選出的「100大名山」官方名單，可在<a href="https://www.forest.go.kr/kfsweb/kfi/kfs/foreston/main/contents/FmmntSrch/selectFmmntSrchList.do?mn=AR02_02_05_01" target="_blank" rel="noopener nofollow">山林廳官網</a>查看。' }
  };
  const SIDO_TXT = {
    en: { '서울': 'Seoul', '부산': 'Busan', '대구': 'Daegu', '인천': 'Incheon', '광주': 'Gwangju', '대전': 'Daejeon', '울산': 'Ulsan', '세종': 'Sejong', '경기': 'Gyeonggi', '충북': 'Chungbuk', '충남': 'Chungnam', '전남': 'Jeonnam', '경북': 'Gyeongbuk', '경남': 'Gyeongnam', '제주': 'Jeju', '강원': 'Gangwon', '전북': 'Jeonbuk' },
    ja: { '서울': 'ソウル', '부산': '釜山', '대구': '大邱', '인천': '仁川', '광주': '光州', '대전': '大田', '울산': '蔚山', '세종': '世宗', '경기': '京畿', '충북': '忠北', '충남': '忠南', '전남': '全南', '경북': '慶北', '경남': '慶南', '제주': '済州', '강원': '江原', '전북': '全北' },
    zh: { '서울': '首尔', '부산': '釜山', '대구': '大邱', '인천': '仁川', '광주': '光州', '대전': '大田', '울산': '蔚山', '세종': '世宗', '경기': '京畿', '충북': '忠北', '충남': '忠南', '전남': '全南', '경북': '庆北', '경남': '庆南', '제주': '济州', '강원': '江原', '전북': '全北' },
    tw: { '서울': '首爾', '부산': '釜山', '대구': '大邱', '인천': '仁川', '광주': '光州', '대전': '大田', '울산': '蔚山', '세종': '世宗', '경기': '京畿', '충북': '忠北', '충남': '忠南', '전남': '全南', '경북': '慶北', '경남': '慶南', '제주': '濟州', '강원': '江原', '전북': '全北' }
  };
  const mtAlts = () => {
    const a = [{ hreflang: 'ko', href: '/mountains/' }];
    ['en', 'ja', 'zh', 'tw'].forEach(l => { if ((MT[l] || []).length) a.push({ hreflang: HREFLANG[l] || l, href: '/' + l + '/mountains/' }); });
    a.push({ hreflang: 'x-default', href: '/mountains/' }); return a;
  };

  ['ko', 'en', 'ja', 'zh', 'tw'].forEach(lang => {
    const list = MT[lang] || []; if (!list.length) return;
    const L = ML[lang]; const ST = SIDO_TXT[lang];
    const sidoName = s => (ST && ST[s]) || s;
    const sidos = SIDO_ORDER.filter(s => list.some(m => m.sido === s));
    const opts = sidos.map(s => `<option value="${s}">${esc(sidoName(s))} (${list.filter(m => m.sido === s).length})</option>`).join('');
    const card = m => {
      const code = String(m.regnCd || '') + String(m.signguCd || '');
      const oct = OCT[code], fgn = FGN[code], kor = KOR[code];
      const badges = [
        oct ? `<span class="mb hot">${L.oct(oct)}</span>` : '',
        fgn ? `<span class="mb fgn">${L.busy}</span>` : (kor ? `<span class="mb kr">${L.korbusy}</span>` : `<span class="mb qt">${L.quiet}</span>`)
      ].filter(Boolean).join('');
      const img = m.img ? String(m.img).replace(/^http:/, 'https:') : '/img/hero.webp';
      const q = encodeURIComponent(m.title);
      return `<a class="mcard" href="https://search.naver.com/search.naver?query=${q}" target="_blank" rel="noopener" data-sido="${esc(m.sido)}" data-kw="${esc((m.title + ' ' + (m.addr || '')).toLowerCase())}">
<div class="mthumb"><img loading="lazy" src="${esc(img)}" alt="${esc(m.title)}" onerror="this.src='/img/hero.webp'"></div>
<div class="mbody"><h3>${esc(m.title)}</h3>
<div class="mloc">📍 ${esc(sidoName(m.sido))}${m.addr ? ' · ' + esc(String(m.addr).slice(0, 40)) : ''}</div>
${badges ? `<div class="mbs">${badges}</div>` : ''}
${m.ov ? `<p class="mov">${esc(String(m.ov).slice(0, 110))}…</p>` : ''}
</div></a>`;
    };
    const content = `<main><div class="wrap">
<style>
.mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin:16px 0}
.mcard{background:#fff;border-radius:16px;box-shadow:0 3px 14px rgba(31,41,55,.08);overflow:hidden;text-decoration:none;color:inherit;display:block;transition:transform .15s}
.mcard:hover{transform:translateY(-2px)}
.mthumb{aspect-ratio:16/10;background:#eef4f3;overflow:hidden}
.mthumb img{width:100%;height:100%;object-fit:cover}
.mbody{padding:14px 16px 16px}
.mbody h3{font-size:1.02rem;font-weight:900;color:#0a6c63}
.mloc{font-size:.83rem;color:#6b7280;margin-top:5px}
.mbs{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.mb{font-size:.76rem;font-weight:800;border-radius:999px;padding:4px 10px}
.mb.hot{background:#fff1e8;color:#c2410c}
.mb.fgn{background:#eef2ff;color:#4338ca}
.mb.kr{background:#f0fdf4;color:#15803d}
.mb.qt{background:#f2fbfa;color:#0a6c63}
.mov{margin-top:9px;font-size:.85rem;color:#4b5563;line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.srchbar{background:#fff;border-radius:16px;padding:16px 18px;box-shadow:0 3px 14px rgba(31,41,55,.07);margin:14px 0 6px}
.srchbar .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.srchbar select,.srchbar input{padding:10px 13px;border:1.5px solid #dcefeb;border-radius:12px;font-size:.93rem;font-family:inherit;background:#f4faf8;color:#374151}
.srchbar input{flex:1;min-width:150px}
.srch-count{margin:16px 0 12px;font-weight:800;color:#0a6c63;font-size:1.02rem}
</style>
<h1 style="font-size:1.5rem;font-weight:900;margin:8px 0 4px">${L.h1}</h1>
<p style="color:#6b7280;font-size:.95rem;margin-bottom:6px">${L.sub(list.length)}</p>
<div class="srchbar"><div class="row">
<select id="mSido"><option value="">${esc(L.all)}</option>${opts}</select>
<input type="text" id="mKw" placeholder="${esc(L.kw)}">
<button id="mReset" type="button" style="background:#f3f4f6;color:#374151;border:none;border-radius:12px;padding:10px 18px;font-weight:700;cursor:pointer;font-family:inherit">${esc(L.reset)}</button>
</div></div>
<div class="srch-count" id="mCount">${L.cnt(list.length)}</div>
<div class="mgrid" id="mGrid">${list.map(card).join('\n')}</div>
<p class="note" id="mNone" style="display:none">${esc(L.none)}</p>
<h2 class="sec">${esc(L.walkH)}</h2>
<p><a href="${lang === 'ko' ? '/trails/' : '/trails/'}" style="display:inline-block;background:#0f9d8f;color:#fff;font-weight:700;padding:11px 22px;border-radius:22px;text-decoration:none">${esc(L.walkCta)}</a></p>
${lang === 'ko' ? buyBox('mountain') : ''}
<p class="note" style="margin-top:18px">${L.note}</p>
<p class="note">${L.hundred}</p>
</div></main>
<script>
(function(){
  var g=document.getElementById('mGrid'); if(!g) return;
  var sel=document.getElementById('mSido'), kw=document.getElementById('mKw'), rs=document.getElementById('mReset');
  var cnt=document.getElementById('mCount'), none=document.getElementById('mNone');
  var cards=[].slice.call(g.querySelectorAll('.mcard'));
  var TPL=${JSON.stringify(String(L.cnt(0)).replace('0','%d'))};
  function apply(){
    var s=sel.value, k=(kw.value||'').trim().toLowerCase(), n=0;
    cards.forEach(function(c){
      var ok=(!s||c.getAttribute('data-sido')===s)&&(!k||c.getAttribute('data-kw').indexOf(k)>=0);
      c.style.display=ok?'':'none'; if(ok)n++;
    });
    cnt.textContent=TPL.replace('%d',n); none.style.display=n?'none':'';
  }
  sel.addEventListener('change',apply); kw.addEventListener('input',apply);
  rs.addEventListener('click',function(){sel.value='';kw.value='';apply();});
})();
</script>`;
    const ld = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org', '@type': 'ItemList', name: L.h1.replace(/^\S+\s/, ''),
      numberOfItems: list.length,
      itemListElement: list.slice(0, 50).map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: m.title }))
    })}</script>`;
    const url = lang === 'ko' ? '/mountains/' : `/${lang}/mountains/`;
    writePage(lang === 'ko' ? 'mountains' : `${lang}/mountains`,
      layout(L.title(list.length), L.desc(list.length), url, content,
        { lang, jsonld: ld, alternates: mtAlts(), ogImage: '/img/hero.webp' }));
    MOUNTAIN_URLS.push(url);
  });
}

// ---------- ☕ 요즘 가는 카페 /cafe/ (5개 언어) + 🔥 요즘 어디 가지 /hot/ (국문) ----------
// 카페 목록은 어디에나 있다. 우리만 얹을 수 있는 건 "그 동네가 지금 붐비는가 / 외국인이 많은가"다.
// /hot/ 은 감사에서 지적된 '상황별 랜딩'(사람이 실제로 검색하는 문장)의 첫 페이지다.
const CAFE_URLS = [];
const HOT_URLS = [];
{
  const CF = {};
  ['ko', 'en', 'ja', 'zh', 'tw'].forEach(l => {
    try { CF[l] = JSON.parse(fs.readFileSync(path.join(ROOT, `data/cafes_${l}.json`), 'utf8')); }
    catch (e) { CF[l] = []; }
  });
  const MONTH_LIST = (visitors.seasonByMonth && visitors.seasonByMonth.months && visitors.seasonByMonth.months[String(SEASON_M)]) || SEASON_LIST;
  const NOWIDX = {}; (MONTH_LIST || []).forEach(r => { NOWIDX[r.code] = r.idx; });
  const CFGN = {}; (visitors.fgn || []).forEach(r => { CFGN[r.code] = r.rank; });
  const CKOR = {}; (visitors.kor || []).forEach(r => { CKOR[r.code] = r.rank; });

  const CSIDO = {
    en: { '서울': 'Seoul', '부산': 'Busan', '대구': 'Daegu', '인천': 'Incheon', '광주': 'Gwangju', '대전': 'Daejeon', '울산': 'Ulsan', '세종': 'Sejong', '경기': 'Gyeonggi', '충북': 'Chungbuk', '충남': 'Chungnam', '전남': 'Jeonnam', '경북': 'Gyeongbuk', '경남': 'Gyeongnam', '제주': 'Jeju', '강원': 'Gangwon', '전북': 'Jeonbuk' },
    ja: { '서울': 'ソウル', '부산': '釜山', '대구': '大邱', '인천': '仁川', '광주': '光州', '대전': '大田', '울산': '蔚山', '세종': '世宗', '경기': '京畿', '충북': '忠北', '충남': '忠南', '전남': '全南', '경북': '慶北', '경남': '慶南', '제주': '済州', '강원': '江原', '전북': '全北' },
    zh: { '서울': '首尔', '부산': '釜山', '대구': '大邱', '인천': '仁川', '광주': '光州', '대전': '大田', '울산': '蔚山', '세종': '世宗', '경기': '京畿', '충북': '忠北', '충남': '忠南', '전남': '全南', '경북': '庆北', '경남': '庆南', '제주': '济州', '강원': '江原', '전북': '全北' },
    tw: { '서울': '首爾', '부산': '釜山', '대구': '大邱', '인천': '仁川', '광주': '光州', '대전': '大田', '울산': '蔚山', '세종': '世宗', '경기': '京畿', '충북': '忠北', '충남': '忠南', '전남': '全南', '경북': '慶北', '경남': '慶南', '제주': '濟州', '강원': '江原', '전북': '全北' }
  };

  const CL = {
    ko: {
      h1: '☕ 요즘 가는 카페',
      sub: n => `공공데이터(한국관광공사) 기반 전국 카페·베이커리 ${n}곳 — 어느 동네가 지금 붐비고 어디가 아직 한적한지까지 같이 봅니다.`,
      title: n => `요즘 가는 카페 ${n}곳 — 지역별 대형카페·감성카페 지도 | ${SITE_NAME}`,
      desc: n => `전국 카페·베이커리 ${n}곳을 지역별로. 한국관광공사 공공데이터에 관광 빅데이터로 본 "${SEASON_M}월 성수기 배수"와 외국인 방문 지표를 더해, 붐비는 동네와 한적한 동네를 갈라서 보여줍니다.`,
      all: '전체 지역', kw: '카페 이름·주소 검색', reset: '초기화', cnt: n => `총 ${n}곳`,
      none: '조건에 맞는 카페가 없어요. 지역을 바꿔보세요.',
      hot: v => `🔥 ${SEASON_M}월엔 이 동네가 평소의 ×${v}배`, quiet: '🤫 외국인 발길이 적은 편',
      busy: '🌏 외국인이 많이 찾는 지역', korbusy: '🇰🇷 한국인이 많이 찾는 지역',
      hotH: '지금 사람이 몰리는 동네부터 보고 싶다면',
      hotCta: `${SEASON_M}월 요즘 뜨는 동네 보기 →`, hotHref: '/hot/',
      note: `데이터 출처: 한국관광공사(공공데이터포털) 음식점·카페 정보 · 붐빔 지표는 한국관광공사 「한국관광 데이터랩」 지역별 방문자 수를 시·군·구 단위로 조인한 것입니다. 카페 자체가 아니라 <b>그 카페가 있는 시·군·구</b>의 수치라는 점에 유의하세요. 영업시간·휴무일·메뉴는 방문 전 반드시 매장에 확인하시기 바랍니다.`
    },
    en: {
      h1: '☕ Cafés in Korea',
      sub: n => `${n} cafés and bakeries across South Korea — with a crowd index showing which neighbourhoods are packed right now and which are still quiet.`,
      title: n => `Cafés in Korea — ${n} Spots, Busy vs Quiet Neighbourhoods | Chukjemoa`,
      desc: n => `Browse ${n} cafés and bakeries across South Korea by region. Official Korea Tourism Organization data plus a peak-season multiplier and a foreign-visitor index from tourism big data.`,
      all: 'All regions', kw: 'Search by name or address', reset: 'Reset', cnt: n => `${n} cafés`,
      none: 'No cafés match. Try another region.',
      hot: v => `🔥 ×${v} busier than usual this month`, quiet: '🤫 Few foreign visitors here',
      busy: '🌏 Popular with foreign visitors', korbusy: '🇰🇷 Popular with Koreans',
      hotH: 'Want the quiet ones?',
      hotCta: 'See mountains and trails →', hotHref: '/en/mountains/',
      note: 'Source: Korea Tourism Organization (Open Data Portal) restaurant and café listings. The crowd index joins KTO "Korea Tourism Data Lab" visitor counts at the city/county level — it describes <b>the district the café sits in</b>, not the café itself. Always check opening hours with the venue before you go.'
    },
    ja: {
      h1: '☕ 韓国のいまのカフェ',
      sub: n => `韓国全国のカフェ・ベーカリー ${n}か所 — いまどの街が混んでいて、どこがまだ静かなのかも一緒に見られます。`,
      title: n => `韓国のカフェ ${n}か所 — 混んでいる街・静かな街で選ぶ | Chukjemoa`,
      desc: n => `韓国全国のカフェ・ベーカリー ${n}か所を地域別に。韓国観光公社の公共データに、観光ビッグデータによる「今月の繁忙倍率」と外国人訪問指標を加えました。`,
      all: 'すべての地域', kw: '店名・住所で検索', reset: 'リセット', cnt: n => `全 ${n}か所`,
      none: '該当するカフェがありません。地域を変えてみてください。',
      hot: v => `🔥 今月はこの街が普段の ×${v} 倍`, quiet: '🤫 外国人が少なめのエリア',
      busy: '🌏 外国人に人気のエリア', korbusy: '🇰🇷 韓国人に人気のエリア',
      hotH: '静かな場所をお探しなら',
      hotCta: '名山・歩く道を見る →', hotHref: '/ja/mountains/',
      note: '出典：韓国観光公社（公共データポータル）飲食店・カフェ情報 · 混雑指標は韓国観光公社「韓国観光データラボ」の地域別訪問者数を市・郡・区単位で結合したものです。カフェそのものではなく<b>そのカフェがある市・郡・区</b>の数値である点にご注意ください。営業時間・定休日は訪問前に店舗へご確認ください。'
    },
    zh: {
      h1: '☕ 韩国最近在去的咖啡馆',
      sub: n => `韩国全国咖啡馆·烘焙店 ${n} 家 — 还能看到现在哪些街区人多、哪些还清静。`,
      title: n => `韩国咖啡馆 ${n}家 — 按拥挤街区与清静街区挑选 | Chukjemoa`,
      desc: n => `按地区浏览韩国全国 ${n} 家咖啡馆与烘焙店。韩国观光公社公共数据，另加旅游大数据的「本月旺季倍数」与外国人访问指标。`,
      all: '所有地区', kw: '按名称或地址搜索', reset: '重置', cnt: n => `共 ${n} 家`,
      none: '没有符合条件的咖啡馆，请更换地区。',
      hot: v => `🔥 本月该街区是平时的 ×${v} 倍`, quiet: '🤫 外国游客较少的地区',
      busy: '🌏 外国游客较多的地区', korbusy: '🇰🇷 韩国人常去的地区',
      hotH: '想避开人潮',
      hotCta: '看名山与步道 →', hotHref: '/zh/mountains/',
      note: '数据来源：韩国观光公社（公共数据门户）餐饮·咖啡馆信息 · 拥挤指标是把韩国观光公社《韩国观光数据实验室》的地区访客数按市·郡·区结合而成。请注意这是<b>该咖啡馆所在市·郡·区</b>的数值，而非店铺本身。营业时间与休息日请出行前向店家确认。'
    },
    tw: {
      h1: '☕ 韓國人最近在去的咖啡廳',
      sub: n => `韓國全國咖啡廳・烘焙坊 ${n} 家 — 還能看到現在哪一帶人多、哪一帶還很安靜。`,
      title: n => `韓國咖啡廳 ${n}家 — 分成會擠的區與安靜的區 | Chukjemoa`,
      desc: n => `依地區瀏覽韓國全國 ${n} 家咖啡廳與烘焙坊。韓國觀光公社公共資料，再加上觀光大數據的「本月旺季倍數」與外國遊客指標 — 想避開人潮時特別好用。`,
      all: '所有地區', kw: '以店名或地址搜尋', reset: '重設', cnt: n => `共 ${n} 家`,
      none: '沒有符合條件的咖啡廳，請換個地區。',
      hot: v => `🔥 本月這一帶是平常的 ×${v} 倍`, quiet: '🤫 外國遊客少的地區',
      busy: '🌏 外國遊客多的地區', korbusy: '🇰🇷 韓國人常去的地區',
      hotH: '想找韓國人自己會去的地方',
      hotCta: '看五日市集 →', hotHref: '/tw/jangteo/',
      note: '資料來源：韓國觀光公社（公共資料入口網）餐飲・咖啡廳資訊 · 擁擠指標是把韓國觀光公社《韓國觀光數據實驗室》的地區訪客數以市・郡・區為單位結合而成。請注意那是<b>該咖啡廳所在的市・郡・區</b>的數字，不是店家本身。營業時間與公休日出發前請向店家確認。'
    }
  };

  const cfAlts = () => {
    const a = [{ hreflang: 'ko', href: '/cafe/' }];
    ['en', 'ja', 'zh', 'tw'].forEach(l => { if ((CF[l] || []).length) a.push({ hreflang: HREFLANG[l] || l, href: '/' + l + '/cafe/' }); });
    a.push({ hreflang: 'x-default', href: '/cafe/' }); return a;
  };

  const CAFE_CSS = `
.cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;margin:16px 0}
.ccard{background:#fff;border-radius:16px;box-shadow:0 3px 14px rgba(31,41,55,.08);overflow:hidden;text-decoration:none;color:inherit;display:block;transition:transform .15s}
.ccard:hover{transform:translateY(-2px)}
.cthumb{aspect-ratio:16/10;background:#f6f1ea;overflow:hidden}
.cthumb img{width:100%;height:100%;object-fit:cover}
.cbody{padding:13px 15px 15px}
.cbody h3{font-size:1rem;font-weight:900;color:#0a6c63}
.cloc{font-size:.82rem;color:#6b7280;margin-top:5px}
.cbs{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.cb{font-size:.75rem;font-weight:800;border-radius:999px;padding:4px 10px}
.cb.hot{background:#fff1e8;color:#c2410c}
.cb.fgn{background:#eef2ff;color:#4338ca}
.cb.kr{background:#f0fdf4;color:#15803d}
.cb.qt{background:#f2fbfa;color:#0a6c63}
.cov{margin-top:9px;font-size:.84rem;color:#4b5563;line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.srchbar{background:#fff;border-radius:16px;padding:16px 18px;box-shadow:0 3px 14px rgba(31,41,55,.07);margin:14px 0 6px}
.srchbar .row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.srchbar select,.srchbar input{padding:10px 13px;border:1.5px solid #dcefeb;border-radius:12px;font-size:.93rem;font-family:inherit;background:#f4faf8;color:#374151}
.srchbar input{flex:1;min-width:150px}
.srch-count{margin:16px 0 12px;font-weight:800;color:#0a6c63;font-size:1.02rem}
.cmore{display:block;margin:8px auto 0;background:#f3f4f6;color:#374151;border:none;border-radius:14px;padding:13px 26px;font-weight:800;cursor:pointer;font-family:inherit;font-size:.95rem}`;

  ['ko', 'en', 'ja', 'zh', 'tw'].forEach(lang => {
    const list = CF[lang] || []; if (!list.length) return;
    const L = CL[lang]; const ST = CSIDO[lang];
    const sidoName = s => (ST && ST[s]) || s;
    const sidos = SIDO_ORDER.filter(s => list.some(c => c.sido === s));
    const opts = sidos.map(s => `<option value="${s}">${esc(sidoName(s))} (${list.filter(c => c.sido === s).length})</option>`).join('');
    const card = c => {
      const code = String(c.regnCd || '') + String(c.signguCd || '');
      const idx = NOWIDX[code], fgn = CFGN[code], kor = CKOR[code];
      const badges = [
        idx ? `<span class="cb hot">${L.hot(idx)}</span>` : '',
        fgn ? `<span class="cb fgn">${L.busy}</span>` : (kor ? `<span class="cb kr">${L.korbusy}</span>` : `<span class="cb qt">${L.quiet}</span>`)
      ].filter(Boolean).join('');
      const img = c.img ? String(c.img).replace(/^http:/, 'https:') : '/img/hero.webp';
      const q = encodeURIComponent(c.title);
      return `<a class="ccard" href="https://search.naver.com/search.naver?query=${q}" target="_blank" rel="noopener" data-sido="${esc(c.sido)}" data-kw="${esc((c.title + ' ' + (c.addr || '')).toLowerCase())}">
<div class="cthumb"><img loading="lazy" src="${esc(img)}" alt="${esc(c.title)}" onerror="this.src='/img/hero.webp'"></div>
<div class="cbody"><h3>${esc(c.title)}</h3>
<div class="cloc">📍 ${esc(sidoName(c.sido))}${c.addr ? ' · ' + esc(String(c.addr).slice(0, 38)) : ''}</div>
${badges ? `<div class="cbs">${badges}</div>` : ''}
${c.ov ? `<p class="cov">${esc(String(c.ov).slice(0, 105))}…</p>` : ''}
</div></a>`;
    };
    const SSR_N = 240;
    const IMGPFX = 'http://tong.visitkorea.or.kr/cms/resource/';
    const packed = c => [c.title, String(c.addr || '').slice(0, 38), c.sido,
      c.img ? String(c.img).replace(IMGPFX, '~') : '',
      String(c.regnCd || '') + String(c.signguCd || '')];
    const badgeSpec = code => {
      const idx = NOWIDX[code], fgn = CFGN[code], kor = CKOR[code];
      return [idx || 0, fgn ? 1 : (kor ? 2 : 0)];
    };
    const BADGE_TXT = { hot: String(L.hot('%v')), busy: L.busy, kor: L.korbusy, quiet: L.quiet };
    const CODEMAP = {};
    (CF[lang] || []).forEach(c => { const k = String(c.regnCd || '') + String(c.signguCd || ''); if (!(k in CODEMAP)) CODEMAP[k] = badgeSpec(k); });
    const content = `<main><div class="wrap">
<style>${CAFE_CSS}</style>
<h1 style="font-size:1.5rem;font-weight:900;margin:8px 0 4px">${L.h1}</h1>
<p style="color:#6b7280;font-size:.95rem;margin-bottom:6px">${L.sub(list.length)}</p>
<div class="srchbar"><div class="row">
<select id="cSido"><option value="">${esc(L.all)}</option>${opts}</select>
<input type="text" id="cKw" placeholder="${esc(L.kw)}">
<button id="cReset" type="button" style="background:#f3f4f6;color:#374151;border:none;border-radius:12px;padding:10px 18px;font-weight:700;cursor:pointer;font-family:inherit">${esc(L.reset)}</button>
</div></div>
<div class="srch-count" id="cCount">${L.cnt(list.length)}</div>
<div class="cgrid" id="cGrid">${list.slice(0, SSR_N).map(card).join('\n')}</div>
<script type="application/json" id="cRest">${JSON.stringify(list.slice(SSR_N).map(packed)).replace(/</g, '\\u003c')}</script>
<button class="cmore" id="cMore" type="button" style="display:none">＋</button>
<p class="note" id="cNone" style="display:none">${esc(L.none)}</p>
<h2 class="sec">${esc(L.hotH)}</h2>
<p><a href="${L.hotHref}" style="display:inline-block;background:#0f9d8f;color:#fff;font-weight:700;padding:11px 22px;border-radius:22px;text-decoration:none">${esc(L.hotCta)}</a></p>
<p class="note" style="margin-top:18px">${L.note}</p>
</div></main>
<script>
(function(){
  var g=document.getElementById('cGrid'); if(!g) return;
  var sel=document.getElementById('cSido'), kw=document.getElementById('cKw'), rs=document.getElementById('cReset');
  var cnt=document.getElementById('cCount'), none=document.getElementById('cNone'), more=document.getElementById('cMore');
  var cards=[].slice.call(g.querySelectorAll('.ccard'));
  try{
    var raw=document.getElementById('cRest');
    if(raw&&raw.textContent.trim()){
      var rest=JSON.parse(raw.textContent), CM=${JSON.stringify(CODEMAP)}, BT=${JSON.stringify(BADGE_TXT)};
      var frag=document.createDocumentFragment();
      rest.forEach(function(r){
        var b=CM[r[4]]||[0,0], bs='';
        if(b[0]) bs+='<span class="cb hot">'+BT.hot.replace('%v',b[0])+'</span>';
        bs+= b[1]===1?'<span class="cb fgn">'+BT.busy+'</span>':(b[1]===2?'<span class="cb kr">'+BT.kor+'</span>':'<span class="cb qt">'+BT.quiet+'</span>');
        var img=r[3]?r[3].replace('~','https://tong.visitkorea.or.kr/cms/resource/'):'/img/hero.webp';
        var a=document.createElement('a');
        a.className='ccard'; a.target='_blank'; a.rel='noopener';
        a.href='https://search.naver.com/search.naver?query='+encodeURIComponent(r[0]);
        a.setAttribute('data-sido',r[2]||'');
        a.setAttribute('data-kw',((r[0]||'')+' '+(r[1]||'')).toLowerCase());
        a.style.display='none';
        a.innerHTML='<div class="cthumb"><img loading="lazy" src="'+img+'" alt="'+String(r[0]).replace(/"/g,'&quot;')+'" onerror="this.src=\\'/img/hero.webp\\'"></div><div class="cbody"><h3>'+r[0]+'</h3><div class="cloc">📍 '+(r[2]||'')+(r[1]?' · '+r[1]:'')+'</div><div class="cbs">'+bs+'</div></div>';
        frag.appendChild(a); cards.push(a);
      });
      g.appendChild(frag);
      raw.parentNode.removeChild(raw);
    }
  }catch(e){}
  var TPL=${JSON.stringify(String(L.cnt(0)).replace('0', '%d'))};
  var STEP=60, shown=STEP, matched=cards;
  function paint(){
    cards.forEach(function(c){c.style.display='none';});
    matched.slice(0,shown).forEach(function(c){c.style.display='';});
    more.style.display=(matched.length>shown)?'':'none';
    if(more.style.display==='') more.textContent='＋ '+(matched.length-shown);
    cnt.textContent=TPL.replace('%d',matched.length); none.style.display=matched.length?'none':'';
  }
  function apply(){
    var s=sel.value, k=(kw.value||'').trim().toLowerCase();
    matched=cards.filter(function(c){
      return (!s||c.getAttribute('data-sido')===s)&&(!k||c.getAttribute('data-kw').indexOf(k)>=0);
    });
    shown=STEP; paint();
  }
  sel.addEventListener('change',apply); kw.addEventListener('input',apply);
  rs.addEventListener('click',function(){sel.value='';kw.value='';apply();});
  more.addEventListener('click',function(){shown+=STEP;paint();});
  try{
    var q=new URLSearchParams(location.search), qs=q.get('sido'), qk=q.get('kw');
    if(qs){sel.value=qs;} if(qk){kw.value=qk;}
  }catch(e){}
  apply();
})();
</script>`;
    const ld = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org', '@type': 'ItemList', name: L.h1.replace(/^\S+\s/, ''),
      numberOfItems: list.length,
      itemListElement: list.slice(0, 50).map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.title }))
    })}</script>`;
    const url = lang === 'ko' ? '/cafe/' : `/${lang}/cafe/`;
    writePage(lang === 'ko' ? 'cafe' : `${lang}/cafe`,
      layout(L.title(list.length), L.desc(list.length), url, content,
        { lang, jsonld: ld, alternates: cfAlts(), ogImage: '/img/hero.webp' }));
    CAFE_URLS.push(url);
  });

  // ---------- 🔥 /hot/ — 요즘 어디 가지 (국문 전용) ----------
  // 「부산 인기 여행지 랭킹」처럼 아무도 안 치는 제목 대신, 사람이 실제로 검색하는 문장으로 간다.
  // 성수기 배수 상위 동네를 뽑고, 그 동네의 축제·카페·계곡·단풍·걷기길을 한 장에 묶는다.
  if ((MONTH_LIST || []).length) {
    const TD = TODAY.replace(/-/g, '');
    const TD45 = new Date(Date.now() + 9 * 3600 * 1000 + 45 * 86400 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
    const cafesKo = CF.ko || [];
    const top = MONTH_LIST.slice(0, 20);

    const blocks = top.map((d, i) => {
      const code = String(d.code);
      const fests = apiFests
        // ⚠️ "요즘"인데 5개월 뒤 산천어축제가 뜨면 안 된다 → 진행중이거나 45일 이내 시작하는 것만
        .filter(f => f.sido === d.sido && f.sigungu === d.name && String(f.end || '') >= TD && String(f.start || '') <= TD45)
        .sort((a, b) => String(a.start).localeCompare(String(b.start)))
        .slice(0, 3);
      const cafes = cafesKo.filter(c => (String(c.regnCd || '') + String(c.signguCd || '')) === code).slice(0, 4);
      const valleys = apiValleys.filter(v => v.sido === d.sido && v.sigungu === d.name);
      const maples = apiMaple.filter(v => v.sido === d.sido && v.sigungu === d.name);
      const trails = apiTrails.filter(t => String(t.sigun || '').indexOf(d.name) >= 0);

      const festHtml = fests.length
        ? `<div class="hrow"><span class="hlab">🎪 축제</span><span class="hval">${fests.map(f => `${esc(f.title)} <em>(${String(f.start).replace(/^(\d{4})(\d{2})(\d{2})$/, '$2.$3')}~)</em>`).join(' · ')}</span></div>`
        : '';
      const cafeHtml = cafes.length
        ? `<div class="hrow"><span class="hlab">☕ 카페</span><span class="hval">${cafes.map(c => esc(c.title)).join(' · ')}${cafes.length >= 4 ? ' 등' : ''}</span></div>`
        : '';
      const natHtml = (valleys.length || maples.length)
        ? `<div class="hrow"><span class="hlab">🌿 자연</span><span class="hval">${[
          valleys.length ? `계곡 ${valleys.length}곳(${valleys.slice(0, 2).map(v => esc(v.title)).join(', ')})` : '',
          maples.length ? `단풍 ${maples.length}곳(${maples.slice(0, 2).map(v => esc(v.title)).join(', ')})` : ''
        ].filter(Boolean).join(' · ')}</span></div>`
        : '';
      const trailHtml = trails.length
        ? `<div class="hrow"><span class="hlab">🥾 걷기길</span><span class="hval">${trails.slice(0, 3).map(t => esc(t.name)).join(' · ')}${trails.length > 3 ? ` 외 ${trails.length - 3}코스` : ''}</span></div>`
        : '';

      const links = [
        `<a href="/search/?kw=${encodeURIComponent(d.name)}">이 동네 축제 검색 →</a>`,
        cafes.length ? `<a href="/cafe/?sido=${encodeURIComponent(d.sido)}&kw=${encodeURIComponent(d.name)}">카페 보기 →</a>` : '',
        trails.length ? `<a href="/trails/">걷기길 →</a>` : ''
      ].filter(Boolean).join('');

      return `<section class="hcard">
<div class="hhead"><span class="hrank">${i + 1}</span>
<div><h3>${esc(d.sido)} ${esc(d.name)}</h3>
<div class="hidx">🔥 평소의 <b>×${d.idx}</b>배 · ${SEASON_Y}년 ${SEASON_M}월 방문 ${Number(d.num || 0).toLocaleString('ko-KR')}명</div></div></div>
${festHtml}${cafeHtml}${natHtml}${trailHtml}
<div class="hlinks">${links}</div>
</section>`;
    }).join('\n');

    const quiet = (MONTH_LIST || []).slice(-8).reverse();
    const quietHtml = quiet.length
      ? `<h2 class="sec">🤫 반대로, ${SEASON_M}월에 덜 붐비는 편인 동네</h2>
<p>같은 표에서 아래쪽에 있는 곳들입니다. 성수기 배수가 낮다는 건 <b>이 달에 사람이 특별히 몰리지 않는다</b>는 뜻이에요. 성수기를 피하고 싶다면 여기부터 보세요.</p>
<div class="qgrid">${quiet.map(d => `<a class="qchip" href="/search/?kw=${encodeURIComponent(d.name)}">${esc(d.sido)} ${esc(d.name)} <span>×${d.idx}</span></a>`).join('')}</div>`
      : '';

    const hotContent = `<main><div class="wrap">
<style>
.hcard{background:#fff;border-radius:18px;box-shadow:0 3px 14px rgba(31,41,55,.08);padding:18px 20px;margin:14px 0}
.hhead{display:flex;gap:14px;align-items:flex-start}
.hrank{flex:none;width:34px;height:34px;border-radius:12px;background:#0f9d8f;color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;font-size:1rem}
.hhead h3{font-size:1.15rem;font-weight:900;color:#0a6c63}
.hidx{font-size:.86rem;color:#c2410c;font-weight:700;margin-top:4px}
.hrow{display:flex;gap:10px;margin-top:11px;font-size:.9rem;line-height:1.6}
.hlab{flex:none;width:70px;font-weight:800;color:#0a6c63}
.hval{color:#4b5563}
.hval em{color:#9ca3af;font-style:normal;font-size:.85em}
.hlinks{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.hlinks a{background:#f2fbfa;color:#0a6c63;font-weight:700;font-size:.85rem;padding:8px 14px;border-radius:999px;text-decoration:none}
.hlinks a:hover{background:#e2f5f2}
.qgrid{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 4px}
.qchip{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.88rem;padding:9px 15px;border-radius:999px;text-decoration:none}
.qchip span{color:#0f9d8f;font-weight:900}
</style>
<h1 style="font-size:1.5rem;font-weight:900;margin:8px 0 4px">🔥 요즘 어디 가지 — ${SEASON_M}월에 사람이 몰리는 동네</h1>
<p style="color:#6b7280;font-size:.95rem">"이번 달에 다들 어디 가지?"에 숫자로 답합니다. 광고나 인기 순위가 아니라 <b>실제 방문 데이터</b>로, 그 동네가 평소보다 몇 배 붐볐는지를 기준으로 줄을 세웠어요. 동네마다 지금 열리는 축제·카페·자연 명소·걷기길을 함께 묶었습니다.</p>
<div class="datebadge">📅 <b>${SEASON_Y}년 ${SEASON_M}월</b> 실적 기준 · 방문 데이터는 약 한 달 늦게 공개돼 <b>작년 같은 달</b>로 계절을 맞춥니다 · <a href="/trend/#howto">숫자 읽는 법 →</a></div>
${blocks}
${quietHtml}
<h2 class="sec">이 순위는 어떻게 만들었나</h2>
<p><b>성수기 배수 = ${SEASON_Y}년 ${SEASON_M}월 하루 평균 방문자 ÷ 그 해 평소 하루 평균 방문자.</b> ×1.5면 평소보다 1.5배 붐볐다는 뜻입니다. 절대 방문자 수가 아니라 '평소 대비'라서, 작은 지역도 제철이 되면 위로 올라옵니다. 방문자가 너무 적어 배수가 튀는 곳(하루 평균 5,000명 미만)은 제외했습니다.</p>
<p>왜 작년 데이터를 쓰냐면, 이 공공데이터가 <b>약 한 달 늦게</b> 공개되기 때문입니다. 지연된 최신 데이터로 "지금 ${SEASON_M}월에 어디가 붐비나"를 답하면 엉뚱한 계절의 결과가 나옵니다. 작년 같은 달을 쓰면 계절이 정확히 맞습니다.</p>
${buyBox('festival')}
<p class="note" style="margin-top:18px">데이터 출처: 한국관광공사 「한국관광 데이터랩」 지역별 방문자 수(시·군·구 단위) · 축제·카페·자연 명소는 한국관광공사 TourAPI · 걷기길은 전국길관광정보표준데이터. 축제 일정은 변경될 수 있으니 방문 전 주최 측 공지를 확인하세요.</p>
</div></main>`;

    const hotLd = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org', '@type': 'ItemList',
      name: `${SEASON_M}월에 사람이 몰리는 동네`,
      numberOfItems: top.length,
      itemListElement: top.map((d, i) => ({ '@type': 'ListItem', position: i + 1, name: `${d.sido} ${d.name}` }))
    })}</script>`;

    writePage('hot', layout(
      `요즘 어디 가지 — ${SEASON_M}월 사람 몰리는 동네 TOP${top.length} | ${SITE_NAME}`,
      `${SEASON_M}월에 실제로 사람이 몰린 동네를 관광 빅데이터 성수기 배수로 줄 세웠습니다. 동네별로 지금 열리는 축제, 카페, 계곡·단풍, 걷기길까지 한 번에. 반대로 덜 붐비는 동네도 함께 정리했어요.`,
      '/hot/', hotContent, { jsonld: hotLd, ogImage: '/img/hero.webp' }));
    HOT_URLS.push('/hot/');
  }
}

// ---------- 🧭 코스·일정 제안 /course/ ----------
// 시도별 POI 팩(JSON) → 정적 코스 12페이지 + 조건 입력형 제안기 허브
require('./course-data.js').build(ROOT);
const COURSE_URLS = require('./course.js').build({ ROOT, layout, writePage, SITE_NAME });

// ---------- ❄️ 겨울 축제 랜딩 /winter/ ----------
// 2026-08-18 전체 점검: 「겨울 축제 2026」이 GSC 2.9위인데 클릭 0 = 도착할 페이지가 없었다.
// 겸해서 «11월 이후 축제 재고 0» 구간에 계절 무관 자산(온천·오일장·걷기길)으로 가는 다리를 만든다.
const WINTER_URLS = require('./winter.js').build({ ROOT, layout, writePage, SITE_NAME, buyBox });

// ---------- 🌏 방문 차수별 추천 /{lang}/trip/ (5개 언어) ----------
// '두 번째 한국 여행 어디 가지'에 외국인 방문 순위·한국인 성수기 배수·등록 관광지 수로 답한다.
require('./trip-data.js').build(ROOT);
const TRIP_URLS = require('./trip.js').build({ ROOT, layout, writePage, SITE_NAME });

// ---------- 소개 · 문의 ----------
// ⚠️ 2026-08-18 전체 점검에서 발견: /about/ 과 /contact/ 는 2026-08-07에 손으로 만든 정적 HTML이라
//    빌드가 건드리지 않았다. 그 결과 이 두 페이지에만 **상단 네비게이션이 통째로 없고**(nav 0개),
//    헤더 검색창도 GA 이벤트 추적(track.js)도 없었다. 하필 애드센스 심사자가 반드시 보는 페이지다.
//    → 빌드가 생성하도록 옮긴다. 이제 메뉴가 늘어나면 여기도 같이 따라온다.
{
  const cnt = f => { try { const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')); return (Array.isArray(j) ? j.length : Object.keys(j).length).toLocaleString('ko-KR'); } catch (e) { return '—'; } };
  const nFest = (FESTIVAL_URLS.length || 0).toLocaleString('ko-KR');
  const aboutContent = `<main><div class="wrap"><article>
<h1>축제모아 소개</h1>
<p>전국의 축제와 오일장 일정을 한곳에 모아 무료로 제공하는 사이트입니다.</p>

<h2 class="sec">어떤 사이트인가요</h2>
<p>축제모아는 전국에서 열리는 지역 축제와 오일장(5일장) 일정을 한눈에 볼 수 있도록 모아 정리한 무료 정보 사이트입니다. 보령머드축제·화천산천어축제 같은 대형 축제부터 각 지역의 작은 오일장까지, 월별·지역별로 찾아보고 남은 날짜(D-day)와 가는 법, 준비물까지 확인할 수 있습니다. 한국어 외에 영어·일본어·중국어·스페인어로도 제공해, 한국을 찾는 외국인 여행자도 이용할 수 있습니다.</p>

<h2 class="sec">숫자로 보는 축제모아</h2>
<ul style="line-height:2">
<li>개별 축제 상세 페이지 <b>${nFest}개</b> — 축제마다 가는 법·근처 먹을 곳·붐빔 정도를 따로 계산합니다.</li>
<li>전국 걷기길 <b>${cnt('trails.json')}개</b> 코스 — 해파랑길·남파랑길·서해랑길·제주올레·갈맷길 등.</li>
<li>오일장 <b>${marketsDay.length}곳</b>의 장날 — 4·9일장처럼 날짜 규칙까지 정리했습니다(장날을 확인 못 한 ${marketsNoDay.length}곳은 따로 표시).</li>
<li>축제장까지 대중교통 <b>${cnt('transit_access.json')}건 실측</b> — 직선거리 추정이 아니라 실제 경로로 재본 값입니다.</li>
<li>음식점 <b>${cnt('restaurants_ko.json')}곳</b> · 카페 <b>${cnt('cafes_ko.json')}곳</b> · 숙소 <b>${cnt('stays_ko.json')}곳</b> — 코스를 짤 때 씁니다.</li>
<li>직접 취재·정리한 가이드 글 <b>${posts.length}편</b>.</li>
</ul>

<h2 class="sec">우리가 계산한 것과, 공공데이터 그대로인 것</h2>
<p>정보의 출처를 섞지 않으려고 합니다.</p>
<ul style="line-height:2">
<li><b>공공데이터 그대로</b> — 축제 개요 설명, 주소·좌표·문의처, 걷기길 거리와 난이도는 한국관광공사 TourAPI와 전국길관광정보 표준데이터의 내용입니다. 우리가 다시 쓰지 않고 출처를 밝혀 그대로 싣습니다.</li>
<li><b>우리가 계산한 것</b> — 「이달 이 동네가 평소의 몇 배로 붐비는가」(관광 빅데이터 방문자 수 기준), 축제장까지 걸리는 실제 대중교통 시간, 동선 순서와 하루 일정, 여행 비용 비교, 축제별 준비물 매칭은 우리가 직접 계산해 만든 것입니다.</li>
<li><b>우리가 쓴 것</b> — 가이드 글 ${posts.length}편과 각 페이지의 설명 문장.</li>
</ul>

<h2 class="sec">왜 만들었나요</h2>
<p>축제와 오일장 정보는 여러 기관·지자체 사이트에 흩어져 있어 한 번에 보기 어렵습니다. "이번 주말 근처에 갈 만한 축제가 있을까?", "우리 동네 장날이 언제지?" 같은 궁금증을 한 곳에서 빠르게 해결할 수 있도록 만들었습니다.</p>

<h2 class="sec">정보 출처와 갱신</h2>
<p>축제·오일장 정보는 공공데이터와 각 주최 측·지자체 공개 자료를 참고해 정리하며, 새로운 일정과 변경 사항을 반영해 지속적으로 업데이트합니다. 다만 <b>축제 일정은 기상·주최 측 사정에 따라 변경되거나 취소될 수 있습니다.</b> 방문 전에는 반드시 해당 축제의 공식 홈페이지나 주최 기관을 통해 최종 일정을 확인해 주세요.</p>

<h2 class="sec">우리가 못 하는 것</h2>
<p>쓸모 있으려면 못 하는 것부터 밝히는 게 맞다고 봅니다.</p>
<ul style="line-height:2">
<li>이동 시간은 별도 조회 전에는 <b>직선거리 기반 추정치</b>입니다. 실제 도로 경로가 아닙니다.</li>
<li>영업시간·휴무일은 <b>공공데이터에 등록된 곳만</b> 표시합니다. 없는 곳이 더 많습니다.</li>
<li>숙소는 위치와 유형만 보여주고 <b>가격·빈방·예약은 다루지 않습니다.</b></li>
<li>붐빔 배수는 그 장소가 아니라 <b>그 시·군·구</b>의 방문자 수 기준입니다.</li>
</ul>

<h2 class="sec">이용 안내</h2>
<p>모든 정보는 무료이며 회원가입이 필요 없습니다. 사이트 운영은 광고와 상품 판매 수익으로 이루어집니다. 일부 상품 링크는 쿠팡 파트너스 활동의 일환으로 수수료를 제공받으며, 해당 위치에 그 사실을 표시합니다. 축제모아를 운영하는 쿠웅샵에서 직접 판매하는 상품도 같은 방식으로 구분해 표시합니다.</p>
<p>일정 오류나 누락을 발견하시면 <a href="/contact/">문의 페이지</a>로 알려주세요. 확인 후 신속히 반영하겠습니다. 편집·검수 기준은 <a href="/editorial/">편집 원칙</a>에, 개인정보 처리에 관한 사항은 <a href="/privacy/">개인정보처리방침</a>에서 확인하실 수 있습니다.</p>
</article></div></main>`;
  writePage('about', layout(
    `소개 — 축제모아는 어떤 사이트인가요 | ${SITE_NAME}`,
    `축제모아는 전국 축제 ${nFest}곳과 오일장·걷기길 일정을 모아 무료로 제공합니다. 공공데이터를 그대로 싣는 부분과 우리가 직접 계산한 부분(붐빔 배수·대중교통 실측·동선)을 구분해 밝힙니다.`,
    '/about/', aboutContent));

  const contactContent = `<main><div class="wrap"><article>
<h1>문의하기</h1>
<p>일정 제보나 제안이 있으면 편하게 연락해 주세요.</p>

<h2 class="sec">이메일</h2>
<p>모든 문의는 아래 이메일로 받습니다. 보통 <b>2~3일 이내</b>에 답변드립니다.</p>
<p style="font-size:1.1rem;font-weight:800"><a href="mailto:goohw593@gmail.com">goohw593@gmail.com</a></p>

<h2 class="sec">이런 문의를 받아요</h2>
<ul style="line-height:2">
<li><b>일정 오류·변경 제보</b> — 날짜나 장소가 실제와 다르거나 취소된 축제를 발견하셨다면 알려주세요. 어느 페이지인지 주소를 함께 주시면 가장 빠릅니다.</li>
<li><b>축제·오일장 추가 요청</b> — 목록에 없는 축제나 장터를 제보해 주시면 확인 후 추가합니다. 공공데이터에 등록되지 않은 행사도 근거가 있으면 싣습니다.</li>
<li><b>제휴·광고 문의</b> — 지자체·주최 측 협업이나 광고 관련 문의를 받습니다.</li>
<li><b>정보 정정 요청</b> — 잘못된 정보를 발견하셨다면 근거와 함께 알려주세요.</li>
<li><b>사진·저작권 관련</b> — 게재된 이미지에 권리 문제가 있다면 알려주시는 대로 내리고 확인하겠습니다.</li>
</ul>

<h2 class="sec">제보가 반영되는 방식</h2>
<p>받은 내용은 공공데이터·주최 측 공지와 대조한 뒤 반영합니다. 확인이 안 되는 내용은 <b>추측해서 싣지 않고</b> 「확인하지 못했습니다」로 남겨 둡니다. 반영되면 해당 페이지의 수정일이 함께 갱신됩니다.</p>

<h2 class="sec">운영</h2>
<p>축제모아는 쿠웅샵이 운영합니다. 사이트 운영은 광고와 상품 판매 수익으로 이루어지며, 제휴 링크가 있는 자리에는 그 사실을 표시합니다. 자세한 내용은 <a href="/about/">소개</a>와 <a href="/editorial/">편집 원칙</a>을 참고해 주세요.</p>

<h2 class="sec">안내</h2>
<p>축제 일정은 기상·주최 측 사정에 따라 변경될 수 있어, 방문 전 공식 홈페이지 확인을 권합니다. 개인정보 처리에 관한 사항은 <a href="/privacy/">개인정보처리방침</a>을 참고하시기 바랍니다.</p>
</article></div></main>`;
  writePage('contact', layout(
    `문의 — 일정 오류 제보·제휴 | ${SITE_NAME}`,
    `축제 일정 오류 제보, 목록에 없는 축제·오일장 추가 요청, 제휴·광고 문의를 받습니다. 받은 제보는 공공데이터·주최 측 공지와 대조한 뒤 반영합니다.`,
    '/contact/', contactContent));
}

// ---------- 404 ----------
// ⚠️ 2026-08-18 전체 점검: 없는 주소를 밟으면 흰 화면에 text/plain 404가 떴다.
//    사이트 안으로 되돌릴 동선이 0이었다. Vercel 정적 호스팅은 루트 404.html을 자동으로 쓴다.
{
  const notFound = `<main><div class="wrap" style="text-align:center;padding:40px 0 20px">
<div style="font-size:3rem">🎪</div>
<h1 style="font-size:1.5rem;font-weight:900;margin:10px 0 6px">찾으시는 페이지가 없습니다</h1>
<p style="color:#6b7280;line-height:1.8">주소가 바뀌었거나, 끝난 축제라 정리된 페이지일 수 있습니다.<br>아래에서 다시 찾아보세요.</p>
<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:22px 0">
<a href="/" style="background:#0f9d8f;color:#fff;font-weight:800;padding:11px 20px;border-radius:999px;font-size:.95rem">🏠 홈으로</a>
<a href="/search/" style="background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;padding:11px 20px;border-radius:999px;font-size:.95rem">🔎 축제 검색</a>
<a href="/${CUR_MONTH_KEY}/" style="background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;padding:11px 20px;border-radius:999px;font-size:.95rem">📅 이달의 축제</a>
<a href="/festival/" style="background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;padding:11px 20px;border-radius:999px;font-size:.95rem">📄 축제 상세</a>
<a href="/jangteo/" style="background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;padding:11px 20px;border-radius:999px;font-size:.95rem">🏮 전국 오일장</a>
<a href="/trails/" style="background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;padding:11px 20px;border-radius:999px;font-size:.95rem">🥾 걷기 여행</a>
<a href="/course/" style="background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;padding:11px 20px;border-radius:999px;font-size:.95rem">🧭 코스 짜기</a>
</div>
<p style="color:#9ca3af;font-size:.9rem">축제 이름을 아신다면 위쪽 검색창에 바로 넣어 보세요. 끝난 축제도 검색됩니다.</p>
</div></main>`;
  fs.writeFileSync(path.join(ROOT, '404.html'),
    layout(`페이지를 찾을 수 없습니다 | ${SITE_NAME}`, '찾으시는 페이지가 없습니다. 축제 검색·월별 일정·오일장·걷기길에서 다시 찾아보세요.', '/404', notFound, { noindex: true }));
  console.log('✓ 404.html');
}

// ---------- sitemap / robots ----------
const urls = ['/', ...MONTHS.map(m => `/${m.key}/`), '/search/', ...(holidays.length ? ['/holiday/'] : []), '/pet/', ...(apiAccessible.length ? ['/accessible/'] : []), ...(apiTrails.length ? ['/trails/'] : []), ...(apiValleys.length ? ['/valley/'] : []), ...(apiMaple.length ? ['/maple/'] : []), ...(apiFlower.length ? ['/flower/'] : []), ...(apiOnsen.length ? ['/onsen/'] : []), '/jangteo/', '/test/', '/trip-cost/', ...(visitors.kor && visitors.kor.length ? ['/trend/'] : []), ...SIDO_URLS, ...THEME_URLS, ...TRAIL_URLS, ...WALK_URLS, ...TREND_LANG_URLS, '/blog/', ...posts.map(p => `/blog/${p.slug}/`), '/about/', EDITORIAL_URL, '/contact/', '/privacy/',...(apiFestsEn.length ? ['/en/', '/en/search/'] : []), ...(apiFestsJa.length ? ['/ja/', '/ja/search/'] : []), ...(apiFestsEs.length ? ['/es/', '/es/search/'] : []), ...(apiFestsZh.length ? ['/zh/', '/zh/search/'] : []), ...(apiFestsTw.length ? ['/tw/', '/tw/search/'] : []), ...TW_EXTRA_URLS, ...MOUNTAIN_URLS, ...CAFE_URLS, ...HOT_URLS, ...COURSE_URLS, ...WINTER_URLS, ...JANGTEO_SIDO_URLS, ...TRIP_URLS, ...FESTIVAL_URLS, ...MAP_URLS, ...INTL_URLS];
// noindex 페이지는 사이트맵에서 뺀다 — "색인해라(사이트맵) + 하지마라(noindex)"는 모순 신호다.
// 2026-08-18: en/ja/zh는 layout()에서 전량 forceNoindex 처리했다 — 사이트맵에서도 같이 뺀다.
const LANG_NOINDEX_URLS = urls.filter(u => /^\/(en|ja|zh)\//.test(u));
const NOINDEX_URLS = new Set([...SIDO_URLS, ...THEME_URLS, ...LANG_NOINDEX_URLS]);
// 끝난 축제(2026-08-18): 색인·사이트맵에서만 뺀다. 헤더검색에는 남긴다 —
// 축제 이름을 아는 사람이 검색했는데 "없다"고 답하면 그건 우리 쪽 손실이다.
const ENDED_FEST_URLS = new Set(FESTIVAL_URLS.noindex || []);
const sitemapUrls = urls.filter(u => !NOINDEX_URLS.has(u) && !ENDED_FEST_URLS.has(u));

// ---------- 헤더 검색 인덱스 /hsearch.json ----------
// 로고와 메뉴 사이가 비어 있어서 검색창을 넣었다(2026-08-10).
// ⚠️ 축제 이름을 아는 사람이 가장 많은데, 그동안 검색은 메뉴 안에 숨어 있었다.
// 인덱스는 **빌드가 끝난 뒤 실제 생성된 HTML의 <title>** 에서 뽑는다 — 목록을 따로 관리하면 반드시 어긋난다.
{
  const KIND = u =>
    u.startsWith('/festival/') && u !== '/festival/' ? '축제' :
    u.startsWith('/course/') && u !== '/course/' ? '코스' :
    u.startsWith('/trails/') && u !== '/trails/' ? '걷기길' :
    u.startsWith('/blog/') && u !== '/blog/' ? '가이드' :
    /^\/(en|ja|es|zh|tw)\//.test(u) ? '' : '페이지';
  const idx = [];
  urls.forEach(u => {
    if (!KIND(u)) return;
    if (NOINDEX_URLS.has(u)) return;
    const f = path.join(ROOT, u === '/' ? 'index.html' : u.replace(/^\/|\/$/g, '') + '/index.html');
    let t = '';
    try { t = (fs.readFileSync(f, 'utf8').match(/<title>([^<]*)<\/title>/) || [])[1] || ''; } catch (e) { return; }
    // "안동국제탈춤페스티벌 — 9월 24일 일정… | 축제모아" → 앞부분만
    t = t.split('|')[0].split(' — ')[0].split(' - ')[0].trim();
    if (!t) return;
    idx.push([t, u, KIND(u)]);
  });
  fs.writeFileSync(path.join(ROOT, 'hsearch.json'), JSON.stringify(idx));
  console.log('✓ hsearch.json —', idx.length, '건 (헤더 검색)');
}


// ---------- lastmod: 진짜 바뀐 날짜만 ----------
// 매 빌드마다 109개 전부 오늘 날짜로 찍으면 크롤러가 "이 사이트는 매일 전체가 바뀐다"고 학습하고
// 결국 lastmod를 무시한다. 페이지 내용 해시를 저장해 두고, 내용이 그대로면 이전 날짜를 유지한다.
// (날짜·시간이 박히는 부분은 해시 전에 지운다 — 안 그러면 매일 전부 '변경됨'이 된다)
const LM_PATH = path.join(ROOT, 'data', 'lastmod.json');
let LM = {};
try { LM = JSON.parse(fs.readFileSync(LM_PATH, 'utf8')); } catch (e) { LM = {}; }
const crypto = require('crypto');
function pageHash(u) {
  const f = path.join(ROOT, u === '/' ? 'index.html' : u.replace(/^\/|\/$/g, '') + '/index.html');
  let h;
  try { h = fs.readFileSync(f, 'utf8'); } catch (e) { return null; }
  h = h.replace(new RegExp(TODAY, 'g'), '')          // 최종 갱신 표기
    .replace(/D-\d+|진행중|종료/g, '')                // D-day 배지
    .replace(/<lastmod>.*?<\/lastmod>/g, '');
  return crypto.createHash('sha1').update(h).digest('hex');
}
const LM_NEW = {};
function lastmodOf(u) {
  const h = pageHash(u);
  if (!h) return TODAY;
  const prev = LM[u];
  const date = (prev && prev.h === h) ? prev.d : TODAY;
  LM_NEW[u] = { h, d: date };
  return date;
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `<url><loc>${SITE}${u}</loc><lastmod>${lastmodOf(u)}</lastmod></url>`).join('\n')}
</urlset>`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
fs.writeFileSync(LM_PATH, JSON.stringify(LM_NEW, null, 0));

// ---------- 섹션별 사이트맵 + 사이트맵 인덱스 ----------
// 왜 쪼개나: 2026-08-08 서치콘솔 확인 결과 구글이 sitemap.xml을 **7/16에 마지막으로 읽고 29개**만
// 알고 있었다. 그 뒤에 만든 걷기길 39페이지 등이 통째로 미발견 상태였다.
// ① 새 URL(sitemap-index.xml)을 제출하면 같은 URL 재제출보다 확실하게 다시 읽는다.
// ② 섹션별로 나눠 두면 서치콘솔에서 "어느 묶음이 발견/색인이 안 되는지"를 따로 볼 수 있다.
const SEC = {
  // 축제 개별 페이지는 따로 낸다 — 신설 묶음이라 서치콘솔에서 발견·색인을 별도로 봐야 판단이 된다
  'sitemap-festival.xml': sitemapUrls.filter(u => /^\/festival\//.test(u)),
  'sitemap-course.xml': sitemapUrls.filter(u => /^\/course\//.test(u)),
  'sitemap-trails.xml': sitemapUrls.filter(u => /^\/trails\//.test(u)),
  'sitemap-blog.xml': sitemapUrls.filter(u => /^\/blog\//.test(u)),
  'sitemap-lang.xml': sitemapUrls.filter(u => /^\/(en|ja|es|zh|tw)\//.test(u))
};
SEC['sitemap-core.xml'] = sitemapUrls.filter(u =>
  !SEC['sitemap-festival.xml'].includes(u) && !SEC['sitemap-course.xml'].includes(u) &&
  !SEC['sitemap-trails.xml'].includes(u) && !SEC['sitemap-blog.xml'].includes(u) && !SEC['sitemap-lang.xml'].includes(u));
Object.entries(SEC).forEach(([file, list]) => {
  fs.writeFileSync(path.join(ROOT, file), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${list.map(u => `<url><loc>${SITE}${u}</loc><lastmod>${(LM_NEW[u] || {}).d || TODAY}</lastmod></url>`).join('\n')}
</urlset>`);
});
fs.writeFileSync(path.join(ROOT, 'sitemap-index.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(SEC).map(f => `<sitemap><loc>${SITE}/${f}</loc><lastmod>${TODAY}</lastmod></sitemap>`).join('\n')}
</sitemapindex>`);
console.log('✓ 섹션 사이트맵 —', Object.entries(SEC).map(([f, l]) => f.replace('sitemap-', '').replace('.xml', '') + ':' + l.length).join(' · '));
{
  const kept = Object.keys(LM_NEW).filter(u => LM_NEW[u].d !== TODAY).length;
  console.log('✓ sitemap —', sitemapUrls.length, '개(noindex', NOINDEX_URLS.size, '개 제외) · 내용 그대로라 이전 날짜 유지', kept, '개 / 갱신', sitemapUrls.length - kept, '개');
}

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

// ⚠️ /api/ 는 반드시 막는다. 2026-08-09 서치콘솔에 "다른 4xx 문제로 차단됨"이 뜬 원인이
//    /api/tripcost 였다 — 페이지 JS가 부르는 주소를 구글이 따라가 GET으로 크롤링했고 400을 받았다.
//    API는 색인 대상이 아니므로 크롤 자체를 막는 게 맞다(그래야 4xx 오류가 아니라 '의도된 차단'이 된다).
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *
Allow: /
Disallow: /api/
Sitemap: ${SITE}/sitemap-index.xml
Sitemap: ${SITE}/sitemap.xml
`);
fs.writeFileSync(path.join(ROOT, 'ads.txt'), `google.com, pub-3293445488923111, DIRECT, f08c47fec0942fa0\n`);
console.log('✓ sitemap.xml, robots.txt, ads.txt');
require('./geo.js').audit(ROOT);
console.log('빌드 완료:', urls.length, '페이지');
