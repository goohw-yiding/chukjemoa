// 📖 긴 설명문을 읽을 수 있게 만든다 — 문단 나눔 + 핵심 강조
//
// ⚠️ 2026-08-10 장남 님 지적: "글자가 이렇게 쭉 나열되는데 읽기가 힘들다."
//    맞는 말이다. 공공데이터(TourAPI) 개요는 **줄바꿈이 하나도 없는 한 덩어리**로 오는데
//    그걸 `<p>${ov}</p>` 로 그대로 뿌리고 있었다. 400~600자가 벽처럼 서 있으면 아무도 안 읽는다.
//
// 여기서 하는 일 세 가지:
//   ① 문장 단위로 끊어 **150~200자 정도의 문단**으로 묶는다
//   ② 숫자·시간·요일처럼 **눈이 먼저 찾는 정보**를 굵게 한다
//   ③ 끝에 붙는 `* 기상상황에 따라 변경 가능` 같은 꼬리 주석을 **작은 회색 글씨**로 분리한다
//
// ⚠️ 굵게 한 것에는 motionJs 의 「숫자 형광펜」이 자동으로 붙는다(`p b` 를 스캔한다).
//    그래서 여기서는 <b> 만 만들어 주면 되고, 애니메이션은 건드리지 않는다.
//
// ⚠️ 서버(빌드)와 브라우저(모달) 양쪽에서 같은 결과가 나와야 한다.
//    로직을 두 벌 쓰면 반드시 갈라지므로 **함수 하나를 toString() 해서 브라우저로 보낸다.**
'use strict';

