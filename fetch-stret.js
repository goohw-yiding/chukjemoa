// 전국길관광정보표준데이터 → data/stret.json
//  둘레길·올레·숲길·골목길 등 전국 1,300여 개 길. 두루누비(코리아둘레길 4노선)보다 훨씬 넓다.
//  키: stret.key (gitignore). 개발계정 1,000회/일 — 전량 3회면 충분.
//  실행: node fetch-stret.js
const fs = require('fs'), path = require('path'), https = require('https');
const KEY = fs.readFileSync(path.join(__dirname, 'stret.key'), 'utf8').trim();
const EP = 'https://api.data.go.kr/openapi/tn_pubr_public_stret_tursm_info_api';

function get(u) {
  return new Promise((res, rej) => {
    const q = https.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
      r.setEncoding('utf8');           // ★ 청크 경계 한글 깨짐 방지
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
    });
    q.on('error', rej);
    q.setTimeout(30000, () => { q.destroy(); rej(new Error('timeout')); });
  });
}
const SIDO_ALIAS = { '충청북도': '충북', '충청남도': '충남', '전라북도': '전북', '전북특별자치도': '전북', '전라남도': '전남', '경상북도': '경북', '경상남도': '경남', '강원특별자치도': '강원', '강원도': '강원', '제주특별자치도': '제주', '서울특별시': '서울', '부산광역시': '부산', '대구광역시': '대구', '인천광역시': '인천', '광주광역시': '광주', '대전광역시': '대전', '울산광역시': '울산', '세종특별자치시': '세종', '경기도': '경기' };
function parseAddr(addr, instt) {
  const s = String(addr || '').trim();
  for (const k in SIDO_ALIAS) {
    if (s.indexOf(k) === 0) {
      const rest = s.slice(k.length).trim();
      const gu = (rest.match(/^(\S+?[시군구])/) || [])[1] || '';
      return { sido: SIDO_ALIAS[k], sigungu: gu };
    }
  }
  // 주소가 없으면 관리기관명에서 추정 (예: '경상남도 통영시청')
  const t = String(instt || '').trim();
  for (const k in SIDO_ALIAS) {
    if (t.indexOf(k) === 0) {
      const gu = (t.slice(k.length).trim().match(/^(\S+?[시군구])/) || [])[1] || '';
      return { sido: SIDO_ALIAS[k], sigungu: gu };
    }
  }
  return { sido: '', sigungu: '' };
}
function clean(s) {
  return String(s || '').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/[　�]/g, ' ')     // 전각공백·손상문자 제거
    .replace(/\s+/g, ' ').trim();
}

function toMin(s) {
  const t = String(s || '');
  const h = (t.match(/(\d+)\s*시간/) || [])[1];
  const m = (t.match(/(\d+)\s*분/) || [])[1];
  const n = (!h && !m) ? (t.match(/^(\d+(?:\.\d+)?)$/) || [])[1] : null;
  if (n) return Math.round(+n * 60);
  return (h ? +h * 60 : 0) + (m ? +m : 0);
}
async function main() {
  const first = JSON.parse(await get(`${EP}?serviceKey=${KEY}&pageNo=1&numOfRows=1&type=json`));
  const total = Number(first.body.totalCount) || 0;
  console.log('전체', total, '건');
  const raw = [];
  for (let p = 1; (p - 1) * 500 < total && p <= 20; p++) {
    const j = JSON.parse(await get(`${EP}?serviceKey=${KEY}&pageNo=${p}&numOfRows=500&type=json`));
    let it = j.body && j.body.items && j.body.items.item; if (!it) break;
    if (!Array.isArray(it)) it = [it];
    raw.push(...it);
    process.stdout.write('\r수집 ' + raw.length + '/' + total);
    if (it.length < 500) break;
  }
  process.stdout.write('\n');

  const seen = new Set(), out = [];
  for (const r of raw) {
    const name = clean(r.stretNm);
    if (!name) continue;
    const { sido, sigungu } = parseAddr(r.beginRdnmadr || r.beginLnmadr, r.insttNm || r.institutionNm);
    const key = name + '|' + sido + '|' + sigungu;
    if (seen.has(key)) continue;         // 같은 길이 중복 등록된 경우 제거
    seen.add(key);
    const course = clean(r.coursInfo);
    out.push({
      id: 'S' + (out.length + 1),
      name,
      intro: clean(r.stretIntrcn).slice(0, 400),
      km: Math.round((parseFloat(r.stretLt) || 0) * 10) / 10,
      time: clean(r.reqreTime),
      min: toMin(r.reqreTime),
      begin: clean(r.beginSpotNm),
      end: clean(r.endSpotNm),
      addr: clean(r.beginRdnmadr || r.beginLnmadr),
      // 경유지: '-' 구분 문자열을 배열로
      spots: course ? course.split(/\s*[-–~>→]\s*/).map(s => s.trim()).filter(s => s.length > 1).slice(0, 40) : [],
      tel: clean(r.phoneNumber),
      org: clean(r.institutionNm || r.insttNm),
      sido, sigungu,
      // ★ 거리 신뢰도 — 지자체 입력 오류가 섞여 있다
      //   (갈맷길 6코스 449km/13시간=시속 34km, 방배사이길 350km/10분)
      //   도보 속도(보통 3~5km/h)로 검증해 8km/h를 넘으면 거리를 믿지 않는다.
      kmOk: (() => {
        const _km = Math.round((parseFloat(r.stretLt) || 0) * 10) / 10;
        const _mn = toMin(r.reqreTime);
        if (!_km) return false;
        if (_mn > 0) return (_km / (_mn / 60)) <= 8;
        return _km <= 100;      // 소요시간이 없으면 100km 이하만 신뢰
      })(),
      updated: clean(r.referenceDate)
    });
  }
  fs.writeFileSync(path.join(__dirname, 'data', 'stret.json'), JSON.stringify(out));
  const bySido = {}; out.forEach(t => bySido[t.sido || '(미상)'] = (bySido[t.sido || '(미상)'] || 0) + 1);
  console.log('저장:', out.length, '개 길 (중복 제거', raw.length - out.length, '건)');
  console.log('시도별:', Object.entries(bySido).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' | '));
  console.log('경유지 보유:', out.filter(t => t.spots.length).length, '| 소개 보유:', out.filter(t => t.intro).length, '| 거리 보유:', out.filter(t => t.km > 0).length);
}
main();
