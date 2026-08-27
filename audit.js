// ── 축제모아 정밀 점검 ─────────────────────────────────────────────────
// 실행: node audit.js   결과: audit-report.md  +  콘솔 요약(🔴/🟠 건수)
// 매주 1회 예약작업이 이걸 돌린다. 사람이 안 봐도 숫자가 남게 하는 게 목적이다.
//
// ⚠️ 여기 박아 둔 «헛경보 방지» 3가지 — 전에 실제로 속았다.
//   ① walk 시작 경로를 '' 로 두면 페이지 키에 앞 슬래시가 빠져 「끊긴 링크 599개」가 뜬다 → '/' 로 시작
//   ② 링크를 세기 전에 <script> 를 걷어내야 한다 → JS 템플릿의 href="/' + f.k + '/" 가 끊긴 링크로 잡힌다
//   ③ <script type="application/json"> 데이터 섬을 JS로 컴파일하면 「문법오류 431건」이 뜬다 → type 으로 분기
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { parseAddr, validCoord } = require('./region');

const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');
const TODAY = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const SIDO = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

const R = [];                       // 보고서 줄
const RED = [], ORANGE = [];        // 요약용
const red = s => { RED.push(s); return '🔴 ' + s; };
const orange = s => { ORANGE.push(s); return '🟠 ' + s; };

const readJ = f => { try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); } catch (e) { return null; } };
const dnorm = s => String(s || '').replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');

R.push('# 축제모아 정밀 점검 — ' + TODAY);
R.push('`node audit.js` 자동 생성. 숫자는 전부 실측입니다.\n');

// ══ 1. 데이터 위생 ════════════════════════════════════════════════
R.push('## 1. 데이터 위생');
{
  const bad = { sido: [], merged: [], coord: [], nullish: [], date: [], html: [] };
  for (const f of fs.readdirSync(DATA)) {
    if (!f.endsWith('.json')) continue;
    const arr = readJ(f);
    if (!Array.isArray(arr) || !arr.length) continue;
    for (const o of arr) {
      if (!o || typeof o !== 'object') continue;
      const nm = o.title || o.name || o.n || '?';
      if (typeof o.addr === 'string' && o.addr && typeof o.sido === 'string') {
        const p = parseAddr(o.addr);
        if (p.sido && p.sido !== o.sido) bad.sido.push(f + ' · ' + nm + ' (' + o.sido + '→' + p.sido + ')');
      }
      for (const k of Object.keys(o)) {
        const v = o[k];
        if (typeof v === 'string' && v.indexOf('전남광주통합특별시') >= 0) bad.merged.push(f + ' · ' + nm + ' [' + k + ']');
        if (v === 'null' || v === 'undefined' || v === 'NaN') bad.nullish.push(f + ' · ' + nm + ' [' + k + ']');
      }
      if ('x' in o && 'y' in o && String(o.x || '') !== '' && String(o.y || '') !== '' && !validCoord(o.x, o.y))
        bad.coord.push(f + ' · ' + nm + ' (' + o.x + ', ' + o.y + ')');
      if (o.start && o.end && dnorm(o.end) < dnorm(o.start)) bad.date.push(f + ' · ' + nm + ' ' + o.start + '~' + o.end);
      for (const k of ['tel', 'note', 'open', 'rest', 'park', 'addr']) {
        if (typeof o[k] === 'string' && /<[^>]+>/.test(o[k])) bad.html.push(f + ' · ' + nm + ' [' + k + ']');
      }
    }
  }
  const rows = [
    ['시도 오분류 (주소와 라벨이 다름)', bad.sido],
    ['「전남광주통합특별시」 표기 잔존', bad.merged],
    ['국내 범위 밖 좌표', bad.coord],
    ['문자열 "null"/"undefined"', bad.nullish],
    ['종료일 < 시작일', bad.date],
    ['짧은 필드에 HTML 태그', bad.html]
  ];
  R.push('| 항목 | 건수 |'); R.push('|---|---|');
  rows.forEach(([label, a]) => R.push('| ' + label + ' | ' + (a.length ? '**' + a.length + '**' : '0') + ' |'));
  rows.forEach(([label, a]) => {
    if (!a.length) return;
    R.push('\n' + red(label + ' ' + a.length + '건'));
    a.slice(0, 10).forEach(s => R.push('- ' + s));
    if (a.length > 10) R.push('- … 외 ' + (a.length - 10) + '건');
  });
  if (rows.every(([, a]) => !a.length)) R.push('\n✅ 데이터 위생 이상 없음 (build 가 매번 `fix-data.js` 로 고칩니다)');
}

