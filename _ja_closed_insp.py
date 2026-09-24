# -*- coding: utf-8 -*-
import io
from google.oauth2 import service_account
from googleapiclient.discovery import build
KEY=r"C:\dev\traffic-dashboard\sa-key.json"; SITE="https://chukjemoa.co.kr/"
cred=service_account.Credentials.from_service_account_file(KEY,scopes=["https://www.googleapis.com/auth/webmasters"])
sc=build("searchconsole","v1",credentials=cred,cache_discovery=False)
O=[]
for p in ["ja/closed/","ja/closed/hangeul-day/","ja/closed/chuseok/","ja/closed/gaecheonjeol/","ja/busy/"]:
    try:
        r=sc.urlInspection().index().inspect(body={"inspectionUrl":SITE+p,"siteUrl":SITE}).execute()["inspectionResult"]["indexStatusResult"]
        O.append("%-26s %s | %s | crawl %s | refs %s"%(p,r.get("verdict"),r.get("coverageState"),r.get("lastCrawlTime","-")[:10],len(r.get("referringUrls",[]))))
    except Exception as e: O.append(p+" ERR "+str(e)[:120])
io.open("_ja_closed_insp.txt","w",encoding="utf-8").write("\n".join(O)); print("done")
