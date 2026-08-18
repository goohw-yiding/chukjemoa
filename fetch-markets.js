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
function sidoOf(regnCd, signguCd) {
  const r = String(regnCd || '');
  if (r === '12') return /^[1-5]00$/.test(String(signguCd)) ? '광주' : '전남';
  return RCODE[r] || RCODE[r.slice(0, 2)] || '';
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
    let ov = '';
    try {
      const d = await get(`${B}/detailCommon2?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${it.contentid}`);
      ov = clean((JSON.parse(d).response.body.items.item[0] || {}).overview || '');
    } catch (e) { }
    const days = daysOf(it.title, ov);
    out.push({
      id: it.contentid,
      name: clean(it.title),
      sido: sidoOf(it.lDongRegnCd, it.lDongSignguCd),
      city: (String(it.addr1 || '').split(' ')[1] || ''),
      addr: clean(it.addr1),
      x: +it.mapx || 0, y: +it.mapy || 0,
      img: it.firstimage || '',
      daysNum: days || [],
      days: days ? days.join('·') + '일' : '',
      ov: ov.slice(0, 400)
    });
    if ((i + 1) % 25 === 0) console.log('  개요', i + 1, '/', items.length);
    await sleep(110);
  }
  const withDays = out.filter(m => m.daysNum.length);
  const bySido = {}; out.forEach(m => bySido[m.sido || '(미상)'] = (bySido[m.sido || '(미상)'] || 0) + 1);
  console.log('✓ 시장', out.length, '곳 · 장날 확인', withDays.length, '곳(' + Math.round(withDays.length / out.length * 100) + '%)',
    '· 좌표', out.filter(m => m.x && m.y).length, '· 개요', out.filter(m => m.ov).length, '· 사진', out.filter(m => m.img).length);
  console.log('  시도별:', JSON.stringify(bySido));
  fs.writeFileSync(path.join(__dirname, 'data', 'markets_api.json'), JSON.stringify(out));
  console.log('✓ data/markets_api.json');
}
run().catch(e => { console.error('실패:', e.message); process.exit(1); });
