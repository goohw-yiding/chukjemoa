// 🌊 갯벌체험·해루질 물때 달력 /tide/ + 지역 6페이지 — 2026-10-31 야외 취미 1차 시범(바다 체험·물때)
// 기획: 프로젝트 문서 claude/기획_2026-10-29_야외취미_바다체험물때_시범.md · 설계: claude/설계_2026-10-30_갯벌체험_물때달력.md
// 재료: data/sea_exp.json(관광공사 갯벌·어촌체험 85곳 + 가까운 조위관측소 매칭)
//       data/tide_fcst.json(국립해양조사원 조석예보 고·저조, _tide_collect.py 로 수집 — 빌드는 네트워크를 안 쓴다)
// 정직성 규칙:
//   ⛔ 물때만 보고 «체험 가능»이라 단정하지 않는다 — 운영·예약은 마을 전화 확인.
//   ⛔ «사리·조금»은 계산 근거가 없어 쓰지 않는다. 대신 그날 (물참−물빠짐) 물높이 차를 cm 로 그대로 쓴다.
//   ⛔ 안전·해루질 문장은 출처(해양수산부·해양경찰서·소방본부)가 있는 것만.
//   관측소는 마을에서 가장 가까운 곳(직선거리 km 표기). 실제 마을 앞바다와 수십 분 차이가 날 수 있다고 적는다.
const fs = require('fs'), path = require('path');

const REGIONS = [
  { slug: 'gyeonggi-incheon', name: '경기·인천', sido: ['경기', '인천'], lead: '서해 북부는 우리나라에서 물높이 차가 가장 큰 바다입니다. 인천·안산 관측소 예보로 11~12월 하루 물참과 물빠짐의 높이 차가 3m에서 많게는 9m까지 벌어져, 물이 빠지면 끝이 안 보이는 갯벌이 드러납니다. 수도권에서 차로 1~2시간이면 닿는 체험마을이 몰려 있어 «당일치기 갯벌체험»의 1순위 지역입니다.' },
  { slug: 'chungnam', name: '충남', sido: ['충남'], lead: '태안·보령·서천으로 이어지는 충남 해안은 리아스식(들쭉날쭉한) 해안이라 크고 작은 갯벌과 포구가 많습니다. 서해 안쪽 만마다 체험마을이 흩어져 있어 관측소도 대산·태안·안흥·보령·서천·장항으로 나뉩니다.' },
  { slug: 'jeonbuk', name: '전북', sido: ['전북'], lead: '고창·부안·군산의 전북 해안은 넓고 평평한 모래갯벌과 펄갯벌이 섞여 있습니다. 고창 갯벌은 세계자연유산 «한국의 갯벌»에 포함된 곳이기도 합니다. 물이 빠지는 폭이 커서 물때를 맞추면 넓은 갯벌을 걸을 수 있습니다.' },
  { slug: 'jeonnam', name: '전남', sido: ['전남'], lead: '전남은 섬과 만이 많아 같은 날이라도 관측소마다 물때가 1시간 이상 다릅니다. 완도·진도·여수·영광 관측소를 마을별로 따로 짝지어 두었으니, 꼭 내가 갈 마을 줄의 시간을 보세요.' },
  { slug: 'gyeongnam', name: '경남', sido: ['경남'], lead: '남해·사천·통영·거제의 경남 해안은 서해보다 물높이 차가 작아(관측소 예보로 하루 1~3.5m 안팎) 갯벌이 좁고 물이 빨리 들어옵니다. 그래서 물때보다 마을의 체험 운영 시간을 먼저 보는 편이 좋습니다.' },
  { slug: 'jeju-east', name: '제주·부산·동해안', sido: ['제주', '부산', '강원', '경북', '울산'], lead: '제주·부산과 동해안은 물높이 차가 작아 서해 같은 넓은 갯벌체험은 드뭅니다. 특히 동해(속초·동해·후포·울산 관측소)는 하루 물높이 차가 수십 cm에 그쳐 «물때 맞춰 갯벌에 들어가는» 체험과는 성격이 다릅니다. 이 페이지는 마을의 어촌체험 안내 중심으로 보세요.' },
];
const EAST = /속초|동해항|후포|울산|묵호|포항/;

