// 네이버 발행 큐 — 「무엇을 언제 쓸지」를 실측으로 정한다.
//
// 왜 만들었나 (2026-08-31)
//   「9월축제」 같은 일반어는 네이버 SERP에 웹사이트 자리가 거의 없다(블로그 87 vs 웹사이트 2).
//   반면 «개별 축제명»은 검색량이 크고 그 자리가 전부 블로그다 → 우리가 블로그로 먹을 자리.
//   그런데 어느 축제명이 얼마나 팔리는지는 감으로 알 수 없다. 그래서 네이버 검색광고 API로
//   «다가오는 축제 전부»의 검색량을 재고, 개막일과 묶어 발행 순서를 만든다.
//
// 사용법
//   node naver-queue.js                 → 앞으로 60일 안에 개막하는 축제
//   node naver-queue.js --days 90       → 창 넓히기
//   node naver-queue.js --min 1000      → 월 검색량 하한
//   결과: naver-queue.md (사람이 읽는 표) + data/naver-queue.json (naver-brief.js 가 씀)
//
// ⚠️ 검색량은 네이버 검색광고 API(keywordstool) 실측이다. 추정치를 지어내지 않는다.
//    API 키는 C:\dev\airo_naver_ad\config.json (개인 계정, git 밖).

const fs = require('fs'), path = require('path'), https = require('https'), crypto = require('crypto');

const CFG_PATH = process.env.NAVER_AD_CONFIG || 'C:\\dev\\airo_naver_ad\\config.json';
const DATA = path.join(__dirname, 'data');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const DAYS = parseInt(arg('--days', '60'), 10);
const MIN = parseInt(arg('--min', '300'), 10);
const LEAD = parseInt(arg('--lead', '10'), 10);   // 개막 며칠 전에 발행할지

// ── 날짜 (KST 기준. toISOString 은 하루 밀리므로 보정해서 쓴다) ────────────
const kst = new Date(Date.now() + 9 * 3600e3);
const TODAY = kst.toISOString().slice(0, 10).replace(/-/g, '');
const ymd = s => String(s || '').replace(/-/g, '').slice(0, 8);
const toDate = s => new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
const dayDiff = (a, b) => Math.round((toDate(a) - toDate(b)) / 86400e3);
const fmt = s => `${+s.slice(4, 6)}/${+s.slice(6, 8)}`;
const shift = (s, n) => {
  const d = toDate(s); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};

// ── 데이터 ────────────────────────────────────────────────────────────────
const readJson = f => { try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); } catch (e) { return []; } };
const asList = j => Array.isArray(j) ? j : (j.items || j.list || []);
const fests = asList(readJson('festivals_api.json')).filter(r => r && r.title && r.start);
const pages = asList(readJson('festival_pages.json'));
const slugById = {}; for (const p of pages) if (p.id) slugById[String(p.id)] = p.slug;

// 다가오는 축제 (이미 시작했어도 3일 이내면 아직 늦지 않았다)
const upcoming = fests.filter(r => {
  const d = dayDiff(ymd(r.start), TODAY);
  return d >= -3 && d <= DAYS;
});

// ── 축제명 → 검색 키워드 후보 ────────────────────────────────────────────
// 사람들은 축제 «공식 명칭»으로 검색하지 않는다. "제31회 홍성남당항 대하축제"를
// "대하축제"라고 친다. 그래서 짧은 쪽부터 넓게 후보를 만들고, 실제 검색량이 붙는
// 것만 남긴다. (짐작하지 말고 잴 것 — 감으로 고르면 틀린다)
//
// ⚠️ 2026-08-31 1차 실행에서 드러난 함정: 그냥 「마지막 토큰」을 쓰면 "장항 맥문동 꽃 축제"가
//    「축제」(151,500)로 잡힌다. 검색량은 크지만 **우리가 못 먹는 일반어**다(네이버 SERP에
//    웹사이트 자리가 없다는 게 이 프로젝트의 출발점이었다). 그래서 «그 축제만의 고유한 말»이
//    들어간 키워드만 남긴다.
const GENERIC = new Set(['축제', '페스티벌', '페스타', '문화제', '축전', '야행', '여행', '대전',
  '엑스포', '박람회', '마켓', '영화제', '콘서트', '공연', '행사', '대축제', '문화축제', '가을',
  '봄', '여름', '겨울', '꽃축제', '미디어아트', '위크', '주간', '제', '전', '회', 'FESTA', '2026']);

