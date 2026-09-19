@echo off
cd /d C:\dev\chukjemoa
node match-addr-ko.js places_zh.json --write > _m_zh.log 2>&1
node match-addr-ko.js places_tw.json --write > _m_tw.log 2>&1
node match-addr-ko.js places_es.json --write > _m_es.log 2>&1
node match-addr-ko.js places_en.json --write > _m_en.log 2>&1
node match-addr-ko.js places_ja.json --write > _m_ja.log 2>&1
node fix-addr-ko.js places_en.json --write > _f_en.log 2>&1
node fix-addr-ko.js places_ja.json --write > _f_ja.log 2>&1
echo ADDR_DONE > _addr_chain.done
