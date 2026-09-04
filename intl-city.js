// 🌏 외국어 도시 페이지 — /{lang}/{city}/  (서울·부산·제주 × en·ja·zh·tw·es)
//
// 왜 이 구성인가 — 실측이 「축제 목록」을 부정했다 (2026-09-04)
//   장남 님: 「서울·부산·제주는 외국어 페이지도 좀 더 심도있게」. 그래서 재료를 먼저 셌더니 —
//   ⚠️ **외국어 «축제»는 진행·예정 기준 서울 en 6·ja 4 · 부산 3 · 제주 1건뿐**이다. 축제로는 페이지가 안 선다.
//   ⭐ 본체는 `places_{lang}` 이다 — **공식 번역 개요 + 한글 원제 + 한글 도로명주소**를 가진 곳들.
//     서울 en 199/ja 264 · 부산 85/89 · 제주 111/111. 제주는 축제가 없어도 이걸로 만들 수 있다.
//
// ⭐ 그리고 이 페이지가 «남이 못 쓰는 것»인 이유:
//   **구글맵은 한국 안에서 길찾기가 안 된다**(지도데이터 반출 규제). 그래서 외국인은 이름을 복사해
//   네이버·카카오 지도에 붙여넣어야 하는데, 그 «붙여넣을 한글»을 주는 곳이 거의 없다. 우리는 준다.
//
// ⚠️ **재료 게이트** — 장소 20곳 미만이고 축제도 15건 미만이면 **만들지 않는다.**
//    5개어를 다 켜 두되(장남 님 결정), 재료가 찬 조합만 나간다. 얇은 페이지는 애드센스 심사에 해롭다.
//    → 중문·서어는 `fetch-places.js zh|tw|es` 로 개요가 쌓이면 «저절로» 열린다.
const fs = require('fs'), path = require('path');

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CITIES = [
  { key: 'seoul', sido: '서울', ko: '서울', match: ['서울', 'Seoul', 'ソウル', '首尔', '首爾', 'Seúl'] },
  { key: 'busan', sido: '부산', ko: '부산', match: ['부산', 'Busan', '釜山'] },
  { key: 'jeju', sido: '제주', ko: '제주', match: ['제주', 'Jeju', '済州', '济州', '濟州'] }
];

