// 새로 붙인 공공 표준데이터가 «실제로 읽을 만한가»를 숫자로 검사한다.
//
// 왜: 2026-09-01에 오일장 149→469, 월별 축제 18→173으로 늘렸다. 건수가 늘었다고 사이트가
//     좋아진 건 아니다. 과거에도 «붙어 있나»가 아니라 «맞는 게 붙어 있나»를 봐야 한다는
//     교훈이 있었다(축제 상세 140개가 전부 같은 상품이던 사고). 그 교훈을 데이터에도 적용한다.
// 사용: node audit-newdata.js   → audit-newdata.md
const fs = require('fs'), path = require('path');
const L = [];
const p = s => L.push(String(s));
const load = f => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { return []; } };
const T = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');
const SIDO_OK = new Set(['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']);
const pct = (a, b) => b ? (100 * a / b).toFixed(0) + '%' : '-';
const flag = (bad, total, limit) => (100 * bad / Math.max(total, 1)) > limit ? ' 🔴' : '';

p('# 새 데이터 품질 점검 — ' + T.slice(0, 4) + '-' + T.slice(4, 6) + '-' + T.slice(6, 8));
p('');
p('`node audit-newdata.js` 자동 생성. **건수가 아니라 「읽을 만한가」를 본다.**');

// ── 1. 오일장(전통시장 표준데이터) ─────────────────────────────
{
  const m = load('markets_std.json');
  p('\n## 1. 오일장 — 전통시장 표준데이터 ' + m.length + '곳');
  const noSido = m.filter(r => !SIDO_OK.has(r.sido));
  const noCity = m.filter(r => !r.city);
  const badDay = m.filter(r => !Array.isArray(r.daysNum) || r.daysNum.length < 2 ||
    r.daysNum.some(d => d < 1 || d > 10) ||
    (r.daysNum.length === 2 && Math.abs(r.daysNum[0] - r.daysNum[1]) !== 5));
  const noSale = m.filter(r => !r.sale);
  const noTel = m.filter(r => !r.tel);
  // ⚠️ 2026-09-01 오탐 정정: 「한국 밖 좌표」로 잡힌 9곳은 실은 **좌표가 빈 값**이었다.
  //    둘은 처방이 다르다 — 밖에 있으면 «틀린 데이터», 없으면 «지도에만 못 찍히는 것»이다.
  const noXY = m.filter(r => !String(r.x).trim() || !String(r.y).trim());
  const badXY = m.filter(r => {
    if (!String(r.x).trim() || !String(r.y).trim()) return false;
    const x = parseFloat(r.x), y = parseFloat(r.y);
    return !(x > 124 && x < 132 && y > 33 && y < 39);
  });
  // 같은 이름이라도 시·도가 다르면 «다른 시장»이다(덕산시장: 경남 산청 / 충남 예산).
  // 이름만 세면 오탐이 난다 — 지역까지 같은 것만 진짜 중복이다.
  const names = {}; m.forEach(r => { const k = r.name.replace(/\s/g, '') + '|' + r.sido + r.city; names[k] = (names[k] || 0) + 1; });
  const dupName = Object.entries(names).filter(([, v]) => v > 1);
  p('| 검사 | 건수 | 비율 |');
  p('|---|---:|---:|');
  p(`| 시·도 판별 실패 | ${noSido.length} | ${pct(noSido.length, m.length)}${flag(noSido.length, m.length, 2)} |`);
  p(`| 시·군·구 없음 | ${noCity.length} | ${pct(noCity.length, m.length)}${flag(noCity.length, m.length, 5)} |`);
  p(`| 장날 끝자리 이상(간격≠5) | ${badDay.length} | ${pct(badDay.length, m.length)}${flag(badDay.length, m.length, 2)} |`);
  p(`| 취급품목 없음 | ${noSale.length} | ${pct(noSale.length, m.length)}${flag(noSale.length, m.length, 20)} |`);
  // 전화번호는 원본에 절반이 비어 있다. 우리가 만들 수 없고, 오일장 표에 전화 칸이 없어
  // 화면에도 안 나온다 → «데이터 한계»이지 «우리 오류»가 아니다. 🔴를 띄우지 않는다.
  p(`| 전화번호 없음(원본 한계·표엔 안 나옴) | ${noTel.length} | ${pct(noTel.length, m.length)} |`);
  p(`| 좌표가 한국 밖(=틀린 값) | ${badXY.length} | ${pct(badXY.length, m.length)}${flag(badXY.length, m.length, 1)} |`);
  p(`| 좌표 없음(=지도에만 안 찍힘) | ${noXY.length} | ${pct(noXY.length, m.length)} |`);
  p(`| 같은 지역·같은 이름 중복 | ${dupName.length} | - |`);
  if (noSido.length) p('\n시·도 실패 표본: ' + noSido.slice(0, 5).map(r => `${r.name}(${r.sido || '빈값'} / ${String(r.addr).slice(0, 18)})`).join(' · '));
  if (badDay.length) p('\n장날 이상 표본: ' + badDay.slice(0, 6).map(r => `${r.name}(${r.daysNum.join(',')})`).join(' · '));
  if (dupName.length) p('\n중복 이름: ' + dupName.slice(0, 10).map(([k, v]) => k + '×' + v).join(' · '));
}

