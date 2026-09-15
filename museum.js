// 🏛 /{도시}/museum/ — 박물관·미술관을 «사람들이 많이 찾는 순»으로
//
// 왜 (2026-09-11, 장남 님)
//   「사람들이 많이 가는 곳을 중점적으로 앞쪽에 배치해줘. 그래야 사이트가 신뢰가 있다고 생각하거든.」
//   방문자 데이터(visitors.json)는 «시·군·구» 단위라 개별 시설을 못 가른다.
//   → 축제 순서에서 이미 검증된 방법(네이버 월간 검색량)을 그대로 쓴다.
//     국립중앙박물관 433,200 · 국립현대미술관 서울 86,400 · 리움 62,100 …
//
// ⚠️ 이미 `/jeju/museum` 이 있다(jeju.js, 제주 전용 API). 그건 건드리지 않는다.
//    이 모듈은 서울·부산만 만든다. `/seoul/` `/busan/` 허브는 seoul.js 담당이라 손대지 않는다.
//
// 데이터: data/accessible.json (공공데이터 무장애 정보 — 좌표·사진·시설 포함)
//         data/museum_volume.json (_museum_volume.py 가 받은 검색량)
//         data/seoul_culture.json 이 있으면 「전시가 자주 열리는 공간」 절을 덧붙인다
const fs = require('fs'), path = require('path');

