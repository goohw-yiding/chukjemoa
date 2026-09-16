# -*- coding: utf-8 -*-
"""마케팅 방향을 잡기 전에: «어디서 오고, 어디가 돈이 되나»를 실측한다.
   축제모아의 수익 경로 = shop_click(코리/쿠팡/자사몰). 그걸 언어·나라별로 가른다."""
import io, re
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (RunReportRequest, DateRange,
    Dimension, Metric, Filter, FilterExpression)
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
PROP = "properties/545108776"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
cl = BetaAnalyticsDataClient(credentials=cred)
OUT = []
def p(s=""): OUT.append(s)

def rep(dims, mets, s="90daysAgo", e="today", n=100, filt=None):
    r = cl.run_report(RunReportRequest(property=PROP,
        date_ranges=[DateRange(start_date=s, end_date=e)],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets], dimension_filter=filt, limit=n))
    return [([d.value for d in x.dimension_values], [m.value for m in x.metric_values]) for x in r.rows]

p("=== 1) 나라별 세션 (90일) — 어디서 오나")
rows = rep(["country"], ["sessions", "activeUsers"], n=20)
tot = sum(int(m[0]) for _, m in rows)
for d, m in rows[:10]:
    p("   %-18s 세션 %-6s (%.1f%%)" % (d[0], m[0], int(m[0]) / tot * 100))
p("   ─ 합계 %d" % tot)

p("")
p("=== 2) 언어 섹션별 페이지뷰 — 어느 언어를 실제로 읽나")
rows = rep(["pagePath"], ["screenPageViews"], n=2000)
sec = {}
for d, m in rows:
    path = d[0]
    key = "ko(한국어)"
    mm = re.match(r"^/(en|ja|zh|tw|es)/", path)
    if mm: key = mm.group(1)
    sec[key] = sec.get(key, 0) + int(m[0])
tot_pv = sum(sec.values())
for k, v in sorted(sec.items(), key=lambda x: -x[1]):
    p("   %-12s PV %-7d (%.2f%%)" % (k, v, v / tot_pv * 100))

p("")
p("=== 3) 수익 이벤트 shop_click — 나라별")
SC = FilterExpression(filter=Filter(field_name="eventName",
    string_filter=Filter.StringFilter(value="shop_click")))
rows = rep(["country"], ["eventCount"], n=30, filt=SC)
if not rows: p("   (shop_click 0건)")
tot_sc = sum(int(m[0]) for _, m in rows)
for d, m in rows[:12]:
    p("   %-18s %s건" % (d[0], m[0]))
p("   ─ 합계 %d건" % tot_sc)

p("")
p("=== 4) shop_click — 게재면(place)별")
rows = rep(["customEvent:place"], ["eventCount"], n=30, filt=SC)
for d, m in rows[:15]:
    p("   %-24s %s건" % (d[0][:24], m[0]))

p("")
p("=== 5) 일본 세션의 «질» — 참여도 비교")
for label, filt in [("일본", FilterExpression(filter=Filter(field_name="country",
        string_filter=Filter.StringFilter(value="Japan")))),
        ("전체", None)]:
    r = rep([], ["sessions", "screenPageViews", "averageSessionDuration", "engagementRate"], filt=filt)
    if r:
        m = r[0][1]
        p("   %-6s 세션 %-6s PV %-7s 평균체류 %.0f초 참여율 %.1f%%" % (
            label, m[0], m[1], float(m[2]), float(m[3]) * 100))

io.open(r"C:\dev\chukjemoa\_pnl.txt", "w", encoding="utf-8").write("\n".join(OUT))
print("done")
