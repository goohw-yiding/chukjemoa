@echo off
chcp 65001 >nul
cd /d C:\dev\chukjemoa
rmdir /s /q "%%P%%" 2>nul
node _blog_imgs.js "C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업\정선5일장_사진_2026-10-04\_후보" "정선아리랑시장|정선5일장|아라리촌|화암동굴|병방치|정선향교" > _imgs_js.log 2>&1
node _blog_imgs.js "C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업\양평5일장_사진_2026-10-04\_후보" "양평물맑은시장|용문천년시장|양수리전통시장|두물머리|세미원|용문사" > _imgs_yp.log 2>&1
node _blog_imgs.js "C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업\담양장날_사진_2026-10-04\_후보" "창평시장|담양시장|죽녹원|관방제림|메타세쿼이아|삼지내마을|담양국수거리" > _imgs_dy.log 2>&1
echo done > _imgs_rest.done