// ── 2. 월별 축제(문화축제 표준데이터) ───────────────────────────
{
  const c = load('cltur_fstvl.json');
  const live = c.filter(r => (r.end || r.start) >= T);
  p('\n## 2. 축제 — 문화축제 표준데이터 ' + c.length + '건 (미종료 ' + live.length + ')');
  const noSido = live.filter(r => !SIDO_OK.has(r.sido));
  const noOv = live.filter(r => !r.ov || r.ov.length < 25);
  const longSpan = live.filter(r => {
    const d = (new Date(r.end.slice(0, 4), +r.end.slice(4, 6) - 1, +r.end.slice(6, 8))
      - new Date(r.start.slice(0, 4), +r.start.slice(4, 6) - 1, +r.start.slice(6, 8))) / 86400000;
    return d > 45;
  });
  const noAddr = live.filter(r => !r.addr && !r.place);
  p('| 검사 | 건수 | 비율 |');
  p('|---|---:|---:|');
  p(`| 시·도 판별 실패 | ${noSido.length} | ${pct(noSido.length, live.length)}${flag(noSido.length, live.length, 3)} |`);
  p(`| 설명 25자 미만(=월별 목록 제외) | ${noOv.length} | ${pct(noOv.length, live.length)} |`);
  p(`| 45일 초과(=상설로 보고 제외) | ${longSpan.length} | ${pct(longSpan.length, live.length)} |`);
  p(`| 장소·주소 둘 다 없음 | ${noAddr.length} | ${pct(noAddr.length, live.length)}${flag(noAddr.length, live.length, 5)} |`);
  if (noSido.length) p('\n시·도 실패 표본: ' + noSido.slice(0, 5).map(r => `${r.title}(${String(r.addr).slice(0, 18) || '주소없음'})`).join(' · '));
}

// ── 3. 시티투어 ────────────────────────────────────────────────
{
  const ct = load('citytour.json');
  p('\n## 3. 시티투어 ' + ct.length + '개 코스');
  const noSpot = ct.filter(r => !r.spots || !r.spots.length);
  const noFee = ct.filter(r => !r.fee || !r.fee.length);
  const noTel = ct.filter(r => !r.tel);
  const noDay = ct.filter(r => !r.days);
  const badSido = ct.filter(r => !SIDO_OK.has(r.sido));
  p('| 검사 | 건수 | 비율 |');
  p('|---|---:|---:|');
  p(`| 경유지 없음 | ${noSpot.length} | ${pct(noSpot.length, ct.length)}${flag(noSpot.length, ct.length, 10)} |`);
  p(`| 요금 없음 | ${noFee.length} | ${pct(noFee.length, ct.length)}${flag(noFee.length, ct.length, 15)} |`);
  p(`| 문의처 없음 | ${noTel.length} | ${pct(noTel.length, ct.length)}${flag(noTel.length, ct.length, 15)} |`);
  p(`| 운행요일 없음 | ${noDay.length} | ${pct(noDay.length, ct.length)}${flag(noDay.length, ct.length, 20)} |`);
  p(`| 시·도 판별 실패 | ${badSido.length} | ${pct(badSido.length, ct.length)}${flag(badSido.length, ct.length, 3)} |`);
  if (badSido.length) p('\n시·도 실패 표본: ' + badSido.slice(0, 5).map(r => `${r.course}(${r.sido || '빈값'})`).join(' · '));
}

// ── 4. 공연 ────────────────────────────────────────────────────
{
  const pf = load('perform.json');
  p('\n## 4. 지자체 공연 ' + pf.length + '건 (미종료만 담김)');
  const noSido = pf.filter(r => !SIDO_OK.has(r.sido));
  const noPlace = pf.filter(r => !r.place);
  const old = pf.filter(r => r.start < '20260101');
  p('| 검사 | 건수 | 비율 |');
  p('|---|---:|---:|');
  p(`| 시·도 판별 실패 | ${noSido.length} | ${pct(noSido.length, pf.length)}${flag(noSido.length, pf.length, 5)} |`);
  p(`| 장소 없음 | ${noPlace.length} | ${pct(noPlace.length, pf.length)}${flag(noPlace.length, pf.length, 10)} |`);
  p(`| 시작일이 올해 이전(장기 상설 의심) | ${old.length} | ${pct(old.length, pf.length)} |`);
  if (old.length) p('\n오래된 시작일 표본: ' + old.slice(0, 5).map(r => `${r.name}(${r.start})`).join(' · '));
}

// ── 5. 실제 페이지가 두꺼워졌나 ────────────────────────────────
{
  p('\n## 5. 페이지가 실제로 두꺼워졌나 (본문 글자 수)');
  const txt = f => { try { return fs.readFileSync(path.join(__dirname, f), 'utf8').replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length; } catch (e) { return 0; } };
  p('| 페이지 | 본문 글자 |');
  p('|---|---:|');
  [['오일장 허브', 'jangteo/index.html'], ['경북 오일장', 'jangteo/gyeongbuk/index.html'],
  ['시티투어', 'citytour/index.html'], ['9월', '2026-09/index.html'],
  ['10월', '2026-10/index.html'], ['11월', '2026-11/index.html'], ['12월', '2026-12/index.html']]
    .forEach(([n, f]) => { const c = txt(f); p(`| ${n} | ${c.toLocaleString()}${c < 3000 ? ' 🔴 얇음' : ''} |`); });
}

const out = L.join('\n');
fs.writeFileSync(path.join(__dirname, 'audit-newdata.md'), out, 'utf8');
console.log(out);
