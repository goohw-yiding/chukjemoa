// 🏙 서울시 문화행사 → data/seoul_events.json  (서울열린데이터광장 `culturalEventInfo`)
//
// 왜 (2026-09-03 검색량 실측으로 방향이 «뒤집혀서» 이걸 받는다)
//   같은 이름을 쓰는 경쟁사(travel-info.co.kr)가 서울 상황형 랜딩을 깔아 뒀길래 따라가려다,
//   네이버 검색광고 API로 월간 검색량을 재보니 **그쪽이 노리는 말들은 사실상 수요가 없었다** —
//     서울문화행사 80 · 홍대행사 200 · 서울주말행사 350 · 서울무료전시 1,210
//   진짜 큰 건 따로 있었다:
//     **서울전시회 92,800** · 서울전시 26,020 · **서울공연 17,430** · **서울축제 15,880**
//     그리고 「서울전시회8월」 14,680 — ⭐우리가 이미 잘하는 «월 조합 롱테일»이다.
//   ⭐ 즉 베껴야 할 건 경쟁사의 «페이지 구성»이 아니라, 그들이 쓰는 «데이터»다.
//      우리 기존 데이터(서울 축제 191·문화축제 166·공연행사 37)로는 전시가 거의 없어 이 말들을 못 받는다.
//
// 데이터: 서울열린데이터광장 「서울시 문화행사 정보」 — 전체 19,493건(2026-09-03 실측),
//   분류(콘서트·전시/미술·뮤지컬/오페라·클래식·연극·축제 등)·자치구·기간·장소·요금·무료여부·좌표·이미지 포함.
//
// ⚠️ 키가 필요하다(무료). data.seoul.go.kr 로그인 → 마이페이지 → 인증키 신청 → 발급 즉시 사용.
//    키는 `seoul.key` 파일에 한 줄로 넣는다. `*.key` 는 git 제외이므로 **프로젝트폴더·C:\dev 양쪽에** 둔다
//    (indexnow.key·cltur-fstvl.key 와 같은 규칙 — 한쪽에만 있으면 예약작업이 조용히 0건을 만든다).
// ⚠️ 샘플키(`sample`)는 «한 번에 5건»까지만 준다. 되는지 확인용으로만 쓸 것.
//
// 실행: node fetch-seoul.js
const fs = require('fs'), path = require('path'), http = require('http');
const OUT = path.join(__dirname, 'data', 'seoul_events.json');
const PAGE = 1000;                      // 서울 API 한 번에 최대 1,000건
const GAP = 200;

let KEY = '';
try { KEY = fs.readFileSync(path.join(__dirname, 'seoul.key'), 'utf8').trim(); } catch (e) { }
if (!KEY) {
  console.log('⛔ seoul.key 가 없습니다. data.seoul.go.kr 에서 무료 인증키를 받아');
  console.log('   chukjemoa/seoul.key 에 한 줄로 저장하세요(프로젝트폴더·C:\\dev 양쪽 다).');
  process.exit(1);
}

