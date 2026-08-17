$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$MNT = 'C:\Users\USER\Documents\Claude\Projects\' + [char]0xD504+[char]0xB85C+[char]0xADF8+[char]0xB7A8+[char]0xB9CC+[char]0xB4E4+[char]0xAE30 + ' ' + [char]0xC2E0+[char]0xC0AC+[char]0xC5C5 + '\chukjemoa'
$DEV = 'C:\dev\chukjemoa'
Copy-Item -LiteralPath (Join-Path $MNT 'festival.js') -Destination (Join-Path $DEV 'festival.js') -Force
Set-Location $DEV
node -c festival.js
& node build.js 2>&1 | Select-Object -Last 2
git add -A
git commit -m "Event JSON-LD: add url, move telephone to location, and only emit organizer when the official homepage is known (fixes GSC warning on 151 pages)" | Select-Object -First 1
git push origin HEAD 2>&1 | Select-Object -Last 1
git log --oneline -1
