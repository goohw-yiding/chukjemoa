// 한국 지명 → 외국어 표기. 로마자만 붙이면 "Dokdobangmulgwan"처럼 못 읽는 글자가 된다.
// 고유명사는 로마자로, 뒤에 붙는 일반명사(박물관·계곡·해수욕장…)는 그 언어로 바꾼다.
//   독도박물관 → Dokdo Museum (독도박물관) / 独島博物館 …
// ⚠️ romanize.js 의 romanizeWord 는 공백·숫자가 섞이면 통째로 포기한다(실측).
//    그래서 한글 구간만 잘라서 변환하는 romanizeMixed 를 여기서 따로 만든다.
'use strict';
const { romanizeWord } = require('./romanize.js');

// 자주 쓰이는 지명 접미사 — 긴 것부터 매칭한다
const SUF = [
  ['해수욕장', { en: 'Beach', ja: '海水浴場', zh: '海水浴场', tw: '海水浴場', es: 'Playa' }],
  ['한옥마을', { en: 'Hanok Village', ja: '韓屋村', zh: '韩屋村', tw: '韓屋村', es: 'Aldea Hanok' }],
  ['자연휴양림', { en: 'Recreation Forest', ja: '自然休養林', zh: '自然休养林', tw: '自然休養林', es: 'Bosque Recreativo' }],
  ['국립공원', { en: 'National Park', ja: '国立公園', zh: '国立公园', tw: '國立公園', es: 'Parque Nacional' }],
  ['기념관', { en: 'Memorial Hall', ja: '記念館', zh: '纪念馆', tw: '紀念館', es: 'Museo Conmemorativo' }],
  ['미술관', { en: 'Art Museum', ja: '美術館', zh: '美术馆', tw: '美術館', es: 'Museo de Arte' }],
  ['박물관', { en: 'Museum', ja: '博物館', zh: '博物馆', tw: '博物館', es: 'Museo' }],
  ['식물원', { en: 'Botanical Garden', ja: '植物園', zh: '植物园', tw: '植物園', es: 'Jardín Botánico' }],
  ['수목원', { en: 'Arboretum', ja: '樹木園', zh: '树木园', tw: '樹木園', es: 'Arboreto' }],
  ['전망대', { en: 'Observatory', ja: '展望台', zh: '观景台', tw: '觀景台', es: 'Mirador' }],
  ['유원지', { en: 'Amusement Park', ja: '遊園地', zh: '游乐园', tw: '遊樂園', es: 'Parque de Atracciones' }],
  ['저수지', { en: 'Reservoir', ja: '貯水池', zh: '水库', tw: '水庫', es: 'Embalse' }],
  ['생태공원', { en: 'Eco Park', ja: '生態公園', zh: '生态公园', tw: '生態公園', es: 'Ecoparque' }],
  ['둘레길', { en: 'Loop Trail', ja: '周回コース', zh: '环山步道', tw: '環山步道', es: 'Sendero Circular' }],
  ['해안길', { en: 'Coastal Trail', ja: '海岸トレイル', zh: '海岸步道', tw: '海岸步道', es: 'Sendero Costero' }],
  ['계곡', { en: 'Valley', ja: '渓谷', zh: '溪谷', tw: '溪谷', es: 'Valle' }],
  ['폭포', { en: 'Falls', ja: '滝', zh: '瀑布', tw: '瀑布', es: 'Cascada' }],
  ['온천', { en: 'Hot Spring', ja: '温泉', zh: '温泉', tw: '溫泉', es: 'Termas' }],
  ['시장', { en: 'Market', ja: '市場', zh: '市场', tw: '市場', es: 'Mercado' }],
  ['공원', { en: 'Park', ja: '公園', zh: '公园', tw: '公園', es: 'Parque' }],
  ['해변', { en: 'Beach', ja: 'ビーチ', zh: '海边', tw: '海邊', es: 'Playa' }],
  ['동굴', { en: 'Cave', ja: '洞窟', zh: '洞窟', tw: '洞窟', es: 'Cueva' }],
  ['서원', { en: 'Confucian Academy', ja: '書院', zh: '书院', tw: '書院', es: 'Academia Confuciana' }],
  ['향교', { en: 'Confucian School', ja: '郷校', zh: '乡校', tw: '鄉校', es: 'Escuela Confuciana' }],
  ['마을', { en: 'Village', ja: '村', zh: '村', tw: '村', es: 'Aldea' }],
  ['미술', { en: 'Art', ja: 'アート', zh: '艺术', tw: '藝術', es: 'Arte' }],
  ['호수', { en: 'Lake', ja: '湖', zh: '湖', tw: '湖', es: 'Lago' }],
  ['대교', { en: 'Bridge', ja: '大橋', zh: '大桥', tw: '大橋', es: 'Puente' }],
  ['사찰', { en: 'Temple', ja: '寺', zh: '寺', tw: '寺', es: 'Templo' }],
  ['성당', { en: 'Cathedral', ja: '聖堂', zh: '教堂', tw: '教堂', es: 'Catedral' }],
  ['궁', { en: 'Palace', ja: '宮', zh: '宫', tw: '宮', es: 'Palacio' }],
  ['산', { en: 'Mountain', ja: '山', zh: '山', tw: '山', es: 'Monte' }],
  ['봉', { en: 'Peak', ja: '峰', zh: '峰', tw: '峰', es: 'Pico' }],
  ['섬', { en: 'Island', ja: '島', zh: '岛', tw: '島', es: 'Isla' }],
  ['길', { en: 'Trail', ja: 'トレイル', zh: '步道', tw: '步道', es: 'Sendero' }],
  ['코스', { en: 'Course', ja: 'コース', zh: '路线', tw: '路線', es: 'Ruta' }]
];

// 한글 구간만 로마자로 바꾸고 숫자·공백·영문은 그대로 둔다
function romanizeMixed(s) {
  return String(s || '').replace(/[가-힣]+/g, m => romanizeWord(m)).replace(/\s{2,}/g, ' ').trim();
}

// ko: 한글 지명, lang: en|ja|zh|tw|es
// 반환: { n: 표기용 이름, ko: 원문 } — 화면에서는 "n (ko)" 로 병기한다
function placeName(ko, lang) {
  const s = String(ko || '').trim();
  if (!s) return { n: '', ko: '' };
  for (const [suf, label] of SUF) {
    if (s.length > suf.length + 1 && s.endsWith(suf)) {
      const base = romanizeMixed(s.slice(0, -suf.length)).replace(/[\s·-]+$/, '');
      if (base) return { n: base + ' ' + (label[lang] || label.en), ko: s };
    }
  }
  return { n: romanizeMixed(s), ko: s };
}

module.exports = { placeName, romanizeMixed };
