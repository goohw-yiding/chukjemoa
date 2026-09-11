# -*- coding: utf-8 -*-
# 피크닉 돗자리(13737049813)가 «실제로 만들어진 HTML 어디에» 들어가 있는지 전수로 센다.
import os, io, collections
ROOT = r"C:\dev\chukjemoa"
PID = "13737049813"
SKIP = {"node_modules", ".git", "data", "cardnews", "_ytart"}
hits, kinds = [], collections.Counter()
total = 0
for dp, dn, fn in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in SKIP]
    for f in fn:
        if f != "index.html" and not f.endswith(".html"):
            continue
        total += 1
        p = os.path.join(dp, f)
        try:
            h = io.open(p, encoding="utf-8").read()
        except Exception:
            continue
        if PID in h:
            rel = "/" + os.path.relpath(dp, ROOT).replace("\\", "/") + "/"
            rel = rel.replace("/./", "/")
            hits.append(rel)
            kinds[rel.split("/")[1] if len(rel.split("/")) > 1 else "(루트)"] += 1
print("HTML 총", total, "장 중 피크닉 돗자리가 들어간 페이지:", len(hits))
print("\n-- 어느 구역인가 --")
for k, v in kinds.most_common(20):
    print("  %-16s %4d" % (k or "(루트)", v))
print("\n-- 예시 12장 --")
for r in hits[:12]:
    print("  ", r)
