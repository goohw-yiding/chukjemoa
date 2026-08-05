// 국어의 로마자 표기법(Revised Romanization) 규칙 기반 한글→로마자 변환
// 지역명(시·군·구) 표기용. 자모 분해 → 받침-초성 연음/자음동화 처리 → 음절별 로마자 조합.
'use strict';

const CHO = ['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
const JUNG = ['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'];
// 종성 로마자 (인덱스 0~27, 반드시 28개)
//        0   ㄱ  ㄲ  ㄳ  ㄴ  ㄵ  ㄶ  ㄷ  ㄹ  ㄺ  ㄻ  ㄼ  ㄽ  ㄾ  ㄿ  ㅀ  ㅁ  ㅂ  ㅄ  ㅅ  ㅆ  ㅇ   ㅈ  ㅊ  ㅋ  ㅌ  ㅍ  ㅎ
const JONG = ['','k','k','k','n','n','n','t','l','k','m','p','l','l','p','l','m','p','p','t','t','ng','t','t','k','t','p','t'];
// 종성 → 뒤 음절이 ㅇ초성(모음)일 때 연음될 초성 인덱스(-1이면 연음 없음)
const LINK = [-1, 0, 1, 9, 2, 12, -1, 3, 5, 0, 6, 7, 9, 16, 17, -1, 6, 7, 9, 9, 10, -1, 12, 14, 15, 16, 17, -1];

// 자음동화(받침 + 다음 초성) 예외 표: [종성idx, 초성idx] → [종성로마자, 초성로마자]
const ASSIM = {
  // ㄱ(1) + ㄴ/ㅁ/ㄹ → ng
  '1,2': ['ng', 'n'], '1,6': ['ng', 'm'], '1,5': ['ng', 'n'],
  // ㄷ(7)·ㅅ(19)·ㅆ(20)·ㅈ(22)·ㅊ(23)·ㅌ(25)·ㅎ(27) + ㄴ/ㅁ → n
  '7,2': ['n', 'n'], '7,6': ['n', 'm'],
  '19,2': ['n', 'n'], '19,6': ['n', 'm'],
  '20,2': ['n', 'n'], '20,6': ['n', 'm'],
  // ㅂ(17) + ㄴ/ㅁ/ㄹ → m
  '17,2': ['m', 'n'], '17,6': ['m', 'm'], '17,5': ['m', 'n'],
  // ㄴ(4) + ㄹ → l l  (신라→Silla)
  '4,5': ['l', 'l'],
  // ㄹ(8) + ㄴ → l l  /  ㄹ(8) + ㄹ → l l (울릉→Ulleung)
  '8,2': ['l', 'l'], '8,5': ['l', 'l'],
  // ㅁ(16)·ㅇ(21) + ㄹ → n
  '16,5': ['m', 'n'], '21,5': ['ng', 'n'],
  // ㄱ(1) + ㄹ → ng n
  // (위 1,5 에서 처리)
};

function decompose(ch) {
  const c = ch.charCodeAt(0) - 0xAC00;
  if (c < 0 || c > 11171) return null;
  return { cho: Math.floor(c / 588), jung: Math.floor((c % 588) / 28), jong: c % 28 };
}

// 한 덩어리(공백 없는 한글 문자열)를 로마자로
function romanizeWord(word) {
  const syl = [...word].map(decompose);
  if (syl.some(s => s === null)) return word; // 한글 아닌 문자 포함 시 원문
  const out = [];
  for (let i = 0; i < syl.length; i++) {
    const s = syl[i], next = syl[i + 1];
    let cho = CHO[s.cho], jung = JUNG[s.jung], jong = JONG[s.jong];
    // ㅇ(11) 초성은 무음
    if (i > 0) {
      const prev = syl[i - 1];
      if (s.cho === 11 && prev.jong > 0 && LINK[prev.jong] >= 0) {
        cho = CHO[LINK[prev.jong]];      // 연음
        out[i - 1] = out[i - 1].slice(0, out[i - 1].length - JONG[prev.jong].length);
      }
    }
    if (next && s.jong > 0) {
      const key = s.jong + ',' + next.cho;
      if (ASSIM[key]) jong = ASSIM[key][0];
      else if (next.cho !== 11) {
        // ㄱ/ㄷ/ㅂ 받침 뒤 평음 경음화는 표기에 반영하지 않음(로마자표기법 원칙)
      }
    }
    out.push(cho + jung + jong);
  }
  // 자음동화로 뒤 초성이 바뀌는 경우 후처리
  for (let i = 0; i < syl.length - 1; i++) {
    const key = syl[i].jong + ',' + syl[i + 1].cho;
    if (ASSIM[key]) {
      const newCho = ASSIM[key][1];
      out[i + 1] = newCho + out[i + 1].slice(CHO[syl[i + 1].cho].length);
    }
  }
  const s = out.join('');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// 행정구역 접미사 분리: 울릉군 → Ulleung-gun
const SUFFIX = { '특별시': 'si', '광역시': 'si', '특별자치시': 'si', '특별자치도': 'do', '시': 'si', '군': 'gun', '구': 'gu', '도': 'do' };
function romanizeToken(name) {
  for (const suf of ['특별자치시', '특별자치도', '광역시', '특별시', '시', '군', '구', '도']) {
    if (name.length > suf.length && name.endsWith(suf)) {
      return romanizeWord(name.slice(0, -suf.length)) + '-' + SUFFIX[suf];
    }
  }
  return romanizeWord(name);
}
// '성남시 분당구'처럼 공백으로 나뉜 복합 지역명도 처리
function romanizeRegion(name) {
  name = String(name || '').trim().replace(/\s+/g, ' ');
  if (!name) return '';
  return name.split(' ').map(romanizeToken).join(' ');
}

module.exports = { romanizeWord, romanizeRegion };
