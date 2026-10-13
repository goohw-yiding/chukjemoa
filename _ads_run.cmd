@echo off
cd /d C:\dev\chukjemoa
node _adsense_why.js > _ads_why.txt 2>&1
node _own_ratio.js > _ads_own.txt 2>&1
node _fest_shape.js > _ads_shape.txt 2>&1
echo DONE > _ads_done.txt
