// 📡 IndexNow 제출 — 빙·야후·네이버(2023~)·얀덱스가 공유하는 프로토콜.
//
// 2026-08-20: 빙 웹마스터 Top Recommendations의 "IndexNow" 추천으로 신설.
//   build.js 는 네트워크 호출을 하지 않는 원칙(예약 빌드 안에서 걸리면 안 됨)이라, 실제 제출은
//   이 스크립트를 손으로 돌린다. 나중에 "매 빌드 자동 제출"로 바꾸고 싶으면 이 파일을 build.js
//   뒤에 별도 단계로 붙이면 된다(지금은 초기 1회 전수 제출용).
//
// 사용법: node submit-indexnow.js            → sitemap.xml 의 URL 전부 제출
//         node submit-indexnow.js a.html b.html → 지정한 URL만 제출(경로 또는 전체 URL 둘 다 허용)
const fs = require('fs'), path = require('path'), https = require('https');

const HOST = 'chukjemoa.co.kr';
const SITE = `https://${HOST}`;
const KEY = fs.readFileSync(path.join(__dirname, 'indexnow.key'), 'utf8').trim();
const KEY_LOCATION = `${SITE}/${KEY}.txt`;

function allSitemapUrls() {
  const xml = fs.readFileSync(path.join(__dirname, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
}

function post(urlList) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList });
    const req = https.request('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  const args = process.argv.slice(2);
  let urls = args.length
    ? args.map(a => a.startsWith('http') ? a : `${SITE}/${a.replace(/^\//, '')}`)
    : allSitemapUrls();

  console.log(`키: ${KEY} · 키 위치: ${KEY_LOCATION}`);
  console.log(`제출할 URL: ${urls.length}개`);

  // IndexNow 스펙상 요청 하나에 최대 10,000개까지 가능 — 그래도 안전하게 2,000개씩 묶는다.
  const CHUNK = 2000;
  for (let i = 0; i < urls.length; i += CHUNK) {
    const chunk = urls.slice(i, i + CHUNK);
    const r = await post(chunk);
    console.log(`  [${i + 1}-${i + chunk.length}] → HTTP ${r.status} ${r.body ? '(' + r.body.slice(0, 200) + ')' : ''}`);
  }
  console.log('✓ 완료 — HTTP 200/202 면 정상 접수(빙·네이버·얀덱스 등에 전달됨). 실제 색인 반영은 별도 시간이 걸림.');
}

run().catch(e => { console.error('실패:', e.message); process.exit(1); });
