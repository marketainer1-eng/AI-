/* =============================================
   AI 에이전트 협회 아카데미 — GEO 과정 랜딩페이지
   JavaScript 인터랙션 v1.0
   ============================================= */

'use strict';

// ─── DOM 준비 후 실행 ────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHeroParticles();
  initMobileMenu();
  initStickyHeader();
  initFAQ();
  initScrollAnimations();
  initFloatingCTA();
  initScrollTopBtn();
  initSmoothScroll();
  initCounterAnimations();
});

/* ==========================================
   1. 히어로 파티클 생성
   ========================================== */
function initHeroParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;

  const count = 22;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'hero-particle';

    const size = Math.random() * 6 + 3; // 3 ~ 9px
    const left = Math.random() * 100;
    const delay = Math.random() * 12;
    const duration = Math.random() * 14 + 10; // 10 ~ 24s
    const opacity = Math.random() * 0.4 + 0.1;

    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${left}%;
      bottom: -20px;
      opacity: ${opacity};
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
    `;
    container.appendChild(p);
  }
}

/* ==========================================
   2. 모바일 메뉴 토글
   ========================================== */
function initMobileMenu() {
  const btn  = document.getElementById('mobileMenuBtn');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    btn.classList.toggle('active', isOpen);
    btn.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // 메뉴 링크 클릭 시 닫기
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

/* ==========================================
   3. 스티키 헤더 (스크롤 감지)
   ========================================== */
function initStickyHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // 초기 호출
}

/* ==========================================
   4. FAQ 아코디언
   ========================================== */
function initFAQ() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const btn = item.querySelector('.faq-question');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // 다른 항목 닫기
      items.forEach(i => i.classList.remove('open'));

      // 클릭한 항목 토글
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });
}

/* ==========================================
   5. 스크롤 진입 애니메이션 (IntersectionObserver)
   ========================================== */
function initScrollAnimations() {
  // [data-aos] 요소
  const aosEls = document.querySelectorAll('[data-aos]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || '0', 10);
        setTimeout(() => {
          entry.target.classList.add('aos-in');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

  aosEls.forEach(el => observer.observe(el));

  // 카드 그룹 자동 애니메이션 (data-aos 없는 것들도 처리)
  const autoAnimate = document.querySelectorAll(
    '.why-card, .problem-card, .curriculum-card, .outcome-card, ' +
    '.support-feature-card, .target-card, .instructor-process-card, ' +
    '.cta-card, .branch-card'
  );

  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        // 이미 aos-in 되어 있으면 스킵
        if (!entry.target.dataset.aos) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, idx * 80);
        }
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  autoAnimate.forEach(el => {
    if (!el.dataset.aos) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity .55s ease, transform .55s ease';
      cardObserver.observe(el);
    }
  });

  // 섹션 제목들
  const sectionTitles = document.querySelectorAll('.section-title, .section-label, .section-desc');
  const titleObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        titleObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  sectionTitles.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity .6s ease, transform .6s ease';
    titleObserver.observe(el);
  });
}

/* ==========================================
   6. 플로팅 CTA 버튼 표시 제어
   ========================================== */
function initFloatingCTA() {
  const floatingCta = document.getElementById('floatingCta');
  if (!floatingCta) return;

  const heroSection = document.getElementById('hero');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        floatingCta.classList.add('show');
      } else {
        floatingCta.classList.remove('show');
      }
    });
  }, { threshold: 0.1 });

  if (heroSection) observer.observe(heroSection);
}

/* ==========================================
   7. 스크롤 탑 버튼
   ========================================== */
function initScrollTopBtn() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ==========================================
   8. 부드러운 스크롤 (앵커 링크)
   ========================================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const headerHeight = document.getElementById('site-header')?.offsetHeight || 70;
      const targetTop = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 12;

      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });
}

/* ==========================================
   9. 숫자 카운터 애니메이션 (히어로 스탯 강조)
   ========================================== */
function initCounterAnimations() {
  // 히어로 스탯 항목에 시각적 강조 효과
  const statItems = document.querySelectorAll('.stat-item');
  if (!statItems.length) return;

  statItems.forEach((item, idx) => {
    const strong = item.querySelector('strong');
    if (!strong) return;

    // 초기 상태
    strong.style.opacity = '0';
    strong.style.transform = 'scale(.85)';
    strong.style.transition = 'opacity .5s ease, transform .5s ease';

    setTimeout(() => {
      strong.style.opacity = '1';
      strong.style.transform = 'scale(1)';
    }, 600 + idx * 200);
  });
}

/* ==========================================
   10. 네비 Active 상태 (스크롤 위치 기반)
   ========================================== */
(function initNavActive() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  if (!sections.length || !navLinks.length) return;

  const onScroll = () => {
    const scrollY = window.scrollY + 100;

    sections.forEach(section => {
      const top    = section.offsetTop;
      const height = section.offsetHeight;
      const id     = section.getAttribute('id');

      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ==========================================
   11. 커리큘럼 카드 번호 순차 강조
   ========================================== */
(function initCurriculumHighlight() {
  const cards = document.querySelectorAll('.curriculum-card');
  if (!cards.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const delay = Array.from(cards).indexOf(card) * 100;
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, delay);
        observer.unobserve(card);
      }
    });
  }, { threshold: 0.1 });

  cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity .5s ease, transform .5s ease';
    observer.observe(card);
  });
})();

/* ==========================================
   12. CTA 버튼 클릭 피드백 (전화 연결 안내)
   ========================================== */
(function initCtaFeedback() {
  // 실제 전화번호로 교체하거나 폼 연동 시 수정
  const ctaBtns = document.querySelectorAll(
    '.btn-white, .btn-outline-white, .btn-agency'
  );

  ctaBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // href가 tel: 이면 그냥 통과
      if (btn.href && btn.href.startsWith('tel:')) return;

      // 모달 대신 간단한 툴팁 표시
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-phone-alt"></i> 담당자 연결 중...';
      btn.style.opacity = '.8';
      btn.style.pointerEvents = 'none';

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
      }, 1800);
    });
  });
})();

/* ==========================================
   13. 히어로 배경 Parallax (가벼운 버전)
   ========================================== */
(function initParallax() {
  const hero = document.querySelector('.hero-section');
  if (!hero) return;

  // 모바일은 성능 고려해 비활성화
  if (window.innerWidth < 768) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const bgGrid = hero.querySelector('.hero-bg-grid');
    if (bgGrid) {
      bgGrid.style.transform = `translateY(${scrollY * 0.25}px)`;
    }
  }, { passive: true });
})();

/* ==========================================
   14. 비교 카드 호버 인터랙션
   ========================================== */
(function initCompareInteraction() {
  const oldCard = document.querySelector('.compare-card.old');
  const newCard = document.querySelector('.compare-card.new');
  const arrow   = document.querySelector('.compare-arrow');

  if (!oldCard || !newCard || !arrow) return;

  [oldCard, newCard].forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (card === newCard) {
        arrow.style.color = 'var(--accent)';
        arrow.style.transform = 'scale(1.2)';
      }
    });
    card.addEventListener('mouseleave', () => {
      arrow.style.color = '';
      arrow.style.transform = '';
    });
  });

  arrow.style.transition = 'color .25s ease, transform .25s ease';
})();

/* ==========================================
   15. 페이지 로드 완료 로그
   ========================================== */
console.log(
  '%c AI 에이전트 협회 아카데미 — GEO 과정 랜딩페이지 ',
  'background: #1a3a6b; color: #f0c84a; font-weight: bold; padding: 6px 12px; border-radius: 4px;'
);
