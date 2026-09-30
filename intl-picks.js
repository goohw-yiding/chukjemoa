// intl-picks.js — 언어권별 «그 나라 사람들이 좋아하는 축제» 자동 선정 (2026-09-30)
//
//   node intl-picks.js --check   근거 URL 을 전부 직접 열어 needles 가 실제로 있는지 검사 → data/intl_evidence_status.json
//   node intl-picks.js           (빌드 때 자동) 통과한 근거만으로 점수 → data/intl_picks.json
//                                + 한국어 목록에 없는 선정 축제 → data/festival_wishlist.json (교차검증 대기열 자동 등록/해제)
//                                + 선정됐는데 미확정인 한국어 축제 → data/festival_priority.json (조사자 순서 맨 앞)
//
// 원칙
//   · 근거는 «사람이 믿어 달라는 문장»이 아니라 «기계가 열어 본 페이지». 두 번 연속 실패한 근거는 점수에서 자동 제외.
//   · 점수 = 근거 종류 가중치 합(stat 3 · agency 2 · ota 2 · target 2 · media 1). 같은 URL 은 축제당 한 번만 센다.
//   · 선정 기준: 점수 2 이상 — 그 나라 여행사·예약·통계·지자체 타깃 근거 1개, 또는 그 나라 언어 기사 2개. 언어당 최대 25개.
//   · 우리 이익: 제휴(클룩·KKday·트립닷컴) 상품이 확인된 축제는 +1 — 선정 순서에서 조용히 앞선다(표시는 따로 안 함).
const fs = require('fs');
const path = require('path');
const KV = require('./ko-verified');
const D = p => path.join(__dirname, 'data', p);
const readJ = (p, d) => { try { return JSON.parse(fs.readFileSync(D(p), 'utf8')); } catch (e) { return d; } };
const W = { stat: 3, agency: 2, ota: 2, target: 2, media: 1 };
const COMMERCE = /klook\.com|kkday\.com|trip\.com/;
const MIN = 2, MAX = 25, LANGS = ['en', 'ja', 'zh', 'tw'];
const today = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

