// ══════════════════════════════════════════════════════════════════
// /pushtest/ — 브라우저 알림 지원 «실물 측정» 페이지 (noindex)
//
// 왜 (2026-09-11)
//   GA4 28일: Android 66.7% · Windows 19.4% · iOS 11.1%.
//   브라우저는 **네이버 웨일 50.4%** · Chrome 19.7% · Safari 10.1% · 삼성인터넷 9.5%.
//   웨일이 절반인데 «웨일 모바일이 웹 푸시를 지원하는가»를 문서로 확인하지 못했다.
//   문서를 더 찾는 것보다 실제 기기로 한 번 여는 게 빠르고 확실하다.
//
// ⚠️ 발송 서버는 아직 없다. 이 페이지는 재기만 한다 —
//    ① 서비스워커 등록 ② PushManager 존재 ③ 권한 요청 ④ 알림이 «눈에 보이나»
//    ⑤ pushManager.subscribe() 성공 (여기서 막히는 브라우저가 실제로 있다)
// ══════════════════════════════════════════════════════════════════
const fs = require('fs'), path = require('path');

function build(ctx) {
  const { ROOT, layout, writePage, SITE_NAME } = ctx;
  let VAPID = '';
  try { VAPID = JSON.parse(fs.readFileSync(path.join(ROOT, 'vapid.key'), 'utf8')).pub; } catch (e) { }
  if (!VAPID) { console.log('  ⚠️ vapid.key 없음 — /pushtest/ 건너뜀'); return []; }

  const CSS = `<style>
.pt{max-width:560px;margin:0 auto}
.pt h1{font-size:1.35rem;margin:0 0 4px}
.ptrow{display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #eef2f1;border-radius:12px;padding:11px 14px;margin:7px 0}
.ptrow b{flex:1;font-size:.95rem;color:#111827;font-weight:700}
.ptv{font-weight:800;font-size:.9rem;white-space:nowrap}
.ok{color:#0a7a44}.no{color:#c2410c}.wait{color:#9ca3af}
.ptbtn{display:block;width:100%;margin:10px 0;padding:15px;border:0;border-radius:12px;background:#0f9d8f;color:#fff;font-size:1.02rem;font-weight:800;cursor:pointer}
.ptbtn:disabled{background:#d1d5db}
.ptlog{background:#0f172a;color:#cbd5e1;border-radius:12px;padding:12px 14px;font:12px/1.65 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;word-break:break-all;margin-top:14px;min-height:70px}
.ptua{color:#6b7280;font-size:.83rem;word-break:break-all;margin-top:10px}
</style>`;

  const content = `<main><div class="wrap"><div class="pt">
${CSS}
<h1>브라우저 알림 — 지원 확인</h1>
<p class="note">이 브라우저가 알림을 받을 수 있는지 재는 페이지입니다. <b>지금 보내는 알림은 없습니다.</b>
아래 버튼을 누르면 시험용 알림 하나가 이 기기에만 뜹니다.</p>

<div class="ptrow"><b>서비스워커</b><span class="ptv wait" id="r1">확인 중</span></div>
<div class="ptrow"><b>PushManager</b><span class="ptv wait" id="r2">확인 중</span></div>
<div class="ptrow"><b>Notification</b><span class="ptv wait" id="r3">확인 중</span></div>
<div class="ptrow"><b>워커 등록</b><span class="ptv wait" id="r4">확인 중</span></div>
<div class="ptrow"><b>알림 권한</b><span class="ptv wait" id="r5">-</span></div>
<div class="ptrow"><b>푸시 구독</b><span class="ptv wait" id="r6">-</span></div>

<button class="ptbtn" id="go">알림 허용하고 시험 알림 받기</button>
<div class="ptlog" id="log">준비 중…</div>
<p class="ptua" id="ua"></p>
<p class="note">시험이 끝나면 브라우저 설정에서 이 사이트 알림을 끄실 수 있습니다.</p>
</div></div></main>

<script>
(function(){
  var VAPID = ${JSON.stringify(VAPID)};
  var L = document.getElementById('log'), lines = [];
  function log(s){ lines.push(s); L.textContent = lines.join('\\n'); }
  function set(id, ok, txt){
    var e = document.getElementById(id);
    e.className = 'ptv ' + (ok === null ? 'wait' : (ok ? 'ok' : 'no'));
    e.textContent = txt;
  }
  document.getElementById('ua').textContent = navigator.userAgent;
  log('UA ' + navigator.userAgent);

  var hasSW = 'serviceWorker' in navigator;
  var hasPM = 'PushManager' in window;
  var hasNo = 'Notification' in window;
  set('r1', hasSW, hasSW ? '있음' : '없음');
  set('r2', hasPM, hasPM ? '있음' : '없음');
  set('r3', hasNo, hasNo ? '있음' : '없음');

  var reg = null;
  if (hasSW) {
    navigator.serviceWorker.register('/sw-push.js').then(function(r){
      reg = r; set('r4', true, '성공'); log('서비스워커 등록 OK  scope=' + r.scope);
    }).catch(function(e){
      set('r4', false, '실패'); log('서비스워커 등록 실패: ' + e.message);
    });
  } else { set('r4', false, '불가'); }

  function b64(s){
    var p = '='.repeat((4 - s.length % 4) % 4);
    var b = atob((s + p).replace(/-/g,'+').replace(/_/g,'/'));
    var a = new Uint8Array(b.length);
    for (var i=0;i<b.length;i++) a[i] = b.charCodeAt(i);
    return a;
  }

  document.getElementById('go').onclick = function(){
    this.disabled = true;
    if (!hasNo) { log('Notification API 자체가 없습니다 — 이 브라우저는 웹 푸시를 못 받습니다.'); return; }
    Notification.requestPermission().then(function(p){
      set('r5', p === 'granted', p);
      log('권한 응답: ' + p);
      if (p !== 'granted') { log('거부되었습니다. 여기서 끝입니다.'); return; }
      if (!reg) { log('서비스워커가 없어 알림을 띄울 수 없습니다.'); return; }

      reg.showNotification('축제모아 시험 알림', {
        body: '이 알림이 보이면 이 기기는 알림을 받을 수 있습니다.',
        icon: '/icon-192.png', tag: 'pushtest'
      }).then(function(){ log('showNotification 호출 성공 — 알림이 «눈에 보이는지» 확인해 주세요.'); })
        .catch(function(e){ log('showNotification 실패: ' + e.message); });

      if (!hasPM) { set('r6', false, '불가'); log('PushManager 가 없어 구독은 못 합니다(서버 발송 불가).'); return; }
      reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(VAPID) })
        .then(function(sub){
          set('r6', true, '성공');
          var ep = sub.endpoint || '';
          log('구독 성공 ✅  서버에서 보낼 수 있습니다.');
          log('endpoint 앞부분: ' + ep.slice(0, 60) + '…');
        })
        .catch(function(e){ set('r6', false, '실패'); log('구독 실패 ❌ ' + e.name + ': ' + e.message); });
    }).catch(function(e){ log('권한 요청 실패: ' + e.message); });
  };
})();
</script>`;

  writePage('pushtest', layout(
    `브라우저 알림 지원 확인 | ${SITE_NAME}`,
    '이 브라우저가 알림을 받을 수 있는지 확인하는 시험 페이지입니다.',
    '/pushtest/', content, { noindex: true }));
  console.log('✓ /pushtest/ — 알림 지원 측정 페이지(noindex)');
  return [];   // 사이트맵에 넣지 않는다 — 시험용이다
}

module.exports = { build };
