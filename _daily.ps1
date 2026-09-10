# chukjemoa daily refresh - re-fetch last-7-day search trend, re-rank, deploy.
# Asked for by 2026-09-10: rankings must adjust every day.
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File C:\dev\chukjemoa\_daily.ps1
# NOTE: keep this file ASCII-only. Windows PowerShell 5.1 mis-parses non-BOM UTF-8 Korean.
$ErrorActionPreference = 'Continue'
$log = 'C:\dev\_daily_chukjemoa.txt'
function W($m) { "$([DateTime]::Now.ToString('MM-dd HH:mm:ss'))  $m" | Tee-Object -FilePath $log -Append }

Set-Location C:\dev\chukjemoa
W "===== START ====="

# Monthly search volume. Resumes: normally only NEW festivals (seconds).
# Every 30 days it refetches everything (~100s) so absolute sizes do not go stale.
# A new festival with no volume scores 0 no matter how hot the trend is, so this must run.
W "1) volume fetch (naver search-ad, new only / full every 30d)"
cmd /c "chcp 65001 >nul & set PYTHONIOENCODING=utf-8 & py -3 _fest_volume.py 420" 2>&1 |
  Select-Object -First 3 | ForEach-Object { W "   $_" }

W "2) trend fetch (naver datalab)"
cmd /c "chcp 65001 >nul & set PYTHONIOENCODING=utf-8 & py -3 _fest_trend.py 600" 2>&1 |
  Select-Object -Last 2 | ForEach-Object { W "   $_" }

W "3) build"
$out = & node build.js 2>&1
if ($LASTEXITCODE -ne 0) {
  W "   BUILD FAILED - stopping, nothing deployed"
  ($out | Select-Object -Last 8) | ForEach-Object { W "   $_" }
  exit 1
}
($out | Select-Object -Last 2) | ForEach-Object { W "   $_" }

W "4) mirror + drift check"
& node _d2p.js build.js festival.js data/fest_trend.json data/fest_volume.json 2>&1 | Select-Object -Last 1 | ForEach-Object { W "   $_" }
$sync = (& node _sync.js 2>&1 | Select-Object -Last 1)
W "   $sync"

$changed = @(& git status --porcelain).Count
if ($changed -eq 0) { W "5) no changes - skip deploy"; W "===== END ====="; exit 0 }
W "5) deploy ($changed changed)"
& git add -A
& git commit -F C:\dev\chukjemoa\_daily_msg.txt --quiet
& git push --quiet 2>&1 | Out-Null
W "   $(& git log --oneline -1)"
W "===== END ====="
