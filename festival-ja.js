// 🎪 일본어 개별 축제 페이지 /ja/festival/{slug}/
//
// 왜 일본어인가 (2026-09-01 GSC 28일 실측)
//   영어 212p → 노출 1,230 · 클릭 8 · 평균 30.1위
//   일본어  18p → 노출   230 · 클릭 10 · 평균  7.9위     ← 페이지당 성과가 20배 넘게 좋다
//   국가별로도 일본이 한국 다음 2위(클릭 12·노출 286·순위 7.5).
//   그런데 **/ja/ 에는 축제 상세가 한 장도 없었다.** 영어에 186장을 붓는 동안 일본어 축제 데이터
//   181건(개요 200자↑ 117건)은 그대로 놀고 있었다. 순서가 거꾸로였다.
//
// 일본어 실검색어도 확인됨: 韓国 祭り(9.3위) · 韓国の祭り · チュソク 2026(9.2위) ·
//   ハングルの日 お店 休み(5.2위·클릭1) · **安東 国際 仮面 舞 フェスティバル 2026**
//
// 데이터: JpnService2 자체 큐레이션 목록(festivals_ja.json). 한국어판과 contentId 체계가 다르다.
//   개요(ov)는 정부 공식 일본어 번역 원문 그대로 — 새로 쓰거나 보강하지 않는다.
// ⚠️ 상품(쿠웅샵)은 붙이지 않는다 — 2026-08-19 결정(공유용 외국어 페이지에 상품 금지).
const fs = require('fs'), path = require('path');
const { extras } = require('./intl-fest-extra.js');
// 애드센스 「가치가 별로 없는 콘텐츠」 방지선 — 렌더된 본문을 직접 잰다(대리 지표 금지).
const MIN_BODY = 2000;
const textLen = h => String(h).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
const { indexPage } = require('./intl-fest-index.js');
const { mapBlock, mapScript } = require('./nmap.js');   // 좌표 기반 지도(외국인에게 가장 정확한 안내)
const JN = require('./ja-nearby.js');                  // 근처 볼거리 — 역지오코딩한 한글주소를 여기서 쓴다
const { romanizeMixed } = require('./placename.js');
const MIN_OV = 200;

