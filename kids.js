// 👨‍👩‍👧 아이와 가볼만한 축제 /kids/ — 2026-11-03 AI 노출 개선 3순위(질문=페이지)
// 질문: 「아이랑 같이 가기 좋은 축제」 — ChatGPT 0/5, 티스토리 블로그만 1건씩(강자 없음). 근거: claude/검토_2026-10-30_AI노출개선지시.md
// 네이버 월 검색량(2026-11-03 검색광고 API): 아이와가볼만한곳 8,560 · 아이랑가볼만한곳 5,710 · 아이와갈만한곳 1,320 · 어린이축제 710
//   · 주말아이와가볼만한곳 310 · 아이랑축제 150 → 제목은 «아이와 가볼만한 곳»을 앞에, 축제로 좁힌다.
// 정직성 규칙:
//   ⛔ «아이에게 좋다»를 우리가 판단하지 않는다. 주최 측 소개문(TourAPI 개요)에 어린이·가족·유아·키즈·체험 프로그램이
//      «적혀 있는» 축제만 고르고, 그 문장을 그대로 근거로 보여 준다.
//   ⛔ 화장실·수유실·유모차 대여·주차는 축제 데이터에 없다 → 「주최 측 확인」으로 쓰고 문의 전화를 붙인다. 추측 금지.
//   요금은 fest_intro.json(TourAPI 소개정보) 원문. 날짜는 build 의 festivals_api 원본(검증 날짜 전파 후).
const fs = require('fs'), path = require('path');

