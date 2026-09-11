# -*- coding: utf-8 -*-
# 배포가 반영될 때까지 기다렸다가, 문제였던 그 페이지들을 «다시 열어» 문구를 눈으로 확인한다.
import re, time, urllib.request
PAGES = ["/festival/2026-byeolbadabusan-naiteu-kaemkeunik/",
         "/festival/2026-je14hoe-gyeonggijeongwonmunhwabangnamhoe/",
         "/flower/", "/maple/", "/2026-10/", "/festival/2026-cheongsongbaekjachukje/"]

def get(u):
    return urllib.request.urlopen("https://chukjemoa.co.kr" + u, timeout=25).read().decode("utf-8", "replace")

for i in range(24):
    try:
        if "자리 깔고 앉으려면" in get("/flower/"):
            print("배포 반영됨 (%d번째, %d초)\n" % (i + 1, i * 15)); break
        print("  아직 옛 버전 — %d번째" % (i + 1))
    except Exception as e:
        print("  대기 %d — %s" % (i + 1, str(e)[:40]))
    time.sleep(15)
else:
    print("시간 안에 안 바뀌었습니다"); raise SystemExit

for u in PAGES:
    try:
        h = get(u)
    except Exception as e:
        print("%-52s %s" % (u, str(e)[:40])); continue
    print("%-52s 봄꽃문구=%s  돗자리=%s" % (u, "봄꽃 나들이" in h, "13737049813" in h))
    i = h.find("13737049813")
    if i > 0:
        seg = re.sub(r"\s+", " ", re.sub("<[^>]+>", " ", h[i:i + 700])).strip()
        print("      →", seg[:150])
