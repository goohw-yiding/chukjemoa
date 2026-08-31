// 네이버 글쓰기 브리프 — 「글 한 편 쓰는 데 필요한 사실 전부」를 한 파일로 뽑는다.
//
// 왜 만들었나 (2026-08-31)
//   네이버 장문을 쓸 때마다 축제 기간·연락처·근처 맛집 영업시간·사진 URL을 매번 손으로
//   찾아 헤맸다. 그 과정에서 «출처 없는 숫자»가 섞여 들어간 적도 있다(콘서트모아 주차요금).
//   그래서 «우리 데이터에 실제로 있는 것만» 모아 브리프로 만들고, 글은 이 브리프 밖으로
//   나가지 않게 한다. 브리프에 없으면 그 사실은 글에 쓰지 않는다.
//
// 사용법
//   node naver-brief.js hongseongnamdanghang-daehachukje
//   node naver-brief.js 대하축제
//   node naver-brief.js --next            → 발행 큐에서 「지금 써야 할 것」 1순위
//   결과: naver-brief-<slug>.md
//
// ⚠️ 좌표가 없거나 이상한 레코드는 근처 계산에서 뺀다(TourAPI 기본값이 중국 남해인 건이 있었다).

const fs = require('fs'), path = require('path');
const DATA = path.join(__dirname, 'data');
const readJson = f => { try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); } catch (e) { return []; } };
const asList = j => Array.isArray(j) ? j : (j.items || j.list || []);
const https = s => String(s || '').replace(/^http:\/\//, 'https://');

const ymd = s => String(s || '').replace(/-/g, '').slice(0, 8);
const kdate = s => `${+s.slice(0, 4)}년 ${+s.slice(4, 6)}월 ${+s.slice(6, 8)}일`;
const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const dow = s => DOW[new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)).getDay()];

