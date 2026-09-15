# Did the 07:00 auto-build actually ship weather chips? Look at a real built page
# across the last several daily deploy commits. ASCII only.
Set-Location C:\dev\chukjemoa
$page = (& git ls-files 'festival/*/index.html' | Select-Object -First 1)
Write-Output ("page: {0}" -f $page)
Write-Output "---- last 10 commits, wx-chip count on that page ----"
$hashes = & git log --pretty=format:'%h|%ad|%s' --date=format:'%m-%d %H:%M' -10
foreach ($row in $hashes) {
  $h = $row.Split('|')[0]
  $txt = (& git show "${h}:$page" 2>$null) -join "`n"
  if ($txt) {
    $n = ([regex]::Matches($txt, 'wx-chip')).Count
    Write-Output ("  {0}  chips={1}" -f $row, $n)
  } else {
    Write-Output ("  {0}  (page absent)" -f $row)
  }
}
