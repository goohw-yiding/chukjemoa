# -*- coding: utf-8 -*-
# 배포가 «내가 고친 그것»으로 바뀔 때까지 기다린다. 커밋 해시가 아니라 페이지 내용으로 확인한다.
import time, urllib.request
NEEDLE = "z-index:90"
for i in range(24):
    try:
        h = urllib.request.urlopen("https://chukjemoa.co.kr/jangteo/", timeout=25).read().decode("utf-8", "replace")
        if NEEDLE in h and "safe-area-inset-bottom" in h:
            print("배포 반영됨 (%d번째, %d초)" % (i + 1, i * 15)); break
        print("  아직 옛 버전 — %d번째" % (i + 1))
    except Exception as e:
        print("  대기 %d — %s" % (i + 1, str(e)[:40]))
    time.sleep(15)
else:
    print("시간 안에 안 바뀌었습니다")
