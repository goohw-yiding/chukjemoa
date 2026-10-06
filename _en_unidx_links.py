# -*- coding: utf-8 -*-
# 단건 3장: 처음 생긴 날 · 사이트맵 · 다른 페이지에서 들어오는 «본문» 링크(nav/footer 제외) 수
import os, re, sys, subprocess, collections
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
R = r"C:\dev\chukjemoa"
T = ["/en/blog/", "/en/festival/jeju-olle-walking-festival/", "/en/festival/moonlight-music-festival/", "/en/cities/"]
sm = open(os.path.join(R, "sitemap-lang.xml"), encoding="utf-8").read() + open(os.path.join(R, "sitemap.xml"), encoding="utf-8").read()
inb = collections.defaultdict(list)
for d, _, fs in os.walk(R):
    if "node_modules" in d or os.sep + "." in d or os.sep + "_" in d: continue
    for f in fs:
        if f != "index.html": continue
        p = os.path.join(d, f); src = "/" + os.path.relpath(d, R).replace(os.sep, "/") + "/"
        if src == "/./": src = "/"
        h = open(p, encoding="utf-8", errors="ignore").read()
        body = re.sub(r"<nav[\s\S]*?</nav>|<footer[\s\S]*?</footer>|<header[\s\S]*?</header>", " ", h)
        for t in T:
            if t != src and (f'href="{t}"' in body or f'href="https://chukjemoa.co.kr{t}"' in body): inb[t].append(src)
for t in T:
    first = subprocess.run(["git", "log", "--diff-filter=A", "--format=%ad", "--date=short", "--", t.strip("/") + "/index.html"], cwd=R, capture_output=True, text=True).stdout.split()
    print(f"\n== {t}  생성 {first[-1] if first else '?'} · 사이트맵 {'O' if t in sm else 'X'} · 본문 링크 받는 페이지 {len(inb[t])}")
    print("   ", inb[t][:12])
