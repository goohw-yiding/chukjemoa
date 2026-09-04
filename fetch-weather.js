// 🌤 축제 «당일 날씨» 예보 수집 → data/weather.json
//
// 왜 (2026-09-03)
//   같은 이름을 쓰는 경쟁사(travel-info.co.kr)가 카드에 「23°C · 대체로 맑음」을 붙여 두고 있었다.
//   ⭐ 야외 축제에서 날씨는 «갈지 말지»를 정하는 정보다. 일정·장소보다 뒤에 볼 이유가 없다.
//
// 왜 Open-Meteo 인가
//   기상청 단기예보(data.go.kr)는 격자(nx,ny) 변환이 필요하고 3일치뿐이다. 중기예보는 지역코드 단위라
//   축제장 좌표에 못 맞춘다. Open-Meteo 는 **좌표 그대로 16일치**를 주고 **키가 필요 없다**.
//   게다가 좌표를 콤마로 이어 **한 번에 여러 지점**을 받는다(축제 200곳이 호출 4번이면 끝난다).
//
// ⚠️ build.js 는 네트워크 호출을 하지 않는다(예약 빌드 안에서 걸리면 안 된다) — 그래서 이 스크립트가
//    따로 돌아 data/weather.json 을 만들고, build 는 그 파일을 읽기만 한다. fetch-* 들과 같은 규칙.
// ⚠️ **예보는 하루만 지나도 틀린 정보가 된다.** weather.json 에 생성시각을 박아 두고,
//    렌더 쪽(weather.js)에서 오래되면 «아예 안 보여준다». 옛 예보를 오늘 것처럼 보여주는 건
//    안 보여주는 것보다 나쁘다.
//
// 실행: node fetch-weather.js
const fs = require('fs'), path = require('path'), https = require('https');
const OUT = path.join(__dirname, 'data', 'weather.json');
const DAYS = 16;                 // Open-Meteo 무료 일수
const BATCH = 60;                // 한 요청에 담을 지점 수
const GAP = 400;                 // ms — 사이 간격(무료 서비스에 예의)

const KST = () => {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 10);   // ⚠️ toISOString 은 KST에서 하루 밀린다 → 9시간 더해서 쓴다
};
const ymd = s => String(s || '').replace(/-/g, '');
const get = u => new Promise((res, rej) => {
  https.get(u, { headers: { 'User-Agent': 'chukjemoa/1.0 (+https://chukjemoa.co.kr)' }, timeout: 25000 },
    r => { r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res({ s: r.statusCode, d })); })
    .on('error', rej).on('timeout', function () { this.destroy(new Error('timeout')); });
});
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 좌표를 소수 2자리(≈1km)로 묶는다 — 같은 동네 축제가 각각 호출될 이유가 없다
const key = (x, y) => Number(y).toFixed(2) + ',' + Number(x).toFixed(2);

(async () => {
  const fests = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'festivals_api.json'), 'utf8'));
  const today = KST();
  const last = new Date(Date.parse(today) + (DAYS - 1) * 86400000).toISOString().slice(0, 10);
  const t8 = ymd(today), l8 = ymd(last);

  // 예보 창(오늘~16일) 과 기간이 겹치는 축제만 — 나머지는 받아도 쓸 데가 없다
  const pts = new Map();
  for (const f of fests) {
    if (!f.x || !f.y) continue;
    const s = ymd(f.start), e = ymd(f.end || f.start);
    if (!s || e < t8 || s > l8) continue;
    const k = key(f.x, f.y);
    if (!pts.has(k)) pts.set(k, { lat: Number(f.y).toFixed(2), lon: Number(f.x).toFixed(2) });
  }
  const list = [...pts.entries()];
  console.log(`예보 창 ${today} ~ ${last} · 대상 축제 좌표 ${list.length}곳 (전체 ${fests.length}건 중)`);
  if (!list.length) { console.log('대상 없음 — 파일을 건드리지 않는다'); return; }

  const out = {};
  let calls = 0, err = 0;
  for (let i = 0; i < list.length; i += BATCH) {
    const chunk = list.slice(i, i + BATCH);
    const u = 'https://api.open-meteo.com/v1/forecast'
      + '?latitude=' + chunk.map(([, v]) => v.lat).join(',')
      + '&longitude=' + chunk.map(([, v]) => v.lon).join(',')
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
      + '&timezone=Asia%2FSeoul&forecast_days=' + DAYS;
    let r;
    try { r = await get(u); } catch (e) { err++; console.log('  ⚠️ 요청 실패', e.message); await sleep(1500); continue; }
    calls++;
    if (r.s !== 200) { err++; console.log(`  ⚠️ HTTP ${r.s} ${r.d.slice(0, 120)}`); await sleep(1500); continue; }
    let j;
    try { j = JSON.parse(r.d); } catch (e) { err++; continue; }
    const arr = Array.isArray(j) ? j : [j];      // ⚠️ 지점이 1곳이면 배열이 아니라 «객체»로 온다
    arr.forEach((a, n) => {
      const k = chunk[n] && chunk[n][0];
      if (!k || !a || !a.daily) return;
      const d = a.daily, m = {};
      for (let t = 0; t < d.time.length; t++) {
        m[d.time[t].replace(/-/g, '')] = [
          d.weather_code[t],
          Math.round(d.temperature_2m_max[t]),
          Math.round(d.temperature_2m_min[t]),
          d.precipitation_probability_max[t] == null ? -1 : d.precipitation_probability_max[t]
        ];
      }
      out[k] = m;
    });
    console.log(`  … ${Math.min(i + BATCH, list.length)}/${list.length}`);
    await sleep(GAP);
  }

  const got = Object.keys(out).length;
  if (!got) { console.log('⛔ 받은 게 0곳 — 기존 파일을 덮어쓰지 않는다(빈 파일이 더 나쁘다)'); process.exit(1); }
  fs.writeFileSync(OUT, JSON.stringify({
    generated: today,
    generatedAt: new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' '),
    source: 'Open-Meteo',
    days: [t8, l8],
    pts: out
  }), 'utf8');
  console.log(`✓ data/weather.json — ${got}곳 · 호출 ${calls}회 · 오류 ${err}건`);
})();
