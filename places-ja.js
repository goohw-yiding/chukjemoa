// 🗾 일문 「行ってみる場所」 시·도 허브 — /ja/places/ + /ja/places/{sido}/
//
// 왜 만드나 (2026-09-09 실측)
//   `places_ja.json` 3,371건 중 **2,179건(65%)이 사이트 어디에도 안 나오고 있었다.**
//   /ja/{city}/ 는 14곳뿐이고 도시당 60곳 상한이라, 도시 페이지가 없는 시·도가 통째로 빠진다
//   (서울 441 · 경기 265 · 강원 189 · 전남 164 · 경북 156 …).
//
// ⭐ 이 페이지가 «남이 못 주는 것»인 이유는 도시 페이지와 같다 —
//   구글맵은 한국 안에서 길찾기가 안 된다(지도데이터 반출 규제). 외국인은 «한글»을 복사해
//   네이버·카카오에 붙여넣어야 하는데 그 한글을 주는 곳이 거의 없다. 오늘 addrKo 를 99.5%까지 채웠다.
//
// ⚠️ 개별 장소 페이지(1,798장)는 «일부러» 안 만든다 — 애드센스 심사 중이고,
//    오일장에서 검증된 순서가 「시·도 허브 먼저, 실적 보고 개별」이다(장남 님 결정 2026-09-09).
// ⚠️ 의료관광 데이터가 섞여 있다(B&VIIT眼科·CHA医科大学…). 관광지 목록에 넣지 않는다 — 260건 제외.
// ⚠️ 재료 게이트 20건 — 얇은 시·도는 만들지 않는다(intl-city.js 의 MIN_PLACES 와 같은 기준).
'use strict';
const fs = require('fs'), path = require('path');

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const MIN = 20;                 // 시·도별 재료 게이트
const OV_MIN = 120;             // 개요 최소 길이
const KANA_MIN = 0.03;          // 「번역돼 있다」를 믿지 않는다 — 가나 비율로 잰다
// 의료관광 레코드 — 관광지 목록에 섞이면 안 된다
const MED = /医院|病院|クリニック|医科|医学研究所|眼科|歯科|整形|皮膚科|医療|メディ|美容外科|韓医院|漢方|ヘルスケア/;
const CORP = /\(株\)|（株）|株式会社|\(財\)|（財）|有限会社/;

const SIDO = [
  ['서울', 'seoul', 'ソウル'], ['부산', 'busan', '釜山'], ['대구', 'daegu', '大邱'],
  ['인천', 'incheon', '仁川'], ['광주', 'gwangju', '光州'], ['대전', 'daejeon', '大田'],
  ['울산', 'ulsan', '蔚山'], ['세종', 'sejong', '世宗'], ['경기', 'gyeonggi', '京畿道'],
  ['강원', 'gangwon', '江原道'], ['충북', 'chungbuk', '忠清北道'], ['충남', 'chungnam', '忠清南道'],
  ['전북', 'jeonbuk', '全羅北道'], ['전남', 'jeonnam', '全羅南道'], ['경북', 'gyeongbuk', '慶尚北道'],
  ['경남', 'gyeongnam', '慶尚南道'], ['제주', 'jeju', '済州道'],
];
// /ja/{city}/ 가 이미 있는 곳 — 시·도 페이지에서 그쪽으로 보낸다(중복이 아니라 동선)
const CITY_PAGE = { seoul: 'seoul', busan: 'busan', jeju: 'jeju', daegu: 'daegu', incheon: 'incheon' };

