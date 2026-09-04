// 🍊 비짓제주 오픈API 수집기 — data/visitjeju.json
//
// 무엇을 가져오는가 (2026-09-04 5,985건 전수 조사 결과)
//   ⭐ **설명(introduction)은 안 쓴다.** 평균 25~47자로 우리 게이트(120자)에 거의 다 미달이다.
//      (전체 검색에서 18%가 120자↑로 보였던 건 «여행 기사»가 섞여서다 — 장소 데이터는 전부 짧다.)
//   ⭐ **진짜 값어치는 태그와 사진이다.**
//      `alltag` 에 실용 축이 구조화돼 있다: `이색체험, 실외, 중, 2~3시간` · `족욕스파, 공항근처, 카드결제`
//      → **실내/실외 · 소요시간 · 난이도 · 공항근처.** 사진은 99~100%.
//      우리는 이미 날씨를 붙였으니 **「비 와도 되는 제주」**를 만들 수 있다. 경쟁사가 못 하는 조합이다.
//
//   담는 분류: c1 관광지(1,335) · c5 축제/행사(852) 뿐이다.
//   ❌ c2 숙박 · c3 쇼핑 · c4 음식점은 우리 각도가 아니고, 실내/실외 태그도 의미가 없다(다 실내다).
//   ⚠️ c5 축제 852건에는 **날짜 필드가 없다** — 「지금 하는 축제」로 쓰면 안 된다. 장소 목록까지다.
//
// 🔴 이 API 는 **연속 호출에 매우 민감하다.** 0.3초 간격이면 전부 실패하고 8초 간격이면 전부 성공한다.
//    앞서 「분류코드가 없나 보다」로 잘못 읽었다 — 실패 «이유»(응답 본문)를 안 보고 재시도만 한 탓이다.
//
// 실행: node fetch-visitjeju.js
const fs = require('fs'), path = require('path'), https = require('https');
const KEY = (() => { try { return fs.readFileSync(path.join(__dirname, 'visitjeju.key'), 'utf8').trim(); } catch (e) { return ''; } })();
if (!KEY) { console.log('🔴 visitjeju.key 가 없습니다'); process.exit(1); }
const OUT = path.join(__dirname, 'data', 'visitjeju.json');
const GAP = 6000;          // 쪽 사이 간격(ms) — 이보다 짧으면 무더기로 실패한다
const RETRY_WAIT = 12000;  // 실패 시 더 길게 쉰다
const sleep = ms => new Promise(r => setTimeout(r, ms));
const KST = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

const get = u => new Promise(res => {
  https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0 chukjemoa/1.0 (+https://chukjemoa.co.kr)', 'Accept': 'application/json' }, timeout: 30000 },
    r => { r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res({ s: r.statusCode, d })); })
    .on('error', e => res({ s: 0, d: e.message })).on('timeout', function () { this.destroy(new Error('timeout')); });
});

async function page(cat, p, tries = 5) {
  for (let i = 1; i <= tries; i++) {
    const r = await get(`https://api.visitjeju.net/vsjApi/contents/searchList?apiKey=${KEY}&locale=kr&category=${cat}&page=${p}`);
    if (r.s === 200) { try { const j = JSON.parse(r.d); if (String(j.result) === '200') return j; } catch (e) { } }
    await sleep(RETRY_WAIT);
  }
  return null;
}

// 태그를 «축»으로 쪼갠다 — 실내/실외·소요시간이 문자열 안에 섞여 있다.
const INDOOR = /실내/, OUTDOOR = /실외/;
const TIME = /(\d+\s*시간\s*이상|\d+~\d+시간|\d+시간|\d+~\d+분|\d+분)/;
function axes(tagStr) {
  const s = String(tagStr || '');
  const parts = s.split(/[,·]/).map(x => x.trim()).filter(Boolean);
  const t = (s.match(TIME) || [])[1] || '';
  return {
    indoor: INDOOR.test(s) ? true : (OUTDOOR.test(s) ? false : null),   // ⚠️ 셋째 값 «모름»을 없애지 않는다
    hours: t,
    airport: /공항근처/.test(s),
    tags: parts.filter(x => !/^(실내|실외|상|중|하)$/.test(x) && !TIME.test(x)).slice(0, 8)
  };
}

