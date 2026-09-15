# All non-Microsoft scheduled tasks + who refreshes weather. ASCII only.
Get-ScheduledTask | Where-Object { $_.TaskPath -notlike '\Microsoft\*' } | ForEach-Object {
  $i = Get-ScheduledTaskInfo -TaskName $_.TaskName -TaskPath $_.TaskPath
  $act = ($_.Actions | ForEach-Object { $_.Execute + ' ' + $_.Arguments }) -join ' ;; '
  Write-Output ("{0}{1} | {2} | last={3} rc={4} next={5}`n    {6}" -f `
    $_.TaskPath, $_.TaskName, $_.State, $i.LastRunTime, $i.LastTaskResult, $i.NextRunTime, $act)
}
Write-Output "---- build.js: weather/fetch calls ----"
Select-String -Path C:\dev\chukjemoa\build.js -Pattern 'fetch-weather|execFileSync|spawnSync|child_process' |
  Select-Object -First 20 | ForEach-Object { Write-Output ("  L{0}: {1}" -f $_.LineNumber, $_.Line.Trim()) }
Write-Output "---- git log ----"
Set-Location C:\dev\chukjemoa
& git log --pretty=format:'%h %ad %s' --date=format:'%m-%d %H:%M' -8
