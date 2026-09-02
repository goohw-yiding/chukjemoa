// 영문 축제 상세에 「Nearby Attractions」를 붙인다 — places_en.json(영문 장소)에서 뽑는다.
//
// 왜 (2026-09-02)
//   일문에서 같은 블록으로 얇은 페이지 90→11개가 됐다. 영문도 11개가 얇아 noindex인데
//   그중 몇 개는 **이미 노출·클릭이 있다**(goesan-red-pepper 노출 18·클릭 1) — 그릇만 얇았다.
//
//   ⭐ 그리고 영문 독자에게 더 중요한 게 하나 있다:
//      **구글맵은 한국 안에서 길찾기를 못 한다**(지도데이터 반출 규제).
//      그래서 여기 붙이는 «한글 도로명주소»는 장식이 아니라 실제로 이동을 가능하게 하는 정보다.
//      네이버·카카오 지도에 그대로 붙여넣으면 된다는 것을 문장으로 말해 준다.
//
// ⚠️ 직선거리다. 실제 이동시간과 다를 수 있어 「approx. N km」로만 쓰고 소요시간은 말하지 않는다.
//    (대중교통 실측에서 직선거리 결론이 뒤집힌 전례가 있다.)
// ⚠️ 개요 수집이 TourAPI 일일 한도에 걸려 나눠 받는다 — 재료가 늘면 이 블록도 저절로 두꺼워진다.
const fs = require('fs'), path = require('path');

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 개요가 정말 그 언어인지 재는 자 — 「번역돼 있다」는 API 설명을 그대로 믿지 않는다
const hangulRatio = s => ((String(s).match(/[가-힣]/g) || []).length) / Math.max(1, String(s).length);

let PLACES = null;
function places() {
  if (PLACES) return PLACES;
  try { PLACES = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'places_en.json'), 'utf8')); }
  catch (e) { PLACES = []; }
  // 쓸 수 있는 것만 남긴다 — 좌표 + 영문 개요 + 한글주소(붙여넣을 수 있어야 의미가 있다)
  // ⚠️ 2026-09-02 라이브 렌더에서 잡았다: **EngService2 가 한국어 원문을 그대로 주는 것이 섞여 있다**
  //    (갈론계곡 「속리산국립공원 북부에 있는 깊은 계곡이다…」). 679건 중 1건이었는데
  //    하필 처음 열어 본 페이지에 걸렸다. 건수를 세지 말고 **언어를 재서** 거른다.
  //    「번역해 뒀다」는 전제를 API가 지키는지 우리가 확인한다.
  PLACES = PLACES.filter(p => +p.x && +p.y && String(p.ov || '').length >= 120 && p.addrKo
    && hangulRatio(p.ov) < 0.05);
  return PLACES;
}

const R = 6371, rad = d => d * Math.PI / 180;
function km(ax, ay, bx, by) {
  const dLat = rad(by - ay), dLon = rad(bx - ax);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(ay)) * Math.cos(rad(by)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const KIND = { spot: 'Attraction', culture: 'Cultural facility', course: 'Travel course' };

/**
 * @param f  영문 축제 { x, y, title }
 * @param n  최대 개수
 * @returns {html, count}
 */
function nearby(f, n = 5) {
  const fx = +f.x, fy = +f.y;
  if (!fx || !fy) return { html: '', count: 0 };
  const near = places()
    .map(p => ({ p, d: km(fx, fy, +p.x, +p.y) }))
    .filter(o => o.d <= 12 && o.d > 0.05)
    .sort((a, b) => a.d - b.d)
    .slice(0, n);
  if (!near.length) return { html: '', count: 0 };

  const rows = near.map(({ p, d }) => {
    const ov = String(p.ov || '').replace(/\s+/g, ' ').trim();
    const cut = ov.length > 170 ? ov.slice(0, 170).replace(/\s+\S*$/, '') + '…' : ov;
    return `<li class="en-item">
<div class="en-h"><b>${esc(p.title)}</b>${p.ko ? `<span class="en-ko">${esc(p.ko)}</span>` : ''}
<span class="en-tag">${esc(KIND[p.kind] || '')}</span><span class="en-km">approx. ${d.toFixed(1)} km</span></div>
<p class="en-ov">${esc(cut)}</p>
<div class="xcopy"><div><span class="lb">Korean address for map apps</span><span class="vl">${esc(p.addrKo)}</span></div>
<button data-v="${esc(p.addrKo)}" data-done="Copied">Copy</button></div>
</li>`;
  }).join('');

  return {
    count: near.length,
    html: `<div class="ennear"><h2>Nearby Attractions</h2>
<p class="en-note">Places within 12&nbsp;km of the festival venue (straight-line distance), described in English by the Korea Tourism Organization. Travel time depends on roads and traffic, so only distance is shown.</p>
<ul class="en-list">${rows}</ul>
<p class="en-src">Google Maps cannot provide driving or transit directions inside South Korea. Paste the Korean addresses above into <b>NAVER Map</b> or <b>KakaoMap</b> — both work with these addresses and are what people here actually use.</p></div>`
  };
}

const CSS = `<style>
.ennear{margin:22px 0}
.ennear h2{font-size:1.08rem;font-weight:900;margin:0 0 6px}
.en-note,.en-src{font-size:.8rem;color:#8a939d;line-height:1.6;margin:0 0 10px}
.en-src{margin-top:10px}
.en-list{list-style:none;padding:0;margin:0;display:grid;gap:10px}
.en-item{border:1px solid #e6eaee;border-radius:12px;padding:12px 13px;background:#fff}
.en-h{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:5px}
.en-h b{font-size:1rem;font-weight:800;color:#111827}
.en-ko{font-size:.82rem;color:#6b7280;font-weight:700}
.en-tag{font-size:.72rem;font-weight:800;color:#0a6c63;background:#e7f6f3;border-radius:6px;padding:2px 7px}
.en-km{font-size:.78rem;color:#8a939d;margin-left:auto}
.en-ov{font-size:.88rem;line-height:1.65;color:#374151;margin:0 0 9px}
.xcopy{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;
  background:#f6fbfa;border:1.5px solid #dcefeb;border-radius:12px;padding:11px 13px;margin:8px 0}
.xcopy .lb{font-size:.74rem;font-weight:800;color:#0a6c63;letter-spacing:.02em;display:block;margin-bottom:3px}
.xcopy .vl{font-size:1rem;font-weight:800;color:#111827;word-break:keep-all;line-height:1.45}
.xcopy button{background:#0f9d8f;color:#fff;border:0;border-radius:9px;padding:9px 14px;
  font-weight:800;font-size:.84rem;cursor:pointer;white-space:nowrap}
</style>
<script>
// ⚠️ intl-fest-extra.js 도 같은 핸들러를 심는다 — 같은 플래그로 «한 번만» 걸리게 한다
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

module.exports = { nearby, CSS };
