// 🏯 /ja/palace/ — 「ソウルの王宮 — 休館日・料金・韓服無料・日本語ガイドの時間」
//
// 왜 이것인가 (2026-09-15 결정 · 근거는 ref-chukjemoa-2026-09-15-japan-inventory.md)
//   일본 미디어(newt·asoview 2026)가 「韓国でしかできないこと」로 «반드시» 꼽는 항목이 고궁·한복이다.
//   그런데 일본어로 된 «실무 정보»(휴관일·요금·한복 무료 조건·해설 시각)가 사실상 없다.
//   그루메·카페는 번역률 3%라 우리가 구조적으로 못 하지만, 이건 «숫자와 시각»이라 번역 부담이 없다.
//
// ⭐ 이 페이지의 핵심 발견 — 다른 곳에 없는 것
//   1. **휴관일이 두 갈래다.** 景福宮·宗廟 = 화요일 휴관 / 昌徳宮·昌慶宮·徳寿宮 = 월요일 휴관.
//      「월요일이라 다 닫혔다」가 아니다. 월요일엔 경복궁이, 화요일엔 창덕궁이 연다.
//   2. **일본어 무료 해설이 5곳 전부에 있다.** 예약 불필요(10인 미만)·무료.
//      게다가 «외국인 전용»이다 — 내국인은 참여할 수 없다(외국인 동반 시 예외).
//      이걸 일본어로 시각까지 적어 둔 곳을 찾지 못했다.
//   3. **밤에 예약 없이 들어갈 수 있는 궁이 둘 있다** — 昌慶宮·徳寿宮은 21시까지 상시 개방.
//      별빛야행·달빛기행은 예약제·한국어 사이트라 일본인이 못 잡는다. 그 대안이 이 둘이다.
//
// 무엇으로 말하나
//   · 공식 확인분(2026-09-15) — 国家遺産庁 宮陵遺跡本部 royal.khs.go.kr
//       관람시간 R702000000 · 관람요금 R703000000 · 한복 가이드라인 R705000000 · 해설안내 R706*
//     + 国家遺産振興院 kh.or.kr(경복궁 수문장) · royalguard.kr(덕수궁 왕궁수문장)
//     ⚠️ 손으로 적은 숫자다 — «공식 페이지를 열어 읽고» 옮겼다. 추측한 값은 하나도 없다.
//        갱신할 때도 반드시 위 URL 을 다시 열어 볼 것.
//   · 우리 데이터 — data/cltur_fstvl.json · data/festivals_api.json 에서 «국가유산 야행» 전국 일정
//     (이건 빌드할 때마다 오늘 기준으로 다시 추린다)
//   · data/places_ja.json — 궁의 일본어 설명·좌표
'use strict';
const fs = require('fs'), path = require('path');
const load = f => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', f), 'utf8')); } catch (e) { return null; } };
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nf = n => Number(n || 0).toLocaleString('ja-JP');

const SRC = '国家遺産庁 宮陵遺跡本部 公式サイト（royal.khs.go.kr）2026年9月時点';

