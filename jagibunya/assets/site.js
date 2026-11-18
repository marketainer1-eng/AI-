/* 자기분야 공통 스크립트: 헤더·푸터, 모바일 메뉴, 전문가 카드 */
window.SITE = {
  newsUrl: "http://jagibunya.news/",
  email: "marketainer1@gmail.com",   // 문의 받을 이메일 (하단, 문의 페이지, 문의 양식에 사용)
  formEndpoint: "",   // 비워 두면 FormSubmit으로 email 주소에 발송. 다른 서비스를 쓰면 그 주소를 넣으세요.
  company: {
    operator: "주식회사 넥서스그룹",
    operatorUrl: "https://nexusgroup1.netlify.app/",
    sponsor: "크리에이터커머스협회",
    ceo: "고아라",
    bizNo: "314-86-66472",
    address: "서울 강남구 테헤란로82길 15 디아이타워 738호"
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

  var logo = '<img src="assets/logo-mark.png" alt="자기분야" width="520" height="177">';
  var links = MENU.map(function (m) {
    return '<a href="' + m[0] + '"' + (m[0] === page ? ' aria-current="page"' : "") + ">" + m[1] + "</a>";
  }).join("");

  var header = document.getElementById("site-header");
  if (header) {
    header.className = "site-header";
    header.innerHTML =
      '<div class="wrap bar">' +
        '<a class="brand" href="index.html" aria-label="자기분야 홈">' + logo + "</a>" +
        '<nav class="gnb" aria-label="주 메뉴">' + links + "</nav>" +
        '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="mnav" aria-label="메뉴 열기">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>' +
      "</div>" +
      '<nav class="mnav wrap" id="mnav" aria-label="모바일 메뉴" hidden>' + links + "</nav>";
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
        '<div class="top"><div><a class="brand" href="index.html">' + logo + '</a><div class="slogan">분야와 분야가 만나는 곳</div></div>' +
          '<nav class="fnav" aria-label="사이트 메뉴">' + MENU.map(function (m) { return '<a href="' + m[0] + '">' + m[1] + "</a>"; }).join("") +
          '<a class="ext" href="' + S.newsUrl + '" target="_blank" rel="noopener">자기분야 뉴스</a></nav></div>' +
        '<div class="legal"><a href="privacy.html">개인정보처리방침</a></div>' +
        "<dl>" +
          "<div><dt>운영</dt><dd>" + (c.operatorUrl ? '<a href="' + esc(c.operatorUrl) + '" target="_blank" rel="noopener">' + esc(c.operator) + " ↗</a>" : esc(c.operator)) + "</dd></div>" +
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
  window.expertAvatar = function (e, cls) {
    return '<span class="avatar' + (cls ? " " + cls : "") + '">' +
      (e.photo ? '<img src="' + esc(e.photo) + '" alt="' + esc(e.name) + ' 사진" loading="lazy">' : esc(e.initial)) + "</span>";
  };
  window.expertStats = function (e) {
    var F = window.EXPERT_FIELDS || {};
    return '<span class="tag">' + esc(F[e.field] || "") + "</span>" +
      (e.years ? '<span class="tag plain">실무 ' + esc(e.years) + "년</span>" : "") +
      (e.lectureYears ? '<span class="tag plain">강의 ' + esc(e.lectureYears) + "년</span>" : "");
  };
  window.expertCard = function (e) {
    var url = "expert.html#" + e.id;
    return '<article class="expert" data-f="' + esc(e.field) + '">' +
      '<a class="top" href="' + url + '">' + window.expertAvatar(e) + "<div>" +
        '<div class="name">' + esc(e.name) + '</div><div class="role">' + esc(e.role) + "</div></div></a>" +
      '<div class="stats">' + window.expertStats(e) + "</div>" +
      '<ul class="topics"><li class="k">강의 분야</li>' + e.topics.slice(0, 3).map(function (t) { return "<li>" + esc(t.title) + "</li>"; }).join("") + "</ul>" +
      '<div class="acts"><a class="btn sm primary" href="' + url + '">프로필 보기</a><a class="btn sm" href="contact.html#lecture-' + esc(e.id) + '">강의 문의</a></div>' +
    "</article>";
  };
})();
