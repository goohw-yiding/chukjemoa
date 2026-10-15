# -*- coding: utf-8 -*-
import json, os
d = json.load(open(r'C:\dev\chukjemoa\_vol5_pick.json', encoding='utf-8'))
fp = json.load(open(r'C:\dev\chukjemoa\data\festival_pages.json', encoding='utf-8'))
n = lambda s: (s or '').replace(' ', '')
m = {n(f.get('title')): f for f in fp}
out = []
for t in d['top']:
    f = m.get(n(t['name']))
    if f:
        ex = os.path.isdir(os.path.join(r'C:\dev\chukjemoa\festival', f['slug']))
        out.append(f"{t['name']} -> {f['slug']} dir={ex} | " + json.dumps({k: v for k, v in f.items() if k not in ('overview','desc','img','image','body')}, ensure_ascii=False)[:400])
    else:
        out.append(f"{t['name']} -> NONE")
open(r'C:\dev\chukjemoa\_vol5_slug2.txt', 'w', encoding='utf-8').write('\n'.join(out))
