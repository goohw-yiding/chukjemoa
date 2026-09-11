# -*- coding: utf-8 -*-
# 만들었으면 «실물»을 본다. 빌드 로그가 아니라 파일 안을 연다.
import io, os, json
R = r"C:\dev\chukjemoa"
print(open(os.path.join(R, "manifest.json"), encoding="utf-8").read())
print("=" * 50)
tests = ["index.html", r"jangteo\index.html", r"2026-10\index.html",
         r"en\index.html", r"ja\index.html"]
for t in tests:
    p = os.path.join(R, t)
    if not os.path.exists(p):
        print("%-24s 파일 없음" % t); continue
    h = io.open(p, encoding="utf-8").read()
    print("%-24s manifest=%s  apple-cap=%s  홈화면안내=%s  OneSignal=%s" % (
        t,
        'rel="manifest"' in h,
        'apple-mobile-web-app-capable' in h,
        "cjm_a2hs" in h,
        "OneSignalSDK.page.js" in h))
