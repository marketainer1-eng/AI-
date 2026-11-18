/* 자기분야 공통 스크립트: 헤더·푸터, 모바일 메뉴, 전문가 카드 */
window.SITE = {
  newsUrl: "http://jagibunya.news/",
  email: "",            // 문의 받을 이메일 주소를 넣으세요. 예: "contact@example.com"
  company: {
    operator: "주식회사 넥서스그룹",
    sponsor: "크리에이터커머스협회",
    ceo: "[대표자명 입력]",
    bizNo: "[사업자등록번호 입력]",
    address: "[주소 입력]"
  }
};

(function () {
  var S = window.SITE;
  var MENU = [
    ["about.html", "소개"],
    ["work.html", "하는 일"],
    ["experts.html", "전문가·강사"],
    ["partners.html", "연계 기관"],
    ["contact.html", "문의"]
  ];
  var page = document.body.getAttribute("data-page") || "";
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  window.esc = esc;

  var logo = '<svg viewBox="0 0 42 42" aria-hidden="true"><path d="M8 4h9v19a4 4 0 0 0 8 0V4h9v19a13 13 0 0 1-26 0z" fill="var(--accent)"/><rect x="8" y="4" width="9" height="6" fill="var(--ink)"/><rect x="25" y="4" width="9" height="6" fill="var(--ink)"/></svg>';
  var links = MENU.map(function (m) {
    return '<a href="' + m[0] + '"' + (m[0] === page ? ' aria-current="page"' : "") + ">" + m[1] + "</a>";
  }).join("");
  var newsBtn = '<a class="btn sm primary ext" href="' + S.newsUrl + '" target="_blank" rel="noopener">자기분야 뉴스</a>';

  var header = document.getElementById("site-header");
  if (header) {
    header.className = "site-header";
    header.innerHTML =
      '<div class="wrap bar">' +
        '<a class="brand" href="index.html" aria-label="자기분야 홈">' + logo + "<span>자기분야</span></a>" +
        '<nav class="gnb" aria-label="주 메뉴">' + links + "</nav>" + newsBtn +
        '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="mnav" aria-label="메뉴 열기">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>' +
      "</div>" +
      '<nav class="mnav wrap" id="mnav" aria-label="모바일 메뉴" hidden>' + links +
        '<a class="btn primary ext" href="' + S.newsUrl + '" target="_blank" rel="noopener">자기분야 뉴스</a></nav>';
    var btn = header.querySelector(".menu-btn");
    var mnav = header.querySelector("#mnav");
    btn.addEventListener("click", function () {
      var open = mnav.hidden;
      mnav.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    });
  }

  var footer = document.getElementById("site-footer");
  if (footer) {
    var c = S.company;
    footer.className = "site-footer";
    footer.innerHTML =
      '<div class="wrap">' +
        '<div class="top"><a class="brand" href="index.html">' + logo + "<span>자기분야</span></a>" +
          '<nav class="fnav" aria-label="사이트 메뉴">' + MENU.map(function (m) { return '<a href="' + m[0] + '">' + m[1] + "</a>"; }).join("") +
          '<a class="ext" href="' + S.newsUrl + '" target="_blank" rel="noopener">자기분야 뉴스</a></nav></div>' +
        '<div class="legal"><a href="privacy.html">개인정보처리방침</a></div>' +
        "<dl>" +
          "<div><dt>운영</dt><dd>" + esc(c.operator) + "</dd></div>" +
          "<div><dt>후원</dt><dd>" + esc(c.sponsor) + "</dd></div>" +
          "<div><dt>대표자</dt><dd>" + esc(c.ceo) + "</dd></div>" +
          "<div><dt>사업자등록번호</dt><dd>" + esc(c.bizNo) + "</dd></div>" +
          "<div><dt>주소</dt><dd>" + esc(c.address) + "</dd></div>" +
          "<div><dt>이메일</dt><dd>" + esc(S.email || "[이메일 입력]") + "</dd></div>" +
        "</dl>" +
        '<p class="copy">Copyright © ' + new Date().getFullYear() + " 자기분야. All rights reserved.</p>" +
      "</div>";
  }

  document.querySelectorAll("[data-email]").forEach(function (el) { el.textContent = S.email || "[문의 이메일 입력]"; });
  document.querySelectorAll("a[data-news]").forEach(function (a) { a.href = S.newsUrl; a.target = "_blank"; a.rel = "noopener"; });

  // 전문가 카드
  window.expertCard = function (e) {
    var F = window.EXPERT_FIELDS || {};
    var url = "expert.html#" + e.id;
    return '<article class="expert" data-f="' + esc(e.field) + '">' +
      '<a class="top" href="' + url + '"><span class="avatar">' + esc(e.initial) + "</span><div>" +
        '<div class="name">' + esc(e.name) + '</div><div class="role">' + esc(e.role) + "</div></div></a>" +
      '<div class="stats"><span class="tag">' + esc(F[e.field] || "") + '</span><span class="tag plain">경력 ' + esc(e.years) + "년</span></div>" +
      '<ul class="topics"><li class="k">강의 주제</li>' + e.topics.map(function (t) { return "<li>" + esc(t.title) + "</li>"; }).join("") + "</ul>" +
      '<div class="acts"><a class="btn sm primary" href="' + url + '">프로필 보기</a><a class="btn sm" href="contact.html#lecture-' + esc(e.id) + '">강의 문의</a></div>' +
    "</article>";
  };
})();
