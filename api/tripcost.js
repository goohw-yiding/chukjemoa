// 축제모아 — 여행 비용 계산기 서버리스 함수 (Vercel)
// 출발지·도착지(텍스트) → 카카오 지오코딩 → 자동차(카카오 길찾기: 거리·통행료) vs 대중교통(ODsay: 요금)
// 키는 Vercel 환경변수에서 읽는다: KAKAO_REST_KEY, ODSAY_KEY  (코드·깃에 키 없음)
const https = require('https');

const KAKAO = process.env.KAKAO_REST_KEY || '';
const ODSAY = process.env.ODSAY_KEY || '';

// KTX 운임표(한국철도공사 공공데이터, 역167·요금쌍3231) — 정적 번들
let KTX = { pairs: {}, stations: [] };
try { KTX = require('../data/ktx_fare.json'); } catch (e) {}
function haversine(x1, y1, x2, y2) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (y2 - y1) * rad, dLon = (x2 - x1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(y1 * rad) * Math.cos(y2 * rad) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function nearestStation(x, y, maxKm) {
  let best = null;
  for (const s of KTX.stations) {
    const dist = haversine(x, y, s.x, s.y);
    if (dist <= (maxKm || 20) && (!best || dist < best.dist)) best = { n: s.n, dist };
  }
  return best;
}

// 시외버스 터미널(TAGO) — 좌표 지오코딩본
let BUS = [];
try { BUS = require('../data/bus_terminals.json'); } catch (e) {}
const TAGO = process.env.TAGO_KEY || '';
function nearestTerminal(x, y, maxKm) {
  let best = null;
  for (const t of BUS) {
    const dist = haversine(x, y, t.x, t.y);
    if (dist <= (maxKm || 20) && (!best || dist < best.dist)) best = { id: t.id, nm: t.nm, dist };
  }
  return best;
}
function nextDates(n) {
  const out = []; const now = Date.now();
  for (let i = 1; i <= n; i++) { const t = new Date(now + i * 86400000); out.push('' + t.getFullYear() + String(t.getMonth() + 1).padStart(2, '0') + String(t.getDate()).padStart(2, '0')); }
  return out;
}
// TAGO 시외버스 요금은 날짜별로 데이터가 들쭉날쭉 → 여러 날짜 병렬 조회 후 최저요금(=일반등급) 채택
async function busFare(depId, arrId) {
  if (!TAGO) return null;
  const calls = nextDates(10).map(D =>
    get('apis.data.go.kr', '/1613000/SuburbsBusInfo/GetStrtpntAlocFndSuberbsBusInfo?serviceKey=' + encodeURIComponent(TAGO) + '&depTerminalId=' + depId + '&arrTerminalId=' + arrId + '&depPlandTime=' + D + '&numOfRows=5&pageNo=1&_type=json')
      .then(b => { try { const it = JSON.parse(b.body).response.body.items; const rows = it && it.item ? (Array.isArray(it.item) ? it.item : [it.item]) : []; return rows; } catch (e) { return []; } })
      .catch(() => [])
  );
  const results = await Promise.all(calls);
  let best = null;
  for (const rows of results) for (const r of rows) { const c = +r.charge; if (c > 0 && (!best || c < best.fare)) best = { fare: c, grade: r.gradeNm }; }
  return best;
}

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
    const from = (q.from || '').trim(), to = (q.to || '').trim();
    if (!from || !to) { res.statusCode = 400; return res.end(JSON.stringify({ error: '출발지와 도착지를 입력해주세요.' })); }
    // 가정값(사용자가 조정 가능, 기본값 노출)
    const kmpl = Math.max(1, Number(q.kmpl) || 12);          // 연비 km/L
    const fuelPrice = Math.max(1, Number(q.fuel) || 1700);   // 유가 원/L
    const parking = Math.max(0, Number(q.parking) || 0);     // 주차비 원(왕복 아님, 목적지 1회)

    const [o, d] = await Promise.all([geocode(from), geocode(to)]);
    const [car, tr] = await Promise.all([carRoute(o, d), transit(o, d).catch(() => null)]);

    // KTX: 출발·도착에서 가장 가까운 역(20km 내) + 운임표 조회
    let ktx = null;
    const kFrom = nearestStation(+o.x, +o.y), kTo = nearestStation(+d.x, +d.y);
    if (kFrom && kTo && kFrom.n !== kTo.n) {
      const fare = KTX.pairs[kFrom.n + '|' + kTo.n] != null ? KTX.pairs[kFrom.n + '|' + kTo.n] : KTX.pairs[kTo.n + '|' + kFrom.n];
      if (fare != null) ktx = { fare, depStation: kFrom.n, arrStation: kTo.n, depKm: Math.round(kFrom.dist * 10) / 10, arrKm: Math.round(kTo.dist * 10) / 10 };
    }

    // 시외버스: 터미널 편향 지오코딩("{지명} 시외버스터미널")으로 엉뚱한 POI 매칭 방지 → 가장 가까운 터미널
    let intercityBus = null;
    const [bo, bd] = await Promise.all([
      geocode(from + ' 시외버스터미널').catch(() => o),
      geocode(to + ' 시외버스터미널').catch(() => d)
    ]);
    const bFrom = nearestTerminal(+bo.x, +bo.y, 25), bTo = nearestTerminal(+bd.x, +bd.y, 25);
    if (bFrom && bTo && bFrom.id !== bTo.id) {
      const bf = await busFare(bFrom.id, bTo.id).catch(() => null);
      if (bf) intercityBus = { fare: bf.fare, grade: bf.grade, dep: bFrom.nm, arr: bTo.nm, depKm: Math.round(bFrom.dist * 10) / 10, arrKm: Math.round(bTo.dist * 10) / 10 };
    }

    const distanceKm = car.distanceM / 1000;
    const fuelCost = Math.round(distanceKm / kmpl * fuelPrice);
    const carTotal = fuelCost + car.toll + parking;

    // 대중교통 실요금 API(ODsay)가 서버 호출을 거부(ApiKeyAuthFailed) → 거리 기반 추정으로 폴백.
    // 거리대별 추정: 40km 미만은 시내·수도권 대중교통(버스·지하철), 그 이상은 시외/고속버스.
    const isCity = distanceKm < 40;
    const rate = isCity ? 80 : 90;                 // 원/km
    const floor = isCity ? 1400 : 3000;            // 최소 요금
    const busEstimate = Math.max(floor, Math.round(distanceKm * rate / 100) * 100);
    const busLabel = isCity ? '대중교통' : '고속버스';
    const routeSearch = 'https://search.naver.com/search.naver?query=' + encodeURIComponent(o.name + ' ' + d.name + ' ' + (isCity ? '대중교통 길찾기' : '고속버스'));

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
      // 시외버스 실요금(TAGO) — 있으면 우선
      intercityBus,
      // ODsay·시외버스 실요금이 모두 없을 때 쓸 거리 추정 + 정확 확인 링크
      intercity: (tr && tr.fare) || intercityBus ? null : { busEstimate, busLabel, routeSearch },
      ktx, // 가까운 KTX역이 있으면 실제 운임(한국철도공사)
      diff: (tr && tr.fare) ? (carTotal - tr.fare) : (carTotal - busEstimate)
    }));
  } catch (e) {
    res.statusCode = 200; // 사용자에겐 부드럽게
    res.end(JSON.stringify({ error: (e && e.message) || '계산 중 오류가 발생했어요. 지명을 더 구체적으로 입력해보세요.' }));
  }
};
