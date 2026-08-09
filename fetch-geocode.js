// 걷기길 좌표 보강 — 카카오 로컬 API로 stret.json / trails.json 에 x,y 를 붙인다 (재개 가능)
// ⚠️ 2026-08-09 발견: 전국길관광정보표준데이터(stret 1,325)와 두루누비(trails 262)에는 좌표가 아예 없다.
//    코스·일정 제안 기능은 "어디에 있는지"가 없으면 배치를 못 하므로 이 단계가 선행되어야 한다.
// 순서: ① 도로명/지번 주소 검색 → ② 키워드 검색(시군구 + 길 이름) → ③ 키워드 검색(시군구 + 시작지점)
// 카카오 로컬 API 무료 한도 10만건/일이라 1,600건은 여유롭다.
const fs = require('fs'), path = require('path'), https = require('https');
const KEYS = JSON.parse(fs.readFileSync(path.join(__dirname, 'apikeys.json'), 'utf8'));
const KAKAO = KEYS.kakao_rest;
const GAP = 60;                                    // 카카오 초당 제한 여유

const sleep = ms => new Promise(r => setTimeout(r, ms));
function kakao(p) {
  return new Promise(res => {
    const req = https.get({ host: 'dapi.kakao.com', path: p, headers: { Authorization: 'KakaoAK ' + KAKAO } }, r => {
      r.setEncoding('utf8');                       // ⚠️ 한글 깨짐 방지
      let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { res(null); } });
    });
    req.on('error', () => res(null));
    req.setTimeout(10000, () => { req.destroy(); res(null); });
  });
}
const pick = j => {
  const d = j && j.documents && j.documents[0];
  if (!d) return null;
  const x = Number(d.x), y = Number(d.y);
  if (!x || !y) return null;
  // 대한민국 밖으로 튀는 좌표는 버린다
  if (x < 124 || x > 132 || y < 33 || y > 39) return null;
  return { x: +x.toFixed(6), y: +y.toFixed(6) };
};

async function geo(addr, sido, sigungu, name, begin) {
  if (addr) {
    const r = pick(await kakao('/v2/local/search/address.json?query=' + encodeURIComponent(addr)));
    if (r) return { ...r, src: 'addr' };
    await sleep(GAP);
  }
  const area = [sido, sigungu].filter(Boolean).join(' ');
  for (const [q, src] of [[`${area} ${name}`, 'kw-name'], [begin ? `${area} ${begin}` : '', 'kw-begin'], [addr ? addr : '', 'kw-addr']]) {
    if (!q.trim()) continue;
    const r = pick(await kakao('/v2/local/search/keyword.json?query=' + encodeURIComponent(q) + '&size=1'));
    if (r) return { ...r, src };
    await sleep(GAP);
  }
  return null;
}

async function run(file, mk) {
  const fpath = path.join(__dirname, 'data', file);
  if (!fs.existsSync(fpath)) { console.log('- 없음', file); return; }
  const arr = JSON.parse(fs.readFileSync(fpath, 'utf8'));
  const need = arr.filter(o => !o.x && !o._g);
  console.log(`- ${file}: ${need.length}/${arr.length} 좌표 필요`);
  let ok = 0;
  for (let i = 0; i < need.length; i++) {
    const o = need[i];
    const a = mk(o);
    const r = await geo(a.addr, a.sido, a.sigungu, a.name, a.begin);
    if (r) { o.x = r.x; o.y = r.y; o.gsrc = r.src; ok++; } else { o._g = 0; }  // _g=0 → 다음 실행에 재시도 안 함
    await sleep(GAP);
    if (i % 100 === 0 || i === need.length - 1) {
      fs.writeFileSync(fpath, JSON.stringify(arr));
      process.stdout.write(`\r  ${i + 1}/${need.length} 성공 ${ok}`);
    }
  }
  fs.writeFileSync(fpath, JSON.stringify(arr));
  const has = arr.filter(o => o.x).length;
  const by = {}; arr.forEach(o => { if (o.gsrc) by[o.gsrc] = (by[o.gsrc] || 0) + 1; });
  console.log(`\n  ${file} 좌표 ${has}/${arr.length} (${(has / arr.length * 100).toFixed(0)}%) · 경로별 ${JSON.stringify(by)}`);
}

(async () => {
  await run('stret.json', o => ({ addr: o.addr, sido: o.sido, sigungu: o.sigungu, name: o.name, begin: o.begin }));
  // trails.json 은 주소가 없고 'sigun'(예: "강원 삼척시")만 있다 → 키워드 검색으로만 찾는다
  await run('trails.json', o => ({ addr: '', sido: o.sido, sigungu: String(o.sigun || '').split(' ').pop(), name: o.name, begin: '' }));
})();