// ── 궁별 공식 정보. 순서 = 이 페이지가 권하는 순서가 아니라 «규모·인지도» 순.
const PAL = [
  {
    ja: '景福宮', ko: '경복궁', ro: 'キョンボックン', off: '火',
    hours: [['1〜2月・11〜12月', '09:00–17:00', '16:00'], ['3〜5月・9〜10月', '09:00–18:00', '17:00'], ['6〜8月', '09:00–18:30', '17:30']],
    fee: 3000,
    jp: { t: ['10:00', '14:30'], d: '月・水〜日', meet: '案内所前（興禮門の内側）', min: '60〜90分' },
    tag: '守門将交代式はここ'
  },
  {
    ja: '昌徳宮', ko: '창덕궁', ro: 'チャンドックン', off: '月',
    hours: [['2〜5月・9〜10月', '09:00–18:00', '17:00'], ['6〜8月', '09:00–18:30', '17:30'], ['11〜1月', '09:00–17:30', '16:30']],
    fee: 3000,
    jp: { t: ['11:00'], d: '水・金・日', meet: '仁政門の向かい（扈衛庁）', min: '約50分' },
    tag: 'ユネスコ世界遺産'
  },
  {
    ja: '昌徳宮 後苑', ko: '창덕궁 후원', ro: 'フウォン（王室庭園）', off: '月',
    hours: [['通年', '時間指定の入場のみ', '—']],
    fee: 5000,
    jp: { t: ['13:30'], d: '水・金・日', meet: '後苑入口（昌徳宮の入口から徒歩15分以上）', min: '約70分' },
    tag: '別料金・人数制限あり'
  },
  {
    ja: '昌慶宮', ko: '창경궁', ro: 'チャンギョングン', off: '月',
    hours: [['通年', '09:00–21:00', '20:00']],
    fee: 1000,
    jp: { t: ['10:00'], d: '火〜日', meet: '玉川橋のそば', min: '約1時間' },
    tag: '夜9時まで開いています'
  },
  {
    ja: '徳寿宮', ko: '덕수궁', ro: 'トクスグン', off: '月',
    hours: [['通年', '09:00–21:00', '20:00']],
    fee: 1000,
    jp: { t: ['09:30', '16:00'], d: '火〜日', meet: '大漢門・禁川橋を過ぎた総合案内板の前', min: '—' },
    tag: '夜9時まで・王宮守門将交代式'
  },
  {
    ja: '宗廟', ko: '종묘', ro: 'チョンミョ', off: '火',
    hours: [['土・日・祝', '09:00–18:00（自由観覧）', '17:00'], ['平日', '時間指定の解説付き観覧のみ', '—']],
    fee: 1000,
    // ⚠️ 종묘는 공식 페이지에 집합장소가 적혀 있지 않다. 지어내지 않는다 — 모른다고 쓴다.
    jp: { t: ['09:40', '11:40', '13:40', '15:40'], d: '月・水・木・金・日・文化の日', meet: '公式に記載なし（当日、宗廟の案内所へ）', min: '—' },
    tag: 'ユネスコ世界遺産・平日は時間指定'
  }
];

// ── 수문장 교대의식. 궁 «밖»이라 입장권 없이 볼 수 있다 — 이게 중요한 점이다.
const GUARD = [
  {
    ja: '景福宮 光化門', src: '国家遺産振興院（kh.or.kr）',
    off: '火', rows: [['守門将交代式', '10:00 / 14:00', '約20分'], ['光化門 把守儀式', '11:00 / 13:00', '約10分'], ['守門軍 公開訓練', '09:35 / 13:35', '約15分']]
  },
  {
    ja: '徳寿宮 大漢門', src: 'ソウル王宮守門将（royalguard.kr）',
    off: '月', rows: [['王宮守門将 交代儀式', '11:00 / 14:00', '約30分']]
  }
];

const SIDO_JA = {
  '서울': 'ソウル', '부산': '釜山', '대구': '大邱', '인천': '仁川', '광주': '光州', '대전': '大田',
  '울산': '蔚山', '세종': '世宗', '경기': '京畿道', '강원': '江原道', '충북': '忠清北道', '충남': '忠清南道',
  '전북': '全羅北道', '전남': '全羅南道', '경북': '慶尚北道', '경남': '慶尚南道', '제주': '済州'
};
// 야행이 열리는 시·군의 일본어 표기. ⚠️ 없는 곳은 «한글 그대로» 둔다 — 지어내지 않는다.
const SGG_JA = {
  '경주시': '慶州', '전주시': '全州', '보령시': '保寧', '담양군': '潭陽', '김해시': '金海',
  '공주시': '公州', '원주시': '原州', '용산구': '龍山', '중구': '中区', '수원시': '水原',
  '강릉시': '江陵', '홍성군': '洪城', '논산시': '論山', '포항시': '浦項', '밀양시': '密陽',
  '동구': '東区', '청주시': '清州', '익산시': '益山', '아산시': '牙山', '예천군': '醴泉',
  '삼척시': '三陟', '부여군': '扶餘', '목포시': '木浦', '서대문구': '西大門', '강서구': '江西',
  '제물포구': '済物浦', '송파구': '松坡', '통영시': '統営'
};

