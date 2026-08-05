// 축제모아 — 여행 비용 계산기 서버리스 함수 (Vercel)
// 출발지·도착지(텍스트) → 카카오 지오코딩 → 자동차(카카오 길찾기: 거리·통행료) vs 대중교통(ODsay: 요금)
// 키는 Vercel 환경변수에서 읽는다: KAKAO_REST_KEY, ODSAY_KEY  (코드·깃에 키 없음)
const https = require('https');

const KAKAO = process.env.KAKAO_REST_KEY || '';
const ODSAY = process.env.ODSAY_KEY || '';

function get(host, path, headers) {
  return new Promise((resolve, reject) => {
    https.get({ host, path, headers: headers || {} }, r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => resolve({ sc: r.statusCode, body: d }));
    }).on('error', reject);
  });
}
// 카카오 키워드 지오코딩 → {x(lng), y(lat), name}
async function geocode(q) {
  const r = await get('dapi.kakao.com', '/v2/local/search/keyword.json?size=1&query=' + encodeURIComponent(q), { Authorization: 'KakaoAK ' + KAKAO });
  if (r.sc !== 200) throw new Error('지오코딩 실패(' + r.sc + ')');
  const j = JSON.parse(r.body);
  const doc = j.documents && j.documents[0];
  if (!doc) throw new Error('장소를 찾지 못했어요: ' + q);
  return { x: doc.x, y: doc.y, name: doc.place_name || q, addr: doc.road_address_name || doc.address_name || '' };
}
async function carRoute(o, d) {
  const r = await get('apis-navi.kakaomobility.com', `/v1/directions?origin=${o.x},${o.y}&destination=${d.x},${d.y}&priority=RECOMMEND`, { Authorization: 'KakaoAK ' + KAKAO });
  if (r.sc !== 200) throw new Error('경로 조회 실패(' + r.sc + ')');
  const j = JSON.parse(r.body);
  const rt = j.routes && j.routes[0];
  if (!rt || rt.result_code !== 0) throw new Error('자동차 경로가 없어요' + (rt && rt.result_msg ? ' (' + rt.result_msg + ')' : ''));
  const s = rt.summary;
  return { distanceM: s.distance, toll: (s.fare && s.fare.toll) || 0, durationSec: s.duration };
}
async function transit(o, d) {
  const path = `/v1/api/searchPubTransPathT?SX=${o.x}&SY=${o.y}&EX=${d.x}&EY=${d.y}&apiKey=${encodeURIComponent(ODSAY)}`;
  const r = await get('api.odsay.com', path, { Referer: 'https://chukjemoa.co.kr/' });
  const j = JSON.parse(r.body);
  if (!j.result || !j.result.path || !j.result.path.length) return null; // 대중교통 경로 없음(초장거리 등)
  // 요금 있는 첫 경로 우선
  const withFare = j.result.path.find(p => p.info && p.info.payment > 0) || j.result.path[0];
  const info = withFare.info;
  const fare = info.payment || 0;
  // ODsay는 수도권 버스·지하철 요금만 제공 — 시외버스·KTX 등은 payment=0으로 옴 → 요금 정보 없음으로 처리
  return { fare: fare > 0 ? fare : null, durationMin: info.totalTime || 0, transfer: (info.busTransitCount || 0) + (info.subwayTransitCount || 0) };
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600'); // 같은 구간 1시간 캐시(쿼터 절약)
  try {
    if (!KAKAO || !ODSAY) { res.statusCode = 500; return res.end(JSON.stringify({ error: '서버 키 미설정(관리자: Vercel 환경변수 KAKAO_REST_KEY·ODSAY_KEY 등록 필요)' })); }
    const q = req.query || {};
    if (q.debug === '1') { // 임시 진단: ODsay 원응답·리전 확인
      let dbg;
      try { const r = await get('api.odsay.com', '/v1/api/searchPubTransPathT?SX=126.9779&SY=37.5663&EX=127.0286&EY=37.4979&apiKey=' + encodeURIComponent(ODSAY), { Referer: 'https://chukjemoa.co.kr/' }); dbg = { sc: r.sc, body: r.body.slice(0, 220) }; }
      catch (e) { dbg = { err: e.message }; }
      res.statusCode = 200; return res.end(JSON.stringify({ region: process.env.VERCEL_REGION || '(unknown)', odsay: dbg }));
    }
    const from = (q.from || '').trim(), to = (q.to || '').trim();
    if (!from || !to) { res.statusCode = 400; return res.end(JSON.stringify({ error: '출발지와 도착지를 입력해주세요.' })); }
    // 가정값(사용자가 조정 가능, 기본값 노출)
    const kmpl = Math.max(1, Number(q.kmpl) || 12);          // 연비 km/L
    const fuelPrice = Math.max(1, Number(q.fuel) || 1700);   // 유가 원/L
    const parking = Math.max(0, Number(q.parking) || 0);     // 주차비 원(왕복 아님, 목적지 1회)

    const [o, d] = await Promise.all([geocode(from), geocode(to)]);
    const [car, tr] = await Promise.all([carRoute(o, d), transit(o, d).catch(() => null)]);

    const distanceKm = car.distanceM / 1000;
    const fuelCost = Math.round(distanceKm / kmpl * fuelPrice);
    const carTotal = fuelCost + car.toll + parking;

    // 시외/기차 요금은 공개 API가 없어(코레일 API 미제공, 시외버스는 제휴 승인 필요)
    // ODsay 요금이 없을 때 고속버스 거리 기반 추정치를 제공(약 90원/km, 최소 3천원). 추정임을 명시.
    const busEstimate = Math.max(3000, Math.round(distanceKm * 90 / 100) * 100);
    const routeSearch = 'https://search.naver.com/search.naver?query=' + encodeURIComponent(o.name + ' ' + d.name + ' 고속버스');

    res.statusCode = 200;
    res.end(JSON.stringify({
      from: { q: from, name: o.name, addr: o.addr },
      to: { q: to, name: d.name, addr: d.addr },
      assumptions: { kmpl, fuelPrice, parking },
      car: {
        distanceKm: Math.round(distanceKm * 10) / 10,
        durationMin: Math.round(car.durationSec / 60),
        fuelCost, toll: car.toll, parking, total: carTotal,
        formula: `연료 ${fuelCost.toLocaleString()}원(=${distanceKm.toFixed(1)}km ÷ ${kmpl}km/L × ${fuelPrice.toLocaleString()}원) + 통행료 ${car.toll.toLocaleString()}원${parking ? ' + 주차 ' + parking.toLocaleString() + '원' : ''}`
      },
      transit: tr ? { fare: tr.fare, durationMin: tr.durationMin, transfer: tr.transfer } : null,
      // ODsay 실요금이 없을 때 쓸 시외/고속버스 추정 + 정확 확인 링크
      intercity: (tr && tr.fare) ? null : { busEstimate, routeSearch },
      diff: (tr && tr.fare) ? (carTotal - tr.fare) : (carTotal - busEstimate)
    }));
  } catch (e) {
    res.statusCode = 200; // 사용자에겐 부드럽게
    res.end(JSON.stringify({ error: (e && e.message) || '계산 중 오류가 발생했어요. 지명을 더 구체적으로 입력해보세요.' }));
  }
};
