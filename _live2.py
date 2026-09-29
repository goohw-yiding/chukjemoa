import urllib.request, time
out = []
ts = int(time.time())
for path, needle in [('/en/seoul/', 'Nearest station'), ('/ja/seoul/', '\u6700\u5bc4\u308a\u99c5'), ('/es/seoul/', None), ('/festival/goseongmyeongtaechukje/', '2026')]:
    try:
        r = urllib.request.urlopen(urllib.request.Request('https://chukjemoa.co.kr%s?cb=%d' % (path, ts), headers={'User-Agent': 'Mozilla/5.0'}), timeout=30)
        body = r.read().decode('utf-8', 'replace')
        out.append('%s %s cache=%s %s' % (path, r.status, r.headers.get('x-vercel-cache'), (str(body.count(needle))) if needle else len(body)))
    except Exception as e:
        out.append('%s ERR %s' % (path, e))
open('C:/dev/chukjemoa/_live2.log', 'w', encoding='ascii', errors='replace').write('\n'.join(out))
