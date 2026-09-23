// 근처 볼거리의 «도로 기준» 거리·차량 소요시간 (NAVER Directions 5, 2026-09-23 도입)
//
// 왜: 직선거리로만 정렬·표시하던 「近くの見どころ / Nearby Attractions」를 파일럿(50건)으로 재 보니
//     직선 10.4km 가 도로 28.6km·31분(도동서원), 강 건너 1.8km 가 도로 5.3km(워커힐)였다.
//     «가깝다고 써 놓은 곳이 실제로는 멀다» → 장남 님 결정: 전량 사서 정확한 정보로.
//
// 규칙 (ja-nearby.js · en-nearby.js 공통 — 고칠 땐 여기 한 곳만)
//   ① 후보 = 직선 12km 안 가까운 순 K=8곳 (도로로 재면 6~8번째가 앞으로 올 수 있다)
//   ② 직선 1km 미만 = 걸어갈 거리. 차로 재면 일방통행 때문에 0.2km 가 1.9km 로 나온다(파일럿 실측).
//      → 호출하지 않고 「도보권」으로 표시, 목록 맨 앞.
//   ③ 나머지는 도로거리로 재서 **15km 넘으면 뺀다**, 차량 소요시간 순으로 정렬.
//   ④ 후보 중 하나라도 캐시가 없으면(새 축제) 그 축제는 **통째로 옛 방식(직선)** — 섞지 않는다.
//      섞으면 「직선 3km」와 「도로 3km」가 한 목록에서 같은 숫자로 비교돼 거짓 순서가 된다.
const fs = require('fs'), path = require('path');
const K = 8, WALK_KM = 1, ROAD_MAX_M = 15000;
const FILE = path.join(__dirname, 'data', 'road_cache.json');

let C = null;
const cache = () => { if (!C) { try { C = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { C = {}; } } return C; };
const r6 = v => (+v).toFixed(6);
const key = (f, p) => `${r6(f.x)},${r6(f.y)}>${r6(p.x)},${r6(p.y)}`;

const rad = d => d * Math.PI / 180;
function km(ax, ay, bx, by) {
  const a = Math.sin(rad(by - ay) / 2) ** 2 + Math.cos(rad(ay)) * Math.cos(rad(by)) * Math.sin(rad(bx - ax) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ⓪ 볼거리가 아닌 것 — TourAPI 「휴양관광지(A0202)」에 의료관광 등록기관이 섞여 있다(2026-09-23 발견).
//    병원·성형외과·피부과·의료관광 에이전시·주식회사가 ja 280 · en 263건(약 8%).
//    「부산우리들병원」「㈜뉴씨에프씨」가 축제 근처 볼거리 2위로 나가고 있었다.
//    «A0202 또는 분류 없음» 안에서만, 이름(병원·클리닉·주식회사…) 또는 개요의 의료관광 문구로 거른다.
const MED_T = /病院|医院|クリニック|歯科|皮膚科|美容外科|形成外科|株式会社|\(株\)|（株）|\(財\)|\(社\)|旅行社|Hospital|Clinic|Dental|Dermatolog|Plastic Surg|Co\.,? ?Ltd|Inc\.|Medical Center/i;
const MED_O = /外国人患者|医療観光|foreign patients|medical tourism/i;
// ⚠️ 이름 규칙도 «A0202(또는 분류 없음)»에만 건다 — 역사관광지(A0201)인 「대한의원(Seoul Daehan Hospital)」은
//    1908년 근대건축 문화재다. 이름에 Hospital 이 있다고 자르면 진짜 볼거리를 버린다(실측으로 잡음).
const notSight = p => (p.cat === 'A0202' || !p.cat) && (MED_T.test(p.title || '') || MED_O.test(p.ov || ''));

// ① 후보 (수집기도 이걸 쓴다 — 「무엇을 살지」와 「무엇을 보여줄지」가 어긋나지 않게)
function candidates(f, P) {
  const fx = +f.x, fy = +f.y;
  if (!fx || !fy) return [];
  return P.filter(p => !notSight(p)).map(p => ({ p, d: km(fx, fy, +p.x, +p.y) })).filter(o => o.d <= 12 && o.d > 0.05)
    .sort((a, b) => a.d - b.d).slice(0, K);
}
// 호출이 필요한 쌍 (도보권 제외)
const needs = (f, P) => candidates(f, P).filter(o => o.d >= WALK_KM).map(o => ({ f, p: o.p, key: key(f, o.p) }));

// ②~④ 최종 목록. 반환 원소: { p, d, mode:'walk'|'road'|'line', m?, min? } · road: 전부 도로 기준이면 true
function pick(f, P, n = 5) {
  const cand = candidates(f, P);
  const c = cache();
  const ok = cand.every(o => o.d < WALK_KM || c[key(f, o.p)]);
  if (!ok) return { road: false, list: cand.slice(0, n).map(o => ({ ...o, mode: 'line' })) };
  const walk = cand.filter(o => o.d < WALK_KM).map(o => ({ ...o, mode: 'walk' }));
  const drive = cand.filter(o => o.d >= WALK_KM).map(o => { const r = c[key(f, o.p)];
    // r.none = 도로 경로 없음(섬·통제구역 등) → 빼는 대상
    return r.none ? { ...o, m: Infinity } : { ...o, mode: 'road', m: r.m, min: Math.max(1, Math.round(r.ms / 60000)) }; })
    .filter(o => o.m <= ROAD_MAX_M).sort((a, b) => a.min - b.min || a.m - b.m);
  return { road: true, list: [...walk, ...drive].slice(0, n) };
}

module.exports = { pick, needs, key, candidates, notSight, FILE, WALK_KM, ROAD_MAX_M };
