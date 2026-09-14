// 🇯🇵 일본 공휴일 → data/jp_holidays.json
//
// 왜 필요한가 (2026-09-14)
//   일본 유입 검색어의 51%가 「휴무일·공휴일」이다. 그런데 일본인이 실제로 계획을 세울 때 보는 건
//   «한국 공휴일»이 아니라 **「내 연휴가 한국의 무슨 날과 겹치나」**다.
//   두 나라 달력을 한 장에 겹쳐 놓은 페이지는 우리가 만들 수 있고, 지금 아무도 정확히 안 하고 있다.
//
// 출처: 内閣府(일본 내각부) 「国民の祝日について」 공식 CSV
//   https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv
//   ⚠️ 인코딩이 Shift_JIS 다. UTF-8 로 읽으면 이름이 통째로 깨진다.
//   ⚠️ 春分の日·秋分の日 는 해마다 국립천문대가 정한다 — 절대 손으로 박지 말 것. 그래서 이 파일이 있다.
//
// 실행: node fetch-jp-holidays.js
'use strict';
const fs = require('fs'), path = require('path'), https = require('https');
const URL = 'https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv';
const OUT = path.join(__dirname, 'data', 'jp_holidays.json');

function get(u) {
  return new Promise((res, rej) => {
    https.get(u, { headers: { 'User-Agent': 'chukjemoa' } }, r => {
      if (r.statusCode !== 200) { rej(new Error('HTTP ' + r.statusCode)); return; }
      const bufs = [];
      r.on('data', c => bufs.push(c));
      r.on('end', () => res(Buffer.concat(bufs)));
    }).on('error', rej);
  });
}

(async () => {
  const raw = await get(URL);
  const text = new TextDecoder('shift_jis').decode(raw);
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2}),(.+?)\s*$/);
    if (!m) continue;
    const date = m[1] + '-' + m[2].padStart(2, '0') + '-' + m[3].padStart(2, '0');
    const name = m[4].trim();
    if (date < '2025-01-01') continue;   // 지난 해는 안 쓴다
    out.push({ date, name });
  }
  if (out.length < 20) throw new Error('파싱 결과가 너무 적다: ' + out.length + '건 — 형식이 바뀌었는지 확인할 것');
  if (!out.some(h => /祝|日/.test(h.name))) throw new Error('이름이 깨졌다 — Shift_JIS 디코딩 확인');
  out.sort((a, b) => a.date.localeCompare(b.date));
  fs.writeFileSync(OUT, JSON.stringify(out));
  const years = [...new Set(out.map(h => h.date.slice(0, 4)))];
  console.log('✓ data/jp_holidays.json —', out.length, '건 (' + years.join(', ') + ')');
  console.log('  예시:', out.slice(0, 3).map(h => h.date + ' ' + h.name).join(' · '));
})().catch(e => { console.error('✗ 실패:', e.message); process.exit(1); });