function build(ctx) {
  const { ROOT, layout, writePage, SITE_NAME, TODAY, esc, buyBox } = ctx;
  const J = f => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')); } catch (e) { return null; } };
  const acc = J('data/accessible.json');
  const VOL = J('data/museum_volume.json') || {};
  if (!acc) { console.log('  ⚠️ accessible.json 없음 — /museum/ 건너뜀'); return []; }

  const volOf = n => (VOL[n] || {}).vol || 0;
  const RE = /박물관|미술관|전시관|기념관|과학관/;
  const CITY = [
    { key: 'seoul', ko: '서울', josa: '서울' },
    { key: 'busan', ko: '부산', josa: '부산' }
  ];
  const URLS = [];

  // 「전시가 자주 열리는 공간」 — 서울만. 누적 전시 기록을 공간별로 센 것.
  const SC = J('data/seoul_culture.json');
  // ⚠️ /museum/ 안에는 «상위 10곳»만 싣는다. 242곳 전부는 /seoul/venue/ 로 따로 낸다 —
  //    같은 표를 두 페이지에 통째로 넣으면 서로 중복 페이지가 된다(전에 /exhibition/ 으로 한 번 겪었다).
  const venueOf = key => (key === 'seoul' && SC && Array.isArray(SC.venue)) ? SC.venue.slice(0, 10) : [];

  // 🎫 2026-09-15 신설 — 「가면 지금 뭘 볼 수 있나」.
  //
  //   왜: 부산 페이지가 얇았다(본문 5,938자 · 카드 22장이 전부). 서울은 114곳이라 목록만으로도
  //   두꺼운데, 부산은 22곳뿐이라 «곳 이름»밖에 없었다. 그런데 사람이 박물관을 찾을 때 실제로
  //   궁금한 건 «거기 지금 뭐 하나»다 — 상설 전시만 있는 곳과 기획전이 도는 곳은 다른 선택이다.
  //
  //   데이터는 이미 있었다. 도시 문화행사 공공데이터의 «장소명»을 박물관 이름과 맞추면 된다.
  //   ⚠️ 매칭률을 먼저 쟀다(_musmatch.js): 부산 5/22곳 12건 · 서울은 live 417건에서 매칭.
  //      적다고 버리지 않는다 — 5곳에 «지금 하는 전시»가 뜨는 것과 아무 데도 안 뜨는 것은 다르다.
  //      그리고 안 걸린 곳은 「상설 전시」라는 것도 정보다.
  //   ⚠️ 공백·괄호·가운뎃점을 뗀 뒤 비교한다. 「부산 시립미술관」과 「부산시립미술관」이 같은 곳이다.
  const CULT = { seoul: SC, busan: J('data/busan_culture.json') };
  const T8 = TODAY.replace(/-/g, '');
  const normP = s => String(s || '').replace(/\s|\(.*?\)|·/g, '');
  const nowShowOf = (key, title) => {
    const d = CULT[key];
    const rows = (d && (d.rows || d.live)) || [];
    const n = normP(title);
    if (!n || n.length < 3) return [];
    return rows.filter(r => {
      const p = normP(r.place);
      if (!p || !(p === n || p.includes(n) || n.includes(p))) return false;
      const end = String(r.end || '').replace(/-/g, '');
      return !end || end >= T8;       // 끝난 것은 뺀다
    }).sort((a, b) => String(a.end).localeCompare(String(b.end)));
  };

  const CSS = `<style>
.mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;margin:12px 0 20px}
.mcard{background:#fff;border:1.5px solid #eef2f1;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(31,41,55,.05)}
.mcard img{width:100%;height:145px;object-fit:cover;display:block;background:#f4faf8}
.mbody{padding:12px 14px}
.mcard h3{font-size:1rem;font-weight:800;color:#111827;margin:0 0 6px;line-height:1.4}
.mmeta{color:#4b5563;font-size:.88rem;line-height:1.7}
.mov{color:#374151;font-size:.88rem;line-height:1.72;margin:7px 0 0}
.mrank{display:inline-block;background:#0f9d8f;color:#fff;font-weight:900;font-size:.8rem;border-radius:6px;padding:1px 8px;margin-right:6px}
.macc{display:inline-block;background:#eef6ff;color:#1d4ed8;font-weight:700;font-size:.8rem;border-radius:6px;padding:1px 7px;margin:3px 4px 0 0}
.mlinks{margin-top:8px;display:flex;gap:10px}
.mlinks a{color:#0c7d72;font-weight:700;font-size:.85rem}
.mrest{color:#374151;font-size:.95rem;line-height:2}
.mrest a{color:#0c7d72;font-weight:700}
.vrank{list-style:none;padding:0;margin:10px 0 18px;display:grid;gap:7px}
.vrank li{display:flex;align-items:baseline;gap:9px;background:#f6fbfa;border:1.5px solid #dcefeb;border-radius:11px;padding:9px 13px}
.vrank .vn{font-weight:900;color:#0f9d8f;min-width:26px}
.vrank .vp{font-weight:800;color:#111827}
.vrank .vg{color:#6b7280;font-size:.87rem}
.vrank .vc{margin-left:auto;color:#0a6c63;font-weight:800;font-size:.9rem;white-space:nowrap}
.vrank a.vp{color:#0c7d72;text-decoration:none}
.vnow{background:#e8f7ef;color:#0a7a44;font-weight:800;font-size:.8rem;border-radius:6px;padding:1px 7px;white-space:nowrap}
.mnow{background:#f0fbf5;border:1.5px solid #cdeedd;border-radius:10px;padding:8px 11px;margin:8px 0 2px;color:#0a7a44;font-size:.85rem;line-height:1.7}
.mnow b{color:#111827;font-weight:800}
.mnd{color:#6b7280;font-weight:700;white-space:nowrap}
.mfree{background:#e8f7ef;color:#0a7a44;font-weight:800;font-size:.78rem;border-radius:5px;padding:0 6px}
.mnowlist{list-style:none;padding:0;margin:10px 0 18px;display:grid;gap:9px}
.mnowlist li{background:#fff;border:1.5px solid #eef2f1;border-left:4px solid #0f9d8f;border-radius:10px;padding:10px 14px;line-height:1.7}
.mnowrow{color:#374151;font-size:.92rem;margin-top:3px}
</style>`;

  // 무장애 배지 — 공공데이터가 «있다»고 한 것만 적는다(없으면 아무 말도 안 한다)
  const accBadges = m => {
    const a = m.acc;
    if (!Array.isArray(a) || !a.length) return '';
    const want = [['주차', /주차/], ['휠체어', /휠체어|경사|승강|엘리베이터/], ['화장실', /화장실/],
                  ['점자·음성', /점자|음성|안내견/], ['수유실', /수유/]];
    const on = want.filter(([, re]) => a.some(s => re.test(String(s))));
    if (!on.length) return '';
    return `<div>${on.map(([t]) => `<span class="macc">♿ ${t}</span>`).join('')}</div>`;
  };

  // ⚠️ 소개글 길이는 «곳 수»에 따라 다르다. 서울 114곳에 200자씩이면 페이지가 부풀고,
  //    부산 22곳에 115자면 페이지가 얇다. 목록이 짧을수록 한 곳을 깊게 적는다.
  const card = (m, i, ctx2) => {
    const ovLen = (ctx2 && ctx2.ovLen) || 115;
    const now = (ctx2 && ctx2.now) || [];
    const ov = String(m.ov || '').replace(/\s+/g, ' ');
    return `<div class="mcard">
${m.img ? `<img src="${esc(m.img)}" alt="${esc(m.title)}" loading="lazy" onerror="this.remove()">` : ''}
<div class="mbody">
<h3><span class="mrank">${i + 1}</span>${esc(m.title)}</h3>
<div class="mmeta">📍 ${esc(m.sigungu || '')}${m.addr ? ' · ' + esc(String(m.addr).slice(0, 40)) : ''}</div>
${now.length ? `<div class="mnow">🟢 지금 전시 중 · ${now.length}건<br>${now.slice(0, 2).map(r =>
      `<b>${esc(String(r.title).slice(0, 34))}</b>${r.end ? ` <span class="mnd">~${esc(String(r.end).replace(/(\d{4})-?(\d{2})-?(\d{2})/, '$2.$3'))}</span>` : ''}`).join('<br>')}</div>` : ''}
${ov ? `<p class="mov">${esc(ov.slice(0, ovLen))}${ov.length > ovLen ? '…' : ''}</p>` : ''}
${accBadges(m)}
<div class="mlinks">
<a href="https://map.naver.com/p/search/${encodeURIComponent(m.title)}" target="_blank" rel="noopener">🗺️ 지도</a>
<a href="https://search.naver.com/search.naver?query=${encodeURIComponent(m.title + ' 관람시간')}" target="_blank" rel="noopener">🕘 관람시간</a></div>
</div></div>`;
  };

  CITY.forEach(c => {
    const all = acc.filter(x => x.sido === c.ko && RE.test(x.title || ''))
      .sort((a, b) => volOf(b.title) - volOf(a.title) || String(a.title).localeCompare(String(b.title)));
    if (all.length < 10) { console.log('  ⚠️ %s 박물관 %d곳뿐 — 건너뜀', c.ko, all.length); return; }

    const TOP = Math.min(24, all.length);
    const top = all.slice(0, TOP), rest = all.slice(TOP);
    const known = all.filter(m => volOf(m.title) >= 1000).length;
    const withAcc = all.filter(m => Array.isArray(m.acc) && m.acc.length).length;
    const gu = {}; all.forEach(m => { if (m.sigungu) gu[m.sigungu] = (gu[m.sigungu] || 0) + 1; });
    const guTop = Object.entries(gu).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const M = +TODAY.slice(5, 7);
    const ven = venueOf(c.key);
    // 곳마다 «지금 하는 전시»를 한 번만 계산해 둔다(카드와 아래 절이 같은 값을 쓴다)
    const NOW = new Map(all.map(m => [m.title, nowShowOf(c.key, m.title)]));
    const nowPlaces = all.filter(m => (NOW.get(m.title) || []).length);
    const nowCount = nowPlaces.reduce((s, m) => s + NOW.get(m.title).length, 0);
    // 목록이 짧으면 한 곳을 깊게 적는다 — 부산 22곳은 220자, 서울 114곳은 115자
    const OVLEN = all.length <= 40 ? 220 : 115;
    const cardOf = (m, i) => card(m, i, { ovLen: OVLEN, now: NOW.get(m.title) || [] });

    const FAQ = [
      [`${c.ko}에서 가장 많이 찾는 박물관은 어디인가요?`,
        `검색량 기준으로 <b>${esc(all[0].title)}</b>입니다. 이 페이지의 순서는 네이버에서 실제로 한 달에 몇 번 검색되는지를 재서 매긴 것이라, 위에 있을수록 사람들이 많이 찾는 곳입니다.`],
      ['순서는 무슨 기준인가요?',
        '네이버 월간 검색량입니다. 저희가 좋다고 생각하는 순서가 아니라 <b>사람들이 실제로 찾아본 횟수</b>이고, 돈을 받고 순서를 바꾸지 않습니다.'],
      // ⚠️ 2026-09-11: 지어 놓고 세어 보니 **서울 114곳·부산 22곳 모두 무장애 상세가 0건**이었다
      //    (fetch-accessible.js 가 detailWithTour2 를 이미 다 조회했고 enr=1 — 「못 받은」 게 아니라 「없는」 것이다).
      //    그런데 제목·설명·머리글·FAQ가 전부 무장애 정보를 «있다»고 말하고 있었다. 없는 걸 있다고 쓰면
      //    들어온 사람이 찾다가 나간다 — 그게 신뢰를 깎는다. 그래서 0이면 그 말을 통째로 뺀다.
      ...(withAcc ? [['휠체어로 갈 수 있는 곳인지 알 수 있나요?',
        `카드에 붙은 ♿ 배지는 <b>공공데이터에 「있다」고 등록된 편의시설만</b> 표시한 것입니다. ${c.ko}의 ${all.length}곳 가운데 ${withAcc}곳에 이 정보가 있습니다. 배지가 없다고 시설이 없다는 뜻은 아니고, <b>등록되지 않았다</b>는 뜻이니 방문 전 확인해 주세요.`]]
        : [['이 목록은 어디서 가져온 것인가요?',
        `한국관광공사 공공데이터에 등록된 ${c.ko}의 박물관·미술관 ${all.length}곳 전부입니다. 저희가 고르거나 뺀 곳은 없고, <b>순서만</b> 검색량으로 매겼습니다. 소개 글도 관광공사가 제공하는 원문을 줄인 것입니다.`]]),
      ['관람시간과 요금은 왜 안 적혀 있나요?',
        '휴관일과 요금은 기관마다 자주 바뀌고 공공데이터가 이를 따라가지 못합니다. 틀린 시간을 적는 것보다 낫다고 보아, 각 카드에 <b>관람시간 검색 버튼</b>을 두어 최신 정보로 바로 갈 수 있게 했습니다.'],
      [`${c.ko}에서 지금 하는 전시도 볼 수 있나요?`,
        `네. <a href="/${c.key}/exhibition/">${c.ko} 전시회</a>에서 지금 열리고 있는 전시를 날짜순으로 볼 수 있습니다.`],
      // 🎫 2026-09-15 — 실제로 계산한 값만 쓴다. 0곳이면 이 질문 자체를 넣지 않는다.
      ...(nowPlaces.length ? [[`지금 기획전이 열리는 곳은 몇 곳인가요?`,
        `${all.length}곳 가운데 <b>${nowPlaces.length}곳</b>에서 ${nowCount}건이 열리고 있습니다(${esc(nowPlaces.slice(0, 3).map(m => m.title).join(', '))} 등). 나머지는 상설 전시가 중심이라 기간에 상관없이 볼 수 있습니다.`]] : []),
      [`하루에 몇 곳까지 볼 수 있나요?`,
        `같은 ${c.key === 'seoul' ? '자치구' : '구·군'} 안이면 두세 곳까지 묶을 만합니다. ${c.ko}에서 가장 많이 모여 있는 곳은 <b>${esc(guTop[0] ? guTop[0][0] : '')}</b>(${guTop[0] ? guTop[0][1] : 0}곳)입니다. 다만 전시 관람은 한 곳에 보통 1~2시간이 걸리고, 큰 박물관은 반나절이 그대로 갑니다. 욕심내지 않는 편이 낫습니다.`],
      ['휴관일은 언제인가요?',
        '국공립 박물관·미술관은 <b>월요일 휴관</b>인 곳이 많고, 설날·추석 당일에도 대부분 쉽니다. 다만 기관마다 다르고 바뀌기도 해서 저희가 단정해 적지 않습니다. 각 카드의 <b>관람시간 검색 버튼</b>으로 확인하세요.']
    ];

    const content = `<main><div class="wrap">
${CSS}
<h1 style="font-size:1.5rem;margin-bottom:6px">${c.ko} 박물관·미술관 ${all.length}곳 — 많이 찾는 순</h1>
<p class="note">순서는 <b>네이버 월간 검색량</b>입니다. 사람들이 실제로 가장 많이 찾아보는 곳부터 놓았습니다.
${withAcc ? '공공데이터의 <b>무장애 편의시설</b> 정보도 함께 실었습니다. ' : '각 카드의 소개 글은 한국관광공사 공공데이터 원문입니다. '}${TODAY.slice(0, 4)}년 ${M}월 기준.</p>

${/* 🎫 2026-09-15 — 「가면 지금 뭘 볼 수 있나」. 안 걸린 곳이 «상설 전시»라는 것도 정보다.
      ⚠️ 카드 목록«보다 먼저» 둔다. 짧고 결정에 바로 쓰이는 정보가 앞이다 —
         22~114장짜리 카드 그리드 뒤에 두면 아무도 안 내려간다(구매박스에서 배운 것과 같다). */''}
${nowPlaces.length ? `<h2 class="sec">지금 전시가 열리고 있는 곳 ${nowPlaces.length}곳</h2>
<p style="color:#374151;font-size:.95rem;line-height:1.8">${c.ko}의 박물관·미술관 ${all.length}곳 가운데
<b>${nowPlaces.length}곳</b>에서 지금 기획전이 열리고 있습니다(합계 <b>${nowCount}건</b>).
나머지 ${all.length - nowPlaces.length}곳은 <b>상설 전시</b>가 중심이라 언제 가도 볼 것이 있습니다 —
기간이 정해진 전시를 보려면 아래 목록부터 보세요.</p>
<ul class="mnowlist">${nowPlaces.map(m => {
      const rs = NOW.get(m.title);
      return `<li><b>${esc(m.title)}</b> <span class="vg">${esc(m.sigungu || '')}</span>
${rs.slice(0, 3).map(r => `<div class="mnowrow">· ${esc(String(r.title).slice(0, 52))}${r.end ? ` <span class="mnd">~${esc(String(r.end).replace(/(\d{4})-?(\d{2})-?(\d{2})/, '$2.$3'))}</span>` : ''}${r.free || r.pay === false ? ' <span class="mfree">무료</span>' : ''}</div>`).join('')}
${rs.length > 3 ? `<div class="mnowrow" style="color:#9ca3af">· 외 ${rs.length - 3}건</div>` : ''}</li>`;
    }).join('')}</ul>
<p class="note">${c.key === 'busan' ? '부산광역시 문화포털' : '서울시 문화행사'} 공공데이터에서 <b>장소 이름이 일치하는 것만</b> 뽑았습니다.
이름이 다르게 등록된 전시는 못 잡을 수 있으니, 안 보인다고 전시가 없는 것은 아닙니다.</p>` : ''}

${/* 📍 자치구별 분포 — 22곳이 열 개 구에 흩어져 있으면 «하루에 몇 곳»이 실제 질문이 된다 */''}
${guTop.length > 1 ? `<h2 class="sec">어느 동네에 몰려 있나</h2>
<p style="color:#374151;font-size:.95rem;line-height:1.8">${c.ko} ${all.length}곳은 ${Object.keys(gu).length}개 ${c.key === 'seoul' ? '자치구' : '구·군'}에 흩어져 있습니다.
가장 많은 곳은 <b>${esc(guTop[0][0])} ${guTop[0][1]}곳</b>입니다. 두세 곳이 같은 동네에 있으면 하루에 묶어 볼 수 있습니다.</p>
<p class="mrest">${guTop.map(([g, n]) => {
      const list = all.filter(m => m.sigungu === g);
      return `<b>${esc(g)} ${n}곳</b> — ${list.slice(0, 5).map(m => esc(m.title)).join(' · ')}${list.length > 5 ? ` 외 ${list.length - 5}` : ''}`;
    }).join('<br>')}</p>` : ''}

${/* 🏛 2026-09-15 — 여기 있던 상품이 「장 보러 갈 때 손이 편하려면 — 장보기 카트」였고
      위치도 </main> 바깥(본문 맨 끝)이었다. 박물관 관람객에게 장보기 카트는 맞지 않는다.
      실내에서 실제로 생기는 불편은 «두세 시간 서서 걷는 것»과 «배터리»다 — 그 둘로 바꾼다.
      자리는 «어디 갈지 고른 직후». 아래로는 나머지 목록과 전시공간 순위가 길게 이어진다. */''}
${buyBox('indoor_walk')}

<h2 class="sec">가장 많이 찾는 ${TOP}곳</h2>
<p style="color:#6b7280;font-size:.94rem">${c.ko}의 박물관·미술관 ${all.length}곳 중 검색량 상위 ${TOP}곳입니다. 1위는 <b>${esc(all[0].title)}</b>(월 ${volOf(all[0].title).toLocaleString()}회).</p>
<div class="mgrid">${top.map(cardOf).join('')}</div>

${rest.length ? `<h2 class="sec">그 밖의 ${rest.length}곳</h2>
<p style="color:#6b7280;font-size:.94rem">검색량은 적지만 ${c.ko}에 실제로 있는 곳입니다. 자치구별로 묶었습니다.</p>
${guTop.map(([g]) => {
      const list = rest.filter(m => m.sigungu === g);
      if (!list.length) return '';
      return `<h3 style="margin:14px 0 4px;font-size:1rem;font-weight:800">${esc(g)} <span style="color:#9ca3af;font-weight:600">${list.length}곳</span></h3>
<p class="mrest">${list.map(m => `<a href="https://map.naver.com/p/search/${encodeURIComponent(m.title)}" target="_blank" rel="noopener">${esc(m.title)}</a>`).join(' · ')}</p>`;
    }).join('')}
${(() => { const etc = rest.filter(m => !guTop.some(([g]) => g === m.sigungu));
      return etc.length ? `<h3 style="margin:14px 0 4px;font-size:1rem;font-weight:800">그 밖의 지역 <span style="color:#9ca3af;font-weight:600">${etc.length}곳</span></h3>
<p class="mrest">${etc.map(m => `<a href="https://map.naver.com/p/search/${encodeURIComponent(m.title)}" target="_blank" rel="noopener">${esc(m.title)}</a>`).join(' · ')}</p>` : ''; })()}` : ''}

${ven.length ? `<h2 class="sec">🖼 전시가 «자주» 열리는 공간 ${ven.length}곳</h2>
<p style="color:#6b7280;font-size:.94rem;margin-bottom:2px">상위 ${ven.length}곳만 보입니다 — <a href="/seoul/venue/" style="color:#0c7d72;font-weight:800">서울 전시 공간 ${SC && SC.venue ? SC.venue.length : ''}곳 전체 보기 →</a></p>
<p style="color:#374151;font-size:.95rem;line-height:1.8">박물관은 상설 전시가 있지만, 기획 전시는 갤러리·문화재단 공간에서 더 자주 열립니다.
서울시 문화행사 데이터에 <b>지금까지 등록된 전시 기록을 공간별로 세어</b> 순위를 냈습니다. 자주 열린다는 건 <b>언제 가도 볼 것이 있을 가능성이 높다</b>는 뜻입니다.</p>
<ol class="vrank">${ven.map((v, i) => `<li><span class="vn">${i + 1}</span>
<span><span class="vp">${esc(v.place)}</span> <span class="vg">${esc(v.gu || '')}</span></span>
<span class="vc">${v.n}회</span></li>`).join('')}</ol>
<p class="note">공공데이터에 등록된 전시 건수입니다. 등록되지 않은 전시는 세지 못하므로 실제 운영 횟수와 다를 수 있습니다.</p>` : ''}

<h2 class="sec">자주 묻는 것</h2>
<div class="faqbox">${FAQ.map(q => `<details><summary>${q[0]}</summary><p>${q[1]}</p></details>`).join('')}</div>

<h2 class="sec">${c.ko}에서 더 볼 것</h2>
<p style="color:#374151;font-size:.95rem;line-height:1.8">
<a href="/${c.key}/exhibition/"><b>${c.ko} 전시회</b></a> — 지금 열리고 있는 전시 ·
<a href="/${c.key}/festival/"><b>${c.ko} 축제</b></a> — 이달 축제 ·
<a href="/${c.key}/"><b>${c.ko} 전체</b></a>${CITY.filter(x => x.key !== c.key).map(o => ` ·
<a href="/${o.key}/museum/"><b>${o.ko} 박물관·미술관</b></a> — 다른 도시`).join('')}</p>
</div></main>`;

    const title = `${c.ko} 박물관·미술관 ${all.length}곳 — 많이 찾는 순${withAcc ? '·무장애 정보' : ''} | ${SITE_NAME}`;
    const desc = withAcc
      ? `${c.ko}의 박물관·미술관 ${all.length}곳을 네이버 검색량 순으로 정리했습니다. 1위 ${all[0].title}. 휠체어·주차·화장실 등 무장애 편의시설 정보(${withAcc}곳)도 함께 봅니다.`
      : `${c.ko}의 박물관·미술관 ${all.length}곳을 네이버 월간 검색량 순으로 정리했습니다. 1위 ${all[0].title}. 사람들이 실제로 많이 찾는 곳부터, 소개·위치·관람시간 확인까지 한 번에.`;
    const ld = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: FAQ.map(q => ({ '@type': 'Question', name: q[0].replace(/<[^>]+>/g, ''),
        acceptedAnswer: { '@type': 'Answer', text: q[1].replace(/<[^>]+>/g, '') } }))
    })}</script>`;
    // ⚠️ buyBox 를 여기 더하지 말 것 — content 가 </main> 로 끝나 본문 밖·맨 끝이 된다. 이미 본문 안에 있다.
    writePage(c.key + '/museum', layout(title, desc, `/${c.key}/museum/`, content, { jsonld: ld }));
    URLS.push(`/${c.key}/museum/`);
    console.log('✓ /%s/museum/ — %d곳(1위 %s 월 %s) · 무장애 %d · 전시공간 %d',
      c.key, all.length, all[0].title, volOf(all[0].title).toLocaleString(), withAcc, ven.length);
  });
  // ══════════════════════════════════════════════════════════════════════
  // 🖼 /seoul/venue/ — 서울 전시 공간 디렉터리
  //
  // 왜 따로 만드나 (2026-09-11)
  //   ⚠️ 먼저 «이미 있는 것»을 세어 봤다. /seoul/exhibition/ 은 본문 17,259자에 «지금 하는 전시 105건»을
  //     날짜순으로 싣고 있다. 그걸 또 만들면 중복 페이지다(전에 한 번 지어 놓고 되돌린 적이 있다).
  //   이 페이지는 «행사»가 아니라 «장소»다 — 전시가 실제로 자주 열리는 공간 242곳의 명부.
  //     찾는 말도 다르다: 「서울 갤러리」·「전시 공간」은 날짜가 아니라 «어디»를 묻는 말이다.
  //   ⭐ 순서는 여기서도 «사람들이 많이 가는 순»이다. 다만 재료가 다르다 — 갤러리는 검색량이 거의 0이라
  //     대신 «실제로 전시가 몇 번 열렸나»(서울시 문화행사 등록 건수)를 썼다. 자주 열린다 = 가도 볼 게 있다.
  // ══════════════════════════════════════════════════════════════════════
  if (SC && Array.isArray(SC.venue) && SC.venue.length >= 50) {
    const V = SC.venue;
    const live = Array.isArray(SC.live) ? SC.live : [];
    const nowBy = {};   // 공간별 «지금 열려 있는» 전시 수
    live.forEach(e => { if (/전시|미술/.test(e.cat || '') && e.place) nowBy[e.place] = (nowBy[e.place] || 0) + 1; });
    const HOT = V.filter(v => v.n >= 10);          // 42곳
    const RESTV = V.filter(v => v.n < 10);
    const guMap = {}; RESTV.forEach(v => (guMap[v.gu || '그 밖'] = guMap[v.gu || '그 밖'] || []).push(v));
    const guList = Object.entries(guMap).sort((a, b) => b[1].length - a[1].length);
    const mapLink = p => `https://map.naver.com/p/search/${encodeURIComponent('서울 ' + p)}`;
    const totalN = V.reduce((s, v) => s + v.n, 0);

    const VFAQ = [
      ['이 순위는 무슨 기준인가요?',
        `서울시 문화행사 공공데이터에 <b>등록된 전시 기록을 공간별로 센 것</b>입니다. 전체 ${SC.total.toLocaleString()}건을 훑어 전시가 3회 이상 열린 곳 ${V.length}곳을 추렸고, 많이 열린 순으로 놓았습니다. 저희 취향도 아니고 광고도 아닙니다.`],
      ['전시 횟수가 많으면 좋은 곳인가요?',
        '좋고 나쁨을 재는 값은 아닙니다. 다만 <b>가도 볼 것이 있을 가능성</b>은 확실히 높습니다. 1년에 한두 번 여는 곳은 헛걸음하기 쉽지만, 연 10회 이상 여는 곳은 대개 다음 전시가 이어집니다.'],
      ['지금 뭘 하는지도 볼 수 있나요?',
        '네. <a href="/seoul/exhibition/"><b>서울 전시회</b></a>에서 지금 열리고 있는 전시를 날짜순으로 봅니다. 이 페이지에서 <b>🟢 지금 전시 중</b> 표시가 붙은 곳이 현재 진행 중인 곳입니다.'],
      ['박물관·미술관은 왜 여기 거의 없나요?',
        `국립중앙박물관 같은 곳은 <b>상설 전시</b>가 중심이라 「행사」로 새로 등록되는 일이 드뭅니다. 그래서 이 명부에는 기획 전시를 자주 여는 갤러리·문화재단 공간이 주로 올라옵니다. 박물관·미술관은 <a href="/seoul/museum/"><b>서울 박물관·미술관</b></a>에서 따로 봅니다.`],
      ['빠진 공간이 있는 것 같아요.',
        '서울시 문화행사에 <b>등록하지 않은</b> 전시는 셀 수 없습니다. 상업 갤러리는 등록을 잘 하지 않아 실제보다 적게 잡힙니다. 이 명부는 「서울에 있는 갤러리 전부」가 아니라 「공공데이터로 확인되는 곳」입니다.']
    ];

    const vrow = (v, i) => {
      const now = nowBy[v.place] || 0;
      return `<li><span class="vn">${i + 1}</span>
<span style="flex:1;min-width:0"><a class="vp" href="${mapLink(v.place)}" target="_blank" rel="noopener">${esc(v.place)}</a>
<span class="vg">${esc(v.gu || '')}</span>${now ? ` <span class="vnow">🟢 지금 ${now}건</span>` : ''}
${v.last ? `<span class="vg"> · ${v.last > TODAY ? '예정 ~' : '최근 '}${esc(v.last)}</span>` : ''}</span>
<span class="vc">${v.n}회</span></li>`;
    };

    const vContent = `<main><div class="wrap">
${CSS}
<h1 style="font-size:1.5rem;margin-bottom:6px">서울 전시 공간 ${V.length}곳 — 전시가 자주 열리는 순</h1>
<p class="note">서울시 문화행사 공공데이터 <b>${SC.total.toLocaleString()}건</b>을 공간별로 세어, 전시가 실제로 자주 열리는 곳부터 놓았습니다.
합계 <b>${totalN.toLocaleString()}회</b>의 전시 기록. ${SC.fetched} 기준.</p>

<h2 class="sec">자주 여는 곳 ${HOT.length}곳 <span style="color:#9ca3af;font-weight:600;font-size:.95rem">(10회 이상)</span></h2>
<p style="color:#374151;font-size:.95rem;line-height:1.8">1위는 <b>${esc(V[0].place)}</b>(${esc(V[0].gu)}) ${V[0].n}회입니다.
여기 있는 곳들은 <b>언제 가도 볼 것이 있을 가능성이 높습니다</b> — 다음 전시가 대개 이어지기 때문입니다.
🟢 표시는 «지금 열려 있는 전시»가 있다는 뜻입니다.</p>
<ol class="vrank">${HOT.map(vrow).join('')}</ol>

${/* 🏛 2026-09-15 — 공연장·전시공간도 실내다. 박물관과 같은 이유로 장보기 카트를 뺐다.
      자리는 «어디 갈지 고른 직후» — 아래로는 자치구별 목록이 길게 이어진다. */''}
${buyBox('indoor_walk')}

<h2 class="sec">그 밖의 ${RESTV.length}곳 — 자치구별</h2>
<p style="color:#6b7280;font-size:.94rem">전시 기록 3~9회. 가까운 동네부터 보세요.</p>
${guList.map(([g, list]) => `<h3 style="margin:14px 0 4px;font-size:1rem;font-weight:800">${esc(g)} <span style="color:#9ca3af;font-weight:600">${list.length}곳</span></h3>
<p class="mrest">${list.sort((a, b) => b.n - a.n).map(v => `<a href="${mapLink(v.place)}" target="_blank" rel="noopener">${esc(v.place)}</a><span style="color:#9ca3af">(${v.n})</span>`).join(' · ')}</p>`).join('')}

<h2 class="sec">자주 묻는 것</h2>
<div class="faqbox">${VFAQ.map(q => `<details><summary>${q[0]}</summary><p>${q[1]}</p></details>`).join('')}</div>

<h2 class="sec">서울에서 더 볼 것</h2>
<p style="color:#374151;font-size:.95rem;line-height:1.8">
<a href="/seoul/exhibition/"><b>서울 전시회</b></a> — 지금 열리고 있는 전시 ·
<a href="/seoul/museum/"><b>서울 박물관·미술관</b></a> — 많이 찾는 순 ·
<a href="/seoul/festival/"><b>서울 축제</b></a> ·
<a href="/seoul/"><b>서울 전체</b></a></p>
</div></main>`;

    const vLd = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: VFAQ.map(q => ({ '@type': 'Question', name: q[0].replace(/<[^>]+>/g, ''),
        acceptedAnswer: { '@type': 'Answer', text: q[1].replace(/<[^>]+>/g, '') } }))
    })}</script>`;

    writePage('seoul/venue', layout(
      `서울 전시 공간 ${V.length}곳 — 전시가 자주 열리는 순 | ${SITE_NAME}`,
      `서울에서 전시가 실제로 자주 열리는 공간 ${V.length}곳. 서울시 문화행사 ${SC.total.toLocaleString()}건을 공간별로 세어 순서를 매겼습니다. 1위 ${V[0].place}(${V[0].n}회). 지금 전시 중인 곳도 함께 표시합니다.`,
      // ⚠️ 박물관 페이지와 같은 이유로 여기에 더하지 않는다 — 본문 밖이 된다. vContent 안에 있다.
      '/seoul/venue/', vContent, { jsonld: vLd }));
    URLS.push('/seoul/venue/');
    console.log('✓ /seoul/venue/ — 공간 %d곳(1위 %s %d회) · 10회이상 %d · 지금전시중 %d곳',
      V.length, V[0].place, V[0].n, HOT.length, Object.keys(nowBy).length);
  }

  return URLS;
}

module.exports = { build };
