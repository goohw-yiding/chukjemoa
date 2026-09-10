$t = Get-ScheduledTask -TaskName 'chukjemoa-daily-rank' -ErrorAction SilentlyContinue
if ($t) {
  $i = Get-ScheduledTaskInfo -TaskName 'chukjemoa-daily-rank'
  $a = ($t.Actions | ForEach-Object { $_.Execute + ' ' + $_.Arguments }) -join ''
  Write-Output ("TASK  state={0}  next={1}" -f $t.State, $i.NextRunTime)
  Write-Output ("      {0}" -f $a)
} else { Write-Output 'TASK  NOT REGISTERED' }
Set-Location C:\dev\chukjemoa
Write-Output '--- last 5 commits ---'
& git log --oneline -5
Write-Output '--- working tree ---'
$c = @(& git status --porcelain).Count
Write-Output ("uncommitted files: {0}" -f $c)
