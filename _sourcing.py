# -*- coding: utf-8 -*-
# 🏭 소싱 후보 리포트 — 「많이 눌리고 잘 팔리면 우리가 만들 수 있나」에 답하기 위한 계기판.
#
# 생각의 뼈대
#   · 자사(own) 클릭은 소싱 신호가 «아니다». 이미 우리가 파는 물건이다.
#   · 제휴(coupang) 클릭이 소싱 신호다 — 「우리 방문자가 원했는데 우리가 안 만드는 것」에 던진 표다.
#   · 전환은 GA4가 모른다. 쿠팡 파트너스 실적 리포트를 내려받아 «상품번호»로 붙여야 안다.
#     그래서 build.js 의 제휴 항목에 pid(쿠팡 상품번호)를 적어 둬야 한다. 단축링크엔 번호가 없다.
#
# 쓰는 법
#   py -3 _cpdump.js  아님 → node _cpdump.js   (상품표 갱신)
#   py -3 _sourcing.py                          (리포트)
#   쿠팡 실적: partners.coupang.com → 리포트 > 실적 리포트 > 다운로드 →
#             data/coupang_report.csv 로 저장하면 자동으로 붙는다.
import sys, os, json, csv, io, re
try: sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception: pass
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest, DateRange, Dimension, Metric, Filter, FilterExpression)

R = r"C:\dev\chukjemoa"
KEY = r"C:\dev\traffic-dashboard\sa-key.json"
PROP = "properties/545108776"

# ── 문턱. 숫자를 눈에 보이게 둔다 — 감으로 「많이 눌렸네」 하지 않기 위해서다.
CLICK_RANK  = 30    # 이만큼은 모여야 «순위»를 말할 수 있다
CLICK_DECID = 100   # 이만큼은 모여야 «전환율»을 말할 수 있다
ORDER_DECID = 3     # 주문이 이보다 적으면 전환율은 우연이다

cred = service_account.Credentials.from_service_account_file(
    KEY, scopes=["https://www.googleapis.com/auth/analytics.readonly"])
cl = BetaAnalyticsDataClient(credentials=cred)

def ga(dims, mets, start, end="today", n=300, ev=None):
    kw = {}
    if ev:
        kw["dimension_filter"] = FilterExpression(filter=Filter(
            field_name="eventName", string_filter=Filter.StringFilter(value=ev)))
    r = cl.run_report(RunReportRequest(property=PROP,
        date_ranges=[DateRange(start_date=start, end_date=end)],
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets], limit=n, **kw))
    return [([d.value for d in x.dimension_values],
             [m.value for m in x.metric_values]) for x in r.rows]

# ── 상품표
mp_path = os.path.join(R, "data", "coupang_map.json")
if not os.path.exists(mp_path):
    print("data/coupang_map.json 이 없습니다. 먼저 `node _cpdump.js` 를 돌리세요."); sys.exit(1)
MP = json.load(open(mp_path, encoding="utf-8"))["items"]

# ── 클릭 (28일 / 90일)
def clicks(days):
    d = {}
    for dv, m in ga(["customEvent:item", "customEvent:merchant"], ["eventCount"],
                    "%ddaysAgo" % days, ev="shop_click"):
        d[(dv[0], dv[1])] = d.get((dv[0], dv[1]), 0) + int(m[0])
    return d
C28, C90 = clicks(28), clicks(90)
def sum_by(d, mer=None):
    o = {}
    for (it, mm), n in d.items():
        if mer and mm != mer: continue
        o[it] = o.get(it, 0) + n
    return o

print("=" * 74)
print(" 소싱 후보 리포트")
print("=" * 74)

tot28, tot90 = sum(C28.values()), sum(C90.values())
aff28, aff90 = sum(sum_by(C28, "coupang").values()), sum(sum_by(C90, "coupang").values())
print("\n① 표가 몇 장이나 모였나")
print("   전체 구매박스 클릭   28일 %4d  ·  90일 %4d" % (tot28, tot90))
print("   그중 제휴(=소싱 표)  28일 %4d  ·  90일 %4d" % (aff28, aff90))
if aff90 < CLICK_RANK:
    print("   ⚠️ 제휴 클릭이 90일 %d건뿐입니다. 지금 데이터로는 «어떤 상품을 소싱할지» 말할 수 없습니다." % aff90)
    print("      소싱 판단이 아니라, 먼저 클릭을 모으는 단계입니다.")

# ── 소싱 투표함
print("\n② 소싱 투표함 — 제휴 상품에 눌린 클릭 (우리가 «안 만드는» 것에 던진 표)")
a90 = sum_by(C90, "coupang"); a28 = sum_by(C28, "coupang")
rows = sorted(a90.items(), key=lambda x: -x[1])
if not rows:
    print("   (아직 없음)")
