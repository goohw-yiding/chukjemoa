// 📍 «내 근처에서 열리는 장» — 오일장 허브·끝자리 5장·시·도 페이지 맨 위에 붙는 블록 (2026-11-24 신설)
//
// 왜 만드나 — 인계서 `claude/인계서_2026-11-24_오일장_AI브리핑대응.md` (프로젝트 문서)
//   네이버가 장날 검색 맨 위에 «AI 브리핑»을 띄워 「몇 일이 장날?」을 바로 답한다(우리 페이지를 출처로 인용하면서).
//   오일장 네이버 유입이 10/27주 4,615 → 11/17주 1,960 (-58%). 검색 수요는 그대로(97)인데 클릭만 줄었다.
//   날짜만 있는 페이지는 앞으로도 줄어든다. AI 가 못 주는 것 = «내 위치에서 가까운, 오늘 서는 장».
//   실제 검색어도 그렇다: 「오늘 장날인 곳 경기도」 CTR 29.9% · 「경북오늘장날인곳」 33.3%.
//
// 설계
//   · 좌표·끝자리만 담은 /jangteo/near.json 을 한 번 받아 «브라우저 안에서» 거리를 잰다(하버사인).
//     위치는 서버로 보내지 않는다 — 정적 사이트라 보낼 곳도 없다. 그 사실을 블록에 한 줄로 적는다.
//   · 위치를 거부하거나 못 잡으면 시·도 고르기로 같은 목록을 준다(막다른 길을 만들지 않는다).
//   · 주차는 데이터에 «있다»고 적힌 곳만 「주차 가능」을 붙인다. 없다는 표시는 하지 않는다(모르는 것일 뿐이다).
//   · 날짜 판정은 허브 표와 같은 규칙(일 % 10)이다 — 두 곳이 어긋나면 안 된다.
//
// ⚠️ 제목·설명에 «내 근처 거리순»을 넣는 것은 이 블록이 라이브에서 확인된 «뒤»에 한다(인계서 P5).
// ⚠️ GA4 이벤트: jangteo_near(place·method·results·day) · jangteo_route_click(place·method).
//    맞춤 측정기준 method·results·day 는 콘솔에 등록해야 보고서에 뜬다(소급 안 됨). place 는 이미 등록돼 있다.
'use strict';
const fs = require('fs'), path = require('path');

const num = v => { const n = parseFloat(v); return isFinite(n) ? n : null; };

// /jangteo/near.json — [이름, 시·도, 시·군, 끝자리들("49"), 경도, 위도, 주차(1/0), 시·군 페이지 슬러그]
function writeData(ROOT, marketsDay, slugOf) {
  const rows = [];
  let noCoord = 0;
  for (const m of marketsDay) {
    const x = num(m.x), y = num(m.y);
    // 한국 범위를 벗어난 좌표(0,0 이나 뒤바뀐 값)는 «엉뚱한 거리»를 만든다 — 빼는 편이 낫다
    if (x == null || y == null || x < 124 || x > 132 || y < 33 || y > 39) { noCoord++; continue; }
    const dg = [...new Set((m.daysNum || []).map(d => d % 10))].sort((a, b) => (a || 10) - (b || 10)).join('');   // 0(=10일)은 뒤로: "50" → 5·10일장
    if (!dg) continue;
    const park = /있음|가능|^true$/.test(String(m.park || '')) ? 1 : 0;
    rows.push([m.name, m.region || '', m.city || '', dg, +x.toFixed(5), +y.toFixed(5), park, (slugOf && slugOf(m)) || '']);
  }
  fs.writeFileSync(path.join(ROOT, 'jangteo', 'near.json'), JSON.stringify(rows));
  return { n: rows.length, noCoord };
}

