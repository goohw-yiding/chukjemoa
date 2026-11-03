import json, sys, os, re, urllib.request
sys.stdout.reconfigure(encoding="utf-8")
live = len(sys.argv) > 1
P = json.load(open("data/prune_noindex.json", encoding="utf-8"))["paths"]
sm = "".join(open(f, encoding="utf-8").read() for f in os.listdir(".") if re.match(r"sitemap.*\.xml$", f))
ok = bad = 0
for p in P:
    h = urllib.request.urlopen(urllib.request.Request("https://chukjemoa.co.kr" + p, headers={"User-Agent": "M"})).read().decode() if live else open(p.strip("/") + "/index.html", encoding="utf-8").read()
    ni = 'name="robots" content="noindex' in h
    ins = ("chukjemoa.co.kr" + p + "<") in sm
    if ni and not ins: ok += 1
    else: bad += 1; print("문제", p, "noindex", ni, "sitemap", ins)
print("live" if live else "local", "정상", ok, "/", len(P))
# 대조: 정리 대상 아닌 페이지는 그대로인지
for q in ["/en/", "/ja/seoul/", "/2026-11/", "/jangteo/"]:
    h = urllib.request.urlopen(urllib.request.Request("https://chukjemoa.co.kr" + q, headers={"User-Agent": "M"})).read().decode() if live else open((q.strip("/") or ".") + "/index.html", encoding="utf-8").read()
    print("대조", q, "noindex" if 'content="noindex' in h else "색인 유지")
