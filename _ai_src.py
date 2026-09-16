# -*- coding: utf-8 -*-
"""AI 유입은 실제로 얼마나 오나 — 전체 / 그리고 일본에서. 90일·180일 둘 다 본다."""
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
JP = FilterExpression(filter=Filter(field_name="country",
    string_filter=Filter.StringFilter(value="Japan")))
AI = re.compile(r"(chatgpt|openai|perplexity|gemini|copilot|claude|bard|you\.com|felo|genspark|edgeservices)", re.I)
OUT = []
def p(s=""): OUT.append(s)

def rep(dims, mets, s, e, n=200, filt=None):
    r = cl.run_report(RunReportRequest(property=PROP,
        date_ranges=[DateRange(start_date=s, end_date=e)],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets], dimension_filter=filt, limit=n))
    return [([d.value for d in x.dimension_values], [m.value for m in x.metric_values]) for x in r.rows]

for label, days in [("최근 90일", "90daysAgo"), ("최근 180일", "180daysAgo")]:
    rows = rep(["sessionSource", "sessionMedium"], ["sessions"], days, "today")
    tot = sum(int(m[0]) for _, m in rows)
    ai = [(d, m) for d, m in rows if AI.search(d[0]) or AI.search(d[1])]
    aitot = sum(int(m[0]) for _, m in ai)
    p("=== 전체 %s — 총 세션 %d · 그중 AI %d (%.2f%%)" % (label, tot, aitot, aitot / tot * 100 if tot else 0))
    for d, m in sorted(ai, key=lambda x: -int(x[1][0])):
        p("   %-30s / %-14s 세션 %s" % (d[0][:30], d[1][:14], m[0]))
    p("")

rows = rep(["sessionSource", "sessionMedium"], ["sessions"], "180daysAgo", "today", 200, JP)
tot = sum(int(m[0]) for _, m in rows)
ai = [(d, m) for d, m in rows if AI.search(d[0]) or AI.search(d[1])]
p("=== 일본 최근 180일 — 총 세션 %d · 그중 AI %d" % (tot, sum(int(m[0]) for _, m in ai)))
for d, m in sorted(rows, key=lambda x: -int(x[1][0])):
    mark = "🤖" if (AI.search(d[0]) or AI.search(d[1])) else "  "
    p("   %s %-30s / %-14s 세션 %s" % (mark, d[0][:30], d[1][:14], m[0]))

io.open(r"C:\dev\chukjemoa\_ai_src.txt", "w", encoding="utf-8").write("\n".join(OUT))
print("done")
