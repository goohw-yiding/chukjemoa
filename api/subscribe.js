// 축제모아 「이주의 축제모아」 이메일 구독 신청 (2026-10-02)
// 저장: Supabase aeo-app 프로젝트 public.newsletter_subscribers — 표는 RLS로 잠겨 있고,
//       익명 키로는 newsletter_subscribe() 함수 «하나만» 부를 수 있다(읽기·삭제 불가).
// 응답은 «이미 구독 중»과 «새로 구독»을 구분하지 않는다 — 남의 이메일 구독 여부가 드러나지 않게.
// 지금은 주소만 모은다. 실제 발송은 구독자가 생긴 뒤 발송 서비스를 붙일 때 시작한다.
const https = require('https');

const SB_URL = 'https://mwlnlcphquebujgbmczh.supabase.co';
const SB_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_92mGbzpL6iK8NcneyoNkMw_K6krhauk';
const CONSENT_VERSION = 'privacy-2026-10-02';
const ALLOW = ['chukjemoa.co.kr', 'localhost'];
const IP_MAX = 5;          // IP당 하루 신청 수(인스턴스 메모리 — 콜드스타트마다 리셋되는 얕은 방어)
let DAY = '';
const perIp = new Map();
const today = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

function rpc(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(SB_URL + '/rest/v1/rpc/newsletter_subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY },
      timeout: 8000
    }, res => {
      let s = '';
      res.on('data', c => s += c);
      res.on('end', () => resolve({ status: res.statusCode, body: s }));
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.end(data);
  });
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.statusCode = 405; return res.end(JSON.stringify({ ok: false, msg: 'POST만 받습니다.' })); }
  const ref = String(req.headers.referer || req.headers.origin || '');
  if (!ALLOW.some(h => ref.includes(h))) { res.statusCode = 403; return res.end(JSON.stringify({ ok: false, msg: '허용되지 않은 요청입니다.' })); }

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  // 봇 함정: 사람에게는 안 보이는 칸. 채워져 오면 조용히 성공한 척만 한다.
  if (b.website) return res.end(JSON.stringify({ ok: true }));
  const email = String(b.email || '').trim().toLowerCase().slice(0, 254);
  const source = String(b.source || '').replace(/[^\w\/\-.]/g, '').slice(0, 80);
  if (!b.agree) { res.statusCode = 400; return res.end(JSON.stringify({ ok: false, msg: '개인정보 수집·이용에 동의해 주셔야 신청할 수 있습니다.' })); }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { res.statusCode = 400; return res.end(JSON.stringify({ ok: false, msg: '이메일 주소를 다시 확인해 주세요.' })); }

  const d = today();
  if (d !== DAY) { DAY = d; perIp.clear(); }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'na';
  const n = (perIp.get(ip) || 0) + 1;
  perIp.set(ip, n);
  if (n > IP_MAX) { res.statusCode = 429; return res.end(JSON.stringify({ ok: false, msg: '잠시 후 다시 시도해 주세요.' })); }

  try {
    const r = await rpc({ p_email: email, p_site: 'chukjemoa', p_source: source, p_consent: CONSENT_VERSION });
    const v = (r.body || '').replace(/"/g, '');
    if (r.status === 200 && v === 'ok') return res.end(JSON.stringify({ ok: true }));
    if (r.status === 200 && v === 'invalid') { res.statusCode = 400; return res.end(JSON.stringify({ ok: false, msg: '이메일 주소를 다시 확인해 주세요.' })); }
    console.error('subscribe rpc', r.status, (r.body || '').slice(0, 200));
  } catch (e) {
    console.error('subscribe error', e.message);
  }
  res.statusCode = 502;
  res.end(JSON.stringify({ ok: false, msg: '지금 신청을 받을 수 없습니다. 잠시 후 다시 시도해 주세요.' }));
};