// ══ 2. 갱신 상태 ══════════════════════════════════════════════════
R.push('\n## 2. 데이터 갱신 상태');
{
  const stale = [];
  // ⚠️ 손으로 관리하는 파일은 «안 바뀌는 게 정상»이라 여기서 뺀다(안 빼면 매주 영구 🟠).
  //    markets.json = 유명 장터 손큐레이션(대표품목·서술). 자동 갱신되는 쪽은 markets_api.json 이다.
  const HANDMADE = new Set(['markets.json', 'audit-history.json']);
  for (const f of fs.readdirSync(DATA)) {
    if (!f.endsWith('.json') || HANDMADE.has(f)) continue;
    const age = Math.round((Date.now() - fs.statSync(path.join(DATA, f)).mtimeMs) / 86400e3);
    if (age >= 21) stale.push([f, age]);
  }
  stale.sort((a, b) => b[1] - a[1]);
  if (!stale.length) R.push('✅ 21일 넘게 안 바뀐 데이터 파일 없음');
  else { R.push(orange('21일 넘게 갱신 안 된 파일 ' + stale.length + '개')); stale.forEach(([f, a]) => R.push('- ' + f + ' — ' + a + '일')); }
}

// ══ 3. 「전국」인데 비어 있는 시·도 ═══════════════════════════════
R.push('\n## 3. 시·도 커버리지 (0인 곳 = 「전국」과 어긋남)');
{
  const SETS = [['오일장', 'markets_api.json'], ['온천', 'onsen.json'], ['봄꽃', 'flower.json'],
  ['계곡', 'valleys.json'], ['단풍', 'maple.json'], ['명산', 'mountains_ko.json'],
  ['카페', 'cafes_ko.json'], ['반려', 'pets.json'], ['무장애', 'accessible.json'], ['축제', 'festivals_api.json']];
  R.push('| 데이터 | 건수 | 비어 있는 시·도 |'); R.push('|---|---|---|');
  for (const [label, f] of SETS) {
    const j = readJ(f); if (!Array.isArray(j)) continue;
    const c = {}; j.forEach(o => c[o.sido] = (c[o.sido] || 0) + 1);
    const empty = SIDO.filter(s => !c[s]);
    R.push('| ' + label + ' | ' + j.length + ' | ' + (empty.length ? '**' + empty.join(', ') + '**' : '없음') + ' |');
    if (empty.length >= 3) ORANGE.push(label + ' — 빈 시도 ' + empty.length + '개(' + empty.join(',') + ')');
  }
}

// ══ 4. 설명 채움률 ════════════════════════════════════════════════
R.push('\n## 4. 설명(개요) 채움률 — 낮으면 페이지가 이름 나열이 된다');
{
  const SETS = [['온천', 'onsen.json'], ['봄꽃', 'flower.json'], ['계곡', 'valleys.json'],
  ['단풍', 'maple.json'], ['명산', 'mountains_ko.json'], ['카페', 'cafes_ko.json'],
  ['반려', 'pets.json'], ['무장애', 'accessible.json'], ['오일장', 'markets_api.json']];
  R.push('| 데이터 | 건수 | 개요 있음 | 전화번호 있음 |'); R.push('|---|---|---|---|');
  for (const [label, f] of SETS) {
    const j = readJ(f); if (!Array.isArray(j) || !j.length) continue;
    const ovK = ['ov', 'desc', 'summary'].find(k => k in j[0]);
    const ov = ovK ? Math.round(j.filter(o => o[ovK]).length / j.length * 100) : null;
    const tel = 'tel' in j[0] ? Math.round(j.filter(o => o.tel).length / j.length * 100) : null;
    R.push('| ' + label + ' | ' + j.length + ' | ' + (ov === null ? '**필드 없음**' : ov + '%') + ' | ' + (tel === null ? '—' : tel + '%') + ' |');
    if (ov === null || ov < 50) ORANGE.push(label + ' 개요 ' + (ov === null ? '필드 자체 없음' : ov + '%'));
  }
}

