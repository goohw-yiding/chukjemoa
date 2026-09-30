// ko-verified.js — 한국어 교차검증 결과(data/festivals.json)를 외국어판이 «같은 기준»으로 쓰게 하는 공용 창구 (2026-09-30)
//   진실의 원천은 오직 data/festivals.json 의 confirmed(서로 다른 사이트 3곳) · pending(기계 검증 2곳) 표시다.
//   외국어 쪽은 이 모듈만 부른다 — 로그 형식이 바뀌어도(9/30 --approve 도입) 외국어판이 끊기지 않게 한 곳에 모았다.
//   삭제: festival_confirm_log.json 의 action:'removed'(폐지 확인) 이름은 외국어판에서도 자동으로 빠진다.
const fs = require('fs');
const path = require('path');
const D = p => path.join(__dirname, 'data', p);
const readJ = (p, dflt) => { try { return JSON.parse(fs.readFileSync(D(p), 'utf8')); } catch (e) { return dflt; } };

// 이름 정규화 — 회차·연도·괄호·기호 제거. confirm-festivals.js / intl.js 와 같은 성질.
const norm = s => String(s || '').replace(/제\s*\d+\s*회|20\d\d|\(.*?\)|（.*?）|[\s·・\-_'"「」<>〈〉:：,.&]/g, '').toLowerCase();
const d8 = s => String(s || '').replace(/\D/g, '').slice(0, 8);
const today = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

function load() {
  const ko = readJ('festivals.json', []);
  const log = readJ('festival_confirm_log.json', []);
  const removed = new Set((Array.isArray(log) ? log : []).filter(r => r && r.action === 'removed').map(r => norm(r.name)));
  const T = today();
  const byName = {};   // norm(name) → 상태
  for (const f of ko) {
    if (!f || !f.name) continue;
    let status = 'est';                                    // 예년 기준(검증 전, 아직 안 지남)
    if (f.confirmed) status = 'confirmed';
    else if (f.pending) status = 'pending';
    else if (f.end < T) status = 'tbc';                    // 지났는데 미확정 → «올해 일정 확인 중»
    byName[norm(f.name)] = { name: f.name, status, start: f.start, end: f.end, region: f.region, city: f.city,
      sources: f.sources || [], verifiedAt: f.verifiedAt || '' };
  }
  return { ko, byName, removed, norm, d8 };
}

// 외국어 달력(intl.js)용 — 국문 TourAPI 목록(festivals_api.json)에 검증 날짜를 씌우고 폐지 축제를 뺀다.
//   같은 이름이 여러 줄(작년·올해 회차)이면 시작일이 가장 늦은 한 줄에만 씌운다(중복 카드 방지).
function applyToKoApi(list) {
  const V = load(); let n = 0; const before = list.length;
  for (let i = list.length - 1; i >= 0; i--) if (V.removed.has(norm(list[i].title))) list.splice(i, 1);   // 제자리에서 뺀다(호출 쪽이 const 배열)
  const kept = list;
  const pick = {};
  kept.forEach(f => { const k = norm(f.title), v = V.byName[k];
    if (v && (v.status === 'confirmed' || v.status === 'pending') && (!pick[k] || String(f.start) > String(pick[k].start))) pick[k] = f; });
  kept.forEach(f => { const k = norm(f.title), v = V.byName[k];
    if (!v || pick[k] !== f) return;
    const s = d8(v.start), e = d8(v.end);
    if (String(f.start) !== s || String(f.end) !== e) { if (!f._ck) f._ck = (+f.x).toFixed(3) + '|' + (+f.y).toFixed(3) + '|' + String(f.start).slice(0, 8); f.start = s; f.end = e; n++; }
    f._kv = v.status; });
  return { list: kept, changed: n, removed: before - kept.length };
}

module.exports = { load, applyToKoApi, norm, d8 };