function build({ ROOT, layout, writePage, SITE_NAME }) {
  const load = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')); } catch (e) { return d; } };
  const sea = load('sea_exp.json', []), F = load('tide_fcst.json', {}), ST = load('tide_stations.json', {});
  if (!sea.length || !Object.keys(F).length) { console.log('  ⚠️ /tide/ 재료 없음 — 건너뜀'); return []; }
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const strip = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
  const now = new Date(Date.now() + 9 * 3600e3);
  const TODAY = now.toISOString().slice(0, 10).replace(/-/g, '');
  const d2s = d => d.toISOString().slice(0, 10).replace(/-/g, '');
  const add = (ymd, k) => { const d = new Date(Date.UTC(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6, 8))); d.setUTCDate(d.getUTCDate() + k); return d2s(d); };
  const dow = ymd => new Date(Date.UTC(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6, 8))).getUTCDay();
  const W = ['일', '월', '화', '수', '목', '금', '토'];
  const MD = ymd => `${+ymd.slice(4, 6)}/${+ymd.slice(6, 8)}(${W[dow(ymd)]})`;
  const YMD = ymd => `${ymd.slice(0, 4)}년 ${+ymd.slice(4, 6)}월 ${+ymd.slice(6, 8)}일`;
  // 이번 주말: 오늘이 토·일이면 오늘부터, 아니면 다가오는 토·일
  const wd = dow(TODAY);
  const SAT = wd === 6 ? TODAY : wd === 0 ? add(TODAY, -1) : add(TODAY, 6 - wd);
  const WEEKEND = [SAT, add(SAT, 1)].filter(d => d >= TODAY);
  const LAST = Object.values(F).reduce((m, o) => { const k = Object.keys(o).sort().pop(); return k > m ? k : m; }, '');
  const DAYS = []; for (let d = TODAY; d <= LAST; d = add(d, 1)) DAYS.push(d);

  // 관측소·날짜별: 낮 물빠짐(09~16시) + 그날 물높이 차
  const dayInfo = (code, ymd) => {
    const r = (F[code] || {})[ymd]; if (!r || !r.length) return null;
    const L = r.filter(x => x[1] === 'L'), H = r.filter(x => x[1] === 'H');
    if (!L.length || !H.length) return { rows: r, lows: L, dayLow: null, range: null };
    const range = Math.max(...H.map(x => x[2])) - Math.min(...L.map(x => x[2]));
    const dayLow = L.filter(x => x[0] >= '09:00' && x[0] <= '16:00').sort((a, b) => a[2] - b[2])[0] || null;
    return { rows: r, lows: L, dayLow, range };
  };
  // «물이 많이 빠지는 날» = 같은 관측소 같은 달 물높이 차 상위 25%
  const bigCut = {};
  Object.keys(F).forEach(code => {
    const byM = {};
    Object.keys(F[code]).forEach(ymd => { const i = dayInfo(code, ymd); if (i && i.range != null) (byM[ymd.slice(0, 6)] = byM[ymd.slice(0, 6)] || []).push(i.range); });
    bigCut[code] = {};
    Object.entries(byM).forEach(([m, a]) => { a.sort((x, y) => y - x); bigCut[code][m] = a[Math.max(0, Math.floor(a.length * 0.25) - 1)]; });
  });
  const isBig = (code, ymd, i) => i && i.range != null && i.range >= (bigCut[code][ymd.slice(0, 6)] || 1e9);
  const stName = code => (ST[code] && ST[code].name) || code;
  const tag = r => `${r[0]} ${r[1] === 'L' ? '물빠짐' : '물참'} ${r[2]}cm`;

  const V = sea.map(s => {
    const it = s.intro || {};
    const ov = strip(s.overview);
    let short = ov.slice(0, 230); const cut = short.lastIndexOf('.'); if (ov.length > 230) short = cut > 80 ? short.slice(0, cut + 1) : short + '…';
    return { id: s.id, name: s.title, addr: s.addr || '', sido: s.sido, code: s.tide_obs, km: +s.tide_km || 0, img: String(s.firstimage || '').replace(/^http:/, 'https:'), home: s.homepage || '', tel: strip(it.infocenter), use: strip(it.usetime), rest: strip(it.restdate), park: strip(it.parking), exp: strip(it.expguide), short, ovAll: ov, east: EAST.test(stName(s.tide_obs)) };
  });
  const regionOf = v => REGIONS.find(r => r.sido.includes(v.sido)) || REGIONS[REGIONS.length - 1];
  const KW = ['갯벌', '바지락', '조개', '굴', '낚시', '망둥어', '맛조개', '후릿그물', '개매기', '독살', '갯바위', '카약', '스노클링', '해녀'];
  const kwLine = vs => { const c = KW.map(k => [k, vs.filter(v => (v.exp + ' ' + v.ovAll).includes(k)).length]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 6); return c.length ? `이 지역 마을 소개·체험 안내에 자주 나오는 말은 ${c.map(([k, n]) => `${k}(${n}곳)`).join(' · ')}입니다. 체험 종류는 계절·마을 사정에 따라 바뀌니 아래 카드의 안내와 전화로 확인하세요.` : ''; };
  const gulN = V.filter(v => (v.exp + ' ' + v.ovAll).includes('굴')).length;
  const winterRest = V.filter(v => /동절기|겨울|1[12]월|비수기/.test(v.rest + ' ' + v.use)).length;

  // 이번 주말 마을별 최적 시각
  const weekendBest = v => {
    let best = null;
    WEEKEND.forEach(d => { const i = dayInfo(v.code, d); if (i && i.dayLow && (!best || i.range > best.range)) best = { d, t: i.dayLow[0], cm: i.dayLow[2], range: i.range, big: isBig(v.code, d, i) }; });
    return best;
  };

  const CSS = `<style>.ansbox{background:#ecfdf8;border:1.5px solid #bfe9df;border-radius:14px;padding:14px 18px;margin:6px 0 14px;color:#1f2937;line-height:1.7}.ansbox b{color:#0a6c63}
.ttbl{width:100%;border-collapse:collapse;background:#fff;font-size:.9rem;margin:8px 0 4px}.ttbl th,.ttbl td{padding:7px 8px;border-bottom:1px solid #eef5f3;text-align:left;vertical-align:top}.ttbl th{background:#e2f5f2;color:#0a6c63;white-space:nowrap}.ttbl small{color:#6b7280}.ttbl .big{background:#fff7e6;font-weight:700}.twrap{overflow-x:auto}
.vcard{background:#fff;border:1.5px solid #e5f1ee;border-radius:14px;padding:14px;margin:12px 0;display:flex;gap:14px;flex-wrap:wrap}.vcard img{width:200px;max-width:100%;height:140px;object-fit:cover;border-radius:10px}.vcard .vb{flex:1;min-width:240px}.vcard h3{margin:0 0 6px;font-size:1.08rem}.vcard p{margin:4px 0;line-height:1.65;font-size:.93rem;color:#374151}.vcard .k{color:#0a6c63;font-weight:700}
.wkbox{background:#f0f9ff;border:1px solid #cfe8f7;border-radius:10px;padding:8px 12px;margin:8px 0;font-size:.92rem}
.rcard{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin:10px 0}.rcard a{display:block;background:#fff;border:1.5px solid #dcefeb;border-radius:12px;padding:12px 14px;text-decoration:none;color:#1f2937}.rcard a b{color:#0a6c63;font-size:1.05rem}.rcard small{color:#6b7280}
.frel2{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.frel2 a{background:#fff;border:1.5px solid #dcefeb;color:#374151;font-weight:700;font-size:.88rem;padding:9px 15px;border-radius:999px;text-decoration:none}
.safe{background:#fff5f5;border:1.5px solid #f6d0d0;border-radius:12px;padding:12px 16px;margin:10px 0;line-height:1.75;font-size:.94rem}</style>`;

  const SAFETY = `<div class="safe"><p><b>⚠️ 갯벌은 물이 «빠지는 것보다 빨리» 들어옵니다.</b> 물빠짐 시각은 «가장 많이 빠진 순간»이지 «그때까지 놀아도 된다»는 뜻이 아닙니다. 물빠짐 시각을 지나면 곧바로 물이 차오르기 시작하니, 물빠짐 시각 전후로 짧게 머물고 일찍 나오세요.</p>
<p>해양경찰은 연안에서 활동할 때 <b>«항상 물때를 확인하고, 휴대전화를 지참하라»</b>고 당부합니다(부안해양경찰서, 2026년 2월 보도). 갯벌에 빠지거나 고립되면 직접 빠져나오려다 상황이 더 나빠지는 경우가 많아, 소방당국은 <b>무리하게 빠져나오지 말고 119(해상은 122)에 신고</b>하라고 안내합니다(인천소방본부 보도자료).</p>
<p>마을 체험장은 대부분 안내자가 정한 구역·시간에만 들어갑니다. 마을 밖 갯벌에 혼자 들어가는 것은 피하세요. 해가 오후 5시 10~30분 사이에 지는 11~12월에는 «오후 물빠짐»이 금방 어두워집니다.</p></div>`;
  const HAERU = `<p style="line-height:1.8">해양수산부는 2023년 12월 21일부터 수산자원관리법 개정에 따라 어업인이 아닌 사람이 쓸 수 있는 도구를 정했습니다. 호미·삽·갈고리·집게·뜰채·반두·통발·외줄낚시 같은 도구와 맨손은 되지만, <b>같은 종류 도구는 한 번에 하나만</b> 쓸 수 있고, <b>전기·압축공기 같은 동력 장비와 집어등(불빛으로 고기를 모으는 등)</b>은 쓸 수 없습니다. 시·도는 조례로 지역 기준을 따로 정할 수 있어, 같은 해루질(밤바다에서 불을 비춰 해산물을 줍는 일)이라도 지역마다 허용 범위가 다릅니다. 어촌계가 관리하는 마을 어장(양식장·마을 갯벌)에서 함부로 캐면 안 되니, <b>체험장이 아닌 곳은 관할 시·군청이나 어촌계에 먼저 확인</b>하세요. (출처: 해양수산부 발표, 2023년 12월 보도)</p>`;

  const regionPages = [];
  REGIONS.forEach(R => {
    const vs = V.filter(v => regionOf(v) === R).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    if (!vs.length) return;
    const codes = [...new Set(vs.map(v => v.code))].sort((a, b) => vs.filter(v => v.code === b).length - vs.filter(v => v.code === a).length);
    const allEast = vs.every(v => v.east);
    // 이번 주말 표
    const wkRows = vs.map(v => {
      const cells = WEEKEND.map(d => { const i = dayInfo(v.code, d); if (!i) return '<td>—</td>'; const lows = i.lows.map(x => `${x[0]} <small>${x[2]}cm</small>`).join('<br>'); return `<td${isBig(v.code, d, i) ? ' class="big"' : ''}>${lows || '—'}</td>`; }).join('');
      return `<tr><td><a href="#v${v.id}">${esc(v.name)}</a><br><small>${esc(stName(v.code))} 관측소 ${v.km}km</small></td>${cells}</tr>`;
    }).join('');
    // 달력: 날짜 × 관측소, 낮 물빠짐만
    const calRows = DAYS.map(d => {
      const cells = codes.map(c => { const i = dayInfo(c, d); if (!i) return '<td>—</td>'; if (!i.dayLow) return '<td><small style="color:#c4cdd0">–</small></td>'; return `<td${isBig(c, d, i) ? ' class="big"' : ''}>${i.dayLow[0]}${isBig(c, d, i) ? ' ★' : ''}<br><small>차 ${i.range}cm</small></td>`; }).join('');
      return `<tr><td style="white-space:nowrap${[0, 6].includes(dow(d)) ? ';color:#c2410c;font-weight:700' : ''}">${MD(d)}</td>${cells}</tr>`;
    }).join('');
    const goodDays = codes.map(c => ({ c, n: DAYS.filter(d => { const i = dayInfo(c, d); return i && i.dayLow; }).length, w: DAYS.filter(d => [0, 6].includes(dow(d))).filter(d => { const i = dayInfo(c, d); return i && i.dayLow; }) }));
    const bestWk = vs.map(v => ({ v, b: weekendBest(v) })).filter(x => x.b).sort((a, b) => b.b.range - a.b.range);
    const ranges = codes.map(c => DAYS.map(d => (dayInfo(c, d) || {}).range).filter(x => x != null)).flat();
    const rMax = ranges.length ? Math.max(...ranges) : 0, rMin = ranges.length ? Math.min(...ranges) : 0;
    const ans = allEast
      ? `${YMD(TODAY)} 기준, ${R.name} 체험마을 ${vs.length}곳 중 동해안 마을은 물높이 차가 작아 물때보다 «마을 운영 시간»이 중요합니다. 남은 기간 하루 물높이 차는 ${rMin}~${rMax}cm입니다.`
      : `${YMD(TODAY)} 기준, ${R.name} 체험마을 ${vs.length}곳(관측소 ${codes.length}곳). ${bestWk.length ? `이번 주말 낮에 물이 가장 많이 빠지는 곳은 <b>${esc(bestWk[0].v.name)}</b>(${MD(bestWk[0].b.d)} ${bestWk[0].b.t} 전후, 물높이 차 ${bestWk[0].b.range}cm)입니다.` : '이번 주말에는 낮(09~16시) 물빠짐이 없는 관측소가 많습니다 — 아래 달력에서 다른 날을 고르세요.'} ${LAST.slice(0, 4)}년 ${+LAST.slice(4, 6)}월 ${+LAST.slice(6, 8)}일까지 남은 기간 중 낮 물빠짐이 있는 날은 관측소별로 ${Math.min(...goodDays.map(g => g.n))}~${Math.max(...goodDays.map(g => g.n))}일입니다.`;
    const cards = vs.map(v => {
      const b = weekendBest(v);
      return `<div class="vcard" id="v${v.id}">${v.img ? `<img src="${esc(v.img)}" alt="${esc(v.name)}" loading="lazy">` : ''}<div class="vb"><h3>${esc(v.name)}</h3>
<p><small>${esc(v.addr)}</small></p>
<p>${esc(v.short)}</p>
${v.exp ? `<p><span class="k">체험</span> ${esc(v.exp)}</p>` : ''}
${v.use ? `<p><span class="k">운영 시간</span> ${esc(v.use)}</p>` : ''}
${v.rest ? `<p><span class="k">쉬는 날</span> ${esc(v.rest)}</p>` : ''}
${v.park ? `<p><span class="k">주차</span> ${esc(v.park)}</p>` : ''}
${v.tel ? `<p><span class="k">문의</span> ${esc(v.tel)}</p>` : ''}
<div class="wkbox">🌊 <b>${esc(stName(v.code))} 관측소</b>(마을에서 직선 ${v.km}km) 기준 · ${b ? `이번 주말 낮 물빠짐 <b>${MD(b.d)} ${b.t}</b> (물높이 ${b.cm}cm, 그날 물높이 차 ${b.range}cm${b.big ? ' · 이달 물이 많이 빠지는 날' : ''})` : '이번 주말 낮(09~16시) 물빠짐 없음'}</div>
${v.home ? `<p><a href="${esc(v.home)}" rel="nofollow noopener" target="_blank">마을·지자체 안내 페이지 ↗</a></p>` : ''}</div></div>`;
    }).join('');
    const faq = [
      [`${R.name}에서 이번 주말 갯벌체험 언제 가면 좋나요?`, bestWk.length ? `${bestWk.slice(0, 3).map(x => `${x.v.name}은 ${MD(x.b.d)} ${x.b.t} 전후`).join(', ')}에 물이 가장 많이 빠집니다(국립해양조사원 조석예보, 가까운 관측소 기준). 체험장 운영 시간과 예약은 마을에 전화로 확인하세요.` : `이번 주말은 낮(09~16시)에 물빠짐이 드뭅니다. 페이지의 물때 달력에서 낮 물빠짐이 있는 날을 고르세요.`],
      [`${R.name}에 갯벌·어촌체험 마을은 몇 곳인가요?`, `한국관광공사에 등록된 갯벌·어촌체험 마을 기준 ${vs.length}곳입니다: ${vs.slice(0, 8).map(v => v.name).join(', ')}${vs.length > 8 ? ' 등' : ''}. 마을마다 가장 가까운 조위관측소(${codes.map(stName).join('·')})의 물때를 붙였습니다.`],
      [`물때표의 «물빠짐»과 «물참»은 뭔가요?`, `물빠짐(저조)은 바닷물이 가장 많이 빠진 순간, 물참(고조)은 가장 많이 찬 순간입니다. 보통 하루에 두 번씩 번갈아 오고 날마다 50분 안팎씩 늦어집니다. 갯벌체험은 물빠짐 시각 전후에 하고, 물빠짐이 지나면 물이 다시 들어오므로 일찍 나와야 합니다.`],
      [`겨울(11~12월)에도 체험이 되나요?`, `물때는 겨울에도 똑같이 옵니다. 다만 체험 프로그램은 «계절·마을 사정에 따라 변동»이라고 안내하는 마을이 많고, 해가 짧아 오후 물빠짐은 금방 어두워집니다. 출발 전 마을에 운영 여부를 꼭 확인하세요.`],
      [`마을 앞바다 물때가 표와 다를 수 있나요?`, `네. 이 페이지의 시각은 마을에서 가장 가까운 국립해양조사원 관측소의 예보입니다. 관측소와 마을 사이 거리(카드에 km로 표시)와 지형에 따라 수십 분 차이가 날 수 있으니 여유 있게 움직이세요.`],
    ];
    const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })) };
    const others = REGIONS.filter(x => x !== R).map(x => `<a href="/tide/${x.slug}/">${x.name}</a>`).join('');
    const content = `<main><div class="wrap">
<p style="font-size:.88rem;margin:6px 0"><a href="/tide/">🌊 갯벌체험 물때 달력</a> › ${R.name}</p>
<h1 style="font-size:1.45rem;font-weight:900;margin:8px 0 6px">${R.name} 갯벌체험 물때 — 체험마을 ${vs.length}곳 이번 주말 물빠짐 시간</h1>
<div class="ansbox"><p><b>한 줄 답</b> — ${ans}</p>
<p style="margin-top:6px;font-size:.9rem;color:#4b5563">물때: 국립해양조사원 조석예보(고·저조) · 마을 정보: 한국관광공사 · 집계 기준일 ${YMD(TODAY)}</p></div>
<p style="line-height:1.8">${R.lead} ${kwLine(vs)}</p>

<h2 class="sec">이번 주말 물빠짐 시각 (${WEEKEND.map(MD).join(' · ')})</h2>
<p style="color:#6b7280;font-size:.93rem">마을마다 가장 가까운 관측소의 물빠짐(저조) 시각과 그때 물높이입니다. 노란 칸은 «이달 중 물이 많이 빠지는 날»(그날 물높이 차가 그 관측소 이달 상위 25%)입니다.</p>
<div class="twrap"><table class="ttbl"><tr><th>마을 · 관측소</th>${WEEKEND.map(d => `<th>${MD(d)}</th>`).join('')}</tr>${wkRows}</table></div>

<h2 class="sec">🗓 ${+TODAY.slice(4, 6)}~${+LAST.slice(4, 6)}월 낮 물빠짐 달력</h2>
<p style="color:#6b7280;font-size:.93rem">오전 9시~오후 4시 사이에 오는 물빠짐만 적었습니다(체험장이 대부분 낮에만 운영). ★·노란 칸은 물이 많이 빠지는 날, «차»는 그날 물참과 물빠짐의 높이 차입니다. 빨간 날짜는 토·일요일, «–»는 그날 낮에 물빠짐이 없는 날입니다.</p>
<div class="twrap"><table class="ttbl"><tr><th>날짜</th>${codes.map(c => `<th>${esc(stName(c))}<br><small>${vs.filter(v => v.code === c).length}곳</small></th>`).join('')}</tr>${calRows}</table></div>

<h2 class="sec">체험마을 ${vs.length}곳</h2>
${cards}

<h2 class="sec">갯벌 안전 — 꼭 알고 가세요</h2>
${SAFETY}
<h2 class="sec">해루질은 어디까지 되나</h2>
${HAERU}

<h2 class="sec">다른 지역 물때</h2>
<div class="frel2">${others}</div>
<h2 class="sec">같이 보면 좋은 것</h2>
<div class="frel2"><a href="/2026-11/">11월 축제 일정</a><a href="/2026-12/">12월 축제 일정</a><a href="/jangteo/">🧺 오일장 장날</a><a href="/onsen/">♨️ 전국 온천</a><a href="/winter/">❄️ 겨울 축제</a></div>

<h2 class="sec">자주 묻는 것</h2>
${faq.map(([q, a]) => `<p style="line-height:1.8"><b>${esc(q)}</b><br>${a}</p>`).join('')}
<p class="note" style="margin-top:20px">데이터 출처: 국립해양조사원 조석예보(고·저조) — 관측소 예측값이며 기상(바람·기압)에 따라 실제 물높이는 달라질 수 있습니다. 체험마을 정보·사진: 한국관광공사 TourAPI. 체험 운영·요금·예약은 마을 사정에 따라 바뀌니 방문 전 마을에 확인하세요. 물때 갱신: 매주.</p>
</div></main>${CSS}`;
    const title = `${R.name} 갯벌체험 물때 — 체험마을 ${vs.length}곳 이번 주말 물빠짐 시간 | ${SITE_NAME}`;
    const desc = `${R.name} 갯벌·어촌체험 마을 ${vs.length}곳의 이번 주말 물빠짐(저조) 시각과 ${+TODAY.slice(4, 6)}~${+LAST.slice(4, 6)}월 낮 물빠짐 달력. 국립해양조사원 조석예보를 마을마다 가까운 관측소로 맞췄고 운영 시간·쉬는 날·주차·문의를 함께 정리했습니다.`;
    writePage('tide/' + R.slug, layout(title, desc, `/tide/${R.slug}/`, content, { jsonld: `<script type="application/ld+json">${JSON.stringify(faqLd)}</script>`, ogImage: (vs.find(v => v.img) || {}).img }));
    regionPages.push({ R, vs, codes, bestWk });
  });

  // ---------- 허브 /tide/ ----------
  const top = V.filter(v => !v.east).map(v => ({ v, b: weekendBest(v) })).filter(x => x.b).sort((a, b) => b.b.range - a.b.range).slice(0, 10);
  const nCodes = new Set(V.map(v => v.code)).size;
  const hubAns = `${YMD(TODAY)} 기준, 전국 갯벌·어촌체험 마을 ${V.length}곳에 가장 가까운 조위관측소 ${nCodes}곳의 물때를 붙였습니다. ${top.length ? `이번 주말(${WEEKEND.map(MD).join('·')}) 낮에 물이 가장 많이 빠지는 곳은 <b>${esc(top[0].v.name)}</b>(${MD(top[0].b.d)} ${top[0].b.t} 전후)이고, 서해 체험마을 대부분이 이번 주말 낮에 물빠짐이 있습니다.` : '이번 주말은 낮 물빠짐이 드뭅니다 — 지역 페이지의 달력에서 다른 날을 고르세요.'}`;
  const hubFaq = [
    ['물때표는 어떻게 보나요?', '물빠짐(저조)은 바닷물이 가장 많이 빠진 순간, 물참(고조)은 가장 많이 찬 순간입니다. 하루에 보통 두 번씩 오고 날마다 50분 안팎씩 늦어집니다. 갯벌체험은 낮(오전 9시~오후 4시)에 물빠짐이 오는 날, 그 시각 전후로 가면 갯벌이 가장 넓게 드러납니다.'],
    ['물이 «많이» 빠지는 날은 어떻게 알 수 있나요?', '같은 날 물참과 물빠짐의 높이 차가 클수록 갯벌이 넓게 드러납니다. 지역 페이지 달력에서 «차 ○○cm»가 큰 날, ★·노란 칸(그 관측소 이달 상위 25%)이 그런 날입니다. 11~12월 예보로 서해 북부(인천·안산)는 하루 차가 많게는 9m, 남해는 1~4m 안팎, 동해는 수십 cm입니다.'],
    ['겨울에도 갯벌체험이 되나요?', `물때는 계절과 상관없이 오지만, 체험 프로그램은 «계절·마을 사정에 따라 변동»이라고 안내하는 마을이 많습니다(운영 시간·쉬는 날에 겨울·동절기를 따로 적은 곳 ${winterRest}곳). 11~12월은 해가 짧고 바람이 차니 출발 전 마을에 운영 여부를 꼭 확인하세요.`],
    ['해루질 도구는 아무거나 써도 되나요?', '아닙니다. 해양수산부가 2023년 12월부터 정한 기준에 따라 비어업인은 호미·삽·갈고리·집게·뜰채 등을 종류별로 하나씩만 쓸 수 있고, 동력 장비와 집어등은 금지입니다. 시·도 조례로 지역 기준이 따로 있을 수 있으니 관할 시·군청에 확인하세요.'],
    ['이 물때는 어디서 가져온 건가요?', `국립해양조사원 조석예보(고·저조) 공공데이터입니다. 마을에서 직선거리로 가장 가까운 관측소를 골라 붙였고(대부분 30km 이내), 매주 새로 받아 갱신합니다. 지금은 ${YMD(LAST)}까지의 예보가 들어 있습니다.`],
  ];
  const hubLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: hubFaq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) };
  const hubContent = `<main><div class="wrap">
<h1 style="font-size:1.5rem;font-weight:900;margin:8px 0 6px">물때표로 보는 갯벌체험·해루질 좋은 날 — 전국 체험마을 ${V.length}곳</h1>
<div class="ansbox"><p><b>한 줄 답</b> — ${hubAns}</p>
<p style="margin-top:6px;font-size:.9rem;color:#4b5563">축제모아(chukjemoa.co.kr)는 한국관광공사·국립해양조사원 등 공공데이터로 축제·나들이 정보를 매일 정리하는 사이트입니다. 집계 기준일 ${YMD(TODAY)}.</p></div>
<p style="line-height:1.8">갯벌체험은 «언제 가느냐»가 전부입니다. 같은 마을이라도 물이 빠진 낮에 가면 끝없이 펼쳐진 갯벌에서 조개를 캘 수 있지만, 물이 찬 시간에 가면 바다만 보고 돌아옵니다. 그래서 이 페이지는 전국 갯벌·어촌체험 마을마다 가장 가까운 국립해양조사원 관측소를 짝지어, <b>날짜별 물빠짐 시각</b>을 지역별로 모았습니다. 지역을 고르면 이번 주말 표, 남은 기간 낮 물빠짐 달력, 마을별 운영 시간·쉬는 날·주차·문의까지 한 번에 볼 수 있습니다.</p>

<h2 class="sec">지역 고르기</h2>
<div class="rcard">${regionPages.map(p => `<a href="/tide/${p.R.slug}/"><b>${p.R.name}</b><br><small>체험마을 ${p.vs.length}곳 · 관측소 ${p.codes.map(stName).slice(0, 4).join('·')}${p.codes.length > 4 ? ' 등' : ''}</small><br><small>${p.bestWk.length ? `이번 주말 낮 물빠짐 ${p.bestWk.length}곳` : '이번 주말 낮 물빠짐 적음'}</small></a>`).join('')}</div>

<h2 class="sec">이번 주말 낮에 물이 많이 빠지는 마을 TOP ${top.length}</h2>
<p style="color:#6b7280;font-size:.93rem">${WEEKEND.map(MD).join('·')} 중 오전 9시~오후 4시 물빠짐이 있는 날 가운데, 그날 물높이 차가 큰 순서입니다(동해안 제외).</p>
<div class="twrap"><table class="ttbl"><tr><th>#</th><th>마을</th><th>물빠짐</th><th>물높이 차</th></tr>${top.map((x, i) => `<tr><td>${i + 1}</td><td><a href="/tide/${regionOf(x.v).slug}/#v${x.v.id}">${esc(x.v.name)}</a><br><small>${esc(x.v.sido)} · ${esc(stName(x.v.code))} 관측소</small></td><td>${MD(x.b.d)} <b>${x.b.t}</b></td><td>${x.b.range}cm</td></tr>`).join('')}</table></div>

<h2 class="sec">물때표 읽는 법</h2>
<p style="line-height:1.8">바닷물은 달과 해의 힘으로 하루에 보통 두 번 들어오고(물참·고조) 두 번 나갑니다(물빠짐·저조). 물때는 날마다 50분 안팎씩 늦어지기 때문에 «지난주 이 시간»이 이번 주에도 맞지는 않습니다. 또 같은 날이라도 서해 북부(인천·안산)는 물참과 물빠짐의 높이 차가 많게는 9m에 이르지만(11~12월 예보), 남해는 1~4m 안팎, 동해는 수십 cm에 그칩니다. 그래서 넓은 갯벌체험은 서해·남해 서부에 몰려 있고, 동해안 마을은 갯벌보다 어촌·바다 체험 위주입니다.</p>
<p style="line-height:1.8">체험하기 좋은 날은 ① 낮(오전 9시~오후 4시)에 물빠짐이 오고 ② 그날 물높이 차가 큰 날입니다. 지역 페이지 달력의 ★·노란 칸이 «그 관측소에서 이달 물이 가장 많이 빠지는 25%의 날»입니다. 다만 물때가 좋아도 체험장이 쉬는 날이면 들어갈 수 없으니, 마을 운영 시간과 예약을 먼저 확인하세요.</p>

<h2 class="sec">11~12월에 간다면</h2>
<p style="line-height:1.8">겨울은 갯벌체험의 비수기입니다. 체험 내용을 «계절 및 마을 사정에 따라 변동»이라고 안내하는 마을이 많고, 운영 시간·쉬는 날에 겨울·동절기를 따로 적어 둔 마을도 ${winterRest}곳 있습니다. 해가 오후 5시 10~30분 사이에 지기 때문에 오후 3~4시 물빠짐이면 금방 어두워진다는 점도 기억하세요. 대신 사람이 적고, 체험 안내에 굴을 적어 둔 마을도 ${gulN}곳 있습니다. 성수기는 봄(3~5월)과 여름 방학입니다.</p>

<h2 class="sec">갯벌 안전 — 꼭 알고 가세요</h2>
${SAFETY}
<h2 class="sec">해루질은 어디까지 되나</h2>
${HAERU}

<h2 class="sec">같이 보면 좋은 것</h2>
<div class="frel2"><a href="/2026-11/">11월 축제 일정</a><a href="/2026-12/">12월 축제 일정</a><a href="/jangteo/">🧺 오일장 장날</a><a href="/onsen/">♨️ 전국 온천</a><a href="/winter/">❄️ 겨울 축제</a><a href="/course/">🧭 코스 짜기</a></div>

<h2 class="sec">자주 묻는 것</h2>
${hubFaq.map(([q, a]) => `<p style="line-height:1.8"><b>${esc(q)}</b><br>${esc(a)}</p>`).join('')}
<p class="note" style="margin-top:20px">데이터 출처: 국립해양조사원 조석예보(고·저조) — 관측소 예측값이며 바람·기압에 따라 실제 물높이는 달라질 수 있습니다. 체험마을 정보·사진: 한국관광공사 TourAPI. 안전 안내: 부안해양경찰서·인천소방본부 보도, 해루질 기준: 해양수산부 발표(2023년 12월). 물때 갱신: 매주.</p>
</div></main>${CSS}`;
  const hubDesc = `전국 갯벌·어촌체험 마을 ${V.length}곳의 날짜별 물빠짐 시각을 국립해양조사원 조석예보로 정리했습니다. 이번 주말 낮에 물이 많이 빠지는 마을 TOP 10, 지역별 물때 달력, 운영 시간·주차·문의, 갯벌 안전과 해루질 도구 기준까지.`;
  writePage('tide', layout(`물때표로 보는 갯벌체험·해루질 좋은 날 — 전국 체험마을 ${V.length}곳 | ${SITE_NAME}`, hubDesc, '/tide/', hubContent,
    { jsonld: `<script type="application/ld+json">${JSON.stringify(hubLd)}</script>`, ogImage: (V.find(v => v.img) || {}).img }));
  console.log('✓ /tide/ — 마을', V.length, '· 관측소', nCodes, '· 지역', regionPages.length, '· 주말', WEEKEND.join(','), '· 예보 끝', LAST);
  return ['/tide/', ...regionPages.map(p => `/tide/${p.R.slug}/`)];
}
module.exports = { build };
