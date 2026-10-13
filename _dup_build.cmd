@echo off
cd /d C:\dev\chukjemoa
git status --porcelain > _gs_before.txt
node build.js > _dup_build.log 2>&1
echo BUILD_DONE %ERRORLEVEL% >> _dup_build.log
