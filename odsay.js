// 🚌 브라우저에서 ODsay 대중교통 경로를 직접 부르는 공용 헬퍼
//
// ⚠️ 왜 서버가 아니라 브라우저인가 (2026-08-12 실측)
//    같은 키로 이 PC는 성공 · Vercel 서버는 `ApiKeyAuthFailed`.
//    Referer 는 무관(`example.com` 으로도 통과) → 남은 변수는 **호출 IP** 뿐이고,
//    Vercel 서버리스는 고정 IP 가 없어 ODsay 에 등록할 수가 없다.
//    반면 ODsay 는 **CORS 를 완전히 열어 뒀다**(`Access-Control-Allow-Origin: *`) → 브라우저에서 부르면 된다.
//    사용자 브라우저의 IP 로 나가므로 데이터센터 차단에 걸리지 않는다.
//
// ⚠️ 키는 `/api/odsay-key` 에서 한 번만 받아 sessionStorage 에 둔다(호출당 왕복 1회를 아낀다).
'use strict';

const ODSAY_JS = `<scr` + `ipt>
(function(){
  var KEY = null, pending = null;
  function getKey(){
    if (KEY) return Promise.resolve(KEY);
    try { var s = sessionStorage.getItem('cjm_ok'); if (s) { KEY = s; return Promise.resolve(KEY); } } catch(e){}
    if (pending) return pending;
    pending = fetch('/api/odsay-key')
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){
        KEY = (j && j.k) || '';
        try { if (KEY) sessionStorage.setItem('cjm_ok', KEY); } catch(e){}
        pending = null;
        return KEY;
      })
      .catch(function(){ pending = null; return ''; });
    return pending;
  }

  // 좌표 4개 → { fare, durationMin, transfer, walk } | null
  // 실패·경로없음은 전부 null 로 돌려준다. 호출부는 «없으면 추정치» 로 가면 된다.
  window.cjmOdsay = function(sx, sy, ex, ey){
    if (!sx || !sy || !ex || !ey) return Promise.resolve(null);
    return getKey().then(function(k){
      if (!k) return null;
      var u = 'https://api.odsay.com/v1/api/searchPubTransPathT?apiKey=' + encodeURIComponent(k)
            + '&SX=' + sx + '&SY=' + sy + '&EX=' + ex + '&EY=' + ey + '&OPT=0&SearchPathType=0';
      return fetch(u).then(function(r){ return r.json(); }).then(function(j){
        if (!j || j.error || !j.result || !j.result.path || !j.result.path.length) return null;
        // ⚠️ ODsay 는 수도권 버스·지하철 요금만 준다. 시외버스·KTX 구간은 payment=0 으로 온다.
        //    그래서 «요금이 있는 첫 경로» 를 우선 고르고, 없으면 요금은 null 로 둔다(0원이라고 말하지 않는다).
        var p = null, arr = j.result.path;
        for (var i = 0; i < arr.length; i++) { if (arr[i].info && arr[i].info.payment > 0) { p = arr[i]; break; } }
        if (!p) p = arr[0];
        var f = p.info || {};
        return {
          fare: f.payment > 0 ? f.payment : null,
          durationMin: f.totalTime || 0,
          transfer: (f.busTransitCount || 0) + (f.subwayTransitCount || 0),
          walk: f.totalWalk || 0
        };
      }).catch(function(){ return null; });
    });
  };
})();
</scr` + `ipt>`;

module.exports = { ODSAY_JS };