const T = {
  en: {
    city: { seoul: 'Seoul', busan: 'Busan', jeju: 'Jeju' },
    h1: c => `${c} — Festivals & Places Worth Going`,
    lead: (c, n, f) => `${n} places in ${c} described in English by the Korea Tourism Organization${f ? `, plus ${f} festivals happening now` : ''}. Every entry comes with the <b>Korean address you can paste into a map app</b>.`,
    whyT: 'Why we give you Korean addresses',
    why: 'Google Maps cannot give driving or transit directions inside South Korea — map data cannot be exported. Paste the Korean address (or the Korean name) into <b>NAVER Map</b> or <b>KakaoMap</b> instead. Both work with what is on this page, and they are what people here actually use.',
    fesT: 'Festivals on now',
    placeT: c => `Places to go in ${c}`,
    addr: 'Korean address for map apps', name: 'Korean name for map search',
    copy: 'Copy', copied: 'Copied',
    when: 'Dates', where: 'Where', fee: 'Admission', how: 'Getting there', free: 'Free',
    more: 'More', other: 'Other cities', srcT: 'Sources',
    src: 'Places and festival descriptions: Korea Tourism Organization (official English translation). Korean addresses come from Korean public data matched by name. Opening hours and admission can change — check the official page before you go.',
    title: (c, m) => `${c} in ${m} — Festivals, Places & Korean Addresses`,
    desc: (c, n) => `${n} places to visit in ${c}, each with the Korean address you can paste into NAVER Map or KakaoMap. Festivals on now, weather, and what to know before you go.`
  },
  ja: {
    city: { seoul: 'ソウル', busan: '釜山', jeju: '済州' },
    h1: c => `${c} — お祭りと行ってみる価値のある場所`,
    lead: (c, n, f) => `韓国観光公社が日本語で案内している${c}の${n}か所${f ? `と、いま開催中のお祭り${f}件` : ''}です。すべてに<b>地図アプリにそのまま貼り付けられる韓国語の住所</b>を付けました。`,
    whyT: 'なぜ韓国語の住所を載せるのか',
    why: 'Googleマップは韓国国内の経路検索ができません（地図データの国外持ち出し規制）。代わりに韓国語の住所（または韓国語の名前）を<b>NAVERマップ</b>・<b>カカオマップ</b>に貼り付けてください。このページの表記でそのまま検索できます。',
    fesT: '開催中のお祭り',
    placeT: c => `${c}で行ってみる場所`,
    addr: '地図に貼り付ける住所（韓国語）', name: '地図検索用の韓国語名',
    copy: 'コピー', copied: 'コピーしました',
    when: '期間', where: '場所', fee: '料金', how: '行き方', free: '無料',
    more: 'もっと見る', other: 'ほかの都市', srcT: '出典',
    src: '場所とお祭りの説明は韓国観光公社の日本語案内です。韓国語の住所は韓国語の公開データと名前で突き合わせて付けました。営業時間や料金は変わることがあるので、出発前に公式ページでご確認ください。',
    title: (c, m) => `${c} ${m} — お祭り・行き先・韓国語の住所`,
    desc: (c, n) => `${c}で行ける${n}か所を、NAVERマップやカカオマップに貼り付けられる韓国語の住所付きで。開催中のお祭り、天気、行く前に知っておくことも。`
  },
  zh: {
    city: { seoul: '首尔', busan: '釜山', jeju: '济州' },
    h1: c => `${c} — 庆典与值得一去的地方`,
    lead: (c, n, f) => `韩国观光公社以中文介绍的${c}${n}处${f ? `，以及正在举办的${f}个庆典` : ''}。每一条都附上<b>可直接粘贴到地图应用的韩文地址</b>。`,
    whyT: '为什么我们提供韩文地址',
    why: '谷歌地图在韩国境内无法提供路线导航（地图数据出境限制）。请把韩文地址（或韩文名称）粘贴到<b>NAVER地图</b>或<b>Kakao地图</b>，本页的写法可以直接搜索。',
    fesT: '正在举办的庆典', placeT: c => `${c}可以去的地方`,
    addr: '粘贴到地图的地址（韩文）', name: '地图搜索用韩文名称',
    copy: '复制', copied: '已复制',
    when: '时间', where: '地点', fee: '费用', how: '交通', free: '免费',
    more: '更多', other: '其他城市', srcT: '资料来源',
    src: '地点与庆典说明来自韩国观光公社的中文介绍。韩文地址由韩文公开数据按名称匹配而来。营业时间与费用可能变动，出发前请确认官方页面。',
    title: (c, m) => `${c} ${m} — 庆典·景点·韩文地址`,
    desc: (c, n) => `${c}值得一去的${n}处，附可粘贴到NAVER地图或Kakao地图的韩文地址。正在举办的庆典与出发前须知。`
  },
  tw: {
    city: { seoul: '首爾', busan: '釜山', jeju: '濟州' },
    h1: c => `${c} — 慶典與值得一去的地方`,
    lead: (c, n, f) => `韓國觀光公社以中文介紹的${c}${n}處${f ? `，以及正在舉辦的${f}個慶典` : ''}。每一條都附上<b>可直接貼到地圖應用的韓文地址</b>。`,
    whyT: '為什麼我們提供韓文地址',
    why: 'Google地圖在韓國境內無法提供路線導航（地圖資料出境限制）。請把韓文地址（或韓文名稱）貼到<b>NAVER地圖</b>或<b>Kakao地圖</b>，本頁的寫法可以直接搜尋。',
    fesT: '正在舉辦的慶典', placeT: c => `${c}可以去的地方`,
    addr: '貼到地圖的地址（韓文）', name: '地圖搜尋用韓文名稱',
    copy: '複製', copied: '已複製',
    when: '時間', where: '地點', fee: '費用', how: '交通', free: '免費',
    more: '更多', other: '其他城市', srcT: '資料來源',
    src: '地點與慶典說明來自韓國觀光公社的中文介紹。韓文地址由韓文公開資料按名稱比對而來。營業時間與費用可能變動，出發前請確認官方頁面。',
    title: (c, m) => `${c} ${m} — 慶典·景點·韓文地址`,
    desc: (c, n) => `${c}值得一去的${n}處，附可貼到NAVER地圖或Kakao地圖的韓文地址。正在舉辦的慶典與出發前須知。`
  },
  es: {
    city: { seoul: 'Seúl', busan: 'Busan', jeju: 'Jeju' },
    h1: c => `${c} — Fiestas y lugares que vale la pena visitar`,
    lead: (c, n, f) => `${n} lugares de ${c} descritos en español por la Organización de Turismo de Corea${f ? `, y ${f} fiestas en curso` : ''}. Cada entrada incluye <b>la dirección en coreano que puedes pegar en una app de mapas</b>.`,
    whyT: 'Por qué damos direcciones en coreano',
    why: 'Google Maps no ofrece indicaciones dentro de Corea del Sur (los datos de mapas no pueden exportarse). Pega la dirección en coreano (o el nombre coreano) en <b>NAVER Map</b> o <b>KakaoMap</b>: funcionan con lo que ves en esta página.',
    fesT: 'Fiestas en curso', placeT: c => `Lugares para ir en ${c}`,
    addr: 'Dirección en coreano para mapas', name: 'Nombre coreano para buscar',
    copy: 'Copiar', copied: 'Copiado',
    when: 'Fechas', where: 'Dónde', fee: 'Entrada', how: 'Cómo llegar', free: 'Gratis',
    more: 'Más', other: 'Otras ciudades', srcT: 'Fuentes',
    src: 'Lugares y descripciones: Organización de Turismo de Corea (traducción oficial). Las direcciones en coreano provienen de datos públicos coreanos emparejados por nombre. Horarios y precios pueden cambiar: confirma en la página oficial antes de ir.',
    title: (c, m) => `${c} en ${m} — fiestas, lugares y direcciones en coreano`,
    desc: (c, n) => `${n} lugares para visitar en ${c}, con la dirección en coreano lista para pegar en NAVER Map o KakaoMap. Fiestas en curso y qué saber antes de ir.`
  }
};

