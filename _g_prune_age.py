# -*- coding: utf-8 -*-
import csv, subprocess, sys, collections
sys.stdout.reconfigure(encoding="utf-8")
rows = list(csv.reader(open("_g_prune_list.csv", encoding="utf-8-sig")))[1:]
out = collections.defaultdict(list)
for g, p, t, L in rows:
    f = p.strip("/") + "/index.html"
    d = subprocess.run(["git", "log", "--diff-filter=A", "--format=%cs", "--", f], capture_output=True, text=True).stdout.split()
    born = d[-1] if d else "?"
    out[g].append((born, p))
for g, v in out.items():
    old = [x for x in v if x[0] != "?" and x[0] <= "2026-09-15"]
    print(g, len(v), "| 9/15 이전 생성", len(old), "| 생성일", sorted(set(x[0] for x in v)))
