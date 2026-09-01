// 전국전통시장표준데이터(행정안전부) → data/markets_std.json
//
// 왜 (2026-09-01)
//   `/jangteo/`는 네이버 유입의 48%가 들어오는 이 사이트 최대 관문인데 장날 아는 곳이 149곳뿐이었다.
//   이 표준데이터는 1,393곳이고, 무엇보다 **`mrktEstblCycle` 이 「2일+7일」「3일+8일」처럼
//   끝자리를 그대로 준다** — 우리가 손으로 채우던 장날이 데이터로 온다.
//   실측 분포: 매일 982 · 2·7일 87 · 4·9일 86 · 5·10일 86 · 3·8일 84 · 1·6일 66
//
// 이 수집기는 **끝자리가 있는 정기장만** 담는다. 상설장 982곳을 섞으면 「오일장 페이지」가
// 「전통시장 페이지」가 돼 버려 방문자가 찾던 것과 어긋난다.
//
// 실행: node fetch-markets-std.js   (키: cltur-fstvl.key — data.go.kr 공통 인증키)
// ⚠️ 응답이 { header, body } 다. TourAPI 처럼 response 로 감싸지 않는다.
const fs = require('fs'), path = require('path'), https = require('https');
const KEY = fs.readFileSync(path.join(__dirname, 'cltur-fstvl.key'), 'utf8').trim();
const BASE = 'https://api.data.go.kr/openapi/tn_pubr_public_trdit_mrkt_api';

const get = u => new Promise((res, rej) => {
  https.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
    r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
  }).on('error', rej);
});
const SIDO = [
  [/^서울/, '서울'], [/^부산/, '부산'], [/^대구/, '대구'], [/^인천/, '인천'], [/^광주/, '광주'],
  [/^대전/, '대전'], [/^울산/, '울산'], [/^세종/, '세종'], [/^경기/, '경기'], [/^강원/, '강원'],
  [/^충청북도|^충북/, '충북'], [/^충청남도|^충남/, '충남'], [/^전라북도|^전북/, '전북'],
  [/^전라남도|^전남/, '전남'], [/^경상북도|^경북/, '경북'], [/^경상남도|^경남/, '경남'], [/^제주/, '제주']
];
function parseAddr(a) {
  const s = String(a || '').trim();
  const hit = SIDO.find(([re]) => re.test(s));
  const toks = s.split(/\s+/);
  let city = (toks[1] && /(시|군|구)$/.test(toks[1])) ? toks[1] : '';
  // '포항시 남구'처럼 시 아래 구가 또 있으면 시 단위로 통일한다(축제 데이터와 축을 맞춘다)
  return { sido: hit ? hit[1] : '', city };
}
// 「2일+7일」 → [2,7]  ·  「매일」 → []
function cycleDays(s) {
  const t = String(s || '');
  if (/매일/.test(t)) return [];
  const nums = [...new Set((t.match(/\d{1,2}/g) || []).map(Number).filter(n => n >= 1 && n <= 10))];
  return nums.sort((a, b) => a - b);
}
const yn = v => String(v || '').trim().toUpperCase() === 'Y';

async function page(no, rows) {
  const j = JSON.parse(await get(`${BASE}?serviceKey=${KEY}&pageNo=${no}&numOfRows=${rows}&type=json`));
  const b = j.body || (j.response && j.response.body);
  if (!b) throw new Error('body 없음');
  let it = b.items && (b.items.item || b.items);
  if (it && !Array.isArray(it)) it = [it];
  return { total: Number(b.totalCount) || 0, items: it || [] };
}

(async () => {
  const first = await page(1, 1);
  console.log('전국전통시장표준데이터 총', first.total, '건');
  const rows = 1000, all = [];
  for (let p = 1; (p - 1) * rows < first.total && p <= 10; p++) {
    const r = await page(p, rows); all.push(...r.items);
    process.stdout.write('\r  수집 ' + all.length + '/' + first.total + '   ');
    if (r.items.length < rows) break;
  }
  console.log('');

  const seen = new Set(), out = [];
  let permanent = 0, noDay = 0;
  for (const r of all) {
    const name = String(r.mrktNm || '').trim();
    if (!name) continue;
    const daysNum = cycleDays(r.mrktEstblCycle);
    if (!daysNum.length) { permanent++; continue; }        // 상설장은 담지 않는다
    if (daysNum.length < 2) { noDay++; continue; }          // 끝자리 한 개만 있는 건 오일장이 아니다
    const addr = String(r.rdnmadr || r.lnmadr || '').trim();
    const { sido, city } = parseAddr(addr);
    const k = name.replace(/\s/g, '') + '|' + sido + city;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({
      name, sido, city, addr,
      daysNum,
      days: daysNum.join('·') + '일',
      // 취급 품목은 「의류+가정용품+음식점」처럼 +로 온다 → 사람이 읽는 문장으로
      sale: String(r.trtmntPrdlst || '').split('+').map(s => s.trim()).filter(Boolean).slice(0, 4).join(', '),
      stores: Number(r.storNumber) || 0,
      since: /^\d{4}$/.test(String(r.estblYear || '').trim()) ? String(r.estblYear).trim() : '',
      tel: String(r.phoneNumber || '').trim(),
      hp: String(r.homepageUrl || '').trim(),
      park: yn(r.prkplceYn), toilet: yn(r.pblicToiletYn),
      x: String(r.longitude || '').trim(), y: String(r.latitude || '').trim(),
      type: String(r.mrktType || '').trim()
    });
  }
  out.sort((a, b) => (a.sido + a.city + a.name).localeCompare(b.sido + b.city + b.name));
  fs.writeFileSync(path.join(__dirname, 'data', 'markets_std.json'), JSON.stringify(out), 'utf8');

  const byEnd = {};
  out.forEach(m => { const k = m.daysNum.slice(0, 2).join('·'); byEnd[k] = (byEnd[k] || 0) + 1; });
  const bySido = {};
  out.forEach(m => { bySido[m.sido || '(미상)'] = (bySido[m.sido || '(미상)'] || 0) + 1; });
  console.log(`✓ data/markets_std.json — 오일장 ${out.length}곳 (상설장 ${permanent} 제외 · 끝자리 부족 ${noDay} 제외)`);
  console.log('  끝자리:', Object.entries(byEnd).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + '일 ' + v).join(' · '));
  console.log('  시·도:', Object.entries(bySido).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' · '));
  console.log('  점포수 있음', out.filter(m => m.stores).length, '· 품목 있음', out.filter(m => m.sale).length,
    '· 개설연도 있음', out.filter(m => m.since).length, '· 주차 Y', out.filter(m => m.park).length);
})();
