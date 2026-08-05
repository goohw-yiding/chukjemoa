// 연관 관광지("여기 간 사람들은 이것도 간다") → data/rlte.json
//  TarRlteTarService1/areaBasedList1 — signguCd 필수라 시군구별로 호출한다.
//  각 시도에서 방문자 상위 시군구 몇 곳만 조회해 호출 수를 아낀다.
//  실행: node fetch-rlte.js        (baseYm 자동 탐색, 주간 갱신에 포함)
const fs = require('fs'), path = require('path'), https = require('https');
const KEY = fs.readFileSync(path.join(__dirname, 'tourapi.key'), 'utf8').trim();
const B = 'https://apis.data.go.kr/B551011/TarRlteTarService1/areaBasedList1';
const TOP_SIGUNGU = Number(process.env.TOP_SIGUNGU || 4);  // 시도당 조회할 시군구 수
const KEEP = Number(process.env.KEEP || 12);               // 시도당 보관할 연관쌍 수

function get(u) {
  return new Promise((res, rej) => {
    https.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
    }).on('error', rej);
  });
}
async function call(baseYm, areaCd, signguCd, rows) {
  const u = `${B}?serviceKey=${KEY}&MobileOS=ETC&MobileApp=chukjemoa&_type=json`
    + `&numOfRows=${rows || 100}&pageNo=1&baseYm=${baseYm}&areaCd=${areaCd}&signguCd=${signguCd}`;
  try {
    const j = JSON.parse(await get(u));
    const b = j.response && j.response.body; if (!b) return [];
    let it = b.items && b.items.item; if (!it) return []; if (!Array.isArray(it)) it = [it];
    return it;
  } catch (e) { return []; }
}

// 최신 baseYm 탐색: 오늘부터 거슬러 올라가며 데이터가 있는 달을 찾는다(샘플=서울 종로구)
async function latestBaseYm() {
  const d = new Date();
  for (let i = 0; i < 14; i++) {
    const ym = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0');
    const r = await call(ym, '11', '11110', 1);
    if (r.length) return ym;
    d.setMonth(d.getMonth() - 1);
  }
  return null;
}

async function main() {
  const V = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'visitors.json'), 'utf8'));
  if (!V.bySido) { console.error('visitors.json에 bySido 없음 — fetch-visitors.js 먼저 실행'); process.exit(1); }

  const baseYm = await latestBaseYm();
  if (!baseYm) { console.error('가용 baseYm을 찾지 못함'); process.exit(1); }
  console.log('baseYm =', baseYm);

  const out = { baseYm, updated: new Date().toISOString().slice(0, 10), bySido: {} };
  let calls = 0;

  for (const [sidoNm, o] of Object.entries(V.bySido)) {
    const targets = o.kor.slice(0, TOP_SIGUNGU);
    const pairs = [];
    for (const t of targets) {
      const rows = await call(baseYm, o.code, t.code);
      calls++;
      for (const r of rows) {
        if (!r.tAtsNm || !r.rlteTatsNm) continue;
        if (r.tAtsNm === r.rlteTatsNm) continue;
        pairs.push({
          from: r.tAtsNm,
          to: r.rlteTatsNm,
          cat: r.rlteCtgryMclsNm || r.rlteCtgryLclsNm || '',
          sub: r.rlteCtgrySclsNm || '',
          sigungu: r.signguNm || t.name,
          rank: Number(r.rlteRank) || 99
        });
      }
      process.stdout.write('\r  ' + sidoNm + ' — ' + calls + '콜, 누적 ' + pairs.length + '쌍   ');
    }
    // ① 함께 많이 가는 곳: 연관 대상으로 몇 번 등장했는지 세면 그 지역의 '같이 들르는 장소'가 드러난다
    const freq = {};
    for (const p of pairs) {
      if (p.rank > 5) continue;
      const k = p.to;
      if (!freq[k]) freq[k] = { name: p.to, cat: p.cat, sub: p.sub, n: 0, withs: [] };
      freq[k].n++;
      if (freq[k].withs.length < 3 && !freq[k].withs.includes(p.from)) freq[k].withs.push(p.from);
    }
    const hot = Object.values(freq).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name))
      .filter(r => r.n >= 2).slice(0, KEEP)
      .map((r, i) => ({ rank: i + 1, name: r.name, cat: r.cat, sub: r.sub, n: r.n, withs: r.withs }));
    // ② 조합 예시(1~2위 연관, 출발지 중복 제거)
    const seen = {}, picked = [];
    for (const p of pairs.sort((a, b) => a.rank - b.rank)) {
      if (p.rank > 2) continue;
      if (seen[p.from]) continue;
      seen[p.from] = 1; picked.push({ from: p.from, to: p.to, cat: p.cat });
      if (picked.length >= 8) break;
    }
    out.bySido[sidoNm] = { hot, pairs: picked };
  }
  process.stdout.write('\n');
  fs.writeFileSync(path.join(__dirname, 'data', 'rlte.json'), JSON.stringify(out));
  const tot = Object.values(out.bySido).reduce((a, b) => a + b.hot.length, 0);
  console.log('저장 완료 | 호출', calls, '회 | 총', tot, '쌍 |', Object.keys(out.bySido).length, '개 시도');
  for (const k of ['서울', '부산', '강원']) {
    const l = out.bySido[k] || {};
    console.log(' ', k, ':', (l.hot || []).slice(0, 5).map(p => p.name + '(' + p.cat + '·' + p.n + ')').join(' / ') || '없음');
  }
}
main();
