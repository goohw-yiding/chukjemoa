/* 축제모아 코스·일정 제안기 — UI 레이어
 * 계산은 /course/engine.js, 화면 문자열은 /course/render.js 가 담당한다(빌드 SSR과 같은 코드).
 * 이 파일은 입력 수집 · 데이터 로드 · 이벤트 · AI 상담 호출만 한다.
 */
(function () {
  'use strict';
  var E = window.CourseEngine, R = window.CourseRender;
  if (!E || !R) return;

  var D = null, SLUG = null, PLAN = null, CHAT = [], CHAT_LIMIT = 6;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function loadSido(slug, cb) {
    if (SLUG === slug && D) return cb(null);
    setBusy(true);
    var x = new XMLHttpRequest();
    x.open('GET', '/course/d/' + slug + '.json', true);
    x.onreadystatechange = function () {
      if (x.readyState !== 4) return;
      setBusy(false);
      if (x.status !== 200) return cb('지역 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      var raw; try { raw = JSON.parse(x.responseText); } catch (e) { return cb('데이터 형식 오류'); }
      D = E.expand(raw); SLUG = slug; cb(null);
    };
    x.onerror = function () { setBusy(false); cb('네트워크 오류'); };
    x.send();
  }
  function setBusy(v) {
    var b = $('#c-run'); if (b) { b.disabled = v; b.textContent = v ? '불러오는 중…' : '코스 짜기'; }
  }

  function opts() {
    return {
      slug: $('#c-sido').value,
      date: $('#c-date').value,
      days: +$('#c-days').value,
      who: $$('input[name=who]:checked').map(function (e) { return e.value; }),
      focus: $$('input[name=focus]:checked').map(function (e) { return e.value; }),
      move: ($$('input[name=move]:checked')[0] || { value: 'car' }).value,
      pace: $('#c-pace').value
    };
  }

  /* ── 대중교통 실측 ─────────────────────────── */
  function checkTransit() {
    var legs = [];
    PLAN.days.forEach(function (d) {
      for (var i = 1; i < d.items.length; i++) legs.push({ a: d.items[i - 1].o, b: d.items[i].o });
    });
    legs = legs.slice(0, 8);                       // 무료 한도 보호 — 앞 8개 구간만
    var out = $('#c-transit-out');
    out.innerHTML = '<div class="cnote">조회 중…</div>';
    // ⚠️ 2026-08-12: 서버(/api/transit)로 부르면 ODsay 가 데이터센터 IP 를 막아 무조건 실패한다.
    //    ODsay 는 CORS 를 완전히 열어 뒀으므로 **브라우저에서 직접** 부른다. odsay.js 머리말 참고.
    if (!window.cjmOdsay) { out.innerHTML = '<div class="cnote">대중교통 조회를 사용할 수 없습니다. 위의 자차 기준 추정치를 참고하세요.</div>'; return; }
    Promise.all(legs.map(function (l) {
      return window.cjmOdsay(l.a.x, l.a.y, l.b.x, l.b.y).then(function (t) {
        return { from: l.a.t, to: l.b.t, t: t };
      });
    })).then(function (rows) {
      if (!rows.filter(function (r) { return r.t; }).length) {
        out.innerHTML = '<div class="cnote">이 구간들은 대중교통 경로를 찾지 못했습니다. 위의 자차 기준 추정치를 참고하시고, 정확한 시간은 <a href="https://map.kakao.com" target="_blank" rel="noopener">카카오맵</a>에서 확인해 주세요.</div>';
        return;
      }
      var h = '<table class="ctab"><tr><th>구간</th><th>대중교통</th><th>요금</th></tr>';
      rows.forEach(function (r) {
        var t = r.t;
        h += '<tr><td>' + R.esc(r.from) + ' → ' + R.esc(r.to) + '</td><td>'
          + (t && t.durationMin ? t.durationMin + '분 (환승 ' + t.transfer + ')' : '경로 없음') + '</td><td>'
          + (t && t.fare ? R.won(t.fare) : '-') + '</td></tr>';
      });
      h += '</table><p class="cwarn">ODsay 대중교통 경로 실측값입니다. 배차 간격과 시간대에 따라 달라집니다. 경로가 없다고 나오면 그 구간은 대중교통 연결이 약한 곳입니다. 요금이 «-» 인 구간은 수도권 밖이라 ODsay 가 요금을 주지 않는 곳입니다.</p>';
      out.innerHTML = h;
    });
  }

  /* ── AI 상담 ──────────────────────────────── */
  function planDigest() {
    return PLAN.days.map(function (d, i) {
      return (i + 1) + '일차(' + R.dayLabel(d.date) + '): ' + d.items.map(function (it) {
        return it.at + ' ' + it.o.t + '[' + it.o.cat + (it.o.sub ? '/' + it.o.sub : '') + (it.o.km ? '/' + it.o.km + 'km' : '') + ']';
      }).join(' → ');
    }).join('\n') + '\n총 ' + PLAN.km.toFixed(0) + 'km, 자차 유류비 약 ' + R.won(PLAN.carCost);
  }

  function chatSend() {
    var box = $('#c-ai-in'), q = box.value.trim();
    if (!q || !PLAN) return;
    var log = $('#c-ai-log');
    if (CHAT.length >= CHAT_LIMIT * 2) {
      log.insertAdjacentHTML('beforeend', '<div class="cai bot">대화가 길어졌습니다. 코스를 다시 만들면 새로 이어서 물어보실 수 있어요.</div>');
      log.scrollTop = 1e9; return;
    }
    box.value = '';
    log.insertAdjacentHTML('beforeend', '<div class="cai me">' + R.esc(q) + '</div><div class="cai bot" id="c-ai-tmp">생각하는 중…</div>');
    log.scrollTop = 1e9;
    var x = new XMLHttpRequest();
    x.open('POST', '/api/plan', true);
    x.setRequestHeader('Content-Type', 'application/json');
    x.onreadystatechange = function () {
      if (x.readyState !== 4) return;
      var tmp = $('#c-ai-tmp'); if (tmp) tmp.removeAttribute('id');
      // 서버가 이유를 담아 보내면 그걸 그대로 보여준다(한도 초과·미설정 등). 없을 때만 일반 문구.
      var msg;
      try { msg = JSON.parse(x.responseText).text; } catch (e) { msg = ''; }
      if (!msg) msg = '지금은 AI 상담을 쓸 수 없습니다. 잠시 후 다시 시도해 주세요.';
      if (tmp) tmp.innerHTML = R.esc(msg).replace(/\n/g, '<br>');
      CHAT.push({ role: 'user', content: q }, { role: 'assistant', content: msg });
      log.scrollTop = 1e9;
    };
    x.send(JSON.stringify({
      q: q, region: D.sido, plan: planDigest(), alts: E.alternatives(D, PLAN, 40).join(', '),
      cond: { days: PLAN.O.days, who: PLAN.O.who, focus: PLAN.O.focus, move: PLAN.O.move, date: PLAN.O.date },
      history: CHAT.slice(-4)
    }));
  }

  /* ── 실행 ─────────────────────────────────── */
  function run() {
    var O = opts();
    if (!O.date) { alert('출발 날짜를 골라주세요.'); return; }
    loadSido(O.slug, function (err) {
      if (err) { $('#c-out').innerHTML = '<div class="cnote">' + R.esc(err) + '</div>'; return; }
      PLAN = E.makePlan(D, O);
      $('#c-out').innerHTML = R.renderPlan(D, PLAN, {});
      var t = $('#c-transit'); if (t) t.onclick = checkTransit;
      var ai = $('#c-ai'); if (ai) ai.style.display = 'block';
      $('#c-ai-log').innerHTML = ''; CHAT = [];
      var h = $('#c-outwrap'); if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try { if (window.history.replaceState) window.history.replaceState(null, '', '#plan'); } catch (e) { }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var d = $('#c-date');
    if (d && !d.value) { var t = new Date(); d.value = t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2); }
    var r = $('#c-run'); if (r) r.onclick = run;
    var s = $('#c-ai-send'); if (s) s.onclick = chatSend;
    var i = $('#c-ai-in'); if (i) i.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); chatSend(); } });
    $$('.cq').forEach(function (el) {
      el.onclick = function () { var v = $('#c-ai-in'); v.value = el.textContent.replace(/^[^가-힣A-Za-z]*/, ''); chatSend(); };
    });
    $$('.cpreset').forEach(function (el) {
      el.onclick = function () {
        var p; try { p = JSON.parse(el.getAttribute('data-p')); } catch (e) { return; }
        if (p.sido) $('#c-sido').value = p.sido;
        if (p.days) $('#c-days').value = p.days;
        if (p.pace) $('#c-pace').value = p.pace;
        $$('input[name=focus]').forEach(function (c) { c.checked = (p.focus || []).indexOf(c.value) >= 0; });
        $$('input[name=who]').forEach(function (c) { c.checked = (p.who || []).indexOf(c.value) >= 0; });
        run();
      };
    });
  });
})();
