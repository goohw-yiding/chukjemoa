# Check the 07:00 automatic daily commits specifically. ASCII only.
Set-Location C:\dev\chukjemoa
$page = 'festival/1919-seodaemun-geunarui-hamseong/index.html'
Write-Output "---- daily auto commits (message contains 'daily refresh' korean) ----"
$hashes = & git log --pretty=format:'%h|%ad|%s' --date=format:'%m-%d %H:%M' -60 --grep='순위 재정렬'
foreach ($row in $hashes) {
  $h = $row.Split('|')[0]
  $txt = (& git show "${h}:$page" 2>$null) -join "`n"
  if ($txt) {
    $n = ([regex]::Matches($txt, 'wx-chip')).Count
    Write-Output ("  {0}  chips={1}" -f $row, $n)
  } else { Write-Output ("  {0}  (page absent)" -f $row) }
}