// 🔴 places_ja 에는 `sigungu` 필드가 없다 — `signguCd`(코드)만 있다.
//    첫 배포에서 서울 369곳이 「その他」 한 덩어리로 나온 원인이 이것이었다.
//    한글 도로명주소의 둘째 토큰이 시·군·구다: 「서울특별시 종로구 …」 → 종로구.
//    ⚠️ 「경기도 용인시 기흥구」처럼 시 아래 일반구가 오는 곳은 «시»까지만 묶는다(보낼 곳이 안 틀린다).
const sgOf = p => {
  const t = String(p.addrKo || '').trim().split(/\s+/);
  const k = t[1] || '';
  return /[시군구]$/.test(k) ? k : '';
};
// 시·군·구의 일본어 읽기 — 일문 주소(addr)의 둘째 토큰(「ソウル特別市 チョンノ区 …」 → チョンノ区)을
// 그 그룹에서 가장 많이 나온 것으로 고른다. 한글만 보여 주면 일본 독자가 못 읽는다.
const sgJaOf = arr => {
  const c = {};
  // ⚠️ 일문 주소는 띄어쓰기가 없다(「テグ広域市チュン区トンサン洞」) — 시·도 접미사 뒤의 가타카나+市郡区를 잡는다
  arr.forEach(p => {
    const m = String(p.addr || '').match(/(?:特別自治市|特別自治道|特別市|広域市|道)\s*([ァ-ヶー]{1,8}[市郡区])/);
    if (m) c[m[1]] = (c[m[1]] || 0) + 1;
  });
  const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : '';
};
const sgLabel = (sg, arr) => { const j = sg === 'その他' ? '' : sgJaOf(arr); return j ? `${j}（${sg}）` : sg; };
const kana = s => (String(s).match(/[ぁ-んァ-ヶ]/g) || []).length / Math.max(1, String(s).length);
const usable = p => String(p.ov || '').length >= OV_MIN
  && kana(p.ov) >= KANA_MIN
  && String(p.addrKo || '').trim()
  && !MED.test(p.title || '') && !MED.test(p.ov || '') && !CORP.test(p.title || '');

const CSS = `<style>
.jp-crumb{font-size:.85rem;color:#9aa3af;margin:8px 0}.jp-crumb a{color:#0c7d72;text-decoration:none}
.jp-h1{font-size:1.5rem;font-weight:900;letter-spacing:-.02em;margin:6px 0 8px}
.jp-lead{color:#374151;font-size:1rem;line-height:1.8;margin:0 0 14px}
.jp-why{background:#f4faf8;border:1.5px solid #dcefeb;border-radius:14px;padding:14px 17px;margin:14px 0}
.jp-why h2{font-size:1rem;font-weight:900;color:#0a6c63;margin:0 0 6px}
.jp-why p{color:#0a6c63;font-size:.94rem;line-height:1.75;margin:0}
.jp-why a{color:#0a6c63;font-weight:700}
.jp-grid{list-style:none;padding:0;margin:14px 0;display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}
.jp-grid a{display:block;background:#fff;border:1px solid #e6eaee;border-radius:12px;padding:12px 14px;text-decoration:none;color:#1f2937;font-weight:800}
.jp-grid a:hover{border-color:#0c7d72}
.jp-grid span{display:block;font-weight:600;color:#9aa3af;font-size:.84rem;margin-top:3px}
.jp-sec{font-size:1.06rem;font-weight:900;color:#0a6c63;margin:22px 0 8px;padding-top:4px;border-top:1px solid #eef2f5}
.jp-list{list-style:none;padding:0;margin:0;display:grid;gap:11px}
.jp-item{border:1px solid #e6eaee;border-radius:12px;padding:13px 15px;background:#fff}
.jp-h{font-size:1rem;line-height:1.5}
.jp-ko{color:#9aa3af;font-size:.86rem;margin-left:6px}
.jp-ov{color:#4b5563;font-size:.92rem;line-height:1.72;margin:6px 0 0}
.xcopy{display:flex;gap:8px;align-items:center;justify-content:space-between;background:#f7fafb;border:1px solid #e6eaee;border-radius:10px;padding:8px 11px;margin:8px 0 0;flex-wrap:wrap}
.xcopy .lb{display:block;font-size:.76rem;color:#9aa3af}
.xcopy .vl{display:block;font-size:.9rem;color:#1f2937;font-weight:700;word-break:keep-all}
.xcopy button{border:1px solid #0c7d72;background:#fff;color:#0c7d72;border-radius:9px;padding:6px 13px;font-size:.85rem;font-weight:800;cursor:pointer;font-family:inherit;white-space:nowrap}
.jp-links{margin:7px 0 0;font-size:.86rem}.jp-links a{color:#0c7d72;text-decoration:none;margin-right:10px}
.jp-note{color:#6b7280;font-size:.85rem;line-height:1.7;margin:18px 0 0}
.jp-others{margin:20px 0 0;font-size:.9rem;line-height:2}.jp-others a{color:#0c7d72;text-decoration:none;margin-right:12px}
.jp-tag{display:inline-block;background:#e8f5f2;color:#0a6c63;font-size:.74rem;font-weight:800;border-radius:6px;padding:1px 7px;margin-right:6px;vertical-align:2px}
.jp-mini{margin:4px 0 0 18px;padding:0;line-height:1.9;font-size:.94rem;color:#374151}.jp-mini a{color:#0c7d72;font-weight:700}
.jp-jump{font-size:.88rem;line-height:2;margin:8px 0}.jp-jump a{color:#0c7d72;text-decoration:none;margin-right:10px;white-space:nowrap}
.jp-rows{list-style:none;padding:0;margin:0;border:1px solid #e6eaee;border-radius:12px;background:#fff}
.jp-rows li{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:9px 13px;border-top:1px solid #eef2f5;font-size:.93rem}
.jp-rows li:first-child{border-top:0}
.jp-ad{display:block;color:#4b5563;font-size:.84rem;margin-top:2px;word-break:keep-all}
.jp-bt{display:flex;gap:8px;align-items:center;white-space:nowrap}.jp-bt a{color:#0c7d72;font-size:.84rem;text-decoration:none}
.jp-cp{border:1px solid #0c7d72;background:#fff;color:#0c7d72;border-radius:8px;padding:4px 9px;font-size:.8rem;font-weight:800;cursor:pointer;font-family:inherit}
</style>`;

