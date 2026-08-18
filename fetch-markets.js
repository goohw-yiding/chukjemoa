// 🏮 전국 오일장·전통시장 — TourAPI 쇼핑>시장 cat3=A04010100 → data/markets_api.json
// ※ 추가 활용신청 불필요(카페·명산과 같은 채널).
//
// 만든 이유(2026-08-18 전체 점검): 손으로 관리하던 data/markets.json 이 27곳뿐이었고 좌표가 0건이라
// 지도·코스에 쓸 수 없었다. 서울·부산·대구·광주·대전·세종·전북은 아예 0곳인데 페이지 제목은 「전국」이었다.
// /jangteo/ 는 GA 조회 3위 자산이고 「전국 유명 5일장」이 GSC에 59회 노출되던 자리다.
//
// ⚠️ 장날(4·9일 같은 개시일)이 이 데이터의 핵심 가치인데 TourAPI에 전용 필드가 없다.
//    그래서 제목 괄호와 개요 문장에서 뽑아내되, **끝자리 두 개가 정확히 5 간격일 때만** 인정한다.
//    (예: "23, 28일에 장" → 3·8 로 정규화됨. 간격이 5가 아니면 오일장이 아니므로 버린다)
//    못 뽑은 곳은 days 를 비워 둔다 — 추측해서 채우지 않는다.
const fs = require('fs'), path = require('path'), https = require('https');
const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const B = 'https://apis.data.go.kr/B551011/KorService2';
const RCODE = { '11': '서울', '26': '부산', '27': '대구', '28': '인천', '29': '광주', '30': '대전', '31': '울산', '36': '세종', '41': '경기', '43': '충북', '44': '충남', '46': '전남', '47': '경북', '48': '경남', '50': '제주', '51': '강원', '52': '전북' };
// ⚠️ TourAPI가 전남·광주를 「전남광주통합특별시」(regnCd 12)로 묶어서 준다.
//    signguCd 만 보던 규칙으로는 2026-08-18에 **비아5일시장(광주 광산구)이 전남으로** 잡혔다.
//    광주 자치구 이름은 전남 시·군과 겹치지 않으므로(전남은 전부 시·군) 주소로 먼저 가른다.
const GWANGJU_GU = /^(광산구|동구|서구|남구|북구)$/;
function sidoOf(regnCd, signguCd, addr) {
  const r = String(regnCd || '');
  if (r === '12') {
    const t = String(addr || '').split(' ')[1] || '';
    if (GWANGJU_GU.test(t)) return '광주';
    return /^[1-5]00$/.test(String(signguCd)) ? '광주' : '전남';
  }
  return RCODE[r] || RCODE[r.slice(0, 2)] || '';
}
// 주소·개요에 그대로 박혀 나오는 통합 표기를 사람이 읽는 시도명으로 바꾼다.
// ⚠️ 개요 본문(ov)에는 두 가지 용법이 섞여 나온다. 한 규칙으로는 못 고친다(2026-08-18 실측 7건).
//    ① 「전남광주통합특별시 광양에 위치」  → 뒤에 시·군·구가 붙는다 = 그 시장이 속한 시도  → sido
//    ② 「전남광주통합특별시에서 시내버스」 → 조사가 바로 붙는다 = 인근 대도시 광주        → 광주
//    ③ 「인근 전남광주통합특별시민들도」   → ②를 그냥 '광주'로 바꾸면 '광주민들'이 된다   → 광주시민
//    없는 사실을 지어내지 않고 문자열 안에 이미 있는 지명만 남기는 방식이다.
function tidyAddr(addr, sido) {
  return String(addr || '')
    .replace(/전남광주통합특별시민/g, '광주시민')
    .replace(/전남광주통합특별시(?=\s)/g, sido || '')
    .replace(/전남광주통합특별시/g, '광주')
    .replace(/\s{2,}/g, ' ').trim();
}
function get(u) {
  return new Promise((res, rej) => https.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
    r.setEncoding('utf8');            // ⚠️ 없으면 청크 경계에서 한글이 깨진다
    let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
  }).on('error', rej));
}
const clean = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim();
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── 장날 추출 ────────────────────────────────────────────────
// 끝자리로 정규화하고 «간격 5»를 만족할 때만 오일장으로 인정한다.
function norm(a, b) {
  let s = [...new Set([a % 10 || 10, b % 10 || 10])].sort((x, y) => x - y);
  if (s.length !== 2) return null;
  return (s[1] - s[0] === 5) ? s : null;
}
// 「N일, M일」 「N일과 M일」 「N·M일」 「2, 7, 12…」를 모두 잡는 두 패턴.
// ⚠️ 첫 시도에서 제목 「(4일, 9일)」·본문 「장날은 매월 2일, 7일이다」를 놓쳤다 —
//    구분자 앞뒤에 «일»이 붙는 경우를 안 봤기 때문. 패턴을 늘리지 말고 느슨하게 잡은 뒤
//    «끝자리 5 간격» 규칙으로 거르는 쪽이 훨씬 잘 맞는다.
const PAIR = [
  /(\d{1,2})\s*일?\s*(?:,|·|ㆍ|、|과|와|~|-)\s*(\d{1,2})\s*일/g,
  /(\d{1,2})\s*[,·ㆍ、]\s*(\d{1,2})(?=\s*[,·ㆍ、])/g,
  /(\d{1,2})\s*(?:과|와)\s*(\d{1,2})\s*인?\s*(?:날|일)/g       // 「끝자리 수가 1과 6인 날」
];
// 날짜가 «장날»을 뜻한다는 단서. 없으면 설립연도·주소 번지를 장날로 오독할 수 있다.
const CUE = /장날|오일장|5일장|장이 선|장이 서|매월|개설|개시|열린|열리|서는 날|끝나는 날/;
function scan(text, needCue) {
  const s = String(text || '');
  for (const re of PAIR) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(s))) {
      const d = norm(+m[1], +m[2]);
      if (!d) continue;
      if (needCue) {
        const around = s.slice(Math.max(0, m.index - 30), m.index + m[0].length + 15);
        if (!CUE.test(around)) continue;
      }
      return d;
    }
  }
  return null;
}
// 공공데이터 fairday 원문에서 끝자리 두 개를 뽑는다.
// 예: 「매월 3, 8, 13, 18, 23, 28일」 「2일 / 7일」 「1일, 6일」 「5일 / 10일 / 15일 …」
// ⚠️ 여기서도 «간격 5» 규칙을 그대로 적용한다 — 10일장(5,15,25)은 오일장이 아니므로 거른다.
function daysFromFair(fair) {
  const s = String(fair || '');
  const nums = (s.match(/\d{1,2}/g) || []).map(Number);
  if (nums.length < 2) return null;
  const ends = [...new Set(nums.map(n => n % 10 || 10))].sort((a, b) => a - b);
  if (ends.length !== 2) return null;
  return (ends[1] - ends[0] === 5) ? ends : null;
}
function daysOf(title, ov) {
  const t = String(title || '');
  const paren = (t.match(/[（(]([^)）]*)[)）]/) || [])[1];
  if (paren) { const d = scan(paren, false); if (d) return d; }   // 제목 괄호 = 사실상 장날 표기
  return scan(ov, true);
}

