// 🐢 느린 원천 «순번 수집기» — _daily.ps1 0c 단계에서 매일 부른다.
//
// 왜 이렇게 만들었나 (2026-09-15)
//   자동 수집 대상은 축제 2종뿐이었다. 그래서 사이트가 «읽고 있는» 원천이 조용히 늙었다:
//   오일장 원천 19일 · 외국어 오일장 19~26일 · 외국어 축제(tw) 8일 ·
//   관광지·카페·맛집·명산·숙소 국문/외국어 28~37일. 아무 경고도 없었다.
//
// 왜 「달력」이 아니라 「순번」인가
//   ⚠️ TourAPI 일일 한도는 **서비스별로 따로** 걸린다(Kor/Eng/Jpn/Chs/Cht/Spn 각각).
//      무거운 것을 하루에 몰아 돌리면 한도에 걸리고, 걸린 응답은 «0건»처럼 조용히 온다.
//   그래서 «오늘 몇 개» 만 돌린다(MAX). 어떤 것을 돌릴지는 달력이 아니라
//   **파일이 실제로 얼마나 늙었나(mtime)** 로 고른다 — 자가 치유가 된다.
//   수집기를 새로 넣거나, 며칠 PC가 꺼져 있었어도 알아서 밀린 것부터 따라잡는다.
//
// ⚠️ 4xx·타임아웃을 「데이터 없음」으로 읽으면 파일이 통째로 쪼그라든다(KOPIS 481건 증발 전력).
//    _weekly_fetch.js 와 같은 «건수 가드»를 건다 — 이전 대비 70% 미만이면 되돌리고 실패로 보고.
//
// 실행:  node _slow_fetch.js          오늘 몫(MAX개)만
//        node _slow_fetch.js --all    밀린 것 전부 (최초 따라잡기용. 한도에 걸릴 수 있으니 사람이 볼 때만)
//        node _slow_fetch.js --list   무엇이 얼마나 늙었는지만 보고 끝낸다
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');

const MAX = 3;                  // 하루에 돌릴 개수. 한도·시간을 이걸로 묶는다.
const FLOOR = 0.7;              // 건수 가드
const TIMEOUT = 25 * 60e3;      // 수집기 하나당 상한

// every: 며칠마다 새로 받을 것인가. 「변하는 속도」로 정했다.
//   7일  — 축제·오일장 계열. 새 축제가 계속 등록되고 장날·휴무가 바뀐다.
//   14일 — 도시 데이터. 행사는 바뀌지만 장소는 잘 안 바뀐다.
//   30일 — 관광지·카페·맛집·명산·숙소. 폐업/신규가 월 단위로 움직인다. 용량이 커서 자주 못 받는다.
//   60일 — 거리·레저·걷기길 경로. 거의 고정이다.
const JOBS = [
  // ── 오일장 (장날이 바뀐다. /jangteo/ 는 조회 3위 자산이다)
  { s: 'fetch-markets.js', out: 'data/markets_api.json', every: 7, label: '오일장 원천(TourAPI)' },
  { s: 'fetch-markets-std.js', out: 'data/markets_std.json', every: 7, label: '오일장 공공표준' },
  { s: 'fetch-markets-en.js', out: 'data/markets_en.json', every: 14, label: '오일장 영어' },
  { s: 'fetch-markets-ja.js', out: 'data/markets_ja.json', every: 14, label: '오일장 일본어' },
  { s: 'fetch-markets-zh.js', out: 'data/markets_zh.json', every: 14, label: '오일장 중국어' },
  { s: 'fetch-markets-es.js', out: 'data/markets_es.json', every: 14, label: '오일장 스페인어' },
  // ── 외국어 축제 (국문은 _weekly_fetch.js 가 월·목에 받는다)
  { s: 'fetch-festivals-en.js', out: 'data/festivals_en.json', every: 7, label: '축제 영어' },
  { s: 'fetch-festivals-ja.js', out: 'data/festivals_ja.json', every: 7, label: '축제 일본어' },
  { s: 'fetch-festivals-zh.js', out: 'data/festivals_zh.json', every: 7, label: '축제 중국어' },
  { s: 'fetch-festivals-tw.js', out: 'data/festivals_tw.json', every: 7, label: '축제 대만어' },
  { s: 'fetch-festivals-es.js', out: 'data/festivals_es.json', every: 7, label: '축제 스페인어' },
  // ── 축제 「그 축제만의 것」(상세 소개). 축제가 새로 생기면 같이 받아야 한다
  { s: 'fetch-fest-intro.js', out: 'data/fest_intro.json', every: 7, label: '축제 소개 국문' },
  { s: 'fetch-fest-intro-intl.js', a: ['en'], out: 'data/fest_intro_en.json', every: 7, label: '축제 소개 영어' },
  { s: 'fetch-fest-intro-intl.js', a: ['ja'], out: 'data/fest_intro_ja.json', every: 7, label: '축제 소개 일본어' },
  // ── 도시
  { s: 'fetch-seoul.js', out: 'data/seoul_events.json', every: 14, label: '서울 행사' },
  { s: 'fetch-busan.js', out: 'data/busan_festivals.json', every: 14, label: '부산 축제' },
  { s: 'fetch-jeju.js', out: 'data/jeju_hub.json', every: 30, label: '제주 허브' },
  { s: 'fetch-visitjeju.js', out: 'data/visitjeju.json', every: 30, label: '비짓제주' },
  // ── 장소 마스터 (한 번에 5~6개 언어를 같이 받는다 — 스크립트 안에 LANGS 가 있다)
  { s: 'fetch-attractions.js', out: 'data/spots_ko.json', every: 30, label: '관광지 6개국' },
  { s: 'fetch-cafes.js', out: 'data/cafes_ko.json', every: 30, label: '카페 5개국' },
  { s: 'fetch-restaurants.js', out: 'data/restaurants_ko.json', every: 30, label: '맛집 5개국' },
  { s: 'fetch-mountains.js', out: 'data/mountains_ko.json', every: 30, label: '명산 5개국' },
  { s: 'fetch-stays.js', out: 'data/stays_ko.json', every: 30, label: '숙소 5개국' },
  // ── 거의 고정. 20일로 둔 이유: audit.js 가 «21일 넘은 파일»을 🟠 로 운다.
  //    주기를 60일로 두면 그 경고가 «영구히 켜진 경고»가 된다 — 늘 켜진 경고는 아무도 안 본다.
  //    받는 비용이 작으니(3KB~849KB) 감시선 안쪽으로 주기를 맞춘다.
  { s: 'fetch-stret.js', out: 'data/stret.json', every: 20, label: '거리·골목' },
  { s: 'fetch-rlte.js', out: 'data/rlte.json', every: 20, label: '레저' },
  { s: 'fetch-trail-routes.js', out: 'data/trail_routes.json', every: 20, label: '걷기길 경로' },
  { s: 'fetch-fame.js', out: 'data/fame.json', every: 20, label: '명성(유명도)' },
];

