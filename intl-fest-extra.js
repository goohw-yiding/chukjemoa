// 🌏 외국어 축제 상세의 «우리만 가진 정보» 블록 (영문·일문 공용)
//
// 왜 만들었나 (2026-09-01 실측)
//   GSC 90일: 개별 축제 영문명이 실제로 검색된다 — andong maskdance(2개국)·jeongseon arirang(4개국)·
//   cheonan world dance(3개국)·daegwallyeong snow(6개국)… 순위는 이미 6~10위인데 **클릭 0**이고
//   노출도 한 자릿수다. 페이지에 「공식 개요 한 문단 + 지도 링크」밖에 없으니 더 오를 이유가 없다.
//   반대로 순위가 45~85위인 건 「korean festivals」 같은 머리말이다.
//   → 새 장르를 만들 게 아니라, **이미 검색되는 축제 페이지에 남이 못 쓰는 것을 넣는다.**
//
// 넣는 것 — 전부 우리 데이터에서 계산한다. 지어내지 않는다.
//   ① 한글 원제·한글 주소  : 네이버/카카오 지도는 한글로 검색해야 제대로 나온다. 외국인이 제일 막히는 지점.
//                          영문 축제와 한국어 축제는 ID가 0% 일치라 **좌표(소수3자리)+시작일**로 잇는다.
//   ② 얼마나 붐비나        : 관광 빅데이터 시군구 월별 배수. 「그 달」이 있으면 그 달을 쓴다.
//   ③ 근처 관광지 주차 대수 : 행안부 표준데이터. 「주차 있음」이 아니라 「408대」라고 쓸 수 있는 유일한 자료.
//   ④ 축제 기간의 오일장 날 : 끝자리 규칙으로 **실제 날짜**를 계산해 준다(409곳 전부 끝자리 5간격 검증됨).
//   ⑤ 같은 시기 근처 축제   : 같은 언어 데이터 안에서만 — 번역 없는 축제를 영문 페이지에 흘리지 않는다.
//
// ⚠️ 장날은 «틀리면 최악»이다(날짜 믿고 오는 사람이 헛걸음한다). daysNum 이 끝자리 2개·간격 5가
//    아니면 그 시장은 통째로 건너뛴다.
const fs = require('fs'), path = require('path');

