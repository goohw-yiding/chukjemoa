// ── data/*.json 위생 점검 겸 자동 수리 ────────────────────────────────
// build.js 맨 앞에서 «매 빌드마다» 돈다. 그래서 수집 스크립트 하나가 다시 어긋나도
// 사이트에는 틀린 값이 나가지 않는다. 단독 실행도 된다: node fix-data.js
//
// ⚠️ 왜 만들었나 (2026-08-18 전수 점검에서 실제로 나온 것들)
//   ① 전남 42곳이 「광주」로 분류돼 있었다(단풍21·계곡9·봄꽃7·온천5).
//      화면엔 「광주 단풍 25곳」인데 그 안에 고흥·광양·곡성·해남이 있었고, 「전남 단풍 0곳」이었다.
//   ② 「전남광주통합특별시」가 22개 파일 2,553회, 화면 31페이지에 그대로 찍혔다(JSON-LD 주소 포함).
//   ③ 좌표가 중국 남해 기본값(117.99, 19.69)인 것이 55건 남아 있었다.
//   ④ 종료일이 시작일보다 빠른 축제 1건, 좌표가 문자열 "null"인 것 3건, 전화번호에 <br> 6건.
//
// 원칙: **없는 사실을 지어내지 않는다.** 못 고치는 값은 비워 두고 숫자로 보고한다.
'use strict';
const fs = require('fs');
const path = require('path');
const { parseAddr, tidyText, validCoord } = require('./region');

const DATA = path.join(__dirname, 'data');
const TEXT_KEYS = ['addr', 'ov', 'desc', 'summary', 'note', 'intro', 'tour', 'menu', 'place', 'title', 'name'];
const HTMLish = /<[^>]+>|&nbsp;|&amp;|&lt;|&gt;|&#39;|&quot;/;
// ⚠️ 태그 제거는 «짧은 값»에만 건다.
//    처음에 전 필드에 걸었더니 posts.json 블로그 본문 27편의 <p>·<strong> 마크업을 통째로 날렸다(즉시 되돌림).
//    본문(body)처럼 HTML이 «정상»인 필드가 있다. 화이트리스트 + 길이 제한 두 겹으로 막는다.
const HTML_STRIP_KEYS = new Set(['tel', 'note', 'open', 'rest', 'park', 'addr', 'place', 'title', 'name', 'sigungu', 'sido']);
const HTML_STRIP_MAXLEN = 300;

function stripTags(s) {
  return String(s).replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s{2,}/g, ' ').trim();
}
const isYmd = s => /^\d{8}$/.test(String(s));
const isIso = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s));

function repair(opts) {
  const quiet = opts && opts.quiet;
  const stat = { files: 0, sido: 0, merged: 0, coord: 0, nullish: 0, html: 0, date: 0, sigungu: 0 };
  const detail = [];

  for (const f of fs.readdirSync(DATA)) {
    if (!f.endsWith('.json')) continue;
    let arr;
    try { arr = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); } catch (e) { continue; }
    if (!Array.isArray(arr) || !arr.length) continue;
    let changed = 0;
    const before = { sido: stat.sido, merged: stat.merged, coord: stat.coord, nullish: stat.nullish, html: stat.html, date: stat.date, sigungu: stat.sigungu };

    for (const o of arr) {
      if (!o || typeof o !== 'object') continue;

      // ① 시도 오분류 — 주소가 있으면 주소가 정답이다(수집 시점 매핑표보다 믿을 만하다)
      if (typeof o.addr === 'string' && o.addr && typeof o.sido === 'string') {
        const p = parseAddr(o.addr);
        if (p.sido && p.sido !== o.sido) { o.sido = p.sido; stat.sido++; changed++; }
        // 시군구가 비어 있으면 주소에서 되살린다(명산 332건이 전부 빈칸이었다)
        if (p.sigungu && !o.sigungu && 'sigungu' in o) { o.sigungu = p.sigungu; stat.sigungu++; changed++; }
      }

      // ② 통합 표기 정리 — 주소·본문 양쪽. 시도를 알면 그 값으로, 모르면 '광주'로.
      for (const k of TEXT_KEYS) {
        if (typeof o[k] !== 'string' || o[k].indexOf('전남광주통합특별시') < 0) continue;
        const fixed = tidyText(o[k], o.sido || parseAddr(o.addr || '').sido);
        if (fixed !== o[k]) { o[k] = fixed; stat.merged++; changed++; }
      }

      // ③ 좌표 위생 — 국내 범위 밖이면 «비운다». 틀린 자리에 찍느니 안 찍는 게 낫다.
      if ('x' in o && 'y' in o) {
        const hasVal = String(o.x || '') !== '' && String(o.y || '') !== '';
        if (hasVal && !validCoord(o.x, o.y)) { o.x = ''; o.y = ''; stat.coord++; changed++; }
      }

      // ④ 문자열 "null"/"undefined"/"NaN" → 빈값
      for (const k of Object.keys(o)) {
        if (o[k] === 'null' || o[k] === 'undefined' || o[k] === 'NaN') { o[k] = ''; stat.nullish++; changed++; }
      }

      // ⑤ 짧은 필드에 남은 HTML 조각 제거 (전화번호의 <br> 등). 본문은 절대 건드리지 않는다.
      for (const k of HTML_STRIP_KEYS) {
        if (typeof o[k] !== 'string' || o[k].length > HTML_STRIP_MAXLEN || !HTMLish.test(o[k])) continue;
        const s = stripTags(o[k]);
        if (s !== o[k]) { o[k] = s; stat.html++; changed++; }
      }

      // ⑥ 시작일 > 종료일이면 뒤바뀐 것으로 보고 되돌린다
      const a = o.start, b = o.end;
      if (a && b && ((isYmd(a) && isYmd(b)) || (isIso(a) && isIso(b))) && String(b) < String(a)) {
        o.start = b; o.end = a; stat.date++; changed++;
      }
    }

    if (changed) {
      fs.writeFileSync(path.join(DATA, f), JSON.stringify(arr));
      stat.files++;
      const d = Object.keys(before).filter(k => stat[k] !== before[k]).map(k => k + ' ' + (stat[k] - before[k]));
      detail.push('   · ' + f + ' — ' + d.join(' · '));
    }
  }

  if (!quiet) {
    const total = stat.sido + stat.merged + stat.coord + stat.nullish + stat.html + stat.date + stat.sigungu;
    if (!total) console.log('✓ 데이터 위생 점검 — 고칠 것 없음');
    else {
      console.log('🔧 데이터 자동 수리 ' + total + '건 / 파일 ' + stat.files + '개'
        + '  (시도 오분류 ' + stat.sido + ' · 통합표기 ' + stat.merged + ' · 좌표 ' + stat.coord
        + ' · null문자열 ' + stat.nullish + ' · HTML조각 ' + stat.html + ' · 날짜뒤바뀜 ' + stat.date
        + ' · 시군구복원 ' + stat.sigungu + ')');
      detail.forEach(l => console.log(l));
    }
  }
  return stat;
}

module.exports = { repair };
if (require.main === module) repair();
