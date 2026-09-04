# -*- coding: utf-8 -*-
import re, io, glob
h = io.open('festival/yesanhwangsaechukje/index.html', encoding='utf-8').read()
i = h.find('<div class="wxbox">')
out = []
out.append('yesan wxbox idx = %d' % i)
if i > 0:
    seg = re.sub(r'<[^>]+>', ' ', h[i:i + 1600])
    out.append(re.sub(r'\s+', ' ', seg)[:700])
n = 0
for f in glob.glob('festival/*/index.html'):
    try:
        if '<div class="wxbox">' in io.open(f, encoding='utf-8').read():
            n += 1
    except Exception:
        pass
out.append('날씨 붙은 축제 상세 %d개' % n)
io.open('_wxcheck.txt', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('\n'.join(out))
