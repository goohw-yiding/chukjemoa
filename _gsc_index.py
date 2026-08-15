# -*- coding: utf-8 -*-
import json, re, sys, time, urllib.request, collections
from concurrent.futures import ThreadPoolExecutor
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])

urls = re.findall(r"<loc>(.*?)</loc>",
                  urllib.request.urlopen("https://chukjemoa.co.kr/sitemap.xml").read().decode("utf-8"))
print("사이트맵 URL:", len(urls))

def kind(u):
    p = u.replace("https://chukjemoa.co.kr", "").rstrip("/") or "/"
    if re.match(r"^/(en|ja|es|zh|tw)(/|$)", p): return "외국어"
    if p.startswith("/festival"): return "축제상세" if p != "/festival" else "축제허브"
    if p.startswith("/blog"): return "블로그"
    if re.match(r"^/20\d\d-\d\d$", p): return "월별"
    if p.startswith("/trails"): return "걷기길"
    if p.startswith("/course"): return "코스"
    return "기타"

def check(u):
    svc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)
    for _ in range(3):
        try:
            r = svc.urlInspection().index().inspect(
                body={"inspectionUrl": u, "siteUrl": SITE, "languageCode": "ko"}).execute()
            s = r.get("inspectionResult", {}).get("indexStatusResult", {})
            return (u, s.get("coverageState", "?"), s.get("verdict", "?"))
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                time.sleep(6); continue
            return (u, "ERROR:" + str(e)[:60], "?")
    return (u, "RATE_LIMIT", "?")

out = []
with ThreadPoolExecutor(max_workers=8) as ex:
    for i, res in enumerate(ex.map(check, urls), 1):
        out.append(res)
        if i % 100 == 0: print("  ...", i, flush=True)

json.dump([{"url": u, "state": s, "verdict": v} for u, s, v in out],
          open("_gsc_index_result.json", "w", encoding="utf-8"), ensure_ascii=False)

print("\n=== 색인 상태 전체 ===")
for k, n in collections.Counter(s for _, s, _ in out).most_common():
    print(f"  {n:>4}  {k}")

print("\n=== 종류별 (색인됨 / 전체) ===")
by = collections.defaultdict(lambda: [0, 0])
for u, s, v in out:
    b = by[kind(u)]; b[1] += 1
    if v == "PASS": b[0] += 1
for k in sorted(by, key=lambda x: -by[x][1]):
    ok, tot = by[k]
    print(f"  {k:<8} {ok:>4} / {tot:<4}  ({ok/tot*100:.0f}%)")
