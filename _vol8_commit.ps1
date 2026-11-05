Set-Location C:\dev\chukjemoa
git add -A
git reset -q -- audit-pages.js audit-report.md audit.js data/index_age_history.json 2>$null
git diff --cached --name-only | Where-Object { $_ -match '(^|/)_' -or $_ -match '^\.commitmsg' } | ForEach-Object { git reset -q -- $_ }
git diff --cached --name-only | Out-File -Encoding utf8 _vol8_staged.txt
