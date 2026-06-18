'use client'

import { useEffect, useRef } from 'react'
import { landingMarkup } from './landingMarkup'

/**
 * AI 에이전트 협회 아카데미 단독 랜딩페이지 (클라이언트 동작부)
 *
 * 원본 정적 사이트(index.html + main.js)를 그대로 옮겼습니다.
 * - 마크업: landingMarkup (원본 <body> 내용)
 * - 인터랙션: 아래 useEffect 가 원본 main.js 의 초기화 로직을 그대로 수행합니다.
 *   (원본은 DOMContentLoaded 에 의존했지만, 여기서는 마운트 이후 실행됩니다.)
 */
export default function LandingClient() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // 정리(cleanup) 대상 수집
    const cleanups: Array<() => void> = []
    const addListener = (
      target: Window | Document | HTMLElement,
      type: string,
      handler: EventListenerOrEventListenerObject,
      opts?: AddEventListenerOptions
    ) => {
      target.addEventListener(type, handler, opts)
      cleanups.push(() => target.removeEventListener(type, handler, opts))
    }

    /* ── 1. Navbar scroll effect ─────────────────────────────── */
    const navbar = root.querySelector<HTMLElement>('#navbar')
    if (navbar) {
      const onScroll = () => {
        if (window.scrollY > 40) navbar.classList.add('scrolled')
        else navbar.classList.remove('scrolled')
      }
      addListener(window, 'scroll', onScroll, { passive: true })
      onScroll()
    }

    /* ── 2. Hamburger menu ───────────────────────────────────── */
    const hbtn = root.querySelector<HTMLButtonElement>('#hamburger')
    const menu = root.querySelector<HTMLElement>('#mobileMenu')
    if (hbtn && menu) {
      const onClick = () => {
        const isOpen = menu.classList.toggle('open')
        hbtn.setAttribute('aria-expanded', String(isOpen))
        const spans = hbtn.querySelectorAll('span')
        if (isOpen) {
          ;(spans[0] as HTMLElement).style.transform = 'translateY(7px) rotate(45deg)'
          ;(spans[1] as HTMLElement).style.opacity = '0'
          ;(spans[2] as HTMLElement).style.transform = 'translateY(-7px) rotate(-45deg)'
        } else {
          ;(spans[0] as HTMLElement).style.transform = ''
          ;(spans[1] as HTMLElement).style.opacity = ''
          ;(spans[2] as HTMLElement).style.transform = ''
        }
      }
      addListener(hbtn, 'click', onClick)
      menu.querySelectorAll('a').forEach((a) => {
        const onLink = () => {
          menu.classList.remove('open')
          hbtn.setAttribute('aria-expanded', 'false')
          hbtn.querySelectorAll('span').forEach((s) => {
            ;(s as HTMLElement).style.transform = ''
            ;(s as HTMLElement).style.opacity = ''
          })
        }
        addListener(a as HTMLElement, 'click', onLink)
      })
    }

    /* ── 3. Hero particles ───────────────────────────────────── */
    const particles = root.querySelector<HTMLElement>('#heroParticles')
    if (particles && particles.childElementCount === 0) {
      const COUNT = 24
      for (let i = 0; i < COUNT; i++) {
        const p = document.createElement('div')
        p.className = 'particle'
        const size = Math.random() * 3 + 1.5
        const left = Math.random() * 100
        const delay = Math.random() * 12
        const dur = 12 + Math.random() * 14
        const bright = Math.random() > 0.6
        p.style.cssText = `left:${left}%;width:${size}px;height:${size}px;animation-delay:${delay}s;animation-duration:${dur}s;opacity:${bright ? 0.5 : 0.2};background:${bright ? '#00c8ff' : 'rgba(0,200,255,0.6)'};`
        particles.appendChild(p)
      }
    }

    /* ── 4. Scroll-to-top button ─────────────────────────────── */
    const topBtn = root.querySelector<HTMLButtonElement>('#scrollTop')
    if (topBtn) {
      const onScroll = () => {
        if (window.scrollY > 500) topBtn.classList.add('visible')
        else topBtn.classList.remove('visible')
      }
      addListener(window, 'scroll', onScroll, { passive: true })
      addListener(topBtn, 'click', () =>
        window.scrollTo({ top: 0, behavior: 'smooth' })
      )
    }

    /* ── 5. AOS (Animate On Scroll) ──────────────────────────── */
    const aosEls = root.querySelectorAll<HTMLElement>('[data-aos]')
    const aosObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('aos-animate')
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    aosEls.forEach((el) => aosObserver.observe(el))
    cleanups.push(() => aosObserver.disconnect())

    /* ── 6. Analysis tabs ────────────────────────────────────── */
    const tabBtns = root.querySelectorAll<HTMLButtonElement>('.tab-btn')
    const tabContents = root.querySelectorAll<HTMLElement>('.tab-content')
    tabBtns.forEach((btn) => {
      const onClick = () => {
        const target = btn.dataset.tab
        tabBtns.forEach((b) => b.classList.remove('active'))
        tabContents.forEach((c) => c.classList.remove('active'))
        btn.classList.add('active')
        const tc = root.querySelector<HTMLElement>(`#tab-${target}`)
        if (tc) {
          tc.classList.add('active')
          tc.querySelectorAll('[data-aos]').forEach((el) =>
            el.classList.add('aos-animate')
          )
        }
      }
      addListener(btn, 'click', onClick)
    })

    /* ── 7. FAQ accordion ────────────────────────────────────── */
    const questions = root.querySelectorAll<HTMLButtonElement>('.faq-question')
    questions.forEach((btn) => {
      const onClick = () => {
        const isExpanded = btn.getAttribute('aria-expanded') === 'true'
        const answer = btn.nextElementSibling
        questions.forEach((other) => {
          if (other !== btn) {
            other.setAttribute('aria-expanded', 'false')
            other.nextElementSibling?.classList.remove('open')
          }
        })
        if (isExpanded) {
          btn.setAttribute('aria-expanded', 'false')
          answer?.classList.remove('open')
        } else {
          btn.setAttribute('aria-expanded', 'true')
          answer?.classList.add('open')
        }
      }
      addListener(btn, 'click', onClick)
    })

    /* ── 8. Smooth scroll for anchor links ───────────────────── */
    root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
      const onClick = (e: Event) => {
        const targetId = anchor.getAttribute('href')
        if (!targetId || targetId === '#') return
        const target = root.querySelector<HTMLElement>(targetId)
        if (!target) return
        e.preventDefault()
        const navHeight = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue(
            '--nav-height'
          ) || '72',
          10
        )
        const top =
          target.getBoundingClientRect().top + window.scrollY - navHeight - 16
        window.scrollTo({ top, behavior: 'smooth' })
      }
      addListener(anchor, 'click', onClick)
    })

    /* ── 9. Active nav link highlight ────────────────────────── */
    const sections = root.querySelectorAll<HTMLElement>('section[id]')
    const navLinks = root.querySelectorAll<HTMLAnchorElement>(
      '.nav-links a[href^="#"]'
    )
    if (sections.length && navLinks.length) {
      const navHeight = 80
      const onScroll = () => {
        const scrollY = window.scrollY
        sections.forEach((section) => {
          const top = section.offsetTop - navHeight - 80
          const bottom = top + section.offsetHeight
          const id = section.getAttribute('id')
          if (scrollY >= top && scrollY < bottom) {
            navLinks.forEach((a) => {
              a.style.color = ''
              if (a.getAttribute('href') === `#${id}`)
                a.style.color = 'var(--accent)'
            })
          }
        })
      }
      addListener(window, 'scroll', onScroll, { passive: true })
    }

    /* ── 10. Hero stat counters ──────────────────────────────── */
    const animateCounters = () => {
      root.querySelectorAll<HTMLElement>('.hero-stat strong').forEach((stat) => {
        const text = (stat.textContent || '').trim()
        const match = text.match(/^(\d+)(\+?)$/)
        if (!match) return
        const end = parseInt(match[1], 10)
        const suffix = match[2] || ''
        const dur = 1500
        const start = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - start) / dur, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          stat.textContent = Math.round(eased * end) + suffix
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
    }
    const heroStatRow = root.querySelector('.hero-stat-row')
    if (heroStatRow) {
      const counterObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            animateCounters()
            counterObserver.disconnect()
          }
        },
        { threshold: 0.5 }
      )
      counterObserver.observe(heroStatRow)
      cleanups.push(() => counterObserver.disconnect())
    }

    /* ── 11. Typing cursor for hero headline ─────────────────── */
    const styleEl = document.createElement('style')
    styleEl.textContent = `@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes rippleAnim{to{transform:scale(2.5);opacity:0}}`
    document.head.appendChild(styleEl)
    cleanups.push(() => styleEl.remove())

    const highlightLine = root.querySelector<HTMLElement>('.line-highlight')
    if (highlightLine) {
      const cursor = document.createElement('span')
      cursor.style.cssText =
        'display:inline-block;width:3px;height:0.8em;background:var(--accent);margin-left:4px;vertical-align:middle;border-radius:2px;animation:blink 1s step-end infinite;'
      highlightLine.appendChild(cursor)
      const t = window.setTimeout(() => {
        cursor.style.animation = 'none'
        cursor.style.opacity = '0'
      }, 5000)
      cleanups.push(() => window.clearTimeout(t))
    }

    /* ── 12. Button ripple effect ────────────────────────────── */
    root.querySelectorAll<HTMLElement>('.btn').forEach((btn) => {
      const onClick = (e: MouseEvent) => {
        const rect = btn.getBoundingClientRect()
        const ripple = document.createElement('span')
        const size = Math.max(rect.width, rect.height)
        const x = e.clientX - rect.left - size / 2
        const y = e.clientY - rect.top - size / 2
        ripple.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${x}px;top:${y}px;background:rgba(255,255,255,0.25);border-radius:50%;transform:scale(0);animation:rippleAnim 0.6s ease-out;pointer-events:none;`
        if (getComputedStyle(btn).position === 'static')
          btn.style.position = 'relative'
        btn.style.overflow = 'hidden'
        btn.appendChild(ripple)
        window.setTimeout(() => ripple.remove(), 700)
      }
      addListener(btn, 'click', onClick as EventListener)
    })

    /* ── 13. Highlight box entrance glow ─────────────────────── */
    const hlObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting)
            (entry.target as HTMLElement).style.boxShadow =
              '0 0 40px rgba(0,200,255,0.1)'
        })
      },
      { threshold: 0.3 }
    )
    root
      .querySelectorAll<HTMLElement>('.highlight-box')
      .forEach((box) => hlObserver.observe(box))
    cleanups.push(() => hlObserver.disconnect())

    return () => cleanups.forEach((fn) => fn())
  }, [])

  return <div ref={rootRef} dangerouslySetInnerHTML={{ __html: landingMarkup }} />
}
