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
// ⚠️ 격자 식은 fetch-weather.js 와 «반드시» 같아야 한다. 한쪽만 바꾸면 조용히 전부 미스가 난다.
//    그래서 파일에 저장된 step 을 읽어 쓴다(하드코딩하지 않는다).
const key = (x, y) => {
  const s = (db() && db().step) || 0.02;
  return Math.round(Number(y) / s) + ',' + Math.round(Number(x) / s);
};
const todayY = () => ymd(new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10));

// 🔴 2026-09-04 추가 — **조용한 실패를 시끄럽게 만든다.**
//   신선도 가드(generated===오늘)만으로는 부족했다. 예약작업이 만든 «오늘 날짜지만 격자가 다른»
//   파일(step 없음·135지점)이 통과해 버려서, 전 사이트 날씨가 하루 종일 통째로 사라졌는데
//   아무 경고도 없었다. 제주 페이지를 만들다 카드 90개에 날씨 아이콘이 2개인 걸 보고서야 알았다.
//   → **조회 대비 미스율**을 세어 빌드 끝에 찍는다. 「오늘 것이 맞다」와 「실제로 붙는다」는 다른 질문이다.
let _hit = 0, _miss = 0;
process.on('exit', () => {
  const n = _hit + _miss;
  if (!n) return;
  const rate = Math.round(_miss / n * 100);
  if (rate >= 20) console.log(`  🔴 날씨 조회 ${n}건 중 ${_miss}건(${rate}%) 미스 — weather.json 의 격자가 어긋났을 수 있습니다.
     ⚠️ 프로젝트폴더와 C:\\dev 의 data/weather.json 은 «감시 대상이 아니라»(매일 새로 만드는 파일) 조용히 어긋납니다.
        예약작업은 C:\\dev 에서 만듭니다 → 프로젝트폴더에서 빌드하기 전에 그 파일을 복사하세요.`);
  else console.log(`  🌤 날씨 ${_hit}/${n}건 적용(미스 ${rate}%)`);
});

/** 좌표로 예보 배열을 가져온다 — 없으면 null */
function at(x, y) {
  const d = db();
  if (!d || !x || !y) return null;
  const r = d.pts[key(x, y)] || null;
  if (r) _hit++; else _miss++;
  return r;
}

/** 축제 기간 중 «예보가 있는 날»들을 앞에서부터 최대 n개 */
function days(f, n = 4) {
  const d = db();
  if (!d || !f || !f.x || !f.y) return [];
  const m = at(f.x, f.y);
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

/**
 * 날짜가 «없는» 곳(계곡·걷기길·명산·온천·단풍·봄꽃)용 — 오늘부터 n일.
 * ⭐ 이런 곳은 「언제 열리나」가 아니라 「이번 주에 갈 만한가」가 질문이다.
 * @param opts.title  블록 제목
 * @param opts.note   맨 아래 한 줄(그 장소 성격에 맞는 주의)
 */
function week(x, y, n = 5, opts = {}) {
  const m = at(x, y);
  if (!m) return { html: '', count: 0 };
  const d = db(), t = todayY();
  const out = [];
  for (const k of Object.keys(m).sort()) {
    if (k < t) continue;
    const [code, hi, lo, pop] = m[k];
    const [ico, txt] = WMO[code] || ['🌤', ''];
    out.push({ d: k, ico, txt, hi, lo, pop });
    if (out.length >= n) break;
  }
  if (!out.length) return { html: '', count: 0 };
  const rows = out.map(w => `<div class="wx-day">
<span class="wx-d">${fmt(w.d)}(${wd(w.d)})</span>
<span class="wx-i">${w.ico}</span>
<span class="wx-t">${esc(w.txt)}</span>
<span class="wx-deg"><b>${w.hi}°</b> / ${w.lo}°</span>
${w.pop >= 0 ? `<span class="wx-pop${w.pop >= 60 ? ' hi' : ''}">비 ${w.pop}%</span>` : ''}
</div>`).join('');
  return {
    count: out.length,
    html: `<div class="wxbox"><h2>${esc(opts.title || '이번 주 날씨')}</h2>
<div class="wx-list">${rows}</div>
<p class="wx-src">${esc(opts.note || '야외라 비가 오면 계획을 바꾸는 편이 낫습니다.')}<br>Open-Meteo 예보 · ${esc(d.generatedAt || d.generated)} 기준 · 가장 가까운 관측 격자(약 2km) 값입니다.</p></div>`
  };
}

/** 오늘(예보가 있으면) 한 줄 — 계곡·단풍·명산처럼 «날짜가 없는» 목록 카드에 쓴다 */
function now(x, y) {
  return dayChip(x, y, todayY());
}

/** 특정 «하루»만 한 줄로 — 오일장 다음 장날처럼 날짜가 정해진 목록에 쓴다 */
function dayChip(x, y, ymd8) {
  const m = at(x, y);
  if (!m || !m[ymd8]) return '';
  const [code, hi, lo, pop] = m[ymd8];
  const [ico, txt] = WMO[code] || ['🌤', ''];
  const rain = pop >= 0 ? ` · 비 ${pop}%` : '';
  return `<span class="wx-chip${pop >= 60 ? ' rain' : ''}" title="${esc(txt)}">${ico} ${hi}°${rain}</span>`;
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
.wx-chip.rain{color:#fff;background:#2b6cb0}
</style>`;

module.exports = { chip, block, week, dayChip, now, CSS, days };
