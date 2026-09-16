# -*- coding: utf-8 -*-
# 색인 요청 할당량이 살아 있다. 남은 몫을 «크롤이 오래된 순»으로 쓰려고 실측한다.
# 우선순위 = 한국어 10월 축 + 일본어(대표님 집중 축). 대만어는 제외.
# ⚠️ URL 검사 API 는 읽기 전용이다 — 색인 «요청」은 콘솔에서 사람이 눌러야 한다.
from google.oauth2 import service_account
from googleapiclient.discovery import build
import datetime

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

URLS = [
    # 🇯🇵 일본어 — 대표님 집중 축. palace 는 어제 새로 만든 장이다
    ("일본어", "https://chukjemoa.co.kr/ja/palace/"),
    ("일본어", "https://chukjemoa.co.kr/ja/busy/"),
    ("일본어", "https://chukjemoa.co.kr/ja/daytrip/"),
    ("일본어", "https://chukjemoa.co.kr/ja/closed/"),
    ("일본어", "https://chukjemoa.co.kr/ja/"),
    # 🇰🇷 한국어 — 10월 성수기 축 + 어제 데이터가 바뀐 곳
    ("한국어", "https://chukjemoa.co.kr/jangteo/"),
    ("한국어", "https://chukjemoa.co.kr/2026-11/"),
    ("한국어", "https://chukjemoa.co.kr/maple/"),
    ("한국어", "https://chukjemoa.co.kr/seoul/museum/"),
    ("한국어", "https://chukjemoa.co.kr/seoul/venue/"),
    ("한국어", "https://chukjemoa.co.kr/busan/museum/"),
    ("한국어", "https://chukjemoa.co.kr/"),
]
now = datetime.datetime.now(datetime.timezone.utc)
out = []
for tag, u in URLS:
    try:
        r = sc.urlInspection().index().inspect(body={
            "inspectionUrl": u, "siteUrl": SITE, "languageCode": "ko"}).execute()
        s = r.get("inspectionResult", {}).get("indexStatusResult", {})
        lc = s.get("lastCrawlTime") or ""
        days = None
        if lc:
            try:
                days = (now - datetime.datetime.fromisoformat(lc.replace("Z", "+00:00"))).days
            except Exception:
                pass
        out.append((days if days is not None else 999, tag, u,
                    s.get("verdict", "?"), s.get("coverageState", "?"), lc[:16]))
    except Exception as e:
        out.append((998, tag, u, "조회실패", str(e)[:60], ""))

out.sort(reverse=True)
print(f"{'경과':>4}  {'축':4} {'판정':6} 마지막크롤       페이지")
for d, tag, u, v, cov, lc in out:
    mark = "🔴" if d >= 5 else "🟡" if d >= 3 else "🟢"
    dd = "미크롤" if d >= 998 else f"{d}일"
    print(f"{mark}{dd:>5} {tag} {v:6} {lc:16} {u.replace('https://chukjemoa.co.kr','')}")
    if v != "PASS":
        print(f"        ↳ {cov}")
