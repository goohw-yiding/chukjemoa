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
</style>`;

const COPY_JS = `<script>
(function(){
  if(window.__jpCopy)return; window.__jpCopy=1;
  document.addEventListener('click',function(e){
    var b=e.target.closest('.xcopy button'); if(!b)return;
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

function plCard(p) {
  const q = encodeURIComponent(p.ko || p.title);
  const hp = homepage(p.hp);
  return `<li class="jp-item">
<div class="jp-h"><b>${esc(p.title)}</b>${p.ko ? `<span class="jp-ko">${esc(p.ko)}</span>` : ''}</div>
<p class="jp-ov">${esc(String(p.ov).replace(/\s+/g, ' ').slice(0, 200))}…</p>
${cp(p.addrKo)}
<p class="jp-links"><a href="https://map.naver.com/p/search/${q}" target="_blank" rel="noopener nofollow">NAVERマップで見る →</a>${hp ? `<a href="${esc(hp)}" target="_blank" rel="noopener nofollow">公式サイト →</a>` : ''}</p>
</li>`;
}

function build({ ROOT, layout, writePage }) {
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

  const sidoNav = (exceptSlug) => made.filter(m => m.slug !== exceptSlug)
    .map(m => `<a href="/ja/places/${m.slug}/">${esc(m.ja)} (${m.n})</a>`).join('');

  for (const m of made) {
    // 시·군·구로 묶어 읽기 쉽게 — 서울 369곳을 한 덩어리로 두면 못 읽는다
    // 🔴 첫 배포에서 서울이 「その他 369か所」 한 덩어리로 나왔다. places_ja 에는 `sigungu` 필드가
    //    «아예 없다»(코드 signguCd 만 있다). 라이브를 열어 보지 않았으면 못 잡았을 것이다.
    //    → 오늘 채운 addrKo 의 둘째 토큰에서 시·군·구를 뽑는다(「서울특별시 종로구 …」 → 종로구).
    const bySg = {};
    m.list.forEach(p => { const k = sgOf(p) || 'その他'; (bySg[k] = bySg[k] || []).push(p); });
    const groups = Object.entries(bySg).sort((a, b) => b[1].length - a[1].length);
    const body = groups.map(([sg, arr]) =>
      `<h2 class="jp-sec">${esc(sg)} <span style="font-weight:600;color:#9aa3af;font-size:.9rem">${arr.length}か所</span></h2>
<ul class="jp-list">${arr.map(plCard).join('')}</ul>`).join('');

    const cityKey = CITY_PAGE[m.slug];
    const content = `<main><div class="wrap">${CSS}
<p class="jp-crumb"><a href="/ja/">ホーム</a> › <a href="/ja/places/">行ってみる場所</a> › ${esc(m.ja)}</p>
<h1 class="jp-h1">${esc(m.ja)}で行ってみる場所 ${m.n}か所 — 韓国語の住所つき</h1>
<p class="jp-lead">${esc(m.ja)}の観光スポット${m.n}か所を市・郡・区ごとにまとめました。韓国観光公社の公式日本語紹介に、
<b>地図アプリにそのまま貼り付けられる韓国語の住所</b>を添えています。${groups.length}の市・郡・区に分かれています。</p>
${WHY}
${cityKey ? `<p class="jp-lead">👉 <a href="/ja/${cityKey}/" style="color:#0c7d72;font-weight:800">${esc(m.ja)}の「今月のお祭り・行き先」ページ</a>もあります。こちらは季節で入れ替わります。</p>` : ''}
${body}
<div class="jp-others"><b>ほかの地域</b><br>${sidoNav(m.slug)}</div>
<p class="jp-note">出典：韓国観光公社（公共データポータル）。日本語の紹介文は韓国観光公社の公式翻訳です。
住所は韓国語の道路名住所で、地図アプリでの検索用にそのまま載せています。
営業時間・料金・休業日は変わることがありますので、訪問前に必ずご確認ください。</p>
</div></main>${COPY_JS}`;

    writePage('ja/places/' + m.slug, layout(
      `${m.ja}の観光スポット ${m.n}か所 — 韓国語の住所つき | Chukjemoa`,
      `${m.ja}で行ってみる場所${m.n}か所を市・郡・区別に。韓国観光公社の公式日本語紹介と、NAVER・カカオマップに貼り付けられる韓国語の住所つき。Googleマップが使えない韓国での移動に。`,
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
