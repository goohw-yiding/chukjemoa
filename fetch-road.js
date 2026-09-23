// 근처 볼거리 도로거리 수집기 — NAVER Directions 5 (건당 5원, 무료 한도 없음)
// 사용: node fetch-road.js plan          → 호출 0, 필요한 쌍 수·예상 비용만
//       node fetch-road.js run <상한>    → 캐시에 없는 쌍만, 상한까지 (기본 0 = 안 돎)
// ⛔ 상한 없이 돌지 않는다. 연속 오류 5건이면 즉시 멈춘다(과거 한도초과로 2,500번 헛돈 적 있음).
// 새 축제가 들어오면 그 축제만 캐시가 비어 옛 방식(직선)으로 나가고, 다음 run 에서 채워진다.
const fs = require('fs'), https = require('https'), path = require('path');
const R = require('./road.js');
const CFG = JSON.parse(fs.readFileSync('C:\\dev\\ncp_maps\\config.json', 'utf8'));
const MODE = process.argv[2] || 'plan';
const CAP = MODE === 'run' ? Number(process.argv[3] || 0) : 0;
const load = f => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { return []; } };

let cache = {}; try { cache = JSON.parse(fs.readFileSync(R.FILE, 'utf8')); } catch (e) { }

const SETS = [
  ['ja', load('festivals_ja.json'), require('./ja-nearby.js').places()],
  ['en', load('festivals_en.json'), require('./en-nearby.js').places()],
];
const need = new Map();
for (const [l, F, P] of SETS) {
  let n = 0;
  for (const f of F) for (const x of R.needs(f, P)) { n++; if (!need.has(x.key)) need.set(x.key, x); }
  console.log(`[${l}] 축제 ${F.length} · 호출 대상 쌍 ${n}`);
}
const todo = [...need.values()].filter(x => !cache[x.key]);
console.log(`고유 쌍 ${need.size} · 캐시 있음 ${need.size - todo.length} · 남은 것 ${todo.length} (약 ${todo.length * 5}원) · 이번 상한 ${CAP}`);

const drive = (f, p) => new Promise(res => {
  const q = `/map-direction/v1/driving?start=${f.x},${f.y}&goal=${p.x},${p.y}&option=traoptimal`;
  https.get({ host: 'maps.apigw.ntruss.com', path: q, headers: {
    'x-ncp-apigw-api-key-id': CFG.client_id.trim(), 'x-ncp-apigw-api-key': CFG.client_secret.trim() } },
    r => { let b = ''; r.on('data', c => b += c); r.on('end', () => {
      if (r.statusCode !== 200) return res({ err: 'HTTP ' + r.statusCode + ' ' + b.slice(0, 120) });
      try { const j = JSON.parse(b);
        if (j.code === 0) { const s = j.route.traoptimal[0].summary; return res({ m: s.distance, ms: s.duration }); }
        // 1 = 출발지=도착지 · 2~5 = 경로 없음/좌표 주변 도로 없음 → 「도로로 못 간다」는 사실로 저장(재호출 안 함)
        if ([1, 2, 3, 4, 5].includes(j.code)) return res({ none: true, code: j.code });
        res({ err: 'code ' + j.code + ' ' + (j.message || '') });
      } catch (e) { res({ err: 'parse' }); }
    }); }).on('error', e => res({ err: e.code || e.message }));
});

(async () => {
  if (!CAP) return;
  let used = 0, errs = 0, streak = 0, none = 0;
  for (const x of todo) {
    if (used >= CAP) { console.log('⛔ 상한 도달'); break; }
    const r = await drive(x.f, x.p); used++;
    if (r.err) { errs++; console.log('  오류:', r.err); if (++streak >= 5) { console.log('⛔ 연속 오류 5 — 중단'); break; } }
    else { streak = 0; if (r.none) none++; cache[x.key] = { ...r, at: new Date().toISOString().slice(0, 10) }; }
    if (used % 200 === 0) { fs.writeFileSync(R.FILE, JSON.stringify(cache)); console.log(`  ${used}건 저장 (오류 ${errs})`); }
    await new Promise(z => setTimeout(z, 120));
  }
  fs.writeFileSync(R.FILE, JSON.stringify(cache));
  console.log(`\n호출 ${used} · 오류 ${errs} · 경로없음 ${none} · 캐시 ${Object.keys(cache).length} · 비용 약 ${used * 5}원`);
})();