async function fetchText(u) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 25000);
  try {
    const r = await fetch(u, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', 'Accept-Language': 'ko,en;q=0.8,ja;q=0.6,zh;q=0.5' } });
    const buf = Buffer.from(await r.arrayBuffer());
    let cs = ((r.headers.get('content-type') || '').match(/charset=([\w-]+)/i) || [])[1] || (buf.slice(0, 4000).toString('latin1').match(/charset=["']?([\w-]+)/i) || [])[1] || 'utf-8';
    cs = cs.toLowerCase(); if (cs === 'ks_c_5601-1987' || cs === 'x-windows-949') cs = 'euc-kr';
    let txt; try { txt = new TextDecoder(cs).decode(buf); } catch (e) { txt = buf.toString('utf8'); }
    return { ok: r.ok, status: r.status, txt };   // 태그 안(title·meta·JSON)에도 이름이 있을 수 있어 원문 그대로 본다
  } catch (e) { return { ok: false, status: 0, txt: '', err: String(e.message || e).slice(0, 60) }; }
  finally { clearTimeout(t); }
}

async function check() {
  const ev = readJ('intl_evidence.json', { items: [] });
  const st = readJ('intl_evidence_status.json', {});
  const cache = {};
  for (const it of ev.items) {
    if (!cache[it.url]) { cache[it.url] = await fetchText(it.url);
      if (!cache[it.url].ok) { await new Promise(r => setTimeout(r, 3000)); cache[it.url] = await fetchText(it.url); } }   // 연결 리셋이 잦은 곳(busan.go.kr 등) 한 번 재시도
    const r = cache[it.url];
    const miss = (it.needles || []).filter(n => !r.txt.includes(n));
    const ok = r.ok && r.txt.length > 500 && !miss.length;
    const prev = st[it.id] || {};
    st[it.id] = { ok, at: today(), http: r.status, why: ok ? '' : (!r.ok ? `접속 실패(${r.status || r.err})` : r.txt.length <= 500 ? '빈 페이지' : `없는 문구: ${miss.join(', ')}`),
      lastOk: ok ? today() : (prev.lastOk || ''), failStreak: ok ? 0 : (prev.failStreak || 0) + 1 };
    console.log(`${ok ? '✅' : '❌'} ${it.id} — ${st[it.id].why || it.claim}`);
  }
  // 레지스트리에서 지운 근거의 상태는 정리
  Object.keys(st).forEach(k => { if (!ev.items.some(i => i.id === k)) delete st[k]; });
  fs.writeFileSync(D('intl_evidence_status.json'), JSON.stringify(st, null, 1) + '\n');
  const n = Object.values(st).filter(s => s.ok).length;
  console.log(`\n근거 ${ev.items.length}건 중 통과 ${n}건`);
}

function pick(opts = {}) {
  const ev = readJ('intl_evidence.json', { items: [], meta: {} });
  const st = readJ('intl_evidence_status.json', {});
  const bridge = readJ('festival_bridge.json', { links: {} });
  const api = readJ('festivals_api.json', []);
  const V = KV.load();
  // 쓸 수 있는 근거: 마지막 검사 통과, 또는 한 번만 실패(일시 장애 허용)하고 30일 안에 통과한 적 있음
  const usable = it => { const s = st[it.id]; if (!s) return false; if (s.ok) return true;
    return s.failStreak < 2 && s.lastOk && (new Date(today()) - new Date(s.lastOk)) / 864e5 <= 30; };
  const out = { generatedAt: today(), rule: `근거 점수 ${MIN} 이상 · 언어당 최대 ${MAX}`, langs: {} };
  const wish = {}; const prio = new Set();
  for (const L of LANGS) {
    const agg = {};
    for (const it of ev.items) {
      if (!it.langs.includes(L) || !usable(it)) continue;
      const a = agg[it.ko] = agg[it.ko] || { ko: it.ko, score: 0, urls: new Set(), reasons: [], commerce: false };
      if (a.urls.has(it.url)) continue;           // 같은 페이지는 한 번만
      a.urls.add(it.url); a.score += W[it.kind] || 1; a.reasons.push({ claim: it.claim, url: it.url, kind: it.kind });
      if (COMMERCE.test(it.url)) a.commerce = true;
    }
    const list = Object.values(agg).map(a => ({ ...a, rank: a.score + (a.commerce ? 1 : 0) }))
      .filter(a => a.score >= MIN).sort((x, y) => y.rank - x.rank || y.score - x.score).slice(0, MAX);
    out.langs[L] = list.map(a => {
      const v = V.byName[KV.norm(a.ko)];
      const ids = Object.entries((bridge.links || {})[L] || {}).filter(([, l]) => l.ko === a.ko).map(([id]) => id);
      if (!v) {   // 한국어 목록에 없음 → 교차검증 대기열(위시리스트)로
        const m = (ev.meta || {})[a.ko] || {};
        const ar = api.filter(x => KV.norm(x.title) === KV.norm(a.ko) || KV.norm(x.title).includes(KV.norm(a.ko))).sort((p, q) => String(q.start).localeCompare(String(p.start)))[0];
        wish[a.ko] = wish[a.ko] || { name: a.ko, region: m.region || (ar && ar.sido) || '', city: m.city || (ar && ar.sigungu) || '', category: m.category || '축제',
          desc: m.desc || '', apiTitle: ar ? ar.title : '', langs: [], why: [] };
        wish[a.ko].langs.push(L); wish[a.ko].why.push(...a.reasons.map(r => `${L}: ${r.claim}`));
      } else if (!v.status || v.status !== 'confirmed') prio.add(a.ko);
      return { ko: a.ko, score: a.score, commerce: a.commerce, status: v ? v.status : 'not-listed', ids, reasons: a.reasons };
    });
  }
  fs.writeFileSync(D('intl_picks.json'), JSON.stringify(out, null, 1) + '\n');
  // 위시리스트: 자동 등록·자동 해제(근거가 떨어지거나 한국어 목록에 들어가면 빠진다)
  const wl = Object.values(wish).map(w => ({ ...w, why: [...new Set(w.why)] }));
  fs.writeFileSync(D('festival_wishlist.json'), JSON.stringify(wl, null, 1) + '\n');
  fs.writeFileSync(D('festival_priority.json'), JSON.stringify([...prio], null, 1) + '\n');
  if (!opts.quiet) {
    for (const L of LANGS) console.log(`⭐ ${L} 선정 ${out.langs[L].length}: ` + out.langs[L].map(p => `${p.ko}(${p.score}${p.commerce ? '+' : ''}${p.status === 'confirmed' ? '✓' : p.status === 'not-listed' ? '☆' : '…'})`).join(' · '));
    console.log(`☆ 한국어 목록에 없어 교차검증 대기열로: ${wl.map(w => w.name).join(', ') || '없음'}`);
    console.log(`… 선정됐지만 미확정 → 조사자 우선: ${[...prio].join(', ') || '없음'}`);
  }
  return out;
}

module.exports = { pick, check };
if (require.main === module) { (process.argv[2] === '--check' ? check() : Promise.resolve(pick())).catch(e => { console.error(e); process.exit(1); }); }
