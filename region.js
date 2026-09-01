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
  // ⚠️ 2026-09-01 추가 — 원본에 「서울특별 중구」처럼 **시·도가 잘려 들어온** 주소가 있다
  //    (TourAPI 축제 2건). 접미사 규칙으로는 못 잡혀 sido:'' 가 되고, 그 축제는 지역 목록에서
  //    통째로 빠진다. 첫 토큰이 유효 시·도 이름으로 «시작»하면 그 시·도로 본다.
  //    MERGED 분기가 위에 있어 「전남광주통합특별시」가 「전남」으로 잘못 잡히지 않는다.
  if (!VALID_SIDO.has(sido) && first) {
    const hit = [...VALID_SIDO].find(s => first.startsWith(s));
    if (hit) sido = hit;
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
// 12를 «주소 없이» 가르는 표 — 광주 5개 자치구의 법정동 시군구 코드.
// ⚠️ 왜 필요한가: 일본어 TourAPI(JpnService2)의 addr1은 가타카나 음차라 한글 파서가 못 쓴다.
//    그래서 12가 주소로도 안 갈라져 «광주·전남이 통째로 미상»이 된다(2026-09-01 실측 342건).
// 근거: 코드12 342건의 signguCd는 27종이었고, 아래 5종만 광주 좌표범위에 100% 들어갔다.
//       광주 자치구 수(5개)와 정확히 일치하고, 나머지 22종은 전남 시군.
const GWANGJU_SIGNGU = new Set(['210', '240', '270', '300', '330']);

function sidoOf(regnCd, addr, signguCd) {
  const r = String(regnCd || '');
  const byCode = RCODE[r] || RCODE[r.slice(0, 2)];
  if (byCode) return byCode;
  const byAddr = parseAddr(addr).sido;
  if (byAddr) return byAddr;                     // 한글 주소가 있으면 그게 우선
  if (r === '12' && signguCd) {                  // 주소로 못 가른 12만 코드로 가른다
    return GWANGJU_SIGNGU.has(String(signguCd).slice(-3)) ? '광주' : '전남';
  }
  return '';
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
