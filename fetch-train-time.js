// 🚄 서울 → 각 역 열차 소요시간 → data/train_time.json
//
// 왜 이게 필요한가 (2026-09-14)
//   `/ja/daytrip/`(ソウルから日帰り・1泊2日)를 만들려는데 우리에겐 **운임 3,231쌍은 있고 소요시간이 없다**.
//   「대강 몇 시간」을 손으로 적으면 그 순간 이 사이트의 규칙을 어긴다 — 지어내지 않는다.
//
// 🔴 네이버 지도 API 로는 «못 한다» (2026-09-14 공식 문서 확인)
//   NCP Directions 5 문서 원문: 「Direction 5 API가 제공하는 경로 정보는 자동차에 한해서만 제공됩니다.」
//   대중교통·기차 경로 API 는 NCP 가 일반 제공하지 않는다. 그래서 이 길은 접었다.
//
// ✅ 대신 «이미 가진 키»로 된다 — apikeys.json 의 `tago`
//   같은 키로 시외버스(SuburbsBusInfo)는 «정상 응답»을 확인했다(2026-09-14).
//   열차정보만 `NO_OPENAPI_SERVICE_ERROR(12)` 가 나온다 = **그 서비스에 활용신청이 안 돼 있다**는 뜻.
//   → 공공데이터포털 「국토교통부_(TAGO)_열차정보」(data.go.kr/data/15098552) 활용신청 1회면 끝.
//      신청이 승인되기 전에는 이 수집기가 그 사실을 그대로 알려 주고 멈춘다(조용히 빈 파일을 만들지 않는다).
//
// 실행:
//   node fetch-train-time.js --probe    ← 신청 직후 «응답 생김새»부터 확인한다(필드명을 믿지 말고 눈으로 본다)
//   node fetch-train-time.js            ← 수집
'use strict';
const fs = require('fs'), path = require('path'), https = require('https');

const KEYS = (() => {
  for (const p of ['C:\\dev\\chukjemoa\\apikeys.json', path.join(__dirname, 'apikeys.json')]) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8').replace(/[\u0000-\u001F]/g, '')); } catch (e) {}
  }
  throw new Error('apikeys.json 없음');
})();
const KEY = encodeURIComponent((KEYS.tago || '').trim());
const BASE = 'https://apis.data.go.kr/1613000/TrainInfoService';
const OUT = path.join(__dirname, 'data', 'train_time.json');
const PROBE = process.argv.includes('--probe');

function get(u) {
  return new Promise((res, rej) => {
    const req = https.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
      r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
    });
    req.on('error', rej);
    req.setTimeout(20000, () => { req.destroy(); rej(new Error('timeout')); });
  });
}
// 공공데이터포털은 오류를 «200 + 다른 모양»으로 준다. 그래서 파싱 실패를 그냥 넘기지 않는다.
async function call(op, qs) {
  const u = `${BASE}/${op}?serviceKey=${KEY}&_type=json&${qs}`;
  const raw = await get(u);
  if (/NO_OPENAPI_SERVICE_ERROR/.test(raw)) {
    throw new Error('열차정보 서비스에 «활용신청»이 안 돼 있다.\n'
      + '   → https://www.data.go.kr/data/15098552/openapi.do 에서 활용신청(보통 즉시 승인)\n'
      + '   ※ 같은 키로 시외버스(SuburbsBusInfo)는 되는 것을 확인했으므로 키 자체는 정상이다.');
  }
  let j;
  try { j = JSON.parse(raw); } catch (e) { throw new Error('JSON 아님: ' + raw.slice(0, 200)); }
  const body = j.response && j.response.body;
  if (!body) throw new Error('응답 모양이 다르다: ' + raw.slice(0, 240));
  const it = body.items && body.items.item;
  return { list: !it ? [] : (Array.isArray(it) ? it : [it]), total: body.totalCount, raw };
}

// 날짜: 다음 «평일» (토·일은 열차 편성이 달라 대표값으로 안 맞다)
function nextWeekday() {
  const d = new Date(Date.now() + 86400000 * 2);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
}
// 'YYYYMMDDHHMM' → 분
const toMin = s => {
  const m = String(s).match(/^(\d{8})(\d{2})(\d{2})$/);
  return m ? (+m[2]) * 60 + (+m[3]) : null;
};

