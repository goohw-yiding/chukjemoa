# -*- coding: utf-8 -*-
# 클릭 리포트 — 앵커 중복을 걷어낸 «진짜» 숫자.
#
# ⚠️ 왜 이 도구가 따로 필요한가 (2026-09-09)
#   build.js 가 h2 5개 이상인 페이지에 JS로 자동 목차를 심는다(id=sec1..secN).
#   구글이 그걸 렌더해 「이 페이지 안의 섹션」 점프링크로 보여 주는데,
#   서치콘솔은 그걸 **URL 하나하나로 따로 센다.** 같은 검색어·같은 순위가 5줄이 된다.
#   그대로 보면 노출이 부풀고 CTR이 반토막 난다. 앵커를 접어서 봐야 진짜 값이다.
#   ⛔ 그렇다고 자동 목차를 지우면 안 된다 — 점프링크는 SERP에서 자리를 «더» 먹는다.
import datetime, collections
from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = r"C:\dev\traffic-dashboard\sa-key.json"
SITE = "https://chukjemoa.co.kr/"
cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/webmasters"])
sc = build("searchconsole", "v1", credentials=cred, cache_discovery=False)

end = datetime.date.today() - datetime.timedelta(days=2)
start = end - datetime.timedelta(days=27)
rows = sc.searchanalytics().query(siteUrl=SITE, body={
    "startDate": str(start), "endDate": str(end),
    "dimensions": ["page", "query"], "rowLimit": 25000}).execute().get("rows", [])
print("기간 %s ~ %s · 원본 %d행" % (start, end, len(rows)))

# ── 앵커 접기: (본문URL, 검색어) 로 묶고 노출은 «최댓값»을 쓴다.
#    합이 아니라 최댓값인 이유 — 같은 결과 하나가 여러 줄로 나온 것이라서.
fold = {}
for r in rows:
    u = r["keys"][0].split("#")[0]
    k = (u, r["keys"][1])
    a = fold.setdefault(k, {"clicks": 0, "imp": 0, "pos": r["position"]})
    a["clicks"] += r["clicks"]
    a["imp"] = max(a["imp"], r["impressions"])
    a["pos"] = min(a["pos"], r["position"])

raw_i = sum(r["impressions"] for r in rows)
raw_c = sum(r["clicks"] for r in rows)
tru_i = sum(v["imp"] for v in fold.values())
tru_c = sum(v["clicks"] for v in fold.values())
print("\n[앵커 포함 — 서치콘솔이 그냥 보여 주는 값]")
print("   노출 %6d · 클릭 %4d · CTR %.2f%%" % (raw_i, raw_c, raw_c / raw_i * 100))
print("[앵커 접은 뒤 — 진짜 값]")
print("   노출 %6d · 클릭 %4d · CTR %.2f%%   (노출 %d 이 허수였다)" % (
    tru_i, tru_c, tru_c / tru_i * 100, raw_i - tru_i))

# ── 검색어 단위로 다시 묶어 순위 구간
byq = collections.defaultdict(lambda: {"clicks": 0, "imp": 0, "pos": 999})
for (u, q), v in fold.items():
    a = byq[q]
    a["clicks"] += v["clicks"]; a["imp"] += v["imp"]; a["pos"] = min(a["pos"], v["pos"])

BANDS = [(1, 3), (4, 10), (11, 20), (21, 200)]
print("\n[순위 구간별 — 검색어 %d개, 앵커 접은 값]" % len(byq))
print("  구간      검색어    노출     클릭    CTR")
for b in BANDS:
    sel = [v for v in byq.values() if b[0] <= v["pos"] <= b[1]]
    i = sum(v["imp"] for v in sel); c = sum(v["clicks"] for v in sel)
    print("  %3d~%-4d  %6d  %7d  %6d  %5.2f%%" % (b[0], b[1], len(sel), i, c, (c / i * 100) if i else 0))

# ── 개별 축제 페이지만 — 여기가 「즉답형이 아닌」 진짜 수요다
print("\n[개별 축제 페이지 · 10위 안 · 클릭 0 — 노출 큰 순]")
cand = []
for (u, q), v in fold.items():
    if "/festival/" in u and "/en/" not in u and "/ja/" not in u \
       and v["pos"] <= 10 and v["clicks"] == 0 and v["imp"] >= 15:
        cand.append((v["imp"], v["pos"], q, u.replace("https://chukjemoa.co.kr", "")))
cand.sort(reverse=True)
for imp, pos, q, u in cand[:25]:
    print("  %-26s 노출%5d 순위%5.1f  %s" % (q[:26], imp, pos, u[:44]))
print("  → 후보 %d건 · 노출 합 %d" % (len(cand), sum(c[0] for c in cand)))
