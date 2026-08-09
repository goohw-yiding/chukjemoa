// 인지도 축 — data/fame.json
//
// ⚠️ 왜 만들었나 (2026-08-09):
//   방문차수 추천에서 전주·안동이 목록에 안 나왔다. 원인은 튜닝이 아니라 '축이 하나 빠진 것'이었다.
//   ① 등록 관광지 수는 사실상 행정 면적이다 — 전주 206km²(75곳) vs 강릉 1,040km²(194곳).
//   ② 성수기 배수 1.02는 "관광객이 없다"가 아니라 "연중 꾸준하다"는 뜻인데 감점으로 쓰고 있었다.
//   → 빠진 축 = "이 도시가 얼마나 알려져 있는가". 그걸 두 가지로 채운다.
//
// A. 위키백과 월평균 조회수 (언어별) = 외국인 인지도의 대리 지표
//    실측: 전주 en 6,440 / 강릉 3,734 / 안동 3,361 / 인제 363 → 우리가 원하던 신호가 정확히 잡힌다.
//    ⚠️ 문서명은 검색으로 추측하지 말고 **ko위키 langlinks**로 정확히 받는다(전주시→Jeonju/全州市/…).
//    ⚠️ 번체(tw)는 별도 위키가 없다. zh.wikipedia 를 공유한다.
//
// B. 국가유산 수 (국가유산청 공개 API, 인증키 불필요) = 역사문화 축
//    ccbaKdcd 11=국보 12=보물 13=사적 15=명승 (국가지정). 시군구명은 ccsiName.
//
// 재실행하면 이미 받은 것은 건너뛴다(resumable).
const fs = require('fs'), path = require('path'), https = require('https');
const http = require('http');

const OUT = path.join(__dirname, 'data', 'fame.json');
const WIKIS = ['en', 'ja', 'zh', 'es'];          // tw 는 zh 를 공유
const UA = 'chukjemoa/1.0 (https://chukjemoa.co.kr; goohw593@gmail.com)';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function get(host, p, secure) {
  return new Promise(res => {
    const mod = secure === false ? http : https;
    const req = mod.get({ host, path: p, headers: { 'User-Agent': UA } }, s => {
      s.setEncoding('utf8');                      // ⚠️ 한글 깨짐 방지
      let d = ''; s.on('data', c => d += c); s.on('end', () => res({ code: s.statusCode, d }));
    });
    req.on('error', e => res({ code: 0, d: e.message }));
    req.setTimeout(15000, () => { req.destroy(); res({ code: 0, d: 'timeout' }); });
  });
}

let F = {};
try { F = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (e) { F = {}; }
const save = () => fs.writeFileSync(OUT, JSON.stringify(F));
const slot = k => (F[k] = F[k] || { wiki: {}, title: {}, her: {} });

// ── 대상 시군구: 방문자 데이터에 나오는 곳 전부 (티어 후보 풀과 동일)
function targets() {
  const v = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'visitors.json'), 'utf8'));
  const set = new Map();
  Object.values((v.seasonByMonth && v.seasonByMonth.months) || {}).forEach(list =>
    (list || []).forEach(r => set.set(r.sido + '|' + r.name, r.name)));
  (v.fgn || []).forEach(r => set.set(r.sido + '|' + r.name, r.name));
  return [...set.entries()];
}

