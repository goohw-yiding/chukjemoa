/* 방문 차수별 추천 — AI 상담 (외국어 페이지)
 * 목록에 있는 목적지만 근거로 답한다. 후보 요약을 클라이언트에서 만들어 보내므로
 * 서버는 LLM 호출만 하면 되고 입력 토큰도 작게 유지된다.
 */
(function () {
  'use strict';
  var CFG = window.TRIP || { lang: 'en', tier: 'all' };
  var PACK = null, CHAT = [], LIMIT = 6;

  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  var WAIT = { en: 'Thinking…', ja: '考えています…', zh: '正在思考…', tw: '正在思考…', es: 'Pensando…' };
  var ERR = { en: 'The assistant is unavailable right now. Please try again later.', ja: '今は利用できません。しばらくしてからお試しください。', zh: '暂时无法使用，请稍后再试。', tw: '暫時無法使用，請稍後再試。', es: 'No disponible ahora. Inténtalo más tarde.' };
  var LONG = { en: 'This conversation is getting long. Reload the page to start a new one.', ja: '会話が長くなりました。ページを再読み込みして新しく始めてください。', zh: '对话有点长了，刷新页面重新开始。', tw: '對話有點長了，重新整理頁面再開始。', es: 'La conversación es larga. Recarga la página para empezar de nuevo.' };

  function loadPack(cb) {
    if (PACK) return cb();
    var x = new XMLHttpRequest();
    x.open('GET', '/trip/d/' + CFG.lang + '.json', true);
    x.onreadystatechange = function () {
      if (x.readyState !== 4) return;
      if (x.status === 200) { try { PACK = JSON.parse(x.responseText); } catch (e) { PACK = null; } }
      cb();
    };
    x.send();
  }

  // 목적지 요약 — 이름(로마자/한글) · 시도 · 외국인 순위 · 배수 · 자산 수. 토큰을 아끼려 한 줄씩.
  function digest() {
    if (!PACK) return '';
    var tiers = CFG.tier === 'all' ? ['first', 'second', 'third'] : [CFG.tier];
    var out = [];
    tiers.forEach(function (t) {
      (PACK.tiers[t] || []).forEach(function (d) {
        var a = d.a || {};
        out.push(t + ': ' + d.sg + '(' + d.sgKo + '), ' + d.sido
          + ', foreign_rank=' + (d.fgn || 'none')
          + ', korean_peak_x' + (d.idx || '-')
          + ', spots=' + (a.spot || 0) + ' trails=' + (a.walk || 0) + ' nature=' + (a.nat || 0) + ' markets=' + (a.market || 0) + ' accessible=' + (a.acc || 0)
          + (d.hi && d.hi.length ? ' | ' + d.hi.slice(0, 4).map(function (h) { return h.n + (h.ko ? '(' + h.ko + ')' : ''); }).join(', ') : ''));
      });
    });
    return out.join('\n');
  }

  function send(text) {
    var q = String(text || '').trim();
    if (!q) return;
    var log = $('#t-log');
    if (CHAT.length >= LIMIT * 2) {
      log.insertAdjacentHTML('beforeend', '<div class="tmsg bot">' + esc(LONG[CFG.lang] || LONG.en) + '</div>');
      log.scrollTop = 1e9; return;
    }
    log.insertAdjacentHTML('beforeend', '<div class="tmsg me">' + esc(q) + '</div><div class="tmsg bot" id="t-tmp">' + esc(WAIT[CFG.lang] || WAIT.en) + '</div>');
    log.scrollTop = 1e9;

    loadPack(function () {
      var x = new XMLHttpRequest();
      x.open('POST', '/api/plan', true);
      x.setRequestHeader('Content-Type', 'application/json');
      x.onreadystatechange = function () {
        if (x.readyState !== 4) return;
        var tmp = $('#t-tmp'); if (tmp) tmp.removeAttribute('id');
        var msg; try { msg = JSON.parse(x.responseText).text; } catch (e) { msg = ''; }
        if (!msg) msg = ERR[CFG.lang] || ERR.en;
        if (tmp) tmp.innerHTML = esc(msg).replace(/\n/g, '<br>');
        CHAT.push({ role: 'user', content: q }, { role: 'assistant', content: msg });
        log.scrollTop = 1e9;
      };
      x.send(JSON.stringify({
        mode: 'trip', lang: CFG.lang, tier: CFG.tier, q: q,
        month: PACK ? PACK.month : '', dest: digest(), history: CHAT.slice(-4)
      }));
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var b = $('#t-send'); if (b) b.onclick = function () { var i = $('#t-in'); var v = i.value; i.value = ''; send(v); };
    var i = $('#t-in');
    if (i) i.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); var v = i.value; i.value = ''; send(v); } });
    Array.prototype.forEach.call(document.querySelectorAll('.tq'), function (el) {
      el.onclick = function () { send(el.textContent); };
    });
  });
})();