(async () => {
  const date = nextWeekday();

  // ── 프로브: 필드명을 «문서가 아니라 응답»에서 확인한다
  if (PROBE) {
    console.log('▶ 프로브 — 기준일', date);
    const city = await call('getCtyCodeList', 'numOfRows=100&pageNo=1');
    console.log('① 시·도', city.list.length, '개 ·', JSON.stringify(city.list.slice(0, 4)));
    const seoulCode = (city.list.find(c => /서울/.test(c.cityname || c.cityName)) || {}).citycode;
    console.log('   서울 코드:', seoulCode);
    const st = await call('getCtyAcctoTrainSttnList', `cityCode=${seoulCode}&numOfRows=100&pageNo=1`);
    console.log('② 서울 역', st.list.length, '개 ·', JSON.stringify(st.list.slice(0, 6)));
    const seoul = st.list.find(s => (s.nodename || '') === '서울');
    const busanCity = (city.list.find(c => /부산/.test(c.cityname || c.cityName)) || {}).citycode;
    const bst = await call('getCtyAcctoTrainSttnList', `cityCode=${busanCity}&numOfRows=100&pageNo=1`);
    const busan = bst.list.find(s => (s.nodename || '') === '부산');
    console.log('③ 서울:', JSON.stringify(seoul), '· 부산:', JSON.stringify(busan));
    const tr = await call('getStrtpntAlocFndTrainInfo',
      `depPlaceId=${seoul.nodeid}&arrPlaceId=${busan.nodeid}&depPlandTime=${date}&numOfRows=5&pageNo=1`);
    console.log('④ 서울→부산 열차', tr.total, '편 · 앞 2편 원본:');
    console.log(JSON.stringify(tr.list.slice(0, 2), null, 1));
    console.log('\n⭐ 여기 나온 «실제 필드명»을 보고 아래 수집 로직의 필드를 맞춘다.');
    return;
  }

  // ── 수집: 서울역 → 우리가 운임을 가진 역들
  const fare = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'ktx_fare.json'), 'utf8'));
  const want = new Set();
  Object.keys(fare.pairs).forEach(k => { const [a, b] = k.split('|'); if (a === '서울') want.add(b); });
  console.log('▶ 서울 기준 운임이 있는 역', want.size, '개 · 기준일', date);

  // 전국 역 목록을 한 번에 모은다(역 이름 → nodeid)
  const city = await call('getCtyCodeList', 'numOfRows=100&pageNo=1');
  const node = {};
  for (const c of city.list) {
    const code = c.citycode || c.cityCode;
    try {
      const st = await call('getCtyAcctoTrainSttnList', `cityCode=${code}&numOfRows=200&pageNo=1`);
      st.list.forEach(s => { if (s.nodename && !node[s.nodename]) node[s.nodename] = s.nodeid; });
    } catch (e) { console.log('  ⚠️ 시도', code, '역목록 실패:', e.message); }
    await new Promise(r => setTimeout(r, 120));
  }
  console.log('  전국 역 이름→ID', Object.keys(node).length, '개');
  if (!node['서울']) throw new Error('서울역 ID 를 못 찾았다 — 역 이름 표기가 다르다. --probe 로 확인할 것');

  const out = {};
  let miss = [];
  for (const name of want) {
    const id = node[name];
    if (!id) { miss.push(name); continue; }
    try {
      const tr = await call('getStrtpntAlocFndTrainInfo',
        `depPlaceId=${node['서울']}&arrPlaceId=${id}&depPlandTime=${date}&numOfRows=100&pageNo=1`);
      // 소요시간 = 도착 - 출발. «가장 빠른 편»과 «편수»를 남긴다.
      //  ⚠️ 평균을 쓰지 않는다 — 완행이 섞이면 평균이 실제 여행 계획과 무관해진다.
      const mins = tr.list.map(t => {
        const a = toMin(t.depplandtime), b = toMin(t.arrplandtime);
        if (a == null || b == null) return null;
        return b >= a ? b - a : b + 1440 - a;   // 자정 넘김
      }).filter(m => m && m > 0 && m < 900);
      if (!mins.length) { miss.push(name + '(편성없음)'); continue; }
      const grades = [...new Set(tr.list.map(t => t.traingradename).filter(Boolean))];
      out[name] = {
        min: Math.min(...mins),
        max: Math.max(...mins),
        trains: tr.list.length,
        grades,
        fare: fare.pairs['서울|' + name] || null
      };
      console.log(`  ${name.padEnd(8)} 최속 ${out[name].min}분 · ${tr.list.length}편 · ${grades.join('/')}`);
    } catch (e) { miss.push(name + '(' + e.message.split('\n')[0].slice(0, 40) + ')'); }
    await new Promise(r => setTimeout(r, 150));
  }

  if (!Object.keys(out).length) throw new Error('한 건도 못 받았다 — 빈 파일을 만들지 않는다');
  fs.writeFileSync(OUT, JSON.stringify({
    from: '서울', date, source: '국토교통부 TAGO 열차정보(공공데이터포털)',
    note: '표시는 그 날짜 시간표에서 계산한 «가장 빠른 편»의 소요시간이다. 편성에 따라 더 걸리는 열차도 있다.',
    updated: new Date().toISOString().slice(0, 10), stations: out
  }));
  console.log(`✓ data/train_time.json — ${Object.keys(out).length}개 역 (못 받음 ${miss.length}: ${miss.slice(0, 12).join(', ')})`);
})().catch(e => { console.error('✗ ' + e.message); process.exit(1); });
