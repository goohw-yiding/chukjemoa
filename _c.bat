@echo off
cd /d C:\dev\chukjemoa
del _f.js _k.js _p.js _v.js _bd.bat _bd.log 2>nul
node -p "['accessible/data.json','pet/data.json'].map(f=>f+' '+(require('fs').statSync(f).size/1048576).toFixed(2)+'MB').join(' | ')" > _c.log 2>&1
git add -A >> _c.log 2>&1
git commit -q -m "add /accessible/{sido}/ 17 + /pet/{sido}/ 15 sido pages (32 new)" >> _c.log 2>&1
git log --oneline -1 >> _c.log 2>&1
git push -q >> _c.log 2>&1
echo PUSH_DONE >> _c.log
