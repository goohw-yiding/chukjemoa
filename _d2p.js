// C:\dev → 프로젝트폴더 로 지정 파일을 복사한다(한글 경로 때문에 .ps1/copy 대신 .js 로).
// 사용: node _d2p.js build.js [다른파일 ...]
const fs = require('fs'), path = require('path');
const DEV = 'C:\\dev\\chukjemoa';
const PRJ = 'C:\\Users\\USER\\Documents\\Claude\\Projects\\프로그램만들기 신사업\\chukjemoa';
for (const f of process.argv.slice(2)) {
  const src = path.join(DEV, f), dst = path.join(PRJ, f);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  console.log('복사', f, fs.statSync(dst).size, 'bytes');
}
