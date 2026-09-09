# -*- coding: utf-8 -*-
# 시·군 「○○장날」 검색량 전수 측정 → data/jangteo_volume.json
#
# 왜 전수인가: 「시장이 3곳 이상인 시·군」으로 자르면 «검색량 1위 정선»(시장 2곳)이 빠진다.
#              자르는 기준은 시장 수가 아니라 검색량이다.
# ⚠️ 네이버 keywordstool 은 힌트키워드 5개까지 — nv_volume.volumes() 가 알아서 끊는다.
import json, os, sys, time, collections

sys.path.insert(0, r"C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업")
from nv_volume import volumes  # noqa

BASE = r"C:\dev\chukjemoa"
std = json.load(open(os.path.join(BASE, "data", "markets_std.json"), encoding="utf-8"))
try:
    api = json.load(open(os.path.join(BASE, "data", "markets_api.json"), encoding="utf-8"))
except Exception:
    api = []

# ── 시·군 목록 만들기 (두 소스 합침)
def city_of(m):
    return (m.get("city") or m.get("sigungu") or "").strip()

cnt = collections.Counter()
sido_of = {}
for m in std + api:
    c, s = city_of(m), (m.get("sido") or "").strip()
    if not c:
        continue
    cnt[c] += 1
    sido_of.setdefault(c, s)

# ⚠️ 광역시 자치구(중구·남구…)는 「중구장날」이 말이 안 된다 — 검색어로 쓸 수 없으니 뺀다.
GENERIC = {"중구", "남구", "북구", "동구", "서구", "강서구", "수성구", "달서구", "유성구",
           "대덕구", "광산구", "연수구", "부평구", "계양구", "미추홀구", "사하구", "해운대구",
           "금정구", "사상구", "영도구", "동래구", "수영구", "기장군"}
cities = [c for c in cnt if c not in GENERIC]
print("시·군 %d곳 (자치구 제외 후 %d곳)" % (len(cnt), len(cities)))

# ── 검색어 만들기: 「○○장날」 (접미사 시/군/구 떼기)
def stem(c):
    return c[:-1] if c.endswith(("시", "군", "구")) else c

kw = {}
for c in cities:
    k = stem(c) + "장날"
    kw.setdefault(k, []).append(c)   # 같은 어간이 겹칠 수 있다(고성군 2곳 등)

keys = sorted(kw)
print("측정할 검색어 %d개" % len(keys))

out, t0 = [], time.time()
CH = 25
for i in range(0, len(keys), CH):
    part = keys[i:i + CH]
    rows = volumes(part)
    got = {r[1]: r for r in rows}
    for k in part:
        r = got.get(k)
        for c in kw[k]:
            out.append({
                "city": c, "sido": sido_of.get(c, ""), "kw": k,
                "vol": r[0] if r else 0, "pc": r[2] if r else 0, "mo": r[3] if r else 0,
                "comp": r[4] if r else "-", "markets": cnt[c],
            })
    print("  %d/%d  (%.0f초)" % (min(i + CH, len(keys)), len(keys), time.time() - t0))
    time.sleep(0.4)

out.sort(key=lambda x: -x["vol"])
json.dump(out, open(os.path.join(BASE, "data", "jangteo_volume.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)

print("\n=== 상위 40")
print("  %-10s %-6s %7s %6s %s" % ("시·군", "시·도", "검색량", "시장수", "검색어"))
for r in out[:40]:
    print("  %-10s %-6s %7d %6d  %s" % (r["city"], r["sido"], r["vol"], r["markets"], r["kw"]))

for cut in (2000, 1000, 500, 300, 200, 100, 50):
    sel = [r for r in out if r["vol"] >= cut]
    print("컷 %5d 이상 → %3d곳 · 검색량 합 %7d · 시장 %4d곳" % (
        cut, len(sel), sum(r["vol"] for r in sel), sum(r["markets"] for r in sel)))
print("전체 %d곳 · 검색량 합 %d" % (len(out), sum(r["vol"] for r in out)))
