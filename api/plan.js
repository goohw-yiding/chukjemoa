// 축제모아 — AI 여행상담 (Claude Haiku). 규칙기반 엔진이 짠 코스를 놓고 자유대화로 다듬는다.
//
// ── 비용 설계 (이게 이 파일의 핵심이다) ──────────────────────────────
// LLM에게 후보 1만 건을 통째로 주지 않는다. 클라이언트 엔진(B)이 이미 코스를 짜고 대안 후보까지
// 추려서 보내므로, 여기서는 "해석하고 말로 풀어주는 일"만 시킨다. 입력이 작아야 비용이 작다.
//   · 입력 약 2,500~3,500토큰 · 출력 900토큰 상한
//   · 시스템 프롬프트는 prompt caching(ephemeral)으로 재사용 → 2턴째부터 90% 할인
//   · Haiku 4.5 = 입력 $1 / 출력 $5 per 1M → 대화 1턴 약 10~15원, 3턴 세션 약 30~45원
//
// ── 폭주 방지 4중 잠금 ──────────────────────────────────────────────
//   ① Referer 검사 — 우리 사이트에서 온 요청만
//   ② IP당 일일 횟수 (인스턴스 메모리)
//   ③ 인스턴스 전체 일일 횟수 (DAILY_MAX)
//   ④ 입력 길이 하드 컷 — 누가 장문을 밀어 넣어도 토큰이 안 커진다
//   ※ ②③은 서버리스 인스턴스별이라 완벽하지 않다. 최후 방어선은 Anthropic 콘솔의 월 지출 한도다.
//      반드시 콘솔에서 Spend limit 을 걸어둘 것.
const https = require('https');

const KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = process.env.PLAN_MODEL || 'claude-haiku-4-5-20251001';
const DAILY_MAX = Number(process.env.PLAN_DAILY_MAX || 400);   // 인스턴스 일일 총 호출
const IP_MAX = Number(process.env.PLAN_IP_MAX || 12);          // IP당 일일 호출
const MAX_TOKENS = 900;
const ALLOW = ['chukjemoa.co.kr', 'localhost'];

const CUT = { q: 400, plan: 2200, alts: 1400, hist: 700, dest: 4200 };
const cut = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').slice(0, n);

// 인스턴스 메모리 카운터 (콜드스타트마다 리셋 — 어림 방어용)
let DAY = '', total = 0;
const perIp = new Map();
function today() { return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); }  // KST 기준
function gate(ip) {
  const d = today();
  if (d !== DAY) { DAY = d; total = 0; perIp.clear(); }
  if (total >= DAILY_MAX) return 'daily';
  const n = (perIp.get(ip) || 0) + 1;
  if (n > IP_MAX) return 'ip';
  perIp.set(ip, n); total++;
  return null;
}

const SYSTEM = `당신은 한국 여행 코스를 다듬어 주는 상담자다. 사이트 "축제모아"의 코스 제안 기능 안에서 동작한다.

역할: 사용자가 이미 받은 코스(아래 [코스])를 놓고, 질문에 맞게 조정 제안을 한다.

지켜야 할 규칙:
1. [코스]와 [대안후보]에 나온 장소만 쓴다. 목록에 없는 장소 이름을 지어내지 않는다. 다른 곳을 원하면 "이 목록에는 없어요"라고 말하고 검색을 권한다.
2. 영업시간·휴무일·입장료·예약 가능 여부는 우리에게 데이터가 없다. 아는 척하지 말고 "방문 전 확인이 필요하다"고 말한다.
3. 이동시간은 직선거리 기반 추정치다. 정확한 시간을 물으면 추정임을 밝히고, 페이지의 '대중교통 실제 소요시간 확인' 버튼을 안내한다.
4. 답은 짧게. 3~6문장 또는 짧은 목록. 인사말·서론 없이 바로 본론.
5. 한국어로 답한다(사용자가 다른 언어로 물으면 그 언어로).
6. 붐빔 지표(×배수)는 그 장소가 아니라 그 시·군·구의 방문자 수 기준이다. 그렇게 설명한다.
7. 의료·안전·법률 판단은 하지 않는다.`;

// ── trip 모드: 외국어 페이지의 "몇 번째 한국 여행인데 어디 갈까" 상담
// 국문 코스 상담과 프롬프트가 완전히 다르지만 파일을 나누지 않는다.
// 서버리스는 파일별로 인스턴스가 따로 뜨므로 파일을 나누면 IP·일일 캡이 2배로 느슨해진다.
const SYSTEM_TRIP = `You advise foreign travellers on where to go in South Korea, inside a site called Chukjemoa.

You are given [DESTINATIONS]: districts this site covers, each with hard numbers —
  foreign_rank = its rank among the 40 districts that receive the most foreign visitors ("none" = not in that 40)
  korean_peak_x = how much busier it gets with Korean travellers in the given month, versus its own normal level
  counts of registered attractions, walking trails, natural sites, traditional markets, accessible sites
  and a few example places, written as "Romanised (한글)".

Rules you must follow:
1. Recommend ONLY districts and places that appear in [DESTINATIONS]. Never invent a place name. If the user asks about somewhere not listed, say plainly that this site does not cover it, and suggest the closest listed alternative.
2. Always give a reason from the numbers. "Not in the top 40 for foreign visitors, and Koreans make it ×1.35 busier in August" is a reason. "It's beautiful" is not.
3. Keep Korean names attached: write "Sokcho (속초시)" the first time you name a place. The traveller will show it to a taxi driver.
4. We have NO data on opening hours, closing days, ticket prices, visas, or seat availability. Never state them. Say they must be checked.
5. Distances and travel times are not in this context. Do not state any duration in hours or kilometres unless the user supplied it.
6. Be short: 3–6 sentences, or a short list of at most 4 destinations. No preamble, no closing pleasantries.
7. Reply in the SAME language as the [LANG] tag. If the user writes in a different language, follow the user.
8. If the user says which places they have already visited, exclude those and explain what changes as a result.`;

