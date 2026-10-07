import json,sys
sys.stdout.reconfigure(encoding='utf-8')
E=json.load(open('data/festivals_en.json',encoding='utf-8'))
ids=set(sys.argv[1:])
for f in E:
    s=json.dumps(f,ensure_ascii=False)
    if str(f.get('contentid') or f.get('id')) in ids or any(('"'+i+'"') in s for i in ids if not i.isdigit()):
        print(json.dumps({k:(v[:300] if isinstance(v,str) else v) for k,v in f.items()},ensure_ascii=False)[:1800]); print('---')
