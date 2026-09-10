# -*- coding: utf-8 -*-
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

URLS = [
    "https://chukjemoa.co.kr/jangteo/",
    "https://chukjemoa.co.kr/blog/ojang-day-guide/",
    "https://chukjemoa.co.kr/jangteo/gyeongbuk/",
    "https://chukjemoa.co.kr/jangteo/andong/",
    "https://chukjemoa.co.kr/jangteo/hongcheon/",
    "https://chukjemoa.co.kr/jangteo/yongin/",
]
for u in URLS:
    try:
        r = sc.urlInspection().index().inspect(body={
            "inspectionUrl": u, "siteUrl": SITE, "languageCode": "ko"}).execute()
        s = r.get("inspectionResult", {}).get("indexStatusResult", {})
        print("%-52s %-30s crawl %s" % (
            u.replace("https://chukjemoa.co.kr", ""),
            s.get("coverageState", "?"),
            (s.get("lastCrawlTime") or "-")[:16]))
    except Exception as e:
        print("%-52s ERROR %s" % (u, str(e)[:90]))
