# -*- coding: utf-8 -*-
# 2단계 — 「어느 페이지가 어느 말로 걸리는가」와 「그 페이지의 실제 제목」을 나란히 본다.
# 제목 탓이라고 말하려면 제목을 눈으로 봐야 한다.
import datetime, collections, re, urllib.request
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)
end = datetime.date.today() - datetime.timedelta(days=2)
start = end - datetime.timedelta(days=27)

rows = sc.searchanalytics().query(siteUrl=SITE, body={
    "startDate": str(start), "endDate": str(end),
    "dimensions": ["page", "query"], "rowLimit": 25000}).execute().get("rows", [])

TARGET = ["/blog/chuseok-2026-holiday-guide/", "/jangteo/",
          "/blog/bongpyeong-buckwheat-festival-guide/", "/2026-09/"]
for t in TARGET:
    sub = [r for r in rows if r["keys"][0].replace("https://chukjemoa.co.kr", "").split("#")[0] == t]
    sub.sort(key=lambda r: -r["impressions"])
    imp = sum(r["impressions"] for r in sub); clk = sum(r["clicks"] for r in sub)
    print("\n=== %s  (앵커 포함 노출%d 클릭%d)" % (t, imp, clk))
    for r in sub[:12]:
        anc = r["keys"][0].split("#")[1] if "#" in r["keys"][0] else ""
        print("   %-28s 노출%5d 클릭%4d 순위%5.1f %s" % (
            r["keys"][1][:28], r["impressions"], r["clicks"], r["position"],
            ("#" + anc) if anc else ""))

# 앵커 URL이 전체에서 얼마나 되나
anc_i = sum(r["impressions"] for r in rows if "#" in r["keys"][0])
anc_c = sum(r["clicks"] for r in rows if "#" in r["keys"][0])
all_i = sum(r["impressions"] for r in rows); all_c = sum(r["clicks"] for r in rows)
print("\n[#앵커 URL 로 잡힌 것] 노출 %d (%.1f%%) · 클릭 %d" % (anc_i, anc_i / all_i * 100, anc_c))
print("[본문 URL] 노출 %d · 클릭 %d" % (all_i - anc_i, all_c - anc_c))

# 실제 제목·설명을 가져와 본다
def head(u):
    try:
        h = urllib.request.urlopen(u + "?cb=x", timeout=20).read().decode("utf-8", "ignore")
    except Exception as e:
        return ("ERR " + str(e)[:40], "")
    t = re.search(r"<title>(.*?)</title>", h, re.S)
    d = re.search(r'<meta name="description" content="(.*?)"', h, re.S)
    return (t.group(1).strip() if t else "?", d.group(1).strip() if d else "?")

print("\n[실제 제목·설명]")
for t in TARGET:
    ti, de = head("https://chukjemoa.co.kr" + t)
    print("  %s\n    title(%d자) %s\n    desc (%d자) %s" % (t, len(ti), ti, len(de), de[:120]))
