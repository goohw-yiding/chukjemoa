# -*- coding: utf-8 -*-
import os, struct, glob
for p in sorted(glob.glob(r"C:\dev\chukjemoa\*.png") + glob.glob(r"C:\dev\chukjemoa\*.ico")
                + glob.glob(r"C:\dev\chukjemoa\*.svg")):
    n = os.path.basename(p); sz = os.path.getsize(p); dim = ""
    if n.endswith(".png"):
        with open(p, "rb") as f:
            h = f.read(33)
        if h[:8] == b"\x89PNG\r\n\x1a\n":
            w, hh = struct.unpack(">II", h[16:24]); dim = "%dx%d" % (w, hh)
    print("%-28s %8d  %s" % (n, sz, dim))
