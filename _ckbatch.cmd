@echo off
cd /d C:\dev\chukjemoa
echo [imsil] > _ckb.txt
node confirm-festivals.js --check-url "https://www.jjan.kr/article/20260410500037" 2026-05-01 2026-05-03 >> _ckb.txt 2>&1
node confirm-festivals.js --check-url "https://www.news1.kr/local/jeonbuk/6149820" 2026-05-01 2026-05-03 >> _ckb.txt 2>&1
node confirm-festivals.js --check-url "https://www.kukinews.com/article/view/kuk202605040047" 2026-05-01 2026-05-03 >> _ckb.txt 2>&1
node confirm-festivals.js --check-url "https://jjan.kr/article/20260213500029" 2026-05-01 2026-05-03 >> _ckb.txt 2>&1
echo [hongcheon] >> _ckb.txt
node confirm-festivals.js --check-url "https://www.kukinews.com/article/view/kuk202604080236" 2026-05-01 2026-05-03 >> _ckb.txt 2>&1
node confirm-festivals.js --check-url "https://www.kukinews.com/article/view/kuk202605020004" 2026-05-01 2026-05-03 >> _ckb.txt 2>&1
echo [camping] >> _ckb.txt
node confirm-festivals.js --check-url "https://www.mcst.go.kr/site/s_culture/festival/festivalView.jsp?pSeq=13524" 2026-06-12 2026-06-14 >> _ckb.txt 2>&1
node confirm-festivals.js --check-url "https://www.ktriptips.com/kor/festival/2812160" 2026-06-12 2026-06-14 >> _ckb.txt 2>&1
echo [incheon] >> _ckb.txt
node confirm-festivals.js --check-url "https://www.fnnews.com/news/202605020800269594" 2026-05-05 2026-05-05 >> _ckb.txt 2>&1
node confirm-festivals.js --check-url "https://www.incheon.go.kr/intv/TV010201/2640282" 2026-05-05 2026-05-05 >> _ckb.txt 2>&1
echo END >> _ckb.txt
