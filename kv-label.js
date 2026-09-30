// kv-label.js — 외국어 축제 날짜 옆의 «조용한» 검증 표시 (2026-09-30)
//   intl-bridge.js 가 붙인 f.kv(confirmed · pending · est)를 한 줄 작은 글씨로 보여 준다.
//   눈에 띄는 배지가 아니라 날짜 뒤 회색 꼬리표 — 신뢰는 주되 페이지 분위기는 바꾸지 않는다.
//   tbc(지났는데 미확정)는 각 페이지의 «지난 일정» 안내가 이미 맡고 있어 여기선 아무것도 안 붙인다.
const T = {
  confirmed: { en: '✓ Dates verified with 3 independent sources', ja: '✓ 3つの情報源で日程確認済み', zh: '✓ 日期已经3个独立来源核实', tw: '✓ 日期已經3個獨立來源核實', es: '✓ Fechas verificadas con 3 fuentes' },
  pending:   { en: 'Announced dates · final cross-check in progress', ja: '発表日程・最終確認中', zh: '已公布日期 · 最终核对中', tw: '已公布日期 · 最終核對中', es: 'Fechas anunciadas · verificación final en curso' },
  est:       { en: 'Based on previous years — may change', ja: '例年の日程に基づく・変更の可能性あり', zh: '依往年日程 · 可能变动', tw: '依往年日程 · 可能變動', es: 'Según años anteriores · puede cambiar' },
};
function label(f, lang) {
  const t = f && T[f.kv]; if (!t) return '';
  const color = f.kv === 'confirmed' ? '#0c7d72' : '#9aa3af';
  return ` <span class="kvl" style="display:inline-block;font-size:.78rem;color:${color};font-weight:600;margin-left:4px">${t[lang] || t.en}</span>`;
}
module.exports = { label };
