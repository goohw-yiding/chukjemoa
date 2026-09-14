// 축제모아 서비스워커 — 브라우저 알림(웹 푸시)용.
// ⚠️ 지금은 «지원되는지 재는 것»까지가 목적이다. 발송 서버는 아직 없다.
//   웨일 모바일(방문자의 50%)이 웹 푸시를 지원하는지 확인되지 않아, 그것부터 실물로 잰다.
//   캐시(오프라인)는 건드리지 않는다 — 정적 사이트에 캐시를 깔았다가 잘못 되돌리면
//   사람들 브라우저에 «옛 페이지»가 남는다. 알림만 한다.

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = { title: '축제모아', body: '새 소식이 있습니다.', url: '/' };
  try { if (e.data) d = Object.assign(d, e.data.json()); } catch (err) { }
  e.waitUntil(self.registration.showNotification(d.title, {
    body: d.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: d.url },
    tag: d.tag || 'chukjemoa'
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    for (const w of ws) { if (w.url.indexOf(self.location.origin) === 0 && 'focus' in w) { w.navigate(url); return w.focus(); } }
    return clients.openWindow(url);
  }));
});