// 브라우저에서 도는 코드. 함수째로 문자열로 바꿔 넣는다(템플릿 문자열 안에서 역슬래시가 깨지는 일을 피한다).
function client() {
  var box = document.getElementById('jtnear'); if (!box) return;
  var PLACE = box.getAttribute('data-place') || '', SIDO0 = box.getAttribute('data-sido') || '', DG = box.getAttribute('data-digits') || '';
  var out = document.getElementById('jtn-out'), daysEl = document.getElementById('jtn-days');
  var geoBtn = document.getElementById('jtn-geo'), sel = document.getElementById('jtn-sido');
  var WD = ['일', '월', '화', '수', '목', '금', '토'], MS = 86400000;
  var DATA = null, pos = null, mode = '', picked = 0, chips = [];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function track(n, p) { try { if (window.cjmTrack) window.cjmTrack(n, p); } catch (e) { } }
  function today0() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function label(d, pre) { return (pre ? pre + ' ' : '') + (d.getMonth() + 1) + '/' + d.getDate() + '(' + WD[d.getDay()] + ')'; }

  // 날짜 고르기 — 끝자리 페이지는 «이 장이 서는 다음 세 번», 나머지는 오늘·내일·이번 토·일
  (function () {
    var t = today0(), i, d;
    if (DG) {
      for (i = 0; i < 16 && chips.length < 3; i++) { d = new Date(t.getTime() + i * MS); if (DG.indexOf(String(d.getDate() % 10)) >= 0) chips.push({ d: d, k: i === 0 ? 'today' : 'next', t: label(d, i === 0 ? '오늘' : '') }); }
    } else {
      chips.push({ d: t, k: 'today', t: label(t, '오늘') });
      chips.push({ d: new Date(t.getTime() + MS), k: 'tomorrow', t: label(new Date(t.getTime() + MS), '내일') });
      for (i = 2; i < 8; i++) { d = new Date(t.getTime() + i * MS); if (d.getDay() === 6 || d.getDay() === 0) chips.push({ d: d, k: d.getDay() === 6 ? 'sat' : 'sun', t: label(d, '') }); }
      chips = chips.slice(0, 4);
    }
    daysEl.innerHTML = chips.map(function (c, n) { return '<button type="button" class="jtn-day' + (n === 0 ? ' on' : '') + '" data-i="' + n + '">' + c.t + '</button>'; }).join('');
  })();

  function load(cb) {
    if (DATA) return cb();
    out.innerHTML = '<p class="jtn-msg">장터 목록을 불러오는 중…</p>';
    fetch('/jangteo/near.json').then(function (r) { return r.json(); }).then(function (j) { DATA = j; cb(); })
      .catch(function () { out.innerHTML = '<p class="jtn-msg">목록을 불러오지 못했어요. 잠시 뒤 다시 눌러 주세요.</p>'; });
  }
  function km(a, b, c, d) { // 위도a 경도b → 위도c 경도d
    var R = 6371, p = Math.PI / 180, x = Math.sin((c - a) * p / 2), y = Math.sin((d - b) * p / 2);
    return 2 * R * Math.asin(Math.sqrt(x * x + Math.cos(a * p) * Math.cos(c * p) * y * y));
  }
  // 네이버 지도 길찾기(자동차). 좌표는 네이버 지도가 쓰는 웹 메르카토르로 바꿔 넣는다. 출발지는 비워 두면 «내 위치»를 묻는다.
  function route(m) {
    var X = m[4] * 20037508.34 / 180, Y = Math.log(Math.tan((90 + m[5]) * Math.PI / 360)) / (Math.PI / 180) * 20037508.34 / 180;
    return 'https://map.naver.com/p/directions/-/' + X.toFixed(2) + ',' + Y.toFixed(2) + ',' + encodeURIComponent(m[0]) + ',,/-/car';
  }
  function render() {
    var c = chips[picked], dg = String(c.d.getDate() % 10);
    var list = DATA.filter(function (m) { return m[3].indexOf(dg) >= 0; });
    var head, rows, sido = sel.value;
    if (mode === 'geo' && pos) {
      list.forEach(function (m) { m._k = km(pos[0], pos[1], m[5], m[4]); });
      list.sort(function (a, b) { return a._k - b._k; });
      rows = list.slice(0, 8);
      head = c.t + '에 서는 장 ' + list.length + '곳 가운데 <b>가까운 ' + rows.length + '곳</b> (직선거리)';
    } else {
      rows = list.filter(function (m) { return m[1] === sido; }).sort(function (a, b) { return a[2].localeCompare(b[2]) || a[0].localeCompare(b[0]); });
      head = c.t + '에 ' + esc(sido) + '에서 서는 장 <b>' + rows.length + '곳</b>';
    }
    if (!rows.length) { out.innerHTML = '<p class="jtn-msg">' + c.t + '에는 ' + (mode === 'geo' ? '' : esc(sido) + '에 ') + '장날로 확인된 곳이 없어요. 위에서 다른 날을 눌러 보세요.</p>'; }
    else {
      out.innerHTML = '<p class="jtn-head">' + head + '</p><ol class="jtn-list">' + rows.map(function (m) {
        var name = m[7] ? '<a href="/jangteo/' + m[7] + '/">' + esc(m[0]) + '</a>' : esc(m[0]);
        return '<li><div class="jtn-l"><b>' + name + '</b><span>' + esc(m[1]) + ' ' + esc(m[2]) + ' · ' + m[3].split('').map(function (x) { return x === '0' ? '10' : x; }).join('·') + '일장' + (m[6] ? ' · <i>주차 가능</i>' : '') + '</span></div>'
          + '<div class="jtn-r">' + (mode === 'geo' ? '<em>' + (m._k < 10 ? m._k.toFixed(1) : Math.round(m._k)) + 'km</em>' : '')
          + '<a class="jtn-route" href="' + route(m) + '" target="_blank" rel="noopener">길찾기</a></div></li>';
      }).join('') + '</ol><p class="jtn-foot">장날 규칙(날짜 끝자리)으로 고른 목록입니다. 명절·궂은 날씨에는 쉬는 장이 있으니 먼 길이면 전화로 확인하고 출발하세요.</p>';
    }
    track('jangteo_near', { place: PLACE, method: mode, results: rows.length, day: c.k });
  }
  function go() { load(render); }

  daysEl.addEventListener('click', function (e) {
    var b = e.target.closest('.jtn-day'); if (!b) return;
    picked = +b.getAttribute('data-i');
    [].forEach.call(daysEl.children, function (x) { x.classList.toggle('on', x === b); });
    if (mode) go();
  });
  geoBtn.addEventListener('click', function () {
    if (!navigator.geolocation) { out.innerHTML = '<p class="jtn-msg">이 브라우저는 위치 기능을 쓸 수 없어요. 아래 «시·도로 고르기»에서 골라 주세요.</p>'; return; }
    geoBtn.disabled = true; geoBtn.textContent = '위치 확인 중…';
    navigator.geolocation.getCurrentPosition(function (p) {
      geoBtn.disabled = false; geoBtn.textContent = '📍 내 위치에서 다시 찾기';
      pos = [p.coords.latitude, p.coords.longitude]; mode = 'geo'; go();
    }, function () {
      geoBtn.disabled = false; geoBtn.textContent = '📍 내 위치에서 가까운 장 보기';
      out.innerHTML = '<p class="jtn-msg">위치를 확인하지 못했어요. 바로 아래 <b>«시·도로 고르기»</b>에서 고르면 같은 목록을 볼 수 있습니다.</p>';
      track('jangteo_near', { place: PLACE, method: 'geo_denied', results: 0, day: chips[picked].k });
    }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 });
  });
  sel.addEventListener('change', function () { if (!sel.value) return; mode = 'sido'; go(); });
  out.addEventListener('click', function (e) { if (e.target.closest('.jtn-route')) track('jangteo_route_click', { place: PLACE, method: mode }); });
  if (SIDO0) { for (var i = 0; i < sel.options.length; i++) if (sel.options[i].value === SIDO0) sel.selectedIndex = i; }
}

