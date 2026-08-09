// 방문 차수별 추천 데이터 — /trip/d/{lang}.json
//
// ── 왜 이 구조인가 ────────────────────────────────────────────────
// "한국 두 번째/세 번째 방문인데 어디 가지"는 외국인이 실제로 치는 문장인데
// 답이 전부 블로그 주관이다. 우리는 숫자로 답할 수 있다.
//   · visitors.fgn (40개 시군구) = 외국인이 이미 많이 가는 곳
//   · visitors.seasonByMonth (188개 시군구) = 성수기 배수 + 방문 규모
// 핵심 논리: **한국인은 많이 가는데 외국인 순위엔 없는 곳** = 2·3회차의 정답.
//
// ⚠️ fgn·kor은 '절대 방문자수'라 강남·수원처럼 인구 많은 곳이 위로 온다(관광 신호가 아니다).
//    그래서 ① 광역시의 '구'는 1회차 전용으로 묶고 ② 관광 자산 수(걷기길·자연·오일장)로 한 번 더 거른다.
//    이 두 개를 안 걸면 2회차가 서울 서대문구·영등포구로 채워진다(실측으로 확인함).
//
// ── 이름 표기 원칙 ────────────────────────────────────────────────
// 공식 다국어명이 있으면 그걸 쓰고, 없으면 placename.js 로 "Dokdo Museum (독도박물관)" 처럼 병기한다.
// 한글 병기는 타협이 아니라 기능이다 — 택시 기사·매표소에 화면을 보여줄 수 있다.
const fs = require('fs'), path = require('path');
const { romanizeRegion } = require('./romanize.js');
const { placeName } = require('./placename.js');

const LANGS = ['en', 'ja', 'zh', 'tw', 'es'];
const METRO = ['서울', '부산', '대구', '인천', '광주', '대전', '울산'];   // 이 시도의 '구'는 1회차 전용

const SIDO_L = {
  en: { '서울': 'Seoul', '부산': 'Busan', '대구': 'Daegu', '인천': 'Incheon', '광주': 'Gwangju', '대전': 'Daejeon', '울산': 'Ulsan', '세종': 'Sejong', '경기': 'Gyeonggi', '충북': 'Chungbuk', '충남': 'Chungnam', '전남': 'Jeonnam', '경북': 'Gyeongbuk', '경남': 'Gyeongnam', '제주': 'Jeju', '강원': 'Gangwon', '전북': 'Jeonbuk' },
  ja: { '서울': 'ソウル', '부산': '釜山', '대구': '大邱', '인천': '仁川', '광주': '光州', '대전': '大田', '울산': '蔚山', '세종': '世宗', '경기': '京畿', '충북': '忠北', '충남': '忠南', '전남': '全南', '경북': '慶北', '경남': '慶南', '제주': '済州', '강원': '江原', '전북': '全北' },
  zh: { '서울': '首尔', '부산': '釜山', '대구': '大邱', '인천': '仁川', '광주': '光州', '대전': '大田', '울산': '蔚山', '세종': '世宗', '경기': '京畿', '충북': '忠北', '충남': '忠南', '전남': '全南', '경북': '庆北', '경남': '庆南', '제주': '济州', '강원': '江原', '전북': '全北' },
  tw: { '서울': '首爾', '부산': '釜山', '대구': '大邱', '인천': '仁川', '광주': '光州', '대전': '大田', '울산': '蔚山', '세종': '世宗', '경기': '京畿', '충북': '忠北', '충남': '忠南', '전남': '全南', '경북': '慶北', '경남': '慶南', '제주': '濟州', '강원': '江原', '전북': '全北' },
  es: { '서울': 'Seúl', '부산': 'Busan', '대구': 'Daegu', '인천': 'Incheon', '광주': 'Gwangju', '대전': 'Daejeon', '울산': 'Ulsan', '세종': 'Sejong', '경기': 'Gyeonggi', '충북': 'Chungbuk', '충남': 'Chungnam', '전남': 'Jeonnam', '경북': 'Gyeongbuk', '경남': 'Gyeongnam', '제주': 'Jeju', '강원': 'Gangwon', '전북': 'Jeonbuk' }
};

