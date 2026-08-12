// 🔬 «진짜 방문자 브라우저»를 흉내 내는 자가진단 (임시 · 검증 끝나면 지울 것)
//
// ⚠️ 왜 필요한가 — 2026-08-12 에 크게 헛디딜 뻔한 지점:
//    ODsay 콘솔에 **Server IP 허용목록**(장남 님 IP 2개)이 걸려 있다.
//    그래서 이 PC 에서 하는 모든 테스트는 «브라우저든 노드든» 무조건 통과한다.
//    브라우저 직접 호출이 된다고 확인했던 것도 **허용된 IP 에서 본 것**이라 아무것도 증명하지 못한다.
//
//    이 엔드포인트는 Vercel(=허용목록에 없는 IP)에서 돌면서
//    **Referer 를 chukjemoa.co.kr 로 붙여** ODsay 를 부른다 —
//    즉 «남의 IP + 우리 도메인» 조합, 실제 방문자와 같은 조건이다.
//    여기서 성공해야 비로소 URI(도메인) 허용이 살아 있다고 말할 수 있다.
const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const KEY = process.env.ODSAY_KEY || '';
  if (!KEY) { res.statusCode = 503; return res.end(JSON.stringify({ error: 'ODSAY_KEY 미설정' })); }

  const path = '/v1/api/searchPubTransPathT?apiKey=' + encodeURIComponent(KEY)
    + '&SX=126.9707&SY=37.5540&EX=127.0276&EY=37.4979&OPT=0&SearchPathType=0';

  const call = (headers, label) => new Promise(r => {
    https.get({ host: 'api.odsay.com', path, headers }, x => {
      let d = ''; x.setEncoding('utf8'); x.on('data', c => d += c);
      x.on('end', () => {
        let j = {}; try { j = JSON.parse(d); } catch (e) {}
        r({ label, ok: !j.error && !!(j.result && j.result.path),
             error: j.error ? (j.error.code + ' ' + j.error.message) : null });
      });
    }).on('error', e => r({ label, ok: false, error: 'NET ' + e.message }));
  });

  const ip = await new Promise(r => {
    https.get('https://api.ipify.org', x => { let d = ''; x.on('data', c => d += c); x.on('end', () => r(d)); })
      .on('error', () => r('?'));
  });

  const out = await Promise.all([
    call({}, '헤더 없음(순수 서버 호출)'),
    call({ Referer: 'https://chukjemoa.co.kr/course/', Origin: 'https://chukjemoa.co.kr' },
         '우리 도메인 Referer(방문자 브라우저와 같은 조건)'),
    call({ Referer: 'https://example.com/' }, '남의 도메인 Referer')
  ]);

  res.statusCode = 200;
  res.end(JSON.stringify({
    호출한IP: ip,
    설명: '이 IP 는 ODsay 콘솔 Server 허용목록에 없다. 2번이 ok:true 여야 실제 방문자도 된다.',
    결과: out
  }, null, 2));
};
