Set-Location C:\dev\chukjemoa
$ErrorActionPreference = 'Continue'
$log = @()
# 내 변경분만: 실제 index(07:09 매일 갱신 작업이 올려 두고 커밋 안 한 1,790개)는 건드리지 않고, HEAD 기준 임시 index 로 커밋
$files = @('index.html','about/index.html','blog/index.html','letter/index.html','rss.xml','sitemap-blog.xml','build.js','data/posts.json')
git diff --binary --output=_vol9_mine.patch -- $files
$env:GIT_INDEX_FILE = (Resolve-Path .git).Path + '\vol9_index'
git read-tree HEAD
git apply --cached --check _vol9_mine.patch 2>&1 | % { $log += "CHECK $_" }
if ($LASTEXITCODE -ne 0) { $log += 'APPLY_CHECK_FAIL' } else {
  git apply --cached _vol9_mine.patch 2>&1 | % { $log += "APPLY $_" }
  git add -- blog/chukjemoa-weekly-vol9/index.html
  git diff --cached --stat HEAD | % { $log += "STAT $_" }
}
Remove-Item Env:\GIT_INDEX_FILE
$log | Out-File -Encoding utf8 _vol9_commit_log.txt
