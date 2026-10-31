import sys, pathlib
from playwright.sync_api import sync_playwright
base = pathlib.Path(r"C:\dev\chukjemoa\_tide_preview\tide")
pages = [("hub", base / "index.html"), ("chungnam", base / "chungnam" / "index.html")]
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 420, "height": 900}, device_scale_factor=1)
    for name, f in pages:
        pg.goto(f.as_uri()); pg.wait_for_timeout(800)
        pg.screenshot(path=str(base.parent / f"_shot_{name}_top.png"))
        pg.screenshot(path=str(base.parent / f"_shot_{name}_full.png"), full_page=True)
        print(name, pg.evaluate("document.body.scrollHeight"))
    b.close()