const COPY_JS = `<script>
(function(){
  if(window.__jpCopy)return; window.__jpCopy=1;
  document.addEventListener('click',function(e){
    var b=e.target.closest('.xcopy button,.jp-cp'); if(!b)return;
    var v=b.getAttribute('data-v')||''; var done=b.getAttribute('data-done')||'コピーしました';
    var old=b.textContent;
    var ok=function(){b.textContent=done;setTimeout(function(){b.textContent=old;},1400);};
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(v).then(ok,function(){});}
    else{var t=document.createElement('textarea');t.value=v;document.body.appendChild(t);t.select();
      try{document.execCommand('copy');ok();}catch(x){}document.body.removeChild(t);}
  });
})();
</script>`;

const cp = val => val ? `<div class="xcopy"><div><span class="lb">地図に貼り付ける住所（韓国語）</span><span class="vl">${esc(val)}</span></div>
<button data-v="${esc(val)}" data-done="コピーしました">コピー</button></div>` : '';

const WHY = `<div class="jp-why"><h2>なぜ韓国語の住所を載せるのか</h2>
<p>Googleマップは韓国国内の経路検索ができません（地図データの国外持ち出し規制）。代わりに<b>韓国語の住所</b>を
<a href="https://map.naver.com/" target="_blank" rel="noopener nofollow">NAVERマップ</a>・
<a href="https://map.kakao.com/" target="_blank" rel="noopener nofollow">カカオマップ</a>に貼り付けてください。
このページの表記でそのまま検索できます。</p></div>`;