(async () => {
  const CATS = [['c1', '관광지'], ['c5', '축제·행사']];
  const rows = []; let fail = 0;
  for (const [cd, label] of CATS) {
    const first = await page(cd, 1);
    if (!first) { console.log(`🔴 ${label}(${cd}) 1쪽 실패 — 건너뜁니다`); fail++; continue; }
    const total = first.pageCount || 1;
    console.log(`${label}(${cd}) 총 ${first.totalCount}건 · ${total}쪽`);
    const eat = j => {
      for (const o of (j.items || [])) {
        const a = axes(o.alltag || o.tag);
        const img = (((o.repPhoto || {}).photoid) || {}).imgpath || '';
        rows.push({
          id: o.contentsid, cat: cd, catLabel: (o.contentscd || {}).label || label,
          title: String(o.title || '').trim(),
          region: (o.region2cd || {}).label || '',
          addr: String(o.roadaddress || o.address || '').trim(),
          x: Number(o.longitude) || null, y: Number(o.latitude) || null,
          tel: String(o.phoneno || '').replace(/^\*$/, ''),
          img: img ? String(img).replace(/^http:/, 'https:') : '',
          // 설명은 짧아서 «카드 본문»으로는 못 쓰지만 한 줄 부제로는 쓸 만하다
          sub: String(o.introduction || '').trim().slice(0, 90),
          indoor: a.indoor, hours: a.hours, airport: a.airport, tags: a.tags
        });
      }
    };
    eat(first);
    for (let p = 2; p <= total; p++) {
      await sleep(GAP);
      const j = await page(cd, p);
      if (!j) { console.log(`  🔴 ${cd} ${p}쪽 실패`); fail++; continue; }
      eat(j);
      if (p % 5 === 0) console.log(`  ${p}/${total}쪽 (누적 ${rows.length})`);
    }
    await sleep(GAP);
  }

  // 이름 중복 제거 — 사진·태그가 더 많은 쪽을 남긴다
  const uniq = new Map();
  for (const o of rows) {
    const k = o.title.replace(/\s/g, '');
    const prev = uniq.get(k);
    const score = (o.img ? 2 : 0) + o.tags.length + (o.indoor !== null ? 1 : 0);
    if (!prev || prev._s < score) uniq.set(k, { ...o, _s: score });
  }
  const out = [...uniq.values()].map(o => { delete o._s; return o; });

  fs.writeFileSync(OUT, JSON.stringify({
    generated: KST(), source: '비짓제주 관광정보 오픈API(제주관광공사)',
    note: '설명(introduction)은 평균 25~47자로 짧아 본문으로 쓰지 않는다. 태그·사진·좌표가 목적이다. 축제(c5)에는 날짜 필드가 없다.',
    rows: out
  }, null, 1), 'utf8');

  const ind = out.filter(o => o.indoor === true).length, outd = out.filter(o => o.indoor === false).length;
  console.log(`\n→ data/visitjeju.json ${out.length}곳 (${(fs.statSync(OUT).size / 1024).toFixed(0)}KB) · 실패 ${fail}쪽`);
  console.log(`   사진 ${out.filter(o => o.img).length} · 좌표 ${out.filter(o => o.x && o.y).length} · 태그 ${out.filter(o => o.tags.length).length}`);
  console.log(`   ⭐ 실내 ${ind} · 실외 ${outd} · 모름 ${out.length - ind - outd} · 소요시간 있음 ${out.filter(o => o.hours).length} · 공항근처 ${out.filter(o => o.airport).length}`);
  if (ind < 30) console.log('   ⚠️ 실내 표시가 30곳 미만입니다 — 「비 올 때」 페이지는 만들지 않는 게 맞습니다');
})();
