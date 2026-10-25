// 🚶 현장 답사 블록 — 장남 님이 직접 다녀온 기록을 오일장·축제 페이지에 붙인다 (2026-10-24 신설)
// 왜: 사이트 대부분이 공공데이터 정리라 «다른 데서도 얻는 정보»였다(재방문 9%, 축제 상세 58초).
//     직접 가 본 사람의 말·사진·가격은 AI도, 다른 사이트도 못 가진다 — 그게 깊이다.
// 데이터: data/field_notes.json  [{ kind:'jangteo'|'festival', key:'<slug>', date:'2026-11-02', title, place,
//         photos:[{src:'/img/field/…webp', cap}], arrive, crowd, parking, items, bought:[{item,price}], ate,
//         pity, forWho, tip }]   ⛔ 얼굴이 알아보이는 사진은 쓰지 않는다. 사실만(본 것·산 것·낸 돈).
const fs = require('fs'), path = require('path');
const NOTES = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'field_notes.json'), 'utf8')); }
  catch (e) { return []; }
})();
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const DOW = '일월화수목금토';
const fmt = d => { const t = new Date(d + 'T00:00:00+09:00'); return `${t.getFullYear()}년 ${t.getMonth() + 1}월 ${t.getDate()}일(${DOW[t.getDay()]})`; };

const CSS = `<style>.fn{background:#fffaf2;border:1.5px solid #f3dcb8;border-radius:16px;padding:18px 18px 14px;margin:18px 0}
.fn-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 6px}.fn-h b{font-size:1.08rem;font-weight:900;color:#7a4b12}
.fn-badge{background:#7a4b12;color:#fff;font-size:.76rem;font-weight:800;border-radius:999px;padding:3px 10px}
.fn-d{color:#9a6b2f;font-size:.88rem;margin:0 0 10px}
.fn-ph{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:0 0 12px}
.fn-ph figure{margin:0}.fn-ph img{width:100%;height:130px;object-fit:cover;border-radius:10px;display:block}
.fn-ph figcaption{font-size:.8rem;color:#6b7280;margin-top:3px;line-height:1.4}
.fn dl{display:grid;grid-template-columns:92px 1fr;gap:6px 10px;margin:0;font-size:.95rem;line-height:1.65}
.fn dt{font-weight:800;color:#7a4b12}.fn dd{margin:0;color:#374151}
.fn-buy{margin:0;padding-left:18px}.fn-tip{margin:12px 0 0;background:#fff;border-radius:10px;padding:10px 12px;font-size:.94rem}
.fn-more{font-size:.84rem;color:#9a6b2f;margin:10px 0 0}</style>`;

function notesFor(kind, key) {
  return NOTES.filter(n => n.kind === kind && n.key === key).sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function block(kind, key, label) {
  const list = notesFor(kind, key);
  if (!list.length) return '';
  const n = list[0];
  const rows = [
    ['도착·붐빔', [n.arrive, n.crowd].filter(Boolean).join(' · ')],
    ['주차·교통', n.parking],
    ['눈에 띈 것', n.items],
    ['맛본 것', n.ate],
    ['아쉬운 점', n.pity],
    ['이런 분께', n.forWho],
  ].filter(r => r[1]);
  const buy = (n.bought || []).filter(b => b.item);
  return `${CSS}<section class="fn" id="field">
<div class="fn-h"><span class="fn-badge">직접 다녀옴</span><b>🚶 ${esc(label || n.title || '직접 가 보니')}</b></div>
<p class="fn-d">${fmt(n.date)} 방문${n.place ? ` · ${esc(n.place)}` : ''} — 축제모아 운영자가 직접 가서 보고 적은 기록입니다.</p>
${(n.photos || []).length ? `<div class="fn-ph">${n.photos.slice(0, 8).map(p => `<figure><img src="${esc(p.src)}" alt="${esc(p.cap || n.title || '')}" loading="lazy">${p.cap ? `<figcaption>${esc(p.cap)}</figcaption>` : ''}</figure>`).join('')}</div>` : ''}
<dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}
${buy.length ? `<dt>산 것·가격</dt><dd><ul class="fn-buy">${buy.map(b => `<li>${esc(b.item)}${b.price ? ` — <b>${esc(b.price)}</b>` : ''}</li>`).join('')}</ul></dd>` : ''}</dl>
${n.tip ? `<p class="fn-tip">💡 <b>한 줄 요령</b> — ${esc(n.tip)}</p>` : ''}
${list.length > 1 ? `<p class="fn-more">이곳은 ${list.length}번 다녀왔습니다. 가장 최근 기록을 보여 드립니다.</p>` : ''}
<p class="fn-more">가격과 상황은 방문한 날 기준입니다. 계절과 날씨에 따라 달라집니다.</p>
</section>`;
}

module.exports = { block, notesFor, NOTES };
