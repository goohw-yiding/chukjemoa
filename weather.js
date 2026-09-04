// 🌤 축제 당일 날씨 렌더 — data/weather.json(fetch-weather.js 가 만든 것)을 읽기만 한다.
//
// ⚠️ **예보는 하루만 지나도 틀린 정보다.** 파일이 오늘 것이 아니면 **아무것도 그리지 않는다.**
//    옛 예보를 오늘 것처럼 보여주는 건 안 보여주는 것보다 나쁘다 — 날씨를 보고 출발 여부를 정하니까.
// ⚠️ 며칠 뒤 예보일수록 잘 바뀐다. 8일 이상 남은 것은 «참고» 라고 말해 준다. 숫자만 던지지 않는다.
const fs = require('fs'), path = require('path');

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// WMO 코드 → [이모지, 한국어]
const WMO = {
  0: ['☀️', '맑음'], 1: ['🌤', '대체로 맑음'], 2: ['⛅', '구름 조금'], 3: ['☁️', '흐림'],
  45: ['🌫', '안개'], 48: ['🌫', '서리 안개'],
  51: ['🌦', '가랑비'], 53: ['🌦', '가랑비'], 55: ['🌦', '강한 가랑비'],
  56: ['🌧', '어는 가랑비'], 57: ['🌧', '어는 가랑비'],
  61: ['🌧', '약한 비'], 63: ['🌧', '비'], 65: ['🌧', '강한 비'],
  66: ['🌧', '어는 비'], 67: ['🌧', '어는 비'],
  71: ['🌨', '약한 눈'], 73: ['🌨', '눈'], 75: ['🌨', '많은 눈'], 77: ['🌨', '싸락눈'],
  80: ['🌦', '소나기'], 81: ['🌦', '소나기'], 82: ['🌧', '강한 소나기'],
  85: ['🌨', '소나기눈'], 86: ['🌨', '강한 소나기눈'],
  95: ['⛈', '천둥번개'], 96: ['⛈', '천둥번개·우박'], 99: ['⛈', '천둥번개·우박']
};

let DB = undefined;
function db() {
  if (DB !== undefined) return DB;
  try { DB = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'weather.json'), 'utf8')); }
  catch (e) { DB = null; return DB; }
  // 신선도 가드 — 오늘 받은 게 아니면 통째로 안 쓴다
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  if (DB.generated !== today) {
    console.log(`  ⚠️ weather.json 이 ${DB.generated} 것이라 날씨를 표시하지 않습니다(오늘 ${today}).`);
    DB = null;
  }
  return DB;
}

const ymd = s => String(s || '').replace(/-/g, '');
const key = (x, y) => Number(y).toFixed(2) + ',' + Number(x).toFixed(2);
const todayY = () => ymd(new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10));

/** 축제 기간 중 «예보가 있는 날»들을 앞에서부터 최대 n개 */
function days(f, n = 4) {
  const d = db();
  if (!d || !f || !f.x || !f.y) return [];
  const m = d.pts[key(f.x, f.y)];
  if (!m) return [];
  const t = todayY();
  let s = ymd(f.start), e = ymd(f.end || f.start);
  if (!/^\d{8}$/.test(s)) return [];
  if (!/^\d{8}$/.test(e)) e = s;
  if (s < t) s = t;                       // 이미 시작한 축제는 «오늘부터»
  const out = [];
  for (const k of Object.keys(m).sort()) {
    if (k < s || k > e) continue;
    const [code, hi, lo, pop] = m[k];
    const [ico, txt] = WMO[code] || ['🌤', ''];
    out.push({ d: k, ico, txt, hi, lo, pop });
    if (out.length >= n) break;
  }
  return out;
}

/** 카드용 한 줄 — 「☀️ 28° · 비 8%」. 없으면 빈 문자열 */
function chip(f) {
  const a = days(f, 1);
  if (!a.length) return '';
  const w = a[0];
  const rain = w.pop >= 0 ? ` · 비 ${w.pop}%` : '';
  return `<span class="wx-chip" title="${esc(w.txt)}">${w.ico} ${w.hi}°${rain}</span>`;
}

const fmt = k => `${+k.slice(4, 6)}/${+k.slice(6, 8)}`;
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const wd = k => WD[new Date(+k.slice(0, 4), +k.slice(4, 6) - 1, +k.slice(6, 8)).getDay()];

/** 상세 페이지용 블록 */
function block(f) {
  const a = days(f, 4);
  if (!a.length) return { html: '', count: 0 };
  const d = db();
  const far = (Date.parse(a[0].d.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')) - Date.now()) / 86400000;
  const rows = a.map(w => `<div class="wx-day">
<span class="wx-d">${fmt(w.d)}(${wd(w.d)})</span>
<span class="wx-i">${w.ico}</span>
<span class="wx-t">${esc(w.txt)}</span>
<span class="wx-deg"><b>${w.hi}°</b> / ${w.lo}°</span>
${w.pop >= 0 ? `<span class="wx-pop${w.pop >= 60 ? ' hi' : ''}">비 ${w.pop}%</span>` : ''}
</div>`).join('');
  // ⚠️ 8일 이상 남은 예보는 잘 바뀐다 — 그 사실을 숨기지 않는다
  const note = far >= 8
    ? '아직 여유가 있는 날짜라 예보가 바뀔 가능성이 큽니다. 출발 전에 다시 확인하세요.'
    : '야외 행사는 우천 시 일정이 바뀔 수 있습니다. 출발 전에 주최 측 공지를 확인하세요.';
  return {
    count: a.length,
    html: `<div class="wxbox"><h2>축제 기간 날씨</h2>
<div class="wx-list">${rows}</div>
<p class="wx-src">${esc(note)}<br>Open-Meteo 예보 · ${esc(d.generatedAt || d.generated)} 기준</p></div>`
  };
}

const CSS = `<style>
.wxbox{margin:18px 0;background:#fff;border:1px solid #e6eaee;border-radius:14px;padding:14px 16px}
.wxbox h2{font-size:1.05rem;font-weight:900;margin:0 0 10px;color:#111827}
.wx-list{display:grid;gap:6px}
.wx-day{display:flex;align-items:center;gap:10px;padding:7px 9px;border-radius:10px;background:#f7fafc}
.wx-d{font-weight:800;font-size:.86rem;color:#374151;min-width:58px}
.wx-i{font-size:1.15rem}
.wx-t{font-size:.86rem;color:#6b7280;flex:1}
.wx-deg{font-size:.9rem;color:#374151}
.wx-deg b{color:#e2574c;font-weight:800}
.wx-pop{font-size:.78rem;font-weight:800;color:#2b6cb0;background:#e8f1fb;border-radius:6px;padding:2px 7px}
.wx-pop.hi{color:#fff;background:#2b6cb0}
.wx-src{font-size:.78rem;color:#9aa3af;line-height:1.6;margin:10px 0 0}
.wx-chip{display:inline-block;font-size:.76rem;font-weight:800;color:#2b6cb0;background:#eef5fd;
  border-radius:6px;padding:2px 7px;margin-left:6px;white-space:nowrap}
</style>`;

module.exports = { chip, block, CSS, days };
