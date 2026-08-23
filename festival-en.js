// 🎪 영문 개별 축제 페이지 /en/festival/{slug}/
//
// 2026-08-20: 한국어판(festival.js, 377개)과 이 파일은 데이터 소스가 완전히 다르다.
//   · 한국어: KorService2 축제 목록(festivals_api.json, 915건) 중 조건에 맞는 377건
//   · 영문: EngService2 자체 큐레이션 축제 목록(festivals_en.json, 216건) — **contentId가 한국어판과
//     0% 일치**(실측 확인). 그래서 "한국어 축제에 영문을 붙이는" 게 아니라 영문 서비스가
//     이미 번역해 둔 축제 목록을 그대로 페이지화한다. 개요(ov)는 전부 정부 공식 영문 원문 그대로 —
//     새로 쓰거나 보강하지 않는다(지어내지 않는다).
// 임계값: 개요 200자 이상만 만든다(한국어판 MIN_OV=300자 기준과 같은 취지, 영문 데이터 볼륨이
//   작아 200자로 낮췄다 — 174/216건이 여기 해당, 2026-08-20 실측).
const fs = require('fs'), path = require('path');
const MIN_OV = 200;

function load(f) { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { return []; } }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function slugify(t) {
  return String(t || '').toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'festival';
}
function fmtDate(s) {
  if (!/^\d{8}$/.test(String(s || ''))) return '';
  const MN = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${MN[+String(s).slice(4, 6)]} ${+String(s).slice(6, 8)}, ${String(s).slice(0, 4)}`;
}
function iso(s) {
  if (!/^\d{8}$/.test(String(s || ''))) return '';
  return `${String(s).slice(0,4)}-${String(s).slice(4,6)}-${String(s).slice(6,8)}`;
}

const CSS = `
<style>
.fhero{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 3px 16px rgba(31,41,55,.08);margin:14px 0}
.fhero img{width:100%;max-height:340px;object-fit:cover;display:block;background:#f6f1ea}
.finfo{display:grid;grid-template-columns:110px 1fr;gap:8px 12px;padding:16px 18px;font-size:.94rem}
.finfo dt{font-weight:800;color:#0a6c63}
.finfo dd{color:#374151}
.fend{background:#fff7ed;border:1.5px solid #fed7aa;border-radius:14px;padding:16px 18px;margin:14px 0 18px}
.fend h2{font-size:1.08rem;font-weight:900;color:#9a3412;margin:0 0 8px}
.fend p{color:#7c2d12;font-size:.95rem;line-height:1.62;margin:0 0 7px}
.fov{background:#fff;border-radius:16px;padding:18px 20px;margin:14px 0;box-shadow:0 2px 10px rgba(31,41,55,.06)}
.fov h2{font-size:1.05rem;font-weight:900;color:#0a6c63;margin-bottom:8px}
.fov p{color:#374151;font-size:.96rem;line-height:1.75}
.flinks{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}
.flinks a{flex:1;min-width:150px;text-align:center;padding:12px;border-radius:12px;font-weight:800;font-size:.94rem;text-decoration:none}
.fl-hp{background:#0f9d8f;color:#fff}
.fl-map{background:#f3f4f6;color:#374151;border:1.5px solid #dcefeb}
.frel{margin:20px 0}
.frel h2{font-size:1.02rem;font-weight:900;color:#0a6c63;margin-bottom:10px}
.frel .row{display:flex;flex-wrap:wrap;gap:8px}
.frel a{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.87rem;padding:8px 14px;border-radius:999px;text-decoration:none}
.frel a:hover{background:#e2f5f2}
</style>`;

function build(ctx) {
  const { ROOT, layout, writePage, SITE, TODAY } = ctx;
  const fes = load('festivals_en.json').filter(f => (f.ov || '').length >= MIN_OV);

  // 슬러그 충돌 방지
  const used = new Set();
  const rows = fes.map(f => {
    let slug = slugify(f.title);
    let s = slug, n = 2;
    while (used.has(s)) s = `${slug}-${n++}`;
    used.add(s);
    return { ...f, slug: s };
  });

  const byRegion = {};
  rows.forEach(f => { (byRegion[f.region] = byRegion[f.region] || []).push(f); });

  // ⚠️ 2026-08-23: Ahrefs가 고아 페이지 81개를 잡았다 — 정확히 81개였던 이유를 추적해 보니
  //    "같은 지역 축제" 링크가 항상 배열 앞쪽 6~7개만 가리키는 slice(0,6) 방식이라, 지역 인원이
  //    7명을 넘는 순간 뒤쪽 사람들은 사이트 어디서도 링크를 받지 못했다(15개 지역에서 7명 넘는
  //    인원의 합 = 정확히 81명 — /en/search/는 JS로만 채워져 크롤러가 링크로 세지 않는다).
  //    앞쪽 고정 6개 대신 "내 바로 다음 6명"을 원형으로 도는 방식으로 바꾼다 — 이러면 지역 인원이
  //    2명 이상이기만 하면 누구나 앞사람들에게서 반드시 링크를 받는다.
  const regionIndex = {};
  rows.forEach(f => { regionIndex[f.slug] = (byRegion[f.region] || []).indexOf(f); });
  const relatedRing = (arr, i, count) => {
    const n = arr.length, take = Math.min(count, n - 1);
    const out = [];
    for (let k = 1; k <= take; k++) out.push(arr[(i + k) % n]);
    return out;
  };

  const TODAY8 = TODAY.replace(/-/g, '');
  const urls = [];

  rows.forEach(f => {
    const ended = String(f.end || '') < TODAY8;
    const region = byRegion[f.region] || [];
    const related = relatedRing(region, regionIndex[f.slug], 6);
    const mapUrl = f.x && f.y ? `https://www.google.com/maps?q=${f.y},${f.x}` : '';
    const hpUrl = f.hp ? (f.hp.indexOf('http') === 0 ? f.hp : 'http://' + f.hp) : '';
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(f.title + ' Korea festival')}`;

    const content = `<main><div class="wrap">
${CSS}
<p style="font-size:.85rem;color:#9aa3af;margin:8px 0"><a href="/en/" style="color:#0c7d72">Home</a> › <a href="/en/search/" style="color:#0c7d72">Festivals</a> › ${esc(f.title)}</p>
<h1 style="font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:6px 0">${esc(f.title)}</h1>
<div class="fhero"><img loading="lazy" src="${esc(f.img || '/img/cat2-culture-a.webp')}" alt="${esc(f.title)}" onerror="this.src='/img/cat2-culture-a.webp'">
<dl class="finfo">
<dt>📅 Dates</dt><dd>${fmtDate(f.start)} – ${fmtDate(f.end)}</dd>
<dt>📍 Location</dt><dd>${esc(f.addr || f.region || '')}</dd>
${f.tel ? `<dt>☎️ Contact</dt><dd>${esc(f.tel)}</dd>` : ''}
</dl></div>
${ended ? `<div class="fend"><h2>⚠️ This festival's listed dates have passed</h2>
<p>The dates above are from the most recent official schedule. Many Korean festivals are annual events held around the same time each year, but the next date has not been officially confirmed yet — please check the official website or a Google search below before planning a trip.</p></div>` : ''}
<div class="fov"><h2>Overview</h2><p>${esc(f.ov)}</p>
<p class="note" style="color:#9aa3af;font-size:.82rem;margin-top:10px">Source: Korea Tourism Organization (official English translation, TourAPI).</p></div>
<div class="flinks">
${hpUrl ? `<a class="fl-hp" href="${esc(hpUrl)}" target="_blank" rel="noopener">🏛️ Official website</a>` : ''}
${mapUrl ? `<a class="fl-map" href="${esc(mapUrl)}" target="_blank" rel="noopener">🗺️ View on map</a>` : ''}
<a class="fl-map" href="${esc(googleUrl)}" target="_blank" rel="noopener">🔎 Search on Google</a>
</div>
${related.length ? `<div class="frel"><h2>Other festivals in ${esc(f.region)}</h2><div class="row">${related.map(r => `<a href="/en/festival/${esc(r.slug)}/">${esc(r.title)}</a>`).join('')}</div></div>` : ''}
<p style="margin-top:10px"><a href="/en/search/?region=${encodeURIComponent(f.region || '')}" style="color:#0c7d72;font-weight:700">← Browse all festivals in ${esc(f.region)}</a></p>
</div></main>`;

    const ld = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Festival',
      name: f.title, description: f.ov,
      startDate: iso(f.start), endDate: iso(f.end),
      image: f.img || undefined,
      location: { '@type': 'Place', name: f.addr || f.region, address: f.addr,
        geo: (f.x && f.y) ? { '@type': 'GeoCoordinates', latitude: +f.y, longitude: +f.x } : undefined },
      url: `${SITE}/en/festival/${f.slug}/`
    })}</script>`;

    const urlPath = `/en/festival/${f.slug}/`;
    writePage('en/festival/' + f.slug, layout(
      `${f.title} — Dates, Location & Info | Chukjemoa`,
      (f.ov || '').slice(0, 155) + (ended ? ' Official info from the Korea Tourism Organization.' : ''),
      urlPath, content, { lang: 'en', jsonld: ld }));
    urls.push(urlPath);
  });

  console.log(`✓ /en/festival/{slug}/ — ${urls.length}개 (전체 ${load('festivals_en.json').length}건 중 개요 ${MIN_OV}자↑)`);
  return urls;
}

module.exports = { build };
