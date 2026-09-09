// 🏮 시·군 「○○장날」 페이지 — /jangteo/{시군슬러그}/
//
// 왜 만드나 (2026-09-09 실측)
//   GA4 28일: 네이버가 전체 유입의 73%(4,910세션)이고 그중 46%가 오일장이다.
//   그런데 /jangteo/ 하위는 시·도 11장뿐이었다(그 11장이 465세션).
//   사람들은 「경북 오일장」이 아니라 **「의성장날」**로 찾는다 —
//   네이버 검색광고 실측으로 143개 시·군 「○○장날」이 월 174,150건.
//   ⭐ 「○○장날」이 「○○오일장」보다 2~4배 크다(해남장날 820 vs 해남5일장 320).
//      그래서 제목·h1 은 반드시 「장날」로 간다.
//
// ⚠️ 검색량만으로 자르지 않는다 — 검색량 1위 「영주장날」15,420 은 오일장이 아니라
//    영주시 농특산물 «쇼핑몰 이름»이자 축제 이름이었다. SERP 게이트(_jangteo_gate.py)를
//    통과한 곳만 만든다: data/jangteo_gate.json 의 gate === 'OK'.
//
// ⚠️ 얇은 페이지를 만들지 않는다. 시장이 1곳인 시·군이 많으므로(양양·고령·김포·홍천…)
//    시장 카드만으로는 못 채운다. 그래서 이 페이지는 시장 목록이 아니라 «장날 안내»다:
//      ① 다음 장날이 언제인지(날씨까지) ② 두 달치 실제 날짜 ③ 시장 상세
//      ④ 그 기간 근처 축제 ⑤ **가까운 다른 시·군의 장날**(오늘 여기 장이 안 서면 어디로)
//    그래도 본문이 하한에 못 미치면 «만들지 않는다» — 게이트는 렌더 뒤 길이로 잰다.
//
// ⚠️ build.js 의 「유령 페이지 삭제」가 /jangteo/ 하위에서 등록되지 않은 폴더를 통째로 지운다.
//    이 모듈이 돌려주는 URL 목록을 그 keep 집합에 반드시 넣어야 한다.
const fs = require('fs'), path = require('path');

const MIN_BODY = 2400;   // 렌더된 본문 최소 길이(시·도 최소가 3,076자, 시·군은 그보다 작게 잡되 얇지 않게)
const NEAR_FEST_KM = 40, NEAR_CITY_KM = 45;   // 축제 30→40km: 시·군은 시·도보다 좁아 30km면 0건이 잦다

