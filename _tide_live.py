import sys, re, urllib.request
sys.stdout.reconfigure(encoding="utf-8")
for slug in ["", "gyeonggi-incheon/", "chungnam/", "jeonbuk/", "jeonnam/", "gyeongnam/", "jeju-east/"]:
    u = "https://chukjemoa.co.kr/tide/" + slug
    try:
        h = urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=30).read().decode("utf-8")
        t = re.search(r"<title>(.*?)</title>", h).group(1)
        ans = re.sub("<[^>]+>", "", (re.search(r'<div class="ansbox"><p>(.*?)</p>', h, re.S) or [None, ""])[1])[:160]
        print("OK", u, "|", t, "\n   ", ans, "| vcard", h.count('class="vcard"'), "| faq", h.count('"@type":"Question"'))
    except Exception as e:
        print("ERR", u, e)
s = urllib.request.urlopen("https://chukjemoa.co.kr/sitemap.xml", timeout=30).read().decode()
print("sitemap tide:", s.count("/tide/"), "| sub sitemaps" if "sitemapindex" in s else "")
