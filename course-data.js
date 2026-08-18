// 코스·일정 제안용 시도별 데이터 묶음 생성 → /course/d/{slug}.json
// ⚠️ 왜 시도별로 쪼개나: 전국 POI가 약 1만 6천 건이라 한 파일로 내리면 모바일에서 못 쓴다.
//    사용자는 어차피 "어디로 갈지"를 먼저 고르므로 시도 단위 분할이 자연스럽다.
// ⚠️ 압축 규칙: 카테고리별 [값,값,...] 배열 + 필드 순서 고정(keys). 이미지 URL은 공통 접두어를 떼고 저장한다.
//    (카페 목록에서 1.2MB → 334KB 만든 것과 같은 패턴)
const fs = require('fs'), path = require('path');

const SIDO_SLUG = {
  '서울': 'seoul', '경기': 'gyeonggi', '인천': 'incheon', '강원': 'gangwon', '충북': 'chungbuk',
  '충남': 'chungnam', '대전': 'daejeon', '세종': 'sejong', '전북': 'jeonbuk', '전남': 'jeonnam',
  '광주': 'gwangju', '경북': 'gyeongbuk', '경남': 'gyeongnam', '대구': 'daegu', '울산': 'ulsan',
  '부산': 'busan', '제주': 'jeju'
};

// 이미지 접두어 — 저장할 땐 떼고, 클라이언트에서 다시 붙인다
const IMG_PRE = ['http://tong.visitkorea.or.kr/cms/resource/', 'https://tong.visitkorea.or.kr/cms/resource/'];
function shortImg(u) {
  if (!u) return '';
  for (let i = 0; i < IMG_PRE.length; i++) if (u.startsWith(IMG_PRE[i])) return i + '|' + u.slice(IMG_PRE[i].length);
  return 'x|' + u;
}

// 카테고리별 기본 체류시간(분) — 걷기길만 실제 소요분을 쓴다
const STAY_MIN = { fes: 120, food: 70, cafe: 60, nat: 100, acc: 80, pet: 80, mkt: 70 };

// ⚠️ 음식점·카페·숙박에는 sigungu 필드가 없고 명산도 비어 있는 경우가 많다.
// 시군구가 없으면 붐빔 배수를 못 붙인다 = 우리 차별점이 통째로 사라진다. 주소 2번째 토큰으로 보완한다.
function sgOf(addr, given) {
  if (given) return given;
  const t = String(addr || '').split(' ');
  if (t.length > 1 && /(시|군|구)$/.test(t[1])) return t[1];
  return '';
}
const num = v => { const n = Number(v); return isFinite(n) ? +n.toFixed(5) : 0; };
const ok = o => o && num(o.x) && num(o.y);

// 카테고리별 필드 순서 (클라이언트와 반드시 일치)
const KEYS = {
  fes: ['t', 'x', 'y', 'g', 'sg', 's', 'e', 'pet', 'ov'],
  food: ['t', 'x', 'y', 'g', 'sg', 'kind', 'open', 'rest', 'menu'],
  cafe: ['t', 'x', 'y', 'g', 'sg', 'open', 'rest'],
  stay: ['t', 'x', 'y', 'g', 'sg', 'kind', 'ci', 'co'],
  nat: ['t', 'x', 'y', 'g', 'sg', 'sub', 'ov'],
  walk: ['t', 'x', 'y', 'sg', 'km', 'min', 'lv', 'theme', 'ov'],
  // ⚠️ 'cat' 은 절대 쓰지 말 것 — 엔진 expand()가 카테고리를 o.cat 에 담으므로 덮어써진다.
  //    (2026-08-18: 무장애·반려가 이것 때문에 라벨 undefined + 선호 가산점 미적용이었다)
  acc: ['t', 'x', 'y', 'g', 'sg', 'sub', 'af'],
  pet: ['t', 'x', 'y', 'g', 'sg', 'sub', 'psbl']
};
const row = (keys, o) => keys.map(k => o[k] === undefined || o[k] === null ? '' : o[k]);