const CSS = `<style>
.jtn{background:#f0fbf8;border:2px solid #9fdfd4;border-radius:16px;padding:16px 16px 14px;margin:14px 0 18px}
.jtn h2{font-size:1.15rem;font-weight:900;margin:0 0 4px;color:#0a5c54}
.jtn-sub{margin:0 0 10px;color:#374151;font-size:.93rem;line-height:1.7}
.jtn-days{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 10px}
.jtn-day{background:#fff;border:1.5px solid #cfe9e4;color:#374151;font-weight:700;font-size:.9rem;padding:8px 13px;border-radius:999px;cursor:pointer}
.jtn-day.on{background:#0f9d8f;border-color:#0f9d8f;color:#fff}
.jtn-act{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
#jtn-geo{background:#ff6b4a;color:#fff;border:0;font-weight:800;font-size:1rem;padding:12px 18px;border-radius:12px;cursor:pointer;flex:1 1 220px;min-height:46px}
#jtn-geo:disabled{opacity:.6}
#jtn-sido{flex:0 1 150px;min-height:46px;border:1.5px solid #cfe9e4;border-radius:12px;padding:0 10px;font-size:.95rem;background:#fff;color:#374151}
.jtn-priv{margin:8px 0 0;color:#6b7280;font-size:.8rem;line-height:1.6}
.jtn-msg{margin:12px 0 0;color:#374151;font-size:.93rem;line-height:1.7}
.jtn-head{margin:14px 0 6px;color:#0a5c54;font-size:.95rem}
.jtn-list{list-style:none;margin:0;padding:0}
.jtn-list li{display:flex;justify-content:space-between;align-items:center;gap:10px;background:#fff;border:1px solid #d9efea;border-radius:12px;padding:10px 12px;margin:0 0 7px}
.jtn-l{min-width:0}
.jtn-l b{display:block;font-size:1rem;color:#111827}
.jtn-l b a{color:#0a6c63;text-decoration:underline}
.jtn-l span{display:block;font-size:.84rem;color:#6b7280;margin-top:2px}
.jtn-l i{font-style:normal;color:#0a6c63;font-weight:700}
.jtn-r{display:flex;align-items:center;gap:9px;flex:none}
.jtn-r em{font-style:normal;font-weight:900;color:#c2410c;font-size:.98rem;white-space:nowrap}
.jtn-route{background:#03c75a;color:#fff;font-weight:800;font-size:.88rem;padding:9px 13px;border-radius:10px;white-space:nowrap;text-decoration:none}
.jtn-foot{margin:8px 0 0;color:#6b7280;font-size:.82rem;line-height:1.6}
</style>`;

