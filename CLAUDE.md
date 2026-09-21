<!-- BEGIN:동시작업규칙 -->
## ⛔ 이 PC에서는 Claude 세션이 여러 개 동시에 돈다

작업 시작 전 `C:\dev\_infra-scripts\동시작업규칙.md` 를 읽어라. 핵심 3줄:

1. **`git add -A` 금지.** 파일을 명시해서 add 한다. 남의 세션이 작업 중인 파일까지
   한 커밋에 딸려 들어가고, master push = Vercel 자동배포다.
   (2026-09-21 기준 미커밋: yiwuhubtrade 293 · company-dashboard 66 · aeo-app 19)
2. **git commit/push·빌드·배포 전에 락을 잡는다.**
   `py -3 C:\dev\_infra-scripts\lock.py acquire repo-<저장소명> --wait 900 --owner "무슨 작업"`
   → 종료코드 0이면 진행, 1이면 중단. 끝나면 `... release repo-<저장소명>`.
   지금 누가 뭘 잡고 있나: `py -3 C:\dev\_infra-scripts\lock.py list`
3. **공용 임시 파일명(`C:\temp\h.txt` 등) 금지.** `C:\temp\<작업이름>\` 아래에 만든다.
<!-- END:동시작업규칙 -->
