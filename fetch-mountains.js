// 전국 산(명산) — TourAPI 관광지 중 cat3=A01010400(자연>자연관광지>산) → data/mountains_{lang}.json
// ※ 추가 활용신청 불필요. 이미 승인된 Kor/Eng/Jpn/Chs/Cht 서비스로 전부 된다.
//   국문은 contentTypeId=12, 다국어는 76 (다국어 서비스는 코드 체계가 다르다 — 실측 확인함)
const fs = require('fs'), path = require('path'), https = require('https');
const readKey = f => { try { return fs.readFileSync(path.join(__dirname, f), 'utf8').trim(); } catch (e) { return ''; } };
const KEY = readKey('tourapi.key'), TWKEY = readKey('tourapi-tw.key') || KEY;

const LANGS = [
  { code: 'ko', svc: 'KorService2', ct: 12, key: KEY },
  { code: 'en', svc: 'EngService2', ct: 76, key: KEY },
  { code: 'ja', svc: 'JpnService2', ct: 76, key: KEY },
  { code: 'zh', svc: 'ChsService2', ct: 76, key: KEY },
  { code: 'tw', svc: 'ChtService2', ct: 76, key: TWKEY }
];
// lDongRegnCd → 시도명(국문 기준). 다국어는 주소에서 못 뽑을 때가 있어 코드로 맞춘다.
const RCODE = { '11': '서울', '26': '부산', '27': '대구', '28': '인천', '29': '광주', '30': '대전', '31': '울산', '36': '세종', '41': '경기', '43': '충북', '44': '충남', '46': '전남', '47': '경북', '48': '경남', '50': '제주', '51': '강원', '52': '전북' };
// ⚠️ TourAPI가 최근 전남·광주를 '전남광주통합특별시'(regnCd 12)로 묶어서 준다.
//    그대로 두면 시도가 비어 지역 필터에서 통째로 빠진다(실측 25건).
//    광주 자치구(동/서/남/북/광산)만 시군구 코드가 100·200·300·400·500 형태라 그걸로 가른다.
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
      + `&contentTypeId=${L.ct}&cat1=A01&cat2=A0101&cat3=A01010400&arrange=A`;
    let txt; try { txt = await get(url); } catch (e) { console.error(L.code, 'req err', e.message); break; }
    let j; try { j = JSON.parse(txt); } catch (e) { console.error(L.code, 'parse err', txt.slice(0, 150)); break; }
    const b = j.response && j.response.body; if (!b) { console.error(L.code, 'no body', txt.slice(0, 150)); break; }
    total = Number(b.totalCount) || 0;
    let items = b.items && b.items.item; if (!items) break; if (!Array.isArray(items)) items = [items];
    all.push(...items);
    process.stdout.write(`\r[${L.code}] ${all.length}/${total}`);
    if (items.length < rows) break; page++; if (page > 30) break;
  }
  console.log('');
  const seen = new Set(), out = [];
  for (const it of all) {
    if (!it.contentid || seen.has(it.contentid)) continue; seen.add(it.contentid);
    if (!it.title) continue;
    const addr = clean(it.addr1);
    out.push({
      id: it.contentid, title: clean(it.title), addr,
      // ⚠️ sigungu 를 ''로 두는 바람에 332곳 전부 시·군이 빈칸이었다(2026-08-18). 주소에서 채운다.
      sido: sidoOf(it.lDongRegnCd, it.lDongSignguCd), sigungu: (String(addr).split(/\s+/)[1] || '').replace(/^(?!.*(시|군|구)$).*$/, ''),
      regnCd: it.lDongRegnCd || '', signguCd: it.lDongSignguCd || '',
      img: it.firstimage || '', x: it.mapx || '', y: it.mapy || '', tel: clean(it.tel)
    });
  }
  // 개요(overview)는 국문만 채운다 — 다국어는 건수가 적어 전량, 국문은 상위 200개만(호출 절약)
  const fpath = path.join(__dirname, 'data', `mountains_${L.code}.json`);
  // 이미 받은 개요·전화는 다시 받지 않는다(재실행이 싸야 매주 돌릴 수 있다)
  const cache = {};
  try { JSON.parse(fs.readFileSync(fpath, 'utf8')).forEach(m => { if (m.ov || m.tel) cache[m.id] = { ov: m.ov, tel: m.tel }; }); } catch (e) { }
  out.forEach(m => { const c = cache[m.id]; if (!c) return; if (c.ov) m.ov = c.ov; if (c.tel && !m.tel) m.tel = c.tel; });
  // 🚨 2026-08-18: 여기도 «동시 10개»였다. TourAPI 초당 제한에 걸려 응답이
  //    {"OpenAPI_ServiceResponse":{...LIMITED_NUMBER_OF_SERVICE_REQUESTS_PER_SECOND...}} 로 오는데
  //    `catch → return null` 로 조용히 삼켜 개요가 30%에서 멈춰 있었다(332곳 중 232곳 결측).
  //    → 순차 + 120ms. API 오류는 «세어서» 보고한다. (fetch-spots.js 와 같은 사고, 같은 처방)
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
      return { ov: clean(d.overview).slice(0, 500), addr: clean(d.addr1), tel: clean(d.tel).slice(0, 60) };
    } catch (e) { apiErr++; return null; }
  }
  // ⚠️ 예전엔 국문을 340개로 잘라 두었는데(호출 절약), 정작 못 채운 이유는 호출량이 아니라 초당 제한이었다.
  //    이제 캐시가 있어 재실행이 싸므로 상한을 두지 않는다.
  const need = out.filter(m => !m.ov || !m.tel);
  let nOv = 0, nTel = 0;
  for (let i = 0; i < need.length; i++) {
    const d = await common(need[i].id);
    if (d) {
      if (d.ov && !need[i].ov) { need[i].ov = d.ov; nOv++; }
      if (d.tel && !need[i].tel) { need[i].tel = d.tel; nTel++; }
      if (!need[i].addr && d.addr) need[i].addr = d.addr;
    }
    if (i % 10 === 0 || i === need.length - 1) {
      process.stdout.write(`\r[${L.code}] 상세 ${i + 1}/${need.length} (개요+${nOv} 전화+${nTel}${apiErr ? ' ⚠️API오류' + apiErr : ''})`);
      if (i % 50 === 0) fs.writeFileSync(fpath, JSON.stringify(out));
    }
    await sleep(120);
  }
  console.log('');
  fs.writeFileSync(fpath, JSON.stringify(out));
  const pct = k => Math.round(out.filter(m => m[k]).length / out.length * 100) + '%';
  console.log(`[${L.code}] 산 ${out.length}곳 저장 · 개요 ${pct('ov')} · 전화 ${pct('tel')} · 사진 ${pct('img')}`
    + (apiErr ? `  ⚠️ API 오류 ${apiErr}회` : ''));
}

(async () => { for (const L of LANGS) { try { await run(L); } catch (e) { console.error(L.code, 'FAIL', e.message); } } })();
