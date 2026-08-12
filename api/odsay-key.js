// 🔑 ODsay 웹키를 브라우저에 넘겨준다.
//
// ⚠️ 2026-08-12 실측으로 확정된 사실:
//    · 같은 키를 **이 PC에서 부르면 성공**하고 **Vercel에서 부르면 ApiKeyAuthFailed** 다.
//    · Referer 는 무관하다 — `example.com` Referer 로도 통과했다(도메인 잠금이 꺼져 있음).
//    · 즉 원인은 **호출 IP**(데이터센터 차단)이고, Vercel 서버리스는 고정 IP가 없어 해결할 방법이 없다.
//    → 그래서 **브라우저에서 직접** api.odsay.com 을 부른다. ODsay 는 CORS 를 완전히 열어 뒀다
//      (`Access-Control-Allow-Origin: *`, GET·POST 허용) — 실측 확인함.
//
// ⚠️ 웹키는 브라우저에 노출되는 게 원래 설계다. 진짜 방어선은 **ODsay 콘솔의 도메인 잠금**이다.
//    지금은 그 잠금이 꺼져 있다 → 장남 님이 콘솔에서 켜야 한다.
//    그 전까지의 최소 방어로 여기서 Referer 를 확인한다. HTML 만 긁어서는 키를 못 가져간다.
const ALLOW = /^https?:\/\/([a-z0-9-]+\.)?chukjemoa\.co\.kr(\/|$)/i;

module.exports = (req, res) => {
  const KEY = process.env.ODSAY_KEY || '';
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (!KEY) { res.statusCode = 503; return res.end(JSON.stringify({ error: 'ODSAY_KEY 미설정' })); }

  const ref = String(req.headers.referer || req.headers.origin || '');
  const local = /^https?:\/\/localhost(:\d+)?(\/|$)/i.test(ref);
  if (!ALLOW.test(ref) && !local) { res.statusCode = 403; return res.end(JSON.stringify({ error: 'forbidden' })); }

  // 브라우저가 한 세션에 한 번만 받아가면 되므로 1시간 캐시
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.statusCode = 200;
  res.end(JSON.stringify({ k: KEY }));
};
