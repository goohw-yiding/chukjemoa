// 전국 음식점 — TourAPI cat2=A0502 전체에서 카페(A05020900)를 뺀 것 → data/restaurants_{lang}.json
// ※ 카페는 이미 data/cafes_{lang}.json 에 따로 있다. 코스 엔진에서 둘을 합쳐 쓴다.
// ※ 실측(2026-08-09): A0502 전체 ko 8,660 · en 221 (카페 ko 2,040 포함된 수치)
// ※ detailIntro(39)에 opentimefood·restdatefood·firstmenu·parkingfood 가 있다 → 영업시간 한계 일부 해소
const fs = require('fs'), path = require('path'), https = require('https');
const readKey = f => { try { return fs.readFileSync(path.join(__dirname, f), 'utf8').trim(); } catch (e) { return ''; } };
const KEY = readKey('tourapi.key'), TWKEY = readKey('tourapi-tw.key') || KEY;

const LANGS = [
  { code: 'ko', svc: 'KorService2', ct: 39, key: KEY, introMax: 7000 },
  { code: 'en', svc: 'EngService2', ct: 82, key: KEY, introMax: 300 },
  { code: 'ja', svc: 'JpnService2', ct: 82, key: KEY, introMax: 300 },
  { code: 'zh', svc: 'ChsService2', ct: 82, key: KEY, introMax: 300 },
  { code: 'tw', svc: 'ChtService2', ct: 82, key: TWKEY, introMax: 300 }
];

const RCODE = { '11': '서울', '26': '부산', '27': '대구', '28': '인천', '29': '광주', '30': '대전', '31': '울산', '36': '세종', '41': '경기', '43': '충북', '44': '충남', '46': '전남', '47': '경북', '48': '경남', '50': '제주', '51': '강원', '52': '전북' };
function sidoOf(regnCd, signguCd) {
  const r = String(regnCd || '');
  if (r === '12') return /^[1-5]00$/.test(String(signguCd)) ? '광주' : '전남';
  return RCODE[r] || RCODE[r.slice(0, 2)] || '';
}

// 음식 종류 (cat3) — "먹기 중심" 코스의 선택 축
const KIND = {
  'A05020100': '한식', 'A05020200': '서양식', 'A05020300': '일식', 'A05020400': '중식',
  'A05020700': '이색음식', 'A05020900': '카페', 'A05021000': '클럽'
};
const CAFE = 'A05020900';

function get(u) {
  return new Promise((res, rej) => {
    https.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
      r.setEncoding('utf8');           // ⚠️ 한글 깨짐 방지 (전 프로젝트 공통 함정)
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
      + `&contentTypeId=${L.ct}&cat1=A05&cat2=A0502&arrange=A`;
    let txt; try { txt = await get(url); } catch (e) { console.error(L.code, 'req err', e.message); break; }
    let j; try { j = JSON.parse(txt); } catch (e) { console.error(L.code, 'parse err', txt.slice(0, 150)); break; }
    const b = j.response && j.response.body; if (!b) { console.error(L.code, 'no body', txt.slice(0, 150)); break; }
    total = Number(b.totalCount) || 0;
    let items = b.items && b.items.item; if (!items) break; if (!Array.isArray(items)) items = [items];
    all.push(...items);
    process.stdout.write(`\r[${L.code}] ${all.length}/${total}`);
    if (items.length < rows) break; page++; if (page > 120) break;
  }
  console.log('');

  const seen = new Set(), out = [];
  for (const it of all) {
    if (!it.contentid || seen.has(it.contentid)) continue; seen.add(it.contentid);
    if (!it.title) continue;
    if (it.cat3 === CAFE) continue;            // 카페는 cafes_*.json 담당
    out.push({
      id: it.contentid, title: clean(it.title), addr: clean(it.addr1),
      sido: sidoOf(it.lDongRegnCd, it.lDongSignguCd),
      regnCd: it.lDongRegnCd || '', signguCd: it.lDongSignguCd || '',
      kind: KIND[it.cat3] || '', cat3: it.cat3 || '',
      img: it.firstimage || '', x: it.mapx || '', y: it.mapy || '', tel: clean(it.tel),
      created: String(it.createdtime || '').slice(0, 8)
    });
  }

  const fpath = path.join(__dirname, 'data', `restaurants_${L.code}.json`);
  const cache = {};
  try { JSON.parse(fs.readFileSync(fpath, 'utf8')).forEach(m => { if (m._i || m.open) cache[m.id] = m; }); } catch (e) { }
  out.forEach(m => { const c = cache[m.id]; if (c) { m.open = c.open; m.rest = c.rest; m.menu = c.menu; m.park = c.park; m._i = 1; } });

  async function intro(cid) {
    const u = `${BASE}/detailIntro2?serviceKey=${L.key}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${cid}&contentTypeId=${L.ct}`;
    try {
      const j = JSON.parse(await get(u));
      const it = j.response && j.response.body && j.response.body.items;
      const d = it && it.item ? (Array.isArray(it.item) ? it.item[0] : it.item) : null;
      if (!d) return null;
      return {
        open: clean(d.opentimefood), rest: clean(d.restdatefood),
        menu: clean(d.firstmenu).slice(0, 60), park: clean(d.parkingfood)
      };
    } catch (e) { return null; }
  }
  const need = out.filter(m => !m._i).slice(0, L.introMax);
  for (let i = 0; i < need.length; i += 10) {
    const ch = need.slice(i, i + 10);
    const ds = await Promise.all(ch.map(m => intro(m.id)));
    ds.forEach((d, k) => { if (d) Object.assign(ch[k], d, { _i: 1 }); });
    if (i % 200 === 0 || i + 10 >= need.length) process.stdout.write(`\r[${L.code}] intro ${Math.min(i + 10, need.length)}/${need.length}`);
  }
  if (need.length) console.log('');
  out.forEach(m => { delete m._i; Object.keys(m).forEach(k => { if (m[k] === '' || m[k] == null) delete m[k]; }); });

  fs.writeFileSync(fpath, JSON.stringify(out));
  const has = f => out.filter(m => m[f]).length;
  console.log(`[${L.code}] 음식점 ${out.length}곳 · 좌표 ${out.filter(m => m.x).length} · 사진 ${has('img')} · 영업시간 ${has('open')}(${(has('open') / out.length * 100).toFixed(0)}%) · 휴무일 ${has('rest')} · 대표메뉴 ${has('menu')} · 시도미상 ${out.filter(m => !m.sido).length}`);
}

(async () => { for (const L of LANGS) { try { await run(L); } catch (e) { console.error(L.code, 'FAIL', e.message); } } })();
