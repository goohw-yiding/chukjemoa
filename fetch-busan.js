// 🌊 부산 축제 — 5개 언어 «공식 번역» → data/busan_festivals.json
//
// ⭐ 이게 왜 특별한가 (2026-09-04)
//   부산광역시_부산축제정보 서비스는 한 데이터셋에 **국문·영문·일문·중문 간체·중문 번체 5개 오퍼레이션**이
//   들어 있다(getFestivalKr/En/Ja/Zhs/Zht). 우리 사이트 언어(ko·en·ja·zh·tw)와 **정확히 겹친다.**
//   → 부산은 외국어 도시 페이지를 **기계번역 없이 공식 번역으로** 만들 수 있다.
//   ⭐ 게다가 `MAIN_TITLE` 은 모든 언어에서 «한국어 원제»로 온다 — 지도에 붙여넣을 이름이 공짜로 딸려온다.
//
// ⚠️ MAIN_TITLE 꼬리에 「(한,영, 중간,중번,일)」 같은 «제공 언어 표기»가 붙어 있다. 제목에서 뗀다.
// ⚠️ 41건뿐이다(영 37·일 35·중간 35·중번 36). 이것만으로 한국어 /busan/ 은 얇다 —
//    한국어 페이지는 우리 기존 데이터(TourAPI 부산 축제 73·문화축제표준 37)와 «합쳐야» 한다.
//    반대로 **외국어 쪽은 이걸로 충분하다**(다른 데서 부산 축제 외국어를 이만큼 못 구한다).
//
// 키: busan.key (data.go.kr 개발계정 · 오퍼레이션당 하루 10,000 · 2026-09-04 승인, 2028-09-04까지)
// 실행: node fetch-busan.js
const fs = require('fs'), path = require('path'), https = require('https');
const OUT = path.join(__dirname, 'data', 'busan_festivals.json');
const B = 'https://apis.data.go.kr/6260000/FestivalService/';
let KEY = '';
try { KEY = fs.readFileSync(path.join(__dirname, 'busan.key'), 'utf8').trim(); } catch (e) { }
if (!KEY) { console.log('⛔ busan.key 없음 — data.go.kr 「부산광역시_부산축제정보 서비스」 활용신청 후 키를 넣으세요.'); process.exit(1); }

