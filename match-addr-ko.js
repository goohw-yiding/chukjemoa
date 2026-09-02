// 🧭 외국어 장소에 «한글 도로명주소»를 붙인다 — 돈 안 쓰는 경로부터.
//
// 왜 (2026-09-02)
//   일문 장소 3,257건은 NCP 역지오코딩으로 채웠다(1,674원). 그런데 영문 작업을 하다 알았다 —
//   ⭐ **외국어 제목에 한글 원제가 들어 있고, 우리 한국어 데이터에는 이미 한글 주소가 있다.**
//   이름으로 이으면 좌표를 다시 사서 뒤집을 필요가 없다. 그리고 이름으로 이은 주소는
//   역지오코딩 결과보다 **낫다** — 그 장소의 «등록된» 주소이지, 좌표 근처의 주소가 아니다.
//
// ⚠️ 함정: 동명이지(同名異地)가 실제로 있다. 「미국마을」이 7.2km 떨어진 곳에 또 있었고,
//    「천진항」은 549km(강원 ↔ 제주) 떨어져 있었다. **이름이 같다고 같은 곳이 아니다.**
//    → 좌표가 양쪽에 다 있으면 **3km 이내**일 때만 채택한다. 좌표가 없으면 이름이 «유일»할 때만.
//
// ⚠️ 좌표 최근접 매칭은 쓰지 않는다. 150m 안에 다른 가게가 있다(「아로마인드 ↔ 한복남 북촌점 86m」).
//    그건 «그 장소의 주소»가 아니라 옆집 주소다. 남는 것은 역지오코딩으로 보낸다(그게 정직하다).
//
// 실행: node match-addr-ko.js places_en.json [--write]
const fs = require('fs'), path = require('path');
const D = f => path.join(__dirname, 'data', f);

const SRC = ['spots_ko.json', 'accessible.json', 'restaurants_ko.json', 'cafes_ko.json',
  'mountains_ko.json', 'markets_api.json', 'cltur_fstvl.json', 'festivals_api.json'];