const CSS = `<style>
.pgc{background:#fff;border-radius:16px;padding:18px 20px;margin:14px 0;box-shadow:0 2px 10px rgba(31,41,55,.06)}
.pgc h2{font-size:1.06rem;font-weight:900;color:#0a6c63;margin:0 0 8px}
.pgc h3{font-size:.98rem;font-weight:800;color:#1f2937;margin:16px 0 6px}
.pgc p{color:#374151;font-size:.95rem;line-height:1.85;margin:0 0 8px}
.pgnote{color:#9aa3af;font-size:.81rem;line-height:1.65;margin-top:9px}
.pgk{font-weight:800;color:#1c1917}
.pgt{width:100%;border-collapse:collapse;font-size:.92rem;margin:8px 0;min-width:520px}
.pgt th{background:#f6fbfa;color:#0a6c63;font-weight:800;text-align:left;padding:9px 10px;border-bottom:2px solid #dcefeb;white-space:nowrap}
.pgt td{padding:9px 10px;border-bottom:1px solid #eef2f1;color:#374151;vertical-align:top}
.pgt td.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.pgwrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.pgsw{display:none;color:#9aa3af;font-size:.83rem;margin:2px 0 6px}
.pgbig{display:grid;gap:10px;margin:12px 0}
.pgday{border:1.5px solid #eef2f1;border-radius:14px;padding:13px 15px;background:#fff}
.pgday.mon{border-color:#f3d9c4;background:#fffcf8}
.pgday.tue{border-color:#cfe9e4;background:#fbfffe}
.pgday b.h{display:block;font-size:1.02rem;font-weight:900;color:#1f2937;margin-bottom:5px}
.pgday p{font-size:.92rem;margin:0}
.pgok{color:#0a6c63;font-weight:800}
.pgng{color:#b45309;font-weight:800}
.pgol{margin:6px 0 0;padding-left:22px}
.pgol li{color:#374151;font-size:.95rem;line-height:1.85;margin-bottom:7px}
.pgul{margin:6px 0 0;padding-left:20px}
.pgul li{color:#374151;font-size:.94rem;line-height:1.8;margin-bottom:5px}
.pgnav{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}
.pgnav a{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.88rem;padding:9px 14px;border-radius:999px;text-decoration:none}
/* ⚠️ 375px 실물에서 보고 넣음(2026-09-15) — 5열 표가 295px 안에 들어가니
   「宮」칸이 49px 이 되고 한 행이 286px 로 늘어났다(한 줄에 두 글자). /ja/busy/ 에서 이미 당한 것이다.
   → 중요한 두 표(一覧·日本語ガイド)는 모바일에서 «카드»로 접는다. 옆으로 안 밀어도 읽힌다. */
.pgt.stack{min-width:0}
@media(max-width:560px){
.pgsw{display:block}
.pgsw.hide-s{display:none}
.pgt.stack thead{display:none}
.pgt.stack,.pgt.stack tbody,.pgt.stack tr,.pgt.stack td{display:block;width:auto}
.pgt.stack tr{border:1.5px solid #eef2f1;border-radius:12px;padding:11px 13px;margin-bottom:10px}
.pgt.stack td{border:0;padding:4px 0}
.pgt.stack td.n{text-align:left}
.pgt.stack td:before{content:attr(data-l);display:block;font-size:.78rem;font-weight:800;color:#0a6c63;margin-bottom:1px}
.pgt.stack td.hd:before{display:none}
.pgt.stack td.hd{font-size:1.06rem;margin-bottom:3px}
}
</style>`;

// ── 「국가유산 야행」 골라내기
//   ⚠️ 제목에 야행이 들어가도 «국가유산 야행»이 아닌 것이 섞인다(가락옥토버페스트 미식야행).
//   ⚠️ 경복궁 별빛야행은 지역 야행이 아니라 «궁궐 예약제 프로그램»이라 따로 다룬다.
const isYahaeng = t => /야행/.test(t) && !/(페스트|미식|별빛야행|달빛)/.test(t);
const ymd = s => String(s || '').replace(/[^0-9]/g, '').slice(0, 8);
const fmtJ = s => { const v = ymd(s); return v.length === 8 ? Number(v.slice(4, 6)) + '月' + Number(v.slice(6, 8)) + '日' : '—'; };

