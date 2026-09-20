# -*- coding: utf-8 -*-
# 「겨울 축제 2026 — 4.1위·129노출·8클릭(CTR 6%)」 제안을 검증한다.
# ① 그 검색어가 어느 페이지로 걸리나 ② 4위 CTR 6% 가 낮은 건가 ③ 지금 제목에 연도·지역이 이미 있나
import datetime, re, urllib.request
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

def q(s, e, dims, n=500, filters=None):
    body = {"startDate": str(s), "endDate": str(e), "dimensions": dims, "rowLimit": n}
    if filters: body["dimensionFilterGroups"] = [{"filters": filters}]
    return sc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])

end = datetime.date.today() - datetime.timedelta(days=2)
s7 = end - datetime.timedelta(days=6); s28 = end - datetime.timedelta(days=27)
print(f"기간: 최근7일 {s7}~{end} / 최근28일 {s28}~{end}\n")

# ① 겨울 관련 검색어 → 페이지
print("=== '겨울' 들어간 검색어 × 페이지 (28일) ===")
rows = q(s28, end, ["query", "page"], 2000,
         [{"dimension": "query", "operator": "contains", "expression": "겨울"}])
rows.sort(key=lambda r: -r["impressions"])
for r in rows[:15]:
    print(f"  {r['impressions']:>5.0f}노출 {r['clicks']:>3.0f}클릭 CTR {r['ctr']*100:>5.2f}% "
          f"{r['position']:>5.1f}위  {r['keys'][0]:<18} → {r['keys'][1].replace('https://chukjemoa.co.kr','')}")

# ② 같은 사이트 안의 «4위 전후» CTR 기준치 — 6% 가 낮은지 판정하려면 비교군이 필요하다
print("\n=== 이 사이트의 순위대별 CTR (28일, 검색어 단위) ===")
allq = q(s28, end, ["query"], 25000)
for a, b in [(1, 2), (2, 3), (3, 4), (4, 5), (5, 7), (7, 10)]:
    sel = [r for r in allq if a <= r["position"] < b]
    c = sum(r["clicks"] for r in sel); i = sum(r["impressions"] for r in sel)
    print(f"  {a}~{b}위  노출 {i:>6.0f}  클릭 {c:>4.0f}  CTR {(c/i*100 if i else 0):>5.2f}%")

# ③ 지목된 페이지의 지금 제목·설명 (라이브)
tops = {}
for r in rows:
    tops[r["keys"][1]] = tops.get(r["keys"][1], 0) + r["impressions"]
for u, _ in sorted(tops.items(), key=lambda x: -x[1])[:3]:
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 selfcheck"})
        h = urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "replace")
        t = (re.search(r"<title>(.*?)</title>", h, re.S) or [None, "(없음)"])[1]
        d = (re.search(r'<meta name="description" content="(.*?)"', h, re.S) or [None, "(없음)"])[1]
        print(f"\n[라이브 {u.replace('https://chukjemoa.co.kr','')}]\n  title: {t}\n  desc : {d[:170]}")
    except Exception as e:
        print(u, "실패", str(e)[:80])
