// 🎭 부산 문화 4종(콘서트·전시·문화기타장르·뮤지컬) → data/busan_culture.json
//
// ⚠️ **먼저 알아야 할 것 — 이 API는 필드가 얇다.**
//   주는 것: `res_no, title, op_st_dt, op_ed_dt, op_at, place_nm, pay_at` 뿐이다.
//   **설명·좌표·주소·이미지·요금 상세가 없다.** 서울(설명·요금·시간·대상·좌표·이미지 다 있음)과 질이 다르다.
//   → 이것만으로 페이지를 만들면 «목록만 있는 페이지»가 된다. 그건 우리가 경쟁사를 두고 지적한 바로 그것이다.
//   → 그래서 **place_nm(장소명)을 우리 데이터와 이름으로 이어 주소·좌표를 채운다.**
//
// ⭐ 2026-09-04 판단 정정: 「공연장·전시공간 목록 서비스는 검색량이 없으니 신청하지 말라」고 했는데 **틀렸다.**
//    실제 응답을 보니 장소가 «이름»뿐이라, 그 두 데이터셋이 주소·좌표를 메우는 열쇠였다.
//    ⭐ 교훈: **데이터셋은 검색량으로 고르되, «필드»를 먼저 보고 보조 데이터셋이 필요한지 확인할 것.**
//
// ⚠️ 데이터 오염이 있다 — `op_st_dt: "0000-00-00"`, `place_nm: "--선택해주세요--"`(입력폼 기본값).
//    날짜가 이상하거나 장소가 저 값이면 «버린다». 추측해서 채우지 않는다.
// ⚠️ 2020년 것부터 나온다(오래된 순). 전체를 받아야 최신이 나온다.
//
// 실행: node fetch-busan-culture.js
const fs = require('fs'), path = require('path'), https = require('https');
const OUT = path.join(__dirname, 'data', 'busan_culture.json');
let KEY = '';
try { KEY = fs.readFileSync(path.join(__dirname, 'busan.key'), 'utf8').trim(); } catch (e) { }
if (!KEY) { console.log('⛔ busan.key 없음'); process.exit(1); }

