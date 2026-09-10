# -*- coding: utf-8 -*-
# 축제 「지금 뜨는 정도」 — 네이버 데이터랩 검색어트렌드 → data/fest_trend.json
#
# 왜: 검색광고 API의 월 검색량은 «연평균»이라 계절을 못 탄다.
#     무주반딧불축제는 3월에도 214,200으로 잡혀서 1년 내내 1등이 된다.
#     장남 님 지적 — 「최근 1주일 검색량으로 바꿔야 사람들이 보고 오지, 매일 순위가 조정돼야 한다」.
#
# 🔑 핵심: 데이터랩 ratio 는 «호출 안에서» 최대값이 100이 되도록 정규화된다.
#    그래서 호출끼리 절대 비교는 못 한다. 하지만 «같은 축제의 최근7일 ÷ 자기 60일 평균»은
#    같은 계열을 자기끼리 나누는 것이라 정규화가 «상쇄»된다 → 앵커 키워드가 필요 없다.
#
# 최종 점수는 build.js 에서: 월검색량(절대 크기) × 이 배수(지금 뜨는 정도)
import json, os, re, sys, time, datetime, urllib.request

BASE = r"C:\dev\chukjemoa"
BUDGET = float(sys.argv[1]) if len(sys.argv) > 1 else 900.0
T0 = time.time()

src = open(r"C:\dev\_datalab.py", encoding="utf-8").read()
CID = re.search(r'CID\s*=\s*"([^"]+)"', src).group(1)
CSEC = re.search(r'CSEC\s*=\s*"([^"]+)"', src).group(1)
URL = "https://openapi.naver.com/v1/datalab/search"

END = datetime.date.today() - datetime.timedelta(days=1)
START = END - datetime.timedelta(days=59)

def call(groups):
    body = {"startDate": str(START), "endDate": str(END), "timeUnit": "date",
            "keywordGroups": [{"groupName": g, "keywords": [g]} for g in groups]}
    req = urllib.request.Request(URL, data=json.dumps(body).encode("utf-8"),
        headers={"X-Naver-Client-Id": CID, "X-Naver-Client-Secret": CSEC,
                 "Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read().decode("utf-8"))

# ── 대상: «아직 안 끝난» 축제만. 끝난 것은 카드에 안 나오니 호출을 아낀다.
TODAY = str(datetime.date.today())
def dash(s):
    s = str(s or "")
    return re.sub(r"^(\d{4})(\d{2})(\d{2})$", r"\1-\2-\3", s)

cur = json.load(open(os.path.join(BASE, "fest.json"), encoding="utf-8"))
api = json.load(open(os.path.join(BASE, "data", "festivals_api.json"), encoding="utf-8"))
if isinstance(api, dict):
    api = api.get("items") or list(api.values())

names = {}
for f in cur:
    if dash(f.get("e")) >= TODAY:
        n = (f.get("n") or "").strip()
        if n: names[n] = 1
for f in api:
    if dash(f.get("end")) >= TODAY:
        n = (f.get("title") or "").strip()
        if n: names[n] = 1

def kw_of(n):
    s = re.sub(r"[\(\[（【][^\)\]）】]*[\)\]）】]", " ", n)
    s = re.sub(r"20\d\d\s*년?", " ", s)
    s = re.sub(r"제\s*\d+\s*회", " ", s)
    s = re.sub(r"[^0-9A-Za-z가-힣]", "", s)
    return s

kws = sorted({kw_of(n) for n in names if len(kw_of(n)) >= 2})
print("미종료 축제 %d개 · 고유 검색어 %d개" % (len(names), len(kws)), flush=True)

OUT = os.path.join(BASE, "data", "fest_trend.json")
prev = {}
if os.path.exists(OUT):
    try:
        old = json.load(open(OUT, encoding="utf-8"))
        if old.get("date") == str(END):        # 오늘 것이 이미 있으면 이어받는다
            prev = old.get("kw") or {}
    except Exception:
        pass
todo = [k for k in kws if k not in prev]
print("남은 %d개 (이미 받은 것 %d)" % (len(todo), len(prev)), flush=True)

res = dict(prev)
def save():
    json.dump({"date": str(END), "start": str(START), "kw": res},
              open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=0)

avg = lambda a: (sum(a) / len(a)) if a else 0.0
err = 0
for i in range(0, len(todo), 5):
    if time.time() - T0 > BUDGET:
        print("시간 예산 소진 — 여기까지 저장", flush=True); break
    part = todo[i:i + 5]
    try:
        r = call(part)
    except Exception as e:
        err += 1
        msg = str(e)[:70]
        print("  !! %s %s" % (part[0], msg), flush=True)
        # 429(호출 한도)면 더 해봐야 소용없다 — 멈추고 받은 것만 저장한다
        if "429" in msg or "Rate" in msg:
            print("  호출 한도로 중단", flush=True); break
        time.sleep(1.0); continue
    got = set()
    for g in r.get("results", []):
        d = {x["period"]: x["ratio"] for x in g.get("data", [])}
        days = sorted(d)
        if not days:
            res[g["title"]] = {"t": None, "n": 0}; got.add(g["title"]); continue
        last7 = [d[p] for p in days[-7:]]
        base = avg([d[p] for p in days])
        # 60일 내내 0이면 «검색이 거의 없는 축제» — 배수를 만들지 않는다(1.0 취급은 build.js에서)
        t = round(avg(last7) / base, 3) if base > 0 else None
        res[g["title"]] = {"t": t, "n": len(days), "r7": round(avg(last7), 2)}
        got.add(g["title"])
    for k in part:
        if k not in got: res[k] = {"t": None, "n": 0}
    if (i // 5) % 20 == 0:
        print("  %d/%d · %ds" % (i, len(todo), int(time.time() - T0)), flush=True); save()
    time.sleep(0.25)

save()
have = [v for v in res.values() if v.get("t") is not None]
print("저장 %d개 (배수 잡힌 것 %d · API오류 %d)" % (len(res), len(have), err))
top = sorted([(k, v["t"]) for k, v in res.items() if v.get("t")], key=lambda x: -x[1])[:18]
print("\n지금 «뜨는» 축제 (최근7일 ÷ 60일평균):")
for k, t in top: print("  x%5.2f  %s" % (t, k))
