// 축제모아 — 코스 구간별 대중교통 실제 소요시간 (ODsay)
// ⚠️ 코스를 짤 때가 아니라 "코스가 확정된 뒤 확인 버튼을 눌렀을 때"만 호출한다.
//    초안 배치까지 실측을 쓰면 한 사람이 코스 하나 만들 때마다 수십 번 호출돼 무료 한도(일 1,000회)가 금방 마른다.
// 키는 Vercel 환경변수: ODSAY_KEY
const https = require('https');
const ODSAY = process.env.ODSAY_KEY || '';
const MAX_LEGS = 8;

function odsay(fx, fy, tx, ty) {
  return new Promise(res => {
    const p = `/v1/api/searchPubTransPathT?apiKey=${encodeURIComponent(ODSAY)}&SX=${fx}&SY=${fy}&EX=${tx}&EY=${ty}&OPT=0&SearchPathType=0`;
    const req = https.get({ host: 'api.odsay.com', path: p }, r => {
      r.setEncoding('utf8');                       // ⚠️ 한글 깨짐 방지
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { res(null); } });
    });
    req.on('error', () => res(null));
    req.setTimeout(8000, () => { req.destroy(); res(null); });
  });
}

// ⚠️ 2026-08-12 폐지 — 서버에서는 ODsay 를 부를 수 없다.
//    같은 키로 이 PC 는 성공, Vercel 은 ApiKeyAuthFailed. Referer 는 무관(example.com 도 통과).
//    남은 변수는 «호출 IP» 뿐이고 Vercel 서버리스는 고정 IP 가 없어 ODsay 에 등록할 방법이 없다.
//    → 브라우저에서 직접 부르는 방식으로 옮겼다(`odsay.js` 의 window.cjmOdsay, ODsay 는 CORS 개방).
//    이 엔드포인트는 옛 브라우저 캐시가 아직 부를 수 있어 남겨 두되, **실패할 걸 알면서 API 를 때리지는 않는다**
//    (쿼터를 태우고 응답만 느려진다). 새 코드가 퍼지면 파일째 지울 것.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ error: 'moved', msg: '대중교통 조회는 브라우저에서 직접 처리합니다(window.cjmOdsay).', legs: [] });
};
