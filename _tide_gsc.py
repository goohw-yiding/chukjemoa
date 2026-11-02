import sys
sys.stdout.reconfigure(encoding="utf-8")
from google.oauth2 import service_account
from googleapiclient.discovery import build
cred = service_account.Credentials.from_service_account_file(r"C:\dev\traffic-dashboard\sa-key.json", scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)
for u in ["https://chukjemoa.co.kr/tide/", "https://chukjemoa.co.kr/tide/chungnam/"]:
    r = sc.urlInspection().index().inspect(body={"inspectionUrl": u, "siteUrl": "https://chukjemoa.co.kr/", "languageCode": "ko"}).execute()
    s = r["inspectionResult"]["indexStatusResult"]
    print(u, s.get("coverageState"), s.get("lastCrawlTime"))
