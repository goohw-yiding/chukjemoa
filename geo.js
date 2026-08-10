// 📍 좌표 위생 검사 — 공공데이터에 섞여 들어오는 쓰레기 좌표를 한 곳에서 막는다.
//
// ⚠️ 2026-08-10 실사고: 「현충사 달빛야행」(충남 아산)의 좌표가 **117.99 / 19.69 = 중국 남해 한가운데**였다.
//    TourAPI가 좌표를 모를 때 넣는 기본값으로 보이고, 같은 값을 쓰는 레코드가 데이터 전체에 9곳 있었다.
//    그대로 두니 개별 축제 페이지가 이렇게 나갔다 —
//      근처 가볼 곳: 마차진해변(고성)·담양호·무주덕유산·제3땅굴(파주)
//      하루 코스: 아산 → 밀양댐 물 문화관
//      근처 숙소: 금강산콘도 0.0km · 롯데시티호텔 김포공항 0.0km
//    거리가 전부 0.0km로 뭉개져서 **본문 전체가 거짓말인 페이지**가 됐다.
//    좌표가 틀리면 그 페이지의 "근처"는 전부 틀린다 — 그래서 좌표는 쓰기 전에 반드시 거른다.
//
// 또 하나: 「영주산」(제주)은 경도가 12.7974 였다. **126.7974 에서 앞의 1이 빠진 것.**
//    이런 건 자동으로 복구하지 않는다 — 추측으로 고치면 틀린 위치를 확신 있게 보여주게 된다.
//    범위 밖이면 좌표가 없는 것으로 취급하고, 지도·근처 계산에서 빼는 쪽이 안전하다.
'use strict';

// 대한민국 영역(제주·울릉·독도·마라도 포함, 넉넉하게)
const LON = [124.5, 132.0];
const LAT = [32.9, 38.7];

// 좌표가 한국 안이면 true. 값이 없거나 숫자가 아니면 false.
function inKorea(x, y) {
  const lon = Number(x), lat = Number(y);
  if (!isFinite(lon) || !isFinite(lat) || lon === 0 || lat === 0) return false;
  return lon >= LON[0] && lon <= LON[1] && lat >= LAT[0] && lat <= LAT[1];
}

// 레코드 하나가 쓸 만한 좌표를 갖고 있나 (o.x / o.y 규약)
const hasGeo = o => !!o && inKorea(o.x, o.y);

// 배열에서 좌표가 성한 것만 남긴다. 몇 개를 버렸는지 알고 싶으면 두 번째 인자에 라벨을 준다.
function keepGeo(list, label) {
  if (!Array.isArray(list)) return [];
  const ok = list.filter(hasGeo);
  const dropped = list.length - ok.length;
  if (label && dropped) console.log(`  ⚠️ ${label} — 좌표가 한국 밖이거나 없어서 ${dropped}건 제외`);
  return ok;
}

// 빌드 끝에 한 번 돌려서 "이번에 몇 건을 버렸는지"를 찍는다.
// ⚠️ 조용히 버리면 다음 주 데이터 갱신 때 새로 들어온 쓰레기 좌표를 아무도 모른다.
//    버리는 건 맞지만, **버렸다는 사실은 보이게** 둔다.
function audit(ROOT) {
  const fs = require('fs'), path = require('path');
  const FILES = [
    ['festivals_api.json', '축제'], ['stret.json', '걷기길(전국길)'], ['trails.json', '걷기길(두루누비)'],
    ['mountains_ko.json', '명산'], ['valleys.json', '계곡'], ['maple.json', '단풍'],
    ['flower.json', '봄꽃'], ['onsen.json', '온천'], ['pets.json', '반려견'],
    ['accessible.json', '무장애'], ['restaurants_ko.json', '음식점'], ['cafes_ko.json', '카페'], ['stays_ko.json', '숙박']
  ];
  const bad = [];
  for (const [file, label] of FILES) {
    let a; try { a = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', file), 'utf8')); } catch (e) { continue; }
    if (!Array.isArray(a)) continue;
    a.forEach(o => {
      if ((o.x || o.y) && !inKorea(o.x, o.y)) bad.push(`${label}: ${o.title || o.name || '?'} (${o.x}, ${o.y})`);
    });
  }
  if (bad.length) {
    console.log(`⚠️ 좌표가 한국 밖이라 지도·근처 계산에서 제외한 것 ${bad.length}건`);
    bad.slice(0, 12).forEach(s => console.log('   -', s));
    if (bad.length > 12) console.log(`   … 외 ${bad.length - 12}건`);
  } else {
    console.log('✓ 좌표 위생 — 범위 밖 0건');
  }
  return bad.length;
}

module.exports = { inKorea, hasGeo, keepGeo, audit, LON, LAT };