// ── A. 위키백과
async function wiki(pairs) {
  // 1) ko위키 langlinks → 언어별 문서명
  const need = pairs.filter(([k]) => !F[k] || !F[k].title || !F[k].title._done);
  console.log(`[위키] 문서명 ${need.length}/${pairs.length}`);
  for (let i = 0; i < need.length; i += 20) {
    const chunk = need.slice(i, i + 20);
    // 한 번에 20개까지 묶어서 물어볼 수 있다
    const titles = chunk.map(([, n]) => n).join('|');
    const r = await get('ko.wikipedia.org', '/w/api.php?action=query&format=json&redirects=1&prop=langlinks&lllimit=500&titles=' + encodeURIComponent(titles));
    try {
      const j = JSON.parse(r.d);
      const byTitle = {};
      Object.values(j.query.pages || {}).forEach(p => { byTitle[p.title] = p; });
      // 리다이렉트 반영
      const norm = {}; (j.query.normalized || []).forEach(x => norm[x.from] = x.to);
      (j.query.redirects || []).forEach(x => norm[x.from] = x.to);
      chunk.forEach(([k, n]) => {
        const t = byTitle[norm[n] || n];
        const s = slot(k); s.title = { _done: 1 };
        if (t && t.langlinks) t.langlinks.forEach(x => { if (WIKIS.indexOf(x.lang) >= 0) s.title[x.lang] = x['*']; });
      });
    } catch (e) { console.error('  langlinks 파싱 실패', r.d.slice(0, 120)); }
    save(); process.stdout.write(`\r  ${Math.min(i + 20, need.length)}/${need.length}`);
    await sleep(120);
  }
  console.log('');

  // 2) 조회수 (최근 12개월 월평균)
  const end = new Date(Date.now() - 3 * 86400e3), start = new Date(end.getTime() - 365 * 86400e3);
  const ymd = d => d.getUTCFullYear() + ('0' + (d.getUTCMonth() + 1)).slice(-2) + ('0' + d.getUTCDate()).slice(-2) + '00';
  const range = ymd(start) + '/' + ymd(end);

  let todo = [];
  pairs.forEach(([k]) => {
    const s = slot(k);
    WIKIS.forEach(w => { if (s.title[w] && s.wiki[w] === undefined) todo.push([k, w, s.title[w]]); });
  });
  console.log(`[위키] 조회수 ${todo.length}건`);
  for (let i = 0; i < todo.length; i++) {
    const [k, w, t] = todo[i];
    const p = `/api/rest_v1/metrics/pageviews/per-article/${w}.wikipedia/all-access/user/${encodeURIComponent(t.replace(/ /g, '_'))}/monthly/${range}`;
    const r = await get('wikimedia.org', p);
    let avg = 0;
    try { const j = JSON.parse(r.d); const it = j.items || []; if (it.length) avg = Math.round(it.reduce((a, x) => a + x.views, 0) / it.length); } catch (e) { }
    F[k].wiki[w] = avg;
    if (i % 40 === 0) { save(); process.stdout.write(`\r  ${i}/${todo.length}`); }
    await sleep(70);                              // 위키미디어 예의상 초당 ~14회
  }
  save(); console.log(`\r  ${todo.length}/${todo.length} 완료`);
}

// ── B. 국가유산 (국가유산청 공개 API — 인증키 없음)
const KD = { '11': '국보', '12': '보물', '13': '사적', '15': '명승', '16': '천연기념물', '18': '국가민속문화유산' };
async function heritage() {
  const tag = s => { const m = s.match(/<ccsiName>\s*<!\[CDATA\[([^\]]*)\]\]>/); return m ? m[1].trim() : ''; };
  const cnt = {};
  for (const kd of Object.keys(KD)) {
    let page = 1, total = Infinity, got = 0;
    while ((page - 1) * 100 < total) {
      const r = await get('www.khs.go.kr', `/cha/SearchKindOpenapiList.do?ccbaKdcd=${kd}&pageUnit=100&pageIndex=${page}`);
      if (r.code !== 200) break;
      const tm = r.d.match(/<totalCnt>(\d+)/); if (tm) total = +tm[1];
      const items = r.d.split('<item>').slice(1);
      if (!items.length) break;
      items.forEach(it => {
        const sido = (it.match(/<ccbaCtcdNm>\s*<!\[CDATA\[([^\]]*)\]\]>/) || [])[1];
        const sg = tag(it);
        if (!sido || !sg) return;
        const k = sido.trim() + '|' + sg;
        cnt[k] = cnt[k] || {}; cnt[k][KD[kd]] = (cnt[k][KD[kd]] || 0) + 1;
      });
      got += items.length; page++;
      if (page > 60) break;
      await sleep(120);
    }
    console.log(`[국가유산] ${KD[kd]} ${got}건`);
  }
  Object.keys(cnt).forEach(k => { slot(k).her = cnt[k]; });
  save();
}

(async () => {
  const only = process.argv.slice(2);
  const pairs = targets();
  console.log('대상 시군구', pairs.length, '곳');
  if (!only.length || only.indexOf('her') >= 0) await heritage();
  if (!only.length || only.indexOf('wiki') >= 0) await wiki(pairs);

  const ks = Object.keys(F);
  const withW = ks.filter(k => F[k].wiki && F[k].wiki.en);
  const withH = ks.filter(k => F[k].her && Object.keys(F[k].her).length);
  console.log(`✓ fame.json — ${ks.length}곳 · 위키조회수 ${withW.length} · 국가유산 ${withH.length}`);
  ['전북|전주시', '경북|안동시', '강원|강릉시', '경북|경주시', '강원|인제군'].forEach(k => {
    const f = F[k]; if (f) console.log('  ', k, 'wiki', JSON.stringify(f.wiki), '| 유산', JSON.stringify(f.her));
  });
})();
