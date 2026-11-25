# -*- coding: utf-8 -*-
p = r"D:\dev\chukjemoa\data\festivals_en_fix.json"
s = open(p, encoding="utf-8", newline="").read()
a = "Jan 9–31, 2027 · Hwacheon, Gangwon. Ice fishing for mountain trout on the frozen stream, ice sledding and an ice sculpture plaza. Seoul day tours run Jan 11–31."
b = "Jan 9–31, 2027 · Hwacheon, Gangwon. Ice fishing for mountain trout on the frozen stream, ice sledding and ice sculptures; Seoul day tours Jan 11–31."
assert s.count(a) == 1 and len(b) <= 150, len(b)
open(p, "w", encoding="utf-8", newline="").write(s.replace(a, b))
import json; json.load(open(p, encoding="utf-8")); print("ok", len(b))
