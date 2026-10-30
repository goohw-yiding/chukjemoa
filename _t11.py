import re, sys
sys.stdout.reconfigure(encoding="utf-8")
for p in ["2026-11/index.html", "winter/light/index.html", "blog/autumn-flower-peak-timing-data/index.html"]:
    h = open(p, encoding="utf-8").read()
    print("==", p)
    print("title:", re.search(r"<title>(.*?)</title>", h).group(1))
    print("h1:", re.sub("<[^>]+>", "", re.search(r"<h1[^>]*>(.*?)</h1>", h, re.S).group(1))[:200])
    print("faq:", re.findall(r'"@type":"Question","name":"([^"]+)"', h)[:8])
