import json, subprocess
a = json.loads(subprocess.run(["git", "show", "HEAD:data/festivals_en_fix.json"], capture_output=True, cwd=r"C:\dev\chukjemoa").stdout.decode("utf-8"))
b = json.load(open(r"C:\dev\chukjemoa\data\festivals_en_fix.json", encoding="utf-8"))
print("HEAD", len(a), "NOW", len(b))
print("removed", sorted(set(a) - set(b)))
print("added", sorted(set(b) - set(a)))
print(open(r"C:\dev\chukjemoa\_en_edit_1111.py", encoding="utf-8").read().count("for k in ():"))
