# -*- coding: utf-8 -*-
"""바다 체험(갯벌체험·어촌체험마을) 상세 수집 — 2026-10-29 «바다 체험·물때» 시범.
spots_ko.json 에서 갯벌·해루질·어촌체험 이 들어간 곳 → TourAPI 상세(개요·전화·홈페이지·이용시간·쉬는날·체험·사진)
결과: data/sea_exp.json"""
import json, sys, time, re, requests
sys.stdout.reconfigure(encoding="utf-8")
K = open(r"C:\dev\chukjemoa\tourapi.key", encoding="utf-8").read().strip()
B = "https://apis.data.go.kr/B551011/KorService2/"
BASE = {"serviceKey": K, "MobileOS": "ETC", "MobileApp": "chukjemoa", "_type": "json"}
def call(op, **p):
    for t in range(3):
        try:
            r = requests.get(B + op, params={**BASE, **p}, timeout=30)
            items = r.json()["response"]["body"]["items"]
            if not items: return []
            it = items["item"]; return it if isinstance(it, list) else [it]
        except Exception as e:
            time.sleep(1.5)
    return []
s = json.load(open("data/spots_ko.json", encoding="utf-8"))
items = s if isinstance(s, list) else s.get("items", s)
items = list(items.values()) if isinstance(items, dict) else items
pick = [i for i in items if re.search("갯벌|해루질|어촌체험", json.dumps(i, ensure_ascii=False))]
out = []
for n, i in enumerate(pick):
    c = (call("detailCommon2", contentId=i["id"]) or [{}])[0]
    ct = c.get("contenttypeid", "12")
    intro = (call("detailIntro2", contentId=i["id"], contentTypeId=ct) or [{}])[0]
    imgs = [x.get("originimgurl") for x in call("detailImage2", contentId=i["id"], imageYN="Y")][:6]
    keep = {k: v for k, v in intro.items() if v and k not in ("contentid", "contenttypeid")}
    out.append({**i, "ctype": ct, "overview": c.get("overview", ""), "tel": c.get("tel", ""), "homepage": c.get("homepage", ""),
                "firstimage": c.get("firstimage", ""), "intro": keep, "images": [x for x in imgs if x]})
    if n % 10 == 0: print(n, i["title"], flush=True)
    time.sleep(0.25)
json.dump(out, open("data/sea_exp.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("DONE", len(out), "with overview", sum(1 for o in out if o["overview"]), "with images", sum(1 for o in out if o["images"] or o["firstimage"]))
