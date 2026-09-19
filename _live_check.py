import urllib.request, time, io
cb = str(int(time.time()))
targets = [
    ("/en/seoul/", "Nearest station"),
    ("/ja/seoul/", "最寄り駅"),
    ("/es/seoul/", None),
    ("/en/busan/", "Nearest station"),
    ("/ja/busan/", "最寄り駅"),
    ("/zh/seoul/", None),
    ("/tw/seoul/", None),
]
out = []
for path, needle in targets:
    url = "https://chukjemoa.co.kr" + path + "?cb=" + cb
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        r = urllib.request.urlopen(req, timeout=40)
        body = r.read().decode("utf-8", "replace")
        cache = r.headers.get("x-vercel-cache", "-")
        n = body.count(needle) if needle else -1
        out.append("%s status=%s cache=%s len=%d hits=%s" % (path, r.status, cache, len(body), n))
    except Exception as e:
        out.append("%s ERROR %s" % (path, e))
with io.open("_live.log", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
