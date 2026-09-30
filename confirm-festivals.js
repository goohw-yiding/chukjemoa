// confirm-festivals.js — 수기 축제(data/festivals.json) 날짜를 «교차 확인»으로만 확정하는 도구
//
// 왜 (2026-09-28 신설 → 2026-09-30 전면 개편):
//   ① confirmed:false(예년 기준 추정) 날짜가 틀려 있어도 저절로 안 고쳐진다.
//   ② 옛 버전은 «종료일이 오늘 이후»인 것만 확인했다 → 추정 날짜가 실제보다 이르면 그 날짜가 지나는 순간
//      확인 목록에서 빠지고 사이트엔 «종료»로 떴다. 9/30에 미확정·날짜 지남 87건, 그중 한성백제문화제는
//      9/25로 적혀 있었지만 실제는 10/23~25(아직 안 열림). → 지난 미확정도 확인 대상에 넣는다.
//   ③ 신뢰 문제라 한 사람(한 세션)의 판단으로 확정하지 않는다. «확정» 조건:
//        (a) 서로 다른 사이트 2곳 이상의 근거 — 각 페이지를 이 도구가 직접 열어
//            «2026» 과 그 날짜 문구가 실제로 있는지 기계 검증(통과한 것만 근거로 센다)
//        (b) 조사자(--propose)와 검증자(--approve)가 따로 찾은 날짜가 일치
//      공공데이터(TourAPI)는 «근거 1곳»으로만 센다 — 날짜는 고쳐 주지만 «일정 확정» 배지는 안 준다.
//
// 사용:
//   node confirm-festivals.js                 공공데이터 대조(근거 1곳 반영) + 확인 목록
//   node confirm-festivals.js --list          확인 목록만 (파일 안 바꿈)
//   node confirm-festivals.js --check-url URL YYYY-MM-DD YYYY-MM-DD   근거 페이지 기계 검증만
//   node confirm-festivals.js --propose "축제명" 시작 종료 URL1 URL2 ["장소"]   조사자: 후보 등록
//   node confirm-festivals.js --approve "축제명" 시작 종료 URL ["장소"]         검증자: 독립 확인 → 일치하면 확정
//   node confirm-festivals.js --list-blind    검증자용: 후보 이름·지역만(조사자 날짜·근거를 가림)
//   node confirm-festivals.js --note "축제명" "메모"                          미발표·의심 기록
//
// 파일: data/festivals.json(확정 반영) · data/festival_candidates.json(대기 후보) · data/festival_confirm_log.json(전 기록)
const fs = require('fs');
const path = require('path');
const P = path.join(__dirname, 'data', 'festivals.json');
const PA = path.join(__dirname, 'data', 'festivals_api.json');
const PL = path.join(__dirname, 'data', 'festival_confirm_log.json');
const PC = path.join(__dirname, 'data', 'festival_candidates.json');

const raw = fs.readFileSync(P, 'utf8');
const data = JSON.parse(raw);
const L = Array.isArray(data) ? data : (data.festivals || Object.values(data)[0]);
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const YEAR = today.slice(0, 4);
const log = fs.existsSync(PL) ? JSON.parse(fs.readFileSync(PL, 'utf8')) : [];
const cands = fs.existsSync(PC) ? JSON.parse(fs.readFileSync(PC, 'utf8')) : {};
const args = process.argv.slice(2);
const DAYS = 42;          // 앞으로 열릴 것: 이 안에 시작하면 조사
const PAST_DAYS = 400;    // 지난 것: 종료일이 이 안이면 «실제로 그때 열렸나» 조사

