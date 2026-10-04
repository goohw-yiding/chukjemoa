# 카드·썸네일 390px 축소 미리보기 시트 (모바일 가독성 확인)
import os
from PIL import Image
P = r'C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업'
for n in ['경기도자비엔날레', '감악산꽃별여행', '청원생명축제', '광주비엔날레']:
    b = os.path.join(P, f'{n}_사진_2026-10-05')
    fs = sorted(f for f in os.listdir(b) if f.endswith('.png'))
    ims = []
    for f in fs:
        im = Image.open(os.path.join(b, f)).convert('RGB'); r = 390 / im.size[0]
        ims.append(im.resize((390, int(im.size[1] * r))))
    H = max(i.size[1] for i in ims); sheet = Image.new('RGB', (400 * len(ims), H), 'white')
    for k, i in enumerate(ims): sheet.paste(i, (400 * k, 0))
    sheet.save(os.path.join(b, '_preview390.jpg'), quality=88)
