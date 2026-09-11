# -*- coding: utf-8 -*-
# 1) notification_types 의 «날것»을 본다 — 전원 False 로 나온 게 진짜 미구독인지 필드 부재인지.
# 2) 안드로이드 20명이 어느 브라우저인지 본다.
import json, urllib.request, collections

KEY = open(r"C:\dev\chukjemoa\onesignal.key", encoding="utf-8").read().strip()
APP = "8d4d29df-1dba-4f43-9efb-0c3745441e1f"
r = urllib.request.Request(
    "https://onesignal.com/api/v1/players?app_id=%s&limit=300" % APP,
    headers={"Authorization": "Basic " + KEY, "Accept": "application/json"})
rows = json.load(urllib.request.urlopen(r, timeout=30))["players"]

print("첫 레코드 전체 필드:")
print(json.dumps(rows[0], ensure_ascii=False, indent=1)[:1800])

print("\n-- notification_types 값 분포 --")
print(collections.Counter(repr(p.get("notification_types")) for p in rows).most_common())
print("\n-- invalid_identifier --")
print(collections.Counter(repr(p.get("invalid_identifier")) for p in rows).most_common())
print("\n-- 안드로이드(Linux armv81) 20명의 device_os --")
print(collections.Counter(p.get("device_os") for p in rows
                          if p.get("device_model") == "Linux armv81").most_common())
print("\n-- Win32 34명의 device_os --")
print(collections.Counter(p.get("device_os") for p in rows
                          if p.get("device_model") == "Win32").most_common())
print("\n-- 태그 보유 --")
print(collections.Counter(bool(p.get("tags")) for p in rows).most_common())
