// 전국 산(명산) — TourAPI 관광지 중 cat3=A01010400(자연>자연관광지>산) → data/mountains_{lang}.json
// ※ 추가 활용신청 불필요. 이미 승인된 Kor/Eng/Jpn/Chs/Cht 서비스로 전부 된다.
//   국문은 contentTypeId=12, 다국어는 76 (다국어 서비스는 코드 체계가 다르다 — 실측 확인함)
const fs = require('fs'), path = require('path'), https = require('https');
const readKey = f => { try { return fs.readFileSync(path.join(__dirname, f), 'utf8').trim(); } catch (e) { return ''; } };
const KEY = readKey('tourapi.key'), TWKEY = readKey('tourapi-tw.key') || KEY;

const LANGS = [
  { code: 'ko', svc: 'KorService2', ct: 12, key: KEY },
  { code: 'en', svc: 'EngService2', ct: 76, key: KEY },
  { code: 'ja', svc: 'JpnService2', ct: 76, key: KEY },
  { code: 'zh', svc: 'ChsService2', ct: 76, key: KEY },
  { code: 'tw', svc: 'ChtService2', ct: 76, key: TWKEY }
];
// lDongRegnCd → 시도명(국문 기준). 다국어는 주소에서 못 뽑을 때가 있어 코드로 맞춘다.
const RCODE = { '11': '서울', '26': '부산', '27': '대구', '28': '인천', '29': '광주', '30': '대전', '31': '울산', '36': '세종', '41': '경기', '43': '충북', '44': '충남', '46': '전남', '47': '경북', '48': '경남', '50': '제주', '51': '강원', '52': '전북' };

function get(u) {
  return new Promise((res, rej) => {
    https.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
      r.setEncoding('utf8');           // ⚠️ 없으면 청크 경계에서 한글이 깨진다
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
      + `&contentTypeId=${L.ct}&cat1=A01&cat2=A0101&cat3=A01010400&arrange=A`;
    let txt; try { txt = await get(url); } catch (e) { console.error(L.code, 'req err', e.message); break; }
    let j; try { j = JSON.parse(txt); } catch (e) { console.error(L.code, 'parse err', txt.slice(0, 150)); break; }
    const b = j.response && j.response.body; if (!b) { console.error(L.code, 'no body', txt.slice(0, 150)); break; }
    total = Number(b.totalCount) || 0;
    let items = b.items && b.items.item; if (!items) break; if (!Array.isArray(items)) items = [items];
    all.push(...items);
    process.stdout.write(`\r[${L.code}] ${all.length}/${total}`);
    if (items.length < rows) break; page++; if (page > 30) break;
  }
  console.log('');
  const seen = new Set(), out = [];
  for (const it of all) {
    if (!it.contentid || seen.has(it.contentid)) continue; seen.add(it.contentid);
    if (!it.title) continue;
    const addr = clean(it.addr1);
    out.push({
      id: it.contentid, title: clean(it.title), addr,
      sido: RCODE[it.lDongRegnCd] || '', sigungu: clean(it.lDongSignguCd ? '' : ''),
      regnCd: it.lDongRegnCd || '', signguCd: it.lDongSignguCd || '',
      img: it.firstimage || '', x: it.mapx || '', y: it.mapy || '', tel: clean(it.tel)
    });
  }
  // 개요(overview)는 국문만 채운다 — 다국어는 건수가 적어 전량, 국문은 상위 200개만(호출 절약)
  const fpath = path.join(__dirname, 'data', `mountains_${L.code}.json`);
  const cache = {};
  try { JSON.parse(fs.readFileSync(fpath, 'utf8')).forEach(m => { if (m.ov) cache[m.id] = m.ov; }); } catch (e) { }
  out.forEach(m => { if (cache[m.id]) m.ov = cache[m.id]; });
  async function common(cid) {
    const u = `${BASE}/detailCommon2?serviceKey=${L.key}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${cid}`;
    try {
      const j = JSON.parse(await get(u));
      const it = j.response && j.response.body && j.response.body.items;
      const d = it && it.item ? (Array.isArray(it.item) ? it.item[0] : it.item) : null;
      if (!d) return null;
      return { ov: clean(d.overview).slice(0, 500), addr: clean(d.addr1) };
    } catch (e) { return null; }
  }
  const need = out.filter(m => !m.ov).slice(0, L.code === 'ko' ? 340 : 120);
  for (let i = 0; i < need.length; i += 10) {
    const ch = need.slice(i, i + 10);
    const ds = await Promise.all(ch.map(m => common(m.id)));
    ds.forEach((d, k) => { if (d) { if (d.ov) ch[k].ov = d.ov; if (!ch[k].addr && d.addr) ch[k].addr = d.addr; } });
    process.stdout.write(`\r[${L.code}] overview ${Math.min(i + 10, need.length)}/${need.length}`);
  }
  console.log('');
  fs.writeFileSync(fpath, JSON.stringify(out));
  console.log(`[${L.code}] 산 ${out.length}곳 저장 · 개요 ${out.filter(m => m.ov).length}건 · 사진 ${out.filter(m => m.img).length}건`);
}

(async () => { for (const L of LANGS) { try { await run(L); } catch (e) { console.error(L.code, 'FAIL', e.message); } } })();
