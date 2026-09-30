// intl-bridge.js — 외국어 축제(관광공사 언어별 API) ↔ 한국어 교차검증 축제를 «자동으로» 잇고, 검증 날짜를 씌운다 (2026-09-30)
//
// 왜: 외국어판은 언어별 API(EngService2·JpnService2·ChsService2·ChtService2)를 따로 받는다. ID 체계가 달라
//     한국어판에서 3곳 교차확인한 날짜가 외국어판엔 한 번도 흘러가지 않았다(언어마다 55~65개가 2025년 날짜).
//
// 연결 규칙(교차 확인 — 신호 하나로는 잇지 않는다):
//   신호 = ①같은 사진 파일 ②같은 전화번호(국문 목록에서 그 번호가 유일할 때만) ③같은 누리집 ④좌표 300m 이내
//   필수 = 시기 일치(예년 시작 월 ±1) — 두류공원 «E-World 별빛축제(11월)» ↔ «치맥페스티벌(7월)» 같은 오매칭 차단
//   · 신호 2개 이상 + 시기 일치 + 한국어 축제 1곳으로만 모임 → 연결
//   · 신호 1개뿐이거나 후보가 2곳 이상 → 연결하지 않고 data/festival_bridge.json 의 review 로(검증 예약작업이 본다)
//
// 적용(제자리, 매 빌드 — build.js 가 맨 앞에서 부른다. 수집기가 파일을 새로 받아도 다음 빌드에 다시 씌운다):
//   · 한국어 confirmed/pending → 외국어 start/end 를 검증 날짜로. 원래 API 값은 apiStart/apiEnd 에 보관.
//   · 필드 kv = 'confirmed' | 'pending' | 'tbc'(지났는데 미확정) | 'est' — 렌더러가 조용한 표시에 쓴다.
//   · 폐지(로그 action:'removed') → 그 외국어 기록은 파일에서 뺀다(페이지도 빌드에서 사라짐).
//   · 연결이 풀리면 apiStart/apiEnd 로 원상복구 — 사람 손 없이 되돌아간다.
const fs = require('fs');
const path = require('path');
const KV = require('./ko-verified');
const D = p => path.join(__dirname, 'data', p);
const LANGS = ['en', 'ja', 'zh', 'tw'];

const imgId = u => (String(u || '').match(/\/(\d+_image\d_\d+)\./) || [])[1] || '';
const telKey = t => { let d = String(t || '').replace(/\D/g, ''); if (d.startsWith('82')) d = '0' + d.slice(2); return d.length >= 9 ? d.slice(-9) : ''; };
const hpKey = u => { try { const x = new URL(/^https?:/.test(u) ? u : 'http://' + u); return (x.hostname.replace(/^(www|m)\./, '') + x.pathname.replace(/\/+$/, '')).toLowerCase(); } catch (e) { return ''; } };
const GENERIC_HP = /visitkorea|instagram|facebook|blog\.naver|youtube|korean\.visitkorea/;
const km = (a, b) => Math.hypot((+a.x - +b.x) * 88.8, (+a.y - +b.y) * 111.0);
const mon = s => +String(s || '').replace(/\D/g, '').slice(4, 6) || 0;
const monOk = (a, b) => { const x = mon(a), y = mon(b); if (!x || !y) return false; const d = Math.abs(x - y); return Math.min(d, 12 - d) <= 1; };

