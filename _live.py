import urllib.request, time
out = []
ts = int(time.time())
for path, needle in [('/en/seoul/', 'Nearest station'), ('/ja/seoul/', '?野꾠굤蓼?), ('/es/seoul/', None), ('/festival/goseongmyeongtaechukje/', '2026')]:
    try:
        r = urllib.request.urlopen(urllib.request.Request('https://chukjemoa.co.kr%s?cb=%d' % (path, ts), headers={'User-Agent': 'Mozilla/5.0'}), timeout=30)
        body = r.read().decode('utf-8', 'replace')
        out.append('%s %s cache=%s %s' % (path, r.status, r.headers.get('x-vercel-cache'), (needle + '=' + str(body.count(needle))) if needle else len(body)))
    except Exception as e:
        out.append('%s ERR %s' % (path, e))
open('C:/dev/chukjemoa/_live.log', 'w', encoding='utf-8').write('\n'.join(out))
