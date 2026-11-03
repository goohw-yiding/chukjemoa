import subprocess, sys
sys.stdout.reconfigure(encoding="utf-8")
for c in ["12c23b67~1", "12c23b67", "fa44a262", "7620917c", "HEAD"]:
    s = subprocess.run(["git", "show", c + ":winter-light.js"], capture_output=True).stdout.decode("utf-8", "replace")
    print(c, "tide" in s, s.count("/tide/"))
s = open("winter-light.js", encoding="utf-8").read(); print("work", "/tide/" in s)
