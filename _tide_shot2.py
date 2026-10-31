import subprocess, time, sys
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding="utf-8")
srv = subprocess.Popen([sys.executable, "-m", "http.server", "8765", "--bind", "127.0.0.1"], cwd=r"C:\dev\chukjemoa", stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(2)
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 400, "height": 860})
        for name, u in [("hub", "/tide/"), ("gyeonggi", "/tide/gyeonggi-incheon/"), ("winterlight", "/winter/light/")]:
            pg.goto("http://127.0.0.1:8765" + u); pg.wait_for_timeout(1500)
            pg.screenshot(path=rf"C:\dev\chukjemoa\_tide_preview\_real_{name}.png")
            if name == "gyeonggi":
                for i, sel in enumerate(["h2.sec:nth-of-type(2)", ".vcard"]):
                    pg.evaluate("s=>{const e=[...document.querySelectorAll(s)][0]; if(e) window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 60)}", sel)
                    pg.wait_for_timeout(800)
                    pg.screenshot(path=rf"C:\dev\chukjemoa\_tide_preview\_real_gyeonggi_{i}.png")
            if name == "winterlight":
                print("tide link on winter/light:", pg.locator("a[href='/tide/']").count())
            print(name, pg.title())
        b.close()
finally:
    srv.terminate()