function hav(x1, y1, x2, y2) {
  const R = 6371, r = Math.PI / 180;
  const a = Math.sin((y2 - y1) * r / 2) ** 2 +
    Math.cos(y1 * r) * Math.cos(y2 * r) * Math.sin((x2 - x1) * r / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
const DOW = ['일', '월', '화', '수', '목', '금', '토'];

// 끝자리 규칙으로 «실제 날짜»를 만든다. daysNum 의 10 은 끝자리 0을 뜻한다(literal 10) — %10 으로 비교.
function datesIn(daysNum, y, m) {
  const set = new Set((daysNum || []).map(d => d % 10));
  const out = [], last = new Date(y, m, 0).getDate();
  for (let d = 1; d <= last; d++) if (set.has(d % 10)) out.push(d);
  return out;
}

function build(ctx) {
  const { ROOT, layout, writePage, SITE, TODAY, marketsAll, apiFests, FEST_PAGES,
    WX, buyBox, jangteoModalBB, JT_LINK_JS, esc } = ctx;
  const SITE_NAME = ctx.SITE_NAME || '축제모아';
  const URLS = [];
  URLS.meta = [];   // 시·도 페이지가 읽어 갈 목록 (시·도별 시·군 링크)
  let gate;
  try { gate = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/jangteo_gate.json'), 'utf8')); }
  catch (e) { console.log('  ⚠️ jangteo_gate.json 없음 — 시·군 장날 페이지를 건너뜁니다'); return URLS; }
  let SLUG;
  try { SLUG = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sigungu_slug.json'), 'utf8')); }
  catch (e) { console.log('  ⚠️ sigungu_slug.json 없음 — 시·군 장날 페이지를 건너뜁니다'); return URLS; }

  const okCity = new Map();                      // 시·군 → 게이트 정보(검색량 등)
  gate.filter(r => r.gate === 'OK' && SLUG[r.city]).forEach(r => okCity.set(r.city, r));

  // 시·군별 시장 묶기
  const byCity = new Map();
  marketsAll.forEach(m => {
    if (!m.city || !okCity.has(m.city)) return;
    (byCity.get(m.city) || byCity.set(m.city, []).get(m.city)).push(m);
  });

  // 시·군 중심 좌표 — 「가까운 다른 시·군」 계산용
  const center = new Map();
  byCity.forEach((list, city) => {
    const p = list.filter(m => +m.x && +m.y);
    if (p.length) center.set(city, [p.reduce((s, m) => s + +m.x, 0) / p.length,
                                    p.reduce((s, m) => s + +m.y, 0) / p.length]);
  });

  const now = new Date(+TODAY.slice(0, 4), +TODAY.slice(5, 7) - 1, +TODAY.slice(8, 10));
  const Y = now.getFullYear(), M = now.getMonth() + 1, TD = now.getDate();
  const nextY = M === 12 ? Y + 1 : Y, nextM = M === 12 ? 1 : M + 1;
  const m3Y = nextM === 12 ? nextY + 1 : nextY, m3M = nextM === 12 ? 1 : nextM + 1;
  const fesLive = (apiFests || []).filter(f => +f.x && +f.y && String(f.end) >= String(TODAY).replace(/-/g, ''));

  const made = [];   // {city, slug, html, ...} — 길이 게이트를 통과한 것만 쓴다
  const skipped = [];

  byCity.forEach((list, city) => {
    const g = okCity.get(city), slug = SLUG[city], sido = list[0].region || g.sido;
    const withDay = list.filter(m => (m.daysNum || []).length)
      .sort((a, b) => (a.daysNum[0] - b.daysNum[0]) || a.name.localeCompare(b.name));
    const noDay = list.filter(m => !(m.daysNum || []).length);
    if (!withDay.length) { skipped.push(city + '(장날 아는 시장 0)'); return; }

    // ── ① 다음 장날 — 이 시·군에서 가장 가까운 날
    const nextOf = m => {
      const set = new Set(m.daysNum.map(d => d % 10));
      for (let i = 0; i < 32; i++) {
        const d = new Date(now.getTime() + i * 86400000);
        if (set.has(d.getDate() % 10)) return { d, gap: i };
      }
      return null;
    };
    const nexts = withDay.map(m => ({ m, n: nextOf(m) })).filter(o => o.n)
      .sort((a, b) => a.n.gap - b.n.gap);
    const soon = nexts[0];
    const ymd = dt => `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}`;
    const soonChip = (soon && WX && WX.dayChip) ? (WX.dayChip(soon.m.x, soon.m.y, ymd(soon.n.d)) || '') : '';
    const gapWord = g2 => g2 === 0 ? '오늘' : (g2 === 1 ? '내일' : (g2 === 2 ? '모레' : `${g2}일 뒤`));

    // ── ② 석 달치 장날 달력 (두 달로는 시장이 1곳인 시·군에서 페이지가 얇았다)
    const calRow = m => {
      const a = datesIn(m.daysNum, Y, M).filter(d => d >= TD);
      const b = datesIn(m.daysNum, nextY, nextM);
      const c3 = datesIn(m.daysNum, m3Y, m3M);
      return `<li><b>${esc(m.name)}</b> <span class="jsg-tag">${m.daysNum.join('·')}일장</span><br>
<span class="jsg-cal">${M}월 ${a.length ? a.join('·') + '일' : '남은 장 없음'} · ${nextM}월 ${b.join('·')}일 · ${m3M}월 ${c3.join('·')}일</span></li>`;
    };

    // ── ③ 시장 카드
    const nearFestOf = m => (+m.x && +m.y) ? fesLive
      .map(f => ({ f, km: hav(+m.x, +m.y, +f.x, +f.y) }))
      .filter(o => o.km <= NEAR_FEST_KM).sort((a, b) => a.km - b.km).slice(0, 3) : [];
    const card = m => `<div class="jsg-card">
${m.img ? `<img src="${esc(m.img)}" alt="${esc(m.name)} 사진" loading="lazy" onerror="this.remove()">` : ''}
<h3>${esc(m.name)}${m.daysNum.length ? ` <span class="jsg-tag">${m.daysNum.join('·')}일장</span>` : ''}</h3>
<div class="jsg-sub">${esc(sido)} ${esc(city)}${m.addr ? ' · ' + esc(m.addr) : ''}</div>
${m.famous ? `<p><b>파는 것</b> — ${esc(m.famous)}</p>` : ''}
${/* ⚠️ desc 는 ov 의 첫 문장을 120자로 자른 것이다 — 둘 다 실으면 같은 말이 두 번 나온다.
      ov 가 있으면 ov 를, 없을 때만 desc 를 쓴다. 시장이 1곳뿐인 시·군에서는 이 개요가
      페이지를 지탱하는 유일한 서술이라 «자르지 않고» 싣는다(공공데이터 원문). */''}
${m.ov ? `<p class="jsg-desc">${esc(String(m.ov).replace(/\s+/g, ' ').trim())}</p>`
      : (m.desc ? `<p class="jsg-desc">${esc(m.desc)}</p>` : '')}
<div class="jsg-meta">
${m.fair ? `📅 장날 <b>${esc(m.fair)}</b><br>` : ''}
${m.open ? `🕘 ${esc(m.open)}` : ''}${m.rest ? ` · 휴무 ${esc(m.rest)}` : ''}${(m.open || m.rest) ? '<br>' : ''}
${/* ⚠️ 표준데이터 출신은 desc 가 「1961년 개설 · 점포 70곳 · 주차 가능 · 화장실 있음」 형태라
      그 아래 park 를 또 찍으면 «주차»가 한 카드에 두 번 나온다(라이브에서 잡음). */''}
${m.park && !/주차/.test(String(m.ov || m.desc || '')) ? `🅿️ 주차 ${esc(m.park)}<br>` : ''}
${m.tel ? `☎️ ${esc(m.tel)}` : ''}
</div>
<div class="jsg-links"><a href="https://map.naver.com/p/search/${encodeURIComponent(m.name)}" target="_blank" rel="noopener">🗺️ 지도</a>
<a href="https://search.naver.com/search.naver?query=${encodeURIComponent(m.name + ' 맛집')}" target="_blank" rel="noopener">🍴 근처 맛집</a></div>
</div>`;

    // ── ④ 근처 축제 (시·군 전체 기준으로 한 번만)
    const c = center.get(city);
    const fests = c ? fesLive.map(f => ({ f, km: hav(c[0], c[1], +f.x, +f.y) }))
      .filter(o => o.km <= NEAR_FEST_KM).sort((a, b) => a.km - b.km).slice(0, 5) : [];
    const festHtml = fests.length ? `<h2 class="sec">장 보러 간 김에 — 지금 열리는 근처 축제</h2>
<p class="jsg-p">${esc(city)} 중심에서 ${NEAR_FEST_KM}km 안에서 <b>지금 열리고 있거나 앞으로 열릴</b> 축제입니다.</p>
<ul class="jsg-list">${fests.map(({ f, km }) => {
      const pg = (FEST_PAGES || []).find(p => String(p.id) === String(f.id));
      const href = pg ? `/festival/${pg.slug}/` : `/search/?q=${encodeURIComponent(f.title)}`;
      const s = String(f.start), e = String(f.end);
      return `<li><a href="${href}"><b>${esc(f.title)}</b></a> <span class="jsg-km">약 ${Math.round(km)}km</span><br>
<span class="jsg-cal">${+s.slice(4, 6)}/${+s.slice(6, 8)} ~ ${+e.slice(4, 6)}/${+e.slice(6, 8)}</span></li>`;
    }).join('')}</ul>` : '';

    // ── ⑤ 가까운 다른 시·군의 장날 — «오늘 여기 장이 안 서면 어디로»
    //     ⚠️ 페이지가 «실제로 만들어질» 곳만 링크한다(1차로 후보 전체를 담고, 아래에서 실제 생성분으로 거른다).
    const nearCities = c ? [...center.entries()]
      .filter(([o]) => o !== city)
      .map(([o, p]) => ({ city: o, km: hav(c[0], c[1], p[0], p[1]) }))
      .filter(o => o.km <= NEAR_CITY_KM).sort((a, b) => a.km - b.km).slice(0, 8) : [];

    const faq = [
      [`${city} 장날은 언제인가요?`,
        `${city}에는 장날이 확인된 오일장이 ${withDay.length}곳 있습니다. ${withDay.map(m => `${m.name}은 끝자리 ${m.daysNum.join('·')}일`).join(', ')}에 섭니다. 오일장은 5일마다 서기 때문에 날짜 끝자리만 알면 그날 장이 서는지 알 수 있습니다.`],
      [`${city} 장에서는 무엇을 파나요?`,
        withDay.filter(m => m.famous).length
          ? withDay.filter(m => m.famous).slice(0, 4).map(m => `${m.name}은 ${m.famous}`).join(', ') + ' 등이 한국관광공사 공공데이터에 판매 품목으로 등록돼 있습니다.'
          : '시장마다 다릅니다. 각 시장 카드의 정보를 참고하세요. 공공데이터에 판매 품목이 등록되지 않은 곳은 적지 않았습니다.'],
      ['비 오는 날이나 명절에도 장이 서나요?',
        '장날은 정해진 날짜에 서지만 명절 당일이나 기상이 나쁜 날에는 규모가 줄거나 쉬는 곳이 있습니다. 먼 길이라면 시장 문의처로 확인하고 출발하시길 권합니다.']
    ];

    made.push({
      city, slug, sido, g, withDay, noDay, list, soon, gapWord, soonChip,
      calRow, card, festHtml, nearCities, faq
    });
  });

  // ⚠️ 「A가 B의 산출물을, B가 A의 산출물을 필요로 하면 게이트만 먼저 돌린다」 —
  //    근처 시·군 링크는 «실제로 만들어질» 곳만 걸어야 하는데, 무엇이 만들어질지는
  //    본문 길이를 재 봐야 안다. 그래서 2패스로 간다:
  //      1패스 = 근처 링크 «없이» 본문 길이를 재서 만들 목록을 확정
  //      2패스 = 그 목록으로만 근처 링크를 걸어 렌더
  //    (1패스에서 근처 링크로 걸러 버리면 끊긴 링크가 생긴다 — 2026-09-09 실제로 그럴 뻔했다.)
  const render = (o, nearHtml) => {
    const { city, slug, sido, withDay, noDay, soon, gapWord, soonChip, calRow, card, festHtml, faq } = o;
    const dnAll = [...new Set(withDay.map(m => m.daysNum.join('·')))];
    const content = `<main><div class="wrap">
<h1 class="jsg-h1">${esc(city)} 장날 — 오일장 ${withDay.length}곳, 다음 장날과 파는 것</h1>
<p class="jsg-lead">${esc(sido)} ${esc(city)}에서 <b>장날이 확인된 오일장 ${withDay.length}곳</b>입니다. 오일장은 <b>5일마다</b> 서기 때문에 날짜 끝자리만 알면 그날 장이 서는지 알 수 있습니다. ${esc(city)}의 장은 끝자리 ${dnAll.map(d => `<b>${d}일</b>`).join(', ')}에 섭니다.</p>

${soon ? `<div class="jsg-next">
<div class="jsg-next-l">다음 장날</div>
<div class="jsg-next-d">${soon.n.d.getMonth() + 1}월 ${soon.n.d.getDate()}일 (${DOW[soon.n.d.getDay()]}) · <b>${gapWord(soon.n.gap)}</b></div>
<div class="jsg-next-m">${esc(soon.m.name)}${soonChip}</div>
</div>` : ''}

${/* ⚠️ 제목과 내용이 «같은 말»이어야 한다 — 두 달치로 만들었다가 석 달치로 늘리고
      제목을 안 고쳐서 「9월·10월」이라 써 놓고 11월까지 싣고 있었다(2026-09-09 라이브에서 잡음). */''}
<h2 class="sec">${M}월 · ${nextM}월 · ${m3M}월 장날 달력</h2>
<p class="jsg-p">끝자리 규칙으로 계산한 <b>실제 날짜</b>입니다. ${M}월은 오늘(${M}월 ${TD}일) 이후만 적었습니다.</p>
<ul class="jsg-list">${withDay.map(calRow).join('')}</ul>

<div class="nextup">
<div class="nextup-t">${esc(city)} 장 보고 나서</div>
<div class="nextup-row">
<a href="/jangteo/" class="hot">🏮 오늘 서는 오일장 전국</a>
<a href="/jangteo/${({ 서울: 'seoul', 부산: 'busan', 대구: 'daegu', 인천: 'incheon', 광주: 'gwangju', 대전: 'daejeon', 울산: 'ulsan', 세종: 'sejong', 경기: 'gyeonggi', 강원: 'gangwon', 충북: 'chungbuk', 충남: 'chungnam', 전북: 'jeonbuk', 전남: 'jeonnam', 경북: 'gyeongbuk', 경남: 'gyeongnam', 제주: 'jeju' })[sido] || ''}/">${esc(sido)} 오일장 전체</a>
<a href="/holiday/">🌕 연휴에 여는 곳</a>
</div>
</div>

<h2 class="sec">${esc(city)}의 오일장</h2>
${withDay.map(card).join('')}
${noDay.length ? `<h2 class="sec">장날을 확인하지 못한 시장 ${noDay.length}곳</h2>
<p class="jsg-p">전통시장으로 등록돼 있지만 공공데이터에 장날이 적혀 있지 않습니다. <b>추측해서 날짜를 적지 않았습니다.</b></p>
${noDay.map(card).join('')}` : ''}

${festHtml}
${nearHtml}

<h2 class="sec">${esc(city)} 장에 가기 전에</h2>
<p class="jsg-p"><b>오전에 가세요.</b> 오일장은 대개 새벽에 시작해 점심 무렵 가장 붐비고, 이른 오후부터 하나둘 정리에 들어갑니다. 오후 늦게 도착하면 좌판이 절반쯤 걷힌 뒤일 수 있습니다.</p>
<p class="jsg-p"><b>현금을 조금 챙기세요.</b> 규모가 있는 점포는 카드와 간편결제가 되지만, 노점과 좌판은 현금만 받는 곳이 아직 많습니다. 잔돈이 있으면 흥정도 수월합니다.</p>
<p class="jsg-p"><b>차로 간다면 주차부터 확인하세요.</b> ${withDay.filter(m => m.park).length
      ? `${esc(city)}에서는 ${withDay.filter(m => m.park).map(m => esc(m.name)).slice(0, 3).join(' · ')}에 주차 정보가 공공데이터에 등록돼 있습니다.`
      : '이 지역 시장은 공공데이터에 주차 정보가 등록돼 있지 않습니다. 장날에는 시장 주변 도로가 붐비니 여유를 두고 출발하세요.'} 장날 당일은 평소보다 주변 도로가 많이 막힙니다.</p>
<p class="jsg-p"><b>날씨를 보고 가세요.</b> 장은 대부분 한데서 섭니다. 비가 오면 좌판 수가 눈에 띄게 줄어드는 곳이 많아, 비 예보가 있는 날은 다음 장날로 미루는 편이 낫습니다.</p>

<h2 class="sec">오일장이 무엇인가요</h2>
<p class="jsg-p">오일장(5일장)은 <b>5일마다 한 번씩 열리는 장</b>입니다. 날짜의 끝자리로 정해져서, 예를 들어 3·8일장이면 3일·8일·13일·18일·23일·28일에 섭니다. 한 달에 여섯 번, 많으면 일곱 번 서는 셈입니다. 파는 사람은 대부분 그 지역 농민과 어민이라 값이 산지 가격이고, 물건은 계절을 그대로 탑니다. 봄에는 나물과 모종, 여름에는 과일, 가을에는 곡식과 말린 것, 겨울에는 젓갈과 김장거리가 주로 나옵니다.</p>
<p class="jsg-p">상설시장과 다른 점은 하나입니다 — <b>그날이 아니면 문을 열지 않습니다.</b> 그래서 오일장은 «어디»보다 «언제»가 먼저입니다. 인근 시·군끼리는 끝자리를 서로 다르게 정해 두는 경우가 많아, 한 지역에 장이 서지 않는 날이면 옆 시·군에는 서 있곤 합니다. 이 페이지 아래쪽의 근처 시·군 목록이 그래서 있습니다.</p>

<h2 class="sec">자주 묻는 것</h2>
${faq.map(([q, a]) => `<p class="jsg-faq"><b>${esc(q)}</b><br>${esc(a)}</p>`).join('')}

<p class="note">데이터 출처: 행정안전부 「전국전통시장표준데이터」와 한국관광공사 TourAPI 전통시장 정보(판매 품목·장날·영업시간·주차·문의처). 장날은 <b>끝자리 간격이 5일 때만</b> 오일장으로 인정했습니다. 명절·기상에 따라 쉬는 날이 있으니 방문 전 확인하세요.</p>
</div></main>`;

    const bodyLen = content.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ').trim().length;
    const ld = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
    })}</script>`;
    return {
      bodyLen,
      write: () => writePage('jangteo/' + slug, layout(
        // ⭐ 「○○장날」이 「○○오일장」보다 2~4배 크다 — 제목 맨 앞에 그 말을 둔다.
        `${city} 장날 — 오일장 ${withDay.length}곳 날짜·파는 것·영업시간 | ${SITE_NAME}`,
        `${city} 장날은 끝자리 ${dnAll.join(', ')}일입니다. 오일장 ${withDay.length}곳의 다음 장날과 ${M}·${nextM}월 날짜, 파는 것과 영업시간·주차·문의처를 정리했습니다.`,
        `/jangteo/${slug}/`,
        CSS + content + buyBox('jangteo') + jangteoModalBB + JT_LINK_JS, { jsonld: ld }))
    };
  };

  // ── 1패스: 근처 링크 «없이» 재서 만들 목록을 정한다
  const pass = [];
  made.forEach(o => {
    const r = render(o, '');
    if (r.bodyLen < MIN_BODY) { skipped.push(`${o.city}(본문 ${r.bodyLen}자)`); return; }
    pass.push(o);
  });
  const cityToSlug = new Map(pass.map(o => [o.city, o.slug]));

  // ── 2패스: 확정된 목록으로만 근처 시·군 링크를 걸어 렌더
  let minLen = 1e9, maxLen = 0;
  pass.forEach(o => {
    const near = o.nearCities.filter(n => cityToSlug.has(n.city));
    const nearHtml = near.length ? `<h2 class="sec">${esc(o.city)} 근처 시·군의 장날</h2>
<p class="jsg-p">${esc(o.city)}에 장이 서지 않는 날이라면 가까운 이 시·군을 보세요. 오일장은 시·군마다 끝자리가 달라서 <b>거의 매일 어딘가는 장이 섭니다.</b></p>
<div class="jsg-near">${near.map(n => {
      const nm = byCity.get(n.city) || [];
      const dn = [...new Set(nm.filter(m => (m.daysNum || []).length).map(m => m.daysNum.join('·')))].slice(0, 3);
      return `<a href="/jangteo/${cityToSlug.get(n.city)}/"><b>${esc(n.city)} 장날</b><span>약 ${Math.round(n.km)}km${dn.length ? ' · ' + dn.join(', ') + '일장' : ''}</span></a>`;
    }).join('')}</div>` : '';
    const r = render(o, nearHtml);
    r.write();
    minLen = Math.min(minLen, r.bodyLen); maxLen = Math.max(maxLen, r.bodyLen);
    URLS.push(`/jangteo/${o.slug}/`);
    // 시·도 페이지가 «이 시·도의 시·군 장날»을 링크할 수 있게 메타를 얹어 준다.
    // (배열에 얹으므로 사이트맵의 ...spread 는 그대로 동작한다)
    URLS.meta.push({ city: o.city, sido: o.sido, slug: o.slug, vol: (o.g && o.g.vol) || 0,
      markets: o.withDay.length });
  });
  if (URLS.length) console.log(`  본문 ${minLen}~${maxLen}자`);

  console.log(`✓ /jangteo/{시군}/ — ${URLS.length}페이지 (SERP 게이트 통과 ${okCity.size}곳 중)`
    + (skipped.length ? ` · 제외 ${skipped.length}곳: ${skipped.slice(0, 6).join(', ')}${skipped.length > 6 ? '…' : ''}` : ''));
  return URLS;
}

const CSS = `<style>
.jsg-h1{font-size:1.5rem;font-weight:900;margin:8px 0 6px;letter-spacing:-.02em}
.jsg-lead{color:#374151;font-size:1rem;line-height:1.85;margin:0 0 14px}
.jsg-p{color:#6b7280;font-size:.95rem;line-height:1.8;margin:0 0 10px}
.jsg-next{background:linear-gradient(135deg,#0f9d8f,#2dd4bf);color:#fff;border-radius:16px;padding:16px 20px;margin:16px 0}
.jsg-next-l{font-size:.78rem;font-weight:800;opacity:.9;letter-spacing:.04em}
.jsg-next-d{font-size:1.32rem;font-weight:900;margin:3px 0 2px;letter-spacing:-.02em}
.jsg-next-m{font-size:.95rem;font-weight:700;opacity:.95}
.jsg-list{list-style:none;padding:0;margin:0 0 16px;display:grid;gap:9px}
.jsg-list li{background:#fff;border:1.5px solid #eef2f1;border-radius:12px;padding:11px 14px;line-height:1.7}
.jsg-tag{display:inline-block;background:#e2f5f2;color:#0a6c63;font-weight:800;font-size:.78rem;padding:2px 9px;border-radius:999px}
.jsg-cal{color:#6b7280;font-size:.9rem}
.jsg-km{color:#9ca3af;font-size:.85rem}
.jsg-card{background:#fff;border-radius:14px;padding:16px 18px;box-shadow:0 2px 10px rgba(31,41,55,.06);margin:0 0 14px}
.jsg-card img{width:100%;height:160px;object-fit:cover;border-radius:10px;margin-bottom:10px}
.jsg-card h3{font-size:1.06rem;font-weight:800;margin:0 0 4px}
.jsg-sub{color:#6b7280;font-size:.9rem;margin-bottom:8px}
.jsg-card p{margin:0 0 6px;font-size:.96rem;line-height:1.7}
.jsg-desc{color:#374151}
.jsg-meta{color:#6b7280;font-size:.9rem;line-height:1.8}
.jsg-links{margin-top:10px}
.jsg-links a{color:#0c7d72;font-weight:700;font-size:.88rem;margin-right:12px}
.jsg-near{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:9px;margin:10px 0 16px}
.jsg-near a{display:block;background:#f6fbfa;border:1.5px solid #dcefeb;border-radius:12px;padding:11px 13px;text-decoration:none;color:#0a6c63}
.jsg-near a b{display:block;font-size:.98rem;font-weight:800;color:#111827}
.jsg-near a span{display:block;color:#6b7280;font-size:.84rem;font-weight:600;margin-top:2px}
.jsg-faq{line-height:1.85;margin:0 0 12px}
</style>`;

module.exports = { build };
