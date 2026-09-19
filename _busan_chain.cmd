@echo off
cd /d C:\dev\chukjemoa
node fetch-busan.js > _busan.log 2>&1
node fetch-busan-place.js > _bplace.log 2>&1
node fetch-busan-culture.js > _bcult.log 2>&1
echo CHAIN_DONE > _busan_chain.done
