// 🍊 제주데이터허브 수집기 — data/jeju_hub.json 하나에 6종을 담는다.
//
// 왜 6종만인가 (2026-09-04 13종 전수 실측)
//   ✅ 올레길 26코스(휠체어·길이·소요시간) · 박물관/미술관 129 · 오름 372 · 캠핑 85 ·
//      한라산둘레길 8 · 관광지별 유입자 389행(2024)
//   ❌ 농어촌체험마을(2010년) · 시도별문화재(2016년·전국 집계표) · 카셰어링(업체 위치뿐) ·
//      관광숙박업(예약사이트가 이긴다) · 해수욕장수질(2021년)
//   🔴 **목록의 「수정일 2025-09-30」은 데이터 «내용»의 신선도가 아니다.** 안을 열면 2010·2016·2021년이었다.
//      → 새 데이터는 반드시 «날짜 필드»를 먼저 보고 쓸지 정한다.
//
// ⚠️ 이 서버는 **같은 요청을 약 30% 확률로 502**로 죽인다(헤더·파라미터 탓이 아님을 3회 반복으로 확인).
//    재시도 없이 쓰면 **데이터가 조용히 절반만** 들어온다.
// ⚠️ 유입자 수는 `startDate`/`endDate`(YYYYMMDD)가 **필수**다. 없으면 502가 나서
//    「데이터 없음」으로 오판하기 쉽다 — 파라미터를 바꿔 400을 받아야 이유가 나온다.
//
// 실행: node fetch-jeju.js
const fs = require('fs'), path = require('path'), https = require('https');
const KEY = (() => { try { return fs.readFileSync(path.join(__dirname, 'jejuhub.key'), 'utf8').trim(); } catch (e) { return ''; } })();
if (!KEY) { console.log('🔴 jejuhub.key 가 없습니다 (C:\\dev\\chukjemoa\\jejuhub.key)'); process.exit(1); }
const IDS = JSON.parse(fs.readFileSync(path.join(__dirname, 'jejuhub-ids.json'), 'utf8')).datasets;
const pid = name => (IDS.find(d => d.name.includes(name)) || {}).proxy;

const OUT = path.join(__dirname, 'data', 'jeju_hub.json');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const KST = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

const get = u => new Promise(res => {
  https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0 chukjemoa/1.0 (+https://chukjemoa.co.kr)', 'Accept': 'application/json' }, timeout: 30000 },
    r => { r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res({ s: r.statusCode, d })); })
    .on('error', e => res({ s: 0, d: e.message })).on('timeout', function () { this.destroy(new Error('timeout')); });
});

/** 한 쪽 호출 — 5xx 는 「데이터 없음」이 아니라 「지금 서버가 안 되는 것」이라 다시 부른다.
 *  4xx 는 재시도해도 같으니 본문을 그대로 돌려준다(이유가 거기 있다). */
async function page(proxy, q, tries = 10) {
  let last = '';
  for (let i = 1; i <= tries; i++) {
    const r = await get(`https://open.jejudatahub.net/api/proxy/${proxy}/${KEY}${q}`);
    if (r.s === 200) { try { return { ok: JSON.parse(r.d) }; } catch (e) { last = '파싱 실패'; } }
    else if (r.s >= 400 && r.s < 500) return { err: `HTTP ${r.s} ${String(r.d).split(KEY).join('***').slice(0, 160)}` };
    else last = `HTTP ${r.s}`;
    await sleep(600 * i);
  }
  return { err: `${tries}회 재시도 실패 (${last})` };
}

/** 전량 수집 */
async function all(name, extra = '') {
  const proxy = pid(name);
  if (!proxy) { console.log(`  🔴 ${name} — jejuhub-ids.json 에 없음`); return []; }
  const rows = [];
  for (let n = 1; n <= 30; n++) {
    const r = await page(proxy, `?number=${n}&limit=100${extra}`);
    if (r.err) { console.log(`  🔴 ${name} ${n}쪽 — ${r.err}`); break; }
    const j = r.ok, got = j.data || [];
    rows.push(...got);
    if (!j.hasMore || !got.length) break;
    await sleep(400);
  }
  console.log(`  ✓ ${name.padEnd(16)} ${rows.length}건`);
  return rows;
}

const num = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };
const jeju = o => /^제주특별자치도/.test(String(o.addressJibun || o.addressDoro || ''));

