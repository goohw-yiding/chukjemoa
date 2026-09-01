// 전국관광지정보표준데이터(행정안전부) → data/trrsrt.json
//
// 왜 (2026-09-01)
//   처음엔 「TourAPI 관광지와 중복이라 안 쓴다」고 넘겼는데 **재보지 않은 판단이었고 틀렸다.**
//   실측: 852건 중 우리 spots_ko(12,649곳)와 이름이 겹치는 건 244건(29%)뿐 — **608건이 고유**다.
//   게다가 우리에게 «아예 없던» 필드가 온다:
//     · 주차 «대수» 755건   (우리는 「주차 있음/없음」만 있었다)
//     · 수용인원 832건
//     · 편익시설 844건
//   축제 페이지 FAQ의 「주차는 어떻게 하나요?」에 지금까지는 「축제장 안내를 따르세요」밖에 못 썼다.
//
// 쓰는 곳: 축제 상세의 「근처 가볼 곳」 보강 (새 페이지를 만들지 않는다).
// 실행: node fetch-trrsrt.js   (키: cltur-fstvl.key)
// ⚠️ 응답이 { header, body } 다. TourAPI 처럼 response 로 감싸지 않는다.
const fs = require('fs'), path = require('path'), https = require('https');
const KEY = fs.readFileSync(path.join(__dirname, 'cltur-fstvl.key'), 'utf8').trim();
const BASE = 'https://api.data.go.kr/openapi/tn_pubr_public_trrsrt_api';
const { parseAddr, validCoord } = require('./region');   // ⭐ 자체 파서 금지 — region.js 를 쓴다

const get = u => new Promise((res, rej) => {
  https.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
    r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
  }).on('error', rej);
});
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
const plus = s => clean(s).split('+').map(x => x.trim()).filter(x => x && x !== '없음');
const num = v => { const n = Number(String(v || '').replace(/[^0-9]/g, '')); return n > 0 ? n : 0; };

async function page(no, rows) {
  const j = JSON.parse(await get(`${BASE}?serviceKey=${KEY}&pageNo=${no}&numOfRows=${rows}&type=json`));
  const b = j.body || (j.response && j.response.body);
  if (!b) throw new Error('body 없음');
  let it = b.items && (b.items.item || b.items);
  if (it && !Array.isArray(it)) it = [it];
  return { total: Number(b.totalCount) || 0, items: it || [] };
}

(async () => {
  const first = await page(1, 1);
  console.log('전국관광지정보표준데이터 총', first.total, '건');
  const all = [];
  for (let p = 1; (p - 1) * 500 < first.total && p <= 10; p++) {
    const r = await page(p, 500); all.push(...r.items);
    if (r.items.length < 500) break;
  }
  const seen = new Set(), out = [];
  let noXY = 0;
  for (const r of all) {
    const name = clean(r.trrsrtNm);
    if (!name) continue;
    const addr = clean(r.rdnmadr || r.lnmadr);
    const { sido, sigungu } = parseAddr(addr);
    const k = name.replace(/\s/g, '') + '|' + sido + sigungu;
    if (seen.has(k)) continue;
    seen.add(k);
    const x = clean(r.longitude), y = clean(r.latitude);
    // ⚠️ 좌표는 «쓰기 전에» 거른다 — 축제와 거리를 재는 데 쓰이므로 이상값이 섞이면 엉뚱한 곳이 근처로 뜬다
    const okXY = x && y && validCoord(x, y);
    if (!okXY) noXY++;
    out.push({
      name, sido, sigungu, addr,
      kind: clean(r.trrsrtSe),                 // 관광지/관광단지
      x: okXY ? x : '', y: okXY ? y : '',
      park: num(r.prkplceCo),                  // 주차 «대수» — 우리에게 없던 정보
      cap: num(r.aceptncCo),                   // 수용인원
      fclty: plus(r.cnvnncFclty).slice(0, 6),  // 편익시설
      stay: plus(r.stayngInfo).slice(0, 3),
      intro: clean(r.trrsrtIntrcn).slice(0, 400),
      tel: clean(r.phoneNumber),
      inst: clean(r.institutionNm || r.insttNm),
      ref: clean(r.referenceDate)
    });
  }
  out.sort((a, b) => (a.sido + a.sigungu + a.name).localeCompare(b.sido + b.sigungu + b.name));
  fs.writeFileSync(path.join(__dirname, 'data', 'trrsrt.json'), JSON.stringify(out), 'utf8');
  const bySido = {};
  out.forEach(r => { bySido[r.sido || '(미상)'] = (bySido[r.sido || '(미상)'] || 0) + 1; });
  console.log(`✓ data/trrsrt.json — ${out.length}곳`);
  console.log('  좌표 없음/이상 ' + noXY + '곳 (거리 계산에서 자동 제외)');
  console.log('  주차대수 있음 ' + out.filter(r => r.park).length
    + ' · 수용인원 ' + out.filter(r => r.cap).length
    + ' · 편익시설 ' + out.filter(r => r.fclty.length).length
    + ' · 소개 100자↑ ' + out.filter(r => r.intro.length > 100).length);
  console.log('  시·도:', Object.entries(bySido).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => k + ' ' + v).join(' · '));
})();
