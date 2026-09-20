# -*- coding: utf-8 -*-
import json, sys
from google.oauth2 import service_account
from googleapiclient.discovery import build
KEY=r"C:\dev\traffic-dashboard\sa-key.json"; SITE="https://chukjemoa.co.kr/"
cred=service_account.Credentials.from_service_account_file(KEY,scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
sc=build("searchconsole","v1",credentials=cred,cache_discovery=False)
urls=["https://chukjemoa.co.kr/","https://chukjemoa.co.kr/2026-10/",
      "https://chukjemoa.co.kr/festival/andonggukjetalchumpeseutibeol/",
      "https://chukjemoa.co.kr/festival/hongseongnamdanghang-daehachukje/",
      "https://chukjemoa.co.kr/2026-09/"]
for u in urls:
    try:
        r=sc.urlInspection().index().inspect(body={"inspectionUrl":u,"siteUrl":SITE,"languageCode":"ko"}).execute()
        res=r.get("inspectionResult",{})
        idx=res.get("indexStatusResult",{})
        print("=",u)
        print("   색인:",idx.get("coverageState"),"| 마지막 크롤:",(idx.get("lastCrawlTime") or "")[:16],"| 로봇:",idx.get("robotsTxtState"))
        rr=res.get("richResultsResult")
        if not rr: print("   리치결과: 감지 없음")
        else:
            print("   리치결과 판정:",rr.get("verdict"))
            for item in rr.get("detectedItems",[]):
                print("   -",item.get("richResultType"),"항목",len(item.get("items",[])))
                for it in item.get("items",[])[:3]:
                    iss=it.get("issues",[])
                    print("      ·",it.get("name"),"|",", ".join(f"{x.get('issueMessage')}({x.get('severity')})" for x in iss) or "문제 없음")
    except Exception as e:
        print("=",u,"실패:",str(e)[:160])
