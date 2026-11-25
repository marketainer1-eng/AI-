/* 자기분야 공통 스크립트: 헤더·푸터, 모바일 메뉴, 전문가 카드·프로필
   - 같은 코드를 브라우저와 정적 페이지 생성(scripts/build-jagibunya.js)에서 함께 씁니다. */
window.SITE = {
  siteUrl: "https://jagibunya.netlify.app",   // 실제 사이트 주소 (도메인을 연결하면 바꾸고 build를 다시 실행)
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

(function (root) {
  var S = root.SITE;
  var MENU = [
    ["about.html", "소개"],
    ["work.html", "하는 일"],
    ["experts.html", "전문가·강사"],
    ["partners.html", "연계 기관"],
    ["contact.html", "문의"]
  ];
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  root.esc = esc;
  var R = root.SITE_RENDER = {};

  var logo = '<img src="assets/logo-mark.png" alt="자기분야" width="520" height="177">';
  function links(page) {
    return MENU.map(function (m) {
      return '<a href="' + m[0] + '"' + (m[0] === page ? ' aria-current="page"' : "") + ">" + m[1] + "</a>";
    }).join("");
  }

  R.header = function (page) {
    return '<div class="wrap bar">' +
        '<a class="brand" href="index.html" aria-label="자기분야 홈">' + logo + "</a>" +
        '<nav class="gnb" aria-label="주 메뉴">' + links(page) + "</nav>" +
        '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="mnav" aria-label="메뉴 열기">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>' +
      "</div>" +
      '<nav class="mnav wrap" id="mnav" aria-label="모바일 메뉴" hidden>' + links(page) + "</nav>";
  };

  R.footer = function (year) {
    var c = S.company;
    return '<div class="wrap">' +
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
        '<p class="copy">Copyright © <span class="cy">' + year + "</span> 자기분야. All rights reserved.</p>" +
      "</div>";
  };

  // 전문가 카드·프로필
  R.expertUrl = function (e) { return "expert-" + e.id + ".html"; };
  R.avatar = function (e, cls) {
    return '<span class="avatar' + (cls ? " " + cls : "") + '">' +
      (e.photo ? '<img src="' + esc(e.photo) + '" alt="' + esc(e.name) + ' 사진" loading="lazy">' : esc(e.initial)) + "</span>";
  };
  R.stats = function (e) {
    var F = root.EXPERT_FIELDS || {};
    return '<span class="tag">' + esc(F[e.field] || "") + "</span>" +
      (e.years ? '<span class="tag plain">실무 ' + esc(e.years) + "년</span>" : "") +
      (e.lectureYears ? '<span class="tag plain">강의 ' + esc(e.lectureYears) + "년</span>" : "");
  };
  R.card = function (e) {
    var url = R.expertUrl(e);
    return '<article class="expert" data-f="' + esc(e.field) + '">' +
      '<a class="top" href="' + url + '">' + R.avatar(e) + "<div>" +
        '<h3 class="name">' + esc(e.name) + '</h3><div class="role">' + esc(e.role) + "</div></div></a>" +
      '<div class="stats">' + R.stats(e) + "</div>" +
      '<ul class="topics"><li class="k">강의 분야</li>' + e.topics.slice(0, 3).map(function (t) { return "<li>" + esc(t.title) + "</li>"; }).join("") + "</ul>" +
      '<div class="acts"><a class="btn sm primary" href="' + url + '">' + esc(e.name) + " 프로필</a>" +
        '<a class="btn sm" href="contact.html#lecture-' + esc(e.id) + '">강의 문의</a></div>' +
    "</article>";
  };
  R.profile = function (e) {
    var F = root.EXPERT_FIELDS || {};
    return R.avatar(e, "lg") + "<div>" +
      '<span class="label">' + esc(F[e.field]) + "</span>" +
      '<h1 class="hl">' + esc(e.name) + "</h1>" +
      '<div class="role">' + esc(e.role) + "</div>" +
      (e.org ? '<div class="p-org">' + esc(e.org) + "</div>" : "") +
      '<div class="stats">' + R.stats(e) + "</div></div>";
  };
  R.detail = function (e) {
    function sec(title, html) { return html ? "<section><h2>" + title + "</h2>" + html + "</section>" : ""; }
    function list(arr, fn) { return arr && arr.length ? arr.map(fn).join("") : ""; }
    var first = e.articles && e.articles[0];
    return "<div>" +
        sec("소개", '<p class="prose" style="margin:0">' + esc(e.summary) + "</p>") +
        sec("강의 분야", list(e.topics, function (t) {
          return '<div class="lecture"><b>' + esc(t.title) + "</b>" + (t.desc ? "<span>" + esc(t.desc) + "</span>" : "") + (t.target ? "<span>대상: " + esc(t.target) + "</span>" : "") + "</div>";
        })) +
        sec("활동 분야", e.activities && e.activities.length ? '<dl class="facts">' + list(e.activities, function (a) {
          return "<dt>" + esc(a[0]) + "</dt><dd>" + esc(a[1]) + "</dd>";
        }) + "</dl>" : "") +
        sec("주요 경력", e.career && e.career.length ? '<ul class="timeline">' + list(e.career, function (c) {
          return '<li><span class="p">' + esc(c[0]) + '</span><span class="t">' + esc(c[1]) + "</span></li>";
        }) + "</ul>" : "") +
        sec("주요 강의·협업 기관", e.orgs && e.orgs.length ? '<div class="org-tags">' + list(e.orgs, function (o) { return "<span>" + esc(o) + "</span>"; }) + "</div>" : "") +
        sec("저서·논문", e.books && e.books.length ? '<ul class="book-list">' + list(e.books, function (b) {
          return '<li><span class="y">' + esc(b[0]) + "</span><span>" + esc(b[1]) + "</span></li>";
        }) + "</ul>" : "") +
        sec("자격·수상", e.credentials && e.credentials.length ? '<ul class="book-list">' + list(e.credentials, function (c) {
          return '<li style="grid-template-columns:1fr"><span>' + esc(c) + "</span></li>";
        }) + "</ul>" : "") +
        sec("학력", e.education && e.education.length ? '<ul class="book-list">' + list(e.education, function (c) {
          return '<li style="grid-template-columns:1fr"><span>' + esc(c) + "</span></li>";
        }) + "</ul>" : "") +
        sec("칼럼·채널", e.articles && e.articles.length ? '<ul class="art-list">' + list(e.articles, function (a) {
          return a.url ? '<li><a href="' + esc(a.url) + '" target="_blank" rel="noopener"><span>' + esc(a.title) + ' ↗</span><span class="k">' + esc(a.kind) + "</span></a></li>"
            : '<li><a><span>' + esc(a.title) + '</span><span class="k">' + esc(a.kind) + "</span></a></li>";
        }) + "</ul>" : "") +
      "</div>" +
      '<aside class="aside-card"><span class="label">강의·자문 요청</span><h3>' + esc(e.name) + " 강사에게 강의를 요청하세요</h3>" +
        "<p>주제, 대상, 일정을 알려 주시면 자기분야가 일정을 조율해 연결해 드립니다.</p>" +
        '<a class="btn primary" href="contact.html#lecture-' + esc(e.id) + '">강의 문의하기</a>' +
        (first && first.url ? '<a class="btn" href="' + esc(first.url) + '" target="_blank" rel="noopener">' + (/칼럼|연재/.test(first.kind) ? "칼럼 읽기" : esc(first.kind) + " 보기") + " ↗</a>" : "") +
      "</aside>";
  };

  // 예전 이름 호환
  root.expertAvatar = R.avatar;
  root.expertStats = R.stats;
  root.expertCard = R.card;

  if (typeof document === "undefined") return;   // 정적 페이지 생성 중이면 여기까지

  var page = document.body.getAttribute("data-page") || "";
  var header = document.getElementById("site-header");
  if (header) {
    if (!header.querySelector(".bar")) header.innerHTML = R.header(page);
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
    if (!footer.querySelector(".wrap")) footer.innerHTML = R.footer(new Date().getFullYear());
    var cy = footer.querySelector(".cy");
    if (cy) cy.textContent = new Date().getFullYear();
  }

  document.querySelectorAll("[data-email]").forEach(function (el) { el.textContent = S.email || "[문의 이메일 입력]"; });
  document.querySelectorAll("a[data-news]").forEach(function (a) { a.href = S.newsUrl; a.target = "_blank"; a.rel = "noopener"; });
})(typeof window !== "undefined" ? window : globalThis);