function load(f) { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { return []; } }
const num = v => { const n = Number(v); return isFinite(n) ? +n.toFixed(5) : 0; };
const ok = o => o && num(o.x) && num(o.y);
function sgOf(addr, given) {
  if (given) return given;
  const t = String(addr || '').split(' ');
  if (t.length > 1 && /(시|군|구)$/.test(t[1])) return t[1];
  return '';
}
const IMG_PRE = ['http://tong.visitkorea.or.kr/cms/resource/', 'https://tong.visitkorea.or.kr/cms/resource/'];
function shortImg(u) {
  if (!u) return '';
  for (let i = 0; i < IMG_PRE.length; i++) if (u.startsWith(IMG_PRE[i])) return i + '|' + u.slice(IMG_PRE[i].length);
  return 'x|' + u;
}

function build(ROOT) {
  const visitors = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'visitors.json'), 'utf8')); } catch (e) { return {}; } })();
  const months = (visitors.seasonByMonth && visitors.seasonByMonth.months) || {};
  const REP = [1, 4, 8, 10];
  const nowM = new Date(Date.now() + 9 * 3600e3).getUTCMonth() + 1;   // ⚠️ KST
  const MM = REP.reduce((a, b) => (Math.abs(b - nowM) < Math.abs(a - nowM) ? b : a), REP[0]);

  const G = {}, key = (sido, sg) => sido + '|' + sg;
  const touch = (sido, sg) => (G[key(sido, sg)] = G[key(sido, sg)] || { sido, sg, fgn: 0, idx: 0, vol: 0, byMonth: {}, assets: {} });
  (visitors.fgn || []).forEach(r => { touch(r.sido, r.name).fgn = r.rank; });
  REP.forEach(m => (months[String(m)] || []).forEach(r => {
    const g = touch(r.sido, r.name);
    g.vol = Math.max(g.vol, r.num || 0);
    g.byMonth[m] = r.idx;
    if (m === MM) g.idx = r.idx;
  }));

  // ── 행정코드 → 한글 시군구명 사전
  // ⚠️ 다국어 데이터는 주소가 영문이라 주소에서 한글 시군구를 못 뽑는다.
  //    국문 데이터(주소가 한글 + 코드 보유)에서 코드→이름 사전을 만들어 다국어에 적용한다.
  //    이걸 안 하면 다국어 POI가 시군구에 하나도 안 붙어서 공식 번역명을 못 쓴다(실측으로 확인).
  const CODE = {};
  const learn = arr => arr.forEach(o => {
    const c = String(o.regnCd || '') + '|' + String(o.signguCd || '');
    if (c === '|' || CODE[c]) return;
    const sg = sgOf(o.addr, o.sigungu);
    if (sg) CODE[c] = sg;
  });
  ['mountains_ko.json', 'cafes_ko.json', 'restaurants_ko.json', 'stays_ko.json', 'spots_ko.json'].forEach(f => learn(load(f)));
  const sgResolve = o => CODE[String(o.regnCd || '') + '|' + String(o.signguCd || '')] || sgOf(o.addr, o.sigungu);

  // ── 공식 다국어 POI (언어별 독립 — contentid 체계가 국문과 달라 제목 매칭이 불가하다)
  const mlPoi = {}; LANGS.forEach(l => { mlPoi[l] = []; });
  const addML = (lang, cat, arr) => arr.forEach(o => {
    if (!ok(o) || !o.sido) return;
    mlPoi[lang].push({ t: o.title, cat, sido: o.sido, sg: sgResolve(o), g: shortImg(o.img), off: 1 });
  });
  LANGS.forEach(l => {
    // ⚠️ 관광지(spot)가 제일 중요하다. 이게 없으면 전주 한옥마을·안동 하회마을·불국사가 데이터에 없어서
    //    역사문화 도시가 '걷기길·계곡 수'로만 평가돼 2회차 추천이 경기도 베드타운으로 채워진다(실측).
    addML(l, 'spot', load(`spots_${l}.json`));
    addML(l, 'fes', load(`festivals_${l}.json`));
    addML(l, 'mt', load(`mountains_${l}.json`));
    addML(l, 'food', load(`restaurants_${l}.json`));
    addML(l, 'cafe', load(`cafes_${l}.json`));
    addML(l, 'stay', load(`stays_${l}.json`));
  });

  // ── 국문 전용 자산 (우리 무기) — 전 언어 공용, 표기만 언어별로 바꾼다
  const KO = [];
  const push = (arr, f) => arr.forEach(o => { const r = f(o); if (r && r.sido && r.sg) KO.push(r); });
  push(load('stret.json'), o => ok(o) && ({ cat: 'walk', t: o.name, sido: o.sido, sg: sgOf(o.addr, o.sigungu), km: o.km || '', min: o.min || '' }));
  push(load('trails.json'), o => ok(o) && ({ cat: 'walk', t: o.name, sido: o.sido, sg: String(o.sigun || '').split(' ').pop(), km: o.dist || '', min: o.min || '', lv: o.level || '' }));
  push(load('accessible.json'), o => ok(o) && ({ cat: 'acc', t: o.title, sido: o.sido, sg: sgOf(o.addr, o.sigungu), g: shortImg(o.img), af: (o.acc || []).join('·') }));
  [['valleys.json', 'valley'], ['maple.json', 'maple'], ['onsen.json', 'onsen'], ['flower.json', 'flower']].forEach(([f, sub]) =>
    push(load(f), o => ok(o) && ({ cat: 'nat', sub, t: o.title, sido: o.sido, sg: sgOf(o.addr, o.sigungu), g: shortImg(o.img) })));
  push(load('mountains_ko.json'), o => ok(o) && ({ cat: 'nat', sub: 'mountain', t: o.title, sido: o.sido, sg: sgOf(o.addr, o.sigungu), g: shortImg(o.img) }));
  // 관광지 국문 12,649 — 다국어에 없는 곳은 로마자 병기로 쓴다. kind(heritage/nature…)는 도시 성격 판단에 쓴다.
  push(load('spots_ko.json'), o => ok(o) && ({ cat: 'spot', sub: o.kind || '', t: o.title, sido: o.sido, sg: sgOf(o.addr), g: shortImg(o.img) }));
  load('markets.json').forEach(m => { if (m.region && m.city) KO.push({ cat: 'market', t: m.name, sido: m.region, sg: m.city, d: m.daysNum || [] }); });

  KO.forEach(o => { const g = touch(o.sido, o.sg); g.assets[o.cat] = (g.assets[o.cat] || 0) + 1; });
  mlPoi.en.forEach(o => { if (!o.sg) return; const g = touch(o.sido, o.sg); g.assets[o.cat] = (g.assets[o.cat] || 0) + 1; });

  // ── 티어
  // 관광 자산 = 걷기길 + 자연 + 오일장 + 축제. 무장애(acc)는 전국에 깔려 있어 변별력이 없으므로 뺀다.
  const tour = g => (g.assets.spot || 0) + (g.assets.walk || 0) + (g.assets.nat || 0) + (g.assets.market || 0) + (g.assets.fes || 0);
  // 관광 강도 = 계절 쏠림(제철 관광) + 갈 곳의 양(상시 관광). 하나만 보면 한쪽이 통째로 빠진다.
  //  · 배수만 보면 강릉·속초만 남고 경주·전주·안동(계절 편차 작은 역사도시)이 사라진다.
  //  · 자산만 보면 서울·경기 대도시가 다 먹는다.
  //  2회차용: 갈 곳의 양(관광지 수)이 주(主), 계절성과 규모가 부(副).
  //  이렇게 안 하면 경주·전주·안동처럼 사철 붐비는(=배수가 낮은) 역사도시가 통째로 빠진다.
  //  ⚠️ 방문자수(vol)는 관광이 아니라 대체로 인구다. 가중치를 크게 주면 창원·수원·고양이 올라오고
  //     통영·안동·전주가 밀린다(실측). 그래서 vol은 '너무 외진 곳 거르기' 용도로만 약하게 쓴다.
  const powFamous = g => Math.min(g.assets.spot || 0, 200) * 0.35 + (g.idx ? (g.idx - 1) * 40 : 0) + Math.min(g.vol / 1e6, 8) * 0.8;
  //  3회차용: 계절 쏠림이 주. 규모가 작아도 제철엔 한국인이 확실히 몰리는 곳.
  const powQuiet = g => (g.idx ? (g.idx - 1) * 60 : 0) + Math.min(tour(g), 80) * 0.15;
  const isMetroGu = g => METRO.indexOf(g.sido) >= 0 && /구$/.test(g.sg);
  const all = Object.values(G);

  const first = all.filter(g => g.fgn && g.fgn <= 12).sort((a, b) => a.fgn - b.fgn).slice(0, 12);
  const used = new Set(first.map(g => key(g.sido, g.sg)));

  // 2회차 = 한국인이 많이 가는 '이름 있는' 관광지인데 외국인 상위권은 아닌 곳 (규모 200만+)
  const second = all
    // fgn 25위 안쪽은 이미 외국인이 많이 가는 곳이라 '두 번째 방문'의 답이 못 된다(창원·부산 구 등)
    .filter(g => !used.has(key(g.sido, g.sg)) && !isMetroGu(g) && g.vol >= 1500000 && tour(g) >= 20
      && (!g.fgn || g.fgn > 25))
    .sort((a, b) => powFamous(b) - powFamous(a)).slice(0, 18);
  second.forEach(g => used.add(key(g.sido, g.sg)));

  // 3회차 = 규모는 작아도 제철에 한국인이 확실히 몰리는 곳. 외국인은 거의 없다.
  // ⚠️ 걷기길·자연이 없으면 3회차 감성(한적함)이 성립하지 않고, 섬처럼 접근이 어려운 곳도 걸러진다(울릉·옹진).
  const third = all
    .filter(g => !used.has(key(g.sido, g.sg)) && !isMetroGu(g) && g.idx >= 1.1 && tour(g) >= 12
      && (g.assets.walk || 0) + (g.assets.nat || 0) >= 8)
    .sort((a, b) => powQuiet(b) - powQuiet(a)).slice(0, 18);

  // ── 하이라이트: 공식명 → 걷기길 → 자연 → 오일장 순, 카테고리 편중 방지
  const koByKey = {};
  KO.forEach(o => { (koByKey[key(o.sido, o.sg)] = koByKey[key(o.sido, o.sg)] || []).push(o); });

  const outDir = path.join(ROOT, 'trip', 'd');
  fs.mkdirSync(outDir, { recursive: true });
  let sizeKb = 0;

  LANGS.forEach(lang => {
    const S = SIDO_L[lang];
    const offByKey = {};
    mlPoi[lang].forEach(o => { if (o.sg) (offByKey[key(o.sido, o.sg)] = offByKey[key(o.sido, o.sg)] || []).push(o); });

    const packOne = g => {
      const k = key(g.sido, g.sg);
      const kos = koByKey[k] || [];
      const pick = (arr, n) => arr.slice(0, n);
      // 공식 다국어명이 붙은 '관광지'가 가장 좋은 하이라이트다 — 이름이 정확하고 사진도 있다
      const offAll = offByKey[k] || [];
      const off = pick(offAll.filter(o => o.g && o.cat === 'spot'), 3)
        .concat(pick(offAll.filter(o => o.g && o.cat === 'fes'), 1))
        .map(o => ({ n: o.t, cat: o.cat, off: 1, g: o.g }));
      const walk = pick(kos.filter(o => o.cat === 'walk' && o.km).sort((a, b) => a.km - b.km), 2)
        .map(o => { const p = placeName(o.t, lang); return { n: p.n, ko: p.ko, cat: 'walk', km: o.km, min: o.min || '' }; });
      const nat = pick(kos.filter(o => o.cat === 'nat' && o.g), 2)
        .map(o => { const p = placeName(o.t, lang); return { n: p.n, ko: p.ko, cat: 'nat', sub: o.sub, g: o.g }; });
      const mkt = pick(kos.filter(o => o.cat === 'market'), 1)
        .map(o => { const p = placeName(o.t, lang); return { n: p.n, ko: p.ko, cat: 'market', d: o.d }; });
      let hi = off.concat(walk, nat, mkt);
      if (hi.length < 4) {                       // 그래도 모자라면 무장애 목록에서 사진 있는 것으로 채운다
        hi = hi.concat(pick(kos.filter(o => o.cat === 'acc' && o.g), 4 - hi.length)
          .map(o => { const p = placeName(o.t, lang); return { n: p.n, ko: p.ko, cat: 'acc', g: o.g }; }));
      }
      return {
        sg: romanizeRegion(g.sg), sgKo: g.sg,
        sido: (S && S[g.sido]) || g.sido, sidoKo: g.sido,
        fgn: g.fgn || 0, idx: g.idx || 0, vol: g.vol || 0, bm: g.byMonth,
        a: g.assets, hi
      };
    };

    const pack = { lang, month: MM, tiers: { first: first.map(packOne), second: second.map(packOne), third: third.map(packOne) } };
    const f = path.join(outDir, lang + '.json');
    fs.writeFileSync(f, JSON.stringify(pack));
    if (lang === 'en') sizeKb = Math.round(fs.statSync(f).size / 1024);
  });

  console.log(`✓ trip/d/*.json — ${LANGS.length}개 언어 · 목적지 ${first.length + second.length + third.length}곳(1회차 ${first.length}/2회차 ${second.length}/3회차 ${third.length}) · ${sizeKb}KB`);
  return { first, second, third, MM, LANGS };
}

module.exports = { build, LANGS, SIDO_L, METRO };
