# -*- coding: utf-8 -*-
# 이 구글 계정에 붙어 있는 유튜브 채널을 전부 찾는다 — 새 「축제모아」 채널 ID 를 알아내기 위함
import os, sys, json, glob
print("== yt_report.py 주변 자격 파일 찾기")
for pat in [r"C:\dev\traffic-dashboard\*.json", r"C:\dev\traffic-dashboard\*.pickle",
            r"C:\dev\traffic-dashboard\*.txt"]:
    for f in glob.glob(pat):
        print("   ", os.path.basename(f), os.path.getsize(f), "B")
sys.path.insert(0, r"C:\dev\traffic-dashboard")
try:
    src = open(r"C:\dev\traffic-dashboard\yt_report.py", encoding="utf-8").read()
except Exception as e:
    print("yt_report.py 못 읽음:", e); raise SystemExit(1)
print("\n== yt_report.py 앞 40줄")
for i, l in enumerate(src.split("\n")[:40], 1):
    print("  %2d: %s" % (i, l[:120]))
