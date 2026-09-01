// 전국문화축제표준데이터(행정안전부 표준데이터) → data/cltur_fstvl.json
//
// 왜 이걸 따로 받나 (2026-08-31)
//   TourAPI는 지자체가 «개최 2~3개월 전»에야 등록해 11월 이후가 텅 빈다(실측: 2027-01 2건).
//   이 표준데이터는 **지자체가 직접 올린다.** 총 1,305건으로 TourAPI(905건)보다 많고,
//   TourAPI에 없는 지역 축제가 들어 있다. 둘을 합쳐야 월별 페이지 재고가 산다.
//
// 실행: node fetch-cltur-fstvl.js
// 키: cltur-fstvl.key (data.go.kr 일반 인증키 · *.key 라 git 제외)
// ⚠️ 이 API는 응답이 { header, body } 다 — TourAPI 처럼 response 로 한 번 더 감싸지 않는다.
const fs = require('fs'), path = require('path'), https = require('https');
const KEY = fs.readFileSync(path.join(__dirname, 'cltur-fstvl.key'), 'utf8').trim();
const BASE = 'https://api.data.go.kr/openapi/tn_pubr_public_cltur_fstvl_api';

const get = u => new Promise((res, rej) => {
  https.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
    r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
  }).on('error', rej);
});

// 시·도 표기를 사이트 표기(축제모아 2글자)로 맞춘다 — TourAPI 데이터와 같은 축으로 세야 한다
const SIDO = [
  [/^서울/, '서울'], [/^부산/, '부산'], [/^대구/, '대구'], [/^인천/, '인천'], [/^광주/, '광주'],
  [/^대전/, '대전'], [/^울산/, '울산'], [/^세종/, '세종'], [/^경기/, '경기'], [/^강원/, '강원'],
  [/^충청북도|^충북/, '충북'], [/^충청남도|^충남/, '충남'], [/^전라북도|^전북/, '전북'],
  [/^전라남도|^전남/, '전남'], [/^경상북도|^경북/, '경북'], [/^경상남도|^경남/, '경남'], [/^제주/, '제주']
];
function parseAddr(a) {
  const s = String(a || '').trim();
  const hit = SIDO.find(([re]) => re.test(s));
  const sido = hit ? hit[1] : '';
  const toks = s.split(/\s+/);
  // 둘째 토큰이 시/군/구면 그것이 시·군·구. '수원시 팔달구'처럼 셋째까지 가는 건 시 단위만 쓴다.
  const sigungu = (toks[1] && /(시|군|구)$/.test(toks[1])) ? toks[1] : '';
  return { sido, sigungu };
}
const ymd = s => String(s || '').replace(/[^0-9]/g, '').slice(0, 8);

async function page(no, rows) {
  const txt = await get(`${BASE}?serviceKey=${KEY}&pageNo=${no}&numOfRows=${rows}&type=json`);
  let j; try { j = JSON.parse(txt); } catch (e) { throw new Error('parse: ' + txt.slice(0, 160)); }
  const b = j.body || (j.response && j.response.body);
  if (!b) throw new Error('body 없음: ' + txt.slice(0, 160));
  let it = b.items && (b.items.item || b.items);
  if (it && !Array.isArray(it)) it = [it];
  return { total: Number(b.totalCount) || 0, items: it || [] };
}

(async () => {
  const first = await page(1, 1);
  console.log('전국문화축제표준데이터 총', first.total, '건');
  const rows = 1000, all = [];
  for (let p = 1; (p - 1) * rows < first.total && p <= 30; p++) {
    const r = await page(p, rows);
    all.push(...r.items);
    process.stdout.write('\r  수집 ' + all.length + '/' + first.total + '   ');
    if (r.items.length < rows) break;
  }
  console.log('');

  const seen = new Set(), out = [];
  let noDate = 0, dup = 0;
  for (const r of all) {
    const title = String(r.fstvlNm || '').trim();
    const s = ymd(r.fstvlStartDate), e = ymd(r.fstvlEndDate) || s;
    if (!title || s.length < 8) { noDate++; continue; }
    const addr = String(r.rdnmadr || r.lnmadr || '').trim();
    // 같은 축제가 여러 기관에서 중복 등록되기도 한다 — 이름+시작일로 한 번 거른다
    const k = title.replace(/\s/g, '') + '|' + s;
    if (seen.has(k)) { dup++; continue; }
    seen.add(k);
    const { sido, sigungu } = parseAddr(addr);
    out.push({
      id: 'std-' + Buffer.from(k).toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0, 16),
      title, start: s, end: e, addr,
      place: String(r.opar || '').trim(),
      sido, sigungu,
      ov: String(r.fstvlCo || '').replace(/\s+/g, ' ').trim().slice(0, 400),
      tel: String(r.phoneNumber || '').trim(),
      hp: String(r.homepageUrl || '').trim(),
      host: String(r.mnnstNm || r.auspcInsttNm || '').trim(),
      x: String(r.longitude || '').trim(), y: String(r.latitude || '').trim(),
      ref: String(r.referenceDate || '').trim()
    });
  }
  out.sort((a, b) => a.start.localeCompare(b.start));
  fs.writeFileSync(path.join(__dirname, 'data', 'cltur_fstvl.json'), JSON.stringify(out), 'utf8');

  const T = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');
  const live = out.filter(r => (r.end || r.start) >= T);
  const byM = {};
  live.forEach(r => { byM[r.start.slice(0, 6)] = (byM[r.start.slice(0, 6)] || 0) + 1; });
  console.log(`✓ data/cltur_fstvl.json — ${out.length}건 (날짜없음 ${noDate} · 중복 ${dup} 제외)`);
  console.log(`  아직 안 끝난 것 ${live.length}건`);
  console.log('  시작월:', Object.keys(byM).sort().map(k => k + ':' + byM[k]).join(' '));
})();