function run(opts = {}) {
  const quiet = !!opts.quiet;
  const V = KV.load();
  let api = [];
  try { api = JSON.parse(fs.readFileSync(D('festivals_api.json'), 'utf8')); } catch (e) { return { ok: false, why: 'festivals_api.json 없음' }; }

  // 1) 국문 API 한 줄 → 한국어 큐레이션 축제 이름 (이름 일치 + 같은 시·도). 폐지 이름도 따로 잡는다.
  const koList = V.ko;
  const apiKo = {};          // api.id → 한국어 이름
  const apiRemoved = {};     // api.id → 폐지 이름
  for (const a of api) {
    const n = KV.norm(a.title); if (!n) continue;
    const hits = koList.filter(f => { const k = KV.norm(f.name); return k && (k === n || (k.length >= 4 && n.length >= 4 && (k.includes(n) || n.includes(k)))) && (!a.sido || !f.region || a.sido === f.region); });
    const names = [...new Set(hits.map(f => f.name))];
    if (names.length === 1) apiKo[a.id] = names[0];
    if ([...V.removed].some(r => r && (r === n || (r.length >= 4 && (n.includes(r) || r.includes(n)))))) apiRemoved[a.id] = a.title;
  }
  // 전화번호 유일성(군청 대표번호처럼 여러 축제가 같이 쓰는 번호는 신호로 안 친다)
  const telCount = {}; api.forEach(a => { const k = telKey(a.tel); if (k) telCount[k] = (telCount[k] || 0) + 1; });
  const byImg = {}; api.forEach(a => { const k = imgId(a.img); if (k) (byImg[k] = byImg[k] || []).push(a); });
  let DEC = {}; try { DEC = JSON.parse(fs.readFileSync(D('festival_bridge_decisions.json'), 'utf8')); } catch (e) {}

  const report = { generatedAt: new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16), stats: {}, links: {}, review: [], removed: [], conflicts: [] };

  for (const L of LANGS) {
    const fp = D(`festivals_${L}.json`); if (!fs.existsSync(fp)) continue;
    const rawTxt = fs.readFileSync(fp, 'utf8'); let arr; try { arr = JSON.parse(rawTxt); } catch (e) { continue; }
    const st = { total: arr.length, linked: 0, confirmed: 0, pending: 0, tbc: 0, est: 0, redated: 0, restored: 0, review: 0, removed: 0 };
    const links = {}; const keep = [];
    // 같은 한국어 축제에 여러 외국어 줄(작년·올해 회차)이 붙으면 날짜는 가장 최근 줄에만 씌운다
    const pending = [];
    for (const f of arr) {
      // 원래 API 값 보관(수집기가 새로 받은 줄엔 없다 → 지금 값이 API 원본)
      if (!f.apiStart) { f.apiStart = f.start; f.apiEnd = f.end; }
      const cand = new Map();   // api.id → {a, sig:[]}
      const add = (a, s) => { if (!a) return; const c = cand.get(a.id) || { a, sig: [] }; if (!c.sig.includes(s)) c.sig.push(s); cand.set(a.id, c); };
      (byImg[imgId(f.img)] || []).forEach(a => add(a, 'img'));
      const tk = telKey(f.tel); if (tk && telCount[tk] === 1) api.forEach(a => { if (telKey(a.tel) === tk) add(a, 'tel'); });
      const hk = f.hp && !GENERIC_HP.test(f.hp) ? hpKey(f.hp) : ''; if (hk) api.forEach(a => { if (a.hp && hpKey(a.hp) === hk) add(a, 'hp'); });
      if (f.x && f.y) api.forEach(a => { if (a.x && a.y && km(a, f) <= 0.3) add(a, 'geo'); });
      // ⑤ 같은 회차 날짜 — 국문·외국어 API 원본의 시작일과 종료일이 «둘 다» 같은 날(연도까지). 이미 다른 신호로 후보가 된 것에만 붙인다.
      for (const c of cand.values()) if (String(c.a.start) === String(f.apiStart) && String(c.a.end) === String(f.apiEnd) && c.a.start) c.sig.push('date');
      // 신호가 이미 있는 후보에만 «좌표» 보강 신호를 붙인다(위에서 전부 더했으므로 여기선 걸러내기만)
      const good = [...cand.values()].filter(c => monOk(c.a.start, f.apiStart));
      const strong = good.filter(c => c.sig.length >= 2);
      // 폐지 → 외국어에서도 뺀다(신호 2개 이상 + 시기 일치로 같은 축제임을 확인한 경우만)
      const rm = strong.find(c => apiRemoved[c.a.id]);
      if (rm) { st.removed++; report.removed.push({ lang: L, id: f.id, title: f.title, ko: apiRemoved[rm.a.id], signals: rm.sig }); continue; }
      keep.push(f);
      // 검토 결정(data/festival_bridge_decisions.json) — 신호가 모자란 쌍을 검증 예약작업이 근거 URL 과 함께 판정해 둔 것.
      //   link 는 «신호 1개 이상 + 시기 일치» 후보 중에서만 인정(엉뚱한 연결 방지), reject 는 그 쌍을 영구히 막는다.
      const dec = (DEC[L] || {})[String(f.id)];
      const rejectKo = dec && dec.decision === 'reject' ? dec.ko : null;
      if (dec && dec.decision === 'link' && good.some(c => apiKo[c.a.id] === dec.ko)) {
        const c = good.find(x => apiKo[x.a.id] === dec.ko);
        pending.push({ f, ko: dec.ko, sig: [...c.sig, 'decision'], apiId: c.a.id }); continue;
      }
      const names = [...new Set(strong.map(c => apiKo[c.a.id]).filter(n => n && n !== rejectKo))];
      if (names.length === 1) {
        const c = strong.find(x => apiKo[x.a.id] === names[0]);
        pending.push({ f, ko: names[0], sig: c.sig, apiId: c.a.id });
      } else {
        if (names.length > 1) report.review.push({ lang: L, id: f.id, title: f.title, why: '한국어 축제 여러 곳과 겹침', ko: names });
        else { const weak = good.filter(c => c.sig.length === 1 && apiKo[c.a.id] && apiKo[c.a.id] !== rejectKo); if (weak.length) report.review.push({ lang: L, id: f.id, title: f.title, why: `신호 1개(${weak[0].sig[0]})뿐`, ko: [...new Set(weak.map(c => apiKo[c.a.id]))] }); }
        // 연결이 풀린 줄은 원상복구
        if (f.kv) { f.start = f.apiStart; f.end = f.apiEnd; delete f.kv; delete f.kvName; st.restored++; }
      }
    }
    // 날짜 적용 — 같은 한국어 축제에 붙은 줄 중 API 시작일이 가장 늦은 줄에만 검증 날짜를 준다
    const latest = {}; pending.forEach(p => { if (!latest[p.ko] || String(p.f.apiStart) > String(latest[p.ko].f.apiStart)) latest[p.ko] = p; });
    for (const p of pending) {
      const v = V.byName[KV.norm(p.ko)]; const f = p.f; if (!v) continue;
      st.linked++;
      const isLatest = latest[p.ko] === p;
      let kv = v.status;
      if ((kv === 'confirmed' || kv === 'pending') && isLatest) {
        const s = KV.d8(v.start), e = KV.d8(v.end);
        if (f.start !== s || f.end !== e) { f.start = s; f.end = e; st.redated++; }
      } else {
        if (f.kv && (f.start !== f.apiStart || f.end !== f.apiEnd)) { f.start = f.apiStart; f.end = f.apiEnd; st.restored++; }
        if (!isLatest) kv = 'old';   // 지난 회차 줄 — 표시만 원본대로
      }
      f.kv = kv; f.kvName = p.ko; st[kv] = (st[kv] || 0) + 1;
      links[f.id] = { ko: p.ko, kv, signals: p.sig, apiId: p.apiId };
    }
    st.review = report.review.filter(r => r.lang === L).length;
    report.stats[L] = st; report.links[L] = links;
    const out = JSON.stringify(keep);
    if (out !== rawTxt) fs.writeFileSync(fp, out);
  }
  // en-fix(영어 수동 교정)와 충돌 점검 — 교정파일이 이긴다(렌더 때 뒤에 적용). 다르면 알린다.
  try {
    const fx = JSON.parse(fs.readFileSync(D('festivals_en_fix.json'), 'utf8'));
    for (const [id, l] of Object.entries(report.links.en || {})) {
      const x = fx[id]; if (!x || !x.start || l.kv !== 'confirmed') continue;
      const v = V.byName[KV.norm(l.ko)];
      if (KV.d8(x.start) !== KV.d8(v.start) || (x.end && KV.d8(x.end) !== KV.d8(v.end))) report.conflicts.push({ lang: 'en', id, ko: l.ko, koDates: `${v.start}~${v.end}`, fix: `${x.start}~${x.end || ''}` });
    }
  } catch (e) {}
  fs.writeFileSync(D('festival_bridge.json'), JSON.stringify(report, null, 1) + '\n');
  if (!quiet) {
    for (const [L, s] of Object.entries(report.stats)) console.log(`🌐 ${L}: 연결 ${s.linked}/${s.total} (확정 ${s.confirmed} · 후보 ${s.pending} · 확인중 ${s.tbc} · 예년 ${s.est}) · 날짜 교체 ${s.redated} · 복구 ${s.restored} · 폐지 삭제 ${s.removed} · 검토 ${s.review}`);
    if (report.conflicts.length) console.log(`⚠️ 영어 교정파일과 날짜 충돌 ${report.conflicts.length}건 — data/festival_bridge.json conflicts`);
  }
  return { ok: true, report };
}