// 제목에서 온 «이 축제만의 말». 지역명(시군구)은 여기 넣지 않는다 —
// 넣었더니 「홍성맛집」·「공주맛집」·「강릉호텔」 같은 «지역 여행어»가 축제 키워드로 둔갑했다.
// 검색량은 크지만 축제를 찾는 사람이 아니고, 경쟁도 완전히 다른 판이다. (2026-08-31 2차 실행에서 발견)
function distinctive(rec) {
  const raw = String(rec.title).replace(/^제?\s*\d+\s*회\s*/, '').replace(/\d{4}/g, ' ').trim();
  const toks = raw.split(/[\s()·,]+/).filter(Boolean)
    .map(t => t.replace(/축제$|페스티벌$|페스타$|문화제$|축전$/, '') || t);
  return [...new Set(toks.filter(t => t.length >= 2 && !GENERIC.has(t)))];
}

function candidates(rec) {
  const raw = String(rec.title).replace(/^제?\s*\d+\s*회\s*/, '').trim();
  const toks = raw.split(/\s+/).filter(Boolean);
  const sgg = String(rec.sigungu || '').replace(/(시|군|구)$/, '');
  const out = new Set();
  const push = s => { s = String(s || '').replace(/\s+/g, ''); if (s.length >= 3 && s.length <= 20) out.add(s); };

  push(raw);                                                 // 전체명
  if (toks.length > 1) push(toks[toks.length - 1]);          // 마지막 토큰 (대하축제)
  if (toks.length > 2) push(toks.slice(-2).join(''));        // 뒤 두 토큰
  if (toks.length > 3) push(toks.slice(-3).join(''));
  if (sgg) push(sgg + '축제');                               // 홍성축제 — 지역 일반어(차선책)

  const dis = distinctive(rec);
  const regional = sgg ? sgg + '축제' : null;
  // 고유한 말이 하나도 안 들어간 후보는 버린다 (= 우리가 못 먹는 일반어).
  // 「○○축제」형 지역어만 예외로 남긴다(차선책).
  return [...out].filter(c => c === regional || dis.some(d => c.includes(d))).slice(0, 5);
}
// 이 키워드가 「지역 + 축제」 형태인가 (고유명보다 약한 차선책)
const isRegional = (kw, rec) => {
  const sgg = String(rec.sigungu || '').replace(/(시|군|구)$/, '');
  return !!sgg && kw === sgg + '축제';
};

