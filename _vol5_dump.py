# -*- coding: utf-8 -*-
import json
d = json.load(open(r'C:\dev\chukjemoa\_vol5_pick.json', encoding='utf-8'))
fs = json.load(open(r'C:\dev\chukjemoa\data\festivals.json', encoding='utf-8'))
fs = fs if isinstance(fs, list) else fs.get('festivals', fs)
log = json.load(open(r'C:\dev\chukjemoa\data\festival_confirm_log.json', encoding='utf-8'))
out = []
for t in d['top']:
    out.append(f"{t['name']}|{t['sido']} {t['sgg']}|{t['vol']}|{t['start']}~{t['end']}")
    for f in fs:
        if isinstance(f, dict) and (f.get('name') == t['name'] or f.get('title') == t['name']):
            out.append('   DATA: ' + json.dumps({k: f.get(k) for k in ('slug','id','place','addr','start','end','startDate','endDate','confirmed','homepage')}, ensure_ascii=False))
    s = json.dumps(log, ensure_ascii=False)
    if t['name'] in s:
        out.append('   LOG: has entry')
open(r'C:\dev\chukjemoa\_vol5_pick.txt', 'w', encoding='utf-8').write('\n'.join(out))
print(type(log).__name__, (list(log.keys())[:5] if isinstance(log, dict) else len(log)))
