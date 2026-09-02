// 🧹 외국어 장소의 한글주소 «표기»를 통일한다 — 붙여넣어서 안 나오는 주소를 없앤다.
//
// 왜 (2026-09-02, 교차검증에서 나옴)
//   일문 3,257건을 역지오코딩으로 채웠는데, 그중 **328건이 「전남광주통합특별시 …」**로 나왔다.
//   NCP 가 통합 행정구역의 «새 공식명»을 그대로 준 것이다. 그런데 —
//   ⭐ 우리 한국어 데이터(관광공사)는 전부 「광주 서구」·「전남 신안군」으로 쓴다.
//     외국인이 붙여넣을 곳은 네이버·카카오 지도이고, 거기 색인된 표기는 후자다.
//     낯선 표기를 주면 «검색이 안 되는 주소»를 준 셈이 된다 — 지도를 붙인 목적과 정반대다.
//   ⚠️ NCP Geocoding(주소→좌표)으로 실제로 검색되는지 확인하려 했으나 **403(미신청 상품)** 이라
//      확인하지 못했다. 확인 못 한 채로 낯선 표기를 남겨 두지 않는다 — 아는 표기를 쓴다.
//
//   같은 김에 「전남」/「전라남도」처럼 흔들리는 표기도 공식 전체명으로 통일한다.
//
// ⚠️ 「전남광주통합」을 가르는 기준은 주소 글자가 아니라 **signguCd** 다.
//    광주 5개 자치구 = {210,240,270,300,330} · 나머지는 전남. (region.js 와 같은 규칙)
//
// 실행: node fix-addr-ko.js places_ja.json [--write]
const fs = require('fs'), path = require('path');
const D = f => path.join(__dirname, 'data', f);

const FULL = {
  '서울': '서울특별시', '부산': '부산광역시', '대구': '대구광역시', '인천': '인천광역시',
  '광주': '광주광역시', '광주광역사': '광주광역시', '대전': '대전광역시', '울산': '울산광역시',
  '세종': '세종특별자치시', '세종시': '세종특별자치시', '경기': '경기도', '강원': '강원특별자치도',
  '강원도': '강원특별자치도', '충북': '충청북도', '충남': '충청남도',
  '전북': '전북특별자치도', '전라북도': '전북특별자치도', '전남': '전라남도',
  '경북': '경상북도', '경남': '경상남도', '제주': '제주특별자치도', '제주도': '제주특별자치도'
};
const GWANGJU_GU = new Set(['210', '240', '270', '300', '330']);

function fixOne(addr, signguCd) {
  let s = String(addr || '').trim();
  if (!s) return s;
  const p = s.split(/\s+/);
  let head = p[0];

  if (/^전남광주통합/.test(head)) {
    head = GWANGJU_GU.has(String(signguCd)) ? '광주광역시' : '전라남도';
  } else if (FULL[head]) {
    head = FULL[head];
  }
  p[0] = head;
  return p.join(' ');
}

function run(file, write) {
  const rows = JSON.parse(fs.readFileSync(D(file), 'utf8'));
  let merged = 0, normed = 0, tagged = 0;
  const ex = [];
  for (const r of rows) {
    if (!r.addrKo) continue;
    if (!r.addrSrc) { r.addrSrc = 'revgeo'; tagged++; }     // 출처를 남긴다(어디서 온 주소인지 나중에 판단할 수 있게)
    const before = r.addrKo;
    const after = fixOne(before, r.signguCd);
    if (after !== before) {
      if (/^전남광주통합/.test(before)) merged++; else normed++;
      if (ex.length < 6) ex.push(`${before}  →  ${after}`);
      if (write) r.addrKo = after;
    }
  }
  console.log(`${file} ${rows.length}건 · addrKo 보유 ${rows.filter(r => r.addrKo).length}`);
  console.log(`  전남광주통합 → 광주/전남 갈라 씀   ${merged}`);
  console.log(`  시·도 표기 통일 (전남→전라남도 등)  ${normed}`);
  console.log(`  출처 표시 없던 것 revgeo 로 표시     ${tagged}`);
  ex.forEach(t => console.log('    ', t));
  if (write) {
    fs.writeFileSync(D(file), JSON.stringify(rows), 'utf8');
    const pre = {};
    rows.forEach(r => { if (r.addrKo) { const k = r.addrKo.split(/\s+/)[0]; pre[k] = (pre[k] || 0) + 1; } });
    const odd = Object.keys(pre).filter(k => !Object.values(FULL).includes(k));
    console.log(`✓ 저장 — 시·도 표기 ${Object.keys(pre).length}종` + (odd.length ? ` · ⚠️ 규격 밖 ${odd.join(', ')}` : ' · 전부 공식 전체명'));
  } else console.log('  (재보기만 함 — 반영하려면 --write)');
}

run(process.argv[2] || 'places_ja.json', process.argv.includes('--write'));