// ── 이 함수는 서버와 브라우저 양쪽에서 그대로 돈다. 바깥 변수를 참조하면 안 된다.
function proseCore(raw) {
  var text = String(raw == null ? '' : raw).replace(/\r/g, ' ').replace(/[ \t]+/g, ' ').trim();
  if (!text) return '';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ① 주석 분리 — `*` `※` 로 감싸거나 뒤에 붙는 안내문
  //    ⚠️ 주석은 뒤에만 오는 게 아니다. 보령머드축제는 `*전년도 내용입니다.*` 가 **맨 앞**에 있어서
  //       그대로 두면 첫 문장이 안내문으로 시작한다. 앞쪽 `*...*` 도 같이 걷어낸다.
  var notes = [];
  var body = text;
  for (var g = 0; g < 4; g++) {
    var lead = body.match(/^\s*[*※]\s*([^*※]{4,200})[*※]\s*/);
    if (!lead) break;
    notes.push(lead[1].trim());
    body = body.slice(lead[0].length).trim();
  }
  for (var g2 = 0; g2 < 4; g2++) {
    var m = body.match(/[*※]\s*([^*※]{4,200})\s*$/);
    if (!m) break;
    notes.push(m[1].trim());
    body = body.slice(0, m.index).trim();
  }
  if (!body) { body = text.replace(/[*※]/g, ' ').trim(); notes = []; }

  // ② 문장 나누기 — 마침표 앞이 숫자면 소수점이니 자르지 않는다(1.5km)
  var parts = body.split(/\n+/).join(' ');
  var sentences = parts.split(/(?<=[^0-9\s][.!?])\s+/).map(function (s) { return s.trim(); }).filter(Boolean);
  if (!sentences.length) sentences = [body];

  // ③ 문단 묶기 — 목표 150자, 한 문단 최대 230자.
  //    ⚠️ "150자 넘으면 끊는다"만 쓰면 250자짜리 긴 문장 뒤에 130자가 또 붙어 380자 문단이 나온다.
  //       그래서 **붙이기 전에** 넘칠지 먼저 본다.
  var paras = [], cur = '';
  for (var i = 0; i < sentences.length; i++) {
    var s = sentences[i];
    if (!cur) cur = s;
    else if (cur.length + 1 + s.length <= 230) cur += ' ' + s;
    else { paras.push(cur); cur = s; }
    if (cur.length >= 150) { paras.push(cur); cur = ''; }
  }
  if (cur) {
    if (paras.length && cur.length < 55) paras[paras.length - 1] += ' ' + cur;
    else paras.push(cur);
  }

  // ④ 강조 — 눈이 먼저 찾는 것만.
  //    ⚠️ 규칙을 따로따로 돌리면 「19시·21시는 굵은데 22시는 안 굵은」 어정쩡한 결과가 나온다.
  //       하나의 정규식으로 **왼쪽에서 오른쪽으로 한 번에** 훑어야 일관된다.
  //    ⚠️ 너무 많이 굵게 하면 아무것도 안 굵은 것과 같다 → 글자 40자당 1개, 최소 4개.
  //    ⚠️ 다만 「19시·21시」처럼 **딱 붙어 있는 짝**은 한쪽만 굵으면 오히려 실수처럼 보인다.
  //       바로 앞 강조에서 구두점·공백만 사이에 두고 이어지면 개수 제한에서 빼 준다.
  //    ⚠️ 연도(2022년)는 일부러 뺐다 — 문장 맨 앞에 있어서 제일 먼저 굵어지는데 정작 안 중요하다.
  var RULE = /\d{1,2}\s*:\s*\d{2}(?:\s*[~-]\s*\d{1,2}\s*:\s*\d{2})?|\d[\d,]*\s*(?:개월|가지|시간|미터|인분|만원|천원|대|명|회|분|시|일|개|종|곳|km|m|원|%|호|점|위|박|층|평)|매주\s*[월화수목금토일]요일|매주\s*[월화수목금토일]|매일|매월|연중무휴/g;
  function markUp(s) {
    var cap = Math.max(4, Math.floor(s.length / 40)), used = 0, lastEnd = -99;
    var re = new RegExp(RULE.source, 'g'), out = '', at = 0, m2;
    while ((m2 = re.exec(s))) {
      var gap = s.slice(lastEnd, m2.index);
      var glued = m2.index - lastEnd <= 3 && /^[\s·,~/、-]*$/.test(gap);
      if (used < cap || glued) {
        out += esc(s.slice(at, m2.index)) + '<b>' + esc(m2[0]) + '</b>';
        at = m2.index + m2[0].length;
        if (!glued) used++;
      }
      lastEnd = m2.index + m2[0].length;
    }
    return out + esc(s.slice(at));
  }

  var html = paras.map(function (p) { return '<p>' + markUp(p) + '</p>'; }).join('');
  if (notes.length) {
    html += '<p class="pnote">' + notes.map(function (n) { return '※ ' + esc(n); }).join('<br>') + '</p>';
  }
  return html;
}

// 서버용 — `<div class="prose">…</div>` 를 통째로 돌려준다
function prose(raw, cls) {
  var inner = proseCore(raw);
  if (!inner) return '';
  return '<div class="prose' + (cls ? ' ' + cls : '') + '">' + inner + '</div>';
}

// 브라우저용 — 모달처럼 클라이언트에서 그리는 곳에서 쓴다.
// ⚠️ 서버와 **같은 함수 원문**을 보내므로 로직이 갈라질 수 없다.
const PROSE_JS = '<scr' + 'ipt>window.cjmProse=function(t){var f=' + proseCore.toString()
  + ';var h=f(t);return h?\'<div class="prose">\'+h+\'</div>\':\'\';};</scr' + 'ipt>';

// 문단 사이 간격과 꼬리 주석 — layout 의 공통 CSS에 넣는다
const PROSE_CSS = `
.prose p{margin:0 0 13px;line-height:1.85}
.prose p:last-child{margin-bottom:0}
.prose p b{font-weight:800;color:#0a6c63}
.prose .pnote{font-size:.87rem;color:#8a929c;line-height:1.7;padding-top:4px;border-top:1px dashed #e7ebee;margin-top:14px}
.prose .pnote b{color:#8a929c}
`;

module.exports = { prose, proseCore, PROSE_JS, PROSE_CSS };
