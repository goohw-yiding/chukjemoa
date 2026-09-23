Set-Location C:\dev\chukjemoa
git add -A
$msg = @"
og:image per page - festival detail uses its own photo, month hubs get seasonal images

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01F4fCfieh9tnEgiWHuTXZSX
"@
$msg | Out-File -FilePath C:\dev\chukjemoa\_cmsg.txt -Encoding utf8
git commit -q -F C:\dev\chukjemoa\_cmsg.txt
git log -1 --oneline
git push 2>&1 | Select-Object -Last 2
