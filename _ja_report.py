# -*- coding: utf-8 -*-
"""2026-09-16 — 어제(9/15) 일본어 작업 보고용 실측.
   1) 색인 요청 4건 + 진입로의 크롤 상태 (9/15 출발선과 비교)
   2) GA4 /ja/ 접속 — 어제 vs 그제 vs 지난 7일
   3) GSC /ja/ 노출·클릭 (최근 2일은 덜 찬다 — 그렇게 적는다)
"""
import io, time, datetime, collections
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
PROP = "properties/545108776"
OUT = []
def p(s=""): OUT.append(s)

# ── 1) 크롤 상태
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)
BASE = {  # 9/15 출발선
    "/ja/busy/": ("URL이 구글에 알려지지 않음", "없음"),
    "/ja/palace/": ("발견됨-미색인", "없음"),
    "/ja/daytrip/": ("발견됨-미색인", "없음"),
    "/ja/places/": ("발견됨-미색인", "없음"),
    "/ja/": ("색인됨", "2026-08-28"),
    "/ja/closed/": ("색인됨", "2026-09-06"),
    "/ja/mountains/": ("색인됨", "2026-09-13"),
    "/ja/access/": ("색인됨", "2026-09-11"),
    "/ja/calendar/": ("색인됨", "2026-09-04"),
    "/ja/jangteo/": ("색인됨", "2026-09-04"),
}
p("=== 1) 크롤·색인 상태 (9/15 → 오늘) ===")
for u in BASE:
    try:
        r = sc.urlInspection().index().inspect(body={
            "inspectionUrl": "https://chukjemoa.co.kr" + u,
            "siteUrl": SITE, "languageCode": "ko"}).execute()
        s = r.get("inspectionResult", {}).get("indexStatusResult", {})
        cov = s.get("coverageState", "?")
        crawl = (s.get("lastCrawlTime") or "없음")[:10]
        refs = s.get("referringUrls") or []
        was_cov, was_crawl = BASE[u]
        chg = "→ 변화" if crawl != was_crawl else "   그대로"
        p("%-16s %s  크롤 %s (전 %s)  참조원 %d  | %s" % (u, chg, crawl, was_crawl, len(refs), cov[:30]))
        for rf in refs[:4]:
            p("                 ↳ 참조원: " + rf)
    except Exception as e:
        p("%-16s ERR %s" % (u, str(e)[:80]))
    time.sleep(0.6)

# ── 2) GA4
p("")
p("=== 2) GA4 — /ja/ 접속 ===")
try:
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import (RunReportRequest, DateRange,
        Dimension, Metric, Filter, FilterExpression)
    gcred = service_account.Credentials.from_service_account_file(
        KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
    cl = BetaAnalyticsDataClient(credentials=gcred)
    ja_filter = FilterExpression(filter=Filter(
        field_name="pagePath",
        string_filter=Filter.StringFilter(match_type=Filter.StringFilter.MatchType.BEGINS_WITH, value="/ja/")))

    def rep(dims, mets, s, e, n=30, filt=None):
        r = cl.run_report(RunReportRequest(property=PROP,
            date_ranges=[DateRange(start_date=s, end_date=e)],
            dimensions=[Dimension(name=d) for d in dims],
            metrics=[Metric(name=m) for m in mets],
            dimension_filter=filt, limit=n))
        return [([d.value for d in x.dimension_values],
                 [m.value for m in x.metric_values]) for x in r.rows]

    p("-- 일자별 /ja/ 페이지뷰·사용자 (최근 8일)")
    for d, m in sorted(rep(["date"], ["screenPageViews", "activeUsers", "sessions"],
                           "8daysAgo", "today", 30, ja_filter)):
        p("   %s  PV %-5s 사용자 %-4s 세션 %s" % (d[0], m[0], m[1], m[2]))

    p("-- 어제(9/15) /ja/ 페이지별")
    rows = rep(["pagePath"], ["screenPageViews", "activeUsers"], "2026-09-15", "2026-09-15", 40, ja_filter)
    if not rows: p("   (없음)")
    for d, m in sorted(rows, key=lambda x: -int(x[1][0])):
        p("   %-34s PV %-4s 사용자 %s" % (d[0], m[0], m[1]))

    p("-- 어제(9/15) 사이트 전체 (비교용)")
    for d, m in rep([], ["screenPageViews", "activeUsers", "sessions"], "2026-09-15", "2026-09-15"):
        p("   전체 PV %s · 사용자 %s · 세션 %s" % (m[0], m[1], m[2]))

    p("-- 최근 7일 /ja/ 유입 경로")
    for d, m in rep(["sessionDefaultChannelGroup"], ["sessions"], "7daysAgo", "today", 15, ja_filter):
        p("   %-22s 세션 %s" % (d[0], m[0]))
except Exception as e:
    p("GA4 ERR: " + str(e)[:300])

# ── 3) GSC 실적
p("")
p("=== 3) GSC — /ja/ 노출·클릭 (최근 2일은 덜 찬다) ===")
try:
    end = datetime.date.today() - datetime.timedelta(days=1)
    start = end - datetime.timedelta(days=13)
    p("기간 %s ~ %s" % (start, end))
    body = {"startDate": str(start), "endDate": str(end),
            "dimensions": ["page"], "rowLimit": 200}
    rows = sc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])
    ja = [r for r in rows if "/ja/" in r["keys"][0]]
    if not ja:
        p("   /ja/ 경로 노출 0건")
    tot_c = tot_i = 0
    for r in sorted(ja, key=lambda x: -x["impressions"])[:20]:
        tot_c += r["clicks"]; tot_i += r["impressions"]
        p("   %-46s 노출 %-5d 클릭 %-3d 순위 %.1f" % (
            r["keys"][0].replace("https://chukjemoa.co.kr", ""), r["impressions"], r["clicks"], r["position"]))
    p("   ─ /ja/ 합계(상위20): 노출 %d · 클릭 %d" % (tot_i, tot_c))

    p("-- 일자별 /ja/ 노출")
    body2 = {"startDate": str(start), "endDate": str(end),
             "dimensions": ["date", "page"], "rowLimit": 2000}
    r2 = sc.searchanalytics().query(siteUrl=SITE, body=body2).execute().get("rows", [])
    byd = collections.defaultdict(lambda: [0, 0])
    for r in r2:
        if "/ja/" in r["keys"][1]:
            byd[r["keys"][0]][0] += r["impressions"]; byd[r["keys"][0]][1] += r["clicks"]
    for d in sorted(byd):
        p("   %s  노출 %-5d 클릭 %d" % (d, byd[d][0], byd[d][1]))
except Exception as e:
    p("GSC ERR: " + str(e)[:300])

io.open(r"C:\dev\chukjemoa\_ja_report.txt", "w", encoding="utf-8").write("\n".join(OUT))
print("done")
