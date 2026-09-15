# -*- coding: utf-8 -*-
"""10월 축제 허브를 손대기 «전에» 검색 실측부터. 9월 허브와 무엇이 다른지 숫자로 본다."""
import sys, re
try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception: pass
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

def q(dims, start, end, filters=None, n=2000):
    body = {"startDate": start, "endDate": end, "dimensions": dims, "rowLimit": n}
    if filters: body["dimensionFilterGroups"] = [{"filters": filters}]
    return sc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])

S, E = "2026-08-17", "2026-09-13"   # 최근 28일 (데이터 지연 감안)

print("=== 「월 + 축제」 계열 검색어 (28일) ===")
rows = q(["query"], S, E)
pat = re.compile(r"(9월|10월|11월|구월|시월)")
hits = [r for r in rows if pat.search(r["keys"][0]) and "축제" in r["keys"][0]]
hits.sort(key=lambda r: -r["impressions"])
print("  %-34s %7s %6s %7s %6s" % ("검색어", "노출", "클릭", "CTR", "순위"))
for r in hits[:30]:
    print("  %-34s %7d %6d %6.1f%% %6.1f" % (
        r["keys"][0][:34], r["impressions"], r["clicks"], r["ctr"] * 100, r["position"]))
tot10 = sum(r["impressions"] for r in hits if "10월" in r["keys"][0] or "시월" in r["keys"][0])
tot9 = sum(r["impressions"] for r in hits if "9월" in r["keys"][0] or "구월" in r["keys"][0])
c10 = sum(r["clicks"] for r in hits if "10월" in r["keys"][0] or "시월" in r["keys"][0])
c9 = sum(r["clicks"] for r in hits if "9월" in r["keys"][0] or "구월" in r["keys"][0])
print("\n  10월 계열 합계: 노출 %d · 클릭 %d" % (tot10, c10))
print("  9월  계열 합계: 노출 %d · 클릭 %d" % (tot9, c9))

for path in ["/2026-10/", "/2026-09/", "/2026-11/"]:
    print("\n=== %s 페이지 실적 (28일) ===" % path)
    f = [{"dimension": "page", "operator": "equals", "expression": "https://chukjemoa.co.kr" + path}]
    tot = q(["page"], S, E, f)
    if tot:
        r = tot[0]
        print("  노출 %d · 클릭 %d · CTR %.1f%% · 평균순위 %.1f" % (
            r["impressions"], r["clicks"], r["ctr"] * 100, r["position"]))
    else:
        print("  (데이터 없음)")
    kw = q(["query"], S, E, f, 30)
    kw.sort(key=lambda r: -r["impressions"])
    for r in kw[:10]:
        print("     %-30s 노출 %4d 클릭 %3d 순위 %.1f" % (
            r["keys"][0][:30], r["impressions"], r["clicks"], r["position"]))

print("\n=== 주차별 10월 계열 추이 (8주) ===")
import datetime
for w in range(7, -1, -1):
    e = datetime.date(2026, 9, 13) - datetime.timedelta(days=7 * w)
    s = e - datetime.timedelta(days=6)
    rr = q(["query"], s.isoformat(), e.isoformat())
    i10 = sum(r["impressions"] for r in rr if "10월" in r["keys"][0] and "축제" in r["keys"][0])
    i9 = sum(r["impressions"] for r in rr if "9월" in r["keys"][0] and "축제" in r["keys"][0])
    print("  %s~%s   10월 %5d   9월 %5d" % (s, e, i10, i9))
