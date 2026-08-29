// ── 축제 개요 보강분 검증·병합 (매 빌드마다 돈다) ────────────────────────────────
// 사람이 실제 출처를 확인해 늘려 쓴 개요(data/festival_ov_override.json)를
// festivals_api.json에 병합한다. fetch-festivals.js가 API 원본을 통째로 덮어써도
// (파일 맨 위 주석 참고: "wholesale-overwritten") 늘린 개요가 사라지지 않게 하는 장치.
//
// 원칙(fix-data.js와 동일): **없는 사실을 지어내지 않는다.**
// override 항목은 반드시 실제 출처(source)·확인일(checkedAt)·검증 당시 원본 스냅샷(snapshot)을 가진다.
// 병합 시점에 원본(festivals_api.json)의 start/end/addr가 검증 당시 스냅샷과 달라졌으면
// — 즉 새로고침으로 일정·장소가 바뀌었으면 — 그 개요는 더 이상 신뢰할 수 없으므로
// **병합하지 않고** 원본 개요(짧은 것) 그대로 둔 채 "재확인 필요"로 보고한다.
// 이게 이 파일이 곧 "검증 시스템"이다: 매 빌드가 곧 재검증 사이클이다.
'use strict';
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, 'data');
const OV_FILE = path.join(DATA, 'festival_ov_override.json');
const FES_FILE = path.join(DATA, 'festivals_api.json');

function merge(opts) {
  const quiet = opts && opts.quiet;
  let overrides = {};
  try { overrides = JSON.parse(fs.readFileSync(OV_FILE, 'utf8')); } catch (e) { return { merged: 0, stale: 0, missing: 0 }; }

  let fes;
  try { fes = JSON.parse(fs.readFileSync(FES_FILE, 'utf8')); } catch (e) { return { merged: 0, stale: 0, missing: 0 }; }

  let merged = 0, stale = 0, missing = 0;
  const staleList = [], missingList = [];
  const byId = new Map(fes.map(f => [String(f.id), f]));

  for (const id of Object.keys(overrides)) {
    const o = overrides[id];
    const f = byId.get(String(id));
    if (!f) { missing++; missingList.push(id + ' ' + (o.title || '')); continue; } // 원본에서 사라진 축제 — 스킵

    const snap = o.snapshot || {};
    const changed = (snap.start && snap.start !== f.start) || (snap.end && snap.end !== f.end) || (snap.addr && snap.addr !== f.addr);
    if (changed) { stale++; staleList.push(id + ' ' + f.title + ' (원본 변경됨 — 재확인 필요)'); continue; }

    if (o.ov && o.ov.length >= 300) { f.ov = o.ov; merged++; }
  }

  if (merged || stale) fs.writeFileSync(FES_FILE, JSON.stringify(fes));

  if (!quiet) {
    if (!merged && !stale && !missing) {
      // 조용히 통과 (override 파일이 비어있을 때 매 빌드 로그 스팸 방지)
    } else {
      console.log(`🔎 축제 개요 보강 병합 ${merged}건` + (stale ? ` · ⚠ 재확인 필요 ${stale}건(원본 변경됨)` : '') + (missing ? ` · 원본 소멸 ${missing}건` : ''));
      staleList.forEach(l => console.log('   · ' + l));
      missingList.forEach(l => console.log('   · (소멸) ' + l));
    }
  }
  return { merged, stale, missing, staleList, missingList };
}

module.exports = { merge };
if (require.main === module) merge();
