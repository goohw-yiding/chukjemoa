# Register the daily task. ASCII only (see _daily.ps1 note).
$name = 'chukjemoa-daily-rank'
$act = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument '-NoProfile -ExecutionPolicy Bypass -File C:\dev\chukjemoa\_daily.ps1'
$trg = New-ScheduledTaskTrigger -Daily -At 7:00am
# If the PC was asleep/off at 07:00, run as soon as it is back.
$set = New-ScheduledTaskSettingsSet -StartWhenAvailable `
  -DontStopIfGoingOnBatteries -AllowStartIfOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Hours 1)
Register-ScheduledTask -TaskName $name -Action $act -Trigger $trg -Settings $set `
  -Description 'chukjemoa: refetch 7-day search trend, rebuild, deploy' -Force | Out-Null
$t = Get-ScheduledTask -TaskName $name
$i = Get-ScheduledTaskInfo -TaskName $name
Write-Output ("registered: {0} / state {1} / next {2}" -f $t.TaskName, $t.State, $i.NextRunTime)