// ── 네이버 검색광고 API ──────────────────────────────────────────────────
const CFG = JSON.parse(fs.readFileSync(CFG_PATH, 'utf8'));
function sign(ts, method, p) {
  return crypto.createHmac('sha256', CFG.secret_key).update(`${ts}.${method}.${p}`).digest('base64');
}
// ⚠️ 4xx·타임아웃을 「데이터 없음」으로 읽으면 안 된다. 과거에 KOPIS 400을 페이지 끝으로
//    처리해 3구간 481건이 통째로 증발한 적이 있다. 여기서는 상태코드를 그대로 올리고,
//    429(쿼터)는 백오프 재시도하며, 끝내 실패하면 vol=0 이 아니라 err 로 표시한다.
let RATE_HITS = 0;
function callOnce(list) {
  return new Promise((resolve) => {
    const p = '/keywordstool';
    const ts = Date.now().toString();
    const q = 'hintKeywords=' + encodeURIComponent(list.join(',')) + '&showDetail=1';
    const req = https.request({
      host: 'api.searchad.naver.com', path: `${p}?${q}`, method: 'GET',
      headers: {
        'X-Timestamp': ts, 'X-API-KEY': CFG.api_key,
        'X-Customer': String(CFG.customer_id), 'X-Signature': sign(ts, 'GET', p)
      }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode !== 200) return resolve({ status: res.statusCode, list: null });
        try { resolve({ status: 200, list: JSON.parse(d).keywordList || [] }); }
        catch (e) { resolve({ status: -2, list: null }); }
      });
    });
    req.setTimeout(12000, () => { req.destroy(); resolve({ status: -1, list: null }); });
    req.on('error', () => resolve({ status: -3, list: null }));
    req.end();
  });
}
async function keywordTool(list) {
  for (let a = 0; a < 4; a++) {
    const r = await callOnce(list);
    if (r.list) return r.list;
    if (r.status === 429 || r.status === -1) {           // 쿼터 or 타임아웃 → 물러섰다 재시도
      RATE_HITS++;
      await sleep(3000 * (a + 1));
      continue;
    }
    return null;                                          // 그 외 오류는 «모름»으로 올린다
  }
  return null;
}
const num = v => (typeof v === 'string' && v.startsWith('<')) ? 9 : (parseInt(v, 10) || 0);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── 캐시 ─────────────────────────────────────────────────────────────────
// 2026-08-31: 두 번 연속 전량 조회했더니 API 응답이 1초 → 20초로 느려졌다(소프트 스로틀 추정).
// 검색량은 하루 사이에 안 바뀐다. 축제별 결과를 캐시해 두면 재실행이 즉시 끝나고 쿼터도 아낀다.
// 중간에 끊겨도 캐시가 남아 다음 실행이 «이어서» 돈다.
const CACHE_FILE = path.join(DATA, 'naver-kwcache.json');
const CACHE_DAYS = parseInt(arg('--cache-days', '7'), 10);
let CACHE = {};
try { CACHE = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch (e) { CACHE = {}; }
const cacheFresh = k => CACHE[k] && dayDiff(TODAY, CACHE[k].at) <= CACHE_DAYS;
let cacheDirty = 0;
const saveCache = () => { try { fs.writeFileSync(CACHE_FILE, JSON.stringify(CACHE), 'utf8'); cacheDirty = 0; } catch (e) { } };

// ── 실행 ─────────────────────────────────────────────────────────────────
(async () => {
  console.log(`오늘 ${TODAY} · 앞으로 ${DAYS}일 안에 개막하는 축제 ${upcoming.length}건 — 검색량 조회 시작`);
  const rows = [], failed = [];
  let hits = 0;
  for (let i = 0; i < upcoming.length; i++) {
    const rec = upcoming[i];
    const cands = candidates(rec);
    const ckey = String(rec.id || rec.title);
    let vol, hit = false;
    if (cacheFresh(ckey)) { vol = CACHE[ckey].vol; hit = true; }
    else {
      const list = cands.length ? await keywordTool(cands) : [];
      if (list === null) {                                // 조회 실패 — 0으로 적지 않는다
        failed.push(rec.title);
        if (cacheDirty) saveCache();
        await sleep(600);
        continue;
      }
      vol = {};
      for (const r of list) vol[String(r.relKeyword).replace(/\s+/g, '')] = num(r.monthlyPcQcCnt) + num(r.monthlyMobileQcCnt);
      CACHE[ckey] = { at: TODAY, vol };
      if (++cacheDirty >= 5) saveCache();
    }

    const dis = distinctive(rec);
    let best = { kw: cands[0] || String(rec.title).replace(/\s+/g, ''), v: 0 };
    for (const c of cands) if ((vol[c] || 0) > best.v) best = { kw: c, v: vol[c] };

    // 후보에 안 걸렸지만 연관어 쪽이 더 클 수 있다 (예: "봉평메밀꽃축제").
    // 단 «고유한 말»이 들어간 연관어만 인정한다 — 안 그러면 또 일반어로 샌다.
    for (const [k, v] of Object.entries(vol)) {
      if (v <= best.v) continue;
      if (k.length < 4 || GENERIC.has(k)) continue;
      if (dis.some(d => k.includes(d))) best = { kw: k, v };
    }

    const s = ymd(rec.start);
    rows.push({
      title: rec.title, id: String(rec.id || ''), slug: slugById[String(rec.id)] || '',
      start: s, end: ymd(rec.end), sido: rec.sido || '', sigungu: rec.sigungu || '',
      kw: best.kw, vol: best.v, kind: isRegional(best.kw, rec) ? '지역' : '고유',
      dday: dayDiff(s, TODAY),
      publishBy: shift(s, -LEAD), hasOv: !!rec.ov,
      img: String(rec.img || '').replace('http://', 'https://')
    });
    if ((i + 1) % 10 === 0) console.log(`  ${i + 1}/${upcoming.length}  캐시적중 ${hits}  실패 ${failed.length}${RATE_HITS ? `  쿼터대기 ${RATE_HITS}` : ''}`);
    if (hit) hits++; else await sleep(600);
  }
  saveCache();

  // 고유명 키워드를 지역 일반어보다 먼저 둔다 (같은 검색량이면 이길 확률이 다르다)
  const keep = rows.filter(r => r.vol >= MIN)
    .sort((a, b) => (a.kind === b.kind ? b.vol - a.vol : (a.kind === '고유' ? -1 : 1)));
  fs.writeFileSync(path.join(DATA, 'naver-queue.json'), JSON.stringify(keep, null, 1), 'utf8');

  const late = r => dayDiff(r.publishBy, TODAY) <= 0;
  const L = [];
  L.push(`# 네이버 발행 큐 — ${TODAY.slice(0, 4)}-${TODAY.slice(4, 6)}-${TODAY.slice(6, 8)} 생성`);
  L.push('');
  L.push('`node naver-queue.js` 자동 생성. 검색량은 **네이버 검색광고 API 실측**(월간 PC+모바일).');
  L.push(`조건: 앞으로 ${DAYS}일 안 개막 · 월 ${MIN.toLocaleString()}회 이상 · 발행 권장일 = 개막 ${LEAD}일 전`);
  L.push('');
  L.push('> 「유형」 **고유**=그 축제만의 이름(먹을 수 있는 자리) · **지역**=「○○축제」 형태의 지역 일반어(차선책).');
  L.push('> 일반어(「축제」·「페스티벌」)는 네이버에 웹사이트 자리가 없어 후보에서 제외한다.');
  L.push('');
  L.push('| 순 | 축제 | 검색어 | 유형 | 월 검색량 | 개막 | D- | 발행 권장 | 상태 | 상세 |');
  L.push('|---:|---|---|---|---:|---|---:|---|---|---|');
  keep.forEach((r, i) => {
    const st = late(r) ? '🔴 지금' : '🟢 대기';
    L.push(`| ${i + 1} | ${r.title} | ${r.kw} | ${r.kind} | ${r.vol.toLocaleString()} | ${fmt(r.start)} | ${r.dday} | ${fmt(r.publishBy)} | ${st} | ${r.slug ? '있음' : '**없음**'} |`);
  });
  L.push('');
  L.push(`조회 ${rows.length}건 중 ${keep.length}건 통과 (하한 ${MIN}). 다음: \`node naver-brief.js <slug 또는 축제명>\``);
  if (failed.length) {
    L.push('');
    L.push(`⚠️ **검색량 조회 실패 ${failed.length}건 — 「검색량 0」이 아니라 「모름」이다.** 다시 돌릴 것: ${failed.slice(0, 10).join(' · ')}${failed.length > 10 ? ' …' : ''}`);
  }
  const dropped = rows.filter(r => r.vol < MIN).sort((a, b) => b.vol - a.vol).slice(0, 15);
  if (dropped.length) {
    L.push('');
    L.push('<details><summary>하한 미달 (상위 15)</summary>');
    L.push('');
    dropped.forEach(r => L.push(`- ${r.title} — ${r.kw} ${r.vol.toLocaleString()}`));
    L.push('</details>');
  }
  fs.writeFileSync(path.join(__dirname, 'naver-queue.md'), L.join('\n'), 'utf8');
  console.log(`\n✓ naver-queue.md · data/naver-queue.json 생성 — 통과 ${keep.length}건 / 지금 써야 할 것 ${keep.filter(late).length}건`);
  keep.filter(late).slice(0, 6).forEach(r => console.log(`   🔴 ${r.title} (${r.kw} ${r.vol.toLocaleString()}/월, 개막 ${fmt(r.start)})`));
})();
