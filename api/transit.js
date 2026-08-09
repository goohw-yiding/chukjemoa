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

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!ODSAY) return res.status(503).json({ error: 'ODSAY_KEY 미설정' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const legs = Array.isArray(body && body.legs) ? body.legs.slice(0, MAX_LEGS) : [];
  if (!legs.length) return res.status(400).json({ error: 'legs 없음' });

  const out = [];
  for (const l of legs) {
    const fx = Number(l.fx), fy = Number(l.fy), tx = Number(l.tx), ty = Number(l.ty);
    if (!fx || !fy || !tx || !ty) { out.push({ from: l.from, to: l.to, min: 0 }); continue; }
    const j = await odsay(fx, fy, tx, ty);
    const p = j && j.result && j.result.path && j.result.path[0];
    if (!p) { out.push({ from: l.from, to: l.to, min: 0 }); continue; }
    out.push({
      from: l.from, to: l.to,
      min: p.info.totalTime,
      transfer: (p.info.busTransitCount || 0) + (p.info.subwayTransitCount || 0),
      pay: p.info.payment || 0,
      km: Math.round((p.info.totalDistance || 0) / 100) / 10
    });
  }
  res.status(200).json({ legs: out });
};