else:
    print("   %-16s %-26s %6s %6s  %s" % ("키", "상품", "90일", "28일", "상태"))
    for k, n in rows:
        it = MP.get(k, {})
        pid = it.get("pid", "")
        st = "소싱 검토 가능" if n >= CLICK_DECID else ("표 모으는 중" if n >= CLICK_RANK else "표 부족")
        if not pid: st += " · 상품번호 없음(전환 못 맞춤)"
        print("   %-16s %-26s %6d %6d  %s" % (k, (it.get("name") or "?")[:26], n, a28.get(k, 0), st))

# ── 자사 클릭 (참고 — 소싱 신호가 아니라 «이미 맞춘 것»)
print("\n③ 참고 — 자사 상품 클릭 (이미 파는 것이라 소싱 신호가 아님)")
o90 = sum_by(C90, "own")
for k, n in sorted(o90.items(), key=lambda x: -x[1])[:8]:
    print("   %-16s %-26s %6d" % (k, (MP.get(k, {}).get("name") or "?")[:26], n))

# ── 전환 (쿠팡 리포트가 있으면 붙인다)
print("\n④ 전환 — 쿠팡 파트너스 실적")
rep = os.path.join(R, "data", "coupang_report.csv")
if not os.path.exists(rep):
    print("   data/coupang_report.csv 가 없습니다.")
    print("   partners.coupang.com → 리포트 > 실적 리포트 > 다운로드 → 그 파일을 이 이름으로 저장하세요.")
    print("   ⚠️ 조인 키는 «쿠팡 상품번호»입니다. build.js 제휴 항목에 pid 를 적어 둬야 붙습니다.")
else:
    raw = open(rep, encoding="utf-8-sig", errors="replace").read()
    rd = list(csv.DictReader(io.StringIO(raw)))
    print("   행 %d개 · 열: %s" % (len(rd), ", ".join((rd[0].keys() if rd else []))))
    def pick(row, *names):
        for n in names:
            for k2 in row:
                if n in k2: return row[k2]
        return ""
    by_pid = {}
    for row in rd:
        pid = re.sub(r"\D", "", str(pick(row, "상품번호", "상품 번호", "productId", "페이지 키", "페이지키")))
        if not pid: continue
        def num(*n):
            v = re.sub(r"[^\d.-]", "", str(pick(row, *n)) or "0")
            try: return float(v or 0)
            except Exception: return 0.0
        d = by_pid.setdefault(pid, {"click": 0.0, "order": 0.0, "rev": 0.0})
        d["click"] += num("클릭")
        d["order"] += num("주문", "구매")
        d["rev"]   += num("수익", "커미션", "적립")
    pid2key = {v.get("pid"): k for k, v in MP.items() if v.get("pid")}
    print("   %-16s %8s %8s %8s %9s  %s" % ("키", "사이트클릭", "쿠팡클릭", "주문", "수익", "판정"))
    for k, n in rows:
        pid = MP.get(k, {}).get("pid", "")
        d = by_pid.get(pid)
        if not d:
            print("   %-16s %8d %8s %8s %9s  상품번호 미기재" % (k, a90.get(k, 0), "-", "-", "-")); continue
        cvr = (d["order"] / d["click"] * 100) if d["click"] else 0
        if n >= CLICK_DECID and d["order"] >= ORDER_DECID:
            v = "🟢 소싱 검토 (전환 %.1f%%)" % cvr
        elif n >= CLICK_RANK:
            v = "🟡 표 모으는 중"
        else:
            v = "⬜ 표 부족"
        print("   %-16s %8d %8.0f %8.0f %9.0f  %s" % (k, a90.get(k, 0), d["click"], d["order"], d["rev"], v))

# ── 언제쯤 판단할 수 있나
print("\n⑤ 언제쯤 판단할 수 있나 — 지금 속도 기준")
for k, n in rows[:6]:
    per_day = a90.get(k, 0) / 90.0
    if per_day <= 0: continue
    need = max(0, CLICK_DECID - a90.get(k, 0))
    print("   %-16s 하루 %.2f클릭 → %d클릭까지 %s" % (
        k, per_day, CLICK_DECID,
        ("이미 도달" if need == 0 else "{:,}일".format(int(need / per_day)))))
print("\n   ※ 이 숫자가 길게 나온다면 답은 «상품을 더 붙이자»가 아니라 «클릭률을 올리자»입니다.")
print("     구매박스 자리·문구가 먼저입니다. 상품 개수는 그다음입니다.")
