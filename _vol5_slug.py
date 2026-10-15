# -*- coding: utf-8 -*-
import json, os, re
d = json.load(open(r'C:\dev\chukjemoa\_vol5_pick.json', encoding='utf-8'))
names = [t['name'] for t in d['top']]
n = lambda s: (s or '').replace(' ', '')
base = r'C:\dev\chukjemoa\festival'
out = []
hits = {x: [] for x in names}
for slug in os.listdir(base):
    p = os.path.join(base, slug, 'index.html')
    if not os.path.isfile(p): continue
    h = open(p, encoding='utf-8', errors='ignore').read(6000)
    m = re.search(r'<title>(.*?)</title>', h, re.S)
    t = m.group(1) if m else ''
    for x in names:
        if n(x) in n(t):
            hits[x].append(slug + ' :: ' + t[:90])
for x in names:
    out.append(x + ' -> ' + ' || '.join(hits[x]))
open(r'C:\dev\chukjemoa\_vol5_slug.txt', 'w', encoding='utf-8').write('\n'.join(out))
