# -*- coding: utf-8 -*-
import os, urllib.request
for f in ["icon-192.png", "favicon.svg", "manifest.json", "site.webmanifest"]:
    p = os.path.join(r"C:\dev\chukjemoa", f)
    print("로컬 %-20s %s" % (f, os.path.getsize(p) if os.path.exists(p) else "없음"))
print()
for u in ["/icon-192.png", "/favicon.svg", "/manifest.json",
          "/OneSignalSDKWorker.js", "/"]:
    try:
        r = urllib.request.urlopen("https://chukjemoa.co.kr" + u, timeout=20)
        print("라이브 %-26s %s  %s" % (u, r.status, r.headers.get("content-type")))
    except Exception as e:
        print("라이브 %-26s %s" % (u, str(e)[:60]))