const P = f => path.join(__dirname, f);
const ageDays = f => { try { return (Date.now() - fs.statSync(P(f)).mtimeMs) / 86400e3; } catch (e) { return 9999; } };
// ⚠️ 파일 모양이 셋이다 — 배열 / {items:[]} / {generated,rows:[]}
const count = f => {
  try {
    const j = JSON.parse(fs.readFileSync(P(f), 'utf8'));
    if (Array.isArray(j)) return j.length;
    const c = (j.rows || j.live || j.items);
    if (Array.isArray(c)) return c.length;
    return Object.keys(j).length;           // fest_intro 처럼 id→값 사전인 것
  } catch (e) { return -1; }
};

const argv = process.argv.slice(2);
const ALL = argv.includes('--all');
const LIST = argv.includes('--list');
// --only <말조각> : 나이와 상관없이 그 수집기만 강제로 돌린다(건수 가드는 그대로).
//   사람이 「지금 당장 최신으로」 할 때만 쓴다. 예약작업은 인자 없이 부른다.
const oi = argv.indexOf('--only');
const ONLY = oi >= 0 ? (argv[oi + 1] || '') : '';

// 밀린 정도(= 나이 ÷ 주기)가 큰 것부터. 1.0 이 넘으면 밀린 것이다.
const due = ONLY
  ? JOBS.filter(j => j.s.includes(ONLY) || j.label.includes(ONLY)).map(j => ({ ...j, age: ageDays(j.out), r: 99 }))
  : JOBS.map(j => ({ ...j, age: ageDays(j.out), r: ageDays(j.out) / j.every }))
    .filter(j => j.r >= 1).sort((a, b) => b.r - a.r);

if (LIST || !due.length) {
  const all = JOBS.map(j => ({ ...j, age: ageDays(j.out) })).sort((a, b) => b.age / b.every - a.age / a.every);
  for (const j of all) {
    const m = j.age / j.every >= 1 ? '🔴 밀림' : j.age / j.every >= 0.7 ? '🟡 곧  ' : '🟢 최신';
    console.log(`  ${m} ${j.label.padEnd(18)} ${j.age > 900 ? '없음' : j.age.toFixed(1) + '일'} / ${j.every}일`);
  }
  if (!LIST) console.log('밀린 원천 없음 — 건너뛴다.');
  process.exit(0);
}

const run = (ALL || ONLY) ? due : due.slice(0, MAX);
console.log(`대상 ${due.length}개 중 ${run.length}개를 받는다${ONLY ? `(--only ${ONLY})` : ALL ? '(--all)' : ` (하루 ${MAX}개)`}.`);
let failed = 0;
for (const j of run) {
  const before = count(j.out);
  if (before > 0) fs.copyFileSync(P(j.out), P(j.out) + '.prev');
  let err = '';
  const t0 = Date.now();
  try {
    execFileSync(process.execPath, [j.s, ...(j.a || [])], { cwd: __dirname, timeout: TIMEOUT, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { err = String(e.message || e).slice(0, 110); }
  const after = count(j.out), sec = Math.round((Date.now() - t0) / 1000);

  if (after < 0 || (before > 0 && after < before * FLOOR)) {
    if (before > 0) fs.copyFileSync(P(j.out) + '.prev', P(j.out));
    console.log(`  ${j.label}: ${before} -> ${after} 되돌림(가드 ${Math.round(FLOOR * 100)}%) ${sec}초 ${err}`);
    failed++; continue;
  }
  const d = before < 0 ? '' : ` (${after - before >= 0 ? '+' : ''}${after - before})`;
  console.log(`  ${j.label}: ${after}건${d} · ${sec}초${err ? ' ※' + err : ''}`);
  try { fs.unlinkSync(P(j.out) + '.prev'); } catch (e) { }
}
process.exit(failed ? 1 : 0);
