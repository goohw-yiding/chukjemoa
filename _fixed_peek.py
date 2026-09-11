# -*- coding: utf-8 -*-
import io
L = io.open(r"C:\dev\chukjemoa\build.js", encoding="utf-8").read().split("\n")
for n in [1087, 1311, 1458, 4336, 4772, 4870]:
    print(n, "|", L[n - 1].strip()[:190])
