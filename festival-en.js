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
//
// 2026-09-01: 실측(GSC 90일)으로 「무엇을 고칠지」가 바뀌었다.
//   개별 축제 영문명은 이미 6~10위에 올라 있는데 **90일 클릭 0**이고 노출도 한 자릿수다.
//   페이지에 「공식 개요 한 문단 + 지도 링크」밖에 없으니 더 오를 이유가 없었다.
//   → intl-fest-extra.js 로 **남이 못 쓰는 것**을 붙인다(한글 원제·붐빔·주차 대수·오일장 날짜).
//   ⚠️ 상품(쿠웅샵)은 붙이지 않는다 — 2026-08-19 결정: 공유를 노리는 외국어 페이지에 상품을 얹으면
//      아무도 공유하지 않는다. 코리 QR 착지점은 별도 페이지로 만든다.
const fs = require('fs'), path = require('path');
const { extras } = require('./intl-fest-extra.js');
// 애드센스 「가치가 별로 없는 콘텐츠」 방지선 — 렌더된 본문을 직접 잰다(대리 지표 금지).
const MIN_BODY = 2000;
const textLen = h => String(h).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
const { indexPage } = require('./intl-fest-index.js');
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
    // _slug 는 intl-fest-extra.js 가 「같은 시기 근처 축제」 링크를 걸 때 쓰는 공용 키다.
    return { ...f, slug: s, _slug: s };
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
  const urls = [], thinOut = [];
  const tally = { map: 0, busy: 0, trr: 0, mkt: 0, rel: 0, none: 0 };

  rows.forEach(f => {
    const ended = String(f.end || '') < TODAY8;
    const region = byRegion[f.region] || [];
    const related = relatedRing(region, regionIndex[f.slug], 6);
    const mapUrl = f.x && f.y ? `https://www.google.com/maps?q=${f.y},${f.x}` : '';
    const hpUrl = f.hp ? (f.hp.indexOf('http') === 0 ? f.hp : 'http://' + f.hp) : '';
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(f.title + ' Korea festival')}`;

    // 우리만 가진 정보 — 종료된 축제에는 「기간 중 장날」이 의미 없으므로 진행/예정만 전부 붙이고,
    // 종료된 축제에는 한글 원제·붐빔처럼 «시기와 무관한 것»만 남는다(extras 안에서 자연히 걸러진다).
    const ex = extras(f, 'en', rows);
    Object.keys(tally).forEach(k => { if (ex.stats[k]) tally[k]++; });
    if (!ex.html) tally.none++;

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
${ex.html}
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
    // ⚠️ 개요 길이(MIN_OV)만으로는 얇은 게 새어 나온다 — 2026-09-01 감사에서 8개가 2,000자 미만.
    //    렌더된 본문을 직접 재서 얇으면 noindex + 사이트맵 제외(페이지는 남겨 링크를 안 끊는다).
    const tooThin = textLen(content) < MIN_BODY;
    writePage('en/festival/' + f.slug, layout(
      `${f.title} — Dates, Location & Info | Chukjemoa`,
      (f.ov || '').slice(0, 155) + (ended ? ' Official info from the Korea Tourism Organization.' : ''),
      urlPath, content, { lang: 'en', jsonld: ld, noindex: tooThin }));
    if (tooThin) thinOut.push(urlPath); else urls.push(urlPath);
  });
  if (thinOut.length) console.log(`  /en/festival/ 본문 ${MIN_BODY}자 미만 ${thinOut.length}개 → noindex+사이트맵 제외`);

  // 🗂️ 허브 — 「korean festivals」(82위)·「festivals in korea」(85위) 같은 머리말을 받을 페이지.
  //    지금은 /en/(62.8위)과 /en/search/(61.9위)가 받고 있는데 둘 다 읽을 내용이 없는 검색 UI다.
  const ix = indexPage('en', rows, TODAY8);
  writePage('en/festival', layout(ix.title, ix.desc, ix.url, ix.html, { lang: 'en' }));
  urls.push(ix.url);

  // ⚠️ 빌드는 «쓰기»만 하고 지우지 않는다 — 데이터에서 빠진 축제의 폴더가 남으면
  //    사이트맵에는 없는데 URL로는 열리는 유령 페이지가 된다(/jangteo/·/trend/ 에서 이미 겪었다).
  const keep = new Set(rows.map(f => f.slug));
  let gone = 0;
  const dir = path.join(ROOT, 'en', 'festival');
  if (fs.existsSync(dir)) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory() || keep.has(e.name)) continue;
      fs.rmSync(path.join(dir, e.name), { recursive: true, force: true });
      console.log('  🗑 유령 페이지 삭제 /en/festival/' + e.name + '/');
      gone++;
    }
  }

  console.log(`✓ /en/festival/{slug}/ — ${urls.length - 1}개 + 허브 /en/festival/ (전체 ${load('festivals_en.json').length}건 중 개요 ${MIN_OV}자↑)`);
  console.log(`   심화블록: 한글원제 ${tally.map} · 붐빔 ${tally.busy} · 주차대수 ${tally.trr}`
    + ` · 기간중 장날 ${tally.mkt} · 동시기 근처축제 ${tally.rel} · 아무것도 없음 ${tally.none}`);
  return urls;
}

module.exports = { build };
