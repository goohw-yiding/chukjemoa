// 주 2회(월·목) 축제 원천 재수집 — _daily.ps1 0단계에서 부름.
//
// 왜 필요한가 (2026-09-13):
//   _daily.ps1 은 검색량·트렌드·빌드·배포만 했고 «축제 데이터를 다시 받는 단계가 없었다».
//   그래서 11~12월 겨울 축제가 원천에 등록돼도 사람이 수동으로 돌리기 전엔 사이트에 안 들어온다.
//   실제로 2026-09-13 기준 12월 시작 축제가 사이트에 1건뿐이었다.
//
// ⚠️ 수집기가 4xx·타임아웃을 「데이터 없음」으로 읽으면 파일이 통째로 쪼그라든다(KOPIS 481건 증발 전력).
//    그래서 여기서 «건수 가드»를 건다 — 이전 대비 70% 미만이면 되돌리고 실패로 보고한다.
const fs = require('fs'), { execFileSync } = require('child_process');

// 🎭 2026-09-15 추가 — 전시 두 건.
//   박물관·미술관 페이지의 「지금 전시가 열리고 있는 곳」이 이 두 파일을 읽는다.
//   nowShowOf() 가 «끝난 전시»는 걸러 주므로 낡아도 틀린 말은 안 하지만,
//   «새로 시작한 전시»는 조용히 빠진다. 9/15 실측 seoul_culture 4일 · busan_culture 손으로 받은 것.
//   전시는 보통 주 단위로 바뀌니 월·목이면 충분하다.
const JOBS = [
  { script: 'fetch-festivals.js',    out: 'data/festivals_api.json', label: 'TourAPI 축제' },
  { script: 'fetch-cltur-fstvl.js',  out: 'data/cltur_fstvl.json',   label: '공공 표준데이터' },
  { script: 'fetch-seoul-venue.js',  out: 'data/seoul_culture.json', label: '서울 전시' },
  { script: 'fetch-busan-culture.js', out: 'data/busan_culture.json', label: '부산 전시' },
];
const FLOOR = 0.7;
// ⚠️ 파일 모양이 셋이다 — 배열 그대로 / {items:[]} / {generated,rows:[]}.
//    rows 를 못 세면 건수 가드가 «항상 0» 이 되어 아무것도 못 막는다.
const count = f => {
  try {
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (Array.isArray(j)) return j.length;
    return (j.rows || j.live || j.items || []).length;
  } catch (e) { return -1; }
};

let failed = 0;
for (const j of JOBS) {
  const before = count(j.out);
  if (before > 0) fs.copyFileSync(j.out, j.out + '.prev');
  let err = '';
  try {
    execFileSync(process.execPath, [j.script], { cwd: __dirname, timeout: 15 * 60e3, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { err = String(e.message || e).slice(0, 120); }
  const after = count(j.out);

  if (after < 0) {
    if (before > 0) fs.copyFileSync(j.out + '.prev', j.out);
    console.log(`${j.label}: 실패(파일 못 읽음) — 되돌림. ${err}`);
    failed++; continue;
  }
  if (before > 0 && after < before * FLOOR) {
    fs.copyFileSync(j.out + '.prev', j.out);
    console.log(`${j.label}: ${before} -> ${after} 로 급감해 되돌림(가드 ${Math.round(FLOOR * 100)}%). ${err}`);
    failed++; continue;
  }
  const d = before < 0 ? '' : ` (${after - before >= 0 ? '+' : ''}${after - before})`;
  console.log(`${j.label}: ${after}건${d}${err ? ' ※' + err : ''}`);
  try { fs.unlinkSync(j.out + '.prev'); } catch (e) { }   // 성공했으면 백업은 지운다(커밋에 딸려가지 않게)
}

// 재고 현황을 로그에 남긴다 — 「앞으로 N일 안에 열려 있는 축제」
try {
  const a = JSON.parse(fs.readFileSync('data/festivals_api.json', 'utf8'));
  const K = new Date(Date.now() + 9 * 3600e3);
  const ymd = d => d.toISOString().slice(0, 10).replace(/-/g, '');
  const today = ymd(K);
  const horizon = n => a.filter(x => x.start && x.end && x.end >= today && x.start <= ymd(new Date(K.getTime() + n * 86400e3))).length;
  const m = {};
  for (const x of a) if (x.start && x.start >= today) m[String(x.start).slice(0, 6)] = (m[String(x.start).slice(0, 6)] || 0) + 1;
  console.log(`재고 30일 ${horizon(30)} / 60일 ${horizon(60)} / 90일 ${horizon(90)} / 180일 ${horizon(180)}`);
  console.log('시작월 ' + Object.keys(m).sort().map(k => k + ':' + m[k]).join(' '));
  if (horizon(90) - horizon(60) < 10) console.log('경고: 60~90일 구간에 새로 시작하는 축제가 10건 미만이다.');
} catch (e) { console.log('재고 집계 실패: ' + String(e.message).slice(0, 80)); }

process.exit(failed ? 1 : 0);
