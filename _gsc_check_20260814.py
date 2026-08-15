# -*- coding: utf-8 -*-
import datetime, json
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

print("=== 사이트맵 상태 ===")
for m in sc.sitemaps().list(siteUrl=SITE).execute().get("sitemap", []):
    cnt = sum(int(c.get("submitted", 0)) for c in m.get("contents", []))
    print(m["path"], "|", (m.get("lastDownloaded") or "N/A")[:10], "| submitted:", cnt,
          "| err:", m.get("errors", 0), "| warn:", m.get("warnings", 0))

end = datetime.date.today() - datetime.timedelta(days=2)
start = end - datetime.timedelta(days=27)
def q(dims, n=20):
    return sc.searchanalytics().query(siteUrl=SITE, body={
        "startDate": str(start), "endDate": str(end),
        "dimensions": dims, "rowLimit": n}).execute().get("rows", [])

print("\n=== 실적 28일 (", start, "~", end, ") ===")
tot = q([])
print(tot)
