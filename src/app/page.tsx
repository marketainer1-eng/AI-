import type { Metadata } from 'next'
import './landing.css'
import LandingInteractions from './LandingInteractions'

export const metadata: Metadata = {
  title: '왕초보도 할 수 있는 AI 바이브 코딩 | AI 에이전트 협회 아카데미',
  description:
    '코딩을 몰라도 시작할 수 있는 왕초보 AI 바이브 코딩 과정. 창업부터 마케팅 운영까지, 국내 유일 국가공인 AI 자격증 AICE 자격 연계 과정. AI 에이전트 협회 아카데미.',
}

export default function RootPage() {
  return (
    <>
      {/* 폰트 & 아이콘 (랜딩 전용) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&family=Noto+Serif+KR:wght@400;600;700&display=swap"
        rel="stylesheet"
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css"
      />

      {/* ===== 상단 네비게이션 ===== */}
      <header className="site-header" id="site-header">
        <div className="header-inner container">
          <div className="logo-area">
            <a href="#hero" className="header-logo-link" aria-label="KAIA AI에이전트협회 홈">
              <img src="/images/kaia-logo.svg" alt="KAIA AI에이전트협회" className="header-logo-img" />
            </a>
          </div>
          <nav className="header-nav" id="header-nav">
            <a href="#about">과정 소개</a>
            <a href="#curriculum">커리큘럼</a>
            <a href="#results">결과물</a>
            <a href="#certification">자격 연계</a>
            <a href="#faq">FAQ</a>
          </nav>
          <a href="#final-cta" className="btn-header-cta">강사 인증 문의</a>
          <button className="hamburger" id="hamburger" aria-label="메뉴 열기">
            <span></span><span></span><span></span>
          </button>
        </div>
        {/* 모바일 메뉴 */}
        <div className="mobile-menu" id="mobile-menu">
          <a href="#about">과정 소개</a>
          <a href="#curriculum">커리큘럼</a>
          <a href="#results">결과물</a>
          <a href="#certification">자격 연계</a>
          <a href="#faq">FAQ</a>
          <a href="#final-cta" className="mobile-cta-btn">강사 인증 문의</a>
        </div>
      </header>

      <main>
        {/* ===== 1. 히어로 섹션 ===== */}
        <section className="hero-section" id="hero">
          <div className="hero-bg-layer"></div>
          <div className="hero-particles" id="hero-particles"></div>
          <div className="container hero-inner">
            <div className="hero-badge-row">
              <span className="badge badge-gov">
                <img src="/images/aice-logo.svg" alt="AICE" className="badge-aice-inline" />
                국내 유일 국가공인 AI 자격증 · AICE 연계
              </span>
              <span className="badge badge-new"><i className="fas fa-star"></i> 2025 신규 개설</span>
            </div>
            <h1 className="hero-headline">
              코딩을 몰라도<br />
              <em>시작할 수 있는</em><br />
              왕초보 AI 바이브 코딩
            </h1>
            <p className="hero-sub">
              아이디어를 구현하고,<br />
              <strong>창업과 마케팅 운영까지 연결하는</strong><br />
              가장 현실적인 AI 제작 입문 과정
            </p>
            <p className="hero-desc">
              비전공자도, 코딩 경험이 전혀 없는 분도 시작할 수 있습니다.<br />
              AI 에이전트 협회 아카데미가 왕초보의 첫 실전 제작 경험을 함께 만들어갑니다.
            </p>
            <div className="hero-cta-group">
              <a href="#final-cta" className="btn btn-primary btn-large">
                <i className="fas fa-chalkboard-teacher"></i> 강사 인증 문의
              </a>
              <a href="#final-cta" className="btn btn-outline btn-large">
                <i className="fas fa-calendar-check"></i> 과정 상담 신청
              </a>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-num">0</span>
                <span className="stat-label">사전 코딩 지식 필요</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-num">100%</span>
                <span className="stat-label">실전 제작 중심 과정</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-num stat-num-aice">
                  <img src="/images/aice-logo.svg" alt="AICE" className="stat-aice-logo" />
                </span>
                <span className="stat-label">국내 유일 국가공인 AI 자격 연계</span>
              </div>
            </div>
          </div>
          <div className="hero-scroll-hint">
            <span>스크롤하여 더 보기</span>
            <i className="fas fa-chevron-down"></i>
          </div>
        </section>

        {/* ===== 책 연계 배너 ===== */}
        <section className="book-banner-section">
          <div className="container">
            <div className="book-banner-card">
              <div className="book-icon-area">
                <i className="fas fa-book-open"></i>
              </div>
              <div className="book-text-area">
                <span className="book-tag">협회 공식 교재 집필 중</span>
                <p className="book-title">「왕초보도 할 수 있는 AI 바이브 코딩 : 창업부터 마케팅 운영까지」</p>
                <p className="book-desc">이 과정은 현재 집필 중인 협회 공식 교재와 완전히 연계됩니다. 수강생은 교재·강의안·실습 자료를 모두 협회 지원으로 받을 수 있습니다.</p>
              </div>
              <div className="book-badge-area">
                <span className="book-badge">교재 연계</span>
                <span className="book-badge">실습 자료 포함</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 2. 과정 소개 ===== */}
        <section className="about-section section-pad" id="about">
          <div className="container">
            <div className="section-label">과정 소개</div>
            <h2 className="section-title">이 과정이<br /><em>특별한 이유</em></h2>
            <p className="section-desc">
              AI 바이브 코딩 과정은 단순한 코딩 교육이 아닙니다.<br />
              AI를 도구로 활용해 <strong>왕초보도 직접 무언가를 만들고, 실행하고, 확장하는 경험</strong>을 하게 만드는 실전형 과정입니다.
            </p>
            <div className="about-cards">
              <div className="about-card">
                <div className="about-card-icon"><i className="fas fa-robot"></i></div>
                <h3>AI가 코딩을 대신한다</h3>
                <p>ChatGPT, Claude 등 AI 도구를 활용해 코딩 지식 없이도 원하는 기능을 구현합니다. 여러분은 <strong>아이디어와 방향</strong>만 잡으면 됩니다.</p>
              </div>
              <div className="about-card">
                <div className="about-card-icon"><i className="fas fa-rocket"></i></div>
                <h3>만들고 → 창업으로</h3>
                <p>단순 실습에서 그치지 않습니다. 내 아이디어를 실제 서비스 초안으로 구현하고, <strong>창업과 운영으로 연결</strong>하는 구조를 배웁니다.</p>
              </div>
              <div className="about-card">
                <div className="about-card-icon"><i className="fas fa-bullhorn"></i></div>
                <h3>마케팅까지 연결</h3>
                <p>제작한 결과물을 실제 마케팅 채널과 연결하고, AI를 활용한 콘텐츠 운영·자동화까지 <strong>실전 감각</strong>으로 익힙니다.</p>
              </div>
              <div className="about-card">
                <div className="about-card-icon"><i className="fas fa-graduation-cap"></i></div>
                <h3>수료 후 강사로 확장</h3>
                <p>이 과정을 수료하면 협회 강사 인증으로 연결할 수 있습니다. <strong>가르치는 활동</strong>까지 확장할 수 있는 체계적인 구조가 준비되어 있습니다.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 3. 왜 이 과정인가 ===== */}
        <section className="why-section section-pad" id="why">
          <div className="container">
            <div className="section-label">왜 이 과정인가</div>
            <h2 className="section-title">지금 이 과정을<br /><em>선택해야 하는 이유</em></h2>
            <div className="why-grid">
              <div className="why-item">
                <div className="why-num">01</div>
                <div className="why-content">
                  <h3>코딩을 배우는 게 아니라<br />&quot;AI로 만드는 법&quot;을 배웁니다</h3>
                  <p>이 과정은 프로그래밍 언어를 외우는 코딩 수업이 아닙니다. AI를 활용해 내가 원하는 것을 실제로 구현해보는 제작 경험 과정입니다.</p>
                </div>
              </div>
              <div className="why-item">
                <div className="why-num">02</div>
                <div className="why-content">
                  <h3>왕초보도 첫날부터<br />무언가를 만들 수 있습니다</h3>
                  <p>복잡한 개념 설명 없이 바로 실습에 들어갑니다. 첫 수업부터 AI와 함께 결과물을 만드는 경험을 시작합니다.</p>
                </div>
              </div>
              <div className="why-item">
                <div className="why-num">03</div>
                <div className="why-content">
                  <h3>국내 유일 국가공인 AI 자격증<br />
                    <img src="/images/aice-logo.svg" alt="AICE" className="why-aice-logo" /> 자격 연계 과정</h3>
                  <p>개인 강의와 다릅니다. 국내 유일 국가공인 AI 자격증인 <img src="/images/aice-logo.svg" alt="AICE" className="inline-aice-logo" />와 연계된 과정으로, 수료의 공신력과 자격의 가치가 다릅니다.</p>
                </div>
              </div>
              <div className="why-item">
                <div className="why-num">04</div>
                <div className="why-content">
                  <h3>과정이 끝나도<br />활동은 계속됩니다</h3>
                  <p>수료 후 강사 인증, 지도·컨설팅 활동, 협회 네트워크 활동까지. 배움에서 활동으로 자연스럽게 이어집니다.</p>
                </div>
              </div>
              <div className="why-item">
                <div className="why-num">05</div>
                <div className="why-content">
                  <h3>창업·실무·강의 어디든<br />실전으로 쓸 수 있습니다</h3>
                  <p>창업을 준비 중이든, 현업에서 활용하고 싶든, 향후 강의로 확장하고 싶든, 이 과정은 모든 방향과 연결됩니다.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 4. 이런 문제를 해결합니다 ===== */}
        <section className="problems-section section-pad" id="problems">
          <div className="container">
            <div className="section-label">이런 문제를 해결합니다</div>
            <h2 className="section-title">혹시 지금<br /><em>이런 고민을 하고 계신가요?</em></h2>
            <p className="section-desc">아래 고민 중 하나라도 해당된다면, 이 과정이 정확한 해답입니다.</p>
            <div className="problems-grid">
              <div className="problem-card">
                <div className="problem-icon"><i className="fas fa-times-circle"></i></div>
                <div className="problem-text">
                  <p className="problem-q">&quot;코딩은 어렵게 느껴져서<br />시작을 못했어요&quot;</p>
                  <p className="problem-a"><strong>→ 코딩 지식 제로도 괜찮습니다.</strong> AI가 코드를 대신 작성합니다. 여러분은 방향만 잡으면 됩니다.</p>
                </div>
              </div>
              <div className="problem-card">
                <div className="problem-icon"><i className="fas fa-times-circle"></i></div>
                <div className="problem-text">
                  <p className="problem-q">&quot;AI로 뭔가 만들 수 있다고는<br />들었는데 어디서 시작할지…&quot;</p>
                  <p className="problem-a"><strong>→ 첫 단계부터 함께합니다.</strong> 협회 교재와 커리큘럼이 단계별로 안내합니다.</p>
                </div>
              </div>
              <div className="problem-card">
                <div className="problem-icon"><i className="fas fa-times-circle"></i></div>
                <div className="problem-text">
                  <p className="problem-q">&quot;창업 아이디어는 있는데<br />빠르게 구현할 방법이 없어요&quot;</p>
                  <p className="problem-a"><strong>→ 이 과정에서 초안을 만들어봅니다.</strong> 아이디어를 실제 결과물로 바꾸는 경험을 합니다.</p>
                </div>
              </div>
              <div className="problem-card">
                <div className="problem-icon"><i className="fas fa-times-circle"></i></div>
                <div className="problem-text">
                  <p className="problem-q">&quot;제작 경험을 강의나<br />활동으로 확장하고 싶어요&quot;</p>
                  <p className="problem-a"><strong>→ 수료 후 강사 인증으로 연결됩니다.</strong> 배운 것을 가르치는 활동까지 협회가 지원합니다.</p>
                </div>
              </div>
              <div className="problem-card">
                <div className="problem-icon"><i className="fas fa-times-circle"></i></div>
                <div className="problem-text">
                  <p className="problem-q">&quot;수료해도 혼자 남겨지는 것<br />아닐까 걱정돼요&quot;</p>
                  <p className="problem-a"><strong>→ 협회 지원 시스템이 계속 함께합니다.</strong> 교재, 강의안, 네트워크, 사이트 이용 권한까지 지속 제공됩니다.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 5. 커리큘럼 ===== */}
        <section className="curriculum-section section-pad" id="curriculum">
          <div className="container">
            <div className="section-label">커리큘럼</div>
            <h2 className="section-title">무엇을<br /><em>배우게 되나요?</em></h2>
            <p className="section-desc">
              단계별로 체계적으로 설계된 실전 커리큘럼입니다.<br />
              왕초보도 수업을 따라가다 보면 자연스럽게 결과물이 만들어집니다.
            </p>
            <div className="curriculum-tabs">
              <button className="curr-tab active" data-tab="0">기초</button>
              <button className="curr-tab" data-tab="1">제작</button>
              <button className="curr-tab" data-tab="2">창업</button>
              <button className="curr-tab" data-tab="3">확장</button>
            </div>
            <div className="curriculum-panels">

              {/* 기초 탭 */}
              <div className="curr-panel active" data-panel="0">
                <div className="curr-panel-header">
                  <div className="curr-step-badge">STEP 1</div>
                  <div>
                    <h3>AI 바이브 코딩 기초</h3>
                    <p>AI와 친해지고, 코딩 없이 만드는 감각 익히기</p>
                  </div>
                </div>
                <ul className="curr-list">
                  <li><i className="fas fa-check-circle"></i> AI 바이브 코딩이란 무엇인가? 개념과 철학</li>
                  <li><i className="fas fa-check-circle"></i> ChatGPT, Claude 등 AI 도구 기본 활용법</li>
                  <li><i className="fas fa-check-circle"></i> 프롬프트 작성법 – 내 아이디어를 AI에게 전달하는 기술</li>
                  <li><i className="fas fa-check-circle"></i> 코딩 없이 웹페이지 만들기 첫 실습</li>
                  <li><i className="fas fa-check-circle"></i> AI 도구 선택과 조합 – 나에게 맞는 도구 찾기</li>
                  <li><i className="fas fa-check-circle"></i> 왕초보 실습: AI와 함께 첫 결과물 만들기</li>
                </ul>
                <div className="curr-keyword-row">
                  <span className="curr-keyword">ChatGPT</span>
                  <span className="curr-keyword">Claude</span>
                  <span className="curr-keyword">프롬프트 엔지니어링</span>
                  <span className="curr-keyword">AI 도구 선택</span>
                  <span className="curr-keyword">첫 실습 결과물</span>
                </div>
              </div>

              {/* 제작 탭 */}
              <div className="curr-panel" data-panel="1">
                <div className="curr-panel-header">
                  <div className="curr-step-badge">STEP 2</div>
                  <div>
                    <h3>AI 활용 실전 제작</h3>
                    <p>실제로 만들어보는 제작 중심 실습</p>
                  </div>
                </div>
                <ul className="curr-list">
                  <li><i className="fas fa-check-circle"></i> 랜딩페이지 / 소개 페이지 AI로 제작하기</li>
                  <li><i className="fas fa-check-circle"></i> AI 활용 이미지·콘텐츠 자동 생성 실습</li>
                  <li><i className="fas fa-check-circle"></i> 나만의 AI 챗봇 만들기 기초</li>
                  <li><i className="fas fa-check-circle"></i> 간단한 앱·툴 아이디어 구현 실습</li>
                  <li><i className="fas fa-check-circle"></i> AI 자동화 워크플로우 설계하기</li>
                  <li><i className="fas fa-check-circle"></i> 내 아이디어를 실제 서비스 초안으로 구현하기</li>
                </ul>
                <div className="curr-keyword-row">
                  <span className="curr-keyword">랜딩페이지 제작</span>
                  <span className="curr-keyword">AI 이미지 생성</span>
                  <span className="curr-keyword">챗봇 구현</span>
                  <span className="curr-keyword">앱 아이디어</span>
                  <span className="curr-keyword">자동화</span>
                </div>
              </div>

              {/* 창업 탭 */}
              <div className="curr-panel" data-panel="2">
                <div className="curr-panel-header">
                  <div className="curr-step-badge">STEP 3</div>
                  <div>
                    <h3>창업 아이디어 구현</h3>
                    <p>내 비즈니스를 AI로 시작하는 구조 만들기</p>
                  </div>
                </div>
                <ul className="curr-list">
                  <li><i className="fas fa-check-circle"></i> AI 기반 창업 아이디어 검증 방법</li>
                  <li><i className="fas fa-check-circle"></i> 최소 비용으로 MVP 만들기 실습</li>
                  <li><i className="fas fa-check-circle"></i> AI로 사업 소개서·브랜드 자료 제작</li>
                  <li><i className="fas fa-check-circle"></i> 온라인 판매 페이지·예약 시스템 구현</li>
                  <li><i className="fas fa-check-circle"></i> 고객 응대 AI 자동화 시스템 설계</li>
                  <li><i className="fas fa-check-circle"></i> 창업 초기 운영 자동화 구조 만들기</li>
                </ul>
                <div className="curr-keyword-row">
                  <span className="curr-keyword">MVP 제작</span>
                  <span className="curr-keyword">아이디어 검증</span>
                  <span className="curr-keyword">브랜드 자료</span>
                  <span className="curr-keyword">판매 페이지</span>
                  <span className="curr-keyword">운영 자동화</span>
                </div>
              </div>

              {/* 확장 탭 */}
              <div className="curr-panel" data-panel="3">
                <div className="curr-panel-header">
                  <div className="curr-step-badge">STEP 4</div>
                  <div>
                    <h3>마케팅 운영 & 활동 확장</h3>
                    <p>제작에서 마케팅·강의 활동까지 연결하기</p>
                  </div>
                </div>
                <ul className="curr-list">
                  <li><i className="fas fa-check-circle"></i> AI 마케팅 콘텐츠 자동 생성 및 운영</li>
                  <li><i className="fas fa-check-circle"></i> SNS·블로그·유튜브 AI 활용 운영법</li>
                  <li><i className="fas fa-check-circle"></i> 이메일·문자 마케팅 자동화 실습</li>
                  <li><i className="fas fa-check-circle"></i> 데이터 분석 AI 도구 활용 기초</li>
                  <li><i className="fas fa-check-circle"></i> 내 과정을 강의 콘텐츠로 재구성하기</li>
                  <li><i className="fas fa-check-circle"></i> 협회 강사 인증 연계 준비 및 로드맵</li>
                </ul>
                <div className="curr-keyword-row">
                  <span className="curr-keyword">마케팅 자동화</span>
                  <span className="curr-keyword">SNS 운영</span>
                  <span className="curr-keyword">콘텐츠 생성</span>
                  <span className="curr-keyword">강의 활동 연계</span>
                  <span className="curr-keyword">강사 인증</span>
                </div>
              </div>

            </div>
            <div className="curriculum-cta">
              <p>전체 커리큘럼이 궁금하신가요?</p>
              <a href="#final-cta" className="btn btn-outline">교육 일정 문의 →</a>
            </div>
          </div>
        </section>

        {/* ===== 6. 수강 후 결과물 ===== */}
        <section className="results-section section-pad" id="results">
          <div className="container">
            <div className="section-label">수강 후 결과물</div>
            <h2 className="section-title">과정을 마치면<br /><em>이런 결과물을 갖게 됩니다</em></h2>
            <p className="section-desc">
              이론을 배운 것에서 그치지 않습니다.<br />
              수강 후 실제로 손에 쥐게 되는 결과물과 경험이 있습니다.
            </p>
            <div className="results-grid">
              <div className="result-card">
                <div className="result-icon-wrap result-color-1">
                  <i className="fas fa-laptop-code"></i>
                </div>
                <h3>왕초보형 제작 실습 결과물</h3>
                <ul>
                  <li>AI로 만든 나만의 랜딩페이지</li>
                  <li>챗봇 또는 자동화 툴 초안</li>
                  <li>AI 생성 콘텐츠 포트폴리오</li>
                  <li>제작 과정 정리 문서</li>
                </ul>
                <span className="result-tag">포트폴리오 활용 가능</span>
              </div>
              <div className="result-card">
                <div className="result-icon-wrap result-color-2">
                  <i className="fas fa-lightbulb"></i>
                </div>
                <h3>아이디어 구현 초안</h3>
                <ul>
                  <li>내 창업 아이디어의 서비스 초안</li>
                  <li>MVP(최소 기능 제품) 프로토타입</li>
                  <li>AI 활용 사업 소개 자료</li>
                  <li>아이디어 검증 보고서</li>
                </ul>
                <span className="result-tag">창업 바로 적용 가능</span>
              </div>
              <div className="result-card">
                <div className="result-icon-wrap result-color-3">
                  <i className="fas fa-store"></i>
                </div>
                <h3>창업/운영 연결 구조</h3>
                <ul>
                  <li>온라인 판매·예약 페이지</li>
                  <li>고객 응대 자동화 흐름</li>
                  <li>운영 자동화 워크플로우</li>
                  <li>비즈니스 구조 설계도</li>
                </ul>
                <span className="result-tag">즉시 운영 시작 가능</span>
              </div>
              <div className="result-card">
                <div className="result-icon-wrap result-color-4">
                  <i className="fas fa-chart-line"></i>
                </div>
                <h3>마케팅 운영 확장 아이디어</h3>
                <ul>
                  <li>SNS 콘텐츠 자동화 시스템</li>
                  <li>이메일/문자 마케팅 구조</li>
                  <li>AI 마케팅 운영 플레이북</li>
                  <li>채널별 콘텐츠 전략 초안</li>
                </ul>
                <span className="result-tag">마케팅 바로 연결</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== AICE 자격 연계 강조 배너 ===== */}
        <section className="aice-banner-section" id="certification">
          <div className="container">
            <div className="aice-banner-card">

              {/* 좌측: AICE 로고 + 타이틀 */}
              <div className="aice-banner-left">
                <div className="aice-logo-box">
                  <img src="/images/aice-logo.svg" alt="AICE 로고" className="aice-logo-img" />
                </div>
                <div className="aice-banner-left-text">
                  <span className="aice-gov-tag">🏛️ 국내 유일 국가공인 AI 자격증</span>
                  <h2 className="aice-banner-title">이 과정은<br /><strong><img src="/images/aice-logo.svg" alt="AICE" className="aice-title-logo" /> 자격과<br />연계됩니다</strong></h2>
                </div>
              </div>

              {/* 우측: 체크리스트 + CTA */}
              <div className="aice-banner-right">
                <div className="aice-points-list">
                  <div className="aice-point">
                    <i className="fas fa-check"></i>
                    <p>AI 에이전트 협회 공식 인증 과정</p>
                  </div>
                  <div className="aice-point">
                    <i className="fas fa-check"></i>
                    <p>국내 유일 국가공인 AI 자격증 <img src="/images/aice-logo.svg" alt="AICE" className="inline-aice-logo" /> 연계로 수료 공신력 보장</p>
                  </div>
                  <div className="aice-point">
                    <i className="fas fa-check"></i>
                    <p>수료 후 강사 자격 취득 경로 연결</p>
                  </div>
                  <div className="aice-point">
                    <i className="fas fa-check"></i>
                    <p>협회 공식 수료증 및 <img src="/images/aice-logo.svg" alt="AICE" className="inline-aice-logo" /> 자격증 발급</p>
                  </div>
                  <div className="aice-point">
                    <i className="fas fa-check"></i>
                    <p>지도·컨설팅·강의 활동 공식 인정</p>
                  </div>
                </div>

                {/* CTA pill */}
                <div className="aice-cta-row">
                  <a href="#final-cta" className="aice-cta-left">
                    자격 과정 문의 →
                  </a>
                  <a href="#final-cta" className="aice-cta-right">
                    <i className="fas fa-chalkboard-teacher"></i> 강사 인증 문의
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ===== 7. 협회 전용 지원 시스템 ===== */}
        <section className="support-section section-pad" id="support">
          <div className="container">
            <div className="section-label">협회 전용 지원 시스템</div>
            <h2 className="section-title">협회가 준비한<br /><em>완전한 지원 시스템</em></h2>
            <p className="section-desc">
              수강생 혼자 모든 것을 준비할 필요가 없습니다.<br />
              AI 에이전트 협회는 교육부터 활동까지 <strong>모든 과정을 체계적으로 지원</strong>합니다.
            </p>
            <div className="support-grid">
              <div className="support-item">
                <div className="support-icon"><i className="fas fa-book"></i></div>
                <h3>협회 제작 공식 교재</h3>
                <p>현재 집필 중인 「왕초보도 할 수 있는 AI 바이브 코딩」 교재를 협회에서 제공합니다. 별도 구매 없이 수강생 전원 지원됩니다.</p>
              </div>
              <div className="support-item">
                <div className="support-icon"><i className="fas fa-file-powerpoint"></i></div>
                <h3>강의안 & 실습 자료</h3>
                <p>협회가 직접 제작한 강의안과 실습 자료를 제공합니다. 수강 중에는 물론, 향후 강사 활동 시에도 활용 가능합니다.</p>
              </div>
              <div className="support-item">
                <div className="support-icon"><i className="fas fa-globe"></i></div>
                <h3>협회 개발 사이트 이용 권한</h3>
                <p>협회가 자체 개발한 AI 교육·실습 사이트에 대한 이용 권한을 부여합니다. 지속적인 실습과 학습이 가능합니다.</p>
              </div>
              <div className="support-item">
                <div className="support-icon"><i className="fas fa-users"></i></div>
                <h3>협회 네트워크 & 커뮤니티</h3>
                <p>같은 과정을 수료한 협회 회원들과의 네트워크를 형성합니다. 협업·의뢰·활동 기회가 네트워크를 통해 연결됩니다.</p>
              </div>
              <div className="support-item">
                <div className="support-icon"><i className="fas fa-headset"></i></div>
                <h3>수료 후 지도·컨설팅 지원</h3>
                <p>수료 후에도 협회의 지도와 컨설팅 지원이 이어집니다. 실전 적용 과정에서 생기는 질문과 어려움을 함께 해결합니다.</p>
              </div>
              <div className="support-item">
                <div className="support-icon"><i className="fas fa-chalkboard-teacher"></i></div>
                <h3>강사 활동 연결 구조</h3>
                <p>협회 강사 인증 취득 후 실제 강의 활동 기회를 협회가 연결합니다. 강의 기회, 파트너 기관 연결을 지원합니다.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 8. 자격 및 활동 확장 ===== */}
        <section className="expansion-section section-pad" id="expansion">
          <div className="container">
            <div className="section-label">자격 및 활동 확장</div>
            <h2 className="section-title">수료 후<br /><em>활동이 시작됩니다</em></h2>
            <p className="section-desc">
              AI 에이전트 협회 아카데미 과정은 교육으로 끝나지 않습니다.<br />
              <strong>배운 것이 곧 활동이 되는 구조</strong>로 설계되어 있습니다.
            </p>
            <div className="expansion-flow">
              <div className="flow-step">
                <div className="flow-icon"><i className="fas fa-graduation-cap"></i></div>
                <div className="flow-content">
                  <span className="flow-num">STEP 1</span>
                  <h3>과정 수료</h3>
                  <p>AI 바이브 코딩 과정 수료 및 협회 공식 수료증 취득</p>
                </div>
              </div>
              <div className="flow-arrow"><i className="fas fa-chevron-right"></i></div>
              <div className="flow-step">
                <div className="flow-icon"><i className="fas fa-id-badge"></i></div>
                <div className="flow-content">
                  <span className="flow-num">STEP 2</span>
                  <h3>자격 취득</h3>
                  <p>AICE(국내 유일 국가공인 AI 자격증) 연계 취득 및 협회 공인 자격증 발급</p>
                </div>
              </div>
              <div className="flow-arrow"><i className="fas fa-chevron-right"></i></div>
              <div className="flow-step">
                <div className="flow-icon"><i className="fas fa-certificate"></i></div>
                <div className="flow-content">
                  <span className="flow-num">STEP 3</span>
                  <h3>강사 인증</h3>
                  <p>협회 강사 인증 취득 및 교육 활동 자격 부여</p>
                </div>
              </div>
              <div className="flow-arrow"><i className="fas fa-chevron-right"></i></div>
              <div className="flow-step">
                <div className="flow-icon"><i className="fas fa-expand-arrows-alt"></i></div>
                <div className="flow-content">
                  <span className="flow-num">STEP 4</span>
                  <h3>활동 확장</h3>
                  <p>강의·컨설팅·지도 활동 시작 및 협회 네트워크 활용</p>
                </div>
              </div>
            </div>
            <div className="expansion-activities">
              <div className="activity-card">
                <i className="fas fa-chalkboard-teacher"></i>
                <h4>강의 활동</h4>
                <p>기업·기관·개인 대상 AI 바이브 코딩 강의</p>
              </div>
              <div className="activity-card">
                <i className="fas fa-user-tie"></i>
                <h4>컨설팅</h4>
                <p>AI 도입·창업·마케팅 운영 컨설팅</p>
              </div>
              <div className="activity-card">
                <i className="fas fa-users-cog"></i>
                <h4>지도 활동</h4>
                <p>후속 수강생 멘토링·지도 활동</p>
              </div>
              <div className="activity-card">
                <i className="fas fa-handshake"></i>
                <h4>협회 파트너</h4>
                <p>협회 공식 파트너 강사 활동 참여</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 9. 강사 인증 연결 구조 ===== */}
        <section className="instructor-section section-pad" id="instructor">
          <div className="container">
            <div className="instructor-card">
              <div className="instructor-left">
                <div className="section-label" style={{ color: '#ffd700' }}>강사 인증 연결 구조</div>
                <h2 className="instructor-title">
                  배운 것을<br /><em>가르치는 사람이 됩니다</em>
                </h2>
                <p className="instructor-desc">
                  AI 에이전트 협회의 강사 인증 구조는 단순한 자격증이 아닙니다.<br />
                  <strong>실제 강의 활동과 연결되는 실전형 인증 시스템</strong>입니다.
                </p>
                <ul className="instructor-list">
                  <li><i className="fas fa-star"></i> 협회 공인 강사 자격 취득</li>
                  <li><i className="fas fa-star"></i> 강의안·교재 협회 공식 지원</li>
                  <li><i className="fas fa-star"></i> 강의 기회 협회 연결 지원</li>
                  <li><i className="fas fa-star"></i> 강사 네트워크 커뮤니티 참여</li>
                  <li><i className="fas fa-star"></i> 협회 개발 사이트 강사 이용 권한</li>
                  <li><i className="fas fa-star"></i> 지속적 역량 개발 지원 프로그램</li>
                </ul>
                <a href="#final-cta" className="btn btn-primary btn-large" style={{ marginTop: '2rem' }}>
                  <i className="fas fa-chalkboard-teacher"></i> 강사 인증 문의하기
                </a>
              </div>
              <div className="instructor-right">
                <div className="instructor-visual">
                  <div className="instructor-circle instructor-circle-1">
                    <i className="fas fa-chalkboard-teacher"></i>
                    <span>강사 활동</span>
                  </div>
                  <div className="instructor-circle instructor-circle-2">
                    <i className="fas fa-award"></i>
                    <span>강사 인증</span>
                  </div>
                  <div className="instructor-circle instructor-circle-3">
                    <i className="fas fa-graduation-cap"></i>
                    <span>과정 수료</span>
                  </div>
                  <div className="instructor-center">
                    <span>AI 에이전트<br />협회</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 10. 추천 대상 ===== */}
        <section className="target-section section-pad" id="target">
          <div className="container">
            <div className="section-label">추천 대상</div>
            <h2 className="section-title">이런 분께<br /><em>꼭 맞는 과정입니다</em></h2>
            <div className="target-grid">
              <div className="target-card target-main">
                <div className="target-icon"><i className="fas fa-user-graduate"></i></div>
                <div className="target-badge">최추천</div>
                <h3>코딩을 전혀 모르는 왕초보</h3>
                <p>IT 비전공자, 코딩 경험이 없는 분이라면 이 과정이 가장 적합합니다. 기초 개념부터 차근차근 함께합니다.</p>
              </div>
              <div className="target-card">
                <div className="target-icon"><i className="fas fa-store"></i></div>
                <h3>창업을 준비 중인 분</h3>
                <p>창업 아이디어는 있지만 구현이 막막한 분. AI로 아이디어를 빠르게 프로토타입으로 만들어봅니다.</p>
              </div>
              <div className="target-card">
                <div className="target-icon"><i className="fas fa-briefcase"></i></div>
                <h3>AI를 실무에 적용하고 싶은 직장인</h3>
                <p>업무 자동화, 마케팅 운영, AI 도구 활용을 직접 실습하고 현업에 바로 적용하고 싶은 분.</p>
              </div>
              <div className="target-card">
                <div className="target-icon"><i className="fas fa-bullhorn"></i></div>
                <h3>마케팅 운영을 혼자 하고 싶은 분</h3>
                <p>SNS, 블로그, 콘텐츠 마케팅을 AI로 자동화하고 싶은 1인 사업자, 소상공인, 프리랜서.</p>
              </div>
              <div className="target-card">
                <div className="target-icon"><i className="fas fa-chalkboard-teacher"></i></div>
                <h3>향후 강의 활동을 고려하는 분</h3>
                <p>AI를 배우는 것에서 그치지 않고 강의로 확장하고 싶은 분. 협회 강사 인증 경로가 준비되어 있습니다.</p>
              </div>
              <div className="target-card">
                <div className="target-icon"><i className="fas fa-book-reader"></i></div>
                <h3>책과 함께 체계적으로 배우고 싶은 분</h3>
                <p>협회 공식 교재 「AI 바이브 코딩」을 중심으로 체계적이고 깊이 있게 AI 제작을 배우고 싶은 분.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 11. FAQ ===== */}
        <section className="faq-section section-pad" id="faq">
          <div className="container">
            <div className="section-label">자주 묻는 질문</div>
            <h2 className="section-title">궁금한 점을<br /><em>해결해드립니다</em></h2>
            <div className="faq-list">

              <div className="faq-item">
                <button className="faq-q" aria-expanded="false">
                  <span>정말 코딩을 전혀 몰라도 수강할 수 있나요?</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                <div className="faq-a">
                  <p>네, 완전 가능합니다. 이 과정은 코딩 언어를 배우는 과정이 아닙니다. AI 도구를 활용해 코딩 지식 없이도 원하는 것을 만들 수 있는 방법을 배우는 실전형 과정입니다. 사전 지식이 전혀 없어도 첫날부터 따라올 수 있도록 설계되어 있습니다.</p>
                </div>
              </div>

              <div className="faq-item">
                <button className="faq-q" aria-expanded="false">
                  <span>국가공인 자격과 어떻게 연계되나요?</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                <div className="faq-a">
                  <p>AI 에이전트 협회 아카데미의 과정은 국내 유일 국가공인 AI 자격증인 AICE 자격 연계 과정으로 운영됩니다. 과정 수료 후 AICE 자격 취득 경로가 연결되며, 협회 공식 수료증 및 자격증이 발급됩니다. 자세한 자격 연계 내용은 과정 상담을 통해 안내받으실 수 있습니다.</p>
                </div>
              </div>

              <div className="faq-item">
                <button className="faq-q" aria-expanded="false">
                  <span>교재와 실습 자료는 별도로 구매해야 하나요?</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                <div className="faq-a">
                  <p>협회에서 제작한 공식 교재, 강의안, 실습 자료를 수강생 전원에게 제공합니다. 별도 구매 없이 협회 지원으로 모든 학습 자료를 받을 수 있습니다. 또한 협회 개발 사이트 이용 권한도 함께 부여됩니다.</p>
                </div>
              </div>

              <div className="faq-item">
                <button className="faq-q" aria-expanded="false">
                  <span>수료 후 강사 인증은 어떻게 진행되나요?</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                <div className="faq-a">
                  <p>과정 수료 후 협회 강사 인증 과정으로 연결됩니다. 강사 인증 취득 후에는 협회를 통해 강의 기회, 파트너 기관 연결, 강의안 지원 등 실제 강의 활동을 위한 구조가 제공됩니다. 강사 인증 세부 내용은 강사 인증 문의를 통해 상담하실 수 있습니다.</p>
                </div>
              </div>

              <div className="faq-item">
                <button className="faq-q" aria-expanded="false">
                  <span>수업은 온라인인가요, 오프라인인가요?</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                <div className="faq-a">
                  <p>온라인 및 오프라인 모두 운영됩니다. 구체적인 운영 방식과 일정은 교육 일정 문의를 통해 안내받으실 수 있습니다. 개인·기업·기관 등 맞춤형 운영도 가능합니다.</p>
                </div>
              </div>

              <div className="faq-item">
                <button className="faq-q" aria-expanded="false">
                  <span>창업 아이디어가 없어도 수강할 수 있나요?</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                <div className="faq-a">
                  <p>물론입니다. 창업이 목적이 아니더라도 AI 제작 경험, 마케팅 운영, 강의 활동 등 다양한 목적으로 수강하실 수 있습니다. 창업 아이디어가 없는 분들은 과정 중에 아이디어를 발굴하고 구현해보는 경험 자체를 목표로 참여하시면 됩니다.</p>
                </div>
              </div>

              <div className="faq-item">
                <button className="faq-q" aria-expanded="false">
                  <span>기업·기관 단체 교육도 가능한가요?</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                <div className="faq-a">
                  <p>가능합니다. 기업 임직원 교육, 기관 교육, 단체 수강 등 다양한 형태로 운영됩니다. 맞춤형 커리큘럼과 일정 조율이 가능하오니 과정 상담 신청을 통해 문의해주세요.</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ===== 12. 최종 CTA ===== */}
        <section className="final-cta-section" id="final-cta">
          <div className="final-cta-bg"></div>
          <div className="container final-cta-inner">
            <div className="section-label" style={{ color: '#ffd700', borderColor: 'rgba(255,215,0,0.3)' }}>지금 시작하세요</div>
            <h2 className="final-cta-title">
              코딩을 몰라도 괜찮습니다.<br />
              <em>AI가 당신의 아이디어를 현실로 만듭니다.</em>
            </h2>
            <p className="final-cta-desc">
              왕초보도 시작할 수 있는 AI 바이브 코딩 과정,<br />
              <strong>지금 바로 문의하고 첫 걸음을 시작하세요.</strong><br />
              협회가 수료 이후 강사 활동까지 함께합니다.
            </p>
            <div className="cta-cards">
              <div className="cta-card cta-card-primary" id="cta-main">
                <div className="cta-card-icon"><i className="fas fa-chalkboard-teacher"></i></div>
                <h3>강사 인증 문의</h3>
                <p>과정 수료 후 강사 인증 취득 및 강의 활동 연결 경로 안내</p>
                <a href="mailto:academy@aiagent.or.kr?subject=강사 인증 문의" className="btn btn-white btn-cta-main">
                  강사 인증 문의하기 →
                </a>
              </div>
              <div className="cta-card">
                <div className="cta-card-icon"><i className="fas fa-award"></i></div>
                <h3>자격 과정 문의</h3>
                <p>AICE 국가공인 AI 자격증 연계 과정 세부 안내 및 취득 경로 상담</p>
                <a href="mailto:academy@aiagent.or.kr?subject=자격 과정 문의" className="btn btn-outline-white">
                  자격 과정 문의하기 →
                </a>
              </div>
              <div className="cta-card">
                <div className="cta-card-icon"><i className="fas fa-comments"></i></div>
                <h3>과정 상담 신청</h3>
                <p>개인·기업·기관 맞춤형 과정 구성 및 수강 상담 신청</p>
                <a href="mailto:academy@aiagent.or.kr?subject=과정 상담 신청" className="btn btn-outline-white">
                  과정 상담 신청하기 →
                </a>
              </div>
              <div className="cta-card">
                <div className="cta-card-icon"><i className="fas fa-calendar-alt"></i></div>
                <h3>교육 일정 문의</h3>
                <p>온라인·오프라인 교육 일정 및 수강 신청 안내</p>
                <a href="mailto:academy@aiagent.or.kr?subject=교육 일정 문의" className="btn btn-outline-white">
                  교육 일정 문의하기 →
                </a>
              </div>
            </div>
            <div className="final-cta-footer-note">
              <i className="fas fa-shield-alt"></i>
              <span>AI 에이전트 협회 아카데미는 국내 유일 국가공인 AI 자격증 AICE 연계 과정으로 운영됩니다. 문의 후 영업일 기준 1일 내 답변드립니다.</span>
            </div>
          </div>
        </section>

      </main>

      {/* ===== 푸터 ===== */}
      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-logo-area">
            <img src="/images/kaia-logo.svg" alt="KAIA AI에이전트협회" className="footer-logo-img" />
          </div>
          <div className="footer-desc">
            <p>AI 에이전트 협회 아카데미 | 국내 유일 국가공인 AI 자격증 AICE 연계 교육 기관</p>
            <p>왕초보부터 강사까지 — AI 활용 능력을 현실로 연결합니다.</p>
          </div>
          <div className="footer-contact">
            <p><i className="fas fa-envelope"></i> academy@aiagent.or.kr</p>
            <p><i className="fas fa-globe"></i> www.aiagent.or.kr</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 AI 에이전트 협회 아카데미. All rights reserved.</p>
        </div>
      </footer>

      {/* 플로팅 CTA 버튼 */}
      <div className="floating-cta" id="floating-cta">
        <a href="#final-cta" className="floating-btn">
          <i className="fas fa-chalkboard-teacher"></i>
          <span>강사 인증 문의</span>
        </a>
      </div>

      {/* 인터랙션 (클라이언트) */}
      <LandingInteractions />
    </>
  )
}
