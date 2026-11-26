# -*- coding: utf-8 -*-
# Vol.11 — 11/22 이후 data/fest_volume.json 이 전부 vol=0(none:1)이라 pick() 후보 0개.
# 마지막 정상본(git a7ac59f861, 11/16 수집)을 «메모리에서만» 읽혀 pick() 을 읽기 전용으로 호출. 데이터·state 파일은 건드리지 않음.
import json, datetime, importlib.util, subprocess
P = r"C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업\숏폼자동화\weekly_ranking_pick.py"
spec = importlib.util.spec_from_file_location("wrp", P); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
old = json.loads(subprocess.check_output(["git", "show", "a7ac59f861:data/fest_volume.json"], cwd=r"C:\dev\chukjemoa").decode("utf-8"))
st = lambda d: (len(d), sum(1 for v in d.values() if isinstance(v, dict) and (v.get("vol") or 0) >= 100))
orig = m.load
m.load = lambda name: old if name == "fest_volume.json" else orig(name)
sat, sun = datetime.date(2026, 11, 28), datetime.date(2026, 11, 29)
top, notes = m.pick(sat, sun, set(), want=12)
out = {"weekend": [sat.isoformat(), sun.isoformat()], "volume_src": "a7ac59f861 (2026-11-16)", "old_stat": st(old), "notes": notes, "top": top}
json.dump(out, open(r"C:\dev\chukjemoa\_vol11_pick2.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("ok", len(top))
