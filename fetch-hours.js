// 영업시간·휴무일 보강 — 음식점·카페·숙박의 detailIntro를 붙인다 (재개 가능)
// ⚠️ 함정: detailIntro를 동시 10건으로 때리면 data.go.kr이 조용히 거절한다(에러가 JSON이 아니라 XML로 온다).
//    2026-08-09 실측 — 동시10 → 성공률 1%, 동시4+간격120ms → 정상. 실패 사유를 한 번은 반드시 찍는다.
// ⚠️ 부분 저장(SAVE_EVERY)을 하므로 중간에 끊겨도 다시 실행하면 이어서 받는다.
const fs = require('fs'), path = require('path'), https = require('https');
const readKey = f => { try { return fs.readFileSync(path.join(__dirname, f), 'utf8').trim(); } catch (e) { return ''; } };
const KEY = readKey('tourapi.key'), TWKEY = readKey('tourapi-tw.key') || KEY;

const SVC = { ko: 'KorService2', en: 'EngService2', ja: 'JpnService2', zh: 'ChsService2', tw: 'ChtService2' };
const CT = { food: { ko: 39, x: 82 }, stay: { ko: 32, x: 80 } };
const CONC = 4, GAP = 120, SAVE_EVERY = 400;

// 무엇을 어떤 필드로 뽑을지
const PICK = {
  food: d => ({ open: cl(d.opentimefood), rest: cl(d.restdatefood), menu: cl(d.firstmenu).slice(0, 60), park: cl(d.parkingfood) }),
  stay: d => ({ ci: cl(d.checkintime), co: cl(d.checkouttime), park: cl(d.parkinglodging), rooms: cl(d.roomcount) })
};

const cl = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim();
const sleep = ms => new Promise(r => setTimeout(r, ms));
function get(u) {
  return new Promise(res => {
    const req = https.get(u, { headers: { 'User-Agent': 'chukjemoa' }, timeout: 15000 }, r => {
      r.setEncoding('utf8');           // ⚠️ 없으면 청크 경계에서 한글이 깨진다
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
    });
    req.on('error', e => res('__ERR__' + e.message));
    req.on('timeout', () => { req.destroy(); res('__ERR__timeout'); });
  });
}

let shownErr = 0;
async function intro(base, key, ct, cid) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const u = `${base}/detailIntro2?serviceKey=${key}&MobileOS=ETC&MobileApp=chukjemoa&_type=json&numOfRows=1&pageNo=1&contentId=${cid}&contentTypeId=${ct}`;
    const t = await get(u);
    if (!t.startsWith('__ERR__')) {
      try {
        const j = JSON.parse(t);
        const it = j.response && j.response.body && j.response.body.items;
        const d = it && it.item ? (Array.isArray(it.item) ? it.item[0] : it.item) : null;
        if (d) return d;
        return {};                                   // 정상 응답인데 상세가 없는 것 — 재시도 무의미
      } catch (e) { /* XML 에러 응답 → 재시도 */ }
    }
    if (shownErr < 3) { shownErr++; console.log('\n  [응답이상]', t.replace(/\s+/g, ' ').slice(0, 160)); }
    await sleep(600 * (attempt + 1));
  }
  return null;
}

async function enrich(kind, lang) {
  const file = kind === 'stay' ? `stays_${lang}.json` : (kind === 'cafe' ? `cafes_${lang}.json` : `restaurants_${lang}.json`);
  const fpath = path.join(__dirname, 'data', file);
  if (!fs.existsSync(fpath)) { console.log(`- ${file} 없음, 건너뜀`); return; }
  const arr = JSON.parse(fs.readFileSync(fpath, 'utf8'));
  const group = kind === 'stay' ? 'stay' : 'food';
  const ct = lang === 'ko' ? CT[group].ko : CT[group].x;
  const base = `https://apis.data.go.kr/B551011/${SVC[lang]}`;
  const key = lang === 'tw' ? TWKEY : KEY;

  const need = arr.filter(m => !m._i);
  if (!need.length) { console.log(`- ${file} 이미 완료(${arr.length}건)`); return; }
  process.stdout.write(`- ${file} ${need.length}/${arr.length} 남음 `);

  let done = 0;
  for (let i = 0; i < need.length; i += CONC) {
    const ch = need.slice(i, i + CONC);
    const ds = await Promise.all(ch.map(m => intro(base, key, ct, m.id)));
    ds.forEach((d, k) => {
      if (d === null) return;                        // 진짜 실패 → _i 안 찍어서 다음 실행에 재시도
      Object.assign(ch[k], PICK[group](d));
      ch[k]._i = 1;
      Object.keys(ch[k]).forEach(f => { if (ch[k][f] === '' || ch[k][f] == null) delete ch[k][f]; });
    });
    done += ch.length;
    await sleep(GAP);
    if (done % SAVE_EVERY < CONC) { fs.writeFileSync(fpath, JSON.stringify(arr)); process.stdout.write('.'); }
  }
  fs.writeFileSync(fpath, JSON.stringify(arr));
  const has = f => arr.filter(m => m[f]).length;
  const pct = n => `${n}(${(n / arr.length * 100).toFixed(0)}%)`;
  console.log(group === 'food'
    ? `\n  ${file}: 영업시간 ${pct(has('open'))} · 휴무일 ${pct(has('rest'))} · 대표메뉴 ${pct(has('menu'))} · 주차 ${pct(has('park'))}`
    : `\n  ${file}: 체크인 ${pct(has('ci'))} · 체크아웃 ${pct(has('co'))} · 주차 ${pct(has('park'))} · 객실수 ${pct(has('rooms'))}`);
}

(async () => {
  const only = process.argv.slice(2);               // 예: node fetch-hours.js food:ko
  const jobs = [];
  for (const kind of ['food', 'cafe', 'stay'])
    for (const lang of ['ko', 'en', 'ja', 'zh', 'tw'])
      jobs.push([kind, lang]);
  for (const [kind, lang] of jobs) {
    if (only.length && !only.includes(`${kind}:${lang}`) && !only.includes(kind) && !only.includes(lang)) continue;
    try { await enrich(kind, lang); } catch (e) { console.error(kind, lang, 'FAIL', e.message); }
  }
})();
