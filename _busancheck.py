# -*- coding: utf-8 -*-
import re, io, glob, os
out = []
for f in ['busan/index.html', 'busan/spot/index.html', 'busan/festival/index.html',
          'busan/exhibition/index.html', 'busan/performance/index.html']:
    if not os.path.exists(f):
        out.append(f + '  ⛔없음'); continue
    h = io.open(f, encoding='utf-8').read()
    t = re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>', ' ', h)
    t = re.sub(r'<[^>]+>', ' ', t); t = re.sub(r'\s+', ' ', t).strip()
    ttl = re.search(r'<title>(.*?)</title>', h, re.S)
    out.append('%-32s 본문 %6d자 · 카드 %3d · 날씨 %s · noindex %s'
               % (f, len(t), len(re.findall(r'class="bs-card"', h)),
                  'O' if 'wx-chip' in h else '-', 'Y' if 'noindex' in h else 'N'))
    out.append('   ' + (ttl.group(1) if ttl else '-'))
s = io.open('sitemap.xml', encoding='utf-8').read()
out.append('사이트맵 %d개' % len(re.findall(r'<loc>', s)))
io.open('_busancheck.txt', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('ok')
