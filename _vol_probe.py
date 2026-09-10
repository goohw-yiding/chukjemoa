# -*- coding: utf-8 -*-
import sys, json
sys.path.insert(0, r"C:\Users\USER\Documents\Claude\Projects\프로그램만들기 신사업")
from nv_volume import volumes
r = volumes(["금남로차없는거리걷자잉", "무주반딧불축제", "정선아리랑제", "평창효석문화제", "경산갓바위소원성취축제"])
print(json.dumps(r, ensure_ascii=False, indent=1)[:1200])