function load(f) { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { return []; } }
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 일본어 제목은 한자·가나라 그대로 슬러그를 못 만든다.
// → 좌표로 이어진 한국어 원제를 로마자로 옮겨 슬러그를 만든다(영문판과 같은 규칙이라 URL이 일관된다).
function slugify(t) {
  return String(t || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}
function fmtDate(s) {
  if (!/^\d{8}$/.test(String(s || ''))) return '';
  return `${String(s).slice(0, 4)}年${+String(s).slice(4, 6)}月${+String(s).slice(6, 8)}日`;
}
const iso = s => /^\d{8}$/.test(String(s || ''))
  ? `${String(s).slice(0, 4)}-${String(s).slice(4, 6)}-${String(s).slice(6, 8)}` : '';

const CSS = `
<style>
.fhero{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 3px 16px rgba(31,41,55,.08);margin:14px 0}
.fhero img{width:100%;max-height:340px;object-fit:cover;display:block;background:#f6f1ea}
.finfo{display:grid;grid-template-columns:104px 1fr;gap:8px 12px;padding:16px 18px;font-size:.94rem}
.finfo dt{font-weight:800;color:#0a6c63}
.finfo dd{color:#374151}
.fend{background:#fff7ed;border:1.5px solid #fed7aa;border-radius:14px;padding:16px 18px;margin:14px 0 18px}
.fend h2{font-size:1.06rem;font-weight:900;color:#9a3412;margin:0 0 8px}
.fend p{color:#7c2d12;font-size:.94rem;line-height:1.7;margin:0}
.fov{background:#fff;border-radius:16px;padding:18px 20px;margin:14px 0;box-shadow:0 2px 10px rgba(31,41,55,.06)}
.fov h2{font-size:1.05rem;font-weight:900;color:#0a6c63;margin-bottom:8px}
.fov p{color:#374151;font-size:.96rem;line-height:1.85}
.flinks{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}
.flinks a{flex:1;min-width:150px;text-align:center;padding:12px;border-radius:12px;font-weight:800;font-size:.93rem;text-decoration:none}
.fl-hp{background:#0f9d8f;color:#fff}
.fl-map{background:#f3f4f6;color:#374151;border:1.5px solid #dcefeb}
.frel{margin:20px 0}
.frel h2{font-size:1.02rem;font-weight:900;color:#0a6c63;margin-bottom:10px}
.frel .row{display:flex;flex-wrap:wrap;gap:8px}
.frel a{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.87rem;padding:8px 14px;border-radius:999px;text-decoration:none}
</style>`;

// 좌표(소수3자리)+시작일로 한국어 원제를 찾는다 — 슬러그와 「지도에 붙여넣을 한글」 둘 다에 쓴다.
const num = v => { const n = Number(v); return isFinite(n) ? n : 0; };
const okXY = (x, y) => num(x) > 124 && num(x) < 132 && num(y) > 33 && num(y) < 39;
const k3 = (x, y) => num(x).toFixed(3) + ',' + num(y).toFixed(3);

function build(ctx) {
  const { layout, writePage, SITE, TODAY } = ctx;
  const all = load('festivals_ja.json');
  const ko = load('festivals_api.json');
  const KOI = {}, KOI2 = {};
  ko.forEach(f => {
    if (!okXY(f.x, f.y)) return;
    KOI[k3(f.x, f.y) + '|' + f.start] = f;
    if (!KOI2[k3(f.x, f.y)]) KOI2[k3(f.x, f.y)] = f;
  });
  const koOf = f => (okXY(f.x, f.y) && (KOI[k3(f.x, f.y) + '|' + f.start] || KOI2[k3(f.x, f.y)])) || null;

  const fes = all.filter(f => String(f.ov || '').trim().length >= MIN_OV && okXY(f.x, f.y));

  // 슬러그 — 한국어 원제 로마자가 1순위, 없으면 (일본어 제목은 못 쓰므로) 그 축제는 건너뛴다.
  // ⚠️ 슬러그를 못 만드는 걸 억지로 id 로 만들면 「/ja/festival/2874521/」 같은 읽을 수 없는 URL이 된다.
  const used = new Set(), rows = [];
  fes.forEach(f => {
    const m = koOf(f);
    const base = slugify(romanizeMixed(m ? m.title : ''));
    if (!base) return;
    let s = base, n = 2;
    while (used.has(s)) s = `${base}-${n++}`;
    used.add(s);
    rows.push({ ...f, _slug: s, _ko: m });
  });

  // ⚠️ 2026-09-01 감사에서 걸렸다 — 일본어 개요가 짧은 축제는 본문 900자대로 나온다.
  //    「개요 200자↑」만으로는 읽을 만한 페이지가 안 된다. 개요가 얇으면 **우리 데이터가 최소
  //    3덩어리는 붙어야** 페이지로 낸다(한글 원제·붐빔·주차·장날·근처축제 중 3개).
  //    ⚠️ 이 판정은 «렌더 전에» 끝내야 한다 — 렌더 중에 걸러내면 허브·근처축제 링크가 없는 페이지를
  //       가리켜 끊긴 링크가 된다.
  const thin = new Set();
  rows.forEach(f => {
    // 2026-09-02: 「近くの見どころ」(일본어 설명 + 한글주소)도 읽을 내용이다 — 사전 게이트에 함께 센다.
    const blocks = Object.values(extras(f, 'ja', rows).stats).filter(Boolean).length + (JN.nearby(f, 5).count ? 1 : 0);
    if (String(f.ov || '').length < 300 && blocks < 3) thin.add(f._slug);
  });
  const kept = rows.filter(f => !thin.has(f._slug));
  rows.length = 0; rows.push(...kept);

  const byRegion = {};
  rows.forEach(f => { (byRegion[f.region] = byRegion[f.region] || []).push(f); });
  const regionIndex = {};
  rows.forEach(f => { regionIndex[f._slug] = (byRegion[f.region] || []).indexOf(f); });
  // 「같은 지역 축제」는 앞쪽 고정 6개가 아니라 «내 다음 6명»을 원형으로 — 영문판에서 고아 81개가
  // 생겼던 원인과 같은 함정이라 처음부터 원형으로 만든다.
  const ring = (arr, i, cnt) => {
    const n = arr.length, take = Math.min(cnt, n - 1), out = [];
    for (let k = 1; k <= take; k++) out.push(arr[(i + k) % n]);
    return out;
  };

  const TODAY8 = String(TODAY).replace(/-/g, '');
  const urls = [], thinOut = [];
  const tally = { map: 0, busy: 0, trr: 0, mkt: 0, rel: 0 };

  rows.forEach(f => {
    const ended = String(f.end || '') < TODAY8;
    const rel = ring(byRegion[f.region] || [], regionIndex[f._slug], 6);
    const mapUrl = `https://map.naver.com/p/search/${encodeURIComponent((f._ko && f._ko.title) || f.title)}`;
    const hpUrl = f.hp ? (String(f.hp).indexOf('http') === 0 ? f.hp : 'http://' + f.hp) : '';
    const ex = extras(f, 'ja', rows);
    Object.keys(tally).forEach(k => { if (ex.stats[k]) tally[k]++; });
    // ⚠️ 지도 블록의 안내 문구("地図を読み込み中…" 등)가 «얇은 페이지» 판정을 밀어올린다.
    //    지도가 붙었다고 읽을 내용이 늘어난 건 아니므로 길이 측정에서 뺀다(게이트를 스스로 속이지 않는다).
    const mapHtml = mapBlock({ x: f.x, y: f.y, title: f.title, lang: 'ja', query: (f._ko && f._ko.title) || f.title });
    const near = JN.nearby(f, 5);   // 일본어 설명 + 붙여넣을 수 있는 한글주소

    const content = `<main><div class="wrap">
${CSS}
<p style="font-size:.85rem;color:#9aa3af;margin:8px 0"><a href="/ja/" style="color:#0c7d72">ホーム</a> › <a href="/ja/search/" style="color:#0c7d72">祭りを探す</a> › ${esc(f.title)}</p>
<h1 style="font-size:1.46rem;font-weight:900;letter-spacing:-.02em;margin:6px 0">${esc(f.title)}</h1>
<div class="fhero"><img loading="lazy" src="${esc(f.img || '/img/cat2-culture-a.webp')}" alt="${esc(f.title)}" onerror="this.src='/img/cat2-culture-a.webp'">
<dl class="finfo">
<dt>📅 開催期間</dt><dd>${fmtDate(f.start)} 〜 ${fmtDate(f.end)}</dd>
<dt>📍 場所</dt><dd>${esc(f.addr || f.region || '')}</dd>
${f.tel ? `<dt>☎️ 問い合わせ</dt><dd>${esc(f.tel)}</dd>` : ''}
</dl></div>
${ended ? `<div class="fend"><h2>⚠️ 上の日程はすでに終了しています</h2>
<p>掲載されているのは公式に確認できた直近の日程です。韓国の祭りは毎年ほぼ同じ時期に開かれる年中行事が多いのですが、次回の日程はまだ公表されていません。旅行を決める前に公式サイトでご確認ください。</p></div>` : ''}
<div class="fov"><h2>この祭りについて</h2><p>${esc(f.ov)}</p>
<p style="color:#9aa3af;font-size:.82rem;margin-top:10px">出典：韓国観光公社（公式日本語訳・TourAPI）</p></div>
<div class="flinks">
${hpUrl ? `<a class="fl-hp" href="${esc(hpUrl)}" target="_blank" rel="noopener">🏛️ 公式サイト</a>` : ''}
<a class="fl-map" href="${esc(mapUrl)}" target="_blank" rel="noopener">🗺️ NAVERマップで開く</a>
</div>
${ex.html}
${mapHtml}
${near.html ? JN.CSS + near.html : ''}
${rel.length ? `<div class="frel"><h2>${esc(f.region)}のほかの祭り</h2><div class="row">${
  rel.map(r => `<a href="/ja/festival/${esc(r._slug)}/">${esc(r.title)}</a>`).join('')}</div></div>` : ''}
<p style="margin-top:10px"><a href="/ja/search/" style="color:#0c7d72;font-weight:700">← 韓国の祭りをすべて見る</a></p>
${mapScript('ja')}
</div></main>`;

    const ld = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Festival',
      name: f.title, description: f.ov,
      startDate: iso(f.start), endDate: iso(f.end), image: f.img || undefined,
      location: { '@type': 'Place', name: f.addr || f.region, address: f.addr,
        geo: { '@type': 'GeoCoordinates', latitude: +f.y, longitude: +f.x } },
      url: `${SITE}/ja/festival/${f._slug}/`
    })}</script>`;

    const urlPath = `/ja/festival/${f._slug}/`;
    // ⚠️ 2026-09-01: 위의 «개요 300자·블록 3개» 게이트는 대리 지표라 얇은 게 새어 나왔다
    //    (통과한 90개가 실제로는 1,000~1,500자). **렌더된 본문을 직접 재서** 다시 판정한다.
    //    얇으면 «지우지 않고» noindex + 사이트맵 제외 — 끝난 축제(2026-08-18)와 같은 방식이라
    //    허브·근처축제 링크가 끊기지 않는다. 나중에 데이터가 차면 저절로 되살아난다.
    const tooThin = textLen(content) - textLen(mapHtml) < MIN_BODY;
    writePage('ja/festival/' + f._slug, layout(
      `${f.title} — 日程・場所・アクセス | 축제모아`,
      String(f.ov || '').slice(0, 110),
      urlPath, content, { lang: 'ja', jsonld: ld, noindex: tooThin }));
    if (tooThin) thinOut.push(urlPath); else urls.push(urlPath);
  });
  if (thinOut.length) console.log(`  /ja/festival/ 본문 ${MIN_BODY}자 미만 ${thinOut.length}개 → noindex+사이트맵 제외`);

  // 🗂️ 허브 — 「韓国 祭り」(9.3위)·「韓国の祭り」(23.5위)·「韓国お祭り」(32위)를 받을 페이지.
  const ix = indexPage('ja', rows, TODAY8);
  writePage('ja/festival', layout(ix.title, ix.desc, ix.url, ix.html, { lang: 'ja' }));
  urls.push(ix.url);

  // 슬러그 표를 파일로 남긴다 — ja-holiday.js 가 「이 연휴에 열리는 축제」를 링크할 때 쓴다.
  // ⚠️ 같은 규칙을 두 곳에 다시 구현하면 반드시 어긋난다(중복 시 붙는 -2 접미사까지 맞춰야 한다).
  //    끊긴 링크를 만드느니 «실제로 만든 슬러그»를 그대로 넘긴다.
  const slugMap = {};
  rows.forEach(f => { if (f.id != null) slugMap[String(f.id)] = f._slug; });
  fs.writeFileSync(path.join(ctx.ROOT || __dirname, 'data', 'ja_festival_slugs.json'),
    JSON.stringify(slugMap), 'utf8');

  // ⚠️ 유령 페이지 정리 — 영문판과 같은 이유(/jangteo/·/trend/ 에서 겪은 사고).
  const keep = new Set(rows.map(f => f._slug));
  const dir = path.join(ctx.ROOT || __dirname, 'ja', 'festival');
  if (fs.existsSync(dir)) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory() || keep.has(e.name)) continue;
      fs.rmSync(path.join(dir, e.name), { recursive: true, force: true });
      console.log('  🗑 유령 페이지 삭제 /ja/festival/' + e.name + '/');
    }
  }

  console.log(`✓ /ja/festival/{slug}/ — ${urls.length - 1}개 + 허브 /ja/festival/ (일문 ${all.length}건 중 개요 ${MIN_OV}자↑·좌표 정상·한글 원제 매칭, 얇아서 제외 ${thin.size}개)`);
  console.log(`   심화블록: 한글원제 ${tally.map} · 붐빔 ${tally.busy} · 주차대수 ${tally.trr}`
    + ` · 기간중 장날 ${tally.mkt} · 동시기 근처축제 ${tally.rel}`);
  return urls;
}

module.exports = { build };
