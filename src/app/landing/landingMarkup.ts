// 이 파일은 원본 랜딩페이지(index.html)의 <body> 내용을 그대로 옮긴 것입니다.
// 수정 시 디자인 원본과의 동기화에 유의하세요.
export const landingMarkup = `

  <!-- ============================================================
       NAVBAR
  ============================================================ -->
  <nav class="navbar" id="navbar">
    <div class="nav-inner container">
      <a href="#" class="nav-logo">
        <svg class="nav-logo-svg" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 원형 궤도 심볼 -->
          <circle cx="18" cy="18" r="4" fill="#00c8ff" opacity="0.9"/>
          <ellipse cx="18" cy="18" rx="14" ry="6" stroke="#00c8ff" stroke-width="1.5" fill="none" opacity="0.8"/>
          <ellipse cx="18" cy="18" rx="14" ry="6" stroke="#00c8ff" stroke-width="1.5" fill="none" opacity="0.8" transform="rotate(60 18 18)"/>
          <ellipse cx="18" cy="18" rx="14" ry="6" stroke="#00c8ff" stroke-width="1.5" fill="none" opacity="0.8" transform="rotate(120 18 18)"/>
          <circle cx="18" cy="4"  r="1.8" fill="#00c8ff"/>
          <circle cx="30" cy="11" r="1.8" fill="#00c8ff"/>
          <circle cx="30" cy="25" r="1.8" fill="#00c8ff"/>
          <circle cx="18" cy="32" r="1.8" fill="#00c8ff"/>
          <circle cx="6"  cy="25" r="1.8" fill="#00c8ff"/>
          <circle cx="6"  cy="11" r="1.8" fill="#00c8ff"/>
        </svg>
        <span class="nav-logo-text">KAIA
          <span class="nav-logo-sub">AI에이전트협회</span>
        </span>
      </a>
      <ul class="nav-links">
        <li><a href="#intro">과정소개</a></li>
        <li><a href="#roadmap">학습로드맵</a></li>
        <li><a href="#industry">산업적용</a></li>
        <li><a href="#qualification">자격연계</a></li>
        <li><a href="#faq">FAQ</a></li>
        <li><a href="#cta" class="nav-cta-btn">상담 신청</a></li>
      </ul>
      <button class="hamburger" id="hamburger" aria-label="메뉴 열기">
        <span></span><span></span><span></span>
      </button>
    </div>
    <div class="mobile-menu" id="mobileMenu">
      <a href="#intro">과정소개</a>
      <a href="#roadmap">학습로드맵</a>
      <a href="#industry">산업적용</a>
      <a href="#qualification">자격연계</a>
      <a href="#faq">FAQ</a>
      <a href="#cta" class="mobile-cta">상담 신청</a>
    </div>
  </nav>

  <main>

    <!-- ============================================================
         SECTION 1 · 히어로
    ============================================================ -->
    <section class="hero" id="hero">
      <div class="hero-bg-grid"></div>
      <div class="hero-particles" id="heroParticles"></div>
      <div class="container hero-inner">

        <div class="hero-badges" data-aos="fade-down">
          <span class="badge badge-accent"><i class="fas fa-certificate"></i> 국가공인 자격 연계</span>
          <span class="badge badge-outline"><i class="fas fa-briefcase"></i> 컨설턴트 확장 가능</span>
          <span class="badge badge-outline"><i class="fas fa-chalkboard-teacher"></i> 강사 활동 확장 가능</span>
          <span class="badge badge-outline"><i class="fas fa-industry"></i> 산업별 실전 사례</span>
          <span class="badge badge-glow"><i class="fas fa-robot"></i> AI 사용자 → AI 에이전트 설계자</span>
        </div>

        <div class="hero-content" data-aos="fade-up">
          <p class="hero-eyebrow">KAIA AI에이전트협회 (AI Agent Association) · 단독 과정</p>
          <h1 class="hero-headline">
            <span class="line-highlight">AI 에이전트를 활용한</span>
            <span class="line-normal">데이터 분석 및</span>
            <span class="line-normal">마케팅 분석 과정</span>
          </h1>
          <p class="hero-sub">
            숨가쁘게 AI를 뒤쫓아가는 사용자로 남을 것인가,<br />
            <strong>24/7 내가 지시한 대로 움직이는 천재 부하직원 같은 AI 에이전트를 설계하는 사람이 될 것인가.</strong>
          </p>
          <p class="hero-desc">
            데이터 분석 · 고객 분석 · 캠페인 분석 · 인사이트 도출 · 마케팅 실행 · 성과 측정 ·
            멀티에이전트 오케스트레이션까지 — 하나의 실전 흐름으로 연결됩니다.
            국가공인 자격 연계 · 컨설턴트 및 강사 활동 확장 가능.
          </p>

          <div class="hero-toolkit-badges">
            <span><i class="fas fa-file-alt"></i> 프롬프트 50선</span>
            <span><i class="fas fa-project-diagram"></i> 워크플로우 20선</span>
            <span><i class="fas fa-industry"></i> 9개 산업 실전 사례</span>
          </div>

          <div class="hero-cta-group">
            <a href="#cta" class="btn btn-primary btn-xl">
              <i class="fas fa-arrow-right"></i> 강사 인증 문의하기
            </a>
            <a href="#intro" class="btn btn-ghost btn-xl">
              과정 상세 보기 <i class="fas fa-chevron-down"></i>
            </a>
          </div>
        </div>

        <div class="hero-stat-row" data-aos="fade-up" data-aos-delay="200">
          <div class="hero-stat">
            <strong>9+</strong>
            <span>산업별 실전 사례</span>
          </div>
          <div class="hero-stat-divider"></div>
          <div class="hero-stat">
            <strong>50+</strong>
            <span>실전 프롬프트</span>
          </div>
          <div class="hero-stat-divider"></div>
          <div class="hero-stat">
            <strong>20+</strong>
            <span>워크플로우 템플릿</span>
          </div>
          <div class="hero-stat-divider"></div>
          <div class="hero-stat">
            <strong>7단계</strong>
            <span>체계적 학습 로드맵</span>
          </div>
        </div>

      </div>
    </section>

    <!-- ============================================================
         SECTION 2 · 과정 소개
    ============================================================ -->
    <section class="section section-dark" id="intro">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <p class="section-eyebrow">과정 소개</p>
          <h2 class="section-title">숫자를 읽는 것과<br /><span class="text-accent">성과를 만드는 것은 다릅니다</span></h2>
          <p class="section-sub">
            AI가 숫자를 뽑아준다고 해서 인사이트가 자동으로 나오지 않습니다.<br />
            중요한 것은 "무슨 일이 일어났는가"를 넘어 <strong>"왜 그 일이 일어났는가"를 해석하고 액션으로 연결하는 구조</strong>입니다.
          </p>
        </div>

        <div class="intro-cards" data-aos="fade-up" data-aos-delay="100">
          <div class="intro-card">
            <div class="intro-card-icon"><i class="fas fa-times-circle icon-red"></i></div>
            <h3>기존 강의의 한계</h3>
            <ul>
              <li>툴 사용법만 가르치고 끝난다</li>
              <li>분석과 실행이 분리된 채 진행된다</li>
              <li>데이터는 있지만 성과로 연결되지 않는다</li>
              <li>AI를 단순 생성 도구로만 다룬다</li>
            </ul>
          </div>
          <div class="intro-card intro-card-divider">
            <div class="intro-divider-icon"><i class="fas fa-arrow-right"></i></div>
          </div>
          <div class="intro-card intro-card-featured">
            <div class="intro-card-icon"><i class="fas fa-check-circle icon-green"></i></div>
            <h3>이 과정이 다른 이유</h3>
            <ul>
              <li>데이터 분석 → 인사이트 → 실행 → 성과 측정이 하나의 흐름으로 연결</li>
              <li>AI 에이전트 관점에서 데이터와 마케팅의 단절을 구조적으로 해결</li>
              <li>"무엇을 했는가"가 아니라 "왜 그 일이 일어났는가"를 해석하는 사람을 만든다</li>
              <li>AI 사용자가 아닌 AI 에이전트 설계자를 양성하는 실전 과정</li>
            </ul>
          </div>
        </div>

        <div class="highlight-box" data-aos="fade-up" data-aos-delay="200">
          <i class="fas fa-lightbulb"></i>
          <p>
            이 과정은 단순 기술 교육이 아닙니다.<br />
            <strong>데이터와 마케팅의 간극을 AI 에이전트 구조로 메우고,<br />
            분석 결과를 실제 실행과 성과 개선까지 연결하는 실전형 프로그램</strong>입니다.
          </p>
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION 3 · 왜 지금인가
    ============================================================ -->
    <section class="section section-light" id="why">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <p class="section-eyebrow">왜 지금인가</p>
          <h2 class="section-title">"사용자"와 "설계자" 사이,<br /><span class="text-accent">그 차이가 이미 현장에서 벌어지고 있습니다</span></h2>
        </div>

        <div class="why-grid" data-aos="fade-up" data-aos-delay="100">
          <div class="why-card">
            <div class="why-num">01</div>
            <h4>AI를 쓰는 것만으로는 더 이상 차별점이 없습니다</h4>
            <p>아직도 많은 사람들이 AI를 단순 생성 도구로만 사용합니다. 하지만 실무 현장에서는 이미 "사용자"보다 "설계자"가 더 큰 차이를 만들고 있습니다.</p>
          </div>
          <div class="why-card">
            <div class="why-num">02</div>
            <h4>분석이 실행으로 연결되지 않으면 데이터는 보고서로 끝납니다</h4>
            <p>데이터를 분석하고도 액션이 나오지 않는 조직이 대부분입니다. 문제는 데이터가 없는 것이 아니라, 데이터와 실행을 연결하는 구조가 없기 때문입니다.</p>
          </div>
          <div class="why-card">
            <div class="why-num">03</div>
            <h4>마케팅 성과가 나오지 않는 진짜 이유</h4>
            <p>마케팅이 성과로 이어지지 않는 이유는 데이터가 없어서가 아닙니다. <strong>데이터와 실행을 연결하는 구조가 없기 때문</strong>입니다. AI 에이전트는 바로 그 구조를 만들기 위한 가장 강력한 실무 도구입니다.</p>
          </div>
          <div class="why-card">
            <div class="why-num">04</div>
            <h4>매번 지시하는 사람 vs. 시스템을 설계하는 사람</h4>
            <p>매번 AI에게 지시해야 하는 사람이 아니라, 지침을 주면 알아서 일하는 시스템을 설계하는 사람이 되어야 합니다. 이제 데이터 분석과 마케팅은 툴을 다루는 문제가 아니라 <strong>시스템을 설계하는 문제</strong>입니다.</p>
          </div>
          <div class="why-card why-card-wide">
            <div class="why-num">05</div>
            <h4>지금이 진입 시점입니다</h4>
            <p>멀티에이전트 오케스트레이션, 분석 에이전트 설계, 마케팅 자동화 시스템 — 이것들은 더 이상 개발자만의 영역이 아닙니다. 이 과정은 비개발자도 현장에서 바로 활용할 수 있도록 설계되어 있습니다. 지금 시작하지 않으면 격차는 계속 벌어집니다.</p>
          </div>
        </div>

        <div class="urgency-banner" data-aos="zoom-in" data-aos-delay="200">
          <p>
            <span class="text-accent"><i class="fas fa-exclamation-triangle"></i> 냉정하게 말씀드립니다.</span><br />
            AI를 쓰는 것 자체가 경쟁력이었던 시대는 이미 지났습니다.<br />
            <strong>지금 필요한 것은 AI를 '어떻게 시스템으로 설계하는가'의 능력입니다.</strong>
          </p>
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION 4 · AI 에이전트의 진실
    ============================================================ -->
    <section class="section section-dark" id="truth">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <p class="section-eyebrow">AI 에이전트의 진실</p>
          <h2 class="section-title">환상과 실제 사이 —<br /><span class="text-accent">아무도 말해주지 않는 것들</span></h2>
          <p class="section-sub">
            AI를 무조건 찬양하는 기술 전도사가 되는 과정이 아닙니다.<br />
            환상을 걷어내는 것이 실전으로 가는 시작입니다.
          </p>
        </div>

        <div class="truth-grid" data-aos="fade-up" data-aos-delay="100">
          <div class="truth-card">
            <div class="truth-icon"><i class="fas fa-not-equal"></i></div>
            <h4>생성형 AI ≠ 자동화 ≠ AI 에이전트</h4>
            <p>세 가지는 완전히 다른 개념입니다. 혼동하면 잘못된 도구를 잘못된 방식으로 쓰게 됩니다. 이 과정에서 가장 먼저 정리합니다.</p>
          </div>
          <div class="truth-card">
            <div class="truth-icon"><i class="fas fa-theater-masks"></i></div>
            <h4>데모와 실무 사이에는 큰 간극이 있습니다</h4>
            <p>발표장에서 멋지게 동작하던 AI가 실제 현장 데이터 앞에서 무너지는 경우는 흔합니다. 우리는 데모가 아니라 실무를 이야기합니다.</p>
          </div>
          <div class="truth-card">
            <div class="truth-icon"><i class="fas fa-skull-crossbones"></i></div>
            <h4>그럴듯한 오답이 더 위험합니다</h4>
            <p>환각(Hallucination), 품질 불안정, 그럴듯한 오답을 거르지 못하면 오히려 현장을 망칩니다. 검수 구조 설계가 필수인 이유입니다.</p>
          </div>
          <div class="truth-card">
            <div class="truth-icon"><i class="fas fa-eye-slash"></i></div>
            <h4>자동화에 중독되면 판단을 놓칩니다</h4>
            <p>자동화에 의존하다 사람이 판단을 놓치는 순간이 반드시 옵니다. 어디서 사람이 개입해야 하는지 설계하는 것이 핵심입니다.</p>
          </div>
          <div class="truth-card">
            <div class="truth-icon"><i class="fas fa-shield-alt"></i></div>
            <h4>비용·보안·저작권·데이터 거버넌스</h4>
            <p>처음부터 함께 고려하지 않으면 나중에 훨씬 비싼 대가를 치릅니다. 이 과정은 실전의 그늘까지 다룹니다.</p>
          </div>
          <div class="truth-card truth-card-highlight">
            <div class="truth-icon"><i class="fas fa-compass"></i></div>
            <h4>그래서 이 과정이 필요합니다</h4>
            <p>환상이 아니라 현실을 직시하는 시각, 그 위에서 제대로 설계하는 능력 — 이것이 이 과정이 만드는 사람입니다.</p>
          </div>
        </div>

        <div class="truth-quote" data-aos="fade-up" data-aos-delay="200">
          <blockquote>
            "AI 에이전트를 잘 쓰는 사람이란,<br />
            AI를 잘 아는 사람이 아니라<br />
            <strong>AI가 잘못될 수 있는 지점을 설계로 막는 사람</strong>입니다."
          </blockquote>
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION 5 · 핵심 학습 로드맵
    ============================================================ -->
    <section class="section section-light" id="roadmap">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <p class="section-eyebrow">핵심 학습 로드맵</p>
          <h2 class="section-title">7단계 실전 설계 커리큘럼<br /><span class="text-accent">개념에서 산업 현장까지, 하나의 흐름으로</span></h2>
          <p class="section-sub">단계별로 쌓이고, 마지막에 하나의 실전 시스템이 완성됩니다.</p>
        </div>

        <div class="roadmap-container" data-aos="fade-up" data-aos-delay="100">

          <div class="roadmap-step">
            <div class="roadmap-step-head">
              <span class="roadmap-tag tag-blue">STEP 1</span>
              <h3>WHY + HOW — AI 에이전트 개념 정립</h3>
            </div>
            <div class="roadmap-step-body">
              <div class="roadmap-item"><i class="fas fa-check"></i> AI 에이전트 개념과 구조</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> 생성형 AI와 에이전트의 결정적 차이</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> 가능한 일 / 불가능한 일의 경계</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> 실패 패턴 이해와 리스크 설계</div>
            </div>
          </div>

          <div class="roadmap-connector"><i class="fas fa-chevron-down"></i></div>

          <div class="roadmap-step">
            <div class="roadmap-step-head">
              <span class="roadmap-tag tag-teal">STEP 2</span>
              <h3>DATA — 산업별 데이터 구조 이해</h3>
            </div>
            <div class="roadmap-step-body">
              <div class="roadmap-item"><i class="fas fa-check"></i> 산업별 데이터 구조 이해</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> 데이터 수집 및 전처리</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> 퍼널 · 전환 · 재구매 · 이탈 데이터 구조</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> 실무 데이터 품질 관리</div>
            </div>
          </div>

          <div class="roadmap-connector"><i class="fas fa-chevron-down"></i></div>

          <div class="roadmap-step">
            <div class="roadmap-step-head">
              <span class="roadmap-tag tag-purple">STEP 3</span>
              <h3>INSIGHT — 인사이트 도출 및 액션 연결</h3>
            </div>
            <div class="roadmap-step-body">
              <div class="roadmap-item"><i class="fas fa-check"></i> 고객 세분화 분석</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> 고객 이탈 예측</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> 캠페인 성과 분석</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> 인사이트 → 가설 → 액션 연결 구조</div>
            </div>
          </div>

          <div class="roadmap-connector"><i class="fas fa-chevron-down"></i></div>

          <div class="roadmap-step roadmap-step-featured">
            <div class="roadmap-step-head">
              <span class="roadmap-tag tag-orange">STEP 4</span>
              <h3>AGENT DESIGN — 에이전트 설계 핵심</h3>
              <span class="roadmap-badge">핵심</span>
            </div>
            <div class="roadmap-step-body">
              <div class="roadmap-item"><i class="fas fa-check"></i> 에이전트 작동 원리 (입력→판단→실행→검증)</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> 단일 에이전트 vs. 멀티에이전트</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> 리서치 에이전트 / 분석 에이전트 / 실행 에이전트</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> 오케스트레이션 설계 전략</div>
            </div>
          </div>

          <div class="roadmap-connector"><i class="fas fa-chevron-down"></i></div>

          <div class="roadmap-step">
            <div class="roadmap-step-head">
              <span class="roadmap-tag tag-red">STEP 5</span>
              <h3>EXECUTION — 실행과 성과 측정</h3>
            </div>
            <div class="roadmap-step-body">
              <div class="roadmap-item"><i class="fas fa-check"></i> 카피 · 콘텐츠 · SNS · 광고 실행</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> KPI 자동 추적 및 이상값 감지</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> A/B 테스트 설계와 해석</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> 성과 재학습 및 개선 사이클</div>
            </div>
          </div>

          <div class="roadmap-connector"><i class="fas fa-chevron-down"></i></div>

          <div class="roadmap-step">
            <div class="roadmap-step-head">
              <span class="roadmap-tag tag-green">STEP 6</span>
              <h3>INDUSTRY — 산업별 실전 적용</h3>
            </div>
            <div class="roadmap-step-body">
              <div class="roadmap-item"><i class="fas fa-check"></i> 금융 · 통신 · 헬스케어 (규제 산업 특수 설계)</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> 유통 · 이커머스 · 식품</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> 제조 · 물류 · 공공</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> 산업별 데이터 구조 차이와 에이전트 설계 변형</div>
            </div>
          </div>

          <div class="roadmap-connector"><i class="fas fa-chevron-down"></i></div>

          <div class="roadmap-step">
            <div class="roadmap-step-head">
              <span class="roadmap-tag tag-yellow">STEP 7</span>
              <h3>TOOLKIT — 비개발자 실전 툴킷</h3>
            </div>
            <div class="roadmap-step-body">
              <div class="roadmap-item"><i class="fas fa-check"></i> 비개발자 프롬프트 50선</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> 노코드 실전 워크플로우 20선</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> 데이터 흐름도 및 점검 루틴</div>
              <div class="roadmap-item"><i class="fas fa-check"></i> 월요일부터 바로 적용하는 실전 액션 구조</div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION 6 · 데이터와 마케팅이 연결되지 않는 이유
    ============================================================ -->
    <section class="section section-dark" id="gap">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <p class="section-eyebrow">근본 문제 진단</p>
          <h2 class="section-title">데이터는 있는데<br /><span class="text-accent">왜 성과가 없을까요?</span></h2>
          <p class="section-sub">
            퍼널 데이터를 보고도, 전환율을 분석하고도, 이탈 구간을 알면서도<br />
            아무것도 바뀌지 않는 이유는 하나입니다 — <strong>연결 구조가 없기 때문입니다.</strong>
          </p>
        </div>

        <div class="gap-flow" data-aos="fade-up" data-aos-delay="100">
          <div class="gap-node gap-problem">
            <i class="fas fa-database"></i>
            <span>데이터 수집</span>
          </div>
          <div class="gap-arrow broken"><i class="fas fa-times"></i></div>
          <div class="gap-node gap-problem">
            <i class="fas fa-chart-bar"></i>
            <span>분석 완료</span>
          </div>
          <div class="gap-arrow broken"><i class="fas fa-times"></i></div>
          <div class="gap-node gap-problem">
            <i class="fas fa-file-alt"></i>
            <span>보고서 작성</span>
          </div>
          <div class="gap-arrow broken"><i class="fas fa-times"></i></div>
          <div class="gap-node gap-dead">
            <i class="fas fa-inbox"></i>
            <span>서랍 속 보고서</span>
          </div>
        </div>

        <div class="gap-vs" data-aos="fade-up" data-aos-delay="150">
          <span class="vs-label">VS</span>
        </div>

        <div class="gap-flow gap-flow-good" data-aos="fade-up" data-aos-delay="200">
          <div class="gap-node gap-good">
            <i class="fas fa-database"></i>
            <span>데이터 수집</span>
          </div>
          <div class="gap-arrow good"><i class="fas fa-check"></i></div>
          <div class="gap-node gap-good">
            <i class="fas fa-robot"></i>
            <span>에이전트 분석</span>
          </div>
          <div class="gap-arrow good"><i class="fas fa-check"></i></div>
          <div class="gap-node gap-good">
            <i class="fas fa-lightbulb"></i>
            <span>인사이트 도출</span>
          </div>
          <div class="gap-arrow good"><i class="fas fa-check"></i></div>
          <div class="gap-node gap-good">
            <i class="fas fa-rocket"></i>
            <span>실행 & 성과</span>
          </div>
        </div>

        <div class="gap-cards" data-aos="fade-up" data-aos-delay="250">
          <div class="gap-reason-card">
            <i class="fas fa-unlink"></i>
            <h4>분석팀과 실행팀이 분리되어 있습니다</h4>
            <p>분석 결과가 실행 조직에 전달되지 않거나, 전달되어도 의사결정으로 이어지지 않는 구조적 문제입니다.</p>
          </div>
          <div class="gap-reason-card">
            <i class="fas fa-question-circle"></i>
            <h4>숫자를 봐도 액션이 나오지 않습니다</h4>
            <p>전환율 3% → 무엇을 해야 하는가? 이 질문에 답하는 구조, 즉 인사이트 → 가설 → 액션 연결이 없으면 분석은 멈춥니다.</p>
          </div>
          <div class="gap-reason-card">
            <i class="fas fa-hourglass-half"></i>
            <h4>데이터가 너무 늦게 도착합니다</h4>
            <p>캠페인이 끝난 후 분석이 시작되는 구조에서는 개선이 불가능합니다. 실시간 감지와 빠른 피드백 루프가 필요합니다.</p>
          </div>
        </div>

        <div class="highlight-box highlight-box-accent" data-aos="fade-up" data-aos-delay="300">
          <i class="fas fa-tools"></i>
          <p>
            이 과정은 바로 그 단절을 메우는 <strong>실무 설계법</strong>을 다룹니다.<br />
            퍼널, 전환, 재구매, 이탈 데이터를 읽는 것에서 끝나지 않고,<br />
            <strong>실행까지 연결되는 AI 에이전트 구조를 설계하는 법</strong>을 배웁니다.
          </p>
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION 7 · AI 에이전트가 일하는 방식
    ============================================================ -->
    <section class="section section-light" id="howagent">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <p class="section-eyebrow">에이전트 작동 원리</p>
          <h2 class="section-title">AI 에이전트는<br /><span class="text-accent">이렇게 일합니다</span></h2>
          <p class="section-sub">
            좋은 AI는 말을 잘 듣는 도구가 아니라,<br />
            <strong>좋은 구조 안에서 움직이는 시스템입니다.</strong>
          </p>
        </div>

        <div class="agent-flow" data-aos="fade-up" data-aos-delay="100">
          <div class="agent-step">
            <div class="agent-step-num">1</div>
            <div class="agent-step-icon"><i class="fas fa-inbox"></i></div>
            <h4>입력(Input)</h4>
            <p>데이터, 명령, 컨텍스트, 외부 정보를 수신합니다</p>
          </div>
          <div class="agent-arrow"><i class="fas fa-long-arrow-alt-right"></i></div>
          <div class="agent-step">
            <div class="agent-step-num">2</div>
            <div class="agent-step-icon"><i class="fas fa-brain"></i></div>
            <h4>판단(Reasoning)</h4>
            <p>컨텍스트와 구조 안에서 무엇을 할지 결정합니다</p>
          </div>
          <div class="agent-arrow"><i class="fas fa-long-arrow-alt-right"></i></div>
          <div class="agent-step">
            <div class="agent-step-num">3</div>
            <div class="agent-step-icon"><i class="fas fa-cogs"></i></div>
            <h4>실행(Action)</h4>
            <p>툴을 호출하고 워크플로우를 따라 실제 작업을 수행합니다</p>
          </div>
          <div class="agent-arrow"><i class="fas fa-long-arrow-alt-right"></i></div>
          <div class="agent-step agent-step-human">
            <div class="agent-step-num">4</div>
            <div class="agent-step-icon"><i class="fas fa-user-check"></i></div>
            <h4>검증(Human-in-loop)</h4>
            <p>사람의 검수가 반드시 필요한 구간 — 이 설계가 핵심입니다</p>
          </div>
        </div>

        <div class="agent-insights" data-aos="fade-up" data-aos-delay="150">
          <div class="agent-insight-card">
            <i class="fas fa-layer-group"></i>
            <h4>프롬프트보다 중요한 것</h4>
            <p>컨텍스트와 구조입니다. 아무리 좋은 프롬프트도 잘못된 구조 안에서는 일관된 결과를 낼 수 없습니다.</p>
          </div>
          <div class="agent-insight-card">
            <i class="fas fa-plug"></i>
            <h4>툴 연결과 워크플로우</h4>
            <p>에이전트는 혼자 작동하지 않습니다. 어떤 툴과 연결하고, 어떤 순서로 작동시키는지가 설계의 핵심입니다.</p>
          </div>
          <div class="agent-insight-card">
            <i class="fas fa-sitemap"></i>
            <h4>단일 vs. 멀티에이전트</h4>
            <p>단일 에이전트의 한계를 이해하고, 언제 멀티에이전트 구조가 필요한지 판단할 수 있어야 합니다.</p>
          </div>
          <div class="agent-insight-card">
            <i class="fas fa-tasks"></i>
            <h4>업무 설계의 중요성</h4>
            <p>에이전트에게 무엇을 시킬 것인지 명확히 정의하는 것 — 이것이 AI 활용 능력의 본질입니다.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION 8 · 고객 분석·캠페인 분석·인사이트 전환
    ============================================================ -->
    <section class="section section-dark" id="analysis">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <p class="section-eyebrow">핵심 분석 역량</p>
          <h2 class="section-title">숫자를 인사이트로,<br /><span class="text-accent">인사이트를 의사결정으로</span></h2>
          <p class="section-sub">
            "무슨 일이 일어났는가"와 "왜 그 일이 일어났는가"를 구분하는 힘.<br />
            이것이 분석가와 설계자의 결정적 차이입니다.
          </p>
        </div>

        <div class="analysis-tabs" data-aos="fade-up" data-aos-delay="100">
          <div class="tab-buttons">
            <button class="tab-btn active" data-tab="customer">고객 분석</button>
            <button class="tab-btn" data-tab="campaign">캠페인 분석</button>
            <button class="tab-btn" data-tab="insight">인사이트 전환</button>
          </div>

          <div class="tab-content active" id="tab-customer">
            <div class="tab-grid">
              <div class="tab-card">
                <i class="fas fa-users-cog"></i>
                <h4>고객 세분화 에이전트</h4>
                <p>RFM(구매 빈도·금액·최근성) 기반 세분화, CLV 분석, 행동 기반 세그먼트를 에이전트가 자동으로 분류합니다.</p>
              </div>
              <div class="tab-card">
                <i class="fas fa-user-times"></i>
                <h4>고객 이탈 예측</h4>
                <p>이탈 징후 데이터를 실시간 감지하고, 위험 고객군을 우선순위화하여 선제적 리텐션 액션을 설계합니다.</p>
              </div>
              <div class="tab-card">
                <i class="fas fa-fingerprint"></i>
                <h4>행동 기반 세그먼트</h4>
                <p>클릭, 탐색 경로, 구매 패턴, 시간대별 행동을 분석해 초정밀 타깃 세그먼트를 만듭니다.</p>
              </div>
            </div>
          </div>

          <div class="tab-content" id="tab-campaign">
            <div class="tab-grid">
              <div class="tab-card">
                <i class="fas fa-chart-line"></i>
                <h4>성과 지표 해석</h4>
                <p>클릭률, 전환율, CPA, ROAS를 단순 집계가 아니라 원인 진단의 관점에서 해석하는 구조를 배웁니다.</p>
              </div>
              <div class="tab-card">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>성과 하락 원인 진단</h4>
                <p>갑작스러운 ROAS 하락, 전환율 감소의 원인을 에이전트가 자동으로 추적하고 가설을 제시합니다.</p>
              </div>
              <div class="tab-card">
                <i class="fas fa-flask"></i>
                <h4>A/B 테스트 설계</h4>
                <p>가설 설정 → 테스트 설계 → 결과 해석 → 다음 액션까지, 캠페인 개선 사이클을 에이전트와 함께 설계합니다.</p>
              </div>
            </div>
          </div>

          <div class="tab-content" id="tab-insight">
            <div class="tab-grid">
              <div class="tab-card">
                <i class="fas fa-lightbulb"></i>
                <h4>WHY 분석</h4>
                <p>"전환율이 3%다"가 아니라 "왜 3%인가, 어떤 구간에서 이탈하는가, 어떤 고객군이 전환하는가"를 답합니다.</p>
              </div>
              <div class="tab-card">
                <i class="fas fa-file-signature"></i>
                <h4>인사이트 → 의사결정 문서</h4>
                <p>분석 결과를 이해관계자가 바로 액션할 수 있는 의사결정 문서 형태로 구조화하는 법을 배웁니다.</p>
              </div>
              <div class="tab-card">
                <i class="fas fa-sync-alt"></i>
                <h4>피드백 루프 설계</h4>
                <p>인사이트 → 가설 → 실행 → 측정 → 재학습의 사이클이 자동으로 돌아가는 구조를 설계합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION 9 · 멀티에이전트 오케스트레이션
    ============================================================ -->
    <section class="section section-light" id="multiagent">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <p class="section-eyebrow">멀티에이전트 오케스트레이션</p>
          <h2 class="section-title">천재 부하직원 한 명이 아니라,<br /><span class="text-accent">유능한 팀을 설계하는 사람</span></h2>
          <p class="section-sub">
            단일 AI 활용을 넘어서, 에이전트들이 협업하는 시스템을 설계합니다.<br />
            이것이 실제 마케팅 자동화의 수준입니다.
          </p>
        </div>

        <div class="orchestra-visual" data-aos="fade-up" data-aos-delay="100">
          <div class="orch-center">
            <div class="orch-human">
              <i class="fas fa-user-tie"></i>
              <span>설계자 (당신)</span>
              <small>최종 의사결정자</small>
            </div>
          </div>
          <div class="orch-agents">
            <div class="orch-agent orch-agent-1">
              <i class="fas fa-search"></i>
              <h4>리서치 에이전트</h4>
              <p>시장 조사, 경쟁사 분석, 트렌드 수집</p>
            </div>
            <div class="orch-agent orch-agent-2">
              <i class="fas fa-chart-pie"></i>
              <h4>분석 에이전트</h4>
              <p>데이터 처리, 패턴 발견, 인사이트 생성</p>
            </div>
            <div class="orch-agent orch-agent-3">
              <i class="fas fa-pencil-alt"></i>
              <h4>카피라이팅 에이전트</h4>
              <p>카피 생성, 톤앤매너 유지, 다변량 소재 제작</p>
            </div>
            <div class="orch-agent orch-agent-4">
              <i class="fas fa-paint-brush"></i>
              <h4>브랜드북 AI</h4>
              <p>브랜드 가이드 준수, 크리에이티브 일관성 유지</p>
            </div>
            <div class="orch-agent orch-agent-5">
              <i class="fas fa-shield-alt"></i>
              <h4>검수 에이전트</h4>
              <p>오류 감지, 정책 검토, 품질 게이트</p>
            </div>
            <div class="orch-agent orch-agent-6">
              <i class="fas fa-rocket"></i>
              <h4>실행 에이전트</h4>
              <p>캠페인 집행, 스케줄링, 성과 모니터링</p>
            </div>
          </div>
        </div>

        <div class="orch-flow-label" data-aos="fade-up" data-aos-delay="150">
          <span>리서치</span>
          <i class="fas fa-arrow-right"></i>
          <span>분석</span>
          <i class="fas fa-arrow-right"></i>
          <span>카피 생성</span>
          <i class="fas fa-arrow-right"></i>
          <span>브랜드 검수</span>
          <i class="fas fa-arrow-right"></i>
          <span>최종 검토</span>
          <i class="fas fa-arrow-right"></i>
          <span class="orch-human-label">사람 승인</span>
          <i class="fas fa-arrow-right"></i>
          <span>실행</span>
        </div>

        <div class="highlight-box" data-aos="fade-up" data-aos-delay="200">
          <i class="fas fa-crown"></i>
          <p>
            <strong>사람은 언제나 최종 의사결정자입니다.</strong><br />
            멀티에이전트 시스템의 목적은 사람을 대체하는 것이 아니라,<br />
            사람이 판단해야 할 일에만 집중할 수 있도록 나머지를 설계하는 것입니다.
          </p>
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION 10 · 실행과 성과 측정
    ============================================================ -->
    <section class="section section-dark" id="execution">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <p class="section-eyebrow">실행과 성과 측정</p>
          <h2 class="section-title">분석이 끝나는 곳에서<br /><span class="text-accent">시스템이 시작됩니다</span></h2>
        </div>

        <div class="execution-grid" data-aos="fade-up" data-aos-delay="100">
          <div class="exec-card">
            <div class="exec-icon"><i class="fas fa-crosshairs"></i></div>
            <h4>타깃 세분화 자동화</h4>
            <p>고객 세그먼트를 실시간으로 업데이트하고, 캠페인 대상을 자동으로 최적화합니다.</p>
          </div>
          <div class="exec-card">
            <div class="exec-icon"><i class="fas fa-bullhorn"></i></div>
            <h4>콘텐츠·SNS·광고 실행</h4>
            <p>에이전트가 생성한 소재를 채널별 포맷에 맞게 자동 배포하고 스케줄을 관리합니다.</p>
          </div>
          <div class="exec-card">
            <div class="exec-icon"><i class="fas fa-tachometer-alt"></i></div>
            <h4>KPI 자동 추적</h4>
            <p>설정한 성과 지표를 실시간으로 모니터링하고, 목표 대비 달성률을 자동으로 집계합니다.</p>
          </div>
          <div class="exec-card">
            <div class="exec-icon"><i class="fas fa-bell"></i></div>
            <h4>이상값 자동 감지</h4>
            <p>전환율 급락, 비용 급등, 이상 트래픽을 즉시 감지하고 담당자에게 알림을 전송합니다.</p>
          </div>
          <div class="exec-card">
            <div class="exec-icon"><i class="fas fa-desktop"></i></div>
            <h4>통합 대시보드</h4>
            <p>분산된 채널 데이터를 하나의 대시보드로 통합하여 실시간 성과를 한눈에 파악합니다.</p>
          </div>
          <div class="exec-card">
            <div class="exec-icon"><i class="fas fa-recycle"></i></div>
            <h4>개선 사이클 자동화</h4>
            <p>성과 데이터가 다음 캠페인 설계에 자동으로 반영되는 재학습 루프를 구축합니다.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION 11 · 산업별 실전 적용
    ============================================================ -->
    <section class="section section-light" id="industry">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <p class="section-eyebrow">산업별 실전 적용</p>
          <h2 class="section-title">산업마다 데이터 구조가 다르고<br /><span class="text-accent">에이전트 설계 방식도 달라집니다</span></h2>
          <p class="section-sub">
            단순 범용 강의가 아닙니다. 산업별 적용 감각까지 체득하는 과정입니다.<br />
            규제 산업의 제약과 데이터 특성, 현장에서 실제로 마주하는 문제를 다룹니다.
          </p>
        </div>

        <div class="industry-grid" data-aos="fade-up" data-aos-delay="100">
          <div class="industry-card industry-regulated">
            <div class="industry-label">규제 산업</div>
            <div class="industry-list">
              <div class="industry-item">
                <i class="fas fa-university"></i>
                <div>
                  <h4>금융</h4>
                  <p>신용 리스크 데이터, 이탈 예측, 상품 추천 에이전트, 컴플라이언스 검수 설계</p>
                </div>
              </div>
              <div class="industry-item">
                <i class="fas fa-signal"></i>
                <div>
                  <h4>통신</h4>
                  <p>ARPU 분석, 해지 방어 에이전트, 업셀/크로스셀 캠페인 자동화</p>
                </div>
              </div>
              <div class="industry-item">
                <i class="fas fa-heartbeat"></i>
                <div>
                  <h4>헬스케어</h4>
                  <p>민감 정보 보호 설계, 환자 여정 분석, 참여율 개선 에이전트</p>
                </div>
              </div>
            </div>
          </div>

          <div class="industry-card industry-commercial">
            <div class="industry-label">커머스·유통</div>
            <div class="industry-list">
              <div class="industry-item">
                <i class="fas fa-shopping-bag"></i>
                <div>
                  <h4>유통 / 이커머스</h4>
                  <p>구매 주기 분석, 장바구니 이탈 에이전트, 개인화 추천 캠페인</p>
                </div>
              </div>
              <div class="industry-item">
                <i class="fas fa-utensils"></i>
                <div>
                  <h4>식품</h4>
                  <p>재구매 패턴 분석, 시즌별 수요 예측, 프로모션 효과 측정</p>
                </div>
              </div>
            </div>
          </div>

          <div class="industry-card industry-industrial">
            <div class="industry-label">산업·공공</div>
            <div class="industry-list">
              <div class="industry-item">
                <i class="fas fa-industry"></i>
                <div>
                  <h4>제조 / 물류</h4>
                  <p>수요 예측, 재고 최적화, 납기 이슈 조기 감지 에이전트</p>
                </div>
              </div>
              <div class="industry-item">
                <i class="fas fa-landmark"></i>
                <div>
                  <h4>공공</h4>
                  <p>시민 서비스 최적화, 정책 효과 분석, 민원 패턴 인사이트</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="highlight-box highlight-box-accent" data-aos="fade-up" data-aos-delay="200">
          <i class="fas fa-fingerprint"></i>
          <p>
            <strong>산업별 데이터 구조가 다르면, 에이전트 설계 방식도 달라집니다.</strong><br />
            이 과정은 그 차이를 이해하고 현장에 맞게 설계하는 감각을 키웁니다.
          </p>
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION 12 · 비개발자 실전 툴킷
    ============================================================ -->
    <section class="section section-dark" id="toolkit">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <p class="section-eyebrow">비개발자 실전 툴킷</p>
          <h2 class="section-title">이론으로 감탄하는 과정이 아니라,<br /><span class="text-accent">월요일부터 바로 적용하는 과정</span></h2>
          <p class="section-sub">
            배우고 끝나지 않습니다. 수강 다음 날, 현장에서 꺼내 쓸 수 있는 실전 툴킷을 제공합니다.
          </p>
        </div>

        <div class="toolkit-showcase" data-aos="fade-up" data-aos-delay="100">
          <div class="toolkit-main">
            <div class="toolkit-card toolkit-card-big">
              <div class="toolkit-num">50</div>
              <h3>실전 프롬프트</h3>
              <p>비개발자도 바로 쓸 수 있는 데이터 분석·마케팅·에이전트 설계용 프롬프트 50개. 산업별·목적별로 분류되어 즉시 활용 가능합니다.</p>
              <ul>
                <li><i class="fas fa-check-circle"></i> 고객 세분화 프롬프트</li>
                <li><i class="fas fa-check-circle"></i> 캠페인 성과 분석 프롬프트</li>
                <li><i class="fas fa-check-circle"></i> 인사이트 도출 프롬프트</li>
                <li><i class="fas fa-check-circle"></i> 에이전트 설계 프롬프트</li>
                <li><i class="fas fa-check-circle"></i> 산업별 특화 프롬프트</li>
              </ul>
            </div>
            <div class="toolkit-card toolkit-card-big">
              <div class="toolkit-num">20</div>
              <h3>노코드 워크플로우</h3>
              <p>개발 없이 구축하는 실전 AI 에이전트 워크플로우 20개. 마케팅 자동화부터 성과 추적까지 바로 복사해서 적용할 수 있는 템플릿입니다.</p>
              <ul>
                <li><i class="fas fa-check-circle"></i> 리서치 자동화 워크플로우</li>
                <li><i class="fas fa-check-circle"></i> 콘텐츠 생성 파이프라인</li>
                <li><i class="fas fa-check-circle"></i> 성과 추적 자동화</li>
                <li><i class="fas fa-check-circle"></i> 이탈 감지 알림 시스템</li>
                <li><i class="fas fa-check-circle"></i> 멀티채널 캠페인 실행</li>
              </ul>
            </div>
          </div>

          <div class="toolkit-extras" data-aos="fade-up" data-aos-delay="150">
            <div class="toolkit-extra-card">
              <i class="fas fa-sitemap"></i>
              <h4>데이터 흐름도</h4>
              <p>산업별 데이터 흐름과 에이전트 연결 구조를 한눈에 파악하는 시각화 자료</p>
            </div>
            <div class="toolkit-extra-card">
              <i class="fas fa-clipboard-check"></i>
              <h4>점검 루틴</h4>
              <p>에이전트 시스템 운영을 위한 일/주/월 점검 체크리스트와 이상 징후 대응 가이드</p>
            </div>
            <div class="toolkit-extra-card">
              <i class="fas fa-calendar-check"></i>
              <h4>바로 실행 플랜</h4>
              <p>수강 직후 월요일부터 적용할 수 있는 단계별 실행 계획과 우선순위 가이드</p>
            </div>
          </div>
        </div>

        <div class="toolkit-badge-row" data-aos="fade-up" data-aos-delay="200">
          <span class="pill-badge"><i class="fas fa-user"></i> 비개발자 완전 대응</span>
          <span class="pill-badge"><i class="fas fa-copy"></i> 복사-붙여넣기 가능</span>
          <span class="pill-badge"><i class="fas fa-calendar-day"></i> 수강 다음 날 바로 적용</span>
          <span class="pill-badge"><i class="fas fa-industry"></i> 산업별 분류 완료</span>
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION 13 · 협회 전용 지원 시스템
    ============================================================ -->
    <section class="section section-light" id="support">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <p class="section-eyebrow">협회 전용 지원 시스템</p>
          <h2 class="section-title">배운 내용을 현장과 클라이언트에게<br /><span class="text-accent">적용할 수 있도록 협회가 함께합니다</span></h2>
          <p class="section-sub">
            AI 에이전트 협회는 교육만 하는 조직이 아닙니다.<br />
            <strong>교육 이후에도 실전 활용 기반을 함께 제공합니다.</strong>
          </p>
        </div>

        <div class="support-grid" data-aos="fade-up" data-aos-delay="100">
          <div class="support-card">
            <div class="support-icon"><i class="fas fa-folder-open"></i></div>
            <h4>실전 적용 자료 제공</h4>
            <p>협회 전용 분석 프레임워크, 마케팅 전략 문서 템플릿, 인사이트 정리 구조를 수강생에게 제공합니다.</p>
          </div>
          <div class="support-card">
            <div class="support-icon"><i class="fas fa-handshake"></i></div>
            <h4>컨설팅 활동 기반 지원</h4>
            <p>강의 및 컨설팅 활동에 활용 가능한 자료와 클라이언트 대응 템플릿을 자격 활동자에게 제공합니다.</p>
          </div>
          <div class="support-card">
            <div class="support-icon"><i class="fas fa-network-wired"></i></div>
            <h4>협회 실무자 네트워크</h4>
            <p>같은 과정을 수료한 실무자들과의 네트워크를 통해 산업별 인사이트와 실전 노하우를 공유합니다.</p>
          </div>
          <div class="support-card">
            <div class="support-icon"><i class="fas fa-sync"></i></div>
            <h4>커리큘럼 지속 업데이트</h4>
            <p>AI 에이전트 분야는 빠르게 변화합니다. 협회는 수강생에게 핵심 업데이트 자료를 지속적으로 제공합니다.</p>
          </div>
        </div>

        <div class="highlight-box highlight-box-dark" data-aos="fade-up" data-aos-delay="200">
          <i class="fas fa-building"></i>
          <p>
            <strong>협회는 현장에 바로 적용할 수 있는 실전형 사고방식과 도구를 제공하는 조직입니다.</strong><br />
            강의와 컨설팅 활동으로 이어질 수 있는 기반까지 함께 설계합니다.
          </p>
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION 14 · 자격 및 활동 확장 구조
    ============================================================ -->
    <section class="section section-dark" id="expand">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <p class="section-eyebrow">활동 확장 구조</p>
          <h2 class="section-title">이 과정은 수료로 끝나지 않습니다<br /><span class="text-accent">자격 · 컨설팅 · 강사까지 확장됩니다</span></h2>
        </div>

        <div class="expand-path" data-aos="fade-up" data-aos-delay="100">
          <div class="expand-node expand-start">
            <div class="expand-node-icon"><i class="fas fa-graduation-cap"></i></div>
            <h4>과정 수료</h4>
            <p>AI 에이전트를 활용한 데이터 분석 및 마케팅 분석 과정</p>
          </div>

          <div class="expand-branches">
            <div class="expand-branch">
              <div class="branch-arrow"></div>
              <div class="expand-node expand-mid">
                <div class="expand-node-icon"><i class="fas fa-certificate"></i></div>
                <h4>국가공인 자격 연계</h4>
                <p>과정 수료 후 국가공인 자격 취득 흐름과 연계됩니다</p>
              </div>
            </div>
            <div class="expand-branch">
              <div class="branch-arrow"></div>
              <div class="expand-node expand-mid">
                <div class="expand-node-icon"><i class="fas fa-briefcase"></i></div>
                <h4>컨설턴트 자격 확장</h4>
                <p>분석형 마케팅 컨설팅 활동으로 확장 가능합니다</p>
              </div>
            </div>
            <div class="expand-branch">
              <div class="branch-arrow"></div>
              <div class="expand-node expand-mid">
                <div class="expand-node-icon"><i class="fas fa-chalkboard-teacher"></i></div>
                <h4>강사 인증 구조 연결</h4>
                <p>강의, 기업 교육, 워크숍 활동으로 확장됩니다</p>
              </div>
            </div>
          </div>

          <div class="expand-final-row">
            <div class="expand-final">
              <i class="fas fa-laptop-code"></i>
              <span>기업 교육</span>
            </div>
            <div class="expand-final">
              <i class="fas fa-users"></i>
              <span>강의 활동</span>
            </div>
            <div class="expand-final">
              <i class="fas fa-project-diagram"></i>
              <span>실무 프로젝트</span>
            </div>
            <div class="expand-final">
              <i class="fas fa-comments-dollar"></i>
              <span>컨설팅</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION 15 · 국가공인 자격 연계 강조
    ============================================================ -->
    <section class="section section-qualification" id="qualification">
      <div class="container">
        <div class="qualification-box" data-aos="zoom-in">
          <div class="qual-badge"><i class="fas fa-award"></i> 국가공인 자격 연계 과정</div>
          <h2>실무로 끝나지 않습니다.</h2>
          <p class="qual-main">
            이 과정은 <strong>국가공인 자격 연계 흐름까지 고려한 핵심 과정</strong>입니다.
          </p>
          <p class="qual-sub">
            AI 에이전트 협회의 인증 구조와 연결되어 있으며,<br />
            수료 이후 자격 취득, 컨설턴트 활동, 강사 등록까지 이어지는<br />
            체계적인 성장 경로를 제공합니다.
          </p>
          <div class="qual-points">
            <div class="qual-point">
              <i class="fas fa-check"></i>
              <span>국가공인 자격 연계 교과목 구성</span>
            </div>
            <div class="qual-point">
              <i class="fas fa-check"></i>
              <span>협회 공인 수료증 발급</span>
            </div>
            <div class="qual-point">
              <i class="fas fa-check"></i>
              <span>컨설턴트 자격 취득 연계</span>
            </div>
            <div class="qual-point">
              <i class="fas fa-check"></i>
              <span>강사 인증 프로그램 연결</span>
            </div>
          </div>
          <a href="#cta" class="btn btn-primary btn-lg">자격 과정 문의하기 <i class="fas fa-arrow-right"></i></a>
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION 16 · 강사 인증 연결 구조
    ============================================================ -->
    <section class="section section-light" id="instructor">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <p class="section-eyebrow">강사 인증 연결 구조</p>
          <h2 class="section-title">나만의 강의를 만들고,<br /><span class="text-accent">현장 전문가로 확장하고 싶다면</span></h2>
          <p class="section-sub">
            분석과 마케팅, AI 에이전트 설계 경험은 강의 현장에서 매우 강력한 차별점이 됩니다.
          </p>
        </div>

        <div class="instructor-cards" data-aos="fade-up" data-aos-delay="100">
          <div class="instructor-card">
            <div class="inst-num">01</div>
            <h4>강사 활동으로 확장하고 싶은 분</h4>
            <p>이 과정을 수강한 뒤 강사 활동으로 확장하고 싶은 분에게 협회 강사 인증 경로를 안내합니다. 협회 교육과정 전달 구조와 자연스럽게 연결됩니다.</p>
          </div>
          <div class="instructor-card">
            <div class="inst-num">02</div>
            <h4>현장 경험이 곧 강의 경쟁력</h4>
            <p>AI 에이전트, 데이터 분석, 마케팅 실행 경험을 갖춘 강사는 시장에서 매우 드뭅니다. 이 과정의 실전 경험이 곧 강의 차별화 포인트가 됩니다.</p>
          </div>
          <div class="instructor-card">
            <div class="inst-num">03</div>
            <h4>강의·기업 교육·워크숍으로 확장</h4>
            <p>개인 강의, 기업 내부 교육, 외부 워크숍까지 — 하나의 과정 수료가 다양한 교육 활동의 출발점이 됩니다.</p>
          </div>
        </div>

        <div class="instructor-cta" data-aos="fade-up" data-aos-delay="200">
          <p>강사 인증에 관심 있으신가요?</p>
          <a href="#cta" class="btn btn-accent btn-lg">강사 인증 문의하기 <i class="fas fa-arrow-right"></i></a>
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION · 추천 대상
    ============================================================ -->
    <section class="section section-dark" id="target">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <p class="section-eyebrow">추천 대상</p>
          <h2 class="section-title">이 과정이 <span class="text-accent">당신에게 맞는지</span> 확인하세요</h2>
        </div>

        <div class="target-grid" data-aos="fade-up" data-aos-delay="100">
          <div class="target-card">
            <i class="fas fa-user-tie"></i>
            <h4>데이터 기반 의사결정을 원하는 대표</h4>
            <p>직관이 아닌 데이터와 AI 에이전트로 전략적 판단을 내리고 싶은 경영자</p>
          </div>
          <div class="target-card">
            <i class="fas fa-chart-bar"></i>
            <h4>마케팅 성과를 구조적으로 분석하고 싶은 실무자</h4>
            <p>캠페인을 돌리지만 왜 성과가 나오는지 모르는 마케터, 퍼포먼스 담당자</p>
          </div>
          <div class="target-card">
            <i class="fas fa-robot"></i>
            <h4>AI를 시스템으로 활용하고 싶은 사람</h4>
            <p>ChatGPT를 쓰는 것에서 멈추지 않고 에이전트로 업무를 자동화하고 싶은 사람</p>
          </div>
          <div class="target-card">
            <i class="fas fa-user-graduate"></i>
            <h4>예비 컨설턴트</h4>
            <p>데이터와 AI 에이전트 기반의 컨설팅 서비스를 제공하고 싶은 사람</p>
          </div>
          <div class="target-card">
            <i class="fas fa-chalkboard-teacher"></i>
            <h4>예비 강사</h4>
            <p>AI 에이전트·데이터 분석 분야 강의를 기획하고 싶은 사람</p>
          </div>
          <div class="target-card">
            <i class="fas fa-cogs"></i>
            <h4>산업 현장에 바로 적용하고 싶은 사람</h4>
            <p>금융·통신·헬스케어·유통·제조 등 자신이 속한 산업에 즉시 적용 가능한 프레임을 원하는 사람</p>
          </div>
          <div class="target-card">
            <i class="fas fa-award"></i>
            <h4>국가공인 자격 연계를 고려하는 사람</h4>
            <p>실력 향상과 함께 공인된 자격 취득까지 체계적으로 준비하고 싶은 사람</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION 17 · FAQ
    ============================================================ -->
    <section class="section section-light" id="faq">
      <div class="container">
        <div class="section-header" data-aos="fade-up">
          <p class="section-eyebrow">자주 묻는 질문</p>
          <h2 class="section-title">궁금한 것들을<br /><span class="text-accent">솔직하게 답변드립니다</span></h2>
        </div>

        <div class="faq-list" data-aos="fade-up" data-aos-delay="100">

          <div class="faq-item">
            <button class="faq-question" aria-expanded="false">
              <span>이 과정은 일반 데이터 분석 강의와 무엇이 다른가요?</span>
              <i class="fas fa-chevron-down"></i>
            </button>
            <div class="faq-answer">
              <p>일반 데이터 분석 강의는 툴 사용법(Excel, Python, SQL 등)을 가르치거나, 분석 방법론을 소개하는 데 집중합니다. 이 과정은 다릅니다. <strong>데이터 분석 → 인사이트 도출 → 마케팅 실행 → 성과 측정까지 하나의 흐름으로 연결</strong>하고, 이 흐름을 AI 에이전트 구조로 자동화하는 실전 설계법을 배웁니다. 분석이 끝나는 곳에서 시스템이 시작되는 과정입니다.</p>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question" aria-expanded="false">
              <span>마케팅 실무 경험이 없어도 수강할 수 있나요?</span>
              <i class="fas fa-chevron-down"></i>
            </button>
            <div class="faq-answer">
              <p>네, 가능합니다. 이 과정은 마케팅 전문가보다는 <strong>데이터와 AI를 마케팅 실행에 연결하고 싶은 사람</strong>을 위해 설계되었습니다. 마케팅 기초 개념부터 함께 다루며, 실전 사례 중심으로 진행되기 때문에 현장 경험이 없어도 충분히 따라올 수 있습니다.</p>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question" aria-expanded="false">
              <span>비개발자도 따라갈 수 있나요?</span>
              <i class="fas fa-chevron-down"></i>
            </button>
            <div class="faq-answer">
              <p>네. 이 과정은 처음부터 <strong>비개발자를 기준으로 설계</strong>되었습니다. 코딩 없이 활용 가능한 노코드 워크플로우 20선, 복사해서 바로 쓸 수 있는 프롬프트 50선이 제공됩니다. 에이전트 설계 원리를 이해하고 시스템을 구성하는 데 개발 능력은 필수가 아닙니다.</p>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question" aria-expanded="false">
              <span>AI 에이전트는 실제 현장에서 어느 수준까지 활용 가능한가요?</span>
              <i class="fas fa-chevron-down"></i>
            </button>
            <div class="faq-answer">
              <p>현재 실무에서 AI 에이전트는 리서치, 데이터 분석, 콘텐츠 생성, KPI 모니터링, 이상값 감지 등 다양한 영역에서 실제로 사용되고 있습니다. 다만 <strong>만능 도구가 아니며, 사람의 검수와 설계가 반드시 필요</strong>합니다. 이 과정은 환상 없이 현실적 활용 수준과 한계를 함께 다루기 때문에, 현장에서 제대로 쓸 수 있는 실력이 만들어집니다.</p>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question" aria-expanded="false">
              <span>산업별 사례도 다루나요?</span>
              <i class="fas fa-chevron-down"></i>
            </button>
            <div class="faq-answer">
              <p>네. 금융·통신·헬스케어·유통·이커머스·식품·제조·물류·공공 등 <strong>9개 이상의 실제 산업 현장 사례</strong>를 다룹니다. 산업마다 데이터 구조가 다르고 에이전트 설계 방식도 달라지기 때문에, 각 산업별 적용 감각을 함께 익힙니다.</p>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question" aria-expanded="false">
              <span>국가공인 자격 연계는 어떻게 연결되나요?</span>
              <i class="fas fa-chevron-down"></i>
            </button>
            <div class="faq-answer">
              <p>이 과정은 AI 에이전트 협회 아카데미의 <strong>국가공인 자격 연계 교과목</strong>으로 구성되어 있습니다. 수료 후 자격 취득 흐름으로 자연스럽게 연결되며, 상세한 자격 취득 일정과 절차는 협회 담당자와 상담을 통해 안내받으실 수 있습니다.</p>
            </div>
          </div>

          <div class="faq-item">
            <button class="faq-question" aria-expanded="false">
              <span>수료 후 컨설턴트나 강사 활동으로도 확장할 수 있나요?</span>
              <i class="fas fa-chevron-down"></i>
            </button>
            <div class="faq-answer">
              <p>네. 이 과정은 컨설턴트 자격 및 강사 인증 구조와 연결되어 있습니다. 수료 후 <strong>분석형 마케팅 컨설팅, 기업 교육, 외부 강의, 워크숍 활동</strong>으로 확장할 수 있으며, 협회는 이를 위한 실전 자료와 네트워크를 함께 제공합니다.</p>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ============================================================
         SECTION 18 · 최종 CTA
    ============================================================ -->
    <section class="section section-cta" id="cta">
      <div class="cta-bg-grid"></div>
      <div class="container">
        <div class="cta-inner" data-aos="fade-up">
          <p class="cta-eyebrow">지금 결정하세요</p>
          <h2 class="cta-headline">
            숫자를 읽는 사람을 넘어,<br />
            <span class="cta-accent">성과를 설계하는 사람으로 확장하세요</span>
          </h2>
          <p class="cta-sub">
            AI를 쓰는 사람에서 끝날 것인가,<br />
            AI 에이전트를 설계하는 사람으로 갈 것인가.
          </p>

          <div class="cta-value-props">
            <div class="cta-prop"><i class="fas fa-check-circle"></i> 데이터 분석 → 마케팅 실행까지 하나의 흐름</div>
            <div class="cta-prop"><i class="fas fa-check-circle"></i> 멀티에이전트 오케스트레이션 설계</div>
            <div class="cta-prop"><i class="fas fa-check-circle"></i> 9개 산업별 실전 사례</div>
            <div class="cta-prop"><i class="fas fa-check-circle"></i> 프롬프트 50선 + 워크플로우 20선</div>
            <div class="cta-prop"><i class="fas fa-check-circle"></i> 국가공인 자격 연계</div>
            <div class="cta-prop"><i class="fas fa-check-circle"></i> 컨설턴트 및 강사 활동 확장</div>
          </div>

          <div class="cta-buttons">
            <a href="tel:0000000000" class="btn btn-primary btn-xl cta-main-btn">
              <i class="fas fa-chalkboard-teacher"></i>
              강사 인증 문의하기
            </a>
            <div class="cta-sub-buttons">
              <a href="mailto:info@aiagent-academy.kr" class="btn btn-outline-white btn-md">
                <i class="fas fa-certificate"></i> 자격 과정 문의
              </a>
              <a href="mailto:info@aiagent-academy.kr" class="btn btn-outline-white btn-md">
                <i class="fas fa-comments"></i> 과정 상담 신청
              </a>
              <a href="mailto:info@aiagent-academy.kr" class="btn btn-outline-white btn-md">
                <i class="fas fa-calendar-alt"></i> 교육 일정 문의
              </a>
            </div>
          </div>

          <p class="cta-notice">
            <i class="fas fa-lock"></i> 개인정보는 과정 안내 목적으로만 사용되며 제3자에게 제공되지 않습니다.
          </p>
        </div>
      </div>
    </section>

  </main>

  <!-- ============================================================
       FOOTER
  ============================================================ -->
  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <img src="/landing/kaia-logo.png" alt="KAIA AI에이전트협회 로고" class="footer-logo-img" />
      </div>
      <p class="footer-tagline">AI 에이전트를 활용한 데이터 분석 및 마케팅 분석 과정</p>
      <p class="footer-copy">© 2025 KAIA AI에이전트협회 (AI Agent Association). All rights reserved.</p>
    </div>
  </footer>

  <!-- Scroll to top -->
  <button class="scroll-top" id="scrollTop" aria-label="맨 위로">
    <i class="fas fa-chevron-up"></i>
  </button>
`;
