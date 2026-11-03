import json, sys, os, collections, glob
sys.stdout.reconfigure(encoding="utf-8")
def L(f):
    try: return json.load(open(f, encoding="utf-8"))
    except Exception as e: return None
api = L("data/festivals_api.json")
print("festivals_api", len(api), "keys", collections.Counter(k for x in api for k in x).most_common(40))
ex = api[0]; print({k: str(v)[:80] for k, v in ex.items()})
for f in glob.glob("data/*intro*.json") + glob.glob("data/*fest*.json"):
    d = L(f)
    if d is None: continue
    n = len(d)
    s = (list(d.values())[0] if isinstance(d, dict) and d else (d[0] if isinstance(d, list) and d else None))
    print("\n", f, n, (list(s.keys())[:30] if isinstance(s, dict) else type(s).__name__))
acc = L("data/accessible.json")
if acc:
    print("\naccessible", len(acc), collections.Counter(k for x in acc for k in (x.get("bf") or x).keys()).most_common(60))
