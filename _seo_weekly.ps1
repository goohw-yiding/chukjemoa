# Weekly SEO report for chukjemoa. Registered as Windows task 'chukjemoa-seo-weekly'.
# Why a Windows task and not a Cowork scheduled task: cloud scheduled sessions cannot reach
# this PC (tried 3 times, see C:\dev\_로컬작업_지침\README_등록방법.md). Windows tasks can.
# NOTE: keep this file ASCII-only. Windows PowerShell 5.1 mis-parses non-BOM UTF-8 Korean.
$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$log = 'C:\dev\_seo_weekly_run.txt'
function W($m) {
  $line = "$([DateTime]::Now.ToString('MM-dd HH:mm:ss'))  $m"
  Write-Host $line
  [System.IO.File]::AppendAllText($log, $line + [Environment]::NewLine, [System.Text.Encoding]::UTF8)
}
Set-Location C:\dev\chukjemoa
W "===== SEO WEEKLY START ====="
cmd /c "chcp 65001 >nul & set PYTHONIOENCODING=utf-8 & py -3 _seo_weekly.py 7" 2>&1 |
  Select-Object -Last 4 | ForEach-Object { W "   $_" }
if (Test-Path 'C:\dev\_seo_weekly.md') {
  $n = (Get-Content 'C:\dev\_seo_weekly.md' -Encoding UTF8).Count
  W "   report lines: $n  ->  C:\dev\_seo_weekly.md"
} else {
  W "   WARNING: report file was not produced"
}
W "===== SEO WEEKLY END ====="
