// 📈 GA4 전환 이벤트 — 무엇이 실제로 눌리는지 잰다
//
// ⚠️ 2026-08-11 발견: GA4에 `gtag('config')` 만 있고 **커스텀 이벤트가 0개**였다.
//    「주요 이벤트 0」으로 나오던 이유가 이것이다.
//    상품 매칭을 아무리 손봐도 **클릭이 몇 번인지 모르니 효과를 판정할 수 없었다.**
//    측정이 없으면 앞으로의 모든 판단이 감이 된다.
//
// 설계 원칙
//  ① **마크업을 고치지 않는다.** 문서 전체에 클릭 위임을 걸고 링크의 주소·클래스로 분류한다.
//     링크마다 onclick 을 붙이면 새 페이지를 만들 때마다 빠뜨린다.
//  ② **어디서 눌렸는지**를 같이 남긴다. 「축제 상세에서 눌린 등산스틱」과 「블로그에서 눌린 등산스틱」은
//     전혀 다른 이야기인데, 상품명만 남기면 구분이 안 된다.
//  ③ 외부 링크는 전부 `target="_blank"` 라 페이지가 안 떠난다 → 전송 유실 걱정이 없다.
//
// ⚠️ 커스텀 파라미터(item·merchant·place 등)는 GA4 콘솔에서 **맞춤 측정기준으로 등록해야** 보고서에 뜬다.
//    등록 전에도 이벤트 **건수**는 바로 잡힌다.
'use strict';

const TRACK_JS = `<scr` + `ipt>
(function(){
  if(!window.gtag) return;

  // 이 페이지가 어떤 종류인지 — 같은 상품이라도 어디서 눌렸는지가 중요하다
  function pageKind(){
    var p = location.pathname;
    if(/^\\/(en|ja|es|zh|tw)\\//.test(p)) return 'lang-' + p.split('/')[1];
    if(p.indexOf('/festival/') === 0) return p === '/festival/' ? 'festival-hub' : 'festival-detail';
    if(p.indexOf('/blog/') === 0) return p === '/blog/' ? 'blog-hub' : 'blog-post';
    if(p.indexOf('/course/') === 0) return 'course';
    if(p.indexOf('/trails/') === 0) return 'trails';
    if(p.indexOf('/map/') === 0) return 'map';
    if(p.indexOf('/trend/') === 0) return 'trend';
    if(p.indexOf('/jangteo/') === 0) return 'jangteo';
    if(/^\\/20\\d\\d-\\d\\d\\//.test(p)) return 'month';
    if(p === '/') return 'home';
    return p.replace(/^\\/|\\/$/g,'') || 'other';
  }
  var KIND = pageKind();

  function send(name, params){
    params = params || {};
    params.page_kind = KIND;
    try{ gtag('event', name, params); }catch(e){}
  }
  window.cjmTrack = send;

  // nt_detail=festival-page-chairs → 어느 자리에서 눌렸는지
  function detailOf(href){
    var m = String(href).match(/[?&]nt_detail=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if(!a) return;
    var href = a.getAttribute('href') || '';

    // ── ① 상품 클릭 — 이게 이 사이트의 유일한 매출 동선이다
    var isOwn = href.indexOf('brand.naver.com/guung') >= 0 || href.indexOf('smartstore.naver.com') >= 0;
    var isAff = href.indexOf('coupang.com') >= 0;
    if(isOwn || isAff){
      send('shop_click', {
        merchant: isOwn ? 'own' : 'coupang',
        // data-bb 가 정답이다. 쿠팡 딥링크는 주소에 아무 정보가 없어 이게 없으면 전부 'coupang' 으로 뭉개진다.
        item: a.getAttribute('data-bb') || detailOf(href) || (isAff ? 'coupang' : 'store'),
        slot: a.getAttribute('data-slot') || (a.classList.contains('bb-up') ? 'upsell' : (a.classList.contains('buybox') ? 'main' : 'inline')),
        place: a.getAttribute('data-place') || detailOf(href) || '',
        // ⚠️ 쿠팡 «일반 검색»으로 빠지면 수수료가 0이다. 자사몰 검색은 정상이므로 세지 않는다.
        fallback: (isAff && href.indexOf('coupang.com/np/search') >= 0) ? 1 : 0
      });
      return;
    }

    // ── ② 길찾기 — "가려고 마음먹었다"에 가장 가까운 행동
    if(href.indexOf('map.kakao.com/link') >= 0 || href.indexOf('map.naver.com') >= 0){
      send('map_click', { app: href.indexOf('kakao') >= 0 ? 'kakao' : 'naver' });
      return;
    }

    // ── ③ 축제 상세로 들어감 (모달·허브에서)
    if(href.indexOf('/festival/') === 0 && href !== '/festival/'){
      send('festival_open', { slug: href.replace(/^\\/festival\\/|\\/$/g,'') });
      return;
    }

    // ── ④ 그 밖의 바깥 링크(네이버 검색·공식 홈페이지)
    if(/^https?:\\/\\//.test(href) && href.indexOf(location.host) < 0){
      var host = '';
      try{ host = new URL(href).hostname.replace(/^www\\./,''); }catch(err){}
      send('outbound', { host: host });
    }
  }, true);
})();
</scr` + `ipt>`;

module.exports = { TRACK_JS };
