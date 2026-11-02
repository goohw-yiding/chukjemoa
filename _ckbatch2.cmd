@echo off
cd /d C:\dev\chukjemoa
echo [camping] > _ckb2.txt
node confirm-festivals.js --check-url "https://campingcook.isplus.com/" 2026-06-12 2026-06-14 >> _ckb2.txt 2>&1
node confirm-festivals.js --check-url "https://m.news.nate.com/view/20260613n10203" 2026-06-12 2026-06-14 >> _ckb2.txt 2>&1
node confirm-festivals.js --check-url "https://news.nate.com/view/20260613n08591" 2026-06-12 2026-06-14 >> _ckb2.txt 2>&1
node confirm-festivals.js --check-url "https://m.news.nate.com/view/20260613n08612" 2026-06-12 2026-06-14 >> _ckb2.txt 2>&1
node confirm-festivals.js --check-url "https://m.news.nate.com/view/20260613n08596" 2026-06-12 2026-06-14 >> _ckb2.txt 2>&1
echo [incheon] >> _ckb2.txt
node confirm-festivals.js --check-url "https://www.kyeongin.com/article/1762586" 2026-05-05 2026-05-05 >> _ckb2.txt 2>&1
node confirm-festivals.js --check-url "https://www.metroseoul.co.kr/article/20260429500224" 2026-05-05 2026-05-05 >> _ckb2.txt 2>&1
echo END >> _ckb2.txt
