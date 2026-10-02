# -*- coding: utf-8 -*-
# Vol.3 재료 — 주간랭킹 선정 함수(pick)를 «읽기 전용»으로 불러 쓴다. ranking_state·pick_ep 파일은 건드리지 않는다.
import sys, json, datetime, importlib.util
P = r"C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업\숏폼자동화\weekly_ranking_pick.py"
spec = importlib.util.spec_from_file_location("wrp", P); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
sat, sun = datetime.date(2026, 10, 3), datetime.date(2026, 10, 4)
top, notes = m.pick(sat, sun, set(), want=10)
out = {"weekend": [sat.isoformat(), sun.isoformat()], "notes": notes, "top": top}
json.dump(out, open(r"C:\dev\chukjemoa\_vol3_pick.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok", len(top))
