# -*- coding: utf-8 -*-
import ast, sys
for p in sys.argv[1:]:
    try:
        ast.parse(open(p, encoding="utf-8").read())
        print("OK  " + p)
    except SyntaxError as e:
        print("ERR " + p + "  line %s: %s" % (e.lineno, e.msg))
        sys.exit(1)
