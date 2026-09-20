# -*- coding: utf-8 -*-
# 「겨울 축제」에 전용 페이지 /winter/ 가 있는데 35위다. 12월 허브(/2026-12/)는 5위.
# 구글이 전용 페이지 대신 월 허브를 고른 이유를 본다: 색인·크롤·내부링크·만든 날짜.
import os, re, glob, subprocess, datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build

ROOT = r"C:\dev\chukjemoa"
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

print("=== 색인 상태 ===")
for u in ["https://chukjemoa.co.kr/winter/", "https://chukjemoa.co.kr/2026-12/"]:
    r = sc.urlInspection().index().inspect(body={"inspectionUrl": u, "siteUrl": SITE, "languageCode": "ko"}).execute()
    s = r.get("inspectionResult", {}).get("indexStatusResult", {})
    print(f"  {u.replace('https://chukjemoa.co.kr',''):<12} {s.get('verdict','?'):<6} {s.get('coverageState','?')} · 마지막크롤 {(s.get('lastCrawlTime') or '?')[:10]}"
          f" · 구글정규 {s.get('googleCanonical','?').replace('https://chukjemoa.co.kr','')}")

print("\n=== 내부 링크가 몇 장에서 오나 (+앵커 문구) ===")
cnt = {"/winter/": 0, "/2026-12/": 0}
anchors = {"/winter/": {}, "/2026-12/": {}}
for f in glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True):
    if any(x in f for x in ("node_modules", ".git", os.sep + "data" + os.sep, "cardnews")):
        continue
    try:
        h = open(f, encoding="utf-8").read()
    except Exception:
        continue
    h = re.sub(r"<script[\s\S]*?</script>", " ", h)
    for t in cnt:
        ms = re.findall(r'<a[^>]+href="' + re.escape(t) + r'"[^>]*>([\s\S]*?)</a>', h)
        if ms:
            cnt[t] += 1
            for a in ms:
                a = re.sub(r"<[^>]+>", "", a).strip()[:30]
                anchors[t][a] = anchors[t].get(a, 0) + 1
for t in cnt:
    top = sorted(anchors[t].items(), key=lambda x: -x[1])[:5]
    print(f"  {t:<12} {cnt[t]:>4}장에서 링크   앵커: " + " · ".join(f"「{a}」{n}" for a, n in top))

print("\n=== /winter/ 은 언제 생겼나 ===")
out = subprocess.run(["git", "log", "--diff-filter=A", "--format=%ad %h %s", "--date=short", "--", "winter/index.html"],
                     cwd=ROOT, capture_output=True, text=True, encoding="utf-8").stdout.strip()
print("  " + (out or "(기록 없음)"))

print("\n=== 사이트맵에 있나 ===")
for sm in glob.glob(os.path.join(ROOT, "sitemap*.xml")):
    t = open(sm, encoding="utf-8").read()
    if "/winter/</loc>" in t: print("  /winter/ →", os.path.basename(sm))