async function run() {
  const url = `${B}/areaBasedList2?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json`
    + `&numOfRows=1000&pageNo=1&contentTypeId=38&cat1=A04&cat2=A0401&cat3=A04010100&arrange=A`;
  const j = JSON.parse(await get(url));
  const items = (j.response.body.items && j.response.body.items.item) || [];
  console.log('시장 목록', items.length, '/ totalCount', j.response.body.totalCount);

  const out = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    let ov = '', intro = {};
    try {
      const d = await get(`${B}/detailCommon2?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${it.contentid}`);
      ov = clean((JSON.parse(d).response.body.items.item[0] || {}).overview || '');
    } catch (e) { }
    await sleep(110);
    // ⭐ detailIntro2(쇼핑)에 **판매품목(saleitem)과 공식 장날(fairday)** 이 들어 있다.
    //    2026-08-18 표본 12건 실측: saleitem 11/12 · fairday 11/12 · 주차 11/12 · 영업시간 10/12.
    //    개요에서 정규식으로 장날을 캐던 것보다 fairday 가 훨씬 정확하다 — 이걸 1순위로 쓴다.
    try {
      const d2 = await get(`${B}/detailIntro2?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${it.contentid}&contentTypeId=38`);
      intro = JSON.parse(d2).response.body.items.item[0] || {};
    } catch (e) { }
    const fair = clean(intro.fairday);
    const days = daysFromFair(fair) || daysOf(it.title, ov);
    const sido = sidoOf(it.lDongRegnCd, it.lDongSignguCd, it.addr1);
    out.push({
      id: it.contentid,
      name: clean(it.title),
      sido,
      city: (String(it.addr1 || '').split(' ')[1] || ''),
      addr: tidyAddr(clean(it.addr1), sido),
      x: +it.mapx || 0, y: +it.mapy || 0,
      img: it.firstimage || '',
      daysNum: days || [],
      days: days ? days.join('·') + '일' : '',
      fair,                                        // 공공데이터가 적어 준 장날 원문
      sale: clean(intro.saleitem).replace(/\s*\/\s*/g, ' · ').replace(/\s*등$/, '').slice(0, 90),
      open: clean(intro.opentime).slice(0, 60),
      rest: clean(intro.restdateshopping).slice(0, 50),
      park: clean(intro.parkingshopping).slice(0, 60),
      tel: clean(intro.infocentershopping).slice(0, 60),
      ov: tidyAddr(ov, sido).slice(0, 400)   // 개요 본문에도 「전남광주통합특별시」가 그대로 박혀 나온다
    });
    if ((i + 1) % 25 === 0) console.log('  수집', i + 1, '/', items.length);
    await sleep(110);
  }
  const withDays = out.filter(m => m.daysNum.length);
  console.log('  판매품목', out.filter(m => m.sale).length, '· 공식장날(fairday)', out.filter(m => m.fair).length,
    '· 영업시간', out.filter(m => m.open).length, '· 주차', out.filter(m => m.park).length, '· 문의처', out.filter(m => m.tel).length);
  const bySido = {}; out.forEach(m => bySido[m.sido || '(미상)'] = (bySido[m.sido || '(미상)'] || 0) + 1);
  console.log('✓ 시장', out.length, '곳 · 장날 확인', withDays.length, '곳(' + Math.round(withDays.length / out.length * 100) + '%)',
    '· 좌표', out.filter(m => m.x && m.y).length, '· 개요', out.filter(m => m.ov).length, '· 사진', out.filter(m => m.img).length);
  console.log('  시도별:', JSON.stringify(bySido));
  fs.writeFileSync(path.join(__dirname, 'data', 'markets_api.json'), JSON.stringify(out));
  console.log('✓ data/markets_api.json');
}
run().catch(e => { console.error('실패:', e.message); process.exit(1); });