// 사진·설명이 있는 것을 앞으로 — 상한을 걸 때 품질 좋은 것만 남긴다
const rank = (a, b) => (b.g ? 2 : 0) + (b.ov ? 1 : 0) - ((a.g ? 2 : 0) + (a.ov ? 1 : 0));

function load(f) { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { return []; } }

function build(ROOT) {
  const D = {
    fes: load('festivals_api.json'), food: load('restaurants_ko.json'), cafe: load('cafes_ko.json'),
    stay: load('stays_ko.json'), mt: load('mountains_ko.json'), vly: load('valleys.json'),
    mpl: load('maple.json'), flw: load('flower.json'), ons: load('onsen.json'),
    stret: load('stret.json'), trails: load('trails.json'),
    acc: load('accessible.json'), pet: load('pets.json'), mkt: load('markets.json')
  };
  let visitors = {}; try { visitors = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'visitors.json'), 'utf8')); } catch (e) { }

  // 시군구 이름 → 성수기 배수 (월별). 붐빔 회피 축의 근거.
  const BUSY = {};
  const months = (visitors.seasonByMonth && visitors.seasonByMonth.months) || {};
  Object.keys(months).forEach(m => {
    (months[m] || []).forEach(r => { BUSY[`${r.sido}|${r.name}`] = BUSY[`${r.sido}|${r.name}`] || {}; BUSY[`${r.sido}|${r.name}`][m] = r.idx; });
  });
  // 외국인 많이 찾는 지역 순위 (한적함 선호 시 감점)
  const FGN = {}; (visitors.fgn || []).forEach(r => { FGN[`${r.sido}|${r.name}`] = r.rank; });

  const bucket = {};
  Object.keys(SIDO_SLUG).forEach(s => { bucket[s] = { fes: [], food: [], cafe: [], stay: [], nat: [], walk: [], acc: [], pet: [], mkt: [] }; });
  const put = (sido, cat, o) => { if (bucket[sido]) bucket[sido][cat].push(o); };

  // ── 축제
  D.fes.forEach(f => { if (!ok(f)) return; put(f.sido, 'fes', { t: f.title, x: num(f.x), y: num(f.y), g: shortImg(f.img), sg: sgOf(f.addr, f.sigungu), s: f.start || '', e: f.end || '', pet: f.pet ? 1 : '', ov: (f.ov || '').slice(0, 110) }); });
  // ── 음식점 / 카페 / 숙박
  D.food.forEach(f => { if (!ok(f)) return; put(f.sido, 'food', { t: f.title, x: num(f.x), y: num(f.y), g: shortImg(f.img), sg: sgOf(f.addr), kind: f.kind || '', open: f.open || '', rest: f.rest || '', menu: f.menu || '', ov: f.menu || '' }); });
  D.cafe.forEach(f => { if (!ok(f)) return; put(f.sido, 'cafe', { t: f.title, x: num(f.x), y: num(f.y), g: shortImg(f.img), sg: sgOf(f.addr), open: f.open || '', rest: f.rest || '', ov: f.ov || '' }); });
  D.stay.forEach(f => { if (!ok(f)) return; put(f.sido, 'stay', { t: f.title, x: num(f.x), y: num(f.y), g: shortImg(f.img), sg: sgOf(f.addr), kind: f.kind || '', ci: f.ci || '', co: f.co || '', ov: '' }); });
  // ── 자연 (명산·계곡·단풍·봄꽃·온천을 한 통에 넣고 sub로 구분)
  const NAT = [[D.mt, '명산'], [D.vly, '계곡'], [D.mpl, '단풍'], [D.flw, '봄꽃'], [D.ons, '온천']];
  NAT.forEach(([arr, sub]) => arr.forEach(f => { if (!ok(f)) return; put(f.sido, 'nat', { t: f.title, x: num(f.x), y: num(f.y), g: shortImg(f.img), sg: sgOf(f.addr, f.sigungu), sub, ov: (f.ov || '').slice(0, 110) }); }));
  // ── 걷기길 (좌표는 fetch-geocode.js 가 붙여 둔 것)
  D.stret.forEach(w => { if (!ok(w)) return; put(w.sido, 'walk', { t: w.name, x: num(w.x), y: num(w.y), sg: sgOf(w.addr, w.sigungu), km: w.km || '', min: w.min || '', lv: '', theme: '', ov: (w.intro || '').slice(0, 110) }); });
  D.trails.forEach(w => { if (!ok(w)) return; put(w.sido, 'walk', { t: w.name, x: num(w.x), y: num(w.y), sg: String(w.sigun || '').split(' ').pop(), km: w.dist || '', min: w.min || '', lv: w.level || '', theme: w.theme || '', ov: (w.summary || '').replace(/^- /, '').slice(0, 110) }); });
  // ── 무장애 / 반려
  D.acc.forEach(f => { if (!ok(f)) return; put(f.sido, 'acc', { t: f.title, x: num(f.x), y: num(f.y), g: shortImg(f.img), sg: sgOf(f.addr, f.sigungu), sub: f.cat || '', af: (f.acc || []).join('·'), ov: '' }); });
  D.pet.forEach(f => { if (!ok(f)) return; put(f.sido, 'pet', { t: f.title, x: num(f.x), y: num(f.y), g: shortImg(f.img), sg: sgOf(f.addr, f.sigungu), sub: f.cat || '', psbl: f.psbl || '', ov: '' }); });
  // ── 오일장 (좌표 없음 — 시군구만 있으므로 별도 배열로 이름만 싣는다)
  D.mkt.forEach(m => { const s = m.region; if (bucket[s]) bucket[s].mkt.push({ t: m.name, sg: m.city || '', d: m.daysNum || [], desc: m.desc || '', f: m.famous || '' }); });

  // 상한 — 페이로드 통제. 사진·설명 있는 것부터 남긴다.
  const CAP = { fes: 400, food: 260, cafe: 160, stay: 130, nat: 400, walk: 400, acc: 130, pet: 90 };

  const outDir = path.join(ROOT, 'course', 'd');
  fs.mkdirSync(outDir, { recursive: true });
  const index = [];
  Object.keys(SIDO_SLUG).forEach(sido => {
    const b = bucket[sido];
    const pack = { sido, keys: KEYS, busy: {}, fgn: {}, c: {} };
    let n = 0;
    Object.keys(KEYS).forEach(cat => {
      const list = (b[cat] || []).slice().sort(rank).slice(0, CAP[cat] || 200);
      pack.c[cat] = list.map(o => row(KEYS[cat], o));
      n += list.length;
    });
    pack.mkt = b.mkt;
    // 이 시도에 속한 시군구의 붐빔·외국인 지표만 담는다
    Object.keys(BUSY).forEach(k => { if (k.startsWith(sido + '|')) pack.busy[k.split('|')[1]] = BUSY[k]; });
    Object.keys(FGN).forEach(k => { if (k.startsWith(sido + '|')) pack.fgn[k.split('|')[1]] = FGN[k]; });

    const f = path.join(outDir, SIDO_SLUG[sido] + '.json');
    fs.writeFileSync(f, JSON.stringify(pack));
    index.push({ sido, slug: SIDO_SLUG[sido], n, kb: Math.round(fs.statSync(f).size / 1024) });
  });
  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index));
  const tot = index.reduce((a, b) => a + b.n, 0), mx = index.reduce((a, b) => Math.max(a, b.kb), 0);
  console.log(`✓ course/d/*.json — 17개 시도 · POI ${tot}건 · 최대 ${mx}KB`);
  return { index, SIDO_SLUG, STAY_MIN };
}

module.exports = { build, SIDO_SLUG, STAY_MIN, KEYS };
