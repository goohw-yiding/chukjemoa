# ASCII ONLY. Registers the three push schedules. Run once, as the same user that owns
# the existing chukjemoa-daily-rank task.
#
# Cadence reasoning:
#   jangteo  Wed + Sat 08:00  - after the 07:00 daily build, so market data is fresh.
#                               Twice a week: a 5-day market cycle means "today" changes
#                               constantly, but more than 2/week is how you get blocked.
#   festival Thu 18:00        - people plan the weekend on Thursday evening.
#   month    1st 09:00        - the next month's list just went up.
# A subscriber carries ONE interest tag, so nobody gets both streams.

$ps  = 'powershell.exe'
$arg = '-NoProfile -ExecutionPolicy Bypass -File C:\dev\chukjemoa\_push.ps1 -Mode '

function Reg($name, $mode, $trigger) {
  $a = New-ScheduledTaskAction -Execute $ps -Argument ($arg + $mode) -WorkingDirectory 'C:\dev\chukjemoa'
  $s = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
  Unregister-ScheduledTask -TaskName $name -Confirm:$false -ErrorAction SilentlyContinue
  Register-ScheduledTask -TaskName $name -Action $a -Trigger $trigger -Settings $s | Out-Null
  Write-Host "registered $name"
}

Reg 'chukjemoa-push-jangteo' 'jangteo' `
  (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Wednesday,Saturday -At 8:00am)
Reg 'chukjemoa-push-festival' 'festival' `
  (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Thursday -At 6:00pm)

# Monthly has no -Monthly switch in New-ScheduledTaskTrigger; use a daily trigger and let
# _push.js's own log guard (MIN_GAP_H.month = 480h = 20 days) allow it only once a month.
Reg 'chukjemoa-push-month' 'month' `
  (New-ScheduledTaskTrigger -Daily -At 9:00am)

Get-ScheduledTask -TaskName 'chukjemoa-push-*' |
  Select-Object TaskName, State |
  Format-Table -AutoSize
