// 전국 카페 — TourAPI 음식점 중 cat3=A05020900(카페/전통찻집) → data/cafes_{lang}.json
// ※ 추가 활용신청 불필요. 국문은 contentTypeId=39, 다국어는 82 (다국어는 코드 체계가 다르다 — 실측)
// ※ 사진 보유율이 100%라 카드형 페이지에 적합하다.
const fs = require('fs'), path = require('path'), https = require('https');
const readKey = f => { try { return fs.readFileSync(path.join(__dirname, f), 'utf8').trim(); } catch (e) { return ''; } };
const KEY = readKey('tourapi.key'), TWKEY = readKey('tourapi-tw.key') || KEY;

const LANGS = [
  { code: 'ko', svc: 'KorService2', ct: 39, key: KEY, ovMax: 700 },
  { code: 'en', svc: 'EngService2', ct: 82, key: KEY, ovMax: 120 },
  { code: 'ja', svc: 'JpnService2', ct: 82, key: KEY, ovMax: 120 },
  { code: 'zh', svc: 'ChsService2', ct: 82, key: KEY, ovMax: 120 },
  { code: 'tw', svc: 'ChtService2', ct: 82, key: TWKEY, ovMax: 120 }
];
const RCODE = { '11': '서울', '26': '부산', '27': '대구', '28': '인천', '29': '광주', '30': '대전', '31': '울산', '36': '세종', '41': '경기', '43': '충북', '44': '충남', '46': '전남', '47': '경북', '48': '경남', '50': '제주', '51': '강원', '52': '전북' };
// ⚠️ TourAPI가 전남·광주를 '전남광주통합특별시'(regnCd 12)로 묶어서 준다. 명산에서 겪은 것과 같은 함정.
function sidoOf(regnCd, signguCd) {
  const r = String(regnCd || '');
  if (r === '12') return /^[1-5]00$/.test(String(signguCd)) ? '광주' : '전남';
  // ⚠️ 세종처럼 regnCd를 5자리 전체코드(36110)로 주는 경우가 있다 → 앞 2자리로 폴백
  return RCODE[r] || RCODE[r.slice(0, 2)] || '';
}
function get(u) {
  return new Promise((res, rej) => {
    https.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
      r.setEncoding('utf8');           // ⚠️ 없으면 청크 경계에서 한글이 깨진다
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
    }).on('error', rej);
  });
}
const clean = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim();

async function run(L) {
  const BASE = `https://apis.data.go.kr/B551011/${L.svc}`;
  const rows = 100; let page = 1, total = Infinity, all = [];
  while ((page - 1) * rows < total) {
    const url = `${BASE}/areaBasedList2?serviceKey=${L.key}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=${rows}&pageNo=${page}`
      + `&contentTypeId=${L.ct}&cat1=A05&cat2=A0502&cat3=A05020900&arrange=A`;
    let txt; try { txt = await get(url); } catch (e) { console.error(L.code, 'req err', e.message); break; }
    let j; try { j = JSON.parse(txt); } catch (e) { console.error(L.code, 'parse err', txt.slice(0, 150)); break; }
    const b = j.response && j.response.body; if (!b) { console.error(L.code, 'no body', txt.slice(0, 150)); break; }
    total = Number(b.totalCount) || 0;
    let items = b.items && b.items.item; if (!items) break; if (!Array.isArray(items)) items = [items];
    all.push(...items);
    process.stdout.write(`\r[${L.code}] ${all.length}/${total}`);
    if (items.length < rows) break; page++; if (page > 40) break;
  }
  console.log('');
  const seen = new Set(), out = [];
  for (const it of all) {
    if (!it.contentid || seen.has(it.contentid)) continue; seen.add(it.contentid);
    if (!it.title) continue;
    out.push({
      id: it.contentid, title: clean(it.title), addr: clean(it.addr1),
      sido: sidoOf(it.lDongRegnCd, it.lDongSignguCd),
      regnCd: it.lDongRegnCd || '', signguCd: it.lDongSignguCd || '',
      img: it.firstimage || '', x: it.mapx || '', y: it.mapy || '', tel: clean(it.tel),
      created: String(it.createdtime || '').slice(0, 8)
    });
  }
  const fpath = path.join(__dirname, 'data', `cafes_${L.code}.json`);
  // ⚠️ 2026-08-18 실사고: 캐시가 `ov` 만 물려주는 바람에, 이 스크립트를 다시 돌렸더니
  //    **fetch-hours.js 가 채워 둔 영업시간·휴무·대표메뉴·주차가 2,018곳에서 통째로 사라졌다.**
  //    이 파일은 목록 API 결과로 out 을 새로 만들기 때문에, «다른 스크립트가 넣은 필드»는
  //    반드시 캐시로 물려받아야 한다. 그렇지 않으면 재수집이 곧 데이터 삭제다.
  const CARRY = ['ov', 'open', 'rest', 'menu', 'park', 'tel'];
  const cache = {};
  try {
    JSON.parse(fs.readFileSync(fpath, 'utf8')).forEach(m => {
      const keep = {}; let any = false;
      CARRY.forEach(k => { if (m[k]) { keep[k] = m[k]; any = true; } });
      if (any) cache[m.id] = keep;
    });
  } catch (e) { }
  out.forEach(m => { const c = cache[m.id]; if (!c) return; CARRY.forEach(k => { if (c[k] && !m[k]) m[k] = c[k]; }); });
  // 🚨 2026-08-18: 여기도 «동시 10개» + `L.ovMax` 상한이었다. TourAPI 초당 제한에 걸린 응답을
  //    `catch → return null` 로 조용히 삼켜 **국문 2,040곳 중 개요가 41곳(2%)** 뿐이었다.
  //    상한을 늘려도 소용없었을 것이다 — 막힌 건 호출량이 아니라 «초당 속도»였다.
  //    → 순차 + 120ms, 상한 제거(캐시가 있어 재실행이 싸다), API 오류는 세어서 보고.
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let apiErr = 0;
  async function common(cid) {
    const u = `${BASE}/detailCommon2?serviceKey=${L.key}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${cid}`;
    try {
      const j = JSON.parse(await get(u));
      if (j.OpenAPI_ServiceResponse) { apiErr++; return null; }
      const it = j.response && j.response.body && j.response.body.items;
      const d = it && it.item ? (Array.isArray(it.item) ? it.item[0] : it.item) : null;
      if (!d) return null;
      return clean(d.overview).slice(0, 400);
    } catch (e) { apiErr++; return null; }
  }
  const need = out.filter(m => !m.ov);
  let nOv = 0;
  for (let i = 0; i < need.length; i++) {
    const d = await common(need[i].id);
    if (d) { need[i].ov = d; nOv++; }
    if (i % 20 === 0 || i === need.length - 1) {
      process.stdout.write(`\r[${L.code}] 개요 ${i + 1}/${need.length} (+${nOv}${apiErr ? ' ⚠️API오류' + apiErr : ''})`);
      if (i % 100 === 0) fs.writeFileSync(fpath, JSON.stringify(out));
    }
    await sleep(120);
  }
  console.log('');
  fs.writeFileSync(fpath, JSON.stringify(out));
  console.log(`[${L.code}] 카페 ${out.length}곳 · 개요 ${Math.round(out.filter(m => m.ov).length / out.length * 100)}% · 사진 ${out.filter(m => m.img).length} · 시도미상 ${out.filter(m => !m.sido).length}`
    + (apiErr ? `  ⚠️ API 오류 ${apiErr}회` : ''));
}
(async () => { for (const L of LANGS) { try { await run(L); } catch (e) { console.error(L.code, 'FAIL', e.message); } } })();
