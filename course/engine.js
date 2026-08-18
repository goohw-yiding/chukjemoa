/* 축제모아 코스 엔진 — 브라우저와 빌드(Node) 양쪽에서 같은 코드로 돈다.
 * 왜 공용으로 만드나: 정적 코스 페이지(SSR)와 사용자 입력형 제안기가 서로 다른 결과를 내면
 * "아까 본 코스랑 다르다"는 신뢰 문제가 생긴다. 알고리즘은 반드시 한 벌만 유지한다.
 *
 * 한계(페이지에도 반드시 표기):
 *  - 이동시간 = 직선거리 × 1.35 ÷ 평균속도. 실제 도로 경로가 아니다.
 *  - 영업시간·휴무일은 공공데이터에 있는 것만. 없는 곳이 훨씬 많다.
 *  - 붐빔 배수는 그 장소가 아니라 그 시·군·구의 방문자 수 기준이다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CourseEngine = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var IMG_PRE = ['http://tong.visitkorea.or.kr/cms/resource/', 'https://tong.visitkorea.or.kr/cms/resource/'];
  var STAY_MIN = { fes: 120, food: 70, cafe: 60, nat: 100, acc: 80, pet: 80, walk: 120 };
  var DETOUR = 1.35;
  var SPEED = { car: 55, transit: 32 };
  var FUEL_PER_KM = 142;                 // 휘발유 1,700원/L ÷ 12km/L
  var DAY_START = 9 * 60, DAY_END = 19 * 60;
  var MAX_LEG_KM = 45;                   // 한 번에 튀는 이동 상한(km). 이보다 멀면 그건 코스가 아니라 원정이다.

  function unimg(v) {
    if (!v) return '';
    var i = v.indexOf('|'); if (i < 0) return v;
    var p = v.slice(0, i), r = v.slice(i + 1);
    return p === 'x' ? r : (IMG_PRE[+p] || '') + r;
  }

  // 압축 팩(JSON) → 객체 배열
  function expand(raw) {
    var out = { sido: raw.sido, busy: raw.busy || {}, fgn: raw.fgn || {}, mkt: raw.mkt || [], c: {} };
    Object.keys(raw.c).forEach(function (cat) {
      var keys = raw.keys[cat];
      out.c[cat] = raw.c[cat].map(function (r) {
        var o = { cat: cat };
        for (var i = 0; i < keys.length; i++) o[keys[i]] = r[i];
        o.x = +o.x; o.y = +o.y; o.img = unimg(o.g);
        return o;
      });
    });
    return out;
  }

  function hav(x1, y1, x2, y2) {
    var R = 6371, rd = Math.PI / 180;
    var dLat = (y2 - y1) * rd, dLon = (x2 - x1) * rd;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(y1 * rd) * Math.cos(y2 * rd) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function hhmm(m) { m = Math.round(m); var h = Math.floor(m / 60) % 24, mm = m % 60; return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm; }
  function ymd(d) { return d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2); }
  function addDays(s, n) { var d = new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)); d.setDate(d.getDate() + n); return d; }

  // 「한적한 곳」 축을 시도 안 순위로 환산한다.
  // ⚠️ 2026-08-18 실측: 배수를 그대로 빼면 전남이 1.01~1.15(폭 0.14)라 감점이 최대 0.6뿐이었다.
  //    사진 가산점(+1.6)에 눌려 「전남 한적한 코스」가 전남에서 가장 붐비는 여수시 1위를 골랐다.
  function busyNorm(D, monthKey) {
    D._bn = D._bn || {};
    if (D._bn[monthKey]) return D._bn[monthKey];
    var vals = [], m = {};
    Object.keys(D.busy).forEach(function (sg) { var v = D.busy[sg][monthKey]; if (v) vals.push([sg, v]); });
    vals.sort(function (a, b) { return a[1] - b[1]; });
    vals.forEach(function (x, i) { m[x[0]] = vals.length > 1 ? i / (vals.length - 1) : 0.5; });  // 0=가장 한산 … 1=가장 붐빔
    D._bn[monthKey] = m;
    return m;
  }

  function scoreOf(D, o, O, monthKey) {
    var s = 0, f = O.focus || [], w = O.who || [];
    if (o.img) s += 1.6;
    if (o.ov) s += 0.7;
    if (f.indexOf('walk') >= 0 && (o.cat === 'walk' || o.sub === '명산')) s += 2.4;
    if (f.indexOf('nature') >= 0 && o.cat === 'nat') s += 2.2;
    if (f.indexOf('food') >= 0 && (o.cat === 'food' || o.cat === 'cafe')) s += 1.6;
    if (f.indexOf('photo') >= 0 && o.img) s += 1.2;
    if (f.indexOf('fes') >= 0 && o.cat === 'fes') s += 2.6;
    if (f.indexOf('onsen') >= 0 && o.sub === '온천') s += 2.6;
    if (w.indexOf('wheel') >= 0 && o.cat === 'acc') s += 3;
    if (w.indexOf('pet') >= 0 && (o.cat === 'pet' || o.pet)) s += 3;
    if (w.indexOf('parent') >= 0 && o.cat === 'walk' && +o.km > 10) s -= 2.5;
    if (w.indexOf('kid') >= 0 && o.cat === 'walk' && +o.km > 8) s -= 2;
    var b = D.busy[o.sg] && D.busy[o.sg][monthKey];
    if (f.indexOf('quiet') >= 0) {
      var bn = busyNorm(D, monthKey)[o.sg];
      s -= (bn === undefined ? 0.45 : bn) * 4.5;   // 데이터 없는 곳은 판단 불가 — 중간값으로 둔다
      if (D.fgn[o.sg] && D.fgn[o.sg] <= 20) s -= 1.5;
    } else if (b) s += (b - 1) * 1.2;
    return s;
  }

  function fesOpen(o, dateStr) { return o.s && o.e && String(o.s) <= dateStr && dateStr <= String(o.e); }
  function marketsOn(D, dateStr) {
    var last = +dateStr.slice(-1);
    return (D.mkt || []).filter(function (m) { return (m.d || []).indexOf(last) >= 0; });
  }

  var SLOT_OF = { fes: 'main', nat: 'main', walk: 'main', acc: 'main', pet: 'main', food: 'food', cafe: 'cafe', stay: 'stay' };

  function candidates(D, O, dateStr, monthKey) {
    var pool = { main: [], food: [], cafe: [], stay: [], walk: [] };
    var wheel = (O.who || []).indexOf('wheel') >= 0, pet = (O.who || []).indexOf('pet') >= 0;
    var sgFilter = O.sigungu || '';
    Object.keys(D.c).forEach(function (cat) {
      D.c[cat].forEach(function (o) {
        if (!o.x || !o.y) return;
        if (sgFilter && o.sg && o.sg !== sgFilter) return;
        if (cat === 'fes' && !fesOpen(o, dateStr)) return;
        if (wheel && (cat === 'walk' || cat === 'nat')) return;
        var t = SLOT_OF[cat]; if (!t) return;
        if (pet && t === 'main' && cat !== 'pet' && !o.pet) return;
        var c = { o: o, s: scoreOf(D, o, O, monthKey) };
        pool[t].push(c);
        // ⚠️ 걷기길은 사진·개요가 없는 데이터가 많아 점수 싸움에서 명산·관광지에 밀린다.
        //    "걷기 중심"을 고른 사람에게 걷기길이 하나도 안 나오면 기능이 거짓말이 된다 → 전용 슬롯에 따로 담는다.
        if (cat === 'walk') pool.walk.push(c);
      });
    });
    return pool;
  }

  function template(dayIdx, total, pace, focus) {
    var slow = pace === 'slow', packed = pace === 'packed';
    var wantWalk = (focus || []).indexOf('walk') >= 0;
    var t = [wantWalk ? 'walk' : 'main'];        // 걷기 중심이면 하루의 첫 자리를 걷기길에 준다
    if (!slow) t.push('main');
    t.push('food');
    t.push('main');
    if (packed) t.push('main');
    t.push('cafe');
    if (dayIdx < total - 1) { t.push('food'); t.push('stay'); }
    return t;
  }

  function travel(a, b, move) {
    var km = hav(a.x, a.y, b.x, b.y) * DETOUR;
    return { km: km, min: km / (SPEED[move] || SPEED.car) * 60 + (move === 'transit' ? 12 : 4) };
  }

  // 출발점 고르기 — 점수만 보면 울릉도처럼 "혼자 잘난 한 곳"이 뽑혀 하루 코스가 성립하지 않는다.
  // 주변 15km 안에 갈 곳이 몇 개나 더 있는지(밀도)를 함께 본다.
  function seedPick(pool) {
    var all = pool.main.concat(pool.food, pool.cafe);
    var top = pool.main.slice().sort(function (a, b) { return b.s - a.s; }).slice(0, 60);
    var ref = all.length > 400 ? all.slice(0, 400) : all;
    var best = null, bestV = -1e9;
    for (var i = 0; i < top.length; i++) {
      var c = top[i], near = 0;
      for (var j = 0; j < ref.length; j++) if (hav(c.o.x, c.o.y, ref[j].o.x, ref[j].o.y) < 15) near++;
      var v = c.s + Math.min(near, 40) / 6;
      if (v > bestV) { bestV = v; best = c; }
    }
    return best;
  }

  function makePlan(D, O) {
    var start = String(O.date || '').replace(/-/g, '');
    var used = {}, days = [], totalKm = 0, here = null;
    var nDays = Math.max(1, Math.min(5, +O.days || 1));

    for (var di = 0; di < nDays; di++) {
      var dateStr = di === 0 ? start : ymd(addDays(start, di));
      var monthKey = String(+dateStr.slice(4, 6));
      var pool = candidates(D, O, dateStr, monthKey);
      var slots = template(di, nDays, O.pace, O.focus);
      var clock = DAY_START, items = [], dayKm = 0, walkToday = 0;
      if (!here) { var sd = seedPick(pool); if (sd) here = { x: sd.o.x, y: sd.o.y }; }   // 첫날 출발 지역 기준점

      for (var si = 0; si < slots.length; si++) {
        var need = slots[si], list = pool[need] || [];
        if (need === 'walk' && !list.length) { need = 'main'; list = pool.main || []; }
        // 식사·카페는 가까워야 의미가 있다. 밥 먹으러 60km를 달리는 일정은 코스가 아니다.
        var legMax = (need === 'food' || need === 'cafe') ? 25 : MAX_LEG_KM;
        var best = null, bestV = -1e9;
        for (var i = 0; i < list.length; i++) {
          var c = list[i];
          if (used[c.o.cat + '|' + c.o.t]) continue;
          // 걷기길은 하루 한 개까지 — 4시간짜리를 두 개 넣으면 하루가 걷기만으로 끝난다
          if (c.o.cat === 'walk' && walkToday >= 1) continue;
          var tv = here ? travel(here, c.o, O.move) : { km: 0, min: 0 };
          if (here && tv.km > legMax) continue;
          var v = c.s - tv.min / 26;
          if (v > bestV) { bestV = v; best = { c: c, tv: tv }; }
        }
        if (!best) continue;
        var o = best.c.o;
        used[o.cat + '|' + o.t] = 1;
        if (o.cat === 'walk') walkToday++;
        clock += best.tv.min; dayKm += best.tv.km; totalKm += best.tv.km;
        if (need === 'stay') { items.push({ o: o, at: hhmm(Math.max(clock, 17 * 60)), move: best.tv, stay: 0, kind: 'stay' }); here = o; break; }
        // ⚠️ 올레 1코스처럼 전 구간 450분짜리 길이 있다. 그대로 넣으면 하루가 통째로 사라진다.
        //    일정에는 4시간까지만 잡고, 전 구간 소요시간은 카드에 따로 표기한다(full).
        var stay = o.cat === 'walk' ? Math.min(+o.min || 120, 240) : (STAY_MIN[o.cat] || 80);
        if (o.cat === 'walk' && +o.min > 240) o.full = +o.min;
        if (clock + stay > DAY_END + 60) break;
        items.push({ o: o, at: hhmm(clock), till: hhmm(clock + stay), move: best.tv, stay: stay, kind: need });
        clock += stay; here = o;
      }
      days.push({ date: dateStr, items: items, km: dayKm, markets: marketsOn(D, dateStr), month: monthKey });
    }
    return { O: O, days: days, km: totalKm, carCost: totalKm * FUEL_PER_KM, sido: D.sido };
  }

  // 코스에 안 들어간 상위 후보 — AI 상담이 "다른 데 없어요?"에 답할 재료
  function alternatives(D, P, n) {
    var O = P.O, dateStr = P.days[0].date, mk = String(+dateStr.slice(4, 6));
    var pool = candidates(D, O, dateStr, mk), picked = {}, out = [];
    P.days.forEach(function (d) { d.items.forEach(function (it) { picked[it.o.t] = 1; }); });
    ['main', 'food', 'cafe'].forEach(function (t) {
      pool[t].sort(function (a, b) { return b.s - a.s; }).slice(0, 30).forEach(function (c) {
        if (picked[c.o.t] || out.length >= (n || 40)) return;
        out.push(c.o.t + '[' + c.o.cat + (c.o.sub ? '/' + c.o.sub : '') + (c.o.sg ? '/' + c.o.sg : '') + ']');
      });
    });
    return out;
  }

  return {
    expand: expand, makePlan: makePlan, alternatives: alternatives, candidates: candidates,
    hav: hav, hhmm: hhmm, ymd: ymd, addDays: addDays, unimg: unimg,
    FUEL_PER_KM: FUEL_PER_KM, DETOUR: DETOUR, SPEED: SPEED, STAY_MIN: STAY_MIN
  };
}));