const get = u => new Promise((res, rej) => {
  http.get(u, { headers: { 'User-Agent': 'chukjemoa' }, timeout: 25000 }, r => {
    r.setEncoding('utf8'); let d = '';
    r.on('data', c => d += c); r.on('end', () => res({ s: r.statusCode, d }));
  }).on('error', rej).on('timeout', function () { this.destroy(new Error('timeout')); });
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const ymd = s => {
  const m = String(s || '').match(/(\d{4})[-.\/]?(\d{2})[-.\/]?(\d{2})/);
  return m ? m[1] + m[2] + m[3] : '';
};
const KST = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

// ⚠️ 좌표는 «쓰기 전에» 거른다 — 과거에 TourAPI 기본값(중국 남해)이 그대로 들어온 적이 있다.
//    서울 안이면 위도 37.4~37.7 · 경도 126.7~127.2 근처다. 벗어나면 버린다(없는 게 틀린 것보다 낫다).
function coord(lat, lot) {
  let y = Number(lat), x = Number(lot);
  if (!isFinite(x) || !isFinite(y) || (!x && !y)) return null;
  // 필드가 서로 바뀌어 들어오는 경우가 있어 «값의 크기»로 판별한다(경도가 위도보다 크다)
  if (y > 100 && x < 100) { const t = x; x = y; y = t; }
  if (y < 37.2 || y > 37.8 || x < 126.5 || x > 127.4) return null;
  return { x: x.toFixed(7), y: y.toFixed(7) };
}

(async () => {
  const today = ymd(KST());
  const rows = [];
  let total = 0, dropCoord = 0;
  for (let p = 1; p <= 40; p++) {
    const s = (p - 1) * PAGE + 1, e = p * PAGE;
    const t = await get(`http://openapi.seoul.go.kr:8088/${KEY}/json/culturalEventInfo/${s}/${e}/`);
    let j;
    try { j = JSON.parse(t.d); } catch (err) {
      console.log(`  ⚠️ 파싱 실패 p${p} — ${t.d.slice(0, 160).replace(/\s+/g, ' ')}`);
      break;
    }
    const b = j.culturalEventInfo;
    // ⚠️ 인증 오류는 200 안에 RESULT 로 온다. 「데이터 없음」으로 읽으면 안 된다.
    if (!b) {
      const r = (j.RESULT || {});
      console.log(`  ⛔ ${r.CODE || '?'} ${r.MESSAGE || t.d.slice(0, 120)}`);
      break;
    }
    total = Number(b.list_total_count || 0);
    const list = b.row || [];
    if (!list.length) break;
    for (const x of list) {
      const st = ymd(x.STRTDATE), en = ymd(x.END_DATE) || ymd(x.STRTDATE);
      if (!st) continue;
      const c = coord(x.LAT, x.LOT);
      if (!c) dropCoord++;
      rows.push({
        title: clean(x.TITLE), cat: clean(x.CODENAME), gu: clean(x.GUNAME),
        start: st, end: en,
        place: clean(x.PLACE), org: clean(x.ORG_NAME),
        target: clean(x.USE_TRGT), fee: clean(x.USE_FEE),
        free: /무료/.test(String(x.IS_FREE || '')) || /무료/.test(clean(x.USE_FEE)),
        tel: clean(x.INQUIRY), time: clean(x.PRO_TIME),
        desc: clean(x.PROGRAM).slice(0, 500),
        img: clean(x.MAIN_IMG), link: clean(x.ORG_LINK) || clean(x.HMPG_ADDR),
        ticket: clean(x.TICKET),
        x: c ? c.x : '', y: c ? c.y : ''
      });
    }
    console.log(`  … ${Math.min(e, total)}/${total}`);
    if (e >= total) break;
    await sleep(GAP);
  }

  if (!rows.length) { console.log('⛔ 0건 — 기존 파일을 덮어쓰지 않는다'); process.exit(1); }

  // 중복 제거 — 같은 제목·장소·시작일이면 한 건 (⚠️ 표기가 흔들리는 필드는 키에 넣지 않는다)
  const seen = new Set(), uniq = [];
  for (const r of rows) {
    const k = r.title + '|' + r.place + '|' + r.start;
    if (seen.has(k)) continue;
    seen.add(k); uniq.push(r);
  }

  const live = uniq.filter(r => r.end >= today);
  // ⚠️ 19,468건을 통째로 저장하니 **12MB**였다. 대부분 몇 년 전 끝난 행사라 페이지에 쓸 일이 없다.
  //    「서울전시회8월」 같은 «지난달» 조합까지만 필요하므로 **끝난 지 60일 이내 + 앞으로 전부**만 남긴다.
  const floor = ymd(new Date(Date.parse(KST()) - 60 * 86400000).toISOString().slice(0, 10));
  const keep = uniq.filter(r => r.end >= floor);
  fs.writeFileSync(OUT, JSON.stringify({
    generated: KST(), source: '서울열린데이터광장 서울시 문화행사 정보',
    total, kept: keep.length, floor, rows: keep
  }), 'utf8');
  console.log(`  보관 기준 ${floor} 이후 종료 — ${keep.length}건만 저장(전체 ${uniq.length}건 중)`);

  const by = {}; live.forEach(r => { by[r.cat] = (by[r.cat] || 0) + 1; });
  console.log(`✓ data/seoul_events.json — 전체 ${uniq.length}건(중복 제거 전 ${rows.length}) · 진행·예정 ${live.length}건`);
  console.log(`  좌표 없음 ${dropCoord}건(서울 밖 좌표 포함 — 버렸다)`);
  console.log('  진행·예정 분류별:', Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 12)
    .map(([k, v]) => `${k} ${v}`).join(' · '));
  const gu = {}; live.forEach(r => { if (r.gu) gu[r.gu] = (gu[r.gu] || 0) + 1; });
  console.log('  자치구 상위:', Object.entries(gu).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([k, v]) => `${k} ${v}`).join(' · '));
  console.log(`  무료 ${live.filter(r => r.free).length}건 · 이미지 ${live.filter(r => r.img).length}건 · 좌표 ${live.filter(r => r.x).length}건`);
})();
