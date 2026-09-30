// 🇹🇼 대만 공휴일 → data/tw_holidays.json
//
// 왜 필요한가 (2026-09-30)
//   /tw/busy/ 「韓國什麼時候人多」 — 대만 연휴와 한국 연휴가 겹치는 날을 «날짜로» 답하는 페이지.
//   /ja/busy/ 와 같은 구조다. 대만 사람이 여행 계획을 세울 때 보는 건 «한국 공휴일»이 아니라
//   「내 연휴(連假)가 한국의 무슨 날과 겹치나」다.
//
// 출처: 行政院人事行政總處 「中華民國政府行政機關辦公日曆表」 공식 CSV (政府資料開放平臺 dataset 14718)
//   https://data.gov.tw/dataset/14718
//   ⚠️ 기사·블로그 요약은 믿지 말 것 — 2026-09-30 조사에서 2027 춘절을 「2/4~10」「2/6~12」로
//      서로 다르게 쓴 기사가 동시에 있었다. 원본 CSV 가 「2/4 小年夜 ~ 2/10 補假」다.
//   ⚠️ dgpa.gov.tw 는 인증서 체인이 불완전해서 파이썬·node 기본 https 가 거부한다.
//      윈도우 curl(schannel)은 받는다 → 다운로드만 curl 로 한다.
//   ⚠️ 해마다 6~7월에 다음 해 파일이 올라온다. 같은 해에 «수정판»(예: 114年 1141020更新)이
//      따로 올라오기도 한다 → 같은 해가 여러 개면 «가장 나중에 올라온 파일»을 쓴다.
//
// CSV 형식: 西元日期,星期,是否放假,備註   (是否放假 2=쉼 · 0=근무)
//   · 쉬는 평일/주말에 備註(이름)가 붙은 날 → 공휴일·補假
//   · 토·일인데 是否放假=0 → 補班(보충 근무일) — 연휴 덩어리를 끊는다
//
// 실행: node fetch-tw-holidays.js
'use strict';
const fs = require('fs'), path = require('path'), https = require('https');
const { execFileSync } = require('child_process');
const OUT = path.join(__dirname, 'data', 'tw_holidays.json');
const API = 'https://data.gov.tw/api/v2/rest/dataset/14718';

function getJSON(u) {
  return new Promise((res, rej) => {
    https.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
      if (r.statusCode !== 200) { rej(new Error('HTTP ' + r.statusCode)); return; }
      let s = ''; r.setEncoding('utf8'); r.on('data', c => s += c); r.on('end', () => res(JSON.parse(s)));
    }).on('error', rej);
  });
}

(async () => {
  const thisYear = new Date(Date.now() + 9 * 3600e3).getUTCFullYear();
  const meta = await getJSON(API);
  const dist = ((meta.result || {}).distribution || [])
    .filter(x => /CSV/i.test(x.resourceFormat) && !/Google/.test(x.resourceDescription || ''));
  // 민국 연도 → 서기
  const byYear = {};
  dist.forEach((x, i) => {
    const m = String(x.resourceDescription || '').match(/^(\d{3})年/);
    if (!m) return;
    const y = +m[1] + 1911;
    // 작년 것도 남긴다 — 1월에 작년을 빼면 건수가 절반으로 줄어 _slow_fetch 의 건수 가드(70%)가 매번 되돌린다.
    if (y < thisYear - 1) return;
    byYear[y] = { url: x.resourceDownloadUrl, desc: x.resourceDescription, order: i };   // 뒤에 나온 것이 이긴다
  });
  const years = Object.keys(byYear).sort();
  if (!years.length) throw new Error('올해 이후 CSV 가 목록에 없다 — data.gov.tw 형식 확인');

  const out = [];
  for (const y of years) {
    const buf = execFileSync('curl.exe', ['-sS', '-L', byYear[y].url], { maxBuffer: 10 * 1024 * 1024 });
    const text = buf.toString('utf8').replace(/^﻿/, '');
    // 작년 파일은 옛 형식(Big5)일 수 있다(114年 실측) — 작년 것은 못 읽으면 건너뛴다. 올해 이후는 실패로 멈춘다.
    if (!/西元日期/.test(text) && +y < thisYear) { console.log(`  ${y} 건너뜀 — 머리글 없음(옛 인코딩)`); continue; }
    if (!/西元日期/.test(text)) throw new Error(y + ' CSV 머리글이 없다 — 인코딩 확인(첫 줄: ' + text.slice(0, 40) + ')');
    let n = 0;
    for (const line of text.split(/\r?\n/).slice(1)) {
      const p = line.split(',').map(s => s.trim());
      if (p.length < 3 || !/^\d{8}$/.test(p[0])) continue;
      const date = p[0].slice(0, 4) + '-' + p[0].slice(4, 6) + '-' + p[0].slice(6, 8);
      const wk = p[1] === '六' || p[1] === '日';
      if (p[2] === '2' && (p[3] || !wk)) { out.push({ date, name: p[3] || '放假' }); n++; }
      else if (p[2] === '0' && wk) { out.push({ date, name: '補班', work: true }); n++; }
    }
    console.log(`  ${y} (${byYear[y].desc}) — ${n}건`);
  }
  if (out.length < 15) throw new Error('파싱 결과가 너무 적다: ' + out.length + '건');
  out.sort((a, b) => a.date.localeCompare(b.date));
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log('✓ data/tw_holidays.json —', out.length, '건 (' + years.join(', ') + ')');
})().catch(e => { console.error('✗ 실패:', e.message); process.exit(1); });
