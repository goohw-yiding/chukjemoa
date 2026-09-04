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
// 2026-09-04 확대: 축제만이 아니라 «야외에서 놀 곳» 전부로 넓혔다.
//   장남 님: 「놀러가서 비 오면 할 일도 없어지니까」 — 맞는 말이다. 날씨는 갈지 말지를 정하는 정보다.
//   대상: 축제 · 오일장(다음 장날) · 걷기길 · 계곡 · 단풍 · 봄꽃 · 온천 · 명산
//
// 🔁 2026-09-04 재확대 — **위의 「넣지 않는다」 판단이 틀렸다.**
//   그때는 무장애·카페를 「다른 페이지 안의 참고 목록」이라고 봤는데, 그 뒤 서울·부산·제주 도시 페이지를
//   만들면서 **`accessible.json` 이 「가볼만한 곳」의 본체**가 되고 `cafes_ko.json` 이 제주 카페 페이지가 됐다.
//   그 결과 **날씨 조회 1,701건 중 749건(44%)이 미스**였다 — 제주 카페 90장에 날씨가 거의 없었다.
//   → accessible·cafes_ko 를 «개요가 있는 것만» 넣는다(페이지에 실제로 나오는 것들).
//
//   ⭐ 대신 **격자를 0.02°(2km) → 0.05°(5km)로 넓혔다.** 정보 손실이 없다 —
//      **Open-Meteo 모델 자체 해상도가 약 11km**라서 2km 격자로 쪼개 봐야 «같은 값을 여러 번 사는 것»이었다.
//      덕분에 대상이 3배로 늘었는데 지점은 4,489→2,273, 호출 75→38회(8.8분→4.4분)로 오히려 줄었다.
//   ⚠️ 격자를 바꿔도 weather.js 는 «파일에 저장된 step»을 읽으므로 자동으로 맞는다(하드코딩 금지).
//
// 실행: node fetch-weather.js
const fs = require('fs'), path = require('path'), https = require('https');
const OUT = path.join(__dirname, 'data', 'weather.json');
const DAYS = 12;                 // ⚠️ 16일까지 주지만 10일 넘어가면 신뢰도가 낮다. 파일 크기도 반이 된다.
const BATCH = 60;                // 한 요청에 담을 지점 수
// ⚠️ 2026-09-04 실사고: Open-Meteo 무료는 «분당» 한도가 있고, 한 요청에 60지점을 담으면
//    **60건으로 계산된다.** 400ms 간격으로 밀었더니 600지점에서 429가 나고 331지점이
//    조용히 빠진 채로 파일이 저장됐다 — 그 지역들은 날씨가 통째로 사라진다.
//    → 분당 약 540지점(9요청)만 보내도록 간격을 벌리고, 429 는 «건너뛰지 말고» 기다렸다 다시 보낸다.
const GAP = 7000;                // ms
const RETRY_WAIT = 65000;        // 429 를 만나면 1분 넘게 쉰다
const STEP = 0.05;               // 격자(도) — 약 5km. 모델 해상도(≈11km)보다 여전히 촘촘하다.

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

// ⭐ 격자 키 — 렌더 쪽(weather.js)도 «똑같은 식»을 써야 한다. 한쪽만 바꾸면 조용히 전부 미스가 난다.
const key = (x, y) => Math.round(Number(y) / STEP) + ',' + Math.round(Number(x) / STEP);
const inKR = (x, y) => x > 124 && x < 132 && y > 33 && y < 39;   // 좌표는 쓰기 전에 거른다

function load(f) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8'));
    return Array.isArray(d) ? d : (d.rows || Object.values(d).find(v => Array.isArray(v)) || []);
  } catch (e) { return []; }
}