// ══ 4-B. 채움률이 «지난주보다 떨어졌나» ═══════════════════════════
// 🚨 2026-08-18 실사고: 카페를 재수집했더니 fetch-hours.js 가 채워 둔
//    영업시간·대표메뉴·주차가 2,018곳에서 통째로 사라졌다(캐시가 ov 만 물려줬다).
//    화면은 멀쩡해 보이고 🔴도 안 뜬다 — «있던 게 없어진 것»은 절대값으로는 안 잡힌다.
//    그래서 매 실행의 채움률을 남기고 **지난번보다 떨어지면 🔴**로 올린다.
R.push('\n## 4-B. 채움률 변화 (지난 점검 대비)');
{
  const HIST = path.join(DATA, 'audit-history.json');
  const WATCH = [
    ['오일장', 'markets_api.json', ['ov', 'sale', 'days', 'open', 'tel']],
    ['온천', 'onsen.json', ['ov', 'tel', 'open', 'park']],
    ['봄꽃', 'flower.json', ['ov', 'tel', 'open', 'park']],
    ['계곡', 'valleys.json', ['ov', 'tel', 'open', 'park']],
    ['단풍', 'maple.json', ['ov', 'tel', 'open', 'park']],
    ['명산', 'mountains_ko.json', ['ov', 'sigungu']],
    ['카페', 'cafes_ko.json', ['ov', 'open', 'rest', 'menu', 'park']],
    ['맛집', 'restaurants_ko.json', ['open', 'rest', 'menu', 'park']],
    ['숙박', 'stays_ko.json', ['ci', 'co', 'park']],
    ['반려', 'pets.json', ['psbl', 'type', 'need', 'note']],
    ['무장애', 'accessible.json', ['acc']],
    ['걷기길', 'trails.json', ['desc', 'summary', 'x']]
  ];
  let prev = {};
  try { prev = JSON.parse(fs.readFileSync(HIST, 'utf8')); } catch (e) { }
  const now = {};
  const drops = [];
  R.push('| 데이터 | 필드 | 지난번 | 이번 | 변화 |'); R.push('|---|---|---|---|---|');
  for (const [label, f, keys] of WATCH) {
    const j = readJ(f); if (!Array.isArray(j) || !j.length) continue;
    for (const k of keys) {
      const pct = Math.round(j.filter(o => o[k] && !(Array.isArray(o[k]) && !o[k].length)).length / j.length * 100);
      const id = f + ':' + k;
      now[id] = pct;
      const was = prev[id];
      if (was === undefined) continue;
      const diff = pct - was;
      if (diff <= -3) {                       // 3%p 넘게 떨어지면 사고로 본다
        drops.push(label + ' ' + k + ' ' + was + '% → ' + pct + '% (' + diff + '%p)');
        R.push('| ' + label + ' | ' + k + ' | ' + was + '% | **' + pct + '%** | 🔴 ' + diff + '%p |');
      } else if (diff !== 0) {
        R.push('| ' + label + ' | ' + k + ' | ' + was + '% | ' + pct + '% | ' + (diff > 0 ? '+' : '') + diff + '%p |');
      }
    }
  }
  if (!Object.keys(prev).length) R.push('| — | — | — | — | 첫 실행: 이번 값을 기준으로 저장했습니다 |');
  else if (!drops.length) R.push('| — | — | — | — | ✅ 떨어진 항목 없음 |');
  drops.forEach(d => RED.push('채움률 하락 — ' + d));
  if (drops.length) { R.push('\n' + red('채움률이 떨어진 항목 ' + drops.length + '개 — «있던 데이터가 사라진 것»입니다')); drops.forEach(d => R.push('- ' + d)); }
  try { fs.writeFileSync(HIST, JSON.stringify(now, null, 1)); } catch (e) { }
}

// ══ 5. 축제 재고 (겨울 절벽) ══════════════════════════════════════
R.push('\n## 5. 축제 재고 — 앞으로 몇 개가 남나');
{
  const fp = readJ('festival_pages.json') || [];
  R.push('| 시점 | 아직 안 끝난 축제 상세 |'); R.push('|---|---|');
  [0, 30, 60, 90, 120, 150].forEach(k => {
    const d = new Date(Date.now() + (9 * 3600e3) + k * 86400e3).toISOString().slice(0, 10);
    const n = fp.filter(f => dnorm(f.end) >= d).length;
    R.push('| ' + (k ? '+' + k + '일 (' + d + ')' : '오늘') + ' | ' + n + ' / ' + fp.length + ' |');
    if (k === 30 && n < 40) RED.push('30일 뒤 축제 재고 ' + n + '건 (임계 40 미만)');
  });
}
module.exports = { R, RED, ORANGE };
require('./audit-pages')(R, RED, ORANGE, red, orange);
