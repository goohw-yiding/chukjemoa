// ❄️ 겨울 축제 랜딩 /winter/
// 만든 이유(2026-08-18 전체 점검): 서치콘솔에서 「겨울 축제 2026」이 이미 2.9위에 노출되는데
// 클릭이 0이었다. 순위 문제가 아니라 «도착할 페이지가 없어» 엉뚱한 페이지가 잡히고 있었다.
// 그리고 TourAPI 915건 중 709건(77%)이 이미 끝났고 앞으로 180일 안에 열리는 건 206건뿐이다 —
// 90일 뒤부터는 3건밖에 안 늘어난다. 즉 11월 중순 이후 축제 재고가 사실상 0이다.
// ⚠️ 그래서 이 페이지는 «올겨울 확정 일정»인 척하지 않는다. 공공데이터에 아직 안 올라왔다는 사실을
//    먼저 밝히고, 예년 겨울에 실제로 열린 축제를 시기별로 정리해 «언제쯤 어디서»를 답한다.
const fs = require('fs'), path = require('path');

function build({ ROOT, layout, writePage, SITE_NAME, buyBox }) {
  const load = f => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')); } catch (e) { return []; } };
  const api = load('festivals_api.json');
  const cur = load('festivals.json');
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const n = s => String(s || '').replace(/-/g, '');
  const MD = s => (+n(s).slice(4, 6)) + '월 ' + (+n(s).slice(6, 8)) + '일';

  // ── 예년 겨울(12·1·2월 시작)에 실제로 열린 축제
  const winter = api.filter(f => ['12', '01', '02'].includes(n(f.start).slice(4, 6)) && f.x && f.y);
  const good = winter.filter(f => (f.ov || '').length >= 150);
  const byMonth = { 12: [], 1: [], 2: [] };
  good.forEach(f => byMonth[+n(f.start).slice(4, 6)].push(f));
  Object.values(byMonth).forEach(a => a.sort((x, y) => n(x.start).slice(6) - n(y.start).slice(6)));

  // ── 성격별 (제목으로 분류 — 억지로 나누지 않고 실제로 걸리는 것만)
  const KIND = [
    ['🎄 빛·등불·크리스마스', /빛|등불|불빛|일루미|크리스마스|루미나|산타/, '해가 일찍 지는 계절이라 «밤에 보는 축제»가 겨울에 가장 많습니다.'],
    ['🧊 얼음·눈', /얼음|빙어|송어|산천어|눈꽃|썰매|스키|빙/, '강이 얼어야 열리는 축제라 그해 날씨에 따라 개막이 밀리거나 앞당겨집니다.'],
    ['♨️ 온천', /온천|스파|족욕/, '축제가 없는 날에도 갈 수 있는 곳이라 겨울 일정의 기둥으로 쓰기 좋습니다.'],
    ['🌅 해돋이', /해돋이|일출|해맞이/, '1월 1일 하루에 몰려 있어 숙소·교통을 미리 잡아야 합니다.']
  ];

  const card = f => `<li style="margin:0 0 14px;padding:0 0 14px;border-bottom:1px solid #eef2f1">
<b style="font-size:1rem">${esc(f.title)}</b>
<div style="color:#6b7280;font-size:.9rem;margin:3px 0">${esc(f.sido || '')}${f.sigungu ? ' ' + esc(f.sigungu) : ''} · 예년 ${MD(f.start)}~${MD(f.end)}</div>
<div style="color:#374151;font-size:.94rem;line-height:1.75">${esc((f.ov || '').replace(/\s+/g, ' ').slice(0, 170))}…</div></li>`;

  const monthBlock = (m, title, note) => byMonth[m].length ? `
<h2 class="sec">${title} <span style="color:#9ca3af;font-weight:600;font-size:.9rem">— 예년 ${byMonth[m].length}곳</span></h2>
<p style="color:#6b7280;font-size:.94rem">${note}</p>
<ul style="list-style:none;padding:0;margin:12px 0 0">${byMonth[m].slice(0, 14).map(card).join('')}</ul>` : '';

  const kindBlock = KIND.map(([label, re, why]) => {
    const list = good.filter(f => re.test(f.title));
    if (list.length < 2) return '';
    return `<h3 style="margin:18px 0 6px;font-size:1.02rem;font-weight:800">${label} <span style="color:#9ca3af;font-weight:600">${list.length}곳</span></h3>
<p style="color:#6b7280;font-size:.93rem;margin-bottom:6px">${why}</p>
<p style="color:#374151;font-size:.95rem;line-height:1.9">${list.slice(0, 10).map(f => `<b>${esc(f.title)}</b>(${esc(f.sido || '')})`).join(' · ')}</p>`;
  }).filter(Boolean).join('');

  // ── 큐레이션 데이터의 겨울 항목 (예년 기준·변동 가능)
  const curW = cur.filter(f => [].concat(f.month || []).some(m => m === 12 || m === 1 || m === 2));
  const curBlock = curW.length ? `
<h2 class="sec">해마다 열리는 겨울 축제 ${curW.length}곳</h2>
<p style="color:#6b7280;font-size:.94rem">아래는 매년 비슷한 시기에 열려 온 축제입니다. <b>날짜는 예년 기준이라 해마다 며칠씩 달라집니다.</b></p>
<ul style="line-height:1.95;font-size:.96rem;padding-left:20px;margin-top:10px">
${curW.slice(0, 30).map(f => `<li><b>${esc(f.name)}</b> <span style="color:#9ca3af">${esc(f.region || '')}${f.city ? ' ' + esc(f.city) : ''}</span>${f.desc ? ' — ' + esc(f.desc) : ''}</li>`).join('')}
</ul>` : '';

  const faq = [
    ['2026-2027 겨울 축제 일정은 언제 확정되나요?',
      `대부분 개막 1~2개월 전에 확정됩니다. 한국관광공사 TourAPI 기준으로 지금 등록된 축제 ${api.length}건 중 12월 이후 시작하는 것은 아직 손에 꼽습니다. 그래서 이 페이지는 예년에 실제로 열린 ${winter.length}곳을 시기별로 정리해 «언제쯤 어디서»를 먼저 알려 드립니다. 확정되는 대로 월별 페이지에 반영됩니다.`],
    ['겨울에는 축제가 적은데 어디를 가면 좋을까요?',
      '겨울은 야외 축제가 줄어드는 대신 온천·오일장·실내 전시가 강해집니다. 이 사이트에서는 온천, 전국 오일장 장날, 걷기길, 전국 명산, 요즘 가는 카페를 계절과 상관없이 볼 수 있습니다.'],
    ['눈꽃축제나 얼음낚시는 날짜가 왜 자주 바뀌나요?',
      '강이 얼어야 열리기 때문입니다. 결빙이 늦으면 개막이 밀리고, 포근하면 조기 종료되기도 합니다. 출발 전 주최 측 공식 채널에서 반드시 확인하세요.'],
    ['1월 축제는 어디서 보나요?',
      '「2026년 12월~2027년 1월 겨울」 월별 페이지에서 12월과 1월을 함께 보실 수 있습니다.']
  ];

  const content = `<main><div class="wrap">
<h1 style="font-size:1.5rem;font-weight:900;margin:8px 0 6px">겨울 축제 2026-2027 — 12월·1월·2월 어디서 뭐가 열리나</h1>
<p style="color:#374151;font-size:1rem;line-height:1.8">겨울 축제를 찾는 사람은 보통 <b>가을에</b> 검색합니다. 그런데 그 시점에는 주최 측이 일정을 확정하기 전이라, 공공데이터에도 올겨울 축제가 거의 등록돼 있지 않습니다.</p>
<p style="color:#374151;font-size:1rem;line-height:1.8">그래서 이 페이지는 <b>확정 일정인 척하지 않습니다.</b> 대신 예년 겨울에 실제로 열린 축제 <b>${winter.length}곳</b>을 12월·1월·2월로 나눠 정리했습니다. 「그 축제가 대개 몇 월 며칠쯤, 어느 지역에서 열리는가」를 알면 숙소와 휴가를 미리 잡을 수 있습니다. 확정 일정은 등록되는 대로 월별 축제 페이지에 반영됩니다.</p>
<div style="background:#f4faf8;border:1.5px solid #dcefeb;border-radius:14px;padding:14px 18px;margin:16px 0;color:#0a6c63;font-size:.95rem;line-height:1.8">
<b>이 페이지의 날짜는 전부 «예년 기준»입니다.</b> 해마다 요일과 날씨에 따라 며칠씩 달라지고, 얼음 축제는 결빙이 늦으면 개막 자체가 밀립니다. 출발 전 주최 측 공식 채널 확인이 필요합니다.
</div>

${monthBlock(12, '❄️ 12월', '연말 분위기와 겹쳐 «빛·등불» 계열이 가장 많은 달입니다. 도심에서 열리는 것이 많아 이동 부담이 작습니다.')}
${monthBlock(1, '⛄ 1월', '해맞이와 얼음 축제가 몰리는 달입니다. 1월 1일 해돋이는 숙소·교통이 가장 먼저 동나는 날이기도 합니다.')}
${monthBlock(2, '🌨️ 2월', '겨울 축제가 마무리되고 봄꽃 축제가 시작되기 직전입니다. 이 시기에는 온천·오일장 쪽이 오히려 안정적입니다.')}

<h2 class="sec">성격별로 보면</h2>
${kindBlock || '<p style="color:#6b7280">분류할 만큼 데이터가 모이지 않았습니다.</p>'}

${curBlock}

<h2 class="sec">겨울에는 축제 말고 이런 것도 있습니다</h2>
<p style="color:#374151;font-size:.97rem;line-height:1.8">겨울은 야외 축제가 눈에 띄게 줄어드는 계절입니다. 대신 <b>계절을 타지 않는 것</b>들이 이 시기에 진가를 발휘합니다.</p>
<ul style="line-height:2;font-size:.97rem;padding-left:20px">
<li><a href="/onsen/" style="color:#0a6c63;font-weight:700">♨️ 전국 온천</a> — 추울수록 목적지가 되는 곳입니다.</li>
<li><a href="/jangteo/" style="color:#0a6c63;font-weight:700">🏮 전국 오일장</a> — 장날은 날씨와 무관하게 정해진 날에 섭니다. 겨울 장터 먹거리가 따로 있습니다.</li>
<li><a href="/trails/" style="color:#0a6c63;font-weight:700">🥾 걷기 여행</a> — 해안 걷기길은 사람이 적은 겨울이 오히려 걷기 좋습니다.</li>
<li><a href="/mountains/" style="color:#0a6c63;font-weight:700">⛰️ 전국 명산</a> — 상고대와 설경은 겨울에만 볼 수 있습니다.</li>
<li><a href="/cafe/" style="color:#0a6c63;font-weight:700">☕ 요즘 가는 카페</a> — 추운 날 일정의 중간 기지로 씁니다.</li>
<li><a href="/course/" style="color:#0a6c63;font-weight:700">🧭 코스 짜기</a> — 날짜와 조건을 넣으면 그 날 열리는 축제와 오일장까지 넣어 동선을 만들어 드립니다.</li>
</ul>

${buyBox ? `<div style="margin-top:18px">${buyBox('hotpack')}</div>` : ''}

<h2 class="sec">자주 묻는 것</h2>
${faq.map(([q, a]) => `<p style="line-height:1.8"><b>${esc(q)}</b><br>${esc(a)}</p>`).join('')}

<p class="note" style="margin-top:20px">데이터 출처: 한국관광공사 TourAPI 축제 정보. 예년 개최 이력을 기준으로 정리했으며 <b>올겨울 확정 일정이 아닙니다.</b> 일정·요금은 주최 측 사정으로 변경될 수 있으니 방문 전 공식 채널에서 확인하세요.</p>
</div></main>`;

  const faqLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
  };

  writePage('winter', layout(
    '겨울 축제 2026-2027 — 12월·1월·2월 일정과 지역 총정리 | ' + SITE_NAME,
    `2026-2027 겨울 축제를 12월·1월·2월로 나눠 정리했습니다. 예년 겨울에 실제로 열린 ${winter.length}곳의 시기와 지역, 빛·얼음·온천·해돋이 성격별 분류, 그리고 축제가 적은 겨울에 갈 만한 온천·오일장·걷기길까지.`,
    '/winter/', content, { jsonld: `<script type="application/ld+json">${JSON.stringify(faqLd)}</script>`, ogImage: '/img/hero.webp' }));

  console.log('✓ /winter/ — 예년 겨울 축제', winter.length, '곳 · 개요 있는 것', good.length, '곳');
  return ['/winter/'];
}
module.exports = { build };