function build(ctx) {
  const { layout, writePage, TODAY } = ctx;
  const T = String(TODAY || '').replace(/-/g, '');
  const PJ = load('places_ja.json') || [];

  // ── 야행 모으기. 두 소스에 같은 행사가 겹쳐 들어온다 → 시·도+시·군+시작월로 묶고
  //    표준데이터(cltur_fstvl)를 우선한다. 날짜가 서로 다를 때 «합치지» 않는다 — 지어내는 셈이 된다.
  const rawA = (load('cltur_fstvl.json') || []).filter(r => isYahaeng(r.title));
  const rawB = (load('festivals_api.json') || []).filter(r => isYahaeng(r.title));
  const byKey = new Map();
  const put = (r, pref) => {
    const s = ymd(r.start);
    if (s.length !== 8) return;
    const key = r.sido + '|' + r.sigungu + '|' + s.slice(0, 6);
    const cur = byKey.get(key);
    if (cur && cur.pref >= pref) return;
    byKey.set(key, { pref, sido: r.sido, sgg: r.sigungu, title: r.title, s, e: ymd(r.end) || s });
  };
  rawB.forEach(r => put(r, 1));
  rawA.forEach(r => put(r, 2));   // 표준데이터가 이긴다
  const YA = [...byKey.values()].sort((a, b) => a.s.localeCompare(b.s));
  const upcoming = YA.filter(r => (r.e || r.s) >= T).slice(0, 12);

  // 달별 분포 — 「앞으로의 일정」이 비는 계절에도 말할 게 있어야 한다.
  //   ⚠️ 이 문장은 «계산해서» 쓴다. 「だいたい秋です」처럼 추측으로 쓰지 않는다.
  const mon = {};
  YA.forEach(r => { const m = Number(r.s.slice(4, 6)); mon[m] = (mon[m] || 0) + 1; });
  const topMon = Object.keys(mon).map(Number).sort((a, b) => mon[b] - mon[a] || a - b).slice(0, 3).sort((a, b) => a - b);

  const cityJa = r => {
    const s = SGG_JA[r.sgg];
    const sd = SIDO_JA[r.sido] || r.sido;
    if (!s) return sd + ' ' + r.sgg;
    // 광역시의 «구»는 시·도 이름이 없으면 어디인지 알 수 없다(中区が大田か釜山か)
    return /(구|군)$/.test(r.sgg) ? sd + ' ' + s : s;
  };

  // ── 궁 표
  const palRows = PAL.map(p => {
    const h = p.hours.map(x => x[0] + ' ' + x[1]).join('<br>');
    const last = p.hours.map(x => x[2]).filter(x => x !== '—');
    const jp = p.jp.t.join(' / ');
    return '<tr><td class="hd"><b>' + esc(p.ja) + '</b> <span style="font-size:.8rem;color:#9aa3af">' + esc(p.ro)
      + '</span> <span class="pgk" style="font-size:.82rem">' + esc(p.ko) + '</span></td>'
      + '<td class="n" data-l="休み"><b class="' + (p.off === '火' ? 'pgok' : 'pgng') + '">' + p.off + '曜</b></td>'
      + '<td data-l="開いている時間" style="font-size:.88rem">' + h + (last.length ? '<br><span style="font-size:.78rem;color:#9aa3af">入場締切 ' + esc(last.join(' / ')) + '</span>' : '') + '</td>'
      + '<td class="n" data-l="料金(ウォン)">' + nf(p.fee) + '</td>'
      + '<td data-l="日本語ガイド" style="font-size:.88rem"><b>' + esc(jp) + '</b> <span style="font-size:.8rem;color:#6b7280">' + esc(p.jp.d) + '</span></td></tr>';
  }).join('');

  const jpRows = PAL.map(p =>
    '<tr><td class="hd"><b>' + esc(p.ja) + '</b></td><td data-l="日本語の時間"><b>' + esc(p.jp.t.join(' / ')) + '</b></td>'
    + '<td data-l="曜日">' + esc(p.jp.d) + '</td><td data-l="集合場所" style="font-size:.88rem">' + esc(p.jp.meet) + '</td>'
    + '<td class="n" data-l="所要">' + esc(p.jp.min) + '</td></tr>').join('');

  const guardRows = GUARD.map(g => g.rows.map((r, i) =>
    '<tr>' + (i === 0 ? '<td rowspan="' + g.rows.length + '"><b>' + esc(g.ja) + '</b><br><span style="font-size:.8rem;color:#b45309;font-weight:700">' + esc(g.off) + '曜は休み</span></td>' : '')
    + '<td>' + esc(r[0]) + '</td><td><b>' + esc(r[1]) + '</b></td><td class="n">' + esc(r[2]) + '</td></tr>').join('')).join('');

  const yaRows = upcoming.map(r =>
    '<tr><td><b>' + esc(cityJa(r)) + '</b>'
    + (r.s <= T ? '<br><span style="font-size:.76rem;color:#b45309;font-weight:800">開催中</span>' : '') + '</td>'
    + '<td class="n">' + esc(fmtJ(r.s)) + (r.e && r.e !== r.s ? '〜' + esc(fmtJ(r.e)) : '') + '</td>'
    + '<td><span class="pgk" style="font-size:.86rem">' + esc(r.title) + '</span></td></tr>').join('');

  // ── 본문에 쓸 숫자는 전부 «계산»한다. 「だいたい」로 쓰지 않는다.
  const tueOff = PAL.filter(p => p.off === '火').map(p => p.ja);
  const monOff = [...new Set(PAL.filter(p => p.off === '月').map(p => p.ja.replace(' 後苑', '')))];
  const sumFee = PAL.filter(p => !/後苑/.test(p.ja)).reduce((a, p) => a + p.fee, 0);
  const PASS = 6000;
  const jpSlots = PAL.reduce((a, p) => a + p.jp.t.length, 0);
  const night = PAL.filter(p => p.hours.some(h => /21:00/.test(h[1]))).map(p => p.ja);
  const monName = topMon.map(m => m + '月').join('・');
  // 「5か所すべて」를 손으로 쓰지 않는다 — 後苑은 昌徳宮과 같은 장소라 «곳»으로 세면 안 된다.
  const jpSites = new Set(PAL.map(p => p.ja.replace(' 後苑', ''))).size;
  // 경복궁 별빛야행이 지금 열려 있는지 — 우리 데이터로 «확인해서» 말한다. 추측하지 않는다.
  const star = (load('festivals_api.json') || []).filter(r => /별빛야행/.test(r.title))
    .map(r => ({ s: ymd(r.start), e: ymd(r.end) })).filter(r => r.s.length === 8 && r.e >= T).sort((a, b) => a.s.localeCompare(b.s))[0];
  const starLine = star
    ? '私たちのデータでは、<b>今年の景福宮の星あかりの夜行は' + esc(fmtJ(star.s)) + '〜' + esc(fmtJ(star.e)) + '</b>です'
      + (star.s <= T ? '（<b>いま開催中</b>）' : '') + '。ただし予約枠は先に埋まります。'
    : '';

  // ⚠️ 실물을 읽고 고침(2026-09-15): 「これから開かれる」라고 썼는데 표 맨 위가 «6月12日〜10月4日»였다.
  //    이미 시작한 것이 섞인다. 개최중인 것은 그렇게 표시하고, 기간이 긴 것은 «매일 밤 하는 게 아니다»라고 적는다.
  const onNow = upcoming.filter(r => r.s <= T).length;
  const nowLine = onNow ? '・うち<b>' + onNow + '件は開催中</b>' : '';
  const yaBlock = upcoming.length
    ? '<p>下は<b>いまから行ける' + upcoming.length + '件</b>です（' + esc(TODAY) + '時点' + nowLine + '）。行き先が決まっている街で開かれていれば、その日の夜は予定を空けておく価値があります。</p>'
      + '<p class="pgsw">↔ 表は横にスクロールできます</p>'
      + '<div class="pgwrap"><table class="pgt"><thead><tr><th>街</th><th class="n">日程</th><th>名称（韓国語）</th></tr></thead><tbody>' + yaRows + '</tbody></table></div>'
      + '<p class="pgnote">⚠️ <b>期間が数週間以上に見えるものは、その間ずっと毎晩やっているという意味ではありません</b>。その期間のうち決まった週末の夜だけ開くのが普通です。日にちは必ず主催側の案内で確かめてください。</p>'
    : '<p>いまの時点で、これから開かれる予定として確認できているものはありません。夜行の日程は年度ごとに春に出ます。</p>';

  const content = '<main><div class="wrap">' + CSS + `
<p style="font-size:.85rem;color:#9aa3af;margin:8px 0"><a href="/ja/" style="color:#0c7d72">ホーム</a> › ソウルの王宮</p>
<h1 style="font-size:1.46rem;font-weight:900;letter-spacing:-.02em;margin:6px 0 6px">ソウルの王宮 — 休館日・料金・韓服無料と、日本語ガイドの時間</h1>
<p style="color:#6b7280;font-size:.94rem;line-height:1.8;margin:0 0 4px">王宮は「行けば入れる」場所ではありません。<b>宮ごとに休む曜日が違い、しかも月曜と火曜で入れ替わります</b>。そして日本語で書かれた案内は、たいてい「景福宮がおすすめ」で終わっていて、<b>何曜日に行けるのか・いくらなのか・韓服のどこまでが無料なのか</b>が書いてありません。${esc(SRC)}の公式ページを一つずつ開いて、その部分だけを集めました。</p>

<div class="pgc"><h2>⭐ まず曜日 — 「月曜だから全部だめ」ではありません</h2>
<p>ソウルの王宮の休みは、<b>二つに分かれています</b>。${esc(tueOff.join('と'))}は<b>火曜休み</b>、${esc(monOff.join('・'))}は<b>月曜休み</b>です。つまり<b>どちらの曜日にも、開いている宮があります</b>。「月曜は博物館も宮も全部休み」と思って一日を捨ててしまう人が多いのですが、そうではありません。</p>
<div class="pgbig">
<div class="pgday mon"><b class="h">月曜に行くなら</b><p><span class="pgok">開いている：${esc(tueOff.join('・'))}</span><br><span class="pgng">閉まっている：${esc(monOff.join('・'))}</span><br><span style="font-size:.88rem;color:#6b7280">景福宮の守門将交代式（10:00 / 14:00）もあります。徳寿宮の交代式は月曜は休みです。</span></p></div>
<div class="pgday tue"><b class="h">火曜に行くなら</b><p><span class="pgok">開いている：${esc(monOff.join('・'))}</span><br><span class="pgng">閉まっている：${esc(tueOff.join('・'))}</span><br><span style="font-size:.88rem;color:#6b7280">景福宮が休みなので守門将交代式もありません。代わりに徳寿宮・大漢門の王宮守門将交代式（11:00 / 14:00）が見られます。</span></p></div>
</div>
<p class="pgnote">祝日の扱いは宮によって変わることがあります。名節（ソルラル・チュソク）の当日は無料開放になる年もあります。日付が決まったら公式サイトで最終確認してください。</p></div>

<div class="pgc"><h2>🗓️ 一覧 — 休み・時間・料金・日本語ガイド</h2>
<p class="pgsw hide-s">↔ 表は横にスクロールできます</p>
<div class="pgwrap"><table class="pgt stack"><thead><tr><th>宮</th><th class="n">休み</th><th>開いている時間</th><th class="n">料金(ウォン)</th><th>日本語ガイド</th></tr></thead><tbody>${palRows}</tbody></table></div>
<p class="pgnote">料金は大人（外国人は満19〜64歳）一人あたりの片道入場料です。<b>昌徳宮の後苑は宮の入場券とは別</b>で、時間指定・人数制限のある観覧になります。出典：${esc(SRC)}。</p></div>

<div class="pgc"><h2>🎧 日本語の無料ガイドが、${jpSites}か所すべてにあります</h2>
<p>これがいちばん知られていないことだと思います。ソウルの主要な王宮には<b>日本語の定時解説</b>があり、<b>1日あわせて${jpSlots}回</b>動いています。<b>予約は要りません</b>（10人未満の個人の場合）。<b>料金もかかりません</b> — 入場券さえ持っていれば参加できます。</p>
<p>しかも外国語の解説は<b>外国人のための制度</b>で、韓国人は参加できません（外国人に同行する場合を除く）。つまり<b>日本語話者のために用意された枠</b>です。集合場所に、その時間に立っていればいいだけです。</p>
<p class="pgsw hide-s">↔ 表は横にスクロールできます</p>
<div class="pgwrap"><table class="pgt stack"><thead><tr><th>場所</th><th>日本語の時間</th><th>曜日</th><th>集合場所</th><th class="n">所要</th></tr></thead><tbody>${jpRows}</tbody></table></div>
<p class="pgnote">解説は<b>出発時刻を過ぎると参加できません</b>。少し早めに集合場所へ行ってください。雨でも行われます。10人以上の団体は事前予約が必要です。時間・回数は機関の事情で変わることがあるので、当日の朝に公式サイトで確認するのが確実です。出典：${esc(SRC)}。</p></div>

<div class="pgc"><h2>🧧 韓服を着ていると無料 — ただし「条件」があります</h2>
<p>韓服（ハンボク）を着ていれば、<b>上の宮すべてと宗廟が無料</b>になります。外国人も対象です。レンタルは景福宮・北村のまわりに多く、数時間単位で借りられます。入場料が浮くので、<b>4宮と宗廟をまわるなら韓服代の一部は取り返せます</b>。</p>
<p>ただし<b>「韓服っぽい服」では無料になりません</b>。公式のガイドラインは、<b>上（チョゴリ）と下（チマまたはパジ）をそろえて着ていること</b>を基本にしています。伝統韓服でも生活韓服（現代的な韓服）でもかまいません。</p>
<ul class="pgul">
<li><b>チョゴリ</b>は前を合わせる襟の形であること（紐か結びかは問いません）</li>
<li><b>チマ</b>は巻く形でも留める形でも、形式は問いません</li>
<li><b>パジ</b>は伝統的な形（サポクパジ）に準じるもの</li>
</ul>
<p style="margin-top:10px"><b class="pgng">認められない例</b>としてはっきり挙がっているのは次のものです。レンタル店で「これでいいですか」と聞くときの基準になります。</p>
<ul class="pgul">
<li>ジーンズの上にチョゴリだけを羽織る</li>
<li>韓服の下だけを穿いて、上はTシャツ</li>
<li>チョゴリのないワンピース型の韓服</li>
<li>Tシャツの形をした生活韓服のチョゴリ</li>
<li>トゥルマギ（コート）だけの着用</li>
</ul>
<p class="pgnote">宮にふさわしい着方（過度な露出をしない）も求められています。判断は現場の係員が行います。出典：${esc(SRC)}「韓服無料観覧ガイドライン」。</p></div>

<div class="pgc"><h2>💴 料金 — 統合券なら${nf(sumFee - PASS)}ウォン安くなります</h2>
<p>4つの宮と宗廟を別々に買うと合計<b>${nf(sumFee)}ウォン</b>ですが、<b>統合観覧券が${nf(PASS)}ウォン</b>です。差は${nf(sumFee - PASS)}ウォン。しかも<b>有効期間が6か月</b>あるので、一日で全部まわる必要はありません。何度か韓国に来る人にも向いています（各宮1回ずつ入場できます）。昌徳宮の後苑は含まれません。</p>
<p><b>そもそも無料になる人</b>も多いので、先に確認してください。</p>
<ul class="pgul">
<li><b>満18歳以下の外国人</b> — 子ども連れなら子どもの分はかかりません</li>
<li><b>満65歳以上</b></li>
<li><b>韓服を着ている人</b>（上の条件を満たす場合）</li>
<li><b>毎月最終水曜日</b>（韓国の「文化の日」）</li>
<li>障害者手帳をお持ちの方、妊婦とその同行者1名</li>
</ul>
<p class="pgnote">出典：${esc(SRC)}「観覧料金」。</p></div>

<div class="pgc"><h2>🛡️ 守門将交代式 — 入場券がなくても見られます</h2>
<p>交代式は<b>宮の門の外</b>で行われます。つまり<b>入場料を払わなくても見られます</b>。これも意外と書かれていません。景福宮と徳寿宮の2か所にあり、<b>休みの曜日が逆</b>なので、どちらかは必ずやっています。</p>
<p class="pgsw">↔ 表は横にスクロールできます</p>
<div class="pgwrap"><table class="pgt"><thead><tr><th>場所</th><th>行事</th><th>時間</th><th class="n">所要</th></tr></thead><tbody>${guardRows}</tbody></table></div>
<p class="pgnote">景福宮の交代式は雨や雪の日も、伝統の雨具をまとって行われます。徳寿宮の儀式は集会や悪天候で中止になることがあります。出典：国家遺産振興院（kh.or.kr）・ソウル王宮守門将（royalguard.kr）。</p></div>

<div class="pgc"><h2>🌙 夜の王宮 — 予約なしで入れるのは、この2つです</h2>
<p>「夜の景福宮」は写真で見たことがあると思います。ただしあれは<b>星あかりの夜行（별빛야행）</b>などの特別プログラムで、<b>完全予約制・韓国語のサイト・抽選</b>です。日本から取るのは簡単ではありませんし、当日思い立って行けるものでもありません。${starLine}</p>
<p>けれど<b>${esc(night.join('と'))}は、通年で夜9時まで開いています</b>（入場は20:00まで）。予約は要りません。料金も昼と同じ1,000ウォンです。仕事や買い物のあと、思い立って行ける夜の宮があるということです。ライトアップされた石垣と木の建物を、人の少ない時間に歩けます。</p>
<p>${esc(night.join('と'))}は地下鉄でも行きやすい場所にあります。徳寿宮は市庁駅のすぐ前、昌慶宮は昌徳宮の隣です。<b>徳寿宮の石垣道（トルダムキル）</b>は入場券なしで歩けるので、閉門後でも散歩になります。</p>
<p class="pgnote">特別夜間観覧の日程・予約は宮陵遺跡本部の統合予約ページで公開されます。回によって開催期間が違います。</p></div>

<div class="pgc"><h2>🏮 全国の「夜だけ開く日」 — 国家遺産夜行</h2>
<p>ソウルの宮だけの話ではありません。韓国の地方都市では<b>国家遺産夜行（국가유산 야행）</b>という催しがあり、その週末だけ<b>普段は夜に入れない史跡が開き、灯りがともります</b>。城壁や邑城、旧市街、近代建築の街区が会場になります。地方に足を延ばすなら、この日程に合わせると同じ街がまったく違って見えます。</p>
<p>私たちが持っているデータでは、開催が<b>${monName}に集中</b>しています。春に一度、夏の終わりから秋にもう一度、という形です。</p>
${yaBlock}
<p class="pgnote">名称は<b>ハングルのまま</b>載せています — 検索や地図アプリに貼るための文字なので訳していません。開催日は変更されることがあります。行く前に各自治体の公式サイトで確認してください。出典：文化体育観光部「文化祭り標準データ」・韓国観光公社。</p>
<p>その街まで何分でいくらかは<a href="/ja/daytrip/" style="color:#0c7d72;font-weight:700">日帰りで行ける街</a>にまとめてあります。</p></div>

<div class="pgc"><h2>⚠️ 出かける前の4つ</h2>
<ol class="pgol">
<li><b>行く日の曜日を先に見る</b> — 月曜なら${esc(tueOff.join('・'))}、火曜なら${esc(monOff.join('・'))}。逆にすると門の前で引き返すことになります。</li>
<li><b>韓服を借りるなら、上下そろっているか確認する</b> — ワンピース型やTシャツ型は無料になりません。</li>
<li><b>日本語ガイドの時間に合わせて入る</b> — 予約は要りませんが、出発時刻を過ぎると参加できません。</li>
<li><b>混む日を避ける</b> — 韓国の連休と日本の連休が重なる週は、宮も交通も別物になります。<a href="/ja/busy/" style="color:#0c7d72;font-weight:700">韓国が混む日</a>で先に確認してください。</li>
</ol></div>

<div class="pgnav">
<a href="/ja/busy/">📅 韓国が混む日</a>
<a href="/ja/closed/">🚪 休む日 — 店は開いているか</a>
<a href="/ja/daytrip/">🚄 日帰りで行ける街</a>
<a href="/ja/places/seoul/">📍 ソウルで行ける場所</a>
<a href="/ja/calendar/">🗓️ いつ行くか</a>
</div>

${/* 🇰🇷 코리 블록으로 가는 «다리» 한 줄. 상품 링크는 본문에 넣지 않는다 —
     코리 블록은 writePage 가 맨 아래에 자동으로 붙인다. 여기서는 이 페이지의 논리 안에 있는
     문장 하나만 둔다. 이 페이지는 내내 「궁에 가는 날」을 정해 줬다. 그 하루의 끝에
     북촌·인사동이 붙는다 — 억지로 끌어온 이야기가 아니다. */''}
<p style="color:#57534e;font-size:.93rem;line-height:1.8;margin:22px 0 0">🎁 <b>王宮を見たあとの足で、そのまま北村や仁寺洞へ歩けます。</b>景福宮の東側から北村までは徒歩10分ほど、昌徳宮からは仁寺洞がすぐです。韓国らしい小物を探すなら、宮を見た日の午後がいちばん自然な流れになります。</p>
</div></main>`;

  writePage('ja/palace', layout(
    'ソウルの王宮 休館日・料金・韓服無料 — 日本語ガイドの時間つき | チュクチェモア',
    '景福宮・宗廟は火曜休み、昌徳宮・昌慶宮・徳寿宮は月曜休み。料金と統合券、韓服が無料になる条件、守門将交代式の時刻、そして予約不要・無料の日本語ガイド1日' + jpSlots + '回の時間を公式情報からまとめました。',
    '/ja/palace/', content, { lang: 'ja' }));

  console.log('✓ /ja/palace/ — 궁 ' + PAL.length + '곳 · 일본어 해설 ' + jpSlots + '회 · 야행 예정 ' + upcoming.length + '건(전체 ' + YA.length + ')');
  return ['/ja/palace/'];
}

module.exports = { build };
