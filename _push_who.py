# -*- coding: utf-8 -*-
# 구독자 54명이 «무엇으로» 들어왔는지 실측한다. 브라우저·OS 구성이 사이트 트래픽과
# 얼마나 어긋나는지가 「모바일에서 구독 안내가 안 뜬다」의 유일한 증거다.
import json, urllib.request, collections, os

KEY = open(r"C:\dev\chukjemoa\onesignal.key", encoding="utf-8").read().strip()
APP = "8d4d29df-1dba-4f43-9efb-0c3745441e1f"

def get(url):
    r = urllib.request.Request(url, headers={
        "Authorization": "Basic " + KEY, "Accept": "application/json"})
    return json.load(urllib.request.urlopen(r, timeout=30))

rows, off = [], 0
while True:
    d = get("https://onesignal.com/api/v1/players?app_id=%s&limit=300&offset=%d" % (APP, off))
    ps = d.get("players", [])
    rows += ps
    print("total", d.get("total_count"), "fetched", len(rows))
    if len(ps) < 300 or len(rows) >= d.get("total_count", 0):
        break
    off += 300

c_dev = collections.Counter()
c_os = collections.Counter()
c_tag = collections.Counter()
c_sub = collections.Counter()
for p in rows:
    c_dev[(p.get("device_type"), p.get("device_model"))] += 1
    c_os[p.get("device_os")] += 1
    c_sub[bool(p.get("notification_types", 0) > 0)] += 1
    t = p.get("tags") or {}
    c_tag["interest=" + str(t.get("interest", "(없음)"))] += 1

print("\n-- 기기/브라우저 --")
for k, v in c_dev.most_common():
    print("  device_type=%-4s model=%-22s %3d" % (k[0], k[1], v))
print("\n-- OS 버전 상위 --")
for k, v in c_os.most_common(12):
    print("  %-28s %3d" % (k, v))
print("\n-- 구독 상태 --", dict(c_sub))
print("\n-- interest 태그 --")
for k, v in c_tag.most_common():
    print("  %-24s %3d" % (k, v))

# 최근 가입 5명의 원시 필드를 그대로 본다(추측 대신 현물)
rows.sort(key=lambda p: p.get("created_at") or 0, reverse=True)
print("\n-- 최근 가입 5명 --")
for p in rows[:5]:
    print(" ", p.get("created_at"), p.get("device_type"), p.get("device_model"),
          p.get("device_os"), p.get("country"), json.dumps(p.get("tags") or {}, ensure_ascii=False))
