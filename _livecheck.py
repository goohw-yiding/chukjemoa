import urllib.request, time

ts = int(time.time())
urls = [
    ("en", f"https://chukjemoa.co.kr/en/seoul/?cb={ts}", "Nearest station"),
    ("ja", f"https://chukjemoa.co.kr/ja/seoul/?cb={ts}", "\u6700\u5bc4\u308a\u99c5"),
    ("es", f"https://chukjemoa.co.kr/es/seoul/?cb={ts}", None),
]

out = []
for lang, url, needle in urls:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        resp = urllib.request.urlopen(req, timeout=20)
        body = resp.read().decode("utf-8", "replace")
        status = resp.status
        cache = resp.headers.get("x-vercel-cache", "(none)")
        count = body.count(needle) if needle else None
        out.append(f"{lang} status={status} cache={cache} count={count} len={len(body)}")
    except Exception as e:
        out.append(f"{lang} ERROR {e}")

with open("C:/dev/chukjemoa/_livecheck.log", "w", encoding="utf-8") as f:
    f.write("\n".join(out) + "\n")
