// 영어 축제 수동 교정 적용 (2026-09-30, 영어 세션) — data/festivals_en_fix.json
//   TourAPI 영문 DB 가 옛 날짜(예: 탐라문화제 2025)거나, 좌표만 겹친 다른 한국어 축제 이름이
//   지도 복사 칸에 붙던 것(예: 탐라문화제 → 「2025 음악실연자 페스티벌」)을 바로잡는다.
//   날짜·장소는 주최측 공식 발표로 확인한 것만 넣는다(항목마다 src).
const fs = require('fs'), path = require('path');
let FIX = {};
try { FIX = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'festivals_en_fix.json'), 'utf8')); } catch (e) { FIX = {}; }
// 오늘(한국 시간) YYYYMMDD — 매일 예약 빌드가 돌 때마다 기한이 자동 반영된다
const T8 = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');
const KEYS = ['start', 'end', 'addr', 'x', 'y', 'tel', 'hp'];
function apply(list) {
  (list || []).forEach(f => {
    const fx = FIX[String(f.id)];
    if (!fx || typeof fx !== 'object') return;
    KEYS.forEach(k => { if (fx[k] !== undefined) f[k] = fx[k]; });
    if (fx.ko !== undefined) f._ko = fx.ko;        // null = 한글 원제 칸 숨김
    if (fx.intro) f._intro = fx.intro;               // fest_intro_en 필드 덮어쓰기('' = 그 줄 숨김)
    // ⏳ 기한 — noteUntil / aff.until (YYYYMMDD) 이 지나면 자동으로 안 붙인다(투어 출발일이 지난 링크를 사람이 안 치워도 되게)
    const live = u => !u || String(u) >= T8;
    if (fx.note && live(fx.noteUntil)) f._note = fx.note;
    if (fx.noteFoot && f._note) f._noteFoot = fx.noteFoot;     // 「What's new」 상자 아래 출처 문장(없으면 기본 문구)
    if (fx.aff && live(fx.aff.until)) f._aff = fx.aff;                     // 확인된 제휴 상품(klook-en.js productLink)
  });
  return list;
}
module.exports = { apply, FIX };