const MONTH = {
  en: ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ja: ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  zh: ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  tw: ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  es: ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
};

const MIN_PLACES = 20, MIN_FESTS = 15, SHOW_PLACES = 40, SHOW_FESTS = 12;

function load(ROOT, f) {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')); } catch (e) { return null; }
}

function build({ ROOT, layout, writePage, SITE, TODAY, WX }) {
  const T8 = String(TODAY).replace(/-/g, '');
  const mn = +T8.slice(4, 6);
  const busan = load(ROOT, 'busan_festivals.json');
  const urls = [];
  const skipped = [];

  for (const lang of ['en', 'ja', 'zh', 'tw', 'es']) {
    const t = T[lang];
    const places = load(ROOT, `places_${lang}.json`) || [];
    const fests = load(ROOT, `festivals_${lang}.json`) || [];

    for (const C of CITIES) {
      // ── 재료 모으기
      const P = places.filter(p => p.sido === C.sido && +p.x && +p.y
        && String(p.ov || '').length >= 120 && p.addrKo);
      let F = fests.filter(f => String(f.end || '') >= T8
        && C.match.some(k => String(f.region || '').includes(k) || String(f.addr || '').includes(k)))
        .map(f => ({ title: f.title, start: f.start, end: f.end, place: f.addr, img: f.img, x: f.x, y: f.y, ko: '', desc: '', traffic: '', fee: '' }));

      // ⭐ 부산만 «공식 5개어 번역»이 따로 있다 — 우선 쓴다(교통안내·요금·한글원제까지 붙는다).
      if (C.key === 'busan' && busan && busan.rows) {
        const bf = busan.rows.filter(r => r.langs && r.langs[lang] && r.langs[lang].title)
          .map(r => ({
            title: r.langs[lang].title, sub: r.langs[lang].sub, ko: r.ko,
            place: r.langs[lang].place, day: r.langs[lang].day, time: r.langs[lang].time,
            fee: r.langs[lang].fee, traffic: r.langs[lang].traffic,
            desc: r.langs[lang].desc, img: r.img, x: r.x, y: r.y
          }));
        if (bf.length) F = bf;
      }

      // ── 게이트: 재료가 없으면 «만들지 않는다»
      if (P.length < MIN_PLACES && F.length < MIN_FESTS) {
        skipped.push(`${lang}/${C.key}(장소 ${P.length}·축제 ${F.length})`);
        continue;
      }

      const city = t.city[C.key];
      const cp = (label, val) => val ? `<div class="xcopy"><div><span class="lb">${esc(label)}</span><span class="vl">${esc(val)}</span></div>
<button data-v="${esc(val)}" data-done="${esc(t.copied)}">${esc(t.copy)}</button></div>` : '';

      const fesCard = f => {
        const wx = (WX && f.x && f.y) ? WX.now(f.x, f.y) : '';
        const dates = f.start ? `${String(f.start).slice(4, 6)}/${String(f.start).slice(6, 8)} – ${String(f.end).slice(4, 6)}/${String(f.end).slice(6, 8)}` : (f.day || '');
        return `<li class="ic-item">
<div class="ic-h"><b>${esc(f.title)}</b>${f.ko ? `<span class="ic-ko">${esc(f.ko)}</span>` : ''}${wx}</div>
${f.sub ? `<p class="ic-sub">${esc(f.sub)}</p>` : ''}
<p class="ic-meta">${dates ? `📅 ${esc(t.when)}: ${esc(dates)}` : ''}${f.place ? ` · 📍 ${esc(String(f.place).slice(0, 60))}` : ''}${f.fee ? ` · 💳 ${esc(String(f.fee).slice(0, 50))}` : ''}</p>
${f.desc ? `<p class="ic-ov">${esc(String(f.desc).slice(0, 260))}</p>` : ''}
${f.traffic ? `<p class="ic-tr">🚇 ${esc(t.how)}: ${esc(String(f.traffic).slice(0, 200))}</p>` : ''}
${cp(t.name, f.ko)}
</li>`;
      };

      const plCard = p => `<li class="ic-item">
<div class="ic-h"><b>${esc(p.title)}</b>${p.ko ? `<span class="ic-ko">${esc(p.ko)}</span>` : ''}</div>
<p class="ic-ov">${esc(String(p.ov).replace(/\s+/g, ' ').slice(0, 190))}…</p>
${cp(t.addr, p.addrKo)}
</li>`;

      const others = CITIES.filter(o => o.key !== C.key)
        .map(o => `<a href="/${lang}/${o.key}/">${esc(t.city[o.key])}</a>`).join('');

      const content = `<main><div class="wrap">${CSS}
<p class="ic-crumb"><a href="/${lang}/">${lang === 'ja' ? 'ホーム' : lang === 'zh' ? '首页' : lang === 'tw' ? '首頁' : lang === 'es' ? 'Inicio' : 'Home'}</a> › ${esc(city)}</p>
<h1 class="ic-h1">${esc(t.h1(city))}</h1>
<p class="ic-lead">${t.lead(esc(city), P.length, F.length)}</p>

<div class="ic-why"><h2>${esc(t.whyT)}</h2><p>${t.why}</p></div>

${F.length ? `<h2 class="sec">${esc(t.fesT)}</h2>
<ul class="ic-list">${F.slice(0, SHOW_FESTS).map(fesCard).join('')}</ul>` : ''}

${P.length ? `<h2 class="sec">${esc(t.placeT(city))}</h2>
<ul class="ic-list">${P.slice(0, SHOW_PLACES).map(plCard).join('')}</ul>` : ''}

<h2 class="sec">${esc(t.other)}</h2>
<div class="ic-nav">${others}</div>

<p class="ic-src"><b>${esc(t.srcT)}</b> — ${esc(t.src)}</p>
</div></main>`;

      writePage(`${lang}/${C.key}`, layout(
        t.title(city, MONTH[lang][mn]),
        t.desc(city, P.length),
        `/${lang}/${C.key}/`, content, { lang }));
      urls.push(`/${lang}/${C.key}/`);
    }
  }

  console.log(`✓ /{lang}/{city}/ — ${urls.length}페이지`);
  if (skipped.length) console.log(`   재료 부족으로 «만들지 않음» ${skipped.length}개: ${skipped.join(' · ')}`);
  return urls;
}

