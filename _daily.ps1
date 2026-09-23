# chukjemoa daily refresh - re-fetch last-7-day search trend, re-rank, deploy.
# Asked for by 2026-09-10: rankings must adjust every day.
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File C:\dev\chukjemoa\_daily.ps1
# NOTE: keep this file ASCII-only. Windows PowerShell 5.1 mis-parses non-BOM UTF-8 Korean.
$ErrorActionPreference = 'Continue'
# Child processes (python/node) print Korean as UTF-8. Without this, PowerShell decodes
# their output with the OEM codepage and the log fills with mojibake.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$log = 'C:\dev\_daily_chukjemoa.txt'
# NOTE: Tee-Object writes UTF-16LE on PS 5.1 and mangles Korean in the log. Use UTF8 explicitly.
function W($m) {
  $line = "$([DateTime]::Now.ToString('MM-dd HH:mm:ss'))  $m"
  Write-Host $line
  [System.IO.File]::AppendAllText($log, $line + [Environment]::NewLine, [System.Text.Encoding]::UTF8)
}

Set-Location C:\dev\chukjemoa
W "===== START ====="

# 2026-09-13: there was NO step that re-fetched the festival sources. Volume/trend/build only.
# So when a winter festival got registered upstream, it never reached the site until someone
# ran fetch-festivals.js by hand. On 09-13 the site had exactly 1 festival starting in December;
# a single manual re-fetch moved the 30-day stock 177 -> 212 and the 90-day 236 -> 281.
# Mon/Thu is enough: registrations trickle in, and TourAPI quota stays comfortable.
# _weekly_fetch.js keeps a .prev backup and reverts if a source shrinks below 70% (a 4xx read as
# "no data" has wiped a whole dataset before). Exit 1 = one source failed; keep going and build
# with the data we already have rather than skipping the deploy.
W "0) source refetch (Mon/Thu)"
$dow = (Get-Date).DayOfWeek
if ($dow -eq 'Monday' -or $dow -eq 'Thursday') {
  & node _weekly_fetch.js 2>&1 | ForEach-Object { W "   $_" }
  if ($LASTEXITCODE -ne 0) { W "   WARNING: a source failed and was reverted - see lines above" }
} else {
  W "   skip ($dow - runs Mon/Thu)"
}

# 2026-09-15: only 2 sources were ever refetched automatically. Everything else the site
#   READS had quietly aged: markets 19d, foreign-language markets 19-26d, tw festivals 8d,
#   spots/cafes/restaurants/mountains/stays (ko AND all foreign) 28-37d. No warning anywhere.
#   _slow_fetch.js picks by ACTUAL file age, not a calendar, and does at most 3 a day -
#   TourAPI's daily cap is per service (Kor/Eng/Jpn/Chs/Cht/Spn), and a capped response
#   arrives looking like "no data", so batching them on one day is how datasets vanish.
#   Self-healing: add a source, or leave the PC off for a week, and it catches up on its own.
W "0c) slow sources (rotating, max 3/day)"
& node _slow_fetch.js 2>&1 | ForEach-Object { W "   $_" }
if ($LASTEXITCODE -ne 0) { W "   WARNING: a slow source failed and was reverted - see lines above" }

# Monthly search volume. Resumes: normally only NEW festivals (seconds).
# Every 30 days it refetches everything (~100s) so absolute sizes do not go stale.
# A new festival with no volume scores 0 no matter how hot the trend is, so this must run.
W "1) volume fetch (naver search-ad, new only / full every 30d)"
cmd /c "chcp 65001 >nul & set PYTHONIOENCODING=utf-8 & py -3 _fest_volume.py 420" 2>&1 |
  Select-Object -First 3 | ForEach-Object { W "   $_" }

W "2) trend fetch (naver datalab)"
cmd /c "chcp 65001 >nul & set PYTHONIOENCODING=utf-8 & py -3 _fest_trend.py 600" 2>&1 |
  Select-Object -Last 2 | ForEach-Object { W "   $_" }

# 2026-09-15: MEASURED - every 07:00 build shipped the site with ZERO weather chips.
#   fetch-weather.js was never wired into this task, and weather.js refuses any weather.json
#   that is not dated today (an old forecast is worse than none). So the build at 07:01 read
#   yesterday's file, dropped every chip, and deployed a site with no weather until someone
#   ran the fetcher by hand. Proof: git show <daily commit>:maple/index.html had 0 occurrences
#   of class="wx-chip" on 09-11/13/14/15, while the manual 10:24 build on 09-15 had 60.
#   Takes ~14 min (2,249 grid points, Open-Meteo rate limit). The task allows 1 hour.
#   Failure here must NOT stop the deploy - the stale file is simply ignored downstream.
W "2b) weather fetch (open-meteo, no key)"
& node fetch-weather.js 2>&1 | Select-Object -Last 2 | ForEach-Object { W "   $_" }
if ($LASTEXITCODE -ne 0) { W "   WARNING: weather fetch failed - today's build will show no weather" }

# 2026-09-23: ja/en "Nearby" lists now use road distance + drive time (road.js, NAVER Directions,
#   5 won per call, NO free tier). The 1,587 existing pairs were bought once. A NEW festival has no
#   cached pairs, so road.js falls back to straight-line for that festival (never mixes the two).
#   This step fills only the missing pairs. HARD CAP 100 calls = 500 won/day; the script also stops
#   after 5 errors in a row. Normal day: 0-40 calls. Failure must not block the deploy.
W "2c) road distance for new nearby pairs (cap 100 calls/day)"
& node fetch-road.js run 100 2>&1 | Select-Object -Last 2 | ForEach-Object { W "   $_" }

W "3) build"
$out = & node build.js 2>&1
if ($LASTEXITCODE -ne 0) {
  W "   BUILD FAILED - stopping, nothing deployed"
  ($out | Select-Object -Last 8) | ForEach-Object { W "   $_" }
  exit 1
}
($out | Select-Object -Last 2) | ForEach-Object { W "   $_" }

W "4) mirror + drift check"
& node _d2p.js build.js festival.js _fest_trend.py _fest_volume.py _weekly_fetch.js _slow_fetch.js data/fest_trend.json data/fest_volume.json data/festivals_api.json data/cltur_fstvl.json data/road_cache.json 2>&1 | Select-Object -Last 1 | ForEach-Object { W "   $_" }
$sync = (& node _sync.js 2>&1 | Select-Object -Last 1)
W "   $sync"

# 2026-09-15: there was NO verification step in this chain. audit.js's own header claimed
#   "a weekly task runs this" - it did not; no scheduled task ever called it. So the only
#   check that ran daily was _sync.js drift. That is how a 3-page island (/seoul/museum/,
#   /seoul/venue/, /busan/museum/) sat unreachable from home for weeks with nobody told.
#   WARN ONLY - audit.js exits 1 when it finds RED items, and that must NOT block the deploy:
#   a thin page is not a reason to stop shipping today's festival ranking.
#   The report itself (audit-report.md) is tracked, so each day's run is committed below
#   and the history is diffable.
W "4b) audit (warn only - never blocks deploy)"
& node audit.js 2>&1 | Select-Object -Last 14 | ForEach-Object { W "   $_" }

$changed = @(& git status --porcelain).Count
if ($changed -eq 0) { W "5) no changes - skip deploy"; W "===== END ====="; exit 0 }
W "5) deploy ($changed changed)"
& git add -A
& git commit -F C:\dev\chukjemoa\_daily_msg.txt --quiet
& git push --quiet 2>&1 | Out-Null
W "   $(& git log --oneline -1)"
W "===== END ====="