// 한반도 밖 좌표는 버린다
const okXY = (x, y) => {
  x = parseFloat(x); y = parseFloat(y);
  return isFinite(x) && isFinite(y) && x > 124 && x < 132 && y > 33 && y < 39;
};
const dist = (x1, y1, x2, y2) => {
  const R = 6371, r = Math.PI / 180;
  const dLat = (y2 - y1) * r, dLon = (x2 - x1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(y1 * r) * Math.cos(y2 * r) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
};

// ── 대상 축제 찾기 ────────────────────────────────────────────────────────
const fests = asList(readJson('festivals_api.json')).filter(r => r && r.title);
const pages = asList(readJson('festival_pages.json'));
const slugById = {}; for (const p of pages) if (p.id) slugById[String(p.id)] = p.slug;

let q = process.argv[2];
if (!q || q === '--next') {
  const queue = readJson('naver-queue.json');
  const first = Array.isArray(queue) ? queue[0] : null;
  if (!first) { console.error('naver-queue.json 이 없다. 먼저 `node naver-queue.js` 를 돌릴 것.'); process.exit(1); }
  q = first.slug || first.title;
  console.log(`--next → ${first.title} (${first.kw} ${first.vol.toLocaleString()}/월)`);
}

const bySlug = pages.find(p => p.slug === q);
const target = bySlug
  ? fests.find(r => String(r.id) === String(bySlug.id))
  : fests.find(r => String(r.title).replace(/\s+/g, '').includes(String(q).replace(/\s+/g, '')));

if (!target) { console.error(`「${q}」 축제를 못 찾았다.`); process.exit(1); }
const slug = slugById[String(target.id)] || '';
const fx = parseFloat(target.x), fy = parseFloat(target.y);
const hasXY = okXY(fx, fy);

// ── 근처 계산 ─────────────────────────────────────────────────────────────
function near(file, n, extra) {
  if (!hasXY) return [];
  return asList(readJson(file))
    .filter(r => r && r.title && okXY(r.x, r.y))
    .map(r => ({ ...r, d: dist(fx, fy, parseFloat(r.x), parseFloat(r.y)) }))
    .filter(r => r.d <= (extra || 25))
    .sort((a, b) => a.d - b.d)
    .slice(0, n);
}
const eats = near('restaurants_ko.json', 6, 15);
const cafes = near('cafes_ko.json', 4, 15);
const spots = near('spots_ko.json', 6, 12);
const stays = near('stays_ko.json', 4, 15);
const acc = near('accessible.json', 3, 10);

// 사진: 축제 대표 + 근처 장소 중 사진 있는 곳
const photos = [];
if (target.img) photos.push({ t: target.title, u: https(target.img), c: `${target.title} (${target.sido || ''} ${target.sigungu || ''})`.trim() });
for (const r of [...spots, ...acc]) {
  if (photos.length >= 4) break;
  if (r.img && !photos.some(p => p.u === https(r.img))) {
    photos.push({ t: r.title, u: https(r.img), c: `${r.title} — 축제장에서 ${r.d.toFixed(1)}km` });
  }
}

// 검색량 (큐에 있으면 가져온다)
const queue = readJson('naver-queue.json');
const qrow = (Array.isArray(queue) ? queue : []).find(r => r.slug === slug || r.title === target.title);

// ── 브리프 출력 ───────────────────────────────────────────────────────────
const s = ymd(target.start), e = ymd(target.end);
const L = [];
L.push(`# 글쓰기 브리프 — ${target.title}`);
L.push('');
L.push('`node naver-brief.js` 자동 생성. **여기 없는 사실은 글에 쓰지 않는다.**');
L.push('');
L.push('## 사실');
L.push('| 항목 | 값 |');
L.push('|---|---|');
L.push(`| 축제명 | ${target.title} |`);
L.push(`| 기간 | ${kdate(s)}(${dow(s)}) ~ ${kdate(e)}(${dow(e)}) |`);
L.push(`| 장소 | ${target.addr || '-'} |`);
L.push(`| 문의 | ${target.tel || '데이터 없음 — 글에 쓰지 말 것'} |`);
L.push(`| 지역 | ${target.sido || ''} ${target.sigungu || ''} |`);
if (qrow) L.push(`| 타깃 검색어 | **${qrow.kw}** — 네이버 월 ${qrow.vol.toLocaleString()}회 (실측) |`);
L.push(`| 상세페이지 | ${slug ? `https://chukjemoa.co.kr/festival/${slug}/` : '**없음 — 링크 걸 곳이 없다**'} |`);
L.push('');

L.push('## 공식 소개 (한국관광공사 TourAPI)');
L.push('> ⚠️ 그대로 복사하면 유사문서로 걸린다. **사실만 뽑아 블로그 말투로 다시 쓸 것.**');
L.push('');
L.push(target.ov ? target.ov : '**개요 없음** — 이 축제는 쓸 재료가 부족하다. 다른 축제를 먼저 쓰는 게 낫다.');
L.push('');
// TourAPI 가 «작년 내용»을 그대로 달고 있는 축제가 있다. 그걸 올해 프로그램인 양 쓰면 오보가 된다.
if (/전년도|작년|업데이트\s*중|20\d\d년도 축제 내용/.test(String(target.ov || ''))) {
  L.push('> 🚨 **이 개요는 작년 내용이다**(TourAPI가 그렇게 표시하고 있다). 날짜·장소는 써도 되지만');
  L.push('> **프로그램·출연진·행사 내용은 올해 것이 아니다.** 글에는 「올해 세부 프로그램은 아직 공개 전」이라고');
  L.push('> 쓰고, 확정되면 글을 고치는 편이 안전하다. 작년 프로그램을 올해 것처럼 쓰면 오보다.');
  L.push('');
}

const sec = (title, rows, fn) => {
  L.push(`## ${title}`);
  if (!rows.length) { L.push('데이터 없음.'); L.push(''); return; }
  rows.forEach(r => L.push('- ' + fn(r)));
  L.push('');
};
sec(`근처에서 밥 먹을 곳 (${eats.length}곳)`, eats, r =>
  `**${r.title}** · ${r.kind || ''} · ${r.d.toFixed(1)}km${r.menu ? ` · 대표메뉴 ${r.menu}` : ''}${r.open ? ` · 🕘 ${r.open}` : ''}${r.rest ? ` · 휴무 ${r.rest}` : ''}`);
sec(`근처 카페 (${cafes.length}곳)`, cafes, r =>
  `**${r.title}** · ${r.d.toFixed(1)}km${r.open ? ` · 🕘 ${r.open}` : ''}`);
sec(`근처 볼거리 (${spots.length}곳)`, spots, r => `**${r.title}** · ${r.d.toFixed(1)}km`);
sec(`근처 숙소 (${stays.length}곳)`, stays, r => `**${r.title}** · ${r.kind || ''} · ${r.d.toFixed(1)}km`);
sec(`무장애 시설 (${acc.length}곳)`, acc, r => `**${r.title}** · ${r.d.toFixed(1)}km`);

L.push(`## 사진 (한국관광공사 공식 · 무료)`);
if (!photos.length) L.push('사진 없음 — Unsplash/Pexels 폴백 필요.');
photos.forEach((p, i) => { L.push(`${i + 1}. ${p.u}`); L.push(`   캡션: ▲ ${p.c}`); });
L.push('');
L.push('넣는 법: URL 새 탭 → 우클릭 이미지 저장 → 네이버 사진 버튼 업로드. 글 끝에 `※ 사진 출처: 한국관광공사`.');
L.push('');

const core = String(target.title).replace(/^제?\s*\d+\s*회\s*/, '').split(/\s+/).pop();
const sgg = String(target.sigungu || '').replace(/(시|군|구)$/, '');
const mon = +s.slice(4, 6);
L.push('## 태그 후보');
const tags = [...new Set([
  `#${core}`,
  core.startsWith(sgg) ? '' : `#${sgg}${core}`,          // 이미 지역명이 붙어 있으면 또 붙이지 않는다
  qrow ? `#${qrow.kw}` : '',
  `#${sgg}가볼만한곳`, `#${mon}월축제`, `#${target.sido}가볼만한곳`,
  '#국내여행', '#축제', `#${sgg}여행`, '#주말나들이'
].filter(Boolean))].slice(0, 10);
L.push(tags.map(t => '`' + t + '`').join(' '));
L.push('');

L.push('## 제목 후보 (타깃 검색어를 앞쪽에)');
L.push(`1. \`${s.slice(0, 4)} ${target.title} — ${+s.slice(4, 6)}월 ${+s.slice(6, 8)}일 개막, 기간·가는 길·근처 맛집\``);
L.push(`2. \`${core} ${s.slice(0, 4)} 총정리 (${+s.slice(4, 6)}/${+s.slice(6, 8)}~${+e.slice(4, 6)}/${+e.slice(6, 8)}) 일정과 주변 정리\``);
L.push('');

L.push('## 발행 체크리스트');
[' 사진 다운로드 → 네이버 사진 버튼으로 업로드',
  ' 카테고리 **나의여행** / 주제 **국내여행**',
  ' **전체공개** + **검색허용** + 공감허용 + 외부공유 허용',
  ' 태그 10개',
  ' 본문 중간 지도 블록 금지 (발행창 「위치 추가」로 대체)',
  ' 발행 후 **시크릿창**으로 공개 여부 최종 확인',
  ' 마지막 실용섹션 하나는 티저로 남겨 상세페이지 클릭 유도'
].forEach(t => L.push('- [ ]' + t));

const out = path.join(__dirname, `naver-brief-${slug || 'unknown'}.md`);
fs.writeFileSync(out, L.join('\n'), 'utf8');
console.log(`✓ ${path.basename(out)} — 맛집 ${eats.length} · 카페 ${cafes.length} · 볼거리 ${spots.length} · 사진 ${photos.length}`);
if (!target.ov) console.log('⚠️ 개요가 없다. 재료 부족 — 다른 축제를 먼저 쓸 것.');
if (!slug) console.log('⚠️ 상세페이지 slug 가 없다. 링크 걸 곳이 없으니 발행 전에 페이지부터 만들 것.');