const norm = s => String(s || '').replace(/\s|제\d+회|20\d\d|\(.*?\)|[·\-_'"]/g, '').toLowerCase();
const d8 = s => { s = String(s || '').replace(/\D/g, ''); return s.length >= 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : ''; };
const dayDiff = (a, b) => Math.round((new Date(a) - new Date(b)) / 864e5);
const months = (s, e) => { const m = []; let y = +s.slice(0, 4), k = +s.slice(5, 7); const ey = +e.slice(0, 4), ek = +e.slice(5, 7);
  while (y < ey || (y === ey && k <= ek)) { m.push(k); if (++k > 12) { k = 1; y++; } if (m.length > 12) break; } return m; };
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s);
const host = u => { try { return new URL(u).hostname.replace(/^(www|m)\./, ''); } catch (e) { return ''; } };
const addDays = (s, n) => new Date(new Date(s).getTime() + n * 864e5).toISOString().slice(0, 10);

let changed = 0;
function saveAll() {
  if (changed) {
    const same = JSON.stringify(JSON.parse(raw), null, 1) + (raw.endsWith('\n') ? '\n' : '');
    if (same !== raw.replace(/\r\n/g, '\n')) { console.log('⚠️ festivals.json 형식이 예상과 달라 저장하지 않음'); process.exit(1); }
    fs.writeFileSync(P, JSON.stringify(data, null, 1) + (raw.endsWith('\n') ? '\n' : ''));
  }
  fs.writeFileSync(PL, JSON.stringify(log, null, 1) + '\n');
  fs.writeFileSync(PC, JSON.stringify(cands, null, 1) + '\n');
}
function findF(name) { const f = L.find(x => x.name === name); if (!f) { console.log(`❌ 이름이 없음: ${name}`); process.exit(1); } return f; }
function checkDates(s, e) { if (!isDate(s) || !isDate(e) || e < s) { console.log('❌ 날짜 형식은 YYYY-MM-DD, 종료 ≥ 시작'); process.exit(1); } }

// ── 근거 페이지 기계 검증: 페이지를 직접 받아 «연도» 와 «날짜 문구»가 실제로 있는지 본다 ──
function datePats(d) {
  const [Y, M, D] = d.split('-'); const m = +M, dd = +D;
  return [
    new RegExp(`${m}\\s*월\\s*${dd}\\s*일`),                        // 10월 23일
    new RegExp(`(^|[^\\d])${m}\\s*\\.\\s*${dd}(?!\\d)`),              // 10.23 / 10. 23
    new RegExp(`(^|[^\\d])${M}\\s*\\.\\s*${D}(?!\\d)`),               // 09.04
    new RegExp(`(^|[^\\d])${m}\\s*/\\s*${dd}(?!\\d)`),                // 10/23
    new RegExp(`${Y}\\s*[-.년/]\\s*0?${m}\\s*[-.월/]\\s*0?${dd}(?!\\d)`), // 2026-10-23 / 2026.10.23 / 2026년 10월 23
    new RegExp(`${Y}${M}${D}`),                                         // 20261023
  ];
}
async function fetchText(u) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(u, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36', 'Accept-Language': 'ko-KR,ko;q=0.9' } });
    const buf = Buffer.from(await r.arrayBuffer());
    let cs = ((r.headers.get('content-type') || '').match(/charset=([\w-]+)/i) || [])[1];
    if (!cs) cs = (buf.slice(0, 3000).toString('latin1').match(/charset=["']?([\w-]+)/i) || [])[1];
    cs = (cs || 'utf-8').toLowerCase(); if (cs === 'ks_c_5601-1987' || cs === 'x-windows-949') cs = 'euc-kr';
    let txt; try { txt = new TextDecoder(cs).decode(buf); } catch (e) { txt = buf.toString('utf8'); }
    txt = txt.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ');
    return { ok: r.ok, status: r.status, txt };
  } catch (e) { return { ok: false, status: 0, txt: '', err: String(e.message || e).slice(0, 80) }; }
  finally { clearTimeout(t); }
}
async function verifyUrl(u, s, e) {
  if (!/^https?:\/\//.test(u || '')) return { pass: false, why: 'URL 아님' };
  const r = await fetchText(u);
  if (!r.ok || r.txt.length < 200) return { pass: false, why: `페이지를 못 읽음(${r.status || r.err || '빈 페이지'})` };
  const hasYear = r.txt.includes(s.slice(0, 4)) || new RegExp(`(^|[^\\d])${s.slice(2, 4)}\\s*\\.\\s*\\d{1,2}\\s*\\.`).test(r.txt);
  // 기사체 범위 표기: «18~20일», «31일부터 8월 2일까지», «9월 3일~6일» — 시작일·종료일이 한 덩어리로 붙어 있을 때만 인정
  const sm = +s.slice(5, 7), sd = +s.slice(8), em = +e.slice(5, 7), ed = +e.slice(8);
  const range = new RegExp(`(^|[^\\d])(${sm}\\s*월\\s*)?${sd}\\s*일?\\s*(\\([^)]{1,3}\\))?\\s*(부터|~|∼|～|〜|-|–|—|에서)\\s*(${em}\\s*월\\s*)?${ed}\\s*일`);
  // 달의 근거: 본문의 «N월» 또는 기사 작성일(YYYY.MM / YYYY-MM / YYYY년 MM월)이 그 달 ±1달 — 기사는 «오는 18일»처럼 달을 생략한다
  const Y = s.slice(0, 4);
  const mEv = m => new RegExp(`(^|[^\\d])${m}\\s*월`).test(r.txt)
    || [m - 1, m, m + 1].filter(x => x >= 1 && x <= 12).some(x => new RegExp(`${Y}\\s*[.\\-/년]\\s*0?${x}\\s*[.\\-/월]`).test(r.txt));
  const rangeHit = range.test(r.txt) && mEv(sm);
  // 기사체 개막·폐막: «26일 개막해 오는 28일까지», «지난 31일 … 2일까지» — 시작·종료 둘 다 있어야 인정
  const relS = new RegExp(`(^|[^\\d])${sd}\\s*일\\s*(\\([^)]{1,3}\\))?\\s*(개막|부터|막을|시작|열려|열린|열리|개최|에\\s*개막)`).test(r.txt) && mEv(sm);
  const relE = new RegExp(`(^|[^\\d])(${em}\\s*월\\s*)?${ed}\\s*일\\s*(\\([^)]{1,3}\\))?\\s*까지`).test(r.txt) && mEv(em);
  const sHit = datePats(s).some(p => p.test(r.txt)) || rangeHit || (relS && relE);
  const eHit = datePats(e).some(p => p.test(r.txt)) || rangeHit || (relS && relE);
  if (!hasYear) return { pass: false, why: `«${s.slice(0, 4)}» 표기가 페이지에 없음` };
  if (!sHit) return { pass: false, why: `시작일(${s}) 문구가 페이지에 없음` };
  if (!eHit) return { pass: false, why: `종료일(${e}) 문구가 페이지에 없음` };
  return { pass: true, why: '연도·시작·종료 문구 확인' };
}
async function verifyAll(urls, s, e) {
  const out = [];
  for (const u of urls) { const v = await verifyUrl(u, s, e); out.push({ url: u, host: host(u), ...v }); console.log(`   ${v.pass ? '✅' : '❌'} ${u}\n      → ${v.why}`); }
  return out;
}

(async () => {
  if (args[0] === '--check-url') {
    const [, u, s, e] = args; checkDates(s, e); await verifyAll([u], s, e); return;
  }

  // 조사자: 서로 다른 사이트 2곳이 기계 검증을 통과해야 후보가 된다
  if (args[0] === '--propose') {
    const [, name, s, e, u1, u2, place] = args; const f = findF(name); checkDates(s, e);
    if (!u1 || !u2 || host(u1) === host(u2)) { console.log('❌ 근거 2곳 필요(서로 다른 사이트)'); process.exit(1); }
    console.log(`🔎 조사자 근거 검증 — ${name} ${s}~${e}`);
    const v = await verifyAll([u1, u2], s, e);
    if (!v.every(x => x.pass)) { console.log('⛔ 후보 등록 안 함 — 통과 못 한 근거를 다른 페이지로 바꿔 다시 시도'); process.exit(2); }
    // 후보도 사이트에 반영한다 — 기계 검증을 통과한 발표 2곳이 있는데 예년 추정치를 계속 보여주는 게 더 부정확하다.
    //   단 confirmed 는 false 로 두고 pending 표시 → 사이트 배지 «발표 일정·교차 확인 중». «일정 확정»은 검증자 통과 뒤에만.
    const was = cands[name] ? cands[name].from : `${f.start}~${f.end}`;
    cands[name] = { start: s, end: e, place: place || '', sources: v.map(x => x.url), proposedAt: today, from: was };
    f.start = s; f.end = e; f.month = months(s, e); f.pending = true; if (place) f.place = place; changed++;
    log.push({ at: today, name, propose: `${s}~${e}`, from: was, place: place || undefined, sources: v.map(x => x.url) });
    saveAll(); console.log(`📋 후보 등록·반영(미확정): ${name} ${was} → ${s}~${e} — 검증자(--approve)의 독립 확인을 기다림`); return;
  }

  // 검증자: 후보와 «따로» 찾은 근거. 날짜가 같고, 근거 사이트가 조사자 것과 달라야 확정
  if (args[0] === '--approve') {
    const [, name, s, e, u, place] = args; const f = findF(name); checkDates(s, e);
    const c = cands[name];
    if (!c) { console.log(`❌ 후보가 없음 — 조사자(--propose)가 먼저 등록해야 한다: ${name}`); process.exit(1); }
    if (c.start !== s || c.end !== e) {
      log.push({ at: today, name, mismatch: `조사자 ${c.start}~${c.end} ≠ 검증자 ${s}~${e}`, sources: [...c.sources, u] });
      saveAll(); console.log(`⚠️ 불일치 — 조사자 ${c.start}~${c.end} / 검증자 ${s}~${e}. 확정하지 않음(장남님 보고 대상)`); process.exit(3);
    }
    if (c.sources.map(host).includes(host(u))) { console.log('❌ 검증자 근거는 조사자와 다른 사이트여야 한다'); process.exit(1); }
    console.log(`🔎 검증자 근거 검증 — ${name} ${s}~${e}`);
    const v = await verifyAll([u], s, e);
    if (!v[0].pass) { console.log('⛔ 확정 안 함 — 검증자 근거가 기계 검증을 통과하지 못함'); process.exit(2); }
    const from = c.from || `${f.start}~${f.end}`;
    f.start = s; f.end = e; f.month = months(s, e); f.confirmed = true; delete f.pending;
    const pl = place || c.place; if (pl) f.place = pl;
    f.sources = [...c.sources, u]; f.verifiedAt = today;
    delete cands[name]; changed++;
    log.push({ at: today, name, from, to: `${s}~${e}`, place: pl || undefined, confirm: '교차확인(조사자 2곳 + 검증자 1곳, 기계 검증 통과)', sources: f.sources });
    saveAll(); console.log(`✅ 확정 ${name}: ${from} → ${s}~${e}${pl ? ' · ' + pl : ''}`); return;
  }

  if (args[0] === '--note') {
    const [, name, note] = args; findF(name);
    log.push({ at: today, name, note }); saveAll(); console.log(`📝 기록 ${name}: ${note}`); return;
  }
  // 검증자용 — 후보의 «이름·지역»만 보여 준다. 조사자가 찾은 날짜·근거를 보면 독립 확인이 아니게 된다.
  if (args[0] === '--list-blind') {
    const w = Object.keys(cands);
    console.log(`🧪 검증할 후보 ${w.length}건 (날짜·근거는 일부러 가림 — 스스로 찾아서 --approve 할 것)`);
    for (const n of w) { const f = L.find(x => x.name === n) || {}; console.log(`- ${n} | ${f.region || ''} ${f.city || ''}`); }
    return;
  }
  if (args[0] === '--set') { console.log('❌ --set 은 폐지됐다(2026-09-30). 교차 확인: --propose(조사자) → --approve(검증자)'); process.exit(1); }

  // ① 공공데이터 대조 — «근거 1곳». 날짜는 고치되 확정(배지)은 주지 않는다. 지난 미확정도 대상.
  if (args[0] !== '--list' && fs.existsSync(PA)) {
    let api = JSON.parse(fs.readFileSync(PA, 'utf8'));
    api = Array.isArray(api) ? api : (api.items || api.festivals || Object.values(api)[0]);
    for (const f of L) {
      if (f.confirmed || f.end < addDays(today, -PAST_DAYS)) continue;
      const k = norm(f.name);
      const m = api.map(a => ({ a, n: norm(a.title), s: d8(a.start), e: d8(a.end) }))
        .filter(c => c.n && (c.n.includes(k) || k.includes(c.n)) && c.s && c.e && c.e >= c.s
          && c.s.slice(0, 4) === f.start.slice(0, 4) && Math.abs(dayDiff(c.s, f.start)) <= 45)
        .sort((x, y) => Math.abs(dayDiff(x.s, f.start)) - Math.abs(dayDiff(y.s, f.start)))[0];
      if (!m) continue;
      const src = `TourAPI «${m.a.title}» id ${m.a.id}`;
      if (f.apiSource === src && f.start === m.s && f.end === m.e) continue;
      const from = `${f.start}~${f.end}`;
      f.start = m.s; f.end = m.e; f.month = months(m.s, m.e); f.apiSource = src; changed++;
      log.push({ at: today, name: f.name, from, to: `${m.s}~${m.e}`, source: src, confirm: '공공데이터 1곳(미확정 유지)' });
      console.log(`🔁 공공데이터 반영(미확정 유지) ${f.name}: ${from} → ${m.s}~${m.e}`);
    }
    saveAll();
  }

  // ② 확인 목록 — 곧 열릴 것 + 이미 날짜가 지났는데 확인 안 된 것 + 검증 대기 후보
  const lim = addDays(today, DAYS), past = addDays(today, -PAST_DAYS);
  const lastNote = n => [...log].reverse().find(x => x.name === n && (x.note || x.mismatch));
  const line = f => { const nt = lastNote(f.name); return `- ${f.name} | 적힌 날짜 ${f.start}~${f.end} | ${f.city || ''} ${f.place || ''}${f.apiSource ? ' | 공공데이터 1곳' : ''}${nt ? ` | 지난 기록(${nt.at}): ${nt.note || nt.mismatch}` : ''}`; };
  const up = L.filter(f => !f.confirmed && !cands[f.name] && f.end >= today && f.start <= lim).sort((a, b) => a.start < b.start ? -1 : 1);
  const gone = L.filter(f => !f.confirmed && !cands[f.name] && f.end < today && f.end >= past).sort((a, b) => a.end < b.end ? 1 : -1);
  console.log(`\n🔎 조사 필요 ① 곧 열림 (미확정 · ${DAYS}일 안): ${up.length}건`); up.forEach(f => console.log(line(f)));
  console.log(`\n🔎 조사 필요 ② 날짜가 지났는데 미확정 (사이트엔 «올해 일정 확인 중»): ${gone.length}건 — 최근 것부터`); gone.forEach(f => console.log(line(f)));
  const wait = Object.entries(cands);
  console.log(`\n🧪 검증 대기 후보 (조사자 등록 → 검증자 확인 필요): ${wait.length}건`);
  wait.forEach(([n, c]) => console.log(`- ${n} | 후보 ${c.start}~${c.end} | 조사자 근거: ${c.sources.map(host).join(', ')}`));
  const rest = L.filter(f => !f.confirmed && f.start > lim).length;
  console.log(`(그 뒤 미확정 ${rest}건은 ${DAYS}일 안으로 들어오면 목록에 뜬다)`);
})();
