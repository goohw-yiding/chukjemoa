// 🌡️ 일문 달력 「その月の天気」 — /ja/calendar/{yyyy-mm}/ · /ja/calendar/
//
// 왜 (2026-10-17): 일본어 인스타 「11월 서울은 도쿄의 12월만큼 춥다」 게시물을 만들다 보니,
//   캡션이 안내하는 우리 /ja/calendar/2026-11/ 에 «날씨가 한 줄도 없었다».
//   일본인이 「何月に行くか」를 고를 때 가장 먼저 묻는 것이 기온·옷차림이다.
// 데이터: data/climate_normals_ja.json — 일본 기상청 ClimatView 지점별 평년값(1991~2020)으로
//   서울과 일본 4도시를 «같은 출처·같은 기준»으로 비교한다. 서울 첫서리·첫얼음·첫눈은 한국 기상청 평년.
// ⚠️ 문장을 지어내지 않는다 — 숫자 비교와 기온 구간에 따른 옷차림 기준만 쓴다.
'use strict';
const fs = require('fs'), path = require('path');
let C = null;
function load() {
  if (C !== null) return C;
  try { C = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'climate_normals_ja.json'), 'utf8')); }
  catch (e) { C = false; }
  return C;
}
const f1 = v => (v > 0 ? '' : '') + v.toFixed(1);
const ORDER = ['seoul', 'tokyo', 'osaka', 'fukuoka', 'sapporo'];

// 서울의 그 달 기온과 가장 가까운 «일본의 어느 도시·어느 달»
//   ⚠️ 기온만 맞추면 「12월 → 札幌の3月」처럼 계절이 어긋난다 — 달이 멀수록 1개월당 0.25℃ 벌점.
function similar(t, m) {
  const c = load(); let best = null;
  for (const k of ['tokyo', 'sapporo']) c.cities[k].temp.forEach((v, i) => {
    const gap = m ? Math.min(Math.abs(i + 1 - m), 12 - Math.abs(i + 1 - m)) : 0;
    const d = Math.abs(v - t), score = d + gap * 0.25;
    if (!best || score < best.score) best = { k, i, v, d, score };
  });
  return best;
}
const simWord = (s, t) => s.d <= 1 ? 'くらい' : (t < s.v ? 'より少し寒いくらい' : 'より少し暖かいくらい');
function wear(t) {
  if (t <= 3) return '真冬の装備 — ダウンコート・手袋・帽子。日本の真冬より寒い日があります';
  if (t <= 10) return '厚手のコートとマフラー。朝晩は息が白くなります';
  if (t <= 16) return 'ジャケットやニット。日中と朝晩の差が大きい時期です';
  if (t <= 22) return '長袖に薄手の羽織り';
  return '半袖。屋内は冷房が強いので羽織りを一枚';
}
const SRC = () => `<p class="ic-note">出典：気象庁「世界の天候データツール（ClimatView）」地点別平年値（1991〜2020年の平均）。月平均気温は1日の平均気温の月平均なので、朝晩はこれより低くなります。ソウルの初霜・初氷・初雪の平年日は韓国気象庁の値です。</p>`;

function monthBlock(m) {
  const c = load(); if (!c) return '';
  const S = c.cities.seoul, i = m - 1, t = S.temp[i], p = S.prec[i];
  const prevT = S.temp[(i + 11) % 12];
  const sim = similar(t, m);
  const simTxt = sim ? `${c.cities[sim.k].ja}の${sim.i + 1}月（${f1(sim.v)}℃）${simWord(sim, t)}` : '';
  const diff = t - prevT;
  const tokP = c.cities.tokyo.prec[i], ratio = p / tokP;
  const rainTxt = ratio >= 1.5 ? `雨は東京の<b>${ratio.toFixed(1)}倍</b>（${Math.round(p)}mm）。${m === 7 || m === 8 ? '韓国の梅雨（장마）と夏の集中豪雨の時期で、' : ''}折りたたみ傘より大きめの傘があると安心です。`
    : ratio <= 0.6 ? `雨は東京の<b>${Math.round(ratio * 10)}割ほど</b>（${Math.round(p)}mm）で、空気が乾いています。保湿クリームとリップがあると楽です。`
    : `雨は${Math.round(p)}mmで、東京（${Math.round(tokP)}mm）と大きくは変わりません。`;
  const firsts = (c.seoulFirsts || []).filter(x => x.m === m);
  const rows = ORDER.map(k => `<tr${k === 'seoul' ? ' class="on"' : ''}><td>${c.cities[k].ja}</td><td class="n">${f1(c.cities[k].temp[i])}℃</td><td class="n">${Math.round(c.cities[k].prec[i])}mm</td></tr>`).join('');
  return `<div class="ic-card"><h2>🌡️ ${m}月のソウルの天気 — 日本でいうと${simTxt}</h2>
<p>${m}月のソウルの平均気温は<b>${f1(t)}℃</b>。${simTxt ? `日本でいえば<b>${simTxt}</b>の気温です。` : ''}${Math.abs(diff) >= 3 ? `前の月より<b>${Math.abs(diff).toFixed(1)}℃${diff < 0 ? '下がり' : '上がり'}</b>、${diff < 0 ? '一気に冷え込みます' : 'ぐっと暖かくなります'}。` : ''}</p>
<p>${rainTxt}</p>
${firsts.length ? `<p>平年の${firsts.map(x => `<b>${x.ja}は${x.m}月${x.d}日</b>`).join('、')}ごろです${firsts.some(x => x.ja === '初雪') ? '（初雪は「初めて雪が観測された日」で、積もるとは限りません）' : ''}。</p>` : ''}
<p>👕 服装の目安：${wear(t)}</p>
<table class="ic-tbl"><thead><tr><th>都市</th><th class="n">${m}月の平均気温</th><th class="n">降水量</th></tr></thead><tbody>${rows}</tbody></table>
${SRC()}</div>`;
}

function yearTable() {
  const c = load(); if (!c) return '';
  const S = c.cities.seoul, T = c.cities.tokyo;
  const rows = S.temp.map((t, i) => { const s = similar(t, i + 1);
    return `<tr><td>${i + 1}月</td><td class="n">${f1(t)}℃</td><td class="n">${f1(T.temp[i])}℃</td><td>${s ? `${c.cities[s.k].ja}の${s.i + 1}月` : ''}</td><td class="n">${Math.round(S.prec[i])}mm</td></tr>`; }).join('');
  return `<div class="ic-card"><h2>🌡️ ソウルの気温を日本の街と比べると</h2>
<p>ソウルは東京より冬がずっと寒く、夏はほぼ同じ暑さです。1月の平均気温は<b>${f1(S.temp[0])}℃</b>で東京（${f1(T.temp[0])}℃）より7℃以上低く、札幌の真冬に近い寒さです。雨は<b>7〜8月に集中</b>し、7月だけで${Math.round(S.prec[6])}mm（東京の約${(S.prec[6] / T.prec[6]).toFixed(1)}倍）降ります。</p>
<table class="ic-tbl"><thead><tr><th>月</th><th class="n">ソウル</th><th class="n">東京</th><th>日本でいうと</th><th class="n">ソウルの降水量</th></tr></thead><tbody>${rows}</tbody></table>
${SRC()}</div>`;
}

module.exports = { monthBlock, yearTable };
