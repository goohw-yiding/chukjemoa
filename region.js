// ── 행정구역 표기 정규화 (전 프로젝트 공용) ─────────────────────────────
// ⚠️ 이 파일이 생긴 이유 — 같은 함정에 **네 번** 빠졌다(2026-08-18 전수 점검).
//    TourAPI가 광주와 전남을 「전남광주통합특별시」 하나로 묶어서 준다. 그런데
//      · fetch-markets.js  → signguCd 만 보다가 비아5일시장(광주)을 전남으로 넣었다
//      · fetch-spots.js    → '전남광주통합특별시':'광주' 로 뭉뚱그려 온천5·봄꽃7·단풍21곳(전부 전남)을 광주로 넣었다
//      · fetch-valleys.js  → 같은 이유로 계곡 9곳(전부 전남)을 광주로 넣었다
//      · fetch-accessible.js → 아예 매핑이 없어 VALID_SIDO 검사에서 걸러져 **광주·전남 전체가 0건**이 됐다
//    앞으로 새 수집 스크립트를 만들면 반드시 여기 sidoOf()/tidyText()를 쓸 것.
'use strict';

const SIDO_LONG = {
  '서울특별시': '서울', '부산광역시': '부산', '대구광역시': '대구', '인천광역시': '인천',
  '광주광역시': '광주', '대전광역시': '대전', '울산광역시': '울산', '세종특별자치시': '세종',
  '경기도': '경기', '강원특별자치도': '강원', '강원도': '강원',
  '충청북도': '충북', '충청남도': '충남',
  '전라북도': '전북', '전북특별자치도': '전북', '전라남도': '전남',
  '경상북도': '경북', '경상남도': '경남',
  '제주특별자치도': '제주', '제주도': '제주'
};
const VALID_SIDO = new Set(['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']);

// 광주광역시의 5개 자치구. 「전남광주통합특별시 ○○」에서 ○○ 가 이 중 하나면 광주, 아니면 전남이다.
// (전남에는 같은 이름의 «구»가 없다 — 전남은 시·군으로만 나뉜다)
const GWANGJU_GU = /^(광산구|동구|서구|남구|북구)$/;
const MERGED = '전남광주통합특별시';

// 주소 문자열 하나로 시도·시군구를 정한다. 못 정하면 sido:'' 를 돌려준다(지어내지 않는다).
function parseAddr(addr) {
  const a = String(addr || '').trim();
  const t = a.split(/\s+/);
  const first = t[0] || '', second = t[1] || '';
  let sido;
  if (first === MERGED) {
    sido = GWANGJU_GU.test(second) ? '광주' : '전남';
  } else {
    sido = SIDO_LONG[first] || first.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, '') || '';
  }
  const sigungu = /(시|군|구)$/.test(second) ? second : '';
  return { sido: VALID_SIDO.has(sido) ? sido : '', sigungu };
}

// regnCd(법정동 시도코드)가 있을 때 쓰는 버전. 12 = 전남광주통합특별시.
const RCODE = {
  '11': '서울', '26': '부산', '27': '대구', '28': '인천', '29': '광주', '30': '대전', '31': '울산',
  '36': '세종', '41': '경기', '51': '강원', '43': '충북', '44': '충남', '52': '전북', '46': '전남',
  '47': '경북', '48': '경남', '50': '제주', '12': null   // 12는 주소로 갈라야 한다
};
function sidoOf(regnCd, addr) {
  const r = String(regnCd || '');
  const byCode = RCODE[r] || RCODE[r.slice(0, 2)];
  if (byCode) return byCode;
  return parseAddr(addr).sido;
}

// 본문·주소에 그대로 박혀 나오는 통합 표기를 사람이 읽는 말로 바꾼다.
// ⚠️ 한 규칙으로는 못 고친다 — 같은 낱말이 두 가지 뜻으로 쓰인다(2026-08-18 실측).
//   ① 「전남광주통합특별시 광양시에 위치」  뒤에 시·군·구가 온다 = 그 대상이 속한 시도  → sido
//   ② 「전남광주통합특별시에서 시내버스」   조사가 바로 붙는다   = 인근 대도시 광주    → 광주
//   ③ 「인근 전남광주통합특별시민들도」     ②를 '광주'로 바꾸면 '광주민들'이 된다     → 광주시민
// 없는 사실을 지어내지 않고, 문자열 안에 이미 있는 지명만 남기는 방식이다.
function tidyText(text, sido) {
  return String(text || '')
    .replace(/전남광주통합특별시민/g, '광주시민')
    .replace(/전남광주통합특별시(?=\s)/g, sido || '')
    .replace(/전남광주통합특별시/g, '광주')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// 좌표 위생 — TourAPI 기본값(중국 남해 부근)과 국내 범위 밖을 걸러낸다.
// ⚠️ 2026-08-18 점검에서 (117.99, 19.69) 이 55건 남아 있었다.
const KR = { xMin: 124.5, xMax: 132.0, yMin: 33.0, yMax: 38.7 };
function validCoord(x, y) {
  const nx = Number(x), ny = Number(y);
  if (!nx || !ny || !isFinite(nx) || !isFinite(ny)) return false;
  return nx >= KR.xMin && nx <= KR.xMax && ny >= KR.yMin && ny <= KR.yMax;
}

module.exports = { SIDO_LONG, VALID_SIDO, GWANGJU_GU, MERGED, parseAddr, sidoOf, tidyText, validCoord, RCODE };