(async () => {
  const today = KST();
  const last = new Date(Date.parse(today) + (DAYS - 1) * 86400000).toISOString().slice(0, 10);
  const t8 = ymd(today), l8 = ymd(last);

  const pts = new Map();
  const add = (x, y) => {
    x = Number(x); y = Number(y);
    if (!inKR(x, y)) return false;
    const k = key(x, y);
    if (!pts.has(k)) pts.set(k, { lat: y.toFixed(3), lon: x.toFixed(3) });
    return true;
  };

  const tally = {};
  // ① 축제 — 예보 창과 기간이 «겹치는» 것만(끝난 축제·먼 축제는 받아도 쓸 데가 없다)
  let n = 0;
  for (const f of load('festivals_api.json')) {
    const s = ymd(f.start), e = ymd(f.end || f.start);
    if (!s || e < t8 || s > l8) continue;
    if (add(f.x, f.y)) n++;
  }
  tally['축제(기간 겹침)'] = n;

  // ②~⑧ 날짜가 없는 «놀 곳»들 — 오늘부터 며칠간의 날씨가 곧 «갈지 말지»다
  for (const [f, label] of [
    ['markets_api.json', '오일장'], ['trails.json', '걷기길'], ['valleys.json', '계곡'],
    ['maple.json', '단풍'], ['flower.json', '봄꽃'], ['onsen.json', '온천'],
    ['mountains_ko.json', '명산']
  ]) {
    let c = 0;
    for (const r of load(f)) if (add(r.x, r.y)) c++;
    tally[label] = c;
  }

  // ⑨ 2026-09-04 추가 — 도시 페이지(/seoul/ /busan/ /jeju/)의 «가볼만한 곳·카페» 본체.
  //    ⚠️ **개요가 있는 것만** 넣는다 — 개요가 없는 항목은 카드로 그려지지 않으니 날씨도 필요 없다.
  //       (이 조건 하나로 accessible 9,676 → 8,335, 격자는 5km 라 +약 900지점에 그친다.)
  for (const [f, label] of [['accessible.json', '가볼만한곳'], ['cafes_ko.json', '카페']]) {
    let c = 0;
    for (const r of load(f)) if (String(r.ov || '').length >= 120 && add(r.x, r.y)) c++;
    tally[label] = c;
  }

  const list = [...pts.entries()];
  console.log(`예보 창 ${today} ~ ${last} (${DAYS}일) · 격자 ${STEP}도`);
  console.log('  대상:', Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(' · '));
  console.log(`  → 중복 제거 후 ${list.length}지점 · 호출 ${Math.ceil(list.length / BATCH)}회`);
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
    let r = null;
    for (let t = 0; t < 4; t++) {           // 같은 묶음을 최대 4번까지 — 429는 «기다리면» 풀린다
      try { r = await get(u); } catch (e) { console.log('  ⚠️ 요청 실패', e.message); await sleep(3000); continue; }
      calls++;
      if (r.s === 200) break;
      if (r.s === 429) {
        console.log(`  ⏳ 분당 한도 — ${RETRY_WAIT / 1000}초 쉬고 이 묶음을 다시 보냅니다`);
        await sleep(RETRY_WAIT); r = null; continue;
      }
      console.log(`  ⚠️ HTTP ${r.s} ${r.d.slice(0, 120)}`); r = null; await sleep(3000);
    }
    if (!r || r.s !== 200) { err++; console.log('  ⛔ 이 묶음은 끝내 못 받았습니다 — 해당 지역은 날씨가 비어 있게 됩니다'); continue; }
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
  // ⚠️ «반쯤 받은 것»을 조용히 저장하면 그 지역만 날씨가 없어진다. 얼마나 빠졌는지 반드시 말한다.
  if (got < list.length * 0.95) {
    console.log(`  ⚠️ ${list.length - got}지점을 못 받았습니다(${(100 - got / list.length * 100).toFixed(0)}%). 그 지역 카드엔 날씨가 안 붙습니다.`);
  }
  fs.writeFileSync(OUT, JSON.stringify({
    generated: today,
    generatedAt: new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' '),
    source: 'Open-Meteo', step: STEP,
    days: [t8, l8],
    pts: out
  }), 'utf8');
  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log(`✓ data/weather.json — ${got}지점 · ${kb}KB · 호출 ${calls}회 · 오류 ${err}건`);
})();
