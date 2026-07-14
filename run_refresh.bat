@echo off
cd /d C:\dev\chukjemoa
node fetch-festivals-ja.js && node fetch-festivals-es.js && node fetch-festivals-zh.js && node fetch-pets.js && node fetch-accessible.js && node fetch-trails.js && node fetch-holidays.js && node fetch-visitors.js && node build.js && git add -A && git commit -m "auto: refresh festival(ko/en/ja/es/zh) + nearby + pet + accessible + trails + holidays + visitors data (TourAPI)" && git push
echo CHAIN_DONE
