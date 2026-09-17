# -*- coding: utf-8 -*-
# concertmoa 메일도 왔다. 서비스 계정이 그 속성에 접근되는지부터 본다(스킬 목록엔 없었다).
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)
print("서비스 계정이 볼 수 있는 속성:")
for s in sc.sites().list().execute().get("siteEntry", []):
    print("  ", s["siteUrl"], s["permissionLevel"])