(async () => {
  console.log('제주데이터허브 수집 시작 (서버가 30% 확률로 502 — 재시도 10회)');

  // ── ① 위치형 4종: placeName/category/addressJibun/addressDoro/lon/lat/placeUrl
  const place = (rows, kind) => {
    const seen = new Set(), out = [];
    for (const o of rows) {
      const t = String(o.placeName || '').trim();
      if (!t || !jeju(o)) continue;
      const k = t.replace(/\s/g, '');
      if (seen.has(k)) continue;              // 이름 중복 제거(같은 오름이 여러 번 등록돼 있다)
      seen.add(k);
      out.push({
        kind, title: t, cat: o.category || '',
        addr: o.addressDoro && String(o.addressDoro).trim() ? o.addressDoro : o.addressJibun,
        addrJibun: o.addressJibun || '',
        x: num(o.longitude), y: num(o.latitude), url: o.placeUrl || ''
      });
    }
    return out.filter(o => o.x && o.y);
  };

  const oreum = place(await all('오름 위치'), 'oreum');
  const museum = place(await all('박물관 및 미술관'), 'museum');
  const camp = place(await all('캠핑 가능 장소'), 'camping');

  // ── ② 올레길 — ⭐ 이 데이터가 제일 좋다. 휠체어 가능 여부까지 있다.
  const olleRaw = await all('올레길 위치');
  const olle = olleRaw.map(o => ({
    no: String(o.courseNumber || '').trim(),
    name: String(o.courseName || '').trim(),
    wheelchair: o.wheelchairCourseFlag === true,
    start: o.startPoint, sx: num(o.startLongitude), sy: num(o.startLatitude),
    end: o.endPoint, ex: num(o.endLongitude), ey: num(o.endLatitude),
    km: num(o.courseLength), hours: String(o.estimatedTime || '').trim()
  })).filter(o => o.no && o.name);

  // ── ③ 한라산 둘레길
  const dulle = (await all('한라산 둘레길')).map(o => ({
    name: String(o.courseName || '').trim(), km: num(o.distance),
    start: o.startPoint, end: o.endPoint
  })).filter(o => o.name);

  // ── ④ 관광지별 유입자 — ⚠️ startDate/endDate 필수. 2025년은 0건이라 2024년을 받는다.
  const YEAR = '2024';
  const dateQ = `&startDate=${YEAR}0101&endDate=${YEAR}1231`;
  const kor = await all('관광지별 내국인', dateQ);
  const frn = await all('관광지별 외국인', dateQ);
  const roll = rows => {                       // 월별 행 → 관광지별 연간 합계
    const m = new Map();
    for (const r of rows) {
      const n = String(r.sightsName || '').trim(); if (!n) continue;
      const p = m.get(n) || { name: n, pay: r.payType || '', cnt: 0, months: 0 };
      p.cnt += Number(r.userCnt) || 0; p.months++;
      m.set(n, p);
    }
    return [...m.values()].sort((a, b) => b.cnt - a.cnt);
  };
  const visitors = { year: YEAR, kor: roll(kor), frn: roll(frn) };

  const out = {
    generated: KST(),
    source: '제주데이터허브(제주테크노파크) — 카카오위치서비스·제주올레·제주특별자치도',
    note: '농어촌체험마을(2010년)·시도별문화재(2016년)·해수욕장수질(2021년)·카셰어링·관광숙박업은 «내용이 오래됐거나 각도가 맞지 않아» 담지 않았다.',
    oreum, museum, camping: camp, olle, dulle, visitors
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1), 'utf8');
  console.log(`\n→ data/jeju_hub.json (${(fs.statSync(OUT).size / 1024).toFixed(0)}KB)`);
  console.log(`   오름 ${oreum.length} · 박물관 ${museum.length} · 캠핑 ${camp.length} · 올레 ${olle.length}코스 · 둘레길 ${dulle.length}코스`);
  console.log(`   ${YEAR} 유입자 — 내국인 ${visitors.kor.length}곳 · 외국인 ${visitors.frn.length}곳`);
  if (visitors.kor.length) console.log(`   붐빔 1~5위(내국인): ${visitors.kor.slice(0, 5).map(o => `${o.name} ${o.cnt.toLocaleString()}`).join(' · ')}`);
  // 빈 축이 생기면 조용히 넘어가지 않는다 — 한 종이라도 0이면 눈에 띄게 알린다.
  for (const [k, v] of [['오름', oreum], ['박물관', museum], ['캠핑', camp], ['올레', olle], ['둘레길', dulle]])
    if (!v.length) console.log(`   🔴 ${k}가 0건입니다 — 서버 오류이거나 프록시ID가 바뀌었을 수 있습니다`);
})();