// place: 'hub' | 'ending' | 'sido'   sido: 시·도 페이지면 그 시·도   digits: 끝자리 페이지면 "49" 같은 문자열
function block({ place, sido = '', digits = '', sidos = [], esc }) {
  const what = digits
    ? `${digits.split('').map(d => d === '0' ? '10' : d).join('·')}일장이 서는 날을 고르면`
    : '오늘·내일·이번 주말 가운데 날을 고르면';
  return `${CSS}
<section class="jtn" id="jtnear" data-place="${place}" data-sido="${esc(sido)}" data-digits="${digits}">
<h2>📍 내 근처에서 열리는 장 찾기</h2>
<p class="jtn-sub">${what} 그날 서는 장을 <b>내 위치에서 가까운 순</b>으로 보여 드립니다. 줄마다 네이버 지도 길찾기가 붙습니다.</p>
<div class="jtn-days" id="jtn-days"></div>
<div class="jtn-act">
<button type="button" id="jtn-geo">📍 내 위치에서 가까운 장 보기</button>
<select id="jtn-sido" aria-label="시·도로 고르기"><option value="">시·도로 고르기</option>${sidos.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select>
</div>
<p class="jtn-priv">위치는 이 휴대폰(브라우저) 안에서 거리 계산에만 씁니다. 축제모아 서버로 보내거나 저장하지 않습니다.</p>
<div id="jtn-out" aria-live="polite"></div>
</section>
<scr` + `ipt>(${client.toString()})();</scr` + `ipt>`;
}

module.exports = { writeData, block };
