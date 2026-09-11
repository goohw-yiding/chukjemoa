# ASCII ONLY. Korean text in a .ps1 breaks the parser (TerminatorExpectedAtEndOfString).
# Usage: powershell -File _push.ps1 -Mode jangteo
param([Parameter(Mandatory=$true)][string]$Mode)

$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$dir = 'C:\dev\chukjemoa'
$log = 'C:\dev\_push_chukjemoa.txt'

function W($m) {
  $line = "$([DateTime]::Now.ToString('MM-dd HH:mm:ss'))  [$Mode] $m"
  Write-Host $line
  [System.IO.File]::AppendAllText($log, $line + [Environment]::NewLine, [System.Text.Encoding]::UTF8)
}

Set-Location $dir
if (-not (Test-Path (Join-Path $dir 'onesignal.key'))) {
  W 'ABORT - onesignal.key missing'
  exit 1
}

W 'start'
$out = & node _push.js $Mode --send 2>&1 | Out-String
foreach ($l in ($out -split "`r?`n")) { if ($l.Trim()) { W $l.TrimEnd() } }
W 'done'
