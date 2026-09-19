@echo off
cd /d C:\dev\chukjemoa
node fetch-places.js tw 600 > _ptw.log 2>&1
node fetch-ja-places.js > _ja_ov.log 2>&1
echo RETRY_DONE > _retry_chain.done