function load(f) {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); }
  catch (e) { return []; }
}
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 하버사인 (km)
function hav(x1, y1, x2, y2) {
  const R = 6371, r = Math.PI / 180;
  const dLa = (y2 - y1) * r, dLo = (x2 - x1) * r;
  const a = Math.sin(dLa / 2) ** 2 +
    Math.cos(y1 * r) * Math.cos(y2 * r) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
const num = v => { const n = Number(v); return isFinite(n) ? n : 0; };
const ok = (x, y) => num(x) > 124 && num(x) < 132 && num(y) > 33 && num(y) < 39;

// ── 공용 데이터 (모듈 로드 시 1회)
const KO = load('festivals_api.json');
const TRR = load('trrsrt.json').filter(t => ok(t.x, t.y));
const MKT = load('markets_std.json').filter(m =>
  ok(m.x, m.y) && Array.isArray(m.daysNum) && m.daysNum.length === 2 &&
  Math.abs(m.daysNum[0] - m.daysNum[1]) === 5);

// 한국어 축제 색인 — 좌표(소수3자리)+시작일이 1순위, 좌표만이 2순위
const k3 = (x, y) => num(x).toFixed(3) + ',' + num(y).toFixed(3);
const KO_BY_XY_D = {}, KO_BY_XY = {};
KO.forEach(f => {
  if (!ok(f.x, f.y)) return;
  KO_BY_XY_D[k3(f.x, f.y) + '|' + f.start] = f;
  if (!KO_BY_XY[k3(f.x, f.y)]) KO_BY_XY[k3(f.x, f.y)] = f;
});
const koMatch = f => (ok(f.x, f.y) &&
  (KO_BY_XY_D[k3(f.x, f.y) + '|' + f.start] || KO_BY_XY[k3(f.x, f.y)])) || null;

// 붐빔 — 시군구 이름 → { 월: 배수 }
const VIS = (() => { try { return load('visitors.json'); } catch (e) { return {}; } })();
const BUSY = {};
const VM = (VIS.seasonByMonth && VIS.seasonByMonth.months) || {};
Object.keys(VM).forEach(m => (VM[m] || []).forEach(r => {
  (BUSY[r.name] = BUSY[r.name] || {})[+m] = r.idx;
}));
const BUSY_MONTHS = Object.keys(VM).map(Number).filter(n => n >= 1 && n <= 12).sort((a, b) => a - b);

// 주소에서 시군구 뽑기 (한글 주소 기준)
function sgOf(addr) {
  const m = String(addr || '').match(/([가-힣]+(?:시|군|구))(?!\S)/g);
  if (!m) return '';
  // 「서울특별시 성북구」에서는 뒤쪽(성북구), 「안동시」 하나면 그것
  return m.length > 1 ? m[m.length - 1] : m[0];
}

// 축제 기간 안에 실제로 장이 서는 날짜 (끝자리 규칙)
function marketDates(daysNum, start, end) {
  const out = [];
  const d = new Date(+start.slice(0, 4), +start.slice(4, 6) - 1, +start.slice(6, 8));
  const e = new Date(+end.slice(0, 4), +end.slice(4, 6) - 1, +end.slice(6, 8));
  let guard = 0;
  while (d <= e && guard++ < 400) {
    const dd = d.getDate(), last = dd % 10;
    if (daysNum.some(n => (n % 10) === last)) {
      out.push({ m: d.getMonth() + 1, d: dd });
    }
    d.setDate(dd + 1);
  }
  return out;
}

// ── 언어 문안. 번역이 아니라 «그 언어 독자에게 맞는 말»로 따로 쓴다.
const MN_EN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TEXT = {
  en: {
    mapT: '🇰🇷 Copy this into Naver Map or Kakao Map',
    mapL: 'Google Maps cannot give walking or transit directions inside Korea — Korean law restricts map-data export. Naver Map and Kakao Map can, but they find far more when you search in Korean. Copy and paste:',
    mapN: 'Festival name (Korean)', mapA: 'Address (Korean)',
    copy: 'Copy', copied: 'Copied',
    busyT: '📊 How busy this area gets',
    busyL: n => `Visitor-volume index for ${n}, from Korea Tourism Organization big data. 1.00 = that area's own yearly average, so this compares the area against itself — not against Seoul.`,
    mo: m => MN_EN[m],
    busyNote: 'The index covers the whole district, not the festival ground itself. Use it to pick a month, not a day.',
    quiet: 'quietest of the months we have',
    trrT: '🅿️ Nearby attractions — with actual parking capacity',
    trrL: 'Most sites only say "parking available." These are official figures from the Ministry of the Interior and Safety, so you can judge before you drive.',
    park: n => `${n.toLocaleString('en-US')} parking spaces`,
    cap: n => `capacity ${n.toLocaleString('en-US')}`,
    km: d => `${d.toFixed(1)} km away`,
    mktT: '🏮 Traditional market days during the festival',
    mktL: 'Korean country markets open only on days ending in fixed digits — every 5 days. These are the actual dates they open while the festival runs, so you can add one to the same trip.',
    mktEvery: d => `opens on days ending in ${d}`,
    mktOpen: 'Open on',
    stores: n => `${n} stalls`,
    relT: '🎪 Other festivals nearby at the same time',
    relL: 'Overlapping dates, within 60 km.',
    srcT: 'Sources'
  },
  ja: {
    mapT: '🇰🇷 NAVERマップ・カカオマップにこのまま貼ってください',
    mapL: 'Googleマップは韓国国内の徒歩・乗換案内が出ません（韓国の地図データ規制のため）。NAVERマップとカカオマップなら出ますが、ハングルで検索しないとほとんど出てきません。そのままコピーしてお使いください。',
    mapN: '祭りの名前（ハングル）', mapA: '住所（ハングル）',
    copy: 'コピー', copied: 'コピーしました',
    busyT: '📊 この地域の混み具合',
    // ⚠️ ここに ** を書くと HTML にそのまま出る（2026-09-01 実際に出た）。強調は使わない。
    //    地域名は韓国語のままにする — 地図アプリで検索するときに使うのがこの表記だから。
    busyL: n => `この市・郡（${n}）の訪問者指数（韓国観光公社ビッグデータ）。1.00 はその地域自身の年平均です。ソウルと比べた数字ではなく、同じ地域の中でいつ人が多いかを表します。`,
    mo: m => m + '月',
    busyNote: '指数は市・郡・区の全体で、会場そのものではありません。「何月に行くか」を決めるのに使ってください。',
    quiet: 'データのある月の中では最も空いています',
    trrT: '🅿️ 近くの観光地 — 駐車「台数」まで',
    trrL: '多くのサイトは「駐車場あり」までしか書きません。以下は韓国行政安全部の公式データなので、車で向かう前に判断できます。',
    park: n => `駐車 ${n.toLocaleString('ja-JP')}台`,
    cap: n => `収容 ${n.toLocaleString('ja-JP')}人`,
    km: d => `${d.toFixed(1)}km`,
    mktT: '🏮 祭りの期間中に立つ「五日市」',
    mktL: '韓国の田舎の市場は日付の末尾で決まった日だけ開きます（5日ごと）。祭りの期間中に実際に開く日を計算しました。同じ旅程に一つ入れられます。',
    mktEvery: d => `末尾が ${d} の日に開催`,
    mktOpen: '開催日',
    stores: n => `${n}店`,
    relT: '🎪 同じ時期の近くの祭り',
    relL: '日程が重なる、60km以内のもの。',
    srcT: '出典'
  }
};

const CSS = `
<style>
.xbox{background:#fff;border-radius:16px;padding:18px 20px;margin:16px 0;box-shadow:0 2px 10px rgba(31,41,55,.06)}
.xbox h2{font-size:1.05rem;font-weight:900;color:#0a6c63;margin:0 0 6px}
.xbox .lead{color:#6b7280;font-size:.88rem;line-height:1.62;margin:0 0 12px}
.xcopy{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;
  background:#f6fbfa;border:1.5px solid #dcefeb;border-radius:12px;padding:11px 13px;margin:8px 0}
.xcopy .lb{font-size:.74rem;font-weight:800;color:#0a6c63;letter-spacing:.02em;display:block;margin-bottom:3px}
.xcopy .vl{font-size:1rem;font-weight:800;color:#111827;word-break:keep-all;line-height:1.45}
.xcopy button{background:#0f9d8f;color:#fff;border:0;border-radius:9px;padding:9px 14px;
  font-weight:800;font-size:.84rem;cursor:pointer;white-space:nowrap}
.xbars{display:flex;gap:6px;align-items:flex-end;height:74px;margin:6px 0 4px}
.xbars .b{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:4px}
.xbars .bar{width:100%;border-radius:6px 6px 0 0;background:#cfe9e4;min-height:4px}
.xbars .b.on .bar{background:#0f9d8f}
.xbars .b.lo .bar{background:#9dd3ff}
.xbars .lbl{font-size:.7rem;color:#6b7280;font-weight:700}
.xbars .v{font-size:.72rem;color:#374151;font-weight:800}
.xlist{display:grid;gap:9px}
.xitem{border:1.5px solid #eef2f1;border-radius:12px;padding:11px 13px}
.xitem .nm{font-weight:800;color:#111827;font-size:.95rem}
.xitem .mt{color:#6b7280;font-size:.83rem;margin-top:3px;line-height:1.55}
.xtag{display:inline-block;background:#e2f5f2;color:#0a6c63;font-weight:800;font-size:.76rem;
  padding:3px 9px;border-radius:999px;margin:4px 4px 0 0}
.xtag.d{background:#fff3e0;color:#9a5b00}
.xnote{color:#9aa3af;font-size:.79rem;line-height:1.6;margin-top:10px}
</style>
<script>
// ⚠️ en-nearby.js 도 같은 핸들러를 심는다 — 같은 플래그로 «한 번만» 걸리게 한다
//    (두 번 걸리면 클릭 한 번에 클립보드를 두 번 쓴다).
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

/**
 * 축제 하나에 대한 «우리만 가진 정보» 블록을 만든다.
 * @param f    그 언어의 축제 레코드 { title,start,end,addr,x,y }
 * @param lang 'en' | 'ja'
 * @param sameLang 같은 언어의 전체 축제 배열(근처 축제용) — 각 원소에 _slug 가 있어야 링크한다
 * @returns {html, stats} — stats 는 무엇이 실제로 붙었는지(감사용)
 */
function extras(f, lang, sameLang) {
  const T = TEXT[lang] || TEXT.en;
  const out = [];
  const stats = { map: 0, busy: 0, trr: 0, mkt: 0, rel: 0 };
  const fx = num(f.x), fy = num(f.y), has = ok(f.x, f.y);

  // ① 한글 원제·주소
  const ko = koMatch(f);
  if (ko && ko.title) {
    stats.map = 1;
    const koAddr = String(ko.addr || '').trim();
    out.push(`<div class="xbox"><h2>${T.mapT}</h2><p class="lead">${T.mapL}</p>
<div class="xcopy"><div><span class="lb">${esc(T.mapN)}</span><span class="vl">${esc(ko.title)}</span></div>
<button data-v="${esc(ko.title)}" data-done="${esc(T.copied)}">${esc(T.copy)}</button></div>
${koAddr ? `<div class="xcopy"><div><span class="lb">${esc(T.mapA)}</span><span class="vl">${esc(koAddr)}</span></div>
<button data-v="${esc(koAddr)}" data-done="${esc(T.copied)}">${esc(T.copy)}</button></div>` : ''}
</div>`);
  }

  // ② 붐빔 — 그 시군구의 월별 배수
  const sg = sgOf((ko && ko.addr) || '');
  const bm = sg && BUSY[sg];
  if (bm && Object.keys(bm).length >= 2) {
    stats.busy = 1;
    const fm = +String(f.start).slice(4, 6);
    const vals = BUSY_MONTHS.filter(m => bm[m] != null);
    const max = Math.max(...vals.map(m => bm[m]));
    const min = Math.min(...vals.map(m => bm[m]));
    const bars = vals.map(m => {
      const v = bm[m], h = Math.max(6, Math.round(v / max * 62));
      const cls = m === fm ? ' on' : (v === min ? ' lo' : '');
      return `<div class="b${cls}"><span class="v">${v.toFixed(2)}</span>
<div class="bar" style="height:${h}px"></div><span class="lbl">${esc(T.mo(m))}</span></div>`;
    }).join('');
    const quietM = vals.find(m => bm[m] === min);
    out.push(`<div class="xbox"><h2>${T.busyT}</h2><p class="lead">${esc(T.busyL(sg))}</p>
<div class="xbars">${bars}</div>
${bm[fm] != null ? `<p class="lead" style="margin:8px 0 0"><b>${esc(T.mo(fm))} — ${bm[fm].toFixed(2)}</b>${
  bm[fm] === min ? ` · ${esc(T.quiet)}` : ''}</p>` : ''}
<p class="xnote">${esc(T.busyNote)} · ${esc(T.mo(quietM))} ${min.toFixed(2)} / ${esc(T.mo(vals.find(m => bm[m] === max))) } ${max.toFixed(2)}</p></div>`);
  }

  // ③ 근처 관광지 — 주차 대수
  if (has) {
    const nt = TRR.map(t => ({ t, d: hav(fx, fy, num(t.x), num(t.y)) }))
      .filter(o => o.d <= 15 && (o.t.park || o.t.cap || (o.t.fclty || []).length))
      .sort((a, b) => a.d - b.d).slice(0, 4);
    if (nt.length) {
      stats.trr = nt.length;
      out.push(`<div class="xbox"><h2>${T.trrT}</h2><p class="lead">${esc(T.trrL)}</p><div class="xlist">${
        nt.map(({ t, d }) => `<div class="xitem"><div class="nm">${esc(t.name)}</div>
<div class="mt">${esc(T.km(d))}${t.addr ? ' · ' + esc(t.addr) : ''}</div>
${t.park ? `<span class="xtag">${esc(T.park(t.park))}</span>` : ''}
${t.cap ? `<span class="xtag">${esc(T.cap(t.cap))}</span>` : ''}
</div>`).join('')}</div></div>`);
    }
  }

  // ④ 축제 기간의 오일장
  if (has && /^\d{8}$/.test(String(f.start)) && /^\d{8}$/.test(String(f.end))) {
    const nm = MKT.map(m => ({ m, d: hav(fx, fy, num(m.x), num(m.y)) }))
      .filter(o => o.d <= 25).sort((a, b) => a.d - b.d).slice(0, 3)
      .map(o => ({ ...o, dates: marketDates(o.m.daysNum, String(f.start), String(f.end)) }))
      .filter(o => o.dates.length);
    if (nm.length) {
      stats.mkt = nm.length;
      out.push(`<div class="xbox"><h2>${T.mktT}</h2><p class="lead">${esc(T.mktL)}</p><div class="xlist">${
        nm.map(({ m, d, dates }) => `<div class="xitem"><div class="nm">${esc(m.name)}</div>
<div class="mt">${esc(T.km(d))} · ${esc(T.mktEvery(m.daysNum.join(', ')))}${
  m.stores ? ' · ' + esc(T.stores(m.stores)) : ''}</div>
<div style="margin-top:5px"><span class="lb" style="font-size:.74rem;font-weight:800;color:#9a5b00">${esc(T.mktOpen)}</span> ${
  dates.slice(0, 6).map(x => `<span class="xtag d">${lang === 'ja' ? x.m + '/' + x.d : MN_EN[x.m] + ' ' + x.d}</span>`).join('')}</div>
</div>`).join('')}</div></div>`);
    }
  }

  // ⑤ 같은 시기 근처 축제 (같은 언어 데이터에서만)
  if (has && Array.isArray(sameLang)) {
    const rel = sameLang.filter(o => o !== f && o._slug && ok(o.x, o.y) &&
      String(o.start) <= String(f.end) && String(o.end) >= String(f.start))
      .map(o => ({ o, d: hav(fx, fy, num(o.x), num(o.y)) }))
      .filter(o => o.d <= 60).sort((a, b) => a.d - b.d).slice(0, 5);
    if (rel.length) {
      stats.rel = rel.length;
      const base = lang === 'ja' ? '/ja/festival/' : '/en/festival/';
      out.push(`<div class="xbox"><h2>${T.relT}</h2><p class="lead">${esc(T.relL)}</p><div class="xlist">${
        rel.map(({ o, d }) => `<a class="xitem" style="display:block;text-decoration:none" href="${base}${esc(o._slug)}/">
<div class="nm" style="color:#0c7d72">${esc(o.title)}</div>
<div class="mt">${esc(T.km(d))} · ${String(o.start).slice(4, 6)}/${String(o.start).slice(6, 8)} – ${String(o.end).slice(4, 6)}/${String(o.end).slice(6, 8)}</div></a>`).join('')}</div></div>`);
    }
  }

  return { html: out.length ? CSS + out.join('\n') : '', stats };
}

module.exports = { extras, TEXT };
