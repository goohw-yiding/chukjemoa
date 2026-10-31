import re
p = r"C:\dev\chukjemoa\tide.js"
s = open(p, encoding="utf-8").read()
rep = [
 (" 바지락·맛조개 체험과 독살(돌을 쌓아 밀물 때 들어온 고기를 가두는 전통 어로) 같은 체험이 남아 있는 지역입니다.", " 서해 안쪽 만마다 체험마을이 흩어져 있어 관측소도 대산·태안·안흥·보령·서천·장항으로 나뉩니다."),
 (" 물이 빠지는 폭이 커서 바지락·동죽 캐기 체험이 많습니다.", " 물이 빠지는 폭이 커서 물때를 맞추면 넓은 갯벌을 걸을 수 있습니다."),
 (" 굴·꼬막·낙지 등 남도 갯벌 특유의 체험이 많습니다.", ""),
 (" 대신 마을마다 갯바위·낚시·카약 같은 «바다 체험»이 고루 있고, 겨울에도 상대적으로 따뜻합니다.", " 그래서 물때보다 마을의 체험 운영 시간을 먼저 보는 편이 좋습니다."),
 ("이 페이지는 어촌체험(낚시·스노클링·해녀 체험 등) 중심으로 보세요.", "이 페이지는 마을의 어촌체험 안내 중심으로 보세요."),
 ("해 지는 시각이 오후 5시 30분 전후인 11~12월에는", "해가 오후 5시 10~30분 사이에 지는 11~12월에는"),
 ("해가 오후 5시 30분 전후로 지기 때문에", "해가 오후 5시 10~30분 사이에 지기 때문에"),
 ("대신 사람이 적고, 굴·꼬막처럼 겨울이 제철인 체험을 하는 마을도 있습니다.", "대신 사람이 적고, 체험 안내에 굴을 적어 둔 마을도 ${gulN}곳 있습니다."),
 ("동해안 어촌체험은 낚시·스노클링 같은 바다 체험이 중심입니다.", "동해안 마을은 갯벌보다 어촌·바다 체험 위주입니다."),
]
for a, b in rep:
    assert a in s, a[:30]
    s = s.replace(a, b)
# 지역별 «마을 소개에 자주 나오는 체험» 문장 + 굴 마을 수
s = s.replace("  const winterRest = ", """  const KW = ['갯벌', '바지락', '조개', '굴', '낚시', '망둥어', '맛조개', '후릿그물', '개매기', '독살', '갯바위', '카약', '스노클링', '해녀'];
  const kwLine = vs => { const c = KW.map(k => [k, vs.filter(v => (v.exp + ' ' + v.ovAll).includes(k)).length]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 6); return c.length ? `이 지역 마을 소개·체험 안내에 자주 나오는 말은 ${c.map(([k, n]) => `${k}(${n}곳)`).join(' · ')}입니다. 체험 종류는 계절·마을 사정에 따라 바뀌니 아래 카드의 안내와 전화로 확인하세요.` : ''; };
  const gulN = V.filter(v => (v.exp + ' ' + v.ovAll).includes('굴')).length;
  const winterRest = """, 1)
s = s.replace("exp: strip(it.expguide), short,", "exp: strip(it.expguide), short, ovAll: ov,", 1)
s = s.replace("<p style=\"line-height:1.8\">${R.lead}</p>", "<p style=\"line-height:1.8\">${R.lead} ${kwLine(vs)}</p>", 1)
open(p, "w", encoding="utf-8").write(s)
print("ok")