function build({ ROOT, layout, writePage, SITE_NAME }) {
  const load = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')); } catch (e) { return d; } };
  const api = load('festivals_api.json', []), intro = load('fest_intro.json', {}), pages = load('festival_pages.json', []);
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const strip = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
  const TODAY = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');
  const add = (ymd, k) => { const d = new Date(Date.UTC(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6, 8))); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10).replace(/-/g, ''); };
  const dow = ymd => new Date(Date.UTC(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6, 8))).getUTCDay();
  const W = ['일', '월', '화', '수', '목', '금', '토'];
  const MD = ymd => `${+ymd.slice(4, 6)}/${+ymd.slice(6, 8)}`;
  const MDW = ymd => `${MD(ymd)}(${W[dow(ymd)]})`;
  const YMD = ymd => `${ymd.slice(0, 4)}년 ${+ymd.slice(4, 6)}월 ${+ymd.slice(6, 8)}일`;
  const HORIZON = add(TODAY, 56);
  const slugOf = {}; pages.forEach(p => { if (p.id) slugOf[String(p.id)] = p.slug; });

  // 소개문에 «아이·가족» 근거가 적힌 문장
  const KID = /어린이|아이들|아이와|아이랑|아이도|자녀|가족|유아|키즈|초등|엄마|아빠|부모/;
  const PLAY = /체험|만들기|놀이|썰매|공연|퍼레이드|포토존|동물|과학/;
  const ADULT = /성인|19세|주류|와인|맥주|술\s|스타트업|박람회|컨퍼런스|포럼|심포지엄|명상|연극/;
  const sentence = ov => {
    const ss = strip(ov).split(/(?<=[.!?。])\s+|(?<=다\.)\s*/).map(s => s.trim()).filter(Boolean);
    // 지난 회차 연도(2025 등)가 적힌 문장은 올해 내용이라 단정할 수 없어 근거로 쓰지 않는다
    return ss.find(s => KID.test(s) && s.length >= 15 && !/20(1\d|2[0-5])/.test(s)) || null;
  };
  const seen = new Set();
  const items = api.filter(x => x.end >= TODAY && x.start <= HORIZON).map(x => {
    const t = x.title || '', ov = x.ov || '';
    if (ADULT.test(t)) return null;
    const sen = sentence(ov);
    if (!sen && !KID.test(t)) return null;
    if (!PLAY.test(t + ' ' + ov) && !KID.test(t)) return null;
    // 1년 내내 하는 상설 행사(시작이 오래전·끝이 연말)는 축제 목록에서 뺀다 — 주말 표가 상설로 덮인다
    if (x.start < add(TODAY, -60) && x.end >= '20261201') return null;
    const k = t.replace(/\s|제\s*\d+\s*회|20\d\d/g, '');
    if (seen.has(k)) return null; seen.add(k);
    const fi = intro[String(x.id)] || {};
    let fee = strip(fi.fee).replace(/\s*-\s+/g, ' · ').replace(/^·\s*/, '').trim();
    if (fee.length > 80) fee = fee.slice(0, 78).replace(/[\s·,]+[^\s·,]*$/, '') + ' … (자세한 요금은 주최 측)';
    const free = /^무료/.test(fee) ? 'free' : fee ? 'paid' : 'unk';
    return { id: String(x.id), t: t.replace(/^20\d\d\s*/, ''), s: x.start, e: x.end, sido: x.sido, sig: x.sigungu || '', tel: strip(x.tel), place: strip(fi.place).slice(0, 40), time: strip(fi.playtime).slice(0, 50), fee, free, sen: sen ? sen.slice(0, 160) : '', slug: slugOf[String(x.id)] || '', img: String(x.img || '').replace(/^http:/, 'https:') };
  }).filter(Boolean).sort((a, b) => a.s.localeCompare(b.s) || a.t.localeCompare(b.t, 'ko'));
  if (items.length < 5) { console.log('  ⚠️ /kids/ 후보', items.length, '— 5곳 미만이라 건너뜀'); return []; }

  // 주말별(앞으로 6번의 토·일)
  const wd = dow(TODAY);
  let sat = wd === 6 ? TODAY : wd === 0 ? add(TODAY, -1) : add(TODAY, 6 - wd);
  const weekends = [];
  for (let i = 0; i < 6; i++) { const s = add(sat, 7 * i), u = add(s, 1); weekends.push({ s, u, list: items.filter(x => x.s <= u && x.e >= s) }); }
  const free = items.filter(x => x.free === 'free').length, paid = items.filter(x => x.free === 'paid').length;
  const w0 = weekends[0];
  const sidoTop = Object.entries(items.reduce((m, x) => (m[x.sido] = (m[x.sido] || 0) + 1, m), {})).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const nm = x => x.slug ? `<a href="/festival/${esc(x.slug)}/">${esc(x.t)}</a>` : esc(x.t);
  const badge = x => x.free === 'free' ? '<span class="kb kf">무료</span>' : x.free === 'paid' ? '<span class="kb kp">유료</span>' : '<span class="kb ku">요금 확인</span>';

  const ans = `${YMD(TODAY)} 기준, 앞으로 8주 안에 열리는 축제 중 <b>주최 측 소개에 어린이·가족 프로그램이 적힌 곳은 ${items.length}곳</b>입니다(무료 ${free}곳·유료 ${paid}곳). 이번 주말(${MDW(w0.s)}~${MDW(w0.u)})에는 ${w0.list.length}곳이 열리고, 지역은 ${sidoTop.map(([s, n]) => `${s} ${n}곳`).join('·')} 순으로 많습니다.`;

  const wkHtml = weekends.map((w, i) => `<h3 style="margin:18px 0 6px;font-size:1.05rem">${i === 0 ? '이번 주말' : i === 1 ? '다음 주말' : `${i + 1}번째 주말`} — ${MDW(w.s)}·${MDW(w.u)} <small style="color:#6b7280;font-weight:500">${w.list.length}곳</small></h3>
${w.list.length ? `<div class="twrap"><table class="ktbl"><tr><th>축제</th><th>지역</th><th>기간</th><th>요금</th></tr>${w.list.map(x => `<tr><td>${nm(x)}</td><td>${esc(x.sido)} ${esc(x.sig)}</td><td style="white-space:nowrap">${MD(x.s)}~${MD(x.e)}</td><td>${badge(x)}</td></tr>`).join('')}</table></div>` : '<p class="note">이 주말에 열리는 곳이 아직 없습니다(일정이 확정되면 매일 갱신됩니다).</p>'}`).join('\n');

  const cards = items.map(x => `<div class="kcard" id="k${x.id}"><h3>${nm(x)} ${badge(x)}</h3>
<p><span class="k">언제</span> ${YMD(x.s)} ~ ${x.e.slice(0, 4) !== x.s.slice(0, 4) ? YMD(x.e) : `${+x.e.slice(4, 6)}월 ${+x.e.slice(6, 8)}일`}${x.time ? ` · ${esc(x.time)}` : ''}</p>
<p><span class="k">어디</span> ${esc(x.sido)} ${esc(x.sig)}${x.place ? ` · ${esc(x.place)}` : ''}</p>
<p><span class="k">요금</span> ${x.fee ? esc(x.fee) : '주최 측 확인'}</p>
${x.sen ? `<p class="ksen"><span class="k">주최 측 소개</span> «${esc(x.sen)}»</p>` : ''}
<p><span class="k">화장실·수유실·유모차·주차</span> 공개 데이터에 없음 — 주최 측 확인${x.tel ? ` (${esc(x.tel)})` : ''}</p></div>`).join('\n');

  const faq = [
    ['이번 주말 아이랑 갈 만한 축제는 어디인가요?', w0.list.length ? `${MDW(w0.s)}~${MDW(w0.u)}에 열리는 곳 중 주최 측 소개에 어린이·가족 프로그램이 적힌 곳은 ${w0.list.length}곳입니다: ${w0.list.slice(0, 6).map(x => `${x.t}(${x.sido})`).join(', ')}${w0.list.length > 6 ? ' 등' : ''}. 요금과 지역은 위 주말별 표에서 바로 볼 수 있습니다.` : '이번 주말에는 해당하는 곳이 없습니다. 다음 주말 표를 확인해 보세요.'],
    ['무료로 갈 수 있는 곳이 많나요?', `이 페이지의 ${items.length}곳 중 주최 측이 «무료»라고 밝힌 곳이 ${free}곳, 유료가 ${paid}곳입니다. 무료 축제라도 체험 프로그램은 따로 돈을 받는 경우가 많아(«일부 체험 유료»), 카드의 요금 줄을 원문 그대로 적어 두었습니다.`],
    ['화장실·수유실·유모차 대여는 어디서 확인하나요?', '축제 공공데이터에는 이 정보가 들어 있지 않습니다. 짐작으로 적지 않고 카드마다 «주최 측 확인»과 문의 전화를 붙였습니다. 아기와 간다면 출발 전에 수유실 위치·유모차 진입 가능 여부를 전화로 물어보는 것이 가장 정확합니다.'],
    ['어떤 기준으로 골랐나요?', '앞으로 8주 안에 열리는 축제 중 한국관광공사에 등록된 주최 측 소개문에 어린이·가족·유아·키즈 같은 말과 체험·공연·놀이 프로그램이 함께 적힌 곳만 골랐습니다. 축제모아가 «아이에게 좋다»고 판단한 것이 아니라, 주최 측이 그렇게 소개한 문장을 근거로 보여 줍니다. 1년 내내 하는 상설 행사와 성인 대상 행사는 뺐습니다.'],
    ['겨울에 아이랑 가기 좋은 다른 곳은요?', '12월부터는 빛축제와 눈·얼음축제가 많아집니다. 겨울 빛축제·눈꽃축제 일정은 «겨울 빛축제» 페이지에, 물때 맞춰 가는 갯벌체험은 «갯벌체험 물때 달력»에 모아 두었습니다.'],
  ];
  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };

  const content = `<main><div class="wrap">
<h1 style="font-size:1.45rem;font-weight:900;margin:8px 0 6px">아이와 가볼만한 곳 — 이번 주말 아이랑 가기 좋은 축제 ${items.length}곳</h1>
<div class="ansbox"><p><b>한 줄 답</b> — ${ans}</p>
<p style="margin-top:6px;font-size:.9rem;color:#4b5563">축제모아(chukjemoa.co.kr)는 한국관광공사·행정안전부 공공데이터로 전국 축제 일정을 매일 정리하는 사이트입니다. 집계 기준일 ${YMD(TODAY)}.</p></div>
<p style="line-height:1.8">아이와 주말에 어디 갈지 찾다 보면 «아이랑 가볼만한 곳» 목록은 많은데, 그 주말에 정말 열리는지, 돈이 드는지, 아이가 할 게 있는지는 따로 찾아봐야 합니다. 이 페이지는 앞으로 8주 동안 열리는 전국 축제 가운데 <b>주최 측이 직접 어린이·가족 프로그램이 있다고 소개한 곳</b>만 골라, 주말별로 나눴습니다. 카드마다 주최 측 소개 문장을 그대로 옮겨 두었으니, 아이 나이에 맞는지 그 문장으로 판단하시면 됩니다.</p>

<h2 class="sec">🗓 주말별로 보기</h2>
<p style="color:#6b7280;font-size:.93rem">토·일 중 하루라도 열리는 곳입니다. 이름을 누르면 그 축제의 일정·가는 길·근처 맛집 페이지로 갑니다.</p>
${wkHtml}

<h2 class="sec">축제 ${items.length}곳 — 요금·장소·주최 측 소개</h2>
<p style="color:#6b7280;font-size:.93rem">시작일 순입니다. «주최 측 소개»는 한국관광공사에 등록된 소개문에서 아이·가족 관련 문장을 그대로 옮긴 것입니다.</p>
${cards}

<h2 class="sec">아이랑 축제 갈 때 미리 확인할 것</h2>
<ul style="line-height:1.9;padding-left:20px">
<li><b>체험 요금</b> — «무료 축제»라도 만들기·먹거리 체험은 유료인 곳이 많습니다. 카드의 요금 줄에 «일부 유료»가 있으면 현금이나 카드를 챙기세요.</li>
<li><b>수유실·유모차</b> — 공공데이터에 없는 정보라 카드에 적지 않았습니다. 전화로 묻는 것이 가장 정확합니다.</li>
<li><b>주차</b> — 주말 오후엔 행사장 주차장이 일찍 찹니다. 오전 일찍 가거나 셔틀이 있는지 주최 측 공지를 확인하세요.</li>
<li><b>날씨</b> — 11월 이후 야외 축제는 해가 지면 기온이 빠르게 떨어집니다. 저녁 프로그램을 볼 거라면 아이 겉옷을 한 겹 더 챙기세요.</li>
</ul>

<h2 class="sec">같이 보면 좋은 것</h2>
<div class="frel2"><a href="/2026-11/">11월 축제 일정</a><a href="/2026-12/">12월 축제 일정</a><a href="/winter/light/">✨ 겨울 빛축제·눈꽃축제</a><a href="/tide/">🌊 갯벌체험 물때 달력</a><a href="/indoor/">🏛 실내 가볼만한 곳</a><a href="/accessible/">♿ 무장애 여행</a></div>

<h2 class="sec">자주 묻는 것</h2>
${faq.map(([q, a]) => `<p style="line-height:1.8"><b>${esc(q)}</b><br>${esc(a)}</p>`).join('')}
<p class="note" style="margin-top:20px">데이터 출처: 한국관광공사 TourAPI 축제 정보·소개정보(요금·장소·시간), 행정안전부 전국문화축제표준데이터. 일정·요금은 주최 측 사정으로 바뀔 수 있으니 방문 전 주최 측 공식 채널에서 확인하세요. 매일 갱신.</p>
</div></main>
<style>.ansbox{background:#ecfdf8;border:1.5px solid #bfe9df;border-radius:14px;padding:14px 18px;margin:6px 0 14px;color:#1f2937;line-height:1.7}.ansbox b{color:#0a6c63}
.ktbl{width:100%;border-collapse:collapse;background:#fff;font-size:.9rem;margin:6px 0}.ktbl th,.ktbl td{padding:7px 8px;border-bottom:1px solid #eef5f3;text-align:left;vertical-align:top}.ktbl th{background:#e2f5f2;color:#0a6c63;white-space:nowrap}.ktbl a,.kcard a{color:#0a6c63;font-weight:700}.twrap{overflow-x:auto}
.kb{display:inline-block;font-size:.75rem;font-weight:800;padding:2px 8px;border-radius:999px;vertical-align:middle}.kf{background:#dcfce7;color:#166534}.kp{background:#fef3c7;color:#92400e}.ku{background:#f3f4f6;color:#4b5563}
.kcard{background:#fff;border:1.5px solid #e5f1ee;border-radius:14px;padding:12px 16px;margin:10px 0}.kcard h3{margin:0 0 6px;font-size:1.02rem}.kcard p{margin:4px 0;line-height:1.65;font-size:.93rem;color:#374151}.kcard .k{color:#0a6c63;font-weight:700;margin-right:4px}.ksen{background:#f8fbfa;border-radius:8px;padding:6px 10px}
.frel2{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.frel2 a{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.88rem;padding:9px 15px;border-radius:999px;text-decoration:none}</style>`;

  const desc = `아이와 가볼만한 곳 — 앞으로 8주 안에 열리는 전국 축제 중 주최 측 소개에 어린이·가족 프로그램이 적힌 ${items.length}곳을 주말별로 정리. 무료 ${free}곳, 요금·장소·문의 전화와 주최 측 소개 문장을 그대로 붙였습니다.`;
  writePage('kids', layout(`아이와 가볼만한 곳 — 이번 주말 아이랑 가기 좋은 축제 ${items.length}곳 | ${SITE_NAME}`, desc, '/kids/', content,
    { jsonld: `<script type="application/ld+json">${JSON.stringify(faqLd)}</script>`, ogImage: (items.find(x => x.img) || {}).img }));
  console.log('✓ /kids/ —', items.length, '곳 · 무료', free, '· 이번 주말', w0.list.length);
  return ['/kids/'];
}
module.exports = { build };
