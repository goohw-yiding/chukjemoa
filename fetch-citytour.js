// 전국시티투어정보표준데이터 → data/citytour.json
//
// 왜 (2026-09-01)
//   축제 페이지에서 가장 자주 막히는 질문이 «차 없이 어떻게 가나»다. 우리는 대중교통 데이터가
//   약했다. 시티투어는 그 답에 가장 가깝다 — **탑승 장소·운행 요일·요금·소요시간**이 다 있고,
//   지자체가 운영해 신뢰도도 높다. 298건이라 페이지 하나로 정리된다(새 메뉴를 늘리지 않는다).
//
// 실행: node fetch-citytour.js   (키: cltur-fstvl.key)
const fs = require('fs'), path = require('path'), https = require('https');
const KEY = fs.readFileSync(path.join(__dirname, 'cltur-fstvl.key'), 'utf8').trim();
const BASE = 'https://api.data.go.kr/openapi/tn_pubr_public_city_tour_api';
const get = u => new Promise((res, rej) => {
  https.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
    r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
  }).on('error', rej);
});
// ⚠️ 2026-09-22 — 여기 자체 파서를 두었다가 사고가 났다.
//    원본 ctprvnNm 이 「전남광주통합특별시」로 오는데, 접미사만 떼는 규칙이라
//    sido 가 «전남광주통합» 이 됐고, 그 14개 코스(광양·목포·여수·해남)가
//    시·도 목록에서 통째로 빠져 있었다. region.js 의 parseAddr 만 쓴다.
const { parseAddr } = require('./region');
// 표준데이터는 여러 값을 «+»로 잇는다. 사람이 읽는 문장으로 되돌린다.
const plus = s => String(s || '').split('+').map(x => x.trim()).filter(Boolean);
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
  console.log('전국시티투어정보표준데이터 총', first.total, '건');
  const all = [];
  for (let p = 1; (p - 1) * 500 < first.total && p <= 10; p++) {
    const r = await page(p, 500); all.push(...r.items);
    if (r.items.length < 500) break;
  }
  const seen = new Set(), out = [];
  for (const r of all) {
    const sidoRaw = clean(r.ctprvnNm);
    const city = clean(r.signguNm);
    const sido = parseAddr(sidoRaw + ' ' + city).sido;
    const course = clean(r.cityTourCourse);
    if (!sido || !course) continue;
    const k = sido + '|' + city + '|' + course;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({
      sido, city, course,
      days: plus(r.operHhmm).join('·'),            // 화·수·목·금·토·일
      board: plus(r.brdngPlaceNm).slice(0, 4),     // 탑승 장소
      spots: plus(r.courseInfo).slice(0, 12),      // 코스 경유지
      open: clean(r.operOpenHhmm), close: clean(r.operCloseHhmm),
      mins: (Number(r.caralcTime) || 0),
      fee: plus(r.useCharge).slice(0, 5),          // 요금(대상별)
      feeNote: clean(r.useChargeAdiInfo),
      note: plus(r.operInfo).slice(0, 4),
      mode: clean(r.operMthd),                     // 고정형/순환형
      tel: (clean(r.phoneNumber) || plus(r.cityTourRefrnc)[0] || '').slice(0, 40),
      hp: clean(r.homepageUrl),
      inst: clean(r.institutionNm || r.insttNm),
      ref: clean(r.referenceDate)
    });
  }
  out.sort((a, b) => (a.sido + a.city + a.course).localeCompare(b.sido + b.city + b.course));
  fs.writeFileSync(path.join(__dirname, 'data', 'citytour.json'), JSON.stringify(out), 'utf8');
  const bySido = {};
  out.forEach(r => { bySido[r.sido] = (bySido[r.sido] || 0) + 1; });
  console.log(`✓ data/citytour.json — ${out.length}개 코스`);
  console.log('  시·도:', Object.entries(bySido).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' · '));
  console.log('  요금 있음', out.filter(r => r.fee.length).length, '· 탑승장소 있음', out.filter(r => r.board.length).length,
    '· 경유지 있음', out.filter(r => r.spots.length).length, '· 전화 있음', out.filter(r => r.tel).length);
})();
