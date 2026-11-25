#!/usr/bin/env node
/* 자기분야 홈페이지 정적 생성 스크립트 (검색엔진 노출용)
   사용법: 저장소 루트에서  node scripts/build-jagibunya.js
   하는 일
   1. 모든 페이지의 헤더·푸터, 홈·전문가 목록의 전문가 카드를 HTML에 미리 채움 (자바스크립트 없이도 내용이 보이게)
   2. 전문가마다 정적 페이지 expert-<id>.html 생성 (이름으로 검색되도록)
   3. 각 페이지 <head>에 canonical, 공유 이미지, 구조화 데이터(JSON-LD) 추가
   4. sitemap.xml, robots.txt 생성
   데이터는 jagibunya/assets/experts.js 와 jagibunya/assets/site.js 만 고치면 됩니다. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..", "jagibunya");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const write = (f, s) => fs.writeFileSync(path.join(ROOT, f), s);

// experts.js, site.js 를 브라우저 대신 실행해서 데이터와 렌더링 함수를 가져옴
const ctx = vm.createContext({ console });
ctx.window = ctx;
vm.runInContext(read("assets/experts.js"), ctx);
vm.runInContext(read("assets/site.js"), ctx);
const S = ctx.SITE, R = ctx.SITE_RENDER, EXPERTS = ctx.EXPERTS, esc = ctx.esc;
const BASE = S.siteUrl.replace(/\/$/, "");
const YEAR = new Date().getFullYear();
const TODAY = new Date().toISOString().slice(0, 10);
const abs = (p) => BASE + "/" + (p === "index.html" ? "" : p);
const jsonld = (o) => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, "\\u003c") + "</script>";

const ORG = {
  "@type": "Organization",
  "@id": BASE + "/#org",
  name: "자기분야",
  alternateName: "Jagibunya",
  url: BASE + "/",
  logo: BASE + "/assets/logo-full.png",
  slogan: "분야와 분야가 만나는 곳",
  description: "한 분야를 오래 걸어온 전문가를 칼럼과 인터뷰로 알리고, 강의·출간과 연결하는 전문가 브랜딩 매체",
  email: S.email,
  address: { "@type": "PostalAddress", streetAddress: S.company.address, addressCountry: "KR" },
  parentOrganization: { "@type": "Organization", name: S.company.operator, url: S.company.operatorUrl },
  sponsor: { "@type": "Organization", name: S.company.sponsor },
  sameAs: [S.newsUrl]
};

function seoBlock(file, extra) {
  const url = abs(file);
  const lines = [
    '<link rel="canonical" href="' + url + '">',
    '<meta name="robots" content="index, follow">',
    '<meta property="og:url" content="' + url + '">',
    '<meta property="og:locale" content="ko_KR">',
    '<meta property="og:image" content="' + BASE + '/assets/logo-full.png">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<link rel="icon" href="assets/logo-mark.png">',
    "<!-- 검색엔진 소유 확인 코드를 받으면 아래 주석을 풀고 content에 넣으세요 -->",
    '<!-- <meta name="naver-site-verification" content=""> -->',
    '<!-- <meta name="google-site-verification" content=""> -->'
  ];
  if (extra) lines.push(extra);
  return "<!--seo-->\n" + lines.join("\n") + "\n<!--/seo-->\n";
}
function putSeo(html, file, extra) {
  html = html.replace(/<!--seo-->[\s\S]*?<!--\/seo-->\n?/, "");
  return html.replace("</head>", seoBlock(file, extra) + "</head>");
}
function putChrome(html, page) {
  html = html.replace(/<header id="site-header" class="site-header">[\s\S]*?<\/header>/,
    '<header id="site-header" class="site-header">' + R.header(page) + "</header>");
  html = html.replace(/<footer id="site-footer" class="site-footer">[\s\S]*?<\/footer>/,
    '<footer id="site-footer" class="site-footer">' + R.footer(YEAR) + "</footer>");
  return html;
}
function putBlock(html, name, inner) {
  const re = new RegExp("<!--build:" + name + "-->[\\s\\S]*?<!--/build:" + name + "-->");
  if (!re.test(html)) throw new Error("marker missing: " + name);
  return html.replace(re, "<!--build:" + name + "-->" + inner + "<!--/build:" + name + "-->");
}

// 1) 기존 페이지
const PAGES = ["index.html", "about.html", "work.html", "experts.html", "partners.html", "contact.html", "privacy.html"];
for (const f of PAGES) {
  let html = read(f);
  html = putChrome(html, f);
  let extra = "";
  if (f === "index.html") {
    html = putBlock(html, "featured", EXPERTS.filter((e) => e.featured).slice(0, 3).map(R.card).join(""));
    extra = jsonld({ "@context": "https://schema.org", "@graph": [ORG, { "@type": "WebSite", "@id": BASE + "/#site", name: "자기분야", url: BASE + "/", inLanguage: "ko", publisher: { "@id": BASE + "/#org" } }] });
  }
  if (f === "experts.html") {
    html = putBlock(html, "ex-grid", EXPERTS.map(R.card).join(""));
    extra = jsonld({ "@context": "https://schema.org", "@type": "ItemList", name: "자기분야 전문가·강사",
      itemListElement: EXPERTS.map((e, i) => ({ "@type": "ListItem", position: i + 1, name: e.name + " · " + e.role, url: abs(R.expertUrl(e)) })) });
  }
  if (f === "partners.html" || f === "about.html") extra = jsonld(Object.assign({ "@context": "https://schema.org" }, ORG));
  write(f, putSeo(html, f, extra));
}

// 2) 전문가 개별 페이지
const head = read("experts.html").split("<head>")[1].split("</head>")[0];
const fontLinks = head.match(/<link rel="preconnect"[\s\S]*?assets\/style\.css">/)[0];
const old = fs.readdirSync(ROOT).filter((f) => /^expert-.+\.html$/.test(f));
old.forEach((f) => fs.unlinkSync(path.join(ROOT, f)));

for (const e of EXPERTS) {
  const file = R.expertUrl(e);
  const title = e.name + " · " + e.role + " | 자기분야";
  const desc = (e.name + " " + e.role + ". " + e.summary).replace(/\s+/g, " ").slice(0, 155);
  const others = EXPERTS.filter((x) => x.id !== e.id && x.field === e.field)
    .concat(EXPERTS.filter((x) => x.id !== e.id && x.field !== e.field)).slice(0, 3);
  const person = {
    "@context": "https://schema.org", "@type": "Person",
    name: e.name, jobTitle: e.role, description: e.summary, url: abs(file),
    image: e.photo ? BASE + "/" + e.photo : undefined,
    worksFor: e.org ? e.org.split(" · ").map((n) => ({ "@type": "Organization", name: n })) : undefined,
    knowsAbout: e.topics.map((t) => t.title),
    alumniOf: (e.education || []).map((n) => ({ "@type": "EducationalOrganization", name: n })),
    sameAs: (e.articles || []).map((a) => a.url).filter(Boolean),
    memberOf: { "@id": BASE + "/#org", "@type": "Organization", name: "자기분야" }
  };
  const crumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: BASE + "/" },
    { "@type": "ListItem", position: 2, name: "전문가·강사", item: abs("experts.html") },
    { "@type": "ListItem", position: 3, name: e.name, item: abs(file) }] };
  let html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:site_name" content="자기분야">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="profile">
${fontLinks}
</head>
<body data-page="experts.html">
<header id="site-header" class="site-header"></header>
<main id="main">
<section class="page-head">
  <div class="wrap">
    <nav class="crumbs" aria-label="현재 위치"><a href="index.html">홈</a><span aria-hidden="true">/</span><a href="experts.html">전문가·강사</a><span aria-hidden="true">/</span><span>${esc(e.name)}</span></nav>
    <div class="profile">${R.profile(e)}</div>
  </div>
</section>
<section class="block">
  <div class="wrap detail-grid">${R.detail(e)}</div>
</section>
<section class="block alt">
  <div class="wrap">
    <div class="sec-head"><div><span class="label">다른 전문가</span><h2 class="hl">함께 소개된 전문가</h2></div><a class="more" href="experts.html">전체 보기 →</a></div>
    <div class="ex-grid">${others.map(R.card).join("")}</div>
  </div>
</section>
</main>
<footer id="site-footer" class="site-footer"></footer>
<script src="assets/experts.js"></script>
<script src="assets/site.js"></script>
</body>
</html>
`;
  html = putChrome(html, "experts.html");
  html = putSeo(html, file, jsonld(JSON.parse(JSON.stringify(person))) + "\n" + jsonld(crumbs));
  html = html.replace('<meta property="og:image" content="' + BASE + '/assets/logo-full.png">',
    '<meta property="og:image" content="' + (e.photo ? BASE + "/" + e.photo : BASE + "/assets/logo-full.png") + '">');
  write(file, html);
}

// 3) sitemap.xml, robots.txt
const urls = PAGES.concat(EXPERTS.map(R.expertUrl));
const prio = { "index.html": "1.0", "experts.html": "0.9", "about.html": "0.8", "work.html": "0.8", "partners.html": "0.7", "contact.html": "0.6", "privacy.html": "0.2" };
write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => "  <url><loc>" + abs(u) + "</loc><lastmod>" + TODAY + "</lastmod><priority>" + (prio[u] || "0.8") + "</priority></url>").join("\n") +
  "\n</urlset>\n");
write("robots.txt", "User-agent: *\nAllow: /\n\nSitemap: " + BASE + "/sitemap.xml\n");

console.log("built " + PAGES.length + " pages + " + EXPERTS.length + " expert pages, sitemap " + urls.length + " urls → " + BASE);
