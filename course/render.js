/* 코스 결과 HTML 렌더러 — 빌드(SSR)와 브라우저가 같은 마크업을 낸다. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.CourseRender = factory(root.CourseEngine);
}(typeof self !== 'undefined' ? self : this, function (E) {
  'use strict';

  var CATLABEL = { fes: '🎪 축제', nat: '⛰️ 자연', walk: '🥾 걷기길', acc: '♿ 무장애', pet: '🐶 반려동반', food: '🍚 식사', cafe: '☕ 카페', stay: '🛏️ 숙소' };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function won(n) { return Math.round(n).toLocaleString('ko-KR') + '원'; }
  function dayLabel(s) {
    var d = new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
    return (+s.slice(4, 6)) + '월 ' + (+s.slice(6, 8)) + '일 (' + '일월화수목금토'[d.getDay()] + ')';
  }

  function item(D, it, monthKey) {
    var o = it.o, b = D.busy[o.sg] && D.busy[o.sg][monthKey], h = '';
    h += '<div class="citem">';
    if (it.move && it.move.min > 1)
      h += '<div class="cmove">🚗 이동 약 ' + Math.round(it.move.min) + '분 · ' + it.move.km.toFixed(1) + 'km <em>(직선거리 추정)</em></div>';
    h += '<div class="crow"><div class="ctime">' + it.at + (it.till ? '<br><span>~' + it.till + '</span>' : '') + '</div><div class="cbody2">';
    if (o.img) h += '<img class="cthumb2" src="' + esc(o.img) + '" alt="' + esc(o.t) + '" loading="lazy">';
    // ⚠️ 라벨이 없는 카테고리가 오면 'undefined' 가 화면에 찍힌다(2026-08-18 실사고). 폴백 필수.
    h += '<div class="cmeta"><div class="ctag">' + (CATLABEL[o.cat] || '📍 가볼 곳') + (o.sub ? ' · ' + esc(o.sub) : '') + (o.kind ? ' · ' + esc(o.kind) : '') + '</div>';
    h += '<h4>' + esc(o.t) + '</h4>';
    var line = [];
    if (o.sg) line.push(esc(o.sg));
    if (o.km) line.push(o.km + 'km');
    if (o.lv) line.push(esc(o.lv));
    if (o.full) line.push('전 구간 ' + Math.round(o.full / 60) + '시간 — 일정엔 4시간만 잡았습니다');
    if (o.menu) line.push('대표메뉴 ' + esc(o.menu));
    if (line.length) h += '<div class="cline">' + line.join(' · ') + '</div>';
    if (o.open) h += '<div class="chours">🕘 ' + esc(o.open) + (o.rest ? ' · 휴무 ' + esc(o.rest) : '') + '</div>';
    else if (o.cat === 'food' || o.cat === 'cafe') h += '<div class="chours dim">🕘 영업시간 정보 없음 — 방문 전 확인 필요</div>';
    if (o.ci) h += '<div class="chours">🛎️ 체크인 ' + esc(o.ci) + (o.co ? ' · 체크아웃 ' + esc(o.co) : '') + '</div>';
    if (b) h += '<span class="cbadge ' + (b >= 1.15 ? 'hot' : 'quiet') + '">' + (b >= 1.15 ? '🔥 이달 ' + esc(o.sg) + ' — 평소의 ×' + b.toFixed(2) : '🤫 이달 ' + esc(o.sg) + ' — 한산한 편 ×' + b.toFixed(2)) + '</span>';
    if (o.ov) h += '<div class="cov2">' + esc(o.ov) + '</div>';
    h += '<a class="cmap" target="_blank" rel="noopener" href="https://map.kakao.com/link/to/' + encodeURIComponent(o.t) + ',' + o.y + ',' + o.x + '">지도에서 길찾기 →</a>';
    h += '</div></div></div></div>';
    return h;
  }

  function renderPlan(D, P, opt) {
    opt = opt || {};
    if (!P.days.some(function (d) { return d.items.length; }))
      return '<div class="cnote">조건에 맞는 곳을 충분히 못 찾았습니다. 지역을 넓히거나 조건을 줄여보세요.</div>';
    var h = '';
    P.days.forEach(function (d, i) {
      h += '<div class="cday"><div class="cdh"><b>' + (i + 1) + '일차</b> <span>' + (opt.nodate ? '' : dayLabel(d.date)) + '</span>';
      if (d.km) h += '<em>이동 약 ' + d.km.toFixed(0) + 'km</em>';
      h += '</div>';
      if (!d.items.length) h += '<div class="cnote">이 날은 조건에 맞는 후보가 부족합니다.</div>';
      d.items.forEach(function (it) { h += item(D, it, d.month); });
      if (d.markets && d.markets.length)
        h += '<div class="cmkt">🏮 이 날 열리는 오일장: ' + d.markets.map(function (m) { return '<b>' + esc(m.t) + '</b>(' + esc(m.sg) + ')'; }).join(', ') + '</div>';
      h += '</div>';
    });
    h += '<div class="csum"><h3>합계</h3><ul>';
    // "약 0km"는 고장 난 것처럼 보인다 — 실제로 다 걸어서 갈 만한 거리라는 뜻이므로 그렇게 쓴다
    if (P.km < 2) {
      h += '<li>총 이동거리 <b>2km 미만</b> <em>— 방문지가 모두 가까워 걸어서도 다닐 수 있습니다</em></li>';
    } else {
      h += '<li>총 이동거리 <b>약 ' + P.km.toFixed(0) + 'km</b> <em>(직선거리 × 1.35 보정)</em></li>';
      h += '<li>자차 유류비 <b>약 ' + won(P.carCost) + '</b> <em>(휘발유 1,700원/L · 연비 12km/L 가정 · 통행료 별도)</em></li>';
    }
    h += '<li>일정 <b>' + P.days.length + '일</b> · 방문지 <b>' + P.days.reduce(function (a, d) { return a + d.items.length; }, 0) + '곳</b></li>';
    h += '</ul>';
    if (!opt.static) {
      h += '<button id="c-transit" class="cbtn2" type="button">🚌 대중교통 실제 소요시간으로 확인</button><div id="c-transit-out"></div>';
    }
    h += '<p class="cwarn">⚠️ 이동시간은 직선거리 기반 <b>추정치</b>이며 실제 도로 경로가 아닙니다. 영업시간·휴무일은 공공데이터에 있는 곳만 표시했고 없는 곳이 더 많습니다. 붐빔 배수는 그 장소가 아니라 <b>그 시·군·구</b>의 방문자 수 기준입니다. 출발 전 각 장소에 확인하세요.</p>';
    h += '</div>';
    return h;
  }

  return { renderPlan: renderPlan, esc: esc, dayLabel: dayLabel, won: won, CATLABEL: CATLABEL };
}));
