// 관광지 — TourAPI contentTypeId=12(국문)/76(다국어) → data/spots_{lang}.json
//
// ⚠️ 2026-08-09 발견: 이게 없어서 방문차수 추천이 망가졌다.
//    전주 한옥마을·안동 하회마을·불국사 같은 역사문화 관광지가 우리 데이터에 통째로 없었고,
//    그 결과 도시를 '걷기길·계곡 수'로만 평가하게 되어 2회차 추천이 경기도 베드타운으로 채워졌다.
// ※ 실측 건수: ko 12,649 · en 2,623 · ja 2,607 · zh 2,384 · tw 2,109 · es 1,628
//   → 외국어 POI 풀이 685 → 약 3,300건으로 5배가 된다. 다국어 추천의 뼈대가 되는 데이터다.
// ※ 목록만 받는다(detailIntro 없음). 개요는 상위 일부만 받아 카드 설명에 쓴다.
const fs = require('fs'), path = require('path'), https = require('https');
const readKey = f => { try { return fs.readFileSync(path.join(__dirname, f), 'utf8').trim(); } catch (e) { return ''; } };
const KEY = readKey('tourapi.key'), TWKEY = readKey('tourapi-tw.key') || KEY;

const LANGS = [
  { code: 'ko', svc: 'KorService2', ct: 12, key: KEY, ovMax: 0 },
  { code: 'en', svc: 'EngService2', ct: 76, key: KEY, ovMax: 0 },
  { code: 'ja', svc: 'JpnService2', ct: 76, key: KEY, ovMax: 0 },
  { code: 'zh', svc: 'ChsService2', ct: 76, key: KEY, ovMax: 0 },
  { code: 'tw', svc: 'ChtService2', ct: 76, key: TWKEY, ovMax: 0 },
  { code: 'es', svc: 'SpnService2', ct: 76, key: KEY, ovMax: 0 }
];

const RCODE = { '11': '서울', '26': '부산', '27': '대구', '28': '인천', '29': '광주', '30': '대전', '31': '울산', '36': '세종', '41': '경기', '43': '충북', '44': '충남', '46': '전남', '47': '경북', '48': '경남', '50': '제주', '51': '강원', '52': '전북' };
function sidoOf(regnCd, signguCd) {
  const r = String(regnCd || '');
  if (r === '12') return /^[1-5]00$/.test(String(signguCd)) ? '광주' : '전남';   // ⚠️ 전남광주통합 함정
  return RCODE[r] || RCODE[r.slice(0, 2)] || '';
}
// 관광지 소분류 — 무엇이 있는 동네인지 집계할 때 쓴다
const CAT = {
  'A0101': 'nature', 'A0102': 'nature',                       // 자연관광지·관광자원
  'A0201': 'heritage', 'A0202': 'heritage', 'A0203': 'heritage', // 역사·휴양·체험
  'A0204': 'industry', 'A0205': 'architecture', 'A0206': 'festival', 'A0207': 'performance', 'A0208': 'performance'
};

function get(u) {
  return new Promise((res, rej) => {
    const req = https.get(u, { headers: { 'User-Agent': 'chukjemoa' }, timeout: 20000 }, r => {
      r.setEncoding('utf8');                     // ⚠️ 없으면 청크 경계에서 한글이 깨진다
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
    });
    req.on('error', rej);
    req.on('timeout', () => { req.destroy(); rej(new Error('timeout')); });
  });
}
const clean = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim();

async function run(L) {
  const BASE = `https://apis.data.go.kr/B551011/${L.svc}`;
  const rows = 100; let page = 1, total = Infinity, all = [];
  while ((page - 1) * rows < total) {
    const url = `${BASE}/areaBasedList2?serviceKey=${L.key}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=${rows}&pageNo=${page}`
      + `&contentTypeId=${L.ct}&arrange=A`;
    let txt; try { txt = await get(url); } catch (e) { console.error(L.code, 'req err', e.message); break; }
    let j; try { j = JSON.parse(txt); } catch (e) { console.error(L.code, 'parse err', txt.slice(0, 150)); break; }
    const b = j.response && j.response.body; if (!b) break;
    total = Number(b.totalCount) || 0;
    let items = b.items && b.items.item; if (!items) break; if (!Array.isArray(items)) items = [items];
    all.push(...items);
    if (page % 10 === 0 || (page - 1) * rows >= total) process.stdout.write(`\r[${L.code}] ${all.length}/${total}`);
    if (items.length < rows) break; page++; if (page > 200) break;
  }
  console.log('');

  const seen = new Set(), out = [];
  for (const it of all) {
    if (!it.contentid || seen.has(it.contentid) || !it.title) continue; seen.add(it.contentid);
    out.push({
      id: it.contentid, title: clean(it.title), addr: clean(it.addr1),
      sido: sidoOf(it.lDongRegnCd, it.lDongSignguCd),
      // ⚠️ 다국어는 주소가 영문("17-1 Chotdaebawi-gil, Donghae-si, …")이라 주소에서 한글 시군구를 못 뽑는다.
      //    행정코드를 반드시 같이 저장해야 국문 데이터와 시군구를 맞출 수 있다.
      regnCd: it.lDongRegnCd || '', signguCd: it.lDongSignguCd || '',
      kind: CAT[it.cat2] || '', cat2: it.cat2 || '',
      img: it.firstimage || '', x: it.mapx || '', y: it.mapy || ''
    });
  }
  const fpath = path.join(__dirname, 'data', `spots_${L.code}.json`);
  fs.writeFileSync(fpath, JSON.stringify(out));
  console.log(`[${L.code}] 관광지 ${out.length}곳 · 좌표 ${out.filter(o => o.x).length} · 사진 ${out.filter(o => o.img).length} · 시도미상 ${out.filter(o => !o.sido).length}`);
}

(async () => {
  const only = process.argv.slice(2);
  for (const L of LANGS) {
    if (only.length && only.indexOf(L.code) < 0) continue;
    try { await run(L); } catch (e) { console.error(L.code, 'FAIL', e.message); }
  }
})();
