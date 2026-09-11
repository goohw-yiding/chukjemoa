# -*- coding: utf-8 -*-
import time, subprocess, urllib.request
def get(u):
    return urllib.request.urlopen("https://chukjemoa.co.kr" + u, timeout=25).read().decode("utf-8", "replace")
for i in range(24):
    try:
        h = get("/jangteo/")
        # 꼬리가 합쳐졌으면 마지막 카드는 충북이어야 한다(시·도 가나다 끝)
        k = h.rfind("jt-today-card z-")
        last = h[k + 16:h.index('"', k + 16)]
        if last == "chungbuk":
            print("배포 반영됨 (%d번째) — 마지막 카드 시·도 =" % (i + 1), last); break
        print("  아직 옛 버전 — %d (마지막 %s)" % (i + 1, last))
    except Exception as e:
        print("  대기 %d — %s" % (i + 1, str(e)[:40]))
    time.sleep(15)
else:
    print("시간 안에 안 바뀌었습니다")
