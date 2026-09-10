$t = Get-ScheduledTask -ErrorAction SilentlyContinue
foreach ($x in $t) {
  $n = $x.TaskName
  $a = ($x.Actions | ForEach-Object { $_.Execute + ' ' + $_.Arguments }) -join ' ; '
  if ($n -match 'chukjemoa|build|daily|deploy' -or $a -match 'chukjemoa|build\.js') {
    Write-Output ("[$($x.State)] $n  ->  " + $a.Substring(0, [Math]::Min(120, $a.Length)))
  }
}
Write-Output '--- vercel cron / github actions ---'
Get-ChildItem C:\dev\chukjemoa\.github -Recurse -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
Test-Path C:\dev\chukjemoa\vercel.json
