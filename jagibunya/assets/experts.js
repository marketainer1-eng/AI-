/* 자기분야가 소개한 전문가·강사 데이터
   - 이 파일 하나만 고치면 홈, 전문가 목록, 전문가 상세 페이지에 모두 반영됩니다.
   - 아래 6명은 예시입니다. 실제 전문가 정보로 바꿔 넣으세요.
   - id: 영문 소문자·숫자·하이픈만 사용 (상세 페이지 주소가 expert.html#id 가 됩니다)
   - field: biz(경영·실무) | craft(기술·제조) | life(생활·건강) | edu(교육·콘텐츠)
   - featured: true 이면 홈 화면에 노출
   - articles[].url: 자기분야 뉴스(jagibunya.news)의 해당 기사 주소 */
window.EXPERTS = [
  {
    id: "logistics", name: "[전문가 이름]", initial: "물", role: "물류·유통 컨설턴트",
    field: "biz", years: 22, featured: true,
    summary: "대형 유통사 물류센터에서 22년간 재고와 출고를 관리했습니다. 지금은 작은 쇼핑몰과 제조사의 물류 구조를 함께 설계합니다.",
    career: ["유통사 물류센터 운영 (15년)", "물류 컨설팅 회사 설립", "자기분야 칼럼 〈현장의 숫자〉 연재"],
    topics: [
      { title: "재고로 읽는 회사의 건강 상태", target: "중소기업 대표, 운영 담당자", length: "90분" },
      { title: "작은 쇼핑몰의 물류 설계", target: "온라인 셀러, 예비 창업자", length: "120분" }
    ],
    articles: [
      { title: "창고에 쌓인 재고는 결국 판단의 기록이다", kind: "칼럼", url: "http://jagibunya.news/" },
      { title: "물류 현장 22년, 재고가 말해주는 것들", kind: "인터뷰", url: "http://jagibunya.news/" }
    ]
  },
  {
    id: "tax", name: "[전문가 이름]", initial: "세", role: "세무사",
    field: "biz", years: 17, featured: false,
    summary: "1인 사업자와 크리에이터의 세무를 17년째 다루고 있습니다. 어려운 세법을 일하는 사람의 언어로 풀어 설명합니다.",
    career: ["세무법인 근무 (8년)", "세무회계 사무소 개업", "자기분야 칼럼 〈작은 사업의 장부〉 연재"],
    topics: [
      { title: "1인 사업자와 크리에이터의 세무", target: "프리랜서, 크리에이터", length: "90분" },
      { title: "창업 첫해에 챙길 장부 정리", target: "예비·초기 창업자", length: "60분" }
    ],
    articles: [
      { title: "크리에이터 수익, 언제부터 사업자인가", kind: "칼럼", url: "http://jagibunya.news/" }
    ]
  },
  {
    id: "quality", name: "[전문가 이름]", initial: "제", role: "품질관리 엔지니어",
    field: "craft", years: 28, featured: true,
    summary: "제조 현장에서 28년간 품질과 안전을 책임졌습니다. 은퇴 후 현장의 경험을 칼럼과 강의로 전하고 있습니다.",
    career: ["제조 대기업 품질관리팀 (20년)", "협력사 품질 지도", "자기분야 칼럼 〈현장 일지〉 연재"],
    topics: [
      { title: "현장에서 배우는 품질 관리", target: "제조업 관리자, 신입 엔지니어", length: "120분" },
      { title: "매뉴얼 밖의 안전 수칙", target: "현장 관리자", length: "90분" }
    ],
    articles: [
      { title: "은퇴가 끝인 줄 알았는데, 경험이 콘텐츠가 됐다", kind: "인터뷰", url: "http://jagibunya.news/" }
    ]
  },
  {
    id: "woodwork", name: "[전문가 이름]", initial: "목", role: "목공방 대표",
    field: "craft", years: 15, featured: false,
    summary: "15년째 공방을 운영하며 가구를 만들고 가르칩니다. 작업 과정을 기록해 공유하는 일로 손님을 만나고 있습니다.",
    career: ["가구 공방 수련 (5년)", "목공방 개업", "목공 클래스 운영"],
    topics: [
      { title: "공예 작업 과정을 콘텐츠로 만들기", target: "공예 작가, 소상공인", length: "90분" },
      { title: "공방 창업과 운영", target: "예비 공방 창업자", length: "120분" }
    ],
    articles: [
      { title: "작업 과정을 글로 남기니 손님이 가격을 묻지 않았다", kind: "인터뷰", url: "http://jagibunya.news/" }
    ]
  },
  {
    id: "nursing", name: "[전문가 이름]", initial: "간", role: "전 수간호사, 전자책 저자",
    field: "life", years: 24, featured: true,
    summary: "종합병원 병동에서 24년간 환자와 보호자를 만났습니다. 칼럼을 묶어 전자책을 펴냈고, 돌봄과 소통을 주제로 강의합니다.",
    career: ["종합병원 병동 간호사·수간호사 (24년)", "전자책 출간", "자기분야 칼럼 연재"],
    topics: [
      { title: "가족 돌봄을 위한 건강 상식", target: "일반 시민, 돌봄 가족", length: "90분" },
      { title: "병동에서 배운 소통법", target: "의료·돌봄 종사자", length: "60분" }
    ],
    articles: [
      { title: "병동에서 배운 것을 칼럼으로 쓰니 후배들이 찾아왔다", kind: "인터뷰", url: "http://jagibunya.news/" }
    ]
  },
  {
    id: "teacher", name: "[전문가 이름]", initial: "교", role: "교사 출신 교육 강사",
    field: "edu", years: 25, featured: false,
    summary: "25년간 교단에 섰습니다. 설명하는 기술과 목차 짜기를 바탕으로 전문가들의 글쓰기와 전자책 만들기를 돕습니다.",
    career: ["중등 교사 (25년)", "교육 콘텐츠 기획", "AI 전자책 쓰기 강의"],
    topics: [
      { title: "설명을 잘하는 사람의 목차 짜기", target: "강의를 준비하는 전문가", length: "90분" },
      { title: "AI로 내 전자책 만들기", target: "누구나", length: "120분" }
    ],
    articles: [
      { title: "좋은 강의는 목차에서 이미 결정된다", kind: "칼럼", url: "http://jagibunya.news/" }
    ]
  }
];

window.EXPERT_FIELDS = { biz: "경영·실무", craft: "기술·제조", life: "생활·건강", edu: "교육·콘텐츠" };