// ── 검토 판정(검증 예약작업용) ─────────────────────────────────────────────
//   node intl-bridge.js --review                         신호가 모자라 보류된 쌍 목록
//   node intl-bridge.js --decide en 1385298 link "부산불꽃축제" <근거URL>
//        → 근거 페이지를 기계로 열어 «한국어 축제명»과 «외국어 축제명(또는 그 핵심 단어)»이 둘 다 있어야 기록된다.
//   node intl-bridge.js --decide en 3352421 reject "D.FESTA 거리공연축제" "다른 공연(연극)"
async function fetchText(u) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(u, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' } });
    const buf = Buffer.from(await r.arrayBuffer());
    let cs = ((r.headers.get('content-type') || '').match(/charset=([\w-]+)/i) || [])[1] || (buf.slice(0, 3000).toString('latin1').match(/charset=["']?([\w-]+)/i) || [])[1] || 'utf-8';
    cs = cs.toLowerCase(); if (cs === 'ks_c_5601-1987') cs = 'euc-kr';
    let txt; try { txt = new TextDecoder(cs).decode(buf); } catch (e) { txt = buf.toString('utf8'); }
    return { ok: r.ok, txt: txt.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') };
  } catch (e) { return { ok: false, txt: '' }; } finally { clearTimeout(t); }
}
async function cli(a) {
  if (a[0] === '--review') {
    const r = run({ quiet: true }).report;
    console.log(`🔍 연결 보류 ${r.review.length}건 — 같은 축제인지 근거를 찾아 --decide 로 판정`);
    r.review.forEach(x => console.log(`- ${x.lang} ${x.id} «${x.title}» ↔ ${x.ko.join(' / ')} (${x.why})`));
    return;
  }
  if (a[0] === '--decide') {
    const [, L, id, decision, ko, ev] = a;
    if (!LANGS.includes(L) || !id || !['link', 'reject'].includes(decision) || !ko) { console.log('❌ 형식: --decide <en|ja|zh|tw> <id> <link|reject> "<한국어 축제명>" <근거>'); process.exit(1); }
    const arr = JSON.parse(fs.readFileSync(D(`festivals_${L}.json`), 'utf8')); const f = arr.find(x => String(x.id) === String(id));
    if (!f) { console.log('❌ 그 외국어 id 가 없음'); process.exit(1); }
    if (!KV.load().byName[KV.norm(ko)]) { console.log('❌ 한국어 목록에 없는 축제명'); process.exit(1); }
    if (decision === 'link') {
      if (!/^https?:\/\//.test(ev || '')) { console.log('❌ link 는 근거 URL 이 필요'); process.exit(1); }
      const r = await fetchText(ev); const T = r.txt.replace(/\s/g, '');
      // 한국어명이 페이지에 있거나, 그 페이지가 «그 한국어 축제의 공식 누리집»(국문 API hp)과 같은 사이트면 인정 — 공식 외국어판은 한글명을 안 쓴다
      const apiAll = JSON.parse(fs.readFileSync(D('festivals_api.json'), 'utf8'));
      const offHosts = apiAll.filter(x => KV.norm(x.title) === KV.norm(ko) && x.hp).map(x => hpKey(x.hp).split('/')[0]);
      const evHost = hpKey(ev).split('/')[0];
      const koHit = T.includes(ko.replace(/\s/g, '')) || T.includes(KV.norm(ko)) || (evHost && offHosts.includes(evHost));
      const words = String(f.title).split(/[\s\-–:·・,()（）「」]+/).filter(w => w.length >= 2 && !/^(festival|祭り|庆典|節|节|慶典|フェスティバル)$/i.test(w));
      const fHit = T.includes(String(f.title).replace(/\s/g, '')) || words.filter(w => T.includes(w)).length >= Math.min(2, words.length);
      if (!r.ok || !koHit || !fHit) { console.log(`⛔ 기록 안 함 — 근거 페이지에 ${!r.ok ? '접속 실패' : !koHit ? '한국어 축제명 없음' : '외국어 축제명 없음'}`); process.exit(2); }
    }
    const DEC = (() => { try { return JSON.parse(fs.readFileSync(D('festival_bridge_decisions.json'), 'utf8')); } catch (e) { return {}; } })();
    (DEC[L] = DEC[L] || {})[String(id)] = { ko, decision, evidence: ev || '', title: f.title, at: new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10) };
    fs.writeFileSync(D('festival_bridge_decisions.json'), JSON.stringify(DEC, null, 1) + '\n');
    console.log(`✅ 판정 기록 ${L} ${id} ${decision} ${ko}`); run();
    return;
  }
  run();
}

module.exports = { run };
if (require.main === module) cli(process.argv.slice(2));
