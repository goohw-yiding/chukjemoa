# -*- coding: utf-8 -*-
from google.oauth2 import service_account
from googleapiclient.discovery import build
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)
for f in ["sitemap.xml", "sitemap-index.xml"]:
    try:
        sc.sitemaps().submit(siteUrl=SITE, feedpath=SITE + f).execute()
        print("재제출 OK", f)
    except Exception as e:
        print("재제출 실패", f, str(e)[:120])
