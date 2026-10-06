# -*- coding: utf-8 -*-
# 10/6 영어 미색인 단건 3 + 도시 9 — 상태·마지막 크롤·로컬 HTML 신호
import json, sys, os, re
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
D = json.load(open(r"C:\dev\traffic-dashboard\chukjemoa_index_detail.json", encoding="utf-8"))
rows = D if isinstance(D, list) else (D.get("rows") or D.get("pages") or D.get("results") or list(D.values()))
if isinstance(rows, dict): rows = list(rows.values())
print("자료 형식:", type(D).__name__, (list(D.keys())[:8] if isinstance(D, dict) else len(D)))
T = ["/en/blog/", "/en/festival/jeju-olle-walking-festival/", "/en/festival/moonlight-music-festival/",
     "/en/cities/", "/en/jeju/", "/en/gyeongju/", "/en/incheon/", "/en/yeosu/", "/en/suwon/", "/en/geoje/", "/en/jeonju/", "/en/cheongju/",
     "/en/busan/", "/en/seoul/"]
def find(u):
    for r in rows:
        if isinstance(r, dict) and str(r.get("url") or r.get("page") or "").endswith(u): return r
for u in T:
    r = find(u)
    print("\n==", u)
    if r: print("  ", {k: v for k, v in r.items() if k not in ("url", "page")})
    else: print("   (자료에 없음)")
    p = os.path.join(r"C:\dev\chukjemoa", u.strip("/").replace("/", os.sep), "index.html")
    if os.path.exists(p):
        h = open(p, encoding="utf-8").read()
        txt = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", " ", h); txt = re.sub(r"<[^>]+>", " ", txt); txt = re.sub(r"\s+", " ", txt).strip()
        robots = re.search(r'<meta name="robots" content="([^"]+)"', h)
        canon = re.search(r'<link rel="canonical" href="([^"]+)"', h)
        print("   본문", len(txt), "자 · robots", robots.group(1) if robots else "-", "· canonical", canon.group(1) if canon else "-")
    else: print("   로컬 파일 없음")
