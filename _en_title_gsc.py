# -*- coding: utf-8 -*-
# 영문 축제 상세의 «실제 유입 검색어»를 뽑아, 제목에 넣을 말을 데이터로 정한다.
import datetime, collections, re, json
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

end = datetime.date.today() - datetime.timedelta(days=2)
start = end - datetime.timedelta(days=89)

def q(dims, n=25000, filters=None):
    body = {"startDate": str(start), "endDate": str(end),
            "dimensions": dims, "rowLimit": n}
    if filters:
        body["dimensionFilterGroups"] = [{"filters": filters}]
    return sc.searchanalytics().query(siteUrl=SITE, body=body).execute().get("rows", [])

FEST = [{"dimension": "page", "operator": "contains", "expression": "/en/festival/"}]

print("== 기간 %s ~ %s (90일) ==" % (start, end))

# 1) /en/festival/ 전체 합계
for r in q([], filters=FEST):
    print("EN-FESTIVAL 합계  clicks=%d imp=%d ctr=%.2f%% pos=%.1f" %
          (r["clicks"], r["impressions"], r["ctr"]*100, r["position"]))

# 2) 검색어별
rows = q(["query"], filters=FEST)
print("\n-- 검색어 %d개 --" % len(rows))
for r in sorted(rows, key=lambda x: -x["impressions"])[:40]:
    print("%6d imp %3d clk %5.1f위  %s" %
          (r["impressions"], r["clicks"], r["position"], r["keys"][0]))

# 3) 검색어 «형태» 집계 — 제목에 뭘 넣을지의 근거
YEAR = re.compile(r"\b20\d\d\b")
MONTH = re.compile(r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)", re.I)
DATEW = re.compile(r"\b(date|dates|when|schedule|202\d)\b", re.I)
NEAR = re.compile(r"near me", re.I)
buckets = collections.Counter(); clicks = collections.Counter()
for r in rows:
    k = r["keys"][0]
    tags = []
    if YEAR.search(k): tags.append("연도포함")
    if MONTH.search(k): tags.append("월이름포함")
    if DATEW.search(k): tags.append("날짜의도(date/when/schedule)")
    if NEAR.search(k): tags.append("near me")
    if not tags: tags = ["기타(고유명 등)"]
    for t in tags:
        buckets[t] += r["impressions"]; clicks[t] += r["clicks"]
print("\n-- 검색어 형태별 노출/클릭 --")
tot = sum(r["impressions"] for r in rows)
for t, v in buckets.most_common():
    print("%7d imp (%4.1f%%)  %3d clk   %s" % (v, v*100.0/max(tot,1), clicks[t], t))

# 4) near me 를 뺀 CTR
ni = sum(r["impressions"] for r in rows if not NEAR.search(r["keys"][0]))
nc = sum(r["clicks"] for r in rows if not NEAR.search(r["keys"][0]))
print("\nnear me 제외:  imp=%d clk=%d ctr=%.2f%%" % (ni, nc, nc*100.0/max(ni,1)))

# 5) 페이지별 상위 (노출 순) — 어떤 축제가 실제로 걸리나
prows = q(["page"], filters=FEST)
print("\n-- 노출 상위 축제 페이지 20 --")
for r in sorted(prows, key=lambda x: -x["impressions"])[:20]:
    print("%5d imp %3d clk %5.1f위  %s" %
          (r["impressions"], r["clicks"], r["position"], r["keys"][0].replace(SITE, "/")))

json.dump({"queries": rows, "pages": prows}, open("_en_title_gsc.json", "w", encoding="utf-8"), ensure_ascii=False)
print("\n저장: _en_title_gsc.json")
