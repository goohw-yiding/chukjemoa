# -*- coding: utf-8 -*-
"""9/15 이전 생성 + 구글90일·네이버28일 0 → 마지막으로 GA4 90일 «모든 유입» 확인 → data/prune_noindex.json"""
import csv, subprocess, sys, json
sys.stdout.reconfigure(encoding="utf-8")
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric
rows = list(csv.reader(open("_g_prune_list.csv", encoding="utf-8-sig")))[1:]
cand = []
for g, p, t, L in rows:
    d = subprocess.run(["git", "log", "--diff-filter=A", "--format=%cs", "--", p.strip("/") + "/index.html"], capture_output=True, text=True).stdout.split()
    if d and d[-1] <= "2026-09-15": cand.append((p, t, d[-1]))
ga = BetaAnalyticsDataClient(credentials=service_account.Credentials.from_service_account_file(r"C:\dev\traffic-dashboard\sa-key.json", scopes=["https://www.googleapis.com/auth/analytics.readonly"]))
r = ga.run_report(RunReportRequest(property="properties/545108776", date_ranges=[DateRange(start_date="90daysAgo", end_date="yesterday")],
    dimensions=[Dimension(name="landingPage"), Dimension(name="sessionDefaultChannelGroup")], metrics=[Metric(name="sessions")], limit=50000)).rows
s = {}
for x in r:
    k = x.dimension_values[0].value.rstrip("/") + "/"
    s.setdefault(k, {})[x.dimension_values[1].value] = int(x.metric_values[0].value)
keep, prune = [], []
for p, t, d in cand:
    ch = s.get(p, {})
    org = sum(v for k, v in ch.items() if k in ("Organic Search", "Referral", "Organic Social"))
    (keep if org >= 3 else prune).append((p, t, d, ch))
print("후보", len(cand), "| 정리", len(prune), "| 보류(90일 검색·추천 유입 3회 이상)", len(keep))
for p, t, d, ch in keep: print("  보류", p, ch)
for p, t, d, ch in prune: print("  정리", p, d, ch)
json.dump({"_note": "2026-11-03 구글 회복안 1차 정리 — 9/15 이전 생성 · 구글 90일 노출 0 · 네이버 28일 0 · GA4 90일 검색·추천 유입 3회 미만. 되돌리려면 paths 를 비운다.", "paths": [p for p, *_ in prune]},
          open("data/prune_noindex.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
