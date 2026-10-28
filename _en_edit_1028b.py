# -*- coding: utf-8 -*-
"""10/28 추가 — 청송사과 desc, 고성공룡엑스포 대조 기록"""
import json, sys, importlib.util
sys.stdout.reconfigure(encoding="utf-8")
FP = r"C:\dev\chukjemoa\data\festivals_en_fix.json"; CP = r"C:\dev\chukjemoa\data\festivals_en_checked.json"
raw = open(FP, encoding="utf-8", newline="").read(); data = json.loads(raw)
assert "1398781" not in data
nl = "\r\n" if "\r\n" in raw else "\n"
val = {"desc": "Nov 4–8, 2026 · Cheongsong. The 20th Cheongsong Apple Festival along Yongjeoncheon Stream in Cheongsong-eup, at the peak of apple harvest season.",
       "src": "경북매일 2026-09-28 article/20260928500366 (11/4~8 청송읍 용전천 일원, 주제 「지금 청송! 사과로 물들다」) + 2026-10-18 article/20261018500281 (제20회). 2026-10-28 영어 세션"}
k = raw.rstrip().rindex("}")
raw = raw[:k].rstrip() + "," + nl + '  "1398781": ' + json.dumps(val, ensure_ascii=False) + nl + "}" + nl
open(FP, "w", encoding="utf-8", newline="").write(raw); json.loads(open(FP, encoding="utf-8").read())
craw = open(CP, encoding="utf-8", newline="").read(); cnl = "\r\n" if "\r\n" in craw else "\n"
k = craw.rstrip().rindex("}")
e = {"title": "Gyeongnam Goseong Dinosaur World Expo", "date": "2026-10-28", "result": "맞음 9/22~11/1(41일) 당항포관광지", "src": "뉴시스 2026-07-30 NISX20260730_0003729797 · 시대일보 2026-09-08"}
craw = craw[:k].rstrip() + "," + cnl + '  "716565": ' + json.dumps(e, ensure_ascii=False) + cnl + "}" + cnl
open(CP, "w", encoding="utf-8", newline="").write(craw); json.loads(open(CP, encoding="utf-8").read())
print("ok")
