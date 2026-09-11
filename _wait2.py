# -*- coding: utf-8 -*-
# 「완전히 묶였는지」를 라이브에서 직접 세어 판정한다. 배포 지연에 속지 않으려면 이게 기준이다.
import time, re, urllib.request
def breaks_of(h):
    out = re.findall(r'class="jt-rg">([^<]+)<', h)
    b = sum(1 for j in range(1, len(out)) if out[j] != out[j - 1])
    return len(out), b, len(set(out))
for i in range(24):
    try:
        n, b, k = breaks_of(urllib.request.urlopen(
            "https://chukjemoa.co.kr/jangteo/", timeout=25).read().decode("utf-8", "replace"))
        if b == k - 1:
            print("배포 반영됨 (%d번째) — 카드 %d장 · 바뀌는 지점 %d번 · 시·도 %d개 ✅" % (i + 1, n, b, k)); break
        print("  아직 옛 버전 — %d (바뀌는 지점 %d번, 기대 %d번)" % (i + 1, b, k - 1))
    except Exception as e:
        print("  대기 %d — %s" % (i + 1, str(e)[:40]))
    time.sleep(15)
else:
    print("시간 안에 안 바뀌었습니다")
