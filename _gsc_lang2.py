# -*- coding: utf-8 -*-
import json, re, collections, urllib.request
d = json.load(open(r"C:\dev\chukjemoa\_gsc_lang.json", encoding="utf-8"))
pages = d["pages"]
SITE = "https://chukjemoa.co.kr"
sm = urllib.request.urlopen(SITE + "/sitemap.xml").read().decode("utf-8")
locs = re.findall(r"<loc>(.*?)</loc>", sm)
if locs and locs[0].endswith(".xml"):
    a = []
    for s2 in locs: a += re.findall(r"<loc>(.*?)</loc>", urllib.request.urlopen(s2).read().decode("utf-8"))
    locs = a
LANG = re.compile(r"^/([a-z]{2}(?:-[a-z]{2})?)/")
def pref(u):
    m = LANG.match(u.replace(SITE, "")); return m.group(1) if m else "ko"
def seg2(u):
    p = u.replace(SITE, "").strip("/").split("/")
    return "/" + "/".join(p[:2]) + "/" if len(p) > 1 else "/" + "/".join(p) + "/"

for lang in ["ja","en","tw","zh","es"]:
    ls = [u for u in locs if pref(u) == lang]
    zero = [u for u in ls if pages.get(u, [0,0])[1] == 0]
    low  = [u for u in ls if 0 < pages.get(u,[0,0])[1] < 10]
    print(f"\n=== /{lang}/  사이트맵 {len(ls)}개 | 노출0 {len(zero)}개 | 노출1~9 {len(low)}개")
    grp = collections.defaultdict(lambda: [0,0,0])
    for u in ls:
        c, i = pages.get(u, [0,0]); g = grp[seg2(u)]
        g[0] += c; g[1] += i; g[2] += 1
    for k, v in sorted(grp.items(), key=lambda x: -x[1][0])[:14]:
        print(f"   {k:32} 페이지{v[2]:4}  클릭{v[0]:5}  노출{v[1]:6}")
    top = sorted([(pages.get(u,[0,0])[0], pages.get(u,[0,0])[1], u.replace(SITE,"")) for u in ls], reverse=True)[:5]
    for c,i,u in top:
        if c: print(f"     TOP  {c:4}클릭 {i:6}노출  {u}")
