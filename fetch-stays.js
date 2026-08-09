// 전국 숙박 — TourAPI contentTypeId=32(국문)/80(다국어) → data/stays_{lang}.json
// ※ 코스 기능의 전제 데이터. 2박3일 일정을 짜려면 "그날 밤 어디서 자나"가 있어야 한다.
// ※ 실측(2026-08-09): ko 2,978 · en 176 · ja/zh/tw 는 실행 시 출력 확인
// ⚠️ 가격·빈방 정보는 TourAPI에 없다. 예약은 외부에서 해야 한다고 페이지에 명시할 것.
const fs = require('fs'), path = require('path'), https = require('https');
const readKey = f => { try { return fs.readFileSync(path.join(__dirname, f), 'utf8').trim(); } catch (e) { return ''; } };
const KEY = readKey('tourapi.key'), TWKEY = readKey('tourapi-tw.key') || KEY;

const LANGS = [
  { code: 'ko', svc: 'KorService2', ct: 32, key: KEY, introMax: 3200 },
  { code: 'en', svc: 'EngService2', ct: 80, key: KEY, introMax: 300 },
  { code: 'ja', svc: 'JpnService2', ct: 80, key: KEY, introMax: 300 },
  { code: 'zh', svc: 'ChsService2', ct: 80, key: KEY, introMax: 300 },
  { code: 'tw', svc: 'ChtService2', ct: 80, key: TWKEY, introMax: 300 }
];

const RCODE = { '11': '서울', '26': '부산', '27': '대구', '28': '인천', '29': '광주', '30': '대전', '31': '울산', '36': '세종', '41': '경기', '43': '충북', '44': '충남', '46': '전남', '47': '경북', '48': '경남', '50': '제주', '51': '강원', '52': '전북' };
// ⚠️ TourAPI가 전남·광주를 '전남광주통합'(regnCd 12)으로 묶어 준다 — 명산·카페에서 겪은 것과 같은 함정
function sidoOf(regnCd, signguCd) {
  const r = String(regnCd || '');
  if (r === '12') return /^[1-5]00$/.test(String(signguCd)) ? '광주' : '전남';
  // ⚠️ 세종처럼 regnCd를 5자리 전체코드(36110)로 주는 경우 → 앞 2자리 폴백
  return RCODE[r] || RCODE[r.slice(0, 2)] || '';
}

// 숙박 유형 (cat3) — 코스에서 "저렴/가족/감성" 축으로 쓴다
const KIND = {
  'B02010100': '관광호텔', 'B02010500': '콘도미니엄', 'B02010600': '유스호스텔', 'B02010700': '펜션',
  'B02010900': '모텔', 'B02011000': '민박', 'B02011100': '게스트하우스', 'B02011200': '홈스테이',
  'B02011300': '서비스드레지던스', 'B02011600': '한옥', 'B02011700': '휴양펜션'
};

function get(u) {
  return new Promise((res, rej) => {
    https.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
      r.setEncoding('utf8');           // ⚠️ 없으면 청크 경계에서 한글이 U+FFFD로 깨진다
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
    }).on('error', rej);
  });
}
const clean = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim();

async function run(L) {
  const BASE = `https://apis.data.go.kr/B551011/${L.svc}`;
  const rows = 100; let page = 1, total = Infinity, all = [];
  while ((page - 1) * rows < total) {
    const url = `${BASE}/areaBasedList2?serviceKey=${L.key}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=${rows}&pageNo=${page}`
      + `&contentTypeId=${L.ct}&arrange=A`;
    let txt; try { txt = await get(url); } catch (e) { console.error(L.code, 'req err', e.message); break; }
    let j; try { j = JSON.parse(txt); } catch (e) { console.error(L.code, 'parse err', txt.slice(0, 150)); break; }
    const b = j.response && j.response.body; if (!b) { console.error(L.code, 'no body', txt.slice(0, 150)); break; }
    total = Number(b.totalCount) || 0;
    let items = b.items && b.items.item; if (!items) break; if (!Array.isArray(items)) items = [items];
    all.push(...items);
    process.stdout.write(`\r[${L.code}] ${all.length}/${total}`);
    if (items.length < rows) break; page++; if (page > 60) break;
  }
  console.log('');

  const seen = new Set(), out = [];
  for (const it of all) {
    if (!it.contentid || seen.has(it.contentid)) continue; seen.add(it.contentid);
    if (!it.title) continue;
    out.push({
      id: it.contentid, title: clean(it.title), addr: clean(it.addr1),
      sido: sidoOf(it.lDongRegnCd, it.lDongSignguCd),
      regnCd: it.lDongRegnCd || '', signguCd: it.lDongSignguCd || '',
      kind: KIND[it.cat3] || '', cat3: it.cat3 || '',
      img: it.firstimage || '', x: it.mapx || '', y: it.mapy || '', tel: clean(it.tel),
      created: String(it.createdtime || '').slice(0, 8)
    });
  }

  // 기존 파일의 detailIntro 캐시 재사용 — 재실행 시 호출 절약
  const fpath = path.join(__dirname, 'data', `stays_${L.code}.json`);
  const cache = {};
  try { JSON.parse(fs.readFileSync(fpath, 'utf8')).forEach(m => { if (m.ci || m._i) cache[m.id] = m; }); } catch (e) { }
  out.forEach(m => { const c = cache[m.id]; if (c) { m.ci = c.ci; m.co = c.co; m.park = c.park; m.rooms = c.rooms; m._i = 1; } });

  async function intro(cid) {
    const u = `${BASE}/detailIntro2?serviceKey=${L.key}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${cid}&contentTypeId=${L.ct}`;
    try {
      const j = JSON.parse(await get(u));
      const it = j.response && j.response.body && j.response.body.items;
      const d = it && it.item ? (Array.isArray(it.item) ? it.item[0] : it.item) : null;
      if (!d) return null;
      return { ci: clean(d.checkintime), co: clean(d.checkouttime), park: clean(d.parkinglodging), rooms: clean(d.roomcount) };
    } catch (e) { return null; }
  }
  const need = out.filter(m => !m._i).slice(0, L.introMax);
  for (let i = 0; i < need.length; i += 10) {
    const ch = need.slice(i, i + 10);
    const ds = await Promise.all(ch.map(m => intro(m.id)));
    ds.forEach((d, k) => { if (d) Object.assign(ch[k], d, { _i: 1 }); });
    process.stdout.write(`\r[${L.code}] intro ${Math.min(i + 10, need.length)}/${need.length}`);
  }
  if (need.length) console.log('');
  out.forEach(m => { delete m._i; Object.keys(m).forEach(k => { if (m[k] === '' || m[k] == null) delete m[k]; }); });

  fs.writeFileSync(fpath, JSON.stringify(out));
  const has = f => out.filter(m => m[f]).length;
  console.log(`[${L.code}] 숙박 ${out.length}곳 · 좌표 ${out.filter(m => m.x).length} · 사진 ${has('img')} · 체크인 ${has('ci')} · 유형 ${has('kind')} · 시도미상 ${out.filter(m => !m.sido).length}`);
}

(async () => { for (const L of LANGS) { try { await run(L); } catch (e) { console.error(L.code, 'FAIL', e.message); } } })();
