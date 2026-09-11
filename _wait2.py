# -*- coding: utf-8 -*-
import time, urllib.request
def get(u):
    return urllib.request.urlopen("https://chukjemoa.co.kr" + u, timeout=25).read().decode("utf-8", "replace")
for i in range(24):
    try:
        if 'id="home-noti"' in get("/") and "jt-today-card z-gs" in get("/jangteo/"):
            print("배포 반영됨 (%d번째, %d초)" % (i + 1, i * 15)); break
        print("  아직 옛 버전 — %d" % (i + 1))
    except Exception as e:
        print("  대기 %d — %s" % (i + 1, str(e)[:40]))
    time.sleep(15)
else:
    print("시간 안에 안 바뀌었습니다")
