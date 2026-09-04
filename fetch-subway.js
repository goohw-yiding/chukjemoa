// 🚇 수도권 지하철역 — data/subway.json  (서울열린데이터광장, `seoul.key` 하나로 다 된다)
//
// 왜 만드나 — **구글맵은 한국 안에서 길찾기가 안 된다.** 그래서 외국인은 이름을 복사해
//   네이버·카카오 지도에 붙여넣어야 하는데, 「Hongik Univ.」로 알고 있는 역의 **한글은 「홍대입구」**다.
//   그 대조를 주는 곳이 거의 없다. 우리는 이미 «붙여넣을 한글주소»를 주고 있으니 그것의 지하철판이다.
//
// ⭐ 실측(2026-09-04): 우리 콘텐츠가 실제로 역 옆에 있다 —
//    서울 문화행사 1,047건 중 **96%가 도보권**(620건은 5분 이내) · 축제 75% · places_en/ja 64~66%
//
// ⚠️ **역명을 합칠 땐 괄호를 뗀다.** 좌표 쪽은 「청량리(서울시립대입구)」처럼 부기명이 붙어 있어서
//    그대로 맞추면 580역, 괄호를 떼면 **777/784(99%)** 가 맞는다.
// ⚠️ 되는 API / 안 되는 API (실물 확인)
//    ✅ SearchSTNBySubwayLineInfo(역명 국·영·중·일 799) · subwayStationMaster(좌표 784)
//    ✅ tbTraficElvtr(엘리베이터 552노드 → 271역)
//    🔴 코인로커 3종·화장실·편의시설은 전부 HTTP 500 — 없는 걸 있다고 하지 않는다.
// ⚠️ 서울·경기·인천 전용이다(39개 노선). 부산·대구 지하철은 이 키로 안 나온다.
//
// 실행: node fetch-subway.js
const fs = require('fs'), path = require('path'), http = require('http');

const KEY = (() => { try { return fs.readFileSync(path.join(__dirname, 'seoul.key'), 'utf8').trim(); } catch (e) { return ''; } })();
if (!KEY) { console.log('⛔ seoul.key 가 없습니다 (프로젝트폴더·C:\\dev 양쪽에 두세요)'); process.exit(1); }
const OUT = path.join(__dirname, 'data', 'subway.json');
const KST = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

const get = u => new Promise(res => {
  http.get(u, { headers: { 'User-Agent': 'chukjemoa' }, timeout: 25000 }, r => {
    r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
  }).on('error', () => res('')).on('timeout', function () { this.destroy(new Error('timeout')); });
});

/** 전량 수집 — 서울 API 는 한 번에 1,000건 */
async function all(svc) {
  const out = [];
  for (let i = 1; i <= 6000; i += 1000) {
    const d = await get(`http://openapi.seoul.go.kr:8088/${KEY}/json/${svc}/${i}/${i + 999}`);
    let j = null; try { j = JSON.parse(d); } catch (e) { break; }
    const body = j[Object.keys(j)[0]] || {};
    if (j.RESULT) { console.log(`  🔴 ${svc} — ${j.RESULT.CODE} ${j.RESULT.MESSAGE}`); break; }
    const rows = body.row || [];
    out.push(...rows);
    if (out.length >= (body.list_total_count || 0) || !rows.length) break;
    await new Promise(r => setTimeout(r, 250));
  }
  return out;
}

// ⭐ 괄호 부기명을 떼고 맞춘다. 「역」도 뗀다(원본엔 안 붙어 있지만 방어).
const base = s => String(s || '').replace(/\(.*?\)/g, '').replace(/\s/g, '').replace(/역$/, '');

(async () => {
  console.log('🚇 수도권 지하철역 수집');
  const nm = await all('SearchSTNBySubwayLineInfo');   // 국·영·중·일 역명
  const loc = await all('subwayStationMaster');        // 좌표·노선
  const ev = await all('tbTraficElvtr');               // 엘리베이터
  console.log(`  역명 ${nm.length} · 좌표 ${loc.length} · 엘리베이터 노드 ${ev.length}`);
  if (!nm.length || !loc.length) { console.log('🔴 재료가 비어 저장하지 않습니다'); process.exit(1); }

  const byName = new Map();
  for (const o of nm) { const k = base(o.STATION_NM); if (k && !byName.has(k)) byName.set(k, o); }

  // 엘리베이터가 있는 역 이름 집합
  const evSt = new Set(ev.map(o => base(o.SBWY_STN_NM)).filter(Boolean));

  const uniq = new Map();
  let matched = 0; const miss = [];
  for (const o of loc) {
    const k = base(o.BLDN_NM);
    const m = byName.get(k);
    if (!m) { miss.push(o.BLDN_NM); continue; }
    matched++;
    const prev = uniq.get(k);
    if (prev) {                                  // 환승역 — 노선만 더한다
      if (o.ROUTE && !prev.lines.includes(o.ROUTE)) prev.lines.push(o.ROUTE);
      continue;
    }
    if (!+o.LAT || !+o.LOT) continue;
    uniq.set(k, {
      ko: String(o.BLDN_NM).trim(),              // ← 지도에 붙여넣을 한글(부기명 포함, 원본 그대로)
      en: m.STATION_NM_ENG || '', jp: m.STATION_NM_JPN || '', cn: m.STATION_NM_CHN || '',
      lines: o.ROUTE ? [o.ROUTE] : [],
      elev: evSt.has(k),                          // 엘리베이터 있는 역
      y: +o.LAT, x: +o.LOT
    });
  }
  const rows = [...uniq.values()].sort((a, b) => a.ko.localeCompare(b.ko, 'ko'));

  // ⚠️ 「경고가 통과했다」가 아니라 «결과의 미스율»을 센다.
  const noEn = rows.filter(r => !r.en).length, noJp = rows.filter(r => !r.jp).length, noCn = rows.filter(r => !r.cn).length;
  const nElev = rows.filter(r => r.elev).length;
  const lines = new Set(); rows.forEach(r => r.lines.forEach(l => lines.add(l)));

  fs.writeFileSync(OUT, JSON.stringify({
    generated: KST(),
    source: '서울열린데이터광장 — SearchSTNBySubwayLineInfo(역명 4개국어) · subwayStationMaster(좌표) · tbTraficElvtr(엘리베이터)',
    note: '서울·경기·인천 전용. 물품보관함·화장실 API 는 전부 HTTP 500 이라 담지 못했다.',
    rows
  }, null, 1), 'utf8');

  console.log(`→ data/subway.json — 고유역 ${rows.length} · ${lines.size}개 노선 · 엘리베이터 ${nElev}역`);
  console.log(`   이름 매칭 ${matched}/${loc.length} (${(matched / loc.length * 100).toFixed(0)}%) · 못 맞춘 것 ${miss.length}: ${miss.slice(0, 8).join(', ')}`);
  console.log(`   빈 역명 — 영 ${noEn} · 일 ${noJp} · 중 ${noCn}`);
  if (noEn + noJp + noCn > rows.length * 0.05) console.log('   🔴 외국어 역명이 5% 넘게 비었습니다 — 원본을 확인하세요');
  if (matched / loc.length < 0.9) console.log('   🔴 매칭률이 90% 미만입니다 — 괄호 처리 규칙이 바뀌었는지 확인하세요');
})();