function callClaude(payload) {
  return new Promise((res, rej) => {
    const data = JSON.stringify(payload);
    const req = https.request({
      host: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
      headers: {
        'x-api-key': KEY, 'anthropic-version': '2023-06-01',
        'content-type': 'application/json', 'content-length': Buffer.byteLength(data)
      }
    }, r => {
      r.setEncoding('utf8');                        // ⚠️ 한글 깨짐 방지
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => { try { res({ status: r.statusCode, body: JSON.parse(d) }); } catch (e) { rej(new Error('parse')); } });
    });
    req.on('error', rej);
    req.setTimeout(25000, () => { req.destroy(); rej(new Error('timeout')); });
    req.write(data); req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!KEY) return res.status(503).json({ text: 'AI 상담이 아직 켜지지 않았습니다. 위의 코스는 그대로 쓰실 수 있어요.' });

  // ① 우리 사이트에서 온 요청만
  const ref = String(req.headers.referer || req.headers.origin || '');
  if (ref && !ALLOW.some(h => ref.indexOf(h) >= 0)) return res.status(403).json({ error: 'forbidden' });

  // ② ③ 횟수 제한
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const blocked = gate(ip);
  if (blocked) return res.status(429).json({ text: blocked === 'ip' ? '오늘 이 기기에서 쓸 수 있는 AI 상담 횟수를 다 썼습니다. 내일 다시 이용해 주세요.' : '오늘 AI 상담 사용량이 많아 잠시 쉬고 있습니다. 위의 코스와 대안 목록은 그대로 쓰실 수 있어요.' });

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  const q = cut(b.q, CUT.q);
  if (!q) return res.status(400).json({ error: 'q 없음' });

  const TRIP = b.mode === 'trip';
  const LANGNAME = { en: 'English', ja: 'Japanese (日本語)', zh: 'Simplified Chinese (简体中文)', tw: 'Traditional Chinese (繁體中文)', es: 'Spanish (Español)' };
  let ctx;
  if (TRIP) {
    const lang = LANGNAME[b.lang] ? b.lang : 'en';
    const TIER = { first: 'first visit to Korea', second: 'second visit', third: 'third or later visit', all: 'not specified' };
    ctx = [
      `[LANG] ${LANGNAME[lang]}`,
      `[CONTEXT] Page is about: ${TIER[b.tier] || 'not specified'}. Reference month for the crowd multiplier: ${String(b.month || '').slice(0, 2)}.`,
      `[DESTINATIONS]\n${cut(b.dest, CUT.dest)}`
    ].join('\n');
  } else {
    const cond = b.cond || {};
    const WHO = { alone: '혼자', friend: '친구·연인', kid: '아이 동반', parent: '부모님 동반', pet: '반려견 동반', wheel: '휠체어·유아차' };
    const FOCUS = { walk: '걷기', nature: '자연', food: '먹기', photo: '사진·감성', fes: '축제', quiet: '한적한 곳' };
    ctx = [
      `[지역] ${cut(b.region, 20)}`,
      `[조건] ${cond.date || ''} 출발 ${cond.days || 1}일 · ${(cond.who || []).map(w => WHO[w] || w).join('·') || '지정 없음'} · 중점 ${(cond.focus || []).map(f => FOCUS[f] || f).join('·') || '지정 없음'} · ${cond.move === 'transit' ? '대중교통' : '자차'}`,
      `[코스]\n${cut(b.plan, CUT.plan)}`,
      `[대안후보] ${cut(b.alts, CUT.alts)}`
    ].join('\n');
  }

  const msgs = [];
  (Array.isArray(b.history) ? b.history.slice(-4) : []).forEach(m => {
    if (m && (m.role === 'user' || m.role === 'assistant') && m.content)
      msgs.push({ role: m.role, content: cut(m.content, CUT.hist) });
  });
  msgs.push({ role: 'user', content: ctx + (TRIP ? '\n\n[QUESTION] ' : '\n\n[질문] ') + q });

  try {
    const r = await callClaude({
      model: MODEL, max_tokens: MAX_TOKENS,
      // 시스템 프롬프트 캐싱 — 같은 세션 2턴째부터 입력비 90% 절감
      system: [{ type: 'text', text: TRIP ? SYSTEM_TRIP : SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: msgs
    });
    if (r.status !== 200) {
      console.error('claude', r.status, JSON.stringify(r.body).slice(0, 300));
      return res.status(200).json({ text: '지금은 AI 상담에 문제가 있습니다. 잠시 후 다시 시도해 주세요.' });
    }
    const text = (r.body.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
    const u = r.body.usage || {};
    console.log(`plan ok in=${u.input_tokens} cache_r=${u.cache_read_input_tokens || 0} out=${u.output_tokens} ip=${ip}`);
    res.status(200).json({ text: text || '답을 만들지 못했습니다. 질문을 조금 바꿔서 다시 물어봐 주세요.' });
  } catch (e) {
    console.error('plan err', e.message);
    res.status(200).json({ text: '응답이 늦어 중단했습니다. 다시 시도해 주세요.' });
  }
};
