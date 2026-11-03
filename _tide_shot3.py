import subprocess, time, sys
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding="utf-8")
base = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8765"
srv = None
if "127.0.0.1" in base:
    srv = subprocess.Popen([sys.executable, "-m", "http.server", "8765", "--bind", "127.0.0.1"], cwd=r"C:\dev\chukjemoa", stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(2)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={"width": 400, "height": 860})
        pg.goto(base + "/kids/?v=1"); pg.wait_for_timeout(1500)
        print(pg.title()); pg.screenshot(path=r"C:\dev\chukjemoa\_tide_preview\_kids_top.png")
        pg.evaluate("window.scrollTo(0, document.querySelector('.kcard').getBoundingClientRect().top + scrollY - 60)"); pg.wait_for_timeout(800)
        pg.screenshot(path=r"C:\dev\chukjemoa\_tide_preview\_kids_card.png")
        for u in ["/winter/light/", "/tide/"]:
            pg.goto(base + u + "?v=1"); print(u, "kids link", pg.locator("a[href='/kids/']").count(), "tide link", pg.locator("a[href='/tide/']").count())
        b.close()
finally:
    if srv: srv.terminate()