const H = /[가-힣]/;
// 표기 흔들림을 지운다 — 띄어쓰기·가운뎃점·괄호·기호. ⚠️ 숫자·영문은 남긴다(「365엠씨」 구분).
const norm = s => String(s || '').replace(/[\s·・‧∙\-–—_,.'"“”‘’()（）\[\]<>《》「」]/g, '').toLowerCase();

const R = 6371, rad = d => d * Math.PI / 180;
function km(ax, ay, bx, by) {
  const a = Math.sin(rad(by - ay) / 2) ** 2 + Math.cos(rad(ay)) * Math.cos(rad(by)) * Math.sin(rad(bx - ax) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 한글 주소 첫 토막 → 우리 시·도 표기 (region.js 는 코드용이라 여기선 주소 앞머리만 본다)
const SIDO = [['서울', '서울'], ['부산', '부산'], ['대구', '대구'], ['인천', '인천'], ['광주', '광주'],
['대전', '대전'], ['울산', '울산'], ['세종', '세종'], ['경기', '경기'], ['강원', '강원'],
['충청북', '충북'], ['충북', '충북'], ['충청남', '충남'], ['충남', '충남'],
['전라북', '전북'], ['전북', '전북'], ['전라남', '전남'], ['전남', '전남'],
['경상북', '경북'], ['경북', '경북'], ['경상남', '경남'], ['경남', '경남'], ['제주', '제주']];
function sidoOfAddr(a) {
  const s = String(a || '').trim();
  for (const [k, v] of SIDO) if (s.startsWith(k)) return v;
  return '';
}

function loadKo() {
  const byName = {};
  let n = 0;
  for (const f of SRC) {
    let rows;
    try { rows = JSON.parse(fs.readFileSync(D(f), 'utf8')); } catch (e) { continue; }
    if (!Array.isArray(rows)) continue;
    for (const r of rows) {
      const t = r.title || r.name || '';
      const addr = String(r.addr || '').trim();
      if (!t || !addr || !H.test(t)) continue;
      const k = norm(t);
      if (!k) continue;
      (byName[k] = byName[k] || []).push({ t, addr, x: r.x, y: r.y, src: f.replace('.json', '') });
      n++;
    }
  }
  return { byName, n };
}

function run(file, write) {
  const rows = JSON.parse(fs.readFileSync(D(file), 'utf8'));
  const { byName, n } = loadKo();
  console.log(`한국어 주소 사전 ${n}건 (${Object.keys(byName).length}개 이름) — ${SRC.length}개 파일`);

  const st = { had: 0, hit: 0, far: 0, ambig: 0, noKo: 0, miss: 0 };
  const farEx = [], hitEx = [];
  for (const r of rows) {
    // ⭐ 이름매칭이 역지오코딩보다 «낫다» — 그 장소의 등록된 주소이지 좌표 근처의 주소가 아니다.
    //    그래서 revgeo 로 채워진 것도 이름매칭이 되면 덮어쓴다. 이미 이름매칭인 것만 건너뛴다.
    if (r.addrSrc === 'ko-name') { st.had++; continue; }
    const kn = r.ko || (H.test(r.title) ? r.title : '');
    if (!kn) { st.noKo++; continue; }
    const cands = byName[norm(kn)];
    if (!cands || !cands.length) { st.miss++; continue; }

    if (r.x && r.y) {
      let best = null, bd = 1e9;
      for (const c of cands) { if (!c.x || !c.y) continue; const d = km(+r.x, +r.y, +c.x, +c.y); if (d < bd) { bd = d; best = c; } }
      // ⭐ 3km 게이트가 «정답까지» 버렸다 — 백록담 6.2km · 충주호 6.4km · 백두대간협곡열차 20.2km.
      //    큰 자연물·노선은 양쪽 데이터의 «기준점»이 다를 뿐 같은 곳이다.
      //    반대로 천진항은 강원↔제주 549km 로 진짜 다른 곳이었다.
      //    → 갈림길은 거리가 아니라 **시·도가 같은가**다. 같은 시·도면 30km 까지 받는다.
      if (best && (bd <= 3 || (bd <= 30 && r.sido && sidoOfAddr(best.addr) === r.sido))) {
        if (write) { r.addrKo = best.addr; r.addrOk = true; r.addrSrc = 'ko-name'; }
        st.hit++; if (hitEx.length < 5) hitEx.push(`${r.title} → ${best.addr} (${(bd * 1000).toFixed(0)}m, ${best.src})`);
        continue;
      }
      if (best) { st.far++; if (farEx.length < 10) farEx.push(`${r.title} ↔ ${best.t} · ${bd.toFixed(1)}km · ${sidoOfAddr(best.addr)}↔${r.sido}`); continue; }
    }
    // 좌표가 없다 — 이름이 «유일»할 때만 (주소까지 같으면 중복으로 본다)
    const uniq = [...new Set(cands.map(c => c.addr))];
    if (uniq.length === 1) {
      if (write) { r.addrKo = uniq[0]; r.addrOk = true; r.addrSrc = 'ko-name'; }
      st.hit++;
    } else st.ambig++;
  }

  console.log(`\n${file} ${rows.length}건`);
  console.log(`  ✅ 이름+좌표3km 로 채움   ${st.hit}`);
  console.log(`  · 이미 채워져 있음       ${st.had}`);
  console.log(`  ✗ 한국어 사전에 없음     ${st.miss}`);
  console.log(`  ⚠️ 이름 같은데 3km 초과   ${st.far}  (동명이지 — 버린다)`);
  console.log(`  ⚠️ 좌표 없고 주소 여러개  ${st.ambig}`);
  console.log(`  · 한글 원제 없음         ${st.noKo}`);
  const left = rows.filter(r => !r.addrKo).length;
  console.log(`  → 남은 것 ${left}건 = 역지오코딩 대상 (${(left * 0.5).toFixed(0)}원)`);
  console.log('\n  채택 표본:'); hitEx.forEach(t => console.log('    ', t));
  if (farEx.length) { console.log('  버린 표본(동명이지):'); farEx.forEach(t => console.log('    ', t)); }

  if (write) {
    fs.writeFileSync(D(file), JSON.stringify(rows), 'utf8');
    console.log(`\n✓ data/${file} 갱신 — addrKo 보유 ${rows.filter(r => r.addrKo).length}건`);
  } else console.log('\n(재보기만 함 — 반영하려면 --write)');
}

const file = process.argv[2] || 'places_en.json';
run(file, process.argv.includes('--write'));
