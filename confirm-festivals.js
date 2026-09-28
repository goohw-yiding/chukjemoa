// confirm-festivals.js — 「예년 기준·변동 가능」 축제를 확정 일정으로 바꾸는 도구 (2026-09-28 신설)
//
// 왜: data/festivals.json 의 confirmed:false 는 손으로 넣은 표시라 저절로 안 바뀐다.
//     2026-09-28 점검에서 개막 코앞인 축제 5곳의 날짜가 통째로 틀려 있었다
//     (전주비빔밥 10/15→실제 10/2, 양양송이 9/30→실제 10/16, 백제문화제·수원화성문화제·서울억새).
//
// 사용:
//   node confirm-festivals.js            → ① 공공데이터(festivals_api.json)에 올해 날짜가 나온 것 자동 확정
//                                           ② 남은 미확정 중 42일 안에 열리는 것 «조사 필요» 목록 출력
//   node confirm-festivals.js --list     → ②만 (파일 안 바꿈)
//   node confirm-festivals.js --set "축제명" 2026-10-02 2026-10-04 "출처URL" ["장소"]
//                                        → 공식 발표로 확인한 날짜를 직접 확정 (예약작업이 쓴다)
//   node confirm-festivals.js --note "축제명" "메모"  → 아직 미발표일 때 조사 기록만 남김
//
// 자동 확정 규칙(틀린 매칭 방지): 이름이 서로 포함관계 + 공공데이터 시작일의 «연도»가 같고
//   예년 기준 시작일과 45일 이내 차이. (서울억새 2025 자료·평창송어 지난 시즌 자료가 여기서 걸러진다)
// 기록: data/festival_confirm_log.json (언제·무엇을·무엇으로·근거)
const fs = require('fs');
const path = require('path');
const P = path.join(__dirname, 'data', 'festivals.json');
const PA = path.join(__dirname, 'data', 'festivals_api.json');
const PL = path.join(__dirname, 'data', 'festival_confirm_log.json');

const raw = fs.readFileSync(P, 'utf8');
const data = JSON.parse(raw);
const L = Array.isArray(data) ? data : (data.festivals || Object.values(data)[0]);
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const log = fs.existsSync(PL) ? JSON.parse(fs.readFileSync(PL, 'utf8')) : [];
const args = process.argv.slice(2);
const DAYS = 42;

const norm = s => String(s || '').replace(/\s|제\d+회|20\d\d|\(.*?\)|[·\-_'"]/g, '').toLowerCase();
const d8 = s => { s = String(s || '').replace(/\D/g, ''); return s.length >= 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : ''; };
const dayDiff = (a, b) => Math.round((new Date(a) - new Date(b)) / 864e5);
const months = (s, e) => { const m = []; let y = +s.slice(0, 4), k = +s.slice(5, 7); const ey = +e.slice(0, 4), ek = +e.slice(5, 7);
  while (y < ey || (y === ey && k <= ek)) { m.push(k); if (++k > 12) { k = 1; y++; } if (m.length > 12) break; } return m; };
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s);

let changed = 0;
function apply(f, s, e, source, place) {
  const from = `${f.start}~${f.end}`;
  f.start = s; f.end = e; f.month = months(s, e); f.confirmed = true;
  if (place) f.place = place;
  log.push({ at: today, name: f.name, from, to: `${s}~${e}`, place: place || undefined, source });
  changed++;
  console.log(`✅ 확정 ${f.name}: ${from} → ${s}~${e}${place ? ' · ' + place : ''}  (${source})`);
}
function save() {
  if (!changed) return;
  const same = JSON.stringify(JSON.parse(raw), null, 1) + (raw.endsWith('\n') ? '\n' : '');
  if (same !== raw.replace(/\r\n/g, '\n')) { console.log('⚠️ festivals.json 형식이 예상과 달라 저장하지 않음'); process.exit(1); }
  fs.writeFileSync(P, JSON.stringify(data, null, 1) + (raw.endsWith('\n') ? '\n' : ''));
  fs.writeFileSync(PL, JSON.stringify(log, null, 1) + '\n');
}

if (args[0] === '--set') {
  const [, name, s, e, source, place] = args;
  const f = L.find(x => x.name === name);
  if (!f) { console.log(`❌ 이름이 없음: ${name}`); process.exit(1); }
  if (!isDate(s) || !isDate(e) || e < s) { console.log('❌ 날짜 형식은 YYYY-MM-DD, 종료 ≥ 시작'); process.exit(1); }
  if (!/^https?:\/\//.test(source || '')) { console.log('❌ 근거 URL 필수'); process.exit(1); }
  apply(f, s, e, source, place); save(); process.exit(0);
}
if (args[0] === '--note') {
  const [, name, note] = args;
  if (!L.find(x => x.name === name)) { console.log(`❌ 이름이 없음: ${name}`); process.exit(1); }
  log.push({ at: today, name, note }); fs.writeFileSync(PL, JSON.stringify(log, null, 1) + '\n');
  console.log(`📝 기록 ${name}: ${note}`); process.exit(0);
}

// ① 공공데이터 자동 확정
if (args[0] !== '--list' && fs.existsSync(PA)) {
  let api = JSON.parse(fs.readFileSync(PA, 'utf8'));
  api = Array.isArray(api) ? api : (api.items || api.festivals || Object.values(api)[0]);
  for (const f of L) {
    if (f.confirmed || f.end < today) continue;
    const k = norm(f.name);
    const cands = api.map(a => ({ a, n: norm(a.title), s: d8(a.start), e: d8(a.end) }))
      .filter(c => c.n && (c.n.includes(k) || k.includes(c.n)) && c.s && c.e && c.e >= c.s
        && c.s.slice(0, 4) === f.start.slice(0, 4) && Math.abs(dayDiff(c.s, f.start)) <= 45)
      .sort((x, y) => Math.abs(dayDiff(x.s, f.start)) - Math.abs(dayDiff(y.s, f.start)));
    if (cands.length) apply(f, cands[0].s, cands[0].e, `TourAPI «${cands[0].a.title}» id ${cands[0].a.id}`);
  }
  save();
}

// ② 조사 필요 목록
const lim = new Date(Date.now() + 9 * 3600e3 + DAYS * 864e5).toISOString().slice(0, 10);
const need = L.filter(f => !f.confirmed && f.end >= today && f.start <= lim).sort((a, b) => a.start < b.start ? -1 : 1);
const lastNote = n => [...log].reverse().find(x => x.name === n && x.note);
console.log(`\n🔎 조사 필요 (미확정 · ${DAYS}일 안에 시작): ${need.length}건`);
for (const f of need) {
  const nt = lastNote(f.name);
  console.log(`- ${f.name} | 예년 기준 ${f.start}~${f.end} | ${f.city || ''} ${f.place || ''}${nt ? ` | 지난 조사(${nt.at}): ${nt.note}` : ''}`);
}
const rest = L.filter(f => !f.confirmed && f.end >= today && f.start > lim).length;
console.log(`(그 뒤 미확정 ${rest}건은 ${DAYS}일 안으로 들어오면 목록에 뜬다)`);
