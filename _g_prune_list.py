# -*- coding: utf-8 -*-
"""정리 후보 98장 목록: 사이트맵 URL 중 구글 90일 노출 0 + 네이버 28일 유입 0 (tide·contact 제외) → _g_prune_list.csv"""
import sys, re, os, collections, csv, html as H
sys.stdout.reconfigure(encoding="utf-8")
src = open("_g_recover2.py", encoding="utf-8").read()
src = src.split('print("묶음 |')[0]
exec(src)
out = []
for u in urls:
    p = u.replace("https://chukjemoa.co.kr", "")
    if p.startswith("/tide/") or p.startswith("/contact/"): continue
    if imp.get(u, 0) == 0 and nav.get(u.rstrip("/") + "/", 0) == 0:
        f = os.path.join(p.strip("/"), "index.html")
        t = ""; L = 0
        if os.path.exists(f):
            h = open(f, encoding="utf-8").read()
            m = re.search(r"<title>(.*?)</title>", h, re.S); t = H.unescape(m.group(1)).strip() if m else ""
            body = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>|<header[\s\S]*?</header>|<footer[\s\S]*?</footer>|<nav[\s\S]*?</nav>", "", h)
            L = len(re.sub(r"\s+", "", H.unescape(re.sub(r"<[^>]+>", " ", body))))
        out.append((grp(u), p, t, L))
out.sort()
with open("_g_prune_list.csv", "w", encoding="utf-8-sig", newline="") as fp:
    w = csv.writer(fp); w.writerow(["묶음", "주소", "제목", "본문 글자수(공백제외)"]); w.writerows(out)
print("총", len(out))
c = collections.defaultdict(list)
for g, p, t, L in out: c[g].append((p, t, L))
for g, v in sorted(c.items(), key=lambda kv: -len(kv[1])):
    print(f"\n## {g} {len(v)}장 · 글자수 중간값 {sorted(x[2] for x in v)[len(v)//2]}")
    for p, t, L in v: print(f"  {p} | {t[:60]} | {L}")
