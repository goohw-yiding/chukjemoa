@echo off
cd /d C:\dev\chukjemoa
node fetch-places.js zh 600 > _pzh.log 2>&1
node fetch-places.js tw 600 > _ptw.log 2>&1
node fetch-places.js es 600 > _pes.log 2>&1
node fetch-ja-places.js > _ja_ov.log 2>&1
node fetch-en-places.js 480 > _en_ov.log 2>&1
echo PLACES_DONE > _places_chain.done