// ⚠️ 공공데이터의 hp 는 스킴이 없는 경우가 있다(`www.gyeongnam.go.kr`).
//    그대로 href 에 넣으면 «사이트 안 경로»(/www.gyeongnam.go.kr)로 읽혀 끊긴 링크가 된다.
//    첫 빌드에서 audit 이 정확히 이 1건을 잡았다. → 스킴을 붙이고, 이상하면 링크를 안 건다.
function homepage(hp) {
  let u = String(hp || '').trim();
  if (!u) return '';
  const m = u.match(/https?:\/\/[^\s"'<>]+/);      // 태그·설명이 섞여 오는 경우도 있다
  if (m) u = m[0];
  else if (/^www\.[^\s"'<>]+$/.test(u)) u = 'https://' + u;
  else return '';
  return /^https?:\/\/[^\s"'<>]+\.[a-z]{2,}/i.test(u) ? u : '';
}

function plCard(p, cat) {
  const q = encodeURIComponent(p.ko || p.title);
  const hp = homepage(p.hp);
  return `<li class="jp-item">
<div class="jp-h">${cat ? `<span class="jp-tag">${esc(cat)}</span>` : ''}<b>${esc(p.title)}</b>${p.ko ? `<span class="jp-ko">${esc(p.ko)}</span>` : ''}</div>
<p class="jp-ov">${esc(String(p.ov).replace(/\s+/g, ' ').slice(0, 160))}…</p>
${cp(p.addrKo)}
<p class="jp-links"><a href="https://map.naver.com/p/search/${q}" target="_blank" rel="noopener nofollow">NAVERマップで見る →</a>${hp ? `<a href="${esc(hp)}" target="_blank" rel="noopener nofollow">公式サイト →</a>` : ''}</p>
</li>`;
}

// ---------- 2026-10-06 「그곳만의 것」 블록 ----------
// 🔴 10/6 서치콘솔: 시·도 16장 중 13장이 한 달째 미색인. 본문 평균 4만 자.
//    원인 추정 — 카드마다 붙인 개요가 «한국관광공사 일본어 사이트와 같은 문장»이고(우리 것이 아니다),
//    지역 페이지끼리 틀이 똑같아 숫자·지명만 다른 페이지로 보였다.
//    → 위에는 «이 지역에서만 나오는 데이터»(관광지 성격·몰린 곳·이번 축제·오일장)를 올리고,
//      목록은 개요를 빼고 「이름 + 붙여넣을 한글 주소」만 남긴다(이 페이지의 진짜 쓸모가 그것이다).
const CAT_JA = c => {
  c = String(c || '');
  if (/^A010/.test(c)) return '自然';
  if (c === 'A0201') return '歴史・遺跡';
  if (c === 'A0202') return '休養・リゾート';
  if (c === 'A0203') return '体験';
  if (c === 'A0204') return '産業見学';
  if (c === 'A0205') return '建築・名所';
  if (c === 'A0206') return '博物館・文化施設';
  if (/^A03/.test(c)) return 'レジャー・スポーツ';
  if (/^A04/.test(c)) return 'ショッピング';
  return '';
};
// festivals_ja / markets_ja 의 region 표기(짧은 이름)
const SHORT = { seoul: 'ソウル', busan: '釜山', daegu: '大邱', incheon: '仁川', gwangju: '光州', daejeon: '大田',
  ulsan: '蔚山', sejong: '世宗', gyeonggi: '京畿', gangwon: '江原', chungbuk: '忠北', chungnam: '忠南',
  jeonbuk: '全北', jeonnam: '全南', gyeongbuk: '慶北', gyeongnam: '慶南', jeju: '済州' };
const ymd = s => { s = String(s || ''); return s.length === 8 ? `${+s.slice(4, 6)}/${+s.slice(6, 8)}` : ''; };
const pct = (a, b) => Math.round(a * 100 / Math.max(1, b));

function profileOf(list, nat) {
  const c = {};
  list.forEach(p => { const k = CAT_JA(p.cat); if (k) c[k] = (c[k] || 0) + 1; });
  const known = Object.values(c).reduce((a, b) => a + b, 0);
  const rank = Object.entries(c).sort((a, b) => b[1] - a[1]);
  // 전국 평균보다 비율이 가장 높은 성격 — «이 지역다운 것»
  let lift = null;
  rank.forEach(([k, n]) => {
    if (n < 5) return;
    const d = pct(n, known) - (nat[k] || 0);
    if (!lift || d > lift.d) lift = { k, n, d };
  });
  return { rank, known, lift };
}

function regionBlock(m, ctx) {
  const { nat, fests, markets, slugs, ROOT, TODAY8, groups } = ctx;
  const pf = profileOf(m.list, nat);
  const parts = [];
  // ① 관광지 성격
  if (pf.rank.length) {
    const top = pf.rank.slice(0, 3).map(([k, n]) => `${k} ${n}か所（${pct(n, pf.known)}%）`).join('、');
    const liftTxt = pf.lift && pf.lift.d >= 4
      ? `全国の平均（${nat[pf.lift.k]}%）と比べて<b>「${esc(pf.lift.k)}」の割合が${pf.lift.d}ポイント高い</b>のが${esc(m.ja)}の特徴です。` : '';
    const sgTop = groups.filter(([sg]) => sg !== 'その他' && !/全域$/.test(sg)).slice(0, 3).map(([sg, arr]) => `${esc(sgLabel(sg, arr))} ${arr.length}か所`).join('、');
    parts.push(`<div class="jp-why" style="background:#fff8ef;border-color:#f6e2c4"><h2 style="color:#9a5b12">${esc(m.ja)}はどんな場所が多い？</h2>
<p style="color:#5b4a35">種類がわかる${pf.known}か所のうち、多いのは ${esc(top)}。${liftTxt}
${sgTop ? `スポットが集まっているのは ${sgTop} で、ここを拠点にすると回りやすくなります。` : ''}</p></div>`);
  }
  // ② 이번·다음 축제 (끝나지 않은 것만)
  const fs8 = fests.filter(f => f.region === SHORT[m.slug] && String(f.end || '') >= TODAY8 && String(f.start || '') <= String(+TODAY8 + 200))   // 두 달 안에 시작하는 것까지
    // 1년 내내 하는 상설 공연(「国楽公演 1/1〜12/31」)은 «축제»가 아니다 — 90일 넘는 것은 뺀다
    .filter(f => { const d = s => new Date(+String(s).slice(0, 4), +String(s).slice(4, 6) - 1, +String(s).slice(6, 8));
      return (d(f.end) - d(f.start)) / 864e5 <= 90; })
    .sort((a, b) => String(a.start).localeCompare(String(b.start))).slice(0, 6);
  if (fs8.length) {
    const li = fs8.map(f => {
      const sl = slugs[f.id];
      const has = sl && fs.existsSync(path.join(ROOT, 'ja/festival', sl, 'index.html'));
      const name = has ? `<a href="/ja/festival/${sl}/">${esc(f.title)}</a>` : esc(f.title);
      const run = String(f.start) <= TODAY8 ? '<b style="color:#c2410c">開催中</b> ' : '';
      return `<li>${run}${name} <span class="jp-ko">${ymd(f.start)}〜${ymd(f.end)}</span></li>`;
    }).join('');
    parts.push(`<h2 class="jp-sec">${esc(m.ja)}でこれから開かれるお祭り</h2><ul class="jp-mini">${li}</ul>`);
  }
  // ③ 오일장
  const mk = markets.filter(x => x.region === SHORT[m.slug] && x.fair).slice(0, 6);
  if (mk.length) {
    const li = mk.map(x => `<li><b>${esc(x.name)}</b> <span class="jp-ko">${esc(x.fair)}</span></li>`).join('');
    parts.push(`<h2 class="jp-sec">${esc(m.ja)}の五日市・伝統市場</h2><ul class="jp-mini">${li}</ul>
<p class="jp-note" style="margin-top:6px">五日市は5日ごとに立ちます。日にちの見方は<a href="/ja/jangteo/" style="color:#0c7d72">五日市ガイド</a>へ。</p>`);
  }
  // ④ 먼저 갈 곳 — 성격별로 한 곳씩(개요가 충분한 것)
  const seen = new Set(), picks = [];
  m.list.slice().sort((a, b) => String(b.ov).length - String(a.ov).length).forEach(p => {
    const k = CAT_JA(p.cat);
    if (k && picks.length < 6 && !seen.has(k)) { seen.add(k); picks.push(p); }
  });
  if (picks.length) {
    parts.push(`<h2 class="jp-sec">まず見てほしい${picks.length}か所（種類ごとに1か所）</h2>
<ul class="jp-list">${picks.map(p => plCard(p, CAT_JA(p.cat))).join('')}</ul>`);
  }
  return parts.join('\n');
}

// 목록 한 줄 — 개요 없이 이름·한글명·주소 복사만
function plRow(p) {
  const q = encodeURIComponent(p.ko || p.title);
  return `<li><div><b>${esc(p.title)}</b>${p.ko ? `<span class="jp-ko">${esc(p.ko)}</span>` : ''}
<span class="jp-ad">${esc(p.addrKo)}</span></div>
<span class="jp-bt"><button class="jp-cp" data-v="${esc(p.addrKo)}" data-done="OK">住所コピー</button><a href="https://map.naver.com/p/search/${q}" target="_blank" rel="noopener nofollow">地図</a></span></li>`;
}

function build({ ROOT, layout, writePage, TODAY }) {
  let all = [];
  try { all = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/places_ja.json'), 'utf8')); }
  catch (e) { return []; }
  const ok = all.filter(usable);
  const URLS = [];

  // 시·도별로 나눈다. 게이트를 넘은 것만 만든다.
  const made = [];
  for (const [ko, slug, ja] of SIDO) {
    const list = ok.filter(p => String(p.sido || '').trim() === ko);
    if (list.length < MIN) continue;
    made.push({ ko, slug, ja, n: list.length, list });
  }
  const total = made.reduce((a, b) => a + b.n, 0);

  // 전국 평균 성격 비율 — 지역마다 «평균보다 많은 것»을 찾는 기준
  const natC = {}; let natN = 0;
  made.forEach(m => m.list.forEach(p => { const k = CAT_JA(p.cat); if (k) { natC[k] = (natC[k] || 0) + 1; natN++; } }));
  const nat = {}; Object.entries(natC).forEach(([k, n]) => { nat[k] = pct(n, natN); });
  const rd = f => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')); } catch (e) { return f.endsWith('slugs.json') ? {} : []; } };
  const fests = rd('festivals_ja.json'), markets = rd('markets_ja.json'), slugs = rd('ja_festival_slugs.json');
  const TODAY8 = String(TODAY || new Date().toISOString().slice(0, 10)).replace(/-/g, '');

  const sidoNav = (exceptSlug) => made.filter(m => m.slug !== exceptSlug)
    .map(m => `<a href="/ja/places/${m.slug}/">${esc(m.ja)} (${m.n})</a>`).join('');

  for (const m of made) {
    // 시·군·구로 묶어 읽기 쉽게 — 서울 369곳을 한 덩어리로 두면 못 읽는다
    // 🔴 첫 배포에서 서울이 「その他 369か所」 한 덩어리로 나왔다. places_ja 에는 `sigungu` 필드가
    //    «아예 없다»(코드 signguCd 만 있다). 라이브를 열어 보지 않았으면 못 잡았을 것이다.
    //    → 오늘 채운 addrKo 의 둘째 토큰에서 시·군·구를 뽑는다(「서울특별시 종로구 …」 → 종로구).
    const bySg = {};
    m.list.forEach(p => { const k = sgOf(p) || 'その他'; (bySg[k] = bySg[k] || []).push(p); });
    let groups = Object.entries(bySg).sort((a, b) => b[1].length - a[1].length);
    // 세종처럼 시·군·구가 없는 곳은 「その他」 한 덩어리가 된다 — 이름을 지역 전체로
    if (groups.length === 1 && groups[0][0] === 'その他') groups = [[`${m.ja}全域`, groups[0][1]]];
    const top = regionBlock(m, { nat, fests, markets, slugs, ROOT, TODAY8, groups });
    const jump = groups.map(([sg, arr], i) => `<a href="#sg${i}">${esc(sgLabel(sg, arr))} ${arr.length}</a>`).join('');
    const body = `<h2 class="jp-sec">市・郡・区別 全${m.n}か所 — 住所をコピーして地図アプリへ</h2>
<p class="jp-jump">${jump}</p>` + groups.map(([sg, arr], i) =>
      `<h3 class="jp-sec" id="sg${i}" style="font-size:.98rem">${esc(sgLabel(sg, arr))} <span style="font-weight:600;color:#9aa3af;font-size:.86rem">${arr.length}か所</span></h3>
<ul class="jp-rows">${arr.map(plRow).join('')}</ul>`).join('');

    const cityKey = CITY_PAGE[m.slug];
    const content = `<main><div class="wrap">${CSS}
<p class="jp-crumb"><a href="/ja/">ホーム</a> › <a href="/ja/places/">行ってみる場所</a> › ${esc(m.ja)}</p>
<h1 class="jp-h1">${esc(m.ja)}で行ってみる場所 ${m.n}か所 — 韓国語の住所つき</h1>
<p class="jp-lead">${esc(m.ja)}の観光スポット${m.n}か所を、${groups.length}の市・郡・区ごとに一覧にしました。どれも
<b>地図アプリにそのまま貼り付けられる韓国語の住所</b>つきです。一覧の前に、${esc(m.ja)}にどんな種類の場所が多いか、
これからのお祭りや五日市をまとめています。</p>
${cityKey ? `<p class="jp-lead">👉 <a href="/ja/${cityKey}/" style="color:#0c7d72;font-weight:800">${esc(m.ja)}の「今月のお祭り・行き先」ページ</a>もあります。こちらは季節で入れ替わります。</p>` : ''}
${top}
${WHY}
${body}
<div class="jp-others"><b>ほかの地域</b><br>${sidoNav(m.slug)}</div>
<p class="jp-note">出典：韓国観光公社（公共データポータル）。日本語の紹介文は韓国観光公社の公式翻訳です。
住所は韓国語の道路名住所で、地図アプリでの検索用にそのまま載せています。
営業時間・料金・休業日は変わることがありますので、訪問前に必ずご確認ください。</p>
</div></main>${COPY_JS}`;

    writePage('ja/places/' + m.slug, layout(
      `${m.ja}の観光スポット ${m.n}か所 — 韓国語の住所つき | Chukjemoa`,
      `${m.ja}で行ってみる場所${m.n}か所を市・郡・区別に一覧。どんな種類の場所が多いか、これからのお祭り・五日市と、NAVER・カカオマップに貼り付けられる韓国語の住所つき。`,
      `/ja/places/${m.slug}/`, content, { lang: 'ja' }));
    URLS.push(`/ja/places/${m.slug}/`);
  }

  // ---------- 허브 ----------
  // ⚠️ 첫 판에서 허브 본문이 969자였다 — 사이트 자체 「얇은 페이지」 기준(2,000자)에 걸린다.
  //    그런데 허브야말로 「韓国 観光スポット」 같은 머리말을 받을 자리다.
  //    → 카드에 «그 지역에 무엇이 있는지»를 데이터로 붙인다. 문장을 지어내지 않고 이름을 보여 준다.
  const sorted = made.slice().sort((a, b) => b.n - a.n);
  const cards = sorted.map(m => {
    const sg = new Set(m.list.map(sgOf).filter(Boolean));
    const top = m.list.filter(p => String(p.ov || '').length >= 250).slice(0, 3).map(p => p.title);
    const names = (top.length ? top : m.list.slice(0, 3).map(p => p.title)).join(' · ');
    return `<li><a href="/ja/places/${m.slug}/">${esc(m.ja)}<span>${m.n}か所 / ${sg.size}の市・郡・区</span>
<span style="margin-top:5px;color:#6b7280;line-height:1.6">${esc(names.slice(0, 70))}…</span></a></li>`;
  }).join('');
  const bigThree = sorted.slice(0, 3).map(m => `${m.ja}（${m.n}）`).join('・');
  const hub = `<main><div class="wrap">${CSS}
<p class="jp-crumb"><a href="/ja/">ホーム</a> › 行ってみる場所</p>
<h1 class="jp-h1">韓国で行ってみる場所 ${total}か所 — 地域別・韓国語の住所つき</h1>
<p class="jp-lead">韓国観光公社が日本語で紹介している観光スポット${total}か所を、${made.length}の地域に分けてまとめました。
それぞれに<b>地図アプリへ貼り付けられる韓国語の住所</b>が付いています。数が多いのは ${esc(bigThree)} で、
ソウルや釜山だけでなく、京畿道・江原道・全羅南道のように日本語の情報が少ない地域もそろえました。</p>
${WHY}
<h2 class="jp-sec">地域を選ぶ</h2>
<p class="jp-lead" style="margin-bottom:6px">各地域のページでは、市・郡・区ごとにまとめてあります。地名がわからなくても上から順に見ていけます。</p>
<ul class="jp-grid">${cards}</ul>
<h2 class="jp-sec">地域ごとの「らしさ」— 全国平均より多い種類</h2>
<p class="jp-lead" style="margin-bottom:6px">観光公社が分類している種類（自然・歴史・博物館など）の割合を、全国平均と比べました。行き先選びの目安にどうぞ。</p>
<ul class="jp-mini">${sorted.map(m => { const pf = profileOf(m.list, nat); const l = pf.lift;
    return `<li><a href="/ja/places/${m.slug}/">${esc(m.ja)}</a>：${l && l.d >= 4 ? `「${esc(l.k)}」が全国平均より${l.d}ポイント多い` : `種類のかたよりが小さく、まんべんなくそろう`}（いちばん多いのは${esc((pf.rank[0] || ['—'])[0])}）</li>`; }).join('')}</ul>
<h2 class="jp-sec">このページの使い方</h2>
<p class="jp-lead">① 行きたい地域を開く → ② 気になる場所の<b>「コピー」ボタン</b>で韓国語の住所をコピー →
③ <a href="https://map.naver.com/" target="_blank" rel="noopener nofollow">NAVERマップ</a>か
<a href="https://map.kakao.com/" target="_blank" rel="noopener nofollow">カカオマップ</a>に貼り付け。これだけで経路が出ます。<br>
韓国ではGoogleマップの経路検索が使えないため、日本から来た方がいちばん最初につまずくのがここです。
タクシーの運転手さんに画面を見せる場合も、韓国語の住所がそのまま通じます。</p>
<h2 class="jp-sec">お祭りや市場もいっしょに</h2>
<p class="jp-lead">同じ日程で<a href="/ja/festival/">お祭り</a>や<a href="/ja/jangteo/">五日市（伝統市場）</a>が開かれていることがあります。
五日市は毎日ではなく<b>5日ごと</b>に立つので、日にちが合うかどうかを先に確認しておくと無駄足になりません。
都市単位で見たい方は<a href="/ja/cities/">都市別ページ</a>もあります。</p>
<p class="jp-note">出典：韓国観光公社（公共データポータル）。紹介文は韓国観光公社の公式日本語訳です。
医療機関は観光スポットではないため除いています。
営業時間・料金・休業日は変わることがありますので、訪問前に必ずご確認ください。</p>
</div></main>${COPY_JS}`;
  writePage('ja/places', layout(
    `韓国の観光スポット ${total}か所 — 地域別・韓国語の住所つき | Chukjemoa`,
    `韓国観光公社の日本語紹介つき観光スポット${total}か所を地域別に。NAVERマップ・カカオマップへ貼り付けられる韓国語の住所つきなので、Googleマップが使えない韓国でも迷いません。`,
    '/ja/places/', hub, { lang: 'ja' }));
  URLS.push('/ja/places/');

  console.log(`✓ /ja/places/ — 시·도 ${made.length}곳 · 장소 ${total}건`
    + ` (전체 ${all.length} 중 게이트 통과 ${ok.length}, 시·도 20건 미만 제외)`);
  console.log('   ' + made.map(m => `${m.ko}${m.n}`).join(' · '));
  return URLS;
}

module.exports = { build };
