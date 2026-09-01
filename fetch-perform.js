// 전국공연행사정보표준데이터 → data/perform.json
//
// 왜 (2026-09-01)
//   9,087건 중 «아직 안 끝난 것»이 363건이고, 그 분포가 9월 81 · 10월 102 · **11월 91 · 12월 57**이다.
//   축제 재고가 얇아지는 11~12월에 오히려 공연이 많다.
//
// ⚠️ 다만 이건 «축제»가 아니다 — 「시립합창단 정기연주회」를 9월 축제 목록에 섞으면
//    「9월축제」로 온 사람에게 틀린 답을 주는 셈이다. 그래서 월별 페이지에서도
//    **축제 목록과 섞지 않고 「이달의 지역 공연」이라는 별도 섹션**으로만 쓴다.
//
// 실행: node fetch-perform.js   (키: cltur-fstvl.key)
const fs = require('fs'), path = require('path'), https = require('https');
const KEY = fs.readFileSync(path.join(__dirname, 'cltur-fstvl.key'), 'utf8').trim();
const BASE = 'https://api.data.go.kr/openapi/tn_pubr_public_pblprfr_event_info_api';
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
const ymd = s => String(s || '').replace(/[^0-9]/g, '').slice(0, 8);
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
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
  console.log('전국공연행사정보표준데이터 총', first.total, '건');
  const all = [];
  for (let p = 1; (p - 1) * 1000 < first.total && p <= 15; p++) {
    const r = await page(p, 1000); all.push(...r.items);
    process.stdout.write('\r  수집 ' + all.length + '/' + first.total + '   ');
    if (r.items.length < 1000) break;
  }
  console.log('');
  const T = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');
  const seen = new Set(), out = [];
  let longRun = 0;
  for (const r of all) {
    const name = clean(r.eventNm);
    const s = ymd(r.eventStartDate), e = ymd(r.eventEndDate) || s;
    if (!name || s.length < 8) continue;
    if (e < T) continue;                                  // 끝난 공연은 담지 않는다
    // ⚠️ 「현대미술관 상설 전시(2023-06-30~)」처럼 **몇 년째 열려 있는 상설물**이 섞여 있다.
    //    「이달의 지역 공연」에 그런 게 뜨면 이달 소식이 아니다. 축제에 쓴 45일 규칙을 여기도 쓴다.
    //    (2026-09-01 audit-newdata.js 로 발견 — 6건)
    const span = (new Date(+e.slice(0, 4), +e.slice(4, 6) - 1, +e.slice(6, 8))
      - new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8))) / 86400000;
    if (span > 45) { longRun++; continue; }
    const addr = clean(r.rdnmadr || r.lnmadr);
    const hit = SIDO.find(([re]) => re.test(addr));
    const toks = addr.split(/\s+/);
    const k = name.replace(/\s/g, '') + '|' + s;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({
      name, start: s, end: e,
      sido: hit ? hit[1] : '', city: (toks[1] && /(시|군|구)$/.test(toks[1])) ? toks[1] : '',
      place: clean(r.opar), desc: clean(r.eventCo).slice(0, 120),
      time: [clean(r.eventStartTime), clean(r.eventEndTime)].filter(Boolean).join('~'),
      charge: clean(r.chrgeInfo), fee: clean(r.admfee), age: clean(r.entncAge),
      host: clean(r.mnnstNm), tel: clean(r.phoneNumber), hp: clean(r.homepageUrl),
      park: String(r.prkplceYn || '').trim().toUpperCase() === 'Y'
    });
  }
  out.sort((a, b) => a.start.localeCompare(b.start));
  fs.writeFileSync(path.join(__dirname, 'data', 'perform.json'), JSON.stringify(out), 'utf8');
  const byM = {};
  out.forEach(r => { byM[r.start.slice(0, 6)] = (byM[r.start.slice(0, 6)] || 0) + 1; });
  console.log(`✓ data/perform.json — 아직 안 끝난 공연 ${out.length}건 (장기 상설 ${longRun}건 제외)`);
  console.log('  시작월:', Object.keys(byM).sort().map(k => k + ':' + byM[k]).join(' '));
})();
