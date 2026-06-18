'use client'

import { useEffect } from 'react'

/**
 * AI 에이전트 협회 아카데미 랜딩페이지 인터랙션
 * 원본 js/main.js 의 동작을 Next.js 클라이언트 컴포넌트로 이식.
 * 마크업은 서버 컴포넌트(page.tsx)가 렌더링하고, 이 컴포넌트는
 * 마운트 후 DOM 을 대상으로 이벤트/애니메이션만 연결한다.
 */
export default function LandingInteractions() {
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    /* 1. 헤더 스크롤 효과 */
    const header = document.getElementById('site-header')
    if (header) {
      window.addEventListener(
        'scroll',
        () => {
          if (window.scrollY > 60) header.classList.add('scrolled')
          else header.classList.remove('scrolled')
        },
        { passive: true, signal }
      )
    }

    /* 2. 햄버거 메뉴 */
    const hamburger = document.getElementById('hamburger')
    const mobileMenu = document.getElementById('mobile-menu')
    if (hamburger && mobileMenu) {
      const spans = hamburger.querySelectorAll('span')
      hamburger.addEventListener(
        'click',
        () => {
          const isOpen = mobileMenu.classList.toggle('open')
          hamburger.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기')
          if (isOpen) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)'
            spans[1].style.opacity = '0'
            spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)'
          } else {
            spans[0].style.transform = ''
            spans[1].style.opacity = ''
            spans[2].style.transform = ''
          }
        },
        { signal }
      )
      mobileMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener(
          'click',
          () => {
            mobileMenu.classList.remove('open')
            spans[0].style.transform = ''
            spans[1].style.opacity = ''
            spans[2].style.transform = ''
          },
          { signal }
        )
      })
    }

    /* 3. 히어로 파티클 효과 */
    const particles = document.getElementById('hero-particles')
    if (particles && particles.childElementCount === 0) {
      const colors = ['#c9a227', '#1a7f8e', '#2a4a8e', '#f0c842', '#ffffff']
      const count = window.innerWidth < 768 ? 15 : 30
      for (let i = 0; i < count; i++) {
        const el = document.createElement('div')
        el.className = 'particle'
        const size = Math.random() * 6 + 2
        const left = Math.random() * 100
        const delay = Math.random() * 12
        const duration = Math.random() * 10 + 8
        const color = colors[Math.floor(Math.random() * colors.length)]
        el.style.cssText = [
          'width:' + size + 'px',
          'height:' + size + 'px',
          'left:' + left + '%',
          'bottom:-10px',
          'background:' + color,
          'animation-delay:' + delay + 's',
          'animation-duration:' + duration + 's',
          'opacity:' + (Math.random() * 0.3 + 0.1),
        ].join(';')
        particles.appendChild(el)
      }
    }

    /* 4. 스크롤 리빌 애니메이션 */
    const revealSelectors = [
      '.about-card', '.why-item', '.problem-card',
      '.result-card', '.support-item', '.activity-card',
      '.target-card', '.faq-item', '.flow-step', '.cert-point',
      '.curr-panel-header', '.book-banner-card', '.cta-card',
      '.section-title', '.section-desc', '.section-label',
      '.instructor-list li',
    ]
    const revealEls = document.querySelectorAll<HTMLElement>(revealSelectors.join(','))
    revealEls.forEach((el) => el.classList.add('reveal'))
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), 50)
            revealObserver.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    revealEls.forEach((el) => {
      let delay = 0
      if (
        el.closest('.about-cards') || el.closest('.results-grid') ||
        el.closest('.support-grid') || el.closest('.target-grid') ||
        el.closest('.cta-cards') || el.closest('.expansion-activities')
      ) {
        const siblings = el.parentElement ? el.parentElement.children : []
        for (let i = 0; i < siblings.length; i++) {
          if (siblings[i] === el) { delay = i * 80; break }
        }
        el.style.transitionDelay = delay + 'ms'
      }
      revealObserver.observe(el)
    })

    /* 5. 커리큘럼 탭 */
    const tabs = document.querySelectorAll<HTMLElement>('.curr-tab')
    const panels = document.querySelectorAll<HTMLElement>('.curr-panel')
    tabs.forEach((tab) => {
      tab.addEventListener(
        'click',
        () => {
          const targetIdx = parseInt(tab.getAttribute('data-tab') || '0')
          tabs.forEach((t) => t.classList.remove('active'))
          panels.forEach((p) => p.classList.remove('active'))
          tab.classList.add('active')
          const targetPanel = document.querySelector<HTMLElement>('[data-panel="' + targetIdx + '"]')
          if (targetPanel) {
            targetPanel.classList.add('active')
            const items = targetPanel.querySelectorAll<HTMLElement>('.curr-list li, .curr-keyword')
            items.forEach((item, i) => {
              item.style.opacity = '0'
              item.style.transform = 'translateY(12px)'
              setTimeout(() => {
                item.style.transition = 'opacity 0.35s ease, transform 0.35s ease'
                item.style.opacity = '1'
                item.style.transform = 'translateY(0)'
              }, i * 60)
            })
          }
        },
        { signal }
      )
    })

    /* 6. FAQ 아코디언 */
    const faqItems = document.querySelectorAll('.faq-item')
    faqItems.forEach((item) => {
      const btn = item.querySelector('.faq-q')
      const answer = item.querySelector('.faq-a')
      if (!btn || !answer) return
      btn.addEventListener(
        'click',
        () => {
          const isOpen = btn.getAttribute('aria-expanded') === 'true'
          faqItems.forEach((other) => {
            const oBtn = other.querySelector('.faq-q')
            const oAns = other.querySelector('.faq-a')
            if (oBtn && oAns) {
              oBtn.setAttribute('aria-expanded', 'false')
              oAns.classList.remove('open')
            }
          })
          if (!isOpen) {
            btn.setAttribute('aria-expanded', 'true')
            answer.classList.add('open')
          }
        },
        { signal }
      )
    })

    /* 7. 플로팅 CTA 버튼 */
    const floatingCta = document.getElementById('floating-cta')
    const heroSection = document.getElementById('hero')
    const finalCta = document.getElementById('final-cta')
    if (floatingCta) {
      window.addEventListener(
        'scroll',
        () => {
          const scrollTop = window.scrollY
          const windowHeight = window.innerHeight
          const docHeight = document.documentElement.scrollHeight
          const heroBottom = heroSection
            ? heroSection.offsetTop + heroSection.offsetHeight
            : 600
          const finalTop = finalCta ? finalCta.offsetTop : docHeight
          if (scrollTop > heroBottom - windowHeight / 2 && scrollTop + windowHeight < finalTop + 200) {
            floatingCta.classList.add('visible')
          } else {
            floatingCta.classList.remove('visible')
          }
        },
        { passive: true, signal }
      )
    }

    /* 8. 부드러운 스크롤 */
    document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener(
        'click',
        (e) => {
          const href = anchor.getAttribute('href')
          if (!href || href === '#') return
          const target = document.querySelector<HTMLElement>(href)
          if (target) {
            e.preventDefault()
            const headerHeight = 70
            const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight
            window.scrollTo({ top: targetTop, behavior: 'smooth' })
          }
        },
        { signal }
      )
    })

    /* 9. 숫자 카운터 / 히어로 통계 페이드인 */
    const statsSection = document.querySelector<HTMLElement>('.hero-stats')
    if (statsSection) {
      let animated = false
      const statObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !animated) {
            animated = true
            statsSection.style.opacity = '0'
            statsSection.style.transform = 'translateY(20px)'
            setTimeout(() => {
              statsSection.style.transition = 'opacity 0.8s ease, transform 0.8s ease'
              statsSection.style.opacity = '1'
              statsSection.style.transform = 'translateY(0)'
            }, 200)
            statObserver.unobserve(statsSection)
          }
        },
        { threshold: 0.5 }
      )
      statObserver.observe(statsSection)
    }

    /* 10. CTA 클릭 추적 (콘솔 로그) */
    document.addEventListener(
      'click',
      (e) => {
        const target = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="mailto"]')
        if (target) {
          const subject = new URL(target.href).searchParams.get('subject') || '문의'
          console.log('[CTA 클릭]', subject, new Date().toISOString())
        }
      },
      { signal }
    )

    /* 11. 히어로 배경 시차 효과 */
    const heroBg = heroSection ? heroSection.querySelector<HTMLElement>('.hero-bg-layer') : null
    if (heroBg) {
      window.addEventListener(
        'scroll',
        () => {
          const scrolled = window.scrollY
          if (scrolled < window.innerHeight * 1.5) {
            heroBg.style.transform = 'translateY(' + scrolled * 0.3 + 'px)'
          }
        },
        { passive: true, signal }
      )
    }

    /* 12. 네비게이션 활성 섹션 하이라이트 */
    const navLinks = document.querySelectorAll<HTMLAnchorElement>('.header-nav a[href^="#"]')
    const navSections: { link: HTMLAnchorElement; section: HTMLElement }[] = []
    navLinks.forEach((link) => {
      const section = document.querySelector<HTMLElement>(link.getAttribute('href') || '')
      if (section) navSections.push({ link, section })
    })
    window.addEventListener(
      'scroll',
      () => {
        const scrollPos = window.scrollY + 120
        let activeSet = false
        for (let i = navSections.length - 1; i >= 0; i--) {
          if (navSections[i].section.offsetTop <= scrollPos) {
            navLinks.forEach((l) => {
              l.style.borderBottomColor = 'transparent'
              l.style.color = 'rgba(255,255,255,0.75)'
            })
            navSections[i].link.style.borderBottomColor = '#c9a227'
            navSections[i].link.style.color = '#ffffff'
            activeSet = true
            break
          }
        }
        if (!activeSet) {
          navLinks.forEach((l) => {
            l.style.borderBottomColor = 'transparent'
            l.style.color = 'rgba(255,255,255,0.75)'
          })
        }
      },
      { passive: true, signal }
    )

    /* 13. 카드 호버 3D 틸트 */
    const tiltCards = document.querySelectorAll<HTMLElement>('.about-card, .result-card, .cta-card')
    tiltCards.forEach((card) => {
      card.addEventListener(
        'mousemove',
        (e) => {
          const rect = card.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          const centerX = rect.width / 2
          const centerY = rect.height / 2
          const rotateX = ((y - centerY) / centerY) * -5
          const rotateY = ((x - centerX) / centerX) * 5
          card.style.transform =
            'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-6px)'
        },
        { signal }
      )
      card.addEventListener('mouseleave', () => { card.style.transform = '' }, { signal })
    })

    return () => {
      controller.abort()
      revealObserver.disconnect()
    }
  }, [])

  return null
}
