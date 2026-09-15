# List scheduled tasks that belong to this project. ASCII only.
$names = @('chukjemoa','push','seo','kory','naver','build','deploy')
Get-ScheduledTask | Where-Object {
  $n = $_.TaskName.ToLower()
  ($names | Where-Object { $n -like "*$_*" }).Count -gt 0
} | ForEach-Object {
  $i = Get-ScheduledTaskInfo -TaskName $_.TaskName -TaskPath $_.TaskPath
  $act = ($_.Actions | ForEach-Object { $_.Execute + ' ' + $_.Arguments }) -join ' ;; '
  Write-Output ("TASK  {0}`n  state={1}  last={2}  result={3}  next={4}`n  run={5}`n" -f `
    $_.TaskName, $_.State, $i.LastRunTime, $i.LastTaskResult, $i.NextRunTime, $act)
}
