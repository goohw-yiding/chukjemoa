// 전국길 1,325개를 '브랜드 길'과 '지역 길'로 나누는 규칙
//  - 이름 있는 길(제주올레·갈맷길·바우길…)은 브랜드로 묶어 전용 페이지를 만든다
//  - 코리아둘레길(해파랑·남파랑·서해랑·DMZ)은 두루누비 상세본이 이미 있으므로 여기선 제외하고 링크만
//  - 나머지는 시·도별로 모은다
'use strict';

// 코리아둘레길 — 표준데이터에도 일부 있으나 두루누비 쪽이 훨씬 상세하다
const KOREA_TRAIL = /(해파랑길|남파랑길|서해랑길|코리아둘레길|DMZ\s*평화)/;

// 수동 브랜드 정의 (순서 중요 — 위에서부터 먼저 매칭)
const BRANDS = [
  { slug: 'jejuolle', label: '제주올레', emoji: '🍊', region: '제주',
    test: t => /제주\s*올레/.test(t.name) || /제주올레/.test(t.org) },
  { slug: 'gyeonggi-dulle', label: '경기둘레길', emoji: '🌿', region: '경기',
    test: t => /^경기둘레길/.test(t.name) },
  { slug: 'gyeonggi-yetgil', label: '경기옛길', emoji: '🏯', region: '경기',
    test: t => /^경기옛길/.test(t.name) },
  { slug: 'galmaetgil', label: '부산 갈맷길', emoji: '🌊', region: '부산',
    test: t => /갈맷길/.test(t.name) },
  { slug: 'baugil', label: '강릉 바우길', emoji: '⛰️', region: '강원',
    test: t => /바우길/.test(t.name) },
  { slug: 'gubigil', label: '광주 굽이길', emoji: '🍂', region: '광주',
    test: t => /굽이길/.test(t.name) },
  { slug: 'jirisan-dulle', label: '지리산둘레길', emoji: '🏔️', region: '경남·전남·전북',
    test: t => /지리산\s*둘레길/.test(t.name) },
  { slug: 'chiaksan-dulle', label: '치악산둘레길', emoji: '🌲', region: '강원',
    test: t => /치악산\s*둘레길/.test(t.name) },
  { slug: 'biseulsan-dulle', label: '비슬산둘레길', emoji: '🌸', region: '대구',
    test: t => /비슬산\s*둘레길/.test(t.name) },
  { slug: 'goyang-nuri', label: '고양 누리길', emoji: '🚶', region: '경기',
    test: t => /누리길/.test(t.name) && /고양/.test(t.name + t.org) },
  { slug: 'gubulgil', label: '군산 구불길', emoji: '🌾', region: '전북',
    test: t => /구불/.test(t.name) },
  { slug: 'seoul-dulle', label: '서울둘레길', emoji: '🏙️', region: '서울',
    test: t => /서울둘레길/.test(t.name) }
];

// 자동 브랜드: 이름에서 코스 번호를 떼어낸 앞부분이 같은 길이 N개 이상이면 브랜드로 승격
function baseName(n) {
  return String(n || '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s*제?\s*\d+(-\d+)?\s*(코스|구간|길|번)?\s*.*$/, '')
    .replace(/\s+/g, ' ').trim();
}

// 한글 → 슬러그(로마자). romanize.js 재사용
let romanizeRegion = s => s;
try { romanizeRegion = require('./romanize').romanizeRegion; } catch (e) {}
function toSlug(s) {
  const r = romanizeRegion(String(s || '').replace(/[_·・]/g, ' ').replace(/\s+/g, ''))
    .toLowerCase().replace(/[^a-z0-9]/g, '');
  return r || 'walk';
}

// 브랜드 전용 페이지 기준 — 얇은 페이지가 양산되지 않게 보수적으로 잡는다
const AUTO_MIN = 10;        // 자동 브랜드: 10개 코스 이상만 전용 페이지
const MANUAL_MIN = 5;       // 수동(유명) 브랜드: 5개 이상
// '둘레길'처럼 어느 지역에나 있는 일반명은 브랜드가 될 수 없다
const GENERIC = /^(둘레길|숲길|산책로|올레길|마실길|등산로|트레킹코스|해안길|자락길)$/;

function group(list) {
  const brands = [];   // {slug,label,emoji,region,items[],auto}
  const used = new Set();
  const korea = [];

  // 0) 코리아둘레길 분리
  list.forEach((t, i) => { if (KOREA_TRAIL.test(t.name)) { korea.push(t); used.add(i); } });

  // 1) 수동 브랜드
  for (const B of BRANDS) {
    const items = [];
    list.forEach((t, i) => { if (!used.has(i) && B.test(t)) { items.push(t); used.add(i); } });
    if (items.length >= MANUAL_MIN) brands.push({ slug: B.slug, label: B.label, emoji: B.emoji, region: B.region, items, auto: false });
    else items.forEach(t => { const i = list.indexOf(t); if (i >= 0) used.delete(i); });   // 너무 적으면 지역 길로 되돌림
  }

  // 2) 자동 브랜드 (같은 base 이름 N개 이상)
  const buckets = {};
  list.forEach((t, i) => {
    if (used.has(i)) return;
    const b = baseName(t.name);
    if (b.length < 2 || GENERIC.test(b)) return;
    (buckets[b] = buckets[b] || []).push(i);
  });
  Object.entries(buckets)
    .filter(([, idx]) => idx.length >= AUTO_MIN)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([label, idx]) => {
      const items = idx.map(i => list[i]);
      idx.forEach(i => used.add(i));
      const sidos = [...new Set(items.map(t => t.sido).filter(Boolean))];
      brands.push({ slug: toSlug(label), label, emoji: '🥾', region: sidos.join('·'), items, auto: true });
    });

  // 3) 나머지 = 지역 길
  const rest = list.filter((t, i) => !used.has(i));

  // 슬러그 충돌 방지
  const seen = {};
  brands.forEach(b => {
    let s = b.slug, n = 2;
    while (seen[s]) s = b.slug + n++;
    seen[s] = 1; b.slug = s;
  });
  brands.sort((a, b) => b.items.length - a.items.length);
  return { brands, rest, korea };
}

module.exports = { group, baseName, toSlug, KOREA_TRAIL };