const CSS = `<style>
.ic-crumb{font-size:.85rem;color:#9aa3af;margin:8px 0}
.ic-crumb a{color:#0c7d72}
.ic-h1{font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:6px 0 8px}
.ic-lead{color:#374151;font-size:1rem;line-height:1.8;margin:0 0 14px}
.ic-why{background:#f4faf8;border:1.5px solid #dcefeb;border-radius:14px;padding:14px 17px;margin:14px 0}
.ic-why h2{font-size:1rem;font-weight:900;color:#0a6c63;margin:0 0 6px}
.ic-why p{color:#0a6c63;font-size:.94rem;line-height:1.75;margin:0}
.ic-list{list-style:none;padding:0;margin:0;display:grid;gap:11px}
.ic-item{border:1px solid #e6eaee;border-radius:12px;padding:13px 15px;background:#fff}
.ic-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px}
.ic-h b{font-size:1rem;font-weight:800;color:#111827}
.ic-ko{font-size:.84rem;color:#6b7280;font-weight:700}
.ic-sub{font-size:.9rem;color:#0a6c63;font-weight:700;margin:0 0 5px}
.ic-meta{font-size:.85rem;color:#6b7280;margin:0 0 6px;line-height:1.6}
.ic-ov{font-size:.9rem;line-height:1.7;color:#374151;margin:0 0 8px}
.ic-tr{font-size:.86rem;line-height:1.65;color:#374151;background:#f7fafc;border-radius:8px;padding:8px 10px;margin:0 0 8px}
.ic-nav{display:flex;flex-wrap:wrap;gap:8px}
.ic-nav a{display:inline-block;padding:9px 16px;border-radius:22px;background:#fff;border:1.5px solid #dfe6ea;color:#374151;font-weight:800;font-size:.92rem;text-decoration:none}
.ic-src{font-size:.8rem;color:#9aa3af;line-height:1.7;margin-top:18px}
.xcopy{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;
  background:#f6fbfa;border:1.5px solid #dcefeb;border-radius:12px;padding:10px 12px;margin:6px 0}
.xcopy .lb{font-size:.74rem;font-weight:800;color:#0a6c63;display:block;margin-bottom:3px}
.xcopy .vl{font-size:.98rem;font-weight:800;color:#111827;word-break:keep-all;line-height:1.45}
.xcopy button{background:#0f9d8f;color:#fff;border:0;border-radius:9px;padding:9px 14px;font-weight:800;font-size:.84rem;cursor:pointer;white-space:nowrap}
</style>
<script>
if(!window.__xcopyBound){window.__xcopyBound=1;
document.addEventListener('click',function(e){
  var b=e.target.closest('.xcopy button'); if(!b) return;
  var t=b.getAttribute('data-v')||'';
  var done=function(){var o=b.textContent;b.textContent=b.getAttribute('data-done')||'OK';
    setTimeout(function(){b.textContent=o;},1400);};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,function(){});}
  else{var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);
    ta.select();try{document.execCommand('copy');done();}catch(_){}document.body.removeChild(ta);}
});}
</script>`;

module.exports = { build };