const SVC = [
  ['concert', '콘서트', 'BusanCultureConcertService', 'getBusanCultureConcert'],
  ['exhibit', '전시', 'BusanCultureExhibitService', 'getBusanCultureExhibit'],
  ['etc', '문화 기타장르', 'BusanCultureEtcService', 'getBusanCultureEtc'],
  ['musical', '뮤지컬', 'BusanCultureMusicalService', 'getBusanCultureMusical']
];
const PAGE = 1000;
const get = u => new Promise((res, rej) => {
  https.get(u, { headers: { 'User-Agent': 'chukjemoa' }, timeout: 25000 }, r => {
    r.setEncoding('utf8'); let d = ''; r.on('data', c => d += c); r.on('end', () => res({ s: r.statusCode, d }));
  }).on('error', rej).on('timeout', function () { this.destroy(new Error('timeout')); });
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
const ymd = s => { const m = String(s || '').match(/(\d{4})-?(\d{2})-?(\d{2})/); return m ? m[1] + m[2] + m[3] : ''; };
const KST = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

// 「브로드웨이42번가 [부산]」 → 「브로드웨이42번가」 : 목록이 전부 부산이라 꼬리가 중복이다
const tidy = s => clean(s).replace(/\s*\[\s*부산\s*\]\s*$/, '').trim();

function rows(j) {
  const top = j[Object.keys(j)[0]] || {};
  const b = top.body || top;
  let it = b.items || b.item || [];
  if (it && it.item) it = it.item;
  if (!Array.isArray(it)) it = it ? [it] : [];
  return { list: it, total: Number(b.totalCount || top.totalCount || 0) };
}

// ── 장소명 → 주소·좌표 : 우리가 이미 가진 부산 데이터로 잇는다(돈 안 든다)
const norm = s => String(s || '').replace(/[\s()（）·・\-–—_,.'"]/g, '').toLowerCase();
function placeIndex() {
  const idx = new Map();
  const put = (name, addr, x, y, extra) => {
    const k = norm(name);
    if (!k || k.length < 2 || idx.has(k)) return;
    if (!(+x) || !(+y)) return;
    idx.set(k, Object.assign({ addr: clean(addr), x: String(x), y: String(y) }, extra || {}));
  };
  // ⭐ 1순위: 부산 문화공간 601곳(fetch-busan-place.js). 이게 place_nm 을 주소·좌표로 바꾸는 열쇠다.
  //    ⚠️ 「부산시청 전시실」처럼 «장소 안의 방» 이름이 오는 경우가 있어, 앞부분만으로도 한 번 더 걸어 둔다.
  try {
    const bp = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'busan_places.json'), 'utf8'));
    for (const r of (bp.rows || [])) {
      put(r.name, r.addr, r.x, r.y, { tel: r.tel, seat: r.seat, gu: r.gu, url: r.url });
    }
  } catch (e) { console.log('  ⚠️ busan_places.json 없음 — node fetch-busan-place.js 를 먼저 돌리세요'); }
  for (const f of ['spots_ko.json', 'trrsrt.json', 'accessible.json', 'cltur_fstvl.json', 'festivals_api.json']) {
    let d; try { d = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { continue; }
    const a = Array.isArray(d) ? d : (d.rows || []);
    for (const r of a) {
      if (String(r.sido || '') !== '부산') continue;
      put(r.title || r.name, r.addr, r.x, r.y);
      if (r.place) put(r.place, r.addr, r.x, r.y);
    }
  }
  return idx;
}

(async () => {
  const today = ymd(KST());
  const floor = ymd(new Date(Date.parse(KST()) - 30 * 86400000).toISOString().slice(0, 10));
  const idx = placeIndex();
  console.log(`장소 사전 ${idx.size}곳 (부산, 좌표 있는 것만)`);

  const out = [];
  const stat = {};
  for (const [key, label, svc, op] of SVC) {
    let total = 0, got = 0, kept = 0;
    for (let p = 1; p <= 12; p++) {
      const u = `https://apis.data.go.kr/6260000/${svc}/${op}?serviceKey=${KEY}&pageNo=${p}&numOfRows=${PAGE}&resultType=json`;
      let r; try { r = await get(u); } catch (e) { console.log(`  ⚠️ ${label} p${p} ${e.message}`); break; }
      if (r.s !== 200) { console.log(`  ⚠️ ${label} p${p} HTTP ${r.s}`); break; }
      let j; try { j = JSON.parse(r.d); } catch (e) { console.log(`  ⚠️ ${label} p${p} 파싱실패`); break; }
      const { list, total: t } = rows(j);
      total = t || total; got += list.length;
      for (const x of list) {
        const s = ymd(x.op_st_dt), e = ymd(x.op_ed_dt) || s;
        // ⚠️ 「0000-00-00」·빈 날짜는 버린다. 날짜를 모르면 안내할 수 없다.
        if (!/^\d{8}$/.test(s) || s < '20000101') continue;
        if (e < floor) continue;                       // 끝난 지 30일 넘은 것은 안 쓴다
        const place = clean(x.place_nm);
        if (!place || /선택해주세요/.test(place)) continue;   // 입력폼 기본값 오염
        // ⚠️ 「부산시청 전시실」·「소향씨어터 신한카드홀」처럼 «건물명 + 방 이름»이 온다.
        //    정확히 못 찾으면 «앞에서부터 가장 긴 일치»로 한 번 더 찾는다(추측이 아니라 포함관계다).
        let hit = idx.get(norm(place));
        if (!hit) {
          const np = norm(place);
          let best = null, bl = 0;
          for (const [k, v] of idx) {
            if (k.length >= 3 && k.length > bl && np.startsWith(k)) { best = v; bl = k.length; }
          }
          hit = best;
        }
        out.push({
          id: String(x.res_no), kind: key,
          title: tidy(x.title), place,
          start: s, end: e,
          pay: String(x.pay_at || '') === 'Y',          // Y=유료
          addr: hit ? hit.addr : '', x: hit ? hit.x : '', y: hit ? hit.y : ''
        });
        kept++;
      }
      if (got >= total || list.length < PAGE) break;
      await sleep(150);
    }
    stat[label] = { total, kept };
    console.log(`  ${label.padEnd(8)} 전체 ${String(total).padStart(5)} · 남긴 것(끝난 지 30일 이내~앞으로) ${kept}`);
    await sleep(200);
  }

  if (!out.length) { console.log('⛔ 0건 — 기존 파일을 덮어쓰지 않는다'); process.exit(1); }
  // 중복 제거 — 같은 제목·장소·시작일
  const seen = new Set(), uniq = [];
  for (const r of out) { const k = r.title + '|' + r.place + '|' + r.start; if (seen.has(k)) continue; seen.add(k); uniq.push(r); }

  fs.writeFileSync(OUT, JSON.stringify({
    generated: KST(), source: '부산광역시 문화포털(공공데이터포털) — 콘서트·전시·문화기타장르·뮤지컬',
    stat, rows: uniq
  }), 'utf8');

  const live = uniq.filter(r => r.end >= today);
  console.log(`✓ data/busan_culture.json — ${uniq.length}건(중복 제거 전 ${out.length}) · 진행·예정 ${live.length}건`);
  ['concert', 'exhibit', 'etc', 'musical'].forEach(k => {
    const a = live.filter(r => r.kind === k);
    console.log(`  ${k.padEnd(8)} 진행·예정 ${String(a.length).padStart(4)} · 좌표 붙은 것 ${a.filter(r => r.x).length}`);
  });
  console.log(`  ⚠️ 좌표 못 붙인 것 ${live.filter(r => !r.x).length}건 — 장소명이 우리 데이터에 없다`);
  const noPlace = {};
  live.filter(r => !r.x).forEach(r => { noPlace[r.place] = (noPlace[r.place] || 0) + 1; });
  console.log('  못 찾은 장소 상위:', Object.entries(noPlace).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([k, v]) => `${k}(${v})`).join(' · '));
})();
