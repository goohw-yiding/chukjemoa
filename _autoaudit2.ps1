# Which checker/validator scripts exist, and is weather stale-guarded? ASCII only.
Set-Location C:\dev\chukjemoa
Write-Output "---- audit / check scripts ----"
Get-ChildItem -File | Where-Object { $_.Name -match 'audit|check|verify|guard|valid' -and $_.Extension -match 'js|py|ps1' } |
  Sort-Object LastWriteTime -Descending |
  ForEach-Object { Write-Output ("  {0,-28} {1}" -f $_.Name, $_.LastWriteTime.ToString('MM-dd HH:mm')) }
Write-Output "---- audit-history.json ----"
Get-Content data\audit-history.json -Encoding UTF8 -TotalCount 40 | ForEach-Object { Write-Output ("  " + $_) }
Write-Output "---- build.js: weather freshness handling ----"
Select-String -Path build.js -Pattern 'weather\.json|WX\b' | Select-Object -First 12 |
  ForEach-Object { Write-Output ("  L{0}: {1}" -f $_.LineNumber, $_.Line.Trim()) }
Write-Output "---- weather.json head ----"
Get-Content data\weather.json -Encoding UTF8 -TotalCount 1 | ForEach-Object { Write-Output ("  " + $_.Substring(0, [Math]::Min(400, $_.Length))) }
