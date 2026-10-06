# -*- coding: utf-8 -*-
import re, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
R = "C:/dev/chukjemoa/"
def body(p):
    h = open(R + p, encoding="utf-8").read()
    return re.sub(r"<nav[\s\S]*?</nav>|<footer[\s\S]*?</footer>|<header[\s\S]*?</header>", " ", h)
for p in ["en/index.html", "en/festival/index.html", "en/blog/ojang-day-guide-en/index.html", "en/jangteo/index.html", "en/calendar/index.html"]:
    b = body(p)
    print(p, "→ /en/blog/(목록):", len(re.findall(r'href="/en/blog/"', b)),
          "· /en/blog/*:", len(re.findall(r'href="/en/blog/[^"]+', b)),
          "· /en/cities/:", len(re.findall(r'href="/en/cities/"', b)),
          "· jeju-olle:", b.count("jeju-olle-walking-festival/"), "· moonlight-music:", b.count("moonlight-music-festival/"))
