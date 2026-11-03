import json, sys, collections, re
sys.stdout.reconfigure(encoding="utf-8")
acc = json.load(open("data/accessible.json", encoding="utf-8"))
print("cat", collections.Counter(x["cat"] for x in acc).most_common(10))
a = [x for x in acc if x.get("acc")]
print("acc 예", json.dumps(a[0]["acc"], ensure_ascii=False)[:600])
print("acc keys", collections.Counter(k for x in a for k in (x["acc"] if isinstance(x["acc"], dict) else {})).most_common(40))
api = json.load(open("data/festivals_api.json", encoding="utf-8"))
ids = {x["id"] for x in acc}
up = [x for x in api if x["end"] >= "20261103" and x["start"] <= "20261231"]
print("11~12월 진행/예정 축제", len(up), "| accessible 와 id 겹침", sum(1 for x in up if x["id"] in ids))
intro = json.load(open("data/fest_intro.json", encoding="utf-8"))
print("intro 있음", sum(1 for x in up if x["id"] in intro), "| fee 있음", sum(1 for x in up if (intro.get(x["id"]) or {}).get("fee")))
kw = re.compile(r"어린이|아이|가족|유아|키즈|체험|동물|썰매|눈썰매|산타|크리스마스|빛|불빛|과학|만들기")
fam = [x for x in up if kw.search(x["title"] + " " + x["ov"])]
print("가족 키워드", len(fam))
for x in sorted(fam, key=lambda x: x["start"])[:40]:
    fi = intro.get(x["id"]) or {}
    print(x["start"], x["end"], x["sido"], x["title"][:30], "| fee:", (fi.get("fee") or "")[:40], "| kw:", ",".join(sorted(set(kw.findall(x["title"] + " " + x["ov"]))))[:40])
