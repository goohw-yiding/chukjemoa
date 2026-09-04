# -*- coding: utf-8 -*-
import re, io, os, glob
out = []
for f in sorted(glob.glob('seoul/**/index.html', recursive=True)) + ['seoul/index.html']:
    if not os.path.exists(f):
        continue
    h = io.open(f, encoding='utf-8').read()
    t = re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>', ' ', h)
    t = re.sub(r'<[^>]+>', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    ttl = re.search(r'<title>(.*?)</title>', h, re.S)
    out.append('%-34s 본문 %6d자  noindex=%s' % (f, len(t), 'Y' if 'noindex' in h else 'N'))
    out.append('   title: ' + (ttl.group(1) if ttl else '-'))
s = io.open('sitemap.xml', encoding='utf-8').read()
out.append('사이트맵 %d개 · /seoul/ 포함 %d개' % (len(re.findall(r'<loc>', s)), len(re.findall(r'/seoul/', s))))
io.open('_seoulcheck.txt', 'w', encoding='utf-8').write('\n'.join(dict.fromkeys(out)) + '\n')
print('ok')
