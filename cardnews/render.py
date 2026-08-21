# -*- coding: utf-8 -*-
"""
이주의 축제모아 — 카드뉴스 6장 렌더러.

사용법:
  python3 render.py <data.json> <outdir>

<data.json> 은 template.html 의 {{TOKEN}} 자리에 채울 값들을 담은 JSON 객체.
필요한 키 목록은 example-vol1.json 참고 (Vol.1 실제 발행분 그대로).

출력: <outdir>/cardN.png (N=1~6), 1080×1350, @2x(2160×2700 실픽셀).

의존성: playwright (pip install playwright, 이 저장소 밖 클라우드 샌드박스에는 이미 설치돼
있음 — /opt/pw-browsers 에 Chromium 사전 설치). Windows 개발 PC에는 없을 수 있으니, 이 스크립트는
반드시 이미지 생성 능력이 있는 환경(클라우드 샌드박스)에서 실행할 것.
"""
import sys
import json
import asyncio
import os
from playwright.async_api import async_playwright

IDS = ["c1", "c2", "c3", "c4", "c5", "c6"]


def fill_template(template_path, data):
    with open(template_path, "r", encoding="utf-8") as f:
        html = f.read()
    for key, val in data.items():
        html = html.replace("{{" + key + "}}", str(val))
    # 안 채워진 토큰이 남아 있으면 실수를 바로 알 수 있도록 에러
    import re
    leftover = re.findall(r"\{\{([A-Z0-9_]+)\}\}", html)
    if leftover:
        raise ValueError(f"채워지지 않은 토큰이 있습니다: {sorted(set(leftover))}")
    return html


async def render(html_path, outdir):
    os.makedirs(outdir, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1080, "height": 1350}, device_scale_factor=2)
        await page.goto(f"file://{html_path}")
        await page.wait_for_timeout(400)
        for i, cid in enumerate(IDS, start=1):
            el = await page.query_selector(f"#{cid}")
            if el is None:
                raise RuntimeError(f"카드 섹션 #{cid} 를 찾을 수 없습니다 — template.html 구조 확인 필요")
            await el.screenshot(path=os.path.join(outdir, f"card{i}.png"))
            print(f"saved card{i} ({cid})")
        await browser.close()


def main():
    if len(sys.argv) != 3:
        print("사용법: python3 render.py <data.json> <outdir>")
        sys.exit(1)
    data_path, outdir = sys.argv[1], sys.argv[2]
    script_dir = os.path.dirname(os.path.abspath(__file__))
    template_path = os.path.join(script_dir, "template.html")

    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    filled_html = fill_template(template_path, data)
    tmp_html = os.path.join(outdir, "_filled.html")
    os.makedirs(outdir, exist_ok=True)
    with open(tmp_html, "w", encoding="utf-8") as f:
        f.write(filled_html)

    asyncio.run(render(os.path.abspath(tmp_html), outdir))


if __name__ == "__main__":
    main()