const OPS = [['Kr', 'ko'], ['En', 'en'], ['Ja', 'ja'], ['Zhs', 'zh'], ['Zht', 'tw']];
const get = u => new Promise((res, rej) => {
  https.get(u, { headers: { 'User-Agent': 'chukjemoa' }, timeout: 25000 }, r => {
    r.setEncoding('utf8'); let d = '';
    r.on('data', c => d += c); r.on('end', () => res({ s: r.statusCode, d }));
  }).on('error', rej).on('timeout', function () { this.destroy(new Error('timeout')); });
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
  .replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
// 「부산바다축제(한,영, 중간,중번,일)」 → 「부산바다축제」
const stripLangTail = s => clean(s).replace(/\s*[（(]\s*(한|영|일|중간|중번|중국어|영어|일어|일본어|국문|[,，·、\s])+\s*[)）]\s*$/, '').trim();

function rows(j) {
  // 응답이 { getFestivalKr: { header, body: { items: { item: [...] } } } } 형태
  const top = j[Object.keys(j)[0]] || {};
  const b = top.body || top;
  let it = b.items || b.item || [];
  if (it && it.item) it = it.item;
  if (!Array.isArray(it)) it = it ? [it] : [];
  return { list: it, total: Number(b.totalCount || top.totalCount || it.length) };
}

(async () => {
  const byLang = {};
  for (const [op, lang] of OPS) {
    const u = `${B}getFestival${op}?serviceKey=${KEY}&pageNo=1&numOfRows=200&resultType=json`;
    let r;
    try { r = await get(u); } catch (e) { console.log(`  ⚠️ ${op} 요청 실패 ${e.message}`); continue; }
    if (r.s !== 200) { console.log(`  ⚠️ ${op} HTTP ${r.s} ${r.d.slice(0, 120).replace(/\s+/g, ' ')}`); continue; }
    let j; try { j = JSON.parse(r.d); } catch (e) { console.log(`  ⚠️ ${op} 파싱 실패`); continue; }
    const { list, total } = rows(j);
    byLang[lang] = {};
    for (const x of list) {
      const id = String(x.UC_SEQ);
      byLang[lang][id] = {
        title: clean(x.TITLE), sub: clean(x.SUBTITLE),
        gu: clean(x.GUGUN_NM), place: clean(x.MAIN_PLACE) || clean(x.PLACE),
        addr: clean(x.ADDR1) || clean(x.ADDR2),
        tel: clean(x.CNTCT_TEL), hp: clean(x.HOMEPAGE_URL),
        traffic: clean(x.TRFC_INFO),                 // ⭐ 교통 안내 — 외국인에게 가장 아쉬운 정보다
        day: clean(x.USAGE_DAY), time: clean(x.USAGE_DAY_WEEK_AND_TIME),
        fee: clean(x.USAGE_AMOUNT),
        desc: clean(x.ITEMCNTNTS).slice(0, 900)
      };
    }
    console.log(`  ${op}(${lang}) ${list.length}건 (총 ${total})`);
    await sleep(200);
  }

  const ko = byLang.ko || {};
  if (!Object.keys(ko).length) { console.log('⛔ 국문 0건 — 기존 파일을 덮어쓰지 않는다'); process.exit(1); }

  // 국문을 축으로 합친다. 좌표·이미지·한글원제는 언어와 무관하므로 국문 응답에서 한 번만 가져온다.
  const raw = {};
  {
    const u = `${B}getFestivalKr?serviceKey=${KEY}&pageNo=1&numOfRows=200&resultType=json`;
    const r = await get(u); const { list } = rows(JSON.parse(r.d));
    list.forEach(x => { raw[String(x.UC_SEQ)] = x; });
  }

  const out = Object.keys(ko).map(id => {
    const x = raw[id] || {};
    const lat = Number(x.LAT), lng = Number(x.LNG);
    const okXY = isFinite(lat) && isFinite(lng) && lng > 128 && lng < 130 && lat > 34.8 && lat < 35.5;
    const langs = {};
    for (const [, lang] of OPS) if (byLang[lang] && byLang[lang][id]) langs[lang] = byLang[lang][id];
    return {
      id,
      ko: stripLangTail(x.MAIN_TITLE),               // ⭐ 지도에 붙여넣을 «한글 원제»
      x: okXY ? String(lng) : '', y: okXY ? String(lat) : '',
      img: clean(x.MAIN_IMG_NORMAL) || clean(x.MAIN_IMG_THUMB),
      langs
    };
  });

  fs.writeFileSync(OUT, JSON.stringify({
    generated: new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10),
    source: '부산광역시_부산축제정보 서비스(공공데이터포털)',
    rows: out
  }), 'utf8');

  console.log(`✓ data/busan_festivals.json — ${out.length}건`);
  for (const [, lang] of OPS) {
    const n = out.filter(r => r.langs[lang] && r.langs[lang].title).length;
    const tr = out.filter(r => r.langs[lang] && r.langs[lang].traffic).length;
    const ds = out.filter(r => r.langs[lang] && String(r.langs[lang].desc || '').length >= 120).length;
    console.log(`  ${lang.padEnd(3)} 제목 ${String(n).padStart(3)} · 교통안내 ${String(tr).padStart(3)} · 설명120자↑ ${String(ds).padStart(3)}`);
  }
  console.log(`  한글원제 ${out.filter(r => r.ko).length} · 좌표 ${out.filter(r => r.x).length} · 사진 ${out.filter(r => r.img).length}`);
})();
