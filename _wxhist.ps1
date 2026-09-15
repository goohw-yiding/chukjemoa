# When did weather.json actually get refreshed, vs when did the 07:00 build run? ASCII only.
Set-Location C:\dev\chukjemoa
Write-Output "---- commits touching data/weather.json (last 14) ----"
& git log --pretty=format:'%h %ad %s' --date=format:'%m-%d %H:%M' -14 -- data/weather.json
Write-Output ""
Write-Output "---- generated= value in each of those commits ----"
$hashes = & git log --pretty=format:'%h' -14 -- data/weather.json
foreach ($h in $hashes) {
  $line = & git show "${h}:data/weather.json" 2>$null | Select-Object -First 1
  if ($line) {
    $m = [regex]::Match($line, '"generated":"([0-9-]+)"')
    $d = & git show -s --format='%ad' --date=format:'%m-%d %H:%M' $h
    Write-Output ("  {0}  commit {1}  generated={2}" -f $h, $d, $m.Groups[1].Value)
  }
}
