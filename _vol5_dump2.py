# -*- coding: utf-8 -*-
import json, os
d = json.load(open(r'C:\dev\chukjemoa\_vol5_pick.json', encoding='utf-8'))
fs = json.load(open(r'C:\dev\chukjemoa\data\festivals.json', encoding='utf-8'))
log = json.load(open(r'C:\dev\chukjemoa\data\festival_confirm_log.json', encoding='utf-8'))
out = ['FEST keys: ' + str(list(fs[0].keys()) if isinstance(fs, list) else list(fs.keys())[:10])]
arr = fs if isinstance(fs, list) else next(v for v in fs.values() if isinstance(v, list))
n = lambda s: (s or '').replace(' ', '')
for t in d['top']:
    out.append(f"== {t['name']}")
    for f in arr:
        if n(f.get('name') or f.get('title')) == n(t['name']):
            out.append('   ' + json.dumps(f, ensure_ascii=False)[:700])
    for e in log:
        if n(t['name']) in n(json.dumps(e, ensure_ascii=False)):
            out.append('   LOG ' + json.dumps(e, ensure_ascii=False)[:900])
open(r'C:\dev\chukjemoa\_vol5_pick2.txt', 'w', encoding='utf-8').write('\n'.join(out))
