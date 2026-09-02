// 일문 축제 상세에 「近くの見どころ」를 붙인다 — places_ja.json(일본어 관광지 3,360곳)에서 뽑는다.
//
// 왜 이걸 하나 (2026-09-02):
//   ① 일문 축제 상세 92장 중 **90장이 얇아서 noindex** 였다. 주소만 채워선 안 바뀐다.
//      일본어 «설명이 있는» 근처 장소를 붙이면 읽을 내용이 늘어난다.
//   ② 어제 역지오코딩으로 받은 **한글 도로명주소 3,257건**이 여기서 처음 실제로 쓰인다.
//      외국인이 지도 앱에 붙여넣을 수 있는 건 가타카나가 아니라 이 한글 주소다.
//   ③ 유튜브 실측에서 일본인의 프레임이 「혼자·1박2일·지방」으로 확인됐다 —
//      축제 하나만 보러 가는 게 아니라 «그 근처에 뭐가 있나»가 실제 관심사다.
//
// ⚠️ 직선거리다. 실제 이동시간과 다를 수 있어 「약 N km」로만 쓰고 소요시간은 말하지 않는다.
//    (대중교통 실측에서 직선거리 결론이 뒤집힌 전례가 있다.)
const fs = require('fs'), path = require('path');

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 개요가 정말 일본어인지 재는 자 — 「번역돼 있다」는 API 설명을 그대로 믿지 않는다
const kanaRatio = s => ((String(s).match(/[ぁ-んァ-ヴー]/g) || []).length) / Math.max(1, String(s).length);

let PLACES = null;
function places() {
  if (PLACES) return PLACES;
  try { PLACES = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'places_ja.json'), 'utf8')); }
  catch (e) { PLACES = []; }
  // 쓸 수 있는 것만 남긴다 — 좌표 + 일본어 개요 + 검증된 한글주소
  // ⚠️ 2026-09-02 추가: **JpnService2 도 다른 언어 원문을 그대로 주는 것이 섞여 있다**
  //    (慶州国立公園이 영어 문장으로 들어와 라이브에 나가 있었다 — 1,725건 중 1건).
  //    길이만 재면 못 잡는다. **가나가 실제로 들어 있는지**를 재서 거른다.
  PLACES = PLACES.filter(p => +p.x && +p.y && String(p.ov || '').length >= 120 && p.addrKo
    && kanaRatio(p.ov) >= 0.03);
  return PLACES;
}

const R = 6371;
const rad = d => d * Math.PI / 180;
function km(ax, ay, bx, by) {
  const dLat = rad(by - ay), dLon = rad(bx - ax);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(ay)) * Math.cos(rad(by)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const KIND = { spot: '観光地', culture: '文化施設', course: '旅行コース' };

/**
 * @param f  일문 축제 {x, y, title}
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
    const cut = ov.length > 150 ? ov.slice(0, 150) + '…' : ov;
    return `<li class="jn-item">
<div class="jn-h"><b>${esc(p.title)}</b><span class="jn-tag">${esc(KIND[p.kind] || '')}</span><span class="jn-km">約 ${d.toFixed(1)} km</span></div>
<p class="jn-ov">${esc(cut)}</p>
<div class="xcopy"><div><span class="lb">地図に貼り付ける住所（韓国語）</span><span class="vl">${esc(p.addrKo)}</span></div>
<button data-v="${esc(p.addrKo)}" data-done="コピーしました">コピー</button></div>
</li>`;
  }).join('');

  return {
    count: near.length,
    html: `<div class="jnear"><h2>近くの見どころ</h2>
<p class="jn-note">この祭りの会場から直線距離で 12km 以内にある、韓国観光公社が日本語で案内している場所です。所要時間は道路事情で変わるため、距離のみ記載しています。</p>
<ul class="jn-list">${rows}</ul>
<p class="jn-src">住所は座標から逆引きした韓国語の道路名住所です。NAVER マップ・カカオマップにそのまま貼り付けて検索できます。</p></div>`
  };
}

const CSS = `<style>
.jnear{margin:22px 0}
.jnear h2{font-size:1.08rem;font-weight:900;margin:0 0 6px}
.jn-note,.jn-src{font-size:.8rem;color:#8a939d;line-height:1.55;margin:0 0 10px}
.jn-src{margin-top:10px}
.jn-list{list-style:none;padding:0;margin:0;display:grid;gap:10px}
.jn-item{border:1px solid #e6eaee;border-radius:12px;padding:12px 13px;background:#fff}
.jn-h{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:5px}
.jn-h b{font-size:1rem;font-weight:800;color:#111827}
.jn-tag{font-size:.72rem;font-weight:800;color:#0a6c63;background:#e7f6f3;border-radius:6px;padding:2px 7px}
.jn-km{font-size:.78rem;color:#8a939d;margin-left:auto}
.jn-ov{font-size:.88rem;line-height:1.65;color:#374151;margin:0 0 9px}
</style>`;

module.exports = { nearby, CSS };
