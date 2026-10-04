# 워터마크 사진 제외(감악산: 다님9기·트래블리더 표기) + 본문 순서대로 번호 재정렬
import os, shutil
P = r'C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업'
g = os.path.join(P, '감악산꽃별여행_사진_2026-10-05')
x = os.path.join(g, '_제외_워터마크'); os.makedirs(x, exist_ok=True)
for f in ['src_thumb.jpg', '04_별바람언덕_항공.jpg', '05_별바람언덕_꽃밭.jpg', '10_별바람언덕_인물.jpg']:
    if os.path.exists(os.path.join(g, f)): shutil.move(os.path.join(g, f), os.path.join(x, f))
shutil.copyfile(os.path.join(g, '_후보', '감악산꽃별여행_1.jpg'), os.path.join(g, 'src_thumb.jpg'))
ren = [('07_노을_꽃밭.jpg', '05_노을_꽃밭.jpg'), ('08_노을_풍력단지.jpg', '06_노을_풍력단지.jpg'), ('09_해질녘_꽃밭.jpg', '07_해질녘_꽃밭.jpg'),
       ('11_감악산_해돋이.jpg', '08_감악산_해돋이.jpg'), ('12_연수사.jpg', '09_연수사.jpg'), ('13_연수사_은행나무.jpg', '10_연수사_은행나무.jpg'), ('15_수승대.jpg', '11_수승대.jpg')]
for a, b in ren: os.rename(os.path.join(g, a), os.path.join(g, b))
c = os.path.join(P, '청원생명축제_사진_2026-10-05')
for a, b in [('12_오창호수공원.jpg', '11_오창호수공원.jpg'), ('13_청남대.jpg', '12_청남대.jpg'), ('14_초정행궁.jpg', '13_초정행궁.jpg')]:
    os.rename(os.path.join(c, a), os.path.join(c, b))
for n in ['경기도자비엔날레', '감악산꽃별여행', '청원생명축제', '광주비엔날레']:
    print(n, sorted(f for f in os.listdir(os.path.join(P, f'{n}_사진_2026-10-05')) if not f.startswith('_')))
