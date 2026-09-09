# -*- coding: utf-8 -*-
# 「0건」은 결론이 아니라 고장 신호일 수 있다 — 받아 온 HTML이 무엇인지부터 본다.
import sys, io, re, urllib.request, urllib.parse
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
kw = sys.argv[1] if len(sys.argv) > 1 else "영주장날"
for label, u in [("PC", "https://search.naver.com/search.naver?query="),
                 ("모바일", "https://m.search.naver.com/search.naver?query=")]:
    req = urllib.request.Request(u + urllib.parse.quote(kw),
        headers={"User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9"})
    try:
        h = urllib.request.urlopen(req, timeout=25).read().decode("utf-8", "ignore")
    except Exception as e:
        print(label, "ERR", e); continue
    txt = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", " ", h)
    txt = re.sub(r"<[^>]+>", " ", txt)
    txt = re.sub(r"\s+", " ", txt).strip()
    print("\n===== %s  HTML %d자 · 본문텍스트 %d자" % (label, len(h), len(txt)))
    print(txt[:1400])
