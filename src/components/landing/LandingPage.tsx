'use client'

import { useEffect } from 'react'
import './landing.css'

const APPLY_URL = 'https://hkspmh.liveklass.com/classes/306909'

export default function LandingPage() {
  useEffect(() => {
    // 정리(cleanup)를 위해 등록한 리스너/옵저버를 모아둔다.
    const cleanups: Array<() => void> = []

    /* ── Navbar – scroll 감지 시 shadow 추가 ── */
    const navbar = document.getElementById('navbar')
    if (navbar) {
      const onScroll = () => {
        if (window.scrollY > 20) navbar.classList.add('scrolled')
        else navbar.classList.remove('scrolled')
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      onScroll()
      cleanups.push(() => window.removeEventListener('scroll', onScroll))
    }

    /* ── Hamburger – 모바일 메뉴 ── */
    const hamburger = document.getElementById('hamburger')
    const navLinks = document.getElementById('navLinks')
    if (hamburger && navLinks) {
      const onHamburger = () => {
        const isOpen = navLinks.classList.toggle('open')
        hamburger.classList.toggle('active', isOpen)
        hamburger.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기')
      }
      hamburger.addEventListener('click', onHamburger)
      cleanups.push(() => hamburger.removeEventListener('click', onHamburger))

      const linkEls = Array.from(navLinks.querySelectorAll('a'))
      const onLinkClick = () => {
        navLinks.classList.remove('open')
        hamburger.classList.remove('active')
      }
      linkEls.forEach((link) => link.addEventListener('click', onLinkClick))
      cleanups.push(() =>
        linkEls.forEach((link) => link.removeEventListener('click', onLinkClick))
      )

      const onDocClick = (e: MouseEvent) => {
        if (!navbar?.contains(e.target as Node)) {
          navLinks.classList.remove('open')
          hamburger.classList.remove('active')
        }
      }
      document.addEventListener('click', onDocClick)
      cleanups.push(() => document.removeEventListener('click', onDocClick))
    }

    /* ── FAQ – 아코디언 ── */
    const faqItems = Array.from(document.querySelectorAll('.faq-item'))
    faqItems.forEach((item) => {
      const btn = item.querySelector('.faq-question')
      const answer = item.querySelector('.faq-answer')
      if (!btn || !answer) return

      const onClick = () => {
        const isActive = item.classList.contains('active')
        faqItems.forEach((other) => {
          if (other !== item) {
            other.classList.remove('active')
            other.querySelector('.faq-answer')?.classList.remove('open')
            other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false')
          }
        })
        if (isActive) {
          item.classList.remove('active')
          answer.classList.remove('open')
          btn.setAttribute('aria-expanded', 'false')
        } else {
          item.classList.add('active')
          answer.classList.add('open')
          btn.setAttribute('aria-expanded', 'true')
        }
      }
      btn.addEventListener('click', onClick)
      cleanups.push(() => btn.removeEventListener('click', onClick))
    })

    /* ── Scroll Animations – Intersection Observer ── */
    const animTargets = Array.from(
      document.querySelectorAll(
        '.problem-card, .result-card, .system-card, .expand-card, ' +
          '.testimonial-card, .module-item, .intro-point, .curriculum-phase, .cta-card'
      )
    ) as HTMLElement[]
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target as HTMLElement
              const delay = el.dataset.aosDelay ? parseInt(el.dataset.aosDelay) : 0
              window.setTimeout(() => el.classList.add('animate-fade-in'), delay)
              observer.unobserve(el)
            }
          })
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      )
      animTargets.forEach((el) => {
        el.style.opacity = '0'
        observer.observe(el)
      })
      cleanups.push(() => observer.disconnect())
    } else {
      animTargets.forEach((el) => (el.style.opacity = '1'))
    }

    /* ── Floating CTA – 스크롤 300px 이후 노출 ── */
    const floatingCta = document.getElementById('floatingCta')
    if (floatingCta) {
      const ctaSection = document.getElementById('cta')
      const onScroll = () => {
        if (window.scrollY > 300) {
          if (ctaSection) {
            const rect = ctaSection.getBoundingClientRect()
            if (rect.top < window.innerHeight && rect.bottom > 0) {
              floatingCta.classList.remove('visible')
              return
            }
          }
          floatingCta.classList.add('visible')
        } else {
          floatingCta.classList.remove('visible')
        }
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      cleanups.push(() => window.removeEventListener('scroll', onScroll))
    }

    /* ── Smooth Scroll – 해시 앵커 오프셋 조정 ── */
    const NAVBAR_HEIGHT = 76
    const anchorLinks = Array.from(
      document.querySelectorAll('a[href^="#"]')
    ) as HTMLAnchorElement[]
    const anchorHandlers: Array<[HTMLAnchorElement, (e: Event) => void]> = []
    anchorLinks.forEach((link) => {
      const onClick = (e: Event) => {
        const href = link.getAttribute('href')
        if (!href || href === '#') return
        const target = document.querySelector(href)
        if (!target) return
        e.preventDefault()
        const top =
          target.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT
        window.scrollTo({ top, behavior: 'smooth' })
      }
      link.addEventListener('click', onClick)
      anchorHandlers.push([link, onClick])
    })
    cleanups.push(() =>
      anchorHandlers.forEach(([link, h]) => link.removeEventListener('click', h))
    )

    /* ── Flow Diagram – hover 시 강조 (데스크톱) ── */
    const flowSteps = Array.from(document.querySelectorAll('.flow-step')) as HTMLElement[]
    const flowHandlers: Array<[HTMLElement, () => void, () => void]> = []
    flowSteps.forEach((step) => {
      const onEnter = () =>
        flowSteps.forEach((s) => (s.style.opacity = s === step ? '1' : '.55'))
      const onLeave = () => flowSteps.forEach((s) => (s.style.opacity = '1'))
      step.addEventListener('mouseenter', onEnter)
      step.addEventListener('mouseleave', onLeave)
      flowHandlers.push([step, onEnter, onLeave])
    })
    cleanups.push(() =>
      flowHandlers.forEach(([step, e, l]) => {
        step.removeEventListener('mouseenter', e)
        step.removeEventListener('mouseleave', l)
      })
    )

    /* ── Counter Animation – 히어로 통계 숫자 ── */
    const animateCounters = () => {
      const counters = Array.from(document.querySelectorAll('.stat-num'))
      counters.forEach((counter) => {
        const raw = counter.textContent || ''
        const target = raw.replace(/[^0-9]/g, '')
        const suffix = raw.replace(/[0-9]/g, '')
        if (!target) return
        let current = 0
        const end = parseInt(target)
        const duration = 1600
        const step = duration / end
        const timer = window.setInterval(() => {
          current += 1
          counter.textContent = current + suffix
          if (current >= end) {
            counter.textContent = target + suffix
            window.clearInterval(timer)
          }
        }, step)
      })
    }
    const heroSection = document.querySelector('.hero')
    if (heroSection && 'IntersectionObserver' in window) {
      const heroObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            window.setTimeout(animateCounters, 800)
            heroObserver.disconnect()
          }
        },
        { threshold: 0.3 }
      )
      heroObserver.observe(heroSection)
      cleanups.push(() => heroObserver.disconnect())
    }

    /* ── Active Nav Link – 스크롤 위치에 따라 ── */
    const sections = Array.from(document.querySelectorAll('section[id]'))
    const sectionNavLinks = Array.from(
      document.querySelectorAll('.nav-links a[href^="#"]')
    ) as HTMLAnchorElement[]
    if ('IntersectionObserver' in window) {
      const navObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              sectionNavLinks.forEach((link) => {
                const active = link.getAttribute('href') === `#${entry.target.id}`
                link.style.fontWeight = active ? '700' : ''
                link.style.color = active ? 'var(--primary)' : ''
              })
            }
          })
        },
        { threshold: 0.4 }
      )
      sections.forEach((s) => navObserver.observe(s))
      cleanups.push(() => navObserver.disconnect())
    }

    return () => cleanups.forEach((fn) => fn())
  }, [])

  return (
    <>
      {/* 외부 폰트 / 아이콘 (React 19가 <head>로 호이스팅) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css"
      />

      {/* ====== NAVBAR ====== */}
      <header className="navbar" id="navbar">
        <div className="container nav-inner">
          <div className="nav-logo">
            <span className="logo-badge">AI</span>
            <div className="logo-text">
              <span className="logo-main">AI 에이전트 협회</span>
              <span className="logo-sub">ACADEMY</span>
            </div>
          </div>
          <nav className="nav-links" id="navLinks">
            <a href="#problem">과정 소개</a>
            <a href="#curriculum">커리큘럼</a>
            <a href="#results">결과물</a>
            <a href="#system">지원 시스템</a>
            <a href="#qualify">자격 확장</a>
            <a href="#cta" className="nav-cta-btn">강사 인증 문의</a>
          </nav>
          <button className="hamburger" id="hamburger" aria-label="메뉴 열기">
            <span></span><span></span><span></span>
          </button>
        </div>
      </header>

      {/* ====== HERO ====== */}
      <section className="hero" id="hero">
        <div className="hero-bg-pattern"></div>
        <div className="container hero-inner">
          <div className="hero-tag-row">
            <span className="hero-badge pulse">AI 에이전트 협회 아카데미 공식 과정</span>
            <span className="hero-badge-outline">컨설턴트 자격 연계 과정</span>
          </div>
          <div className="hero-schedule-strip">
            <span className="hss-icon"><i className="fa-solid fa-fire"></i></span>
            <span className="hss-text">1기 개강</span>
            <span className="hss-divider">|</span>
            <strong>6월 20일(토) 개강</strong>
            <span className="hss-divider">|</span>
            <span>4주 과정 · 매주 토요일</span>
            <span className="hss-divider">|</span>
            <span className="hss-time"><i className="fa-regular fa-clock"></i> 밤 8:00 – 10:00</span>
            <a className="hss-cta" href={APPLY_URL} target="_blank" rel="noopener noreferrer">지금 신청 →</a>
          </div>
          <h1 className="hero-headline">
            AI 업무 에이전트 구축 (기초) 과정<br />
            반복 업무를 줄이고<br />
            <em>AI 에이전트형 업무 체계</em>를 만드는 시작
          </h1>
          <p className="hero-subtext">
            자동화를 넘어,<br />
            내 업무에 맞는 <strong>AI 에이전트 구축 기초</strong>를 배우고<br />
            컨설팅과 강의 활동까지 확장하세요.
          </p>
          <div className="hero-cta-group">
            <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
              <i className="fa-solid fa-certificate"></i>
              강사 인증 문의하기
            </a>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-num">4주</span>
              <span className="stat-label">집중 과정</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-num">5종</span>
              <span className="stat-label">실무 결과물 산출</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-num">100%</span>
              <span className="stat-label">컨설턴트 자격 연계</span>
            </div>
          </div>
        </div>
        <div className="hero-scroll-hint">
          <i className="fa-solid fa-chevron-down"></i>
        </div>
      </section>

      {/* ====== SOCIAL PROOF STRIP ====== */}
      <section className="social-proof-strip">
        <div className="container">
          <div className="strip-inner">
            <span className="strip-label">이런 분들이 찾습니다</span>
            <div className="strip-tags">
              <span><i className="fa-solid fa-user-tie"></i> 실무자</span>
              <span><i className="fa-solid fa-briefcase"></i> 대표·경영진</span>
              <span><i className="fa-solid fa-chalkboard-teacher"></i> 강사 희망자</span>
              <span><i className="fa-solid fa-chart-line"></i> 예비 컨설턴트</span>
              <span><i className="fa-solid fa-robot"></i> AI 활용 실무자</span>
            </div>
          </div>
        </div>
      </section>

      {/* ====== PROBLEM SECTION ====== */}
      <section className="section problem-section" id="problem">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">문제 인식</span>
            <h2 className="section-title">혹시 이런 상황에 있지 않으신가요?</h2>
            <p className="section-desc">AI를 쓰고는 있지만, 업무 구조로 정리되지 않아 늘 제자리인 느낌. 많은 실무자들이 공통적으로 겪는 문제입니다.</p>
          </div>
          <div className="problem-grid">
            <div className="problem-card" data-aos="fade-up">
              <div className="problem-icon"><i className="fa-solid fa-brain"></i></div>
              <h3>AI를 써도 업무가 정리되지 않는다</h3>
              <p>ChatGPT, Claude, Gemini를 활용하고 있지만 단편적인 사용에 그쳐 업무 구조로 연결되지 않는다.</p>
            </div>
            <div className="problem-card" data-aos="fade-up" data-aos-delay="100">
              <div className="problem-icon"><i className="fa-solid fa-arrows-rotate"></i></div>
              <h3>반복 업무를 어디서부터 설계해야 할지 막막하다</h3>
              <p>반복되는 업무를 줄이고 싶은데, 어떤 업무를 먼저 정리하고 어떻게 AI로 연결해야 할지 기준이 없다.</p>
            </div>
            <div className="problem-card" data-aos="fade-up" data-aos-delay="200">
              <div className="problem-icon"><i className="fa-solid fa-diagram-project"></i></div>
              <h3>클라이언트에게 에이전트 구축 방향을 설명하기 어렵다</h3>
              <p>컨설팅 현장에서 AI 에이전트 도입을 제안하고 싶지만 설명할 수 있는 체계적인 기준과 언어가 없다.</p>
            </div>
            <div className="problem-card" data-aos="fade-up" data-aos-delay="300">
              <div className="problem-icon"><i className="fa-solid fa-folder-open"></i></div>
              <h3>강의·컨설팅에 활용할 자료와 매뉴얼이 없다</h3>
              <p>AI 관련 강의나 컨설팅을 하고 싶어도 단계별로 제시할 수 있는 실무 자료와 구조화된 매뉴얼이 부재하다.</p>
            </div>
          </div>
          <div className="problem-answer">
            <div className="answer-inner">
              <i className="fa-solid fa-lightbulb"></i>
              <p><strong>이 과정이 그 해답입니다.</strong><br />업무를 분석하고, AI 에이전트 구축 기초를 체계적으로 배워 실무·컨설팅·강의 모두에 활용하세요.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== WHAT IS THIS COURSE ====== */}
      <section className="section course-intro-section" id="course-intro">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">과정 개요</span>
            <h2 className="section-title">AI 업무 에이전트 구축 기초 과정이란?</h2>
            <p className="section-desc">반복 업무를 분석하고, ChatGPT·Claude·Gemini 등을 활용해<br />내 업무에 맞는 <strong>에이전트형 실무 체계</strong>를 설계하는 과정입니다.</p>
          </div>
          <div className="course-intro-grid">
            <div className="course-intro-visual">
              <div className="flow-diagram">
                <div className="flow-step flow-step-1">
                  <div className="flow-step-icon"><i className="fa-solid fa-magnifying-glass-chart"></i></div>
                  <div className="flow-step-text">
                    <strong>진단</strong>
                    <span>반복 업무 구조 분석</span>
                  </div>
                </div>
                <div className="flow-arrow"><i className="fa-solid fa-arrow-down"></i></div>
                <div className="flow-step flow-step-2">
                  <div className="flow-step-icon"><i className="fa-solid fa-drafting-compass"></i></div>
                  <div className="flow-step-text">
                    <strong>설계</strong>
                    <span>에이전트 구축 초안 작성</span>
                  </div>
                </div>
                <div className="flow-arrow"><i className="fa-solid fa-arrow-down"></i></div>
                <div className="flow-step flow-step-3">
                  <div className="flow-step-icon"><i className="fa-solid fa-gears"></i></div>
                  <div className="flow-step-text">
                    <strong>구축</strong>
                    <span>단계별 실행 로드맵 완성</span>
                  </div>
                </div>
                <div className="flow-arrow"><i className="fa-solid fa-arrow-down"></i></div>
                <div className="flow-step flow-step-4">
                  <div className="flow-step-icon"><i className="fa-solid fa-rocket"></i></div>
                  <div className="flow-step-text">
                    <strong>확장</strong>
                    <span>컨설팅·강의 활동 전환</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="course-intro-points">
              <div className="intro-point">
                <div className="intro-point-icon"><i className="fa-solid fa-check-circle"></i></div>
                <div>
                  <h4>에이전트 구축 순서와 초안 설계</h4>
                  <p>어떤 순서로 에이전트를 구축할지, 초안은 어떻게 잡는지 단계별로 실무적으로 다룹니다.</p>
                </div>
              </div>
              <div className="intro-point">
                <div className="intro-point-icon"><i className="fa-solid fa-check-circle"></i></div>
                <div>
                  <h4>자료 정리와 단계별 구축 흐름</h4>
                  <p>어떤 자료를 어떤 단계로 정리할지, 실무적인 구축 흐름 전체를 체계적으로 학습합니다.</p>
                </div>
              </div>
              <div className="intro-point">
                <div className="intro-point-icon"><i className="fa-solid fa-check-circle"></i></div>
                <div>
                  <h4>ChatGPT·Claude·Gemini 실무 활용</h4>
                  <p>주요 AI 도구를 업무 목적에 맞게 구조화하여 에이전트형 프롬프트 시스템을 설계합니다.</p>
                </div>
              </div>
              <div className="intro-point">
                <div className="intro-point-icon"><i className="fa-solid fa-check-circle"></i></div>
                <div>
                  <h4>입력-처리-출력 구조 문서화</h4>
                  <p>업무의 흐름을 입력·처리·출력 단계로 구조화하여 재사용 가능한 실무 문서를 만듭니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== CURRICULUM SECTION ====== */}
      <section className="section curriculum-section" id="curriculum">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">커리큘럼</span>
            <h2 className="section-title">단계별 구축 흐름 학습</h2>
            <p className="section-desc">실무에서 바로 적용할 수 있는 4주 구성의 체계적인 커리큘럼입니다.</p>
          </div>

          {/* 개강 일정 배너 */}
          <div className="schedule-banner">
            <div className="schedule-banner-left">
              <i className="fa-solid fa-calendar-days"></i>
              <div>
                <span className="schedule-banner-title">1기 개강 일정</span>
                <span className="schedule-banner-sub">매주 토요일 밤 8:00 – 10:00 (온라인)</span>
              </div>
            </div>
            <div className="schedule-weeks">
              <div className="schedule-week">
                <span className="sw-week">1주차</span>
                <span className="sw-date">6월 20일 <em>토</em></span>
                <span className="sw-badge opening">개강</span>
              </div>
              <div className="schedule-week">
                <span className="sw-week">2주차</span>
                <span className="sw-date">6월 27일 <em>토</em></span>
              </div>
              <div className="schedule-week">
                <span className="sw-week">3주차</span>
                <span className="sw-date">7월 4일 <em>토</em></span>
              </div>
              <div className="schedule-week">
                <span className="sw-week">4주차</span>
                <span className="sw-date">7월 11일 <em>토</em></span>
                <span className="sw-badge closing">수료</span>
              </div>
            </div>
          </div>

          <div className="curriculum-timeline">

            <div className="curriculum-phase">
              <div className="phase-header">
                <div className="phase-num">PHASE 1</div>
                <div className="phase-title-wrap">
                  <h3>진단 &amp; 분석</h3>
                  <span>반복 업무 구조 파악 및 에이전트화 가능 업무 선정</span>
                </div>
                <div className="phase-date-badge"><i className="fa-regular fa-calendar"></i> 6월 20일 (토)</div>
              </div>
              <div className="phase-modules">
                <div className="module-item">
                  <span className="module-num">01</span>
                  <div className="module-content">
                    <strong>반복 업무 유형 분류와 구조 진단</strong>
                    <p>어떤 업무가 반복되는지 파악하고, 에이전트로 전환 가능한 업무를 선별하는 방법을 학습합니다.</p>
                  </div>
                </div>
                <div className="module-item">
                  <span className="module-num">02</span>
                  <div className="module-content">
                    <strong>업무 흐름 맵핑과 병목 구간 발견</strong>
                    <p>현재 업무 흐름 전체를 시각화하고, AI 에이전트 도입 시 효과가 가장 큰 구간을 찾아냅니다.</p>
                  </div>
                </div>
                <div className="module-item">
                  <span className="module-num">03</span>
                  <div className="module-content">
                    <strong>에이전트 구축 우선순위 설정</strong>
                    <p>한정된 자원 안에서 무엇을 먼저 구축할지, 업무 영향도 기준으로 우선순위를 정리합니다.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="curriculum-phase">
              <div className="phase-header">
                <div className="phase-num">PHASE 2</div>
                <div className="phase-title-wrap">
                  <h3>설계 &amp; 구축</h3>
                  <span>에이전트 초안 설계 및 단계별 구축 실습</span>
                </div>
                <div className="phase-date-badge"><i className="fa-regular fa-calendar"></i> 6월 27일 · 7월 4일 (토)</div>
              </div>
              <div className="phase-modules">
                <div className="module-item">
                  <span className="module-num">04</span>
                  <div className="module-content">
                    <strong>에이전트 구축 초안 작성법</strong>
                    <p>초안을 어떻게 잡고 어떤 순서로 발전시켜 나가야 하는지 실전 워크시트와 함께 학습합니다.</p>
                  </div>
                </div>
                <div className="module-item">
                  <span className="module-num">05</span>
                  <div className="module-content">
                    <strong>입력-처리-출력 구조 설계</strong>
                    <p>ChatGPT, Claude, Gemini를 활용해 각 업무에 맞는 입력·처리·출력 구조를 설계합니다.</p>
                  </div>
                </div>
                <div className="module-item">
                  <span className="module-num">06</span>
                  <div className="module-content">
                    <strong>실무형 프롬프트 시스템 구축</strong>
                    <p>단순 프롬프트를 넘어, 재사용·재조합 가능한 프롬프트 시스템을 설계하고 문서화합니다.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="curriculum-phase">
              <div className="phase-header">
                <div className="phase-num">PHASE 3</div>
                <div className="phase-title-wrap">
                  <h3>완성 &amp; 확장</h3>
                  <span>실행 로드맵 완성 및 컨설팅·강의 활동 전환 준비</span>
                </div>
                <div className="phase-date-badge closing-badge"><i className="fa-regular fa-calendar"></i> 7월 11일 (토) · 수료</div>
              </div>
              <div className="phase-modules">
                <div className="module-item">
                  <span className="module-num">07</span>
                  <div className="module-content">
                    <strong>단계별 실행 로드맵 완성</strong>
                    <p>학습한 내용을 바탕으로 내 업무에 맞는 AI 에이전트 실행 로드맵을 완성합니다.</p>
                  </div>
                </div>
                <div className="module-item">
                  <span className="module-num">08</span>
                  <div className="module-content">
                    <strong>컨설팅·강의 활용 자료 패키징</strong>
                    <p>수강 중 산출된 결과물을 컨설팅 제안서 및 강의 교안으로 활용하는 방법을 학습합니다.</p>
                  </div>
                </div>
                <div className="module-item">
                  <span className="module-num">09</span>
                  <div className="module-content">
                    <strong>컨설턴트 자격 및 강사 인증 연계 안내</strong>
                    <p>이 과정 수료 이후 협회 컨설턴트 자격 취득 및 강사 인증으로 이어지는 경로를 안내합니다.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ====== RESULTS SECTION ====== */}
      <section className="section results-section" id="results">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">수강 후 결과물</span>
            <h2 className="section-title">과정 수료 후 이 5가지를 갖게 됩니다</h2>
            <p className="section-desc">강의 중에 직접 만들고, 수료 후 바로 현장에서 사용할 수 있는 실무 결과물입니다.</p>
          </div>
          <div className="results-grid">
            <div className="result-card result-card-1">
              <div className="result-icon"><i className="fa-solid fa-clipboard-list"></i></div>
              <div className="result-num">01</div>
              <h3>반복 업무 구조 진단표</h3>
              <p>현재 업무의 반복 구간, 병목 지점, 에이전트화 가능 영역을 한눈에 정리한 진단 문서입니다.</p>
              <div className="result-use-tag"><i className="fa-solid fa-star"></i> 컨설팅 초기 진단에 즉시 활용</div>
            </div>
            <div className="result-card result-card-2">
              <div className="result-icon"><i className="fa-solid fa-drafting-compass"></i></div>
              <div className="result-num">02</div>
              <h3>에이전트 구축 초안 설계안</h3>
              <p>내 업무에 맞는 에이전트 구성 방향을 단계적으로 정리한 실무 설계 문서입니다.</p>
              <div className="result-use-tag"><i className="fa-solid fa-star"></i> 클라이언트 제안서에 바로 활용</div>
            </div>
            <div className="result-card result-card-3">
              <div className="result-icon"><i className="fa-solid fa-map-marked-alt"></i></div>
              <div className="result-num">03</div>
              <h3>단계별 실행 로드맵</h3>
              <p>에이전트 구축을 어떤 순서로, 어떤 기간에 걸쳐 실행할지 정리된 실행 계획서입니다.</p>
              <div className="result-use-tag"><i className="fa-solid fa-star"></i> 강의 교안 핵심 자료로 활용</div>
            </div>
            <div className="result-card result-card-4">
              <div className="result-icon"><i className="fa-solid fa-arrows-left-right-to-line"></i></div>
              <div className="result-num">04</div>
              <h3>입력-처리-출력 구조 문서</h3>
              <p>업무 흐름을 AI 에이전트 관점에서 구조화한 핵심 설계 문서입니다.</p>
              <div className="result-use-tag"><i className="fa-solid fa-star"></i> 반복 활용 가능한 실무 템플릿</div>
            </div>
            <div className="result-card result-card-5">
              <div className="result-icon"><i className="fa-solid fa-terminal"></i></div>
              <div className="result-num">05</div>
              <h3>실무형 프롬프트 시스템</h3>
              <p>단순 프롬프트가 아닌, 재사용·재조합 가능한 구조화된 프롬프트 패키지입니다.</p>
              <div className="result-use-tag"><i className="fa-solid fa-star"></i> 즉시 업무 적용 가능</div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== SUPPORT SYSTEM SECTION ====== */}
      <section className="section system-section" id="system">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">협회 전용 지원 시스템</span>
            <h2 className="section-title">협회가 제공하는 전용 지원 인프라</h2>
            <p className="section-desc">AI 에이전트 협회 아카데미는 수강생과 강사·컨설턴트를 위한<br />전용 지원 시스템을 개발·운영하고 있습니다.</p>
          </div>
          <div className="system-grid">
            <div className="system-card">
              <div className="system-icon-wrap sys-1"><i className="fa-solid fa-book-open"></i></div>
              <h3>단계별 구축 매뉴얼 출력 시스템</h3>
              <p>구축 단계별로 필요한 매뉴얼을 즉시 출력하고 활용할 수 있는 전용 플랫폼을 개발 중입니다.</p>
              <div className="system-badge">개발 중 · 수강생 우선 제공 예정</div>
            </div>
            <div className="system-card">
              <div className="system-icon-wrap sys-2"><i className="fa-solid fa-puzzle-piece"></i></div>
              <h3>에이전트 설계 보조 자료</h3>
              <p>초안 작성부터 완성 단계까지, 에이전트 설계를 도와주는 워크시트·템플릿·가이드 자료를 제공합니다.</p>
              <div className="system-badge">수강 시 즉시 제공</div>
            </div>
            <div className="system-card">
              <div className="system-icon-wrap sys-3"><i className="fa-solid fa-hands-helping"></i></div>
              <h3>지도·컨설팅 현장 지원 도구</h3>
              <p>강사 및 컨설턴트가 현장에서 바로 활용할 수 있도록, 지도 흐름에 맞는 현장 지원 도구를 지속 업데이트합니다.</p>
              <div className="system-badge">강사 인증 후 제공</div>
            </div>
            <div className="system-card">
              <div className="system-icon-wrap sys-4"><i className="fa-solid fa-file-contract"></i></div>
              <h3>강사·컨설턴트용 실무 문서 기반</h3>
              <p>강의 교안, 컨설팅 제안서, 진단 문서 등 강사·컨설턴트 활동에 필요한 실무 문서를 체계적으로 지원합니다.</p>
              <div className="system-badge">강사 인증 후 제공</div>
            </div>
          </div>
          <div className="system-notice">
            <i className="fa-solid fa-circle-info"></i>
            <p>협회는 현재 단계별 구축 매뉴얼, 출력 자료, 구성안 등을 제공할 수 있는 전용 사이트를 개발 중입니다. 향후 지도·컨설팅 현장에서 활용할 수 있도록 지속적으로 지원할 예정입니다.</p>
          </div>
        </div>
      </section>

      {/* ====== QUALIFICATION SECTION ====== */}
      <section className="section qualify-section" id="qualify">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">자격 및 활동 확장</span>
            <h2 className="section-title">이 과정은 확장의 시작입니다</h2>
            <p className="section-desc">단순 수강으로 끝나지 않습니다.<br />컨설턴트 자격, 강사 인증, 대행 사업까지 연결됩니다.</p>
          </div>
          <div className="qualify-path">
            <div className="path-step">
              <div className="path-icon"><i className="fa-solid fa-graduation-cap"></i></div>
              <div className="path-content">
                <span className="path-label">STEP 1</span>
                <h3>기초 과정 수료</h3>
                <p>AI 업무 에이전트 구축 기초 과정을 이수하고 실무 결과물 5종을 완성합니다.</p>
              </div>
            </div>
            <div className="path-connector"><i className="fa-solid fa-arrow-right"></i></div>
            <div className="path-step">
              <div className="path-icon"><i className="fa-solid fa-id-card"></i></div>
              <div className="path-content">
                <span className="path-label">STEP 2</span>
                <h3>컨설턴트 자격 취득</h3>
                <p>기초 과정은 협회 공인 AI 에이전트 구축 컨설턴트 자격과 연계됩니다.</p>
              </div>
            </div>
            <div className="path-connector"><i className="fa-solid fa-arrow-right"></i></div>
            <div className="path-step">
              <div className="path-icon"><i className="fa-solid fa-certificate"></i></div>
              <div className="path-content">
                <span className="path-label">STEP 3</span>
                <h3>강사 인증 취득</h3>
                <p>컨설턴트 자격 이후 강사 인증 과정을 통해 공인 강사로 활동할 수 있습니다.</p>
              </div>
            </div>
            <div className="path-connector"><i className="fa-solid fa-arrow-right"></i></div>
            <div className="path-step path-step-final">
              <div className="path-icon"><i className="fa-solid fa-rocket"></i></div>
              <div className="path-content">
                <span className="path-label">STEP 4</span>
                <h3>컨설팅·강의 활동</h3>
                <p>기업·기관 대상 컨설팅, 강의, AI 에이전트 구축 대행까지 사업으로 확장합니다.</p>
              </div>
            </div>
          </div>

          <div className="expand-cards">
            <div className="expand-card">
              <div className="expand-icon"><i className="fa-solid fa-chart-pie"></i></div>
              <h3>컨설팅 활동</h3>
              <ul>
                <li><i className="fa-solid fa-check"></i> 기업 AI 에이전트 도입 컨설팅</li>
                <li><i className="fa-solid fa-check"></i> 업무 자동화 구조 설계 컨설팅</li>
                <li><i className="fa-solid fa-check"></i> 협회 공인 자격으로 신뢰도 확보</li>
              </ul>
            </div>
            <div className="expand-card">
              <div className="expand-icon"><i className="fa-solid fa-chalkboard-teacher"></i></div>
              <h3>강의 활동</h3>
              <ul>
                <li><i className="fa-solid fa-check"></i> 기업 내부 교육 강사 활동</li>
                <li><i className="fa-solid fa-check"></i> 협회 공인 강사로 외부 강의 진행</li>
                <li><i className="fa-solid fa-check"></i> 단계별 교안 및 매뉴얼 활용</li>
              </ul>
            </div>
            <div className="expand-card">
              <div className="expand-icon"><i className="fa-solid fa-handshake"></i></div>
              <h3>대행 사업</h3>
              <ul>
                <li><i className="fa-solid fa-check"></i> AI 에이전트 구축 대행 서비스 운영</li>
                <li><i className="fa-solid fa-check"></i> 협회 대행 파트너로 활동 가능</li>
                <li><i className="fa-solid fa-check"></i> 지속적인 사업 수익 창출</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ====== EDU vs AGENCY SECTION ====== */}
      <section className="section agency-section" id="agency">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">교육 vs 대행</span>
            <h2 className="section-title">
              직접 배우고 싶다면 <em>교육</em>으로,<br />
              빠르게 적용하고 싶다면 <em>대행</em>으로
            </h2>
            <p className="section-desc">AI 에이전트 협회는 교육과 대행 두 가지 방식으로 여러분의 업무 변화를 지원합니다.</p>
          </div>
          <div className="agency-compare">
            <div className="compare-card compare-edu">
              <div className="compare-header">
                <div className="compare-icon"><i className="fa-solid fa-book-open-reader"></i></div>
                <h3>교육 과정</h3>
                <p className="compare-subtitle">AI 업무 에이전트 구축 기초 과정</p>
              </div>
              <ul className="compare-list">
                <li><i className="fa-solid fa-circle-check"></i> 직접 구축 역량을 체계적으로 습득</li>
                <li><i className="fa-solid fa-circle-check"></i> 5종 실무 결과물 직접 완성</li>
                <li><i className="fa-solid fa-circle-check"></i> 컨설턴트·강사 자격으로 확장 가능</li>
                <li><i className="fa-solid fa-circle-check"></i> 협회 지원 시스템 활용</li>
                <li><i className="fa-solid fa-circle-check"></i> 장기적 역량 자산 확보</li>
              </ul>
            </div>
            <div className="compare-vs"><span>VS</span></div>
            <div className="compare-card compare-agency">
              <div className="compare-header">
                <div className="compare-icon"><i className="fa-solid fa-robot"></i></div>
                <h3>AI 에이전트 구축 대행</h3>
                <p className="compare-subtitle">협회 공인 대행 서비스</p>
              </div>
              <ul className="compare-list">
                <li><i className="fa-solid fa-circle-check"></i> 전문가가 직접 에이전트 구축 진행</li>
                <li><i className="fa-solid fa-circle-check"></i> 빠른 시간 안에 즉시 적용 가능</li>
                <li><i className="fa-solid fa-circle-check"></i> 업무 분석부터 완성까지 원스톱</li>
                <li><i className="fa-solid fa-circle-check"></i> 협회 공인 전문가가 직접 대행</li>
                <li><i className="fa-solid fa-circle-check"></i> 단기간 업무 효율 극대화</li>
              </ul>
              <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="btn btn-agency btn-full">대행 문의하기</a>
            </div>
          </div>
        </div>
      </section>

      {/* ====== TESTIMONIALS ====== */}
      <section className="section testimonial-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">수강 후기</span>
            <h2 className="section-title">먼저 경험한 분들의 이야기</h2>
          </div>
          <div className="testimonial-grid">
            <div className="testimonial-card">
              <div className="testimonial-quote"><i className="fa-solid fa-quote-left"></i></div>
              <p>&ldquo;반복 업무를 줄이고 싶었는데, 어디서부터 시작해야 할지 막막했습니다. 이 과정에서 진단표를 만들고 나니 처음으로 업무 전체가 눈에 보이기 시작했습니다.&rdquo;</p>
              <div className="testimonial-author">
                <div className="author-avatar"><i className="fa-solid fa-user"></i></div>
                <div>
                  <strong>마케팅 팀장 김○○</strong>
                  <span>중소기업 마케팅 부서</span>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-quote"><i className="fa-solid fa-quote-left"></i></div>
              <p>&ldquo;클라이언트에게 AI 에이전트 도입을 설명해야 했는데, 이 과정의 구조 문서와 로드맵 덕분에 훨씬 설득력 있는 제안을 할 수 있게 됐습니다.&rdquo;</p>
              <div className="testimonial-author">
                <div className="author-avatar"><i className="fa-solid fa-user"></i></div>
                <div>
                  <strong>경영 컨설턴트 이○○</strong>
                  <span>프리랜서 컨설턴트</span>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-quote"><i className="fa-solid fa-quote-left"></i></div>
              <p>&ldquo;강사 인증까지 연결된다는 게 가장 큰 장점입니다. 수강하면서 만든 교안이 실제 기업 교육에서 그대로 활용되고 있습니다.&rdquo;</p>
              <div className="testimonial-author">
                <div className="author-avatar"><i className="fa-solid fa-user"></i></div>
                <div>
                  <strong>기업교육 강사 박○○</strong>
                  <span>AI 업무 교육 전문 강사</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FAQ SECTION ====== */}
      <section className="section faq-section" id="faq">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">자주 묻는 질문</span>
            <h2 className="section-title">궁금한 점이 있으신가요?</h2>
          </div>
          <div className="faq-list">
            <div className="faq-item">
              <button className="faq-question" aria-expanded="false">
                <span>AI를 전혀 사용해보지 않은 초보자도 수강할 수 있나요?</span>
                <i className="fa-solid fa-plus faq-icon"></i>
              </button>
              <div className="faq-answer">
                <p>네, 가능합니다. 이 과정은 ChatGPT·Claude·Gemini 등 AI 도구를 처음 접하는 분들도 이해할 수 있도록 기초 개념부터 단계적으로 다룹니다. 중요한 것은 AI 지식보다 &lsquo;내 업무를 구조화하려는 의지&rsquo;입니다.</p>
              </div>
            </div>
            <div className="faq-item">
              <button className="faq-question" aria-expanded="false">
                <span>컨설턴트 자격은 어떻게 취득하나요?</span>
                <i className="fa-solid fa-plus faq-icon"></i>
              </button>
              <div className="faq-answer">
                <p>이 기초 과정을 수료한 뒤, 협회가 운영하는 컨설턴트 자격 과정을 이수하시면 됩니다. 자격 과정은 기초 과정 수료자를 대상으로 진행되며, 수료 후 협회 공인 AI 에이전트 구축 컨설턴트로 활동하실 수 있습니다.</p>
              </div>
            </div>
            <div className="faq-item">
              <button className="faq-question" aria-expanded="false">
                <span>강사 인증 후 어떤 활동을 할 수 있나요?</span>
                <i className="fa-solid fa-plus faq-icon"></i>
              </button>
              <div className="faq-answer">
                <p>협회 공인 강사로 기업 내부 교육, 외부 강의, 워크숍 진행이 가능합니다. 협회에서 제공하는 단계별 교안과 매뉴얼을 활용할 수 있으며, 협회 강사 네트워크를 통한 강의 연계도 지원받을 수 있습니다.</p>
              </div>
            </div>
            <div className="faq-item">
              <button className="faq-question" aria-expanded="false">
                <span>AI 에이전트 구축 대행 서비스는 어떻게 신청하나요?</span>
                <i className="fa-solid fa-plus faq-icon"></i>
              </button>
              <div className="faq-answer">
                <p>하단 CTA 섹션의 &lsquo;AI 에이전트 구축 대행 문의&rsquo; 버튼을 통해 문의하시면, 협회 담당자가 업무 분석 후 맞춤 대행 서비스를 안내해드립니다. 업무 규모와 성격에 따라 맞춤 견적이 제공됩니다.</p>
              </div>
            </div>
            <div className="faq-item">
              <button className="faq-question" aria-expanded="false">
                <span>협회 전용 지원 시스템은 언제부터 사용할 수 있나요?</span>
                <i className="fa-solid fa-plus faq-icon"></i>
              </button>
              <div className="faq-answer">
                <p>현재 전용 플랫폼을 개발 중이며, 수강 시 제공되는 워크시트·템플릿 자료는 즉시 활용 가능합니다. 강사 인증 취득 후에는 지도·컨설팅 현장 지원 도구가 추가로 제공될 예정입니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FINAL CTA SECTION ====== */}
      <section className="section cta-section" id="cta">
        <div className="cta-bg-pattern"></div>
        <div className="container">
          <div className="cta-inner">
            <div className="cta-tag-row">
              <span className="cta-badge">지금 바로 시작하세요</span>
            </div>
            <h2 className="cta-title">
              AI 에이전트형 업무 체계,<br />
              지금 첫 걸음을 내딛으세요
            </h2>
            <p className="cta-desc">
              강사 인증 문의부터 자격 과정 문의, 대행 문의까지<br />
              AI 에이전트 협회 아카데미가 함께합니다.
            </p>

            <div className="cta-cards-grid">
              <div className="cta-card cta-card-main">
                <div className="cta-card-icon"><i className="fa-solid fa-certificate"></i></div>
                <h3>강사 인증 문의</h3>
                <p>이 과정을 기반으로 공인 강사로 활동하고 싶은 분을 위한 문의 채널입니다.</p>
                <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="btn btn-white btn-full cta-main-btn">강사 인증 문의하기 →</a>
              </div>
              <div className="cta-card">
                <div className="cta-card-icon"><i className="fa-solid fa-id-badge"></i></div>
                <h3>자격 과정 문의</h3>
                <p>컨설턴트 자격 취득을 원하시는 분을 위한 상세 안내를 받으세요.</p>
                <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline-white btn-full">자격 과정 문의하기 →</a>
              </div>
              <div className="cta-card">
                <div className="cta-card-icon"><i className="fa-solid fa-robot"></i></div>
                <h3>AI 에이전트 구축 대행 문의</h3>
                <p>직접 배우기보다 빠른 도입을 원하시는 분을 위한 대행 서비스 문의입니다.</p>
                <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline-white btn-full">대행 문의하기 →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="nav-logo">
                <span className="logo-badge">AI</span>
                <div className="logo-text">
                  <span className="logo-main">AI 에이전트 협회</span>
                  <span className="logo-sub">ACADEMY</span>
                </div>
              </div>
              <p className="footer-tagline">반복 업무를 줄이고, AI 에이전트형 업무 체계를 구축하는<br />실무 전문 교육 기관입니다.</p>
            </div>
            <div className="footer-links">
              <div className="footer-link-group">
                <h4>과정 안내</h4>
                <a href="#course-intro">과정 개요</a>
                <a href="#curriculum">커리큘럼</a>
                <a href="#results">수강 후 결과물</a>
                <a href="#system">지원 시스템</a>
              </div>
              <div className="footer-link-group">
                <h4>활동 확장</h4>
                <a href="#qualify">자격 및 확장</a>
                <a href="#agency">교육 vs 대행</a>
                <a href="#faq">자주 묻는 질문</a>
              </div>
              <div className="footer-link-group">
                <h4>문의</h4>
                <a href="#cta">강사 인증 문의</a>
                <a href="#cta">자격 과정 문의</a>
                <a href="#cta">대행 서비스 문의</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-copy">© 2025 AI 에이전트 협회 아카데미. All rights reserved.</p>
            <div className="footer-legal">
              <a href="#">개인정보처리방침</a>
              <a href="#">이용약관</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating CTA Button */}
      <div className="floating-cta" id="floatingCta">
        <a href={APPLY_URL} target="_blank" rel="noopener noreferrer" className="floating-btn">
          <i className="fa-solid fa-certificate"></i>
          <span>강사 인증 문의</span>
        </a>
      </div>
    </>
  )
}
