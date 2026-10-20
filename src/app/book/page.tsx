import type { Metadata } from 'next'
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  Clapperboard,
  Headphones,
  Mail,
  Presentation,
  UserPlus,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI 미디어 커머스 트렌드 | 매년 발표하는 AI 미디어 커머스 트렌드 리포트',
  description:
    'AI가 먼저 읽고 판단하는 시대에, 내 브랜드는 어떻게 선택받을 것인가? 명지대학교 AI 이커머스학과가 매년 발표하는 AI 미디어 커머스 트렌드. 책 · 포럼 · 오디오북 · 숏폼.',
}

// ── 시리즈 정보 ──────────────────────────────────────────────
const SERIES_NAME = 'AI 미디어 커머스 트렌드'

const HOST = { name: '명지대학교 AI 이커머스학과', href: 'https://aiecommerce.re.kr/' }
/** 주관 기관. href 가 비어 있으면 바로가기 버튼을 표시하지 않습니다. */
const ORGANIZERS = [
  { name: 'AI에이전트협회', href: 'https://aiagent.io.kr/' },
  { name: '한국쇼핑몰협회', href: 'https://hkspmh.or.kr/' },
]
const PUBLISHER = '나비의활주로'

/**
 * 연도별 발간 정보.
 * 매년 새 책이 나오면 맨 앞에 항목을 추가하면 됩니다. (첫 항목이 메인으로 노출)
 */
const EDITIONS = [
  {
    year: 2027,
    vol: 1,
    title: 'AI 미디어 커머스 트렌드 2027',
    authors: ['고아라', '김한준', '장도균', '정유진', '백종우', '배현진'],
    pages: 520,
    price: '28,000원',
    eventDate: '2026.10.24 (토)',
    eventDesc: '1회 강남교보문고 발간·포럼 개최',
    bookUrl: 'https://product.kyobobook.co.kr/detail/S000221698428',
    forumUrl: 'https://ai-trend-2027.netlify.app/',
  },
]
const CURRENT = EDITIONS[0]

const AUDIOBOOK_URL = 'https://talk.podbbang.com/channels/1794192'
const SHORTS_URL = 'https://www.youtube.com/@AI%EC%9D%B4%EC%BB%A4%EB%A8%B8%EC%8A%A4%ED%95%99%EA%B3%BC/shorts'

const CONTACT_EMAIL = 'aiecommerce202509@gmail.com'

const CHANNELS = [
  { id: 'book', label: '책', en: 'BOOK', icon: BookOpen, desc: `『${CURRENT.title}』`, href: '#book' },
  { id: 'forum', label: '포럼', en: 'FORUM', icon: Presentation, desc: `${CURRENT.year} 트렌드 포럼`, href: CURRENT.forumUrl },
  { id: 'audiobook', label: '오디오북', en: 'AUDIOBOOK', icon: Headphones, desc: '팟빵에서 듣기', href: AUDIOBOOK_URL },
  { id: 'shorts', label: '숏폼', en: 'SHORTS', icon: Clapperboard, desc: '유튜브 숏폼으로 보기', href: SHORTS_URL },
]

// ── 책 내용 ──────────────────────────────────────────────────
const HIGHLIGHTS = [
  '고객의 클릭이 줄어드는 환경에서 기업의 수익을 보장하는 법',
  'AI가 신뢰하고 답변에 포함하는 정보와 브랜드의 특징',
  '자본과 인력이 부족한 소상공인과 1인 기업의 대처 방안',
]

const STATS = [
  { value: '58.5%', label: '아무 링크도 누르지 않고 끝나는 구글 검색' },
  { value: '357%', label: '1년 새 늘어난 AI 경유 방문' },
  { value: '72% → 10%', label: 'AI로 써 본 사람 대비 실제로 사 본 사람' },
]

const KEYWORDS = [
  { name: 'Agentic AI', desc: '알아보는 일은 AI에게, 결정은 사람에게 남는다' },
  { name: 'AI 거버넌스', desc: 'AI를 어디에 썼는지 밝히는 가게가 신뢰를 얻는다' },
  { name: 'Physical AI', desc: '로봇이 비워 준 시간을 어디에 쓸지가 승부다' },
  { name: 'AI-to-AI', desc: '고객의 AI가 읽을 수 있게 가게를 글자로 옮겨라' },
  { name: '관계형 미디어', desc: '조회수보다 단골 명단과 답장 속도가 매출을 만든다' },
  { name: 'Human Above the Loop', desc: 'AI가 일하는 시대, 사람은 기준을 정하는 자리로' },
  { name: '온디바이스 AI', desc: '내 폰 안의 작은 AI, 고객 정보는 밖으로 안 나간다' },
  { name: '초개인화', desc: "좋은 상품보다 '나에게 맞는' 상품이 팔린다" },
  { name: 'GEO/SEO', desc: '노출은 예선, AI의 대답에 인용되는 것이 본선' },
  { name: '30분 경제', desc: '문 닫은 뒤에도 주문을 받는 매장이 이긴다' },
]

const READERS = ['소상공인', '1인 사업가', '지원기관 실무자', '전문직']

// ── 참여 모집 ────────────────────────────────────────────────
const RECRUIT_TARGETS = [
  {
    icon: Building2,
    title: '참여 기관',
    items: [
      '기업 · 브랜드',
      'AI · 미디어 · 커머스 · 거버넌스 관련 플랫폼',
      '리서치 · 조사 기관',
      '협회 · 단체 · 창업/소상공인 지원기관',
      '대학 · 연구기관',
    ],
  },
  {
    icon: UserPlus,
    title: '참여 전문가',
    items: ['커머스 · 마케팅 · 미디어 실무자', 'AI · 데이터 분야 연구자와 개발자', '현장 사례를 가진 창업가 · 셀러'],
  },
]

const RECRUIT_ROLES = ['트렌드 공동 조사', '집필 · 사례 제공', '포럼 발표 · 토론', '확산 · 홍보 협력']

// ── 스타일 상수 (원본 상세페이지 색상) ──────────────────────
const NAVY = '#1b2b69'
const TITLE_GRADIENT = 'linear-gradient(90deg, #36b3f0 0%, #6f8fdc 32%, #e5627f 64%, #b8a9bb 100%)'
const CHIP_GRADIENT = 'linear-gradient(90deg, #3aa9e6 0%, #e66b86 100%)'
const SERIF = '"Nanum Myeongjo", "Noto Serif KR", AppleMyungjo, Batang, serif'
const ILLUST_MASK = 'radial-gradient(ellipse at center, #000 55%, transparent 78%)'

function GradientText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`bg-clip-text text-transparent ${className}`}
      style={{ backgroundImage: TITLE_GRADIENT }}
    >
      {children}
    </span>
  )
}

function Stars() {
  return (
    <span className="text-[10px] tracking-[0.2em]" aria-hidden>
      <span className="text-[#e5627f]">★★★</span>
      <span className="text-[#36b3f0]">★★</span>
    </span>
  )
}

function ExternalButton({
  href,
  children,
  dark = false,
}: {
  href: string
  children: React.ReactNode
  dark?: boolean
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg ${
        dark ? 'bg-white' : 'text-white'
      }`}
      style={dark ? { color: NAVY } : { backgroundColor: NAVY }}
    >
      {children}
      <ArrowUpRight className="h-4 w-4" aria-hidden />
    </a>
  )
}

function SectionTitle({ en, title, desc }: { en: string; title: string; desc?: React.ReactNode }) {
  return (
    <div className="text-center">
      <p className="text-sm font-bold tracking-[0.4em]">
        <GradientText>{en}</GradientText>
      </p>
      <h2 className="mt-2 text-2xl font-black sm:text-3xl" style={{ color: NAVY }}>
        {title}
      </h2>
      {desc && (
        <p className="mt-4 leading-8 text-slate-700" style={{ fontFamily: SERIF }}>
          {desc}
        </p>
      )}
    </div>
  )
}

export default function TrendHomePage() {
  return (
    <main className="min-h-screen break-keep bg-white text-slate-800" style={{ colorScheme: 'light' }}>
      {/* ── 상단 고정 바 ── */}
      <nav
        className="sticky top-0 z-30 border-b border-white/10 backdrop-blur"
        style={{ backgroundColor: 'rgba(27, 43, 105, 0.92)' }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <a href="#top" className="truncate text-sm font-bold text-white">
            {SERIES_NAME}
          </a>
          <div className="flex shrink-0 items-center gap-4 text-sm text-white/80">
            {CHANNELS.map((c) => (
              <a
                key={c.id}
                href={c.href}
                {...(c.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="hidden hover:text-white md:inline"
              >
                {c.label}
              </a>
            ))}
            <a href="#join" className="hidden hover:text-white md:inline">참여 모집</a>
            <a
              href={CURRENT.bookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white px-4 py-1.5 font-bold"
              style={{ color: NAVY }}
            >
              책 구매
            </a>
          </div>
        </div>
      </nav>

      {/* ── 1. 시리즈 히어로 ── */}
      <header id="top" className="px-4 pb-16 pt-14 text-center sm:pt-20" style={{ backgroundColor: NAVY }}>
        <p className="inline-block rounded-full border border-white/25 px-4 py-1 text-xs font-semibold tracking-widest text-white/80">
          매년 발표하는 AI 미디어 커머스 트렌드 리포트
        </p>
        <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl">
          <GradientText>{SERIES_NAME}</GradientText>
        </h1>

        <ul className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
          {CHANNELS.map((c) => (
            <li key={c.id}>
              <a
                href={c.href}
                {...(c.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="flex h-full flex-col items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-6 text-white transition hover:-translate-y-1 hover:bg-white/10"
              >
                <c.icon className="h-7 w-7 text-[#7cc4ef]" aria-hidden />
                <span className="text-[10px] font-bold tracking-[0.3em] text-white/50">{c.en}</span>
                <span className="text-lg font-black">{c.label}</span>
                <span className="text-xs text-white/70">{c.desc}</span>
              </a>
            </li>
          ))}
        </ul>

        <dl className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-white/70">
          <div className="flex gap-2">
            <dt className="text-white/45">주최</dt>
            <dd>
              <a href={HOST.href} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-white hover:underline">
                {HOST.name}
              </a>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-white/45">주관</dt>
            <dd>
              {ORGANIZERS.map((o, i) => (
                <span key={o.name}>
                  {i > 0 && ' · '}
                  <a href={o.href} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-white hover:underline">
                    {o.name}
                  </a>
                </span>
              ))}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-white/45">출판</dt>
            <dd>{PUBLISHER}</dd>
          </div>
        </dl>
      </header>

      {/* ── 2. 책 ── */}
      <section id="book" className="scroll-mt-16 px-4 pb-16 pt-16" style={{ backgroundColor: '#91c7df' }}>
        <div className="mx-auto max-w-5xl">
          <SectionTitle en="BOOK" title={`${CURRENT.year} 트렌드 북`} />
        </div>
        <div className="mx-auto mt-10 grid max-w-5xl items-center gap-10 md:grid-cols-[1fr_1.1fr]">
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/book/cover.png"
              alt={`${CURRENT.title} 표지`}
              width={720}
              height={1042}
              className="w-64 drop-shadow-2xl transition duration-500 hover:-translate-y-2 sm:w-80"
            />
          </div>

          <div className="text-center md:text-left">
            <p className="text-sm font-semibold text-[#1b2b69]/70">{PUBLISHER}</p>
            <h3 className="mt-1 text-3xl font-black" style={{ color: NAVY }}>
              {CURRENT.title}
            </h3>
            <p className="mt-3 text-sm text-slate-700">{CURRENT.authors.join('·')} 지음</p>
            <dl className="mt-5 inline-grid grid-cols-2 gap-x-8 gap-y-1 rounded-2xl bg-white/50 px-6 py-4 text-left text-sm">
              <dt className="text-slate-500">쪽수</dt>
              <dd className="font-semibold">{CURRENT.pages}쪽</dd>
              <dt className="text-slate-500">정가</dt>
              <dd className="font-semibold">{CURRENT.price}</dd>
            </dl>
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
              <ExternalButton href={CURRENT.bookUrl}>책 구매하러 가기</ExternalButton>
              <a
                href="#intro"
                className="inline-flex items-center rounded-full bg-white px-8 py-3.5 text-base font-bold shadow-md transition hover:-translate-y-0.5"
                style={{ color: NAVY }}
              >
                책 소개 보기
              </a>
            </div>
          </div>
        </div>

        <ul className="mx-auto mt-14 grid max-w-5xl gap-4 sm:grid-cols-3">
          {HIGHLIGHTS.map((h) => (
            <li
              key={h}
              className="flex flex-col items-center gap-2 rounded-[999px] bg-white px-8 py-6 text-center text-sm font-semibold leading-relaxed text-slate-800 shadow-sm"
            >
              <Stars />
              {h}
            </li>
          ))}
        </ul>
      </section>

      {/* ── 2-1. 다리오 아모데이 인용 + 소개글 ── */}
      <section id="intro" className="scroll-mt-16 px-4 py-20" style={{ backgroundColor: '#dff0f7' }}>
        <div className="mx-auto max-w-2xl">
          <blockquote className="text-center">
            <p className="text-2xl font-black leading-snug sm:text-3xl">
              <GradientText>
                “2027년 이후 AI가 거의 모든 분야에서
                <br />
                인간을 넘어설 것”
              </GradientText>
            </p>
            <footer className="mt-3 text-sm font-bold text-slate-700">
              - 다리오 아모데이(앤트로픽 CEO)
            </footer>
          </blockquote>

          <div
            className="mt-10 space-y-5 text-[15px] leading-8 text-slate-700 sm:text-base"
            style={{ fontFamily: SERIF }}
          >
            <p>
              AI 발전을 선도하는 기업 앤트로픽의 CEO 아모데이가 2025년 다보스 포럼에서 한 말이다.
              그리고 이 말은 현실이 되어 가고 있다.
            </p>
            <p>
              아모데이만이 아니다. AI 관련 분야, 거의 대부분의 기업가와 전문가들이 ‘2027’년을
              AI 발전에 있어 가장 커다란 포인트로 지목하고 있다.
            </p>
            <p>
              바로 이 시점에 출간되는 『{CURRENT.title}』은 이 질문에 답하기 위해 미래를 관통하는
              10가지 핵심 키워드, ‘AI PARADIGM’을 제시한다. 에이전틱 AI부터 피지컬 AI, 관계 미디어,
              초개인화, 생성형 엔진 최적화, 30분 경제까지, AI가 바꾸는 시장의 구조와 비즈니스의
              새로운 기회를 입체적으로 분석한다.
            </p>
            <p>
              특히 자본과 인력이 부족한 소상공인과 1인 기업도 실질적으로 활용할 수 있는 전략을
              제시하며, 기술에 무엇을 맡기고 인간은 무엇을 책임져야 하는지 살펴본다.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2-2. AI가 먼저 고르는 시대 + 통계 ── */}
      <section className="px-4 py-20" style={{ backgroundColor: '#d7e6ed' }}>
        <div className="mx-auto max-w-3xl text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/book/illust-ai.png"
            alt=""
            width={138}
            height={116}
            className="mx-auto w-56 sm:w-64"
            style={{ maskImage: ILLUST_MASK, WebkitMaskImage: ILLUST_MASK }}
          />

          <h2 className="mt-8 text-2xl font-black sm:text-3xl" style={{ color: NAVY }}>
            AI가 먼저 고르는 시대, 내 가게는 선택받을까?
          </h2>
          <p className="mt-4 leading-8 text-slate-700" style={{ fontFamily: SERIF }}>
            지난주에 산 물건, 정말 혼자 고르셨나요?
            <br />
            검색하고, 후기를 훑고, 마지막엔 AI에게 한 번 더 묻습니다.
            <br />
            이제 고객보다 AI가 먼저 브랜드를 읽고 판단합니다.
          </p>

          <h3 className="mt-16 text-xl font-black sm:text-2xl" style={{ color: NAVY }}>
            “클릭은 줄고, AI의 대답이 고객을 데려간다”
          </h3>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {STATS.map((s) => (
              <li key={s.value} className="rounded-2xl bg-white/80 px-5 py-7 shadow-sm">
                <p className="text-3xl font-black">
                  <GradientText>{s.value}</GradientText>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.label}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 leading-8 text-slate-700" style={{ fontFamily: SERIF }}>
            지금은 씨 뿌리는 철입니다.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            출처: 미국 SparkToro·Datos 2024 / Conductor 2026 / 베인앤드컴퍼니
          </p>
        </div>
      </section>

      {/* ── 2-3. 10개 키워드 ── */}
      <section id="keywords" className="scroll-mt-16 px-4 py-20" style={{ backgroundColor: '#eef5f9' }}>
        <div className="mx-auto max-w-4xl">
          <SectionTitle
            en="AI PARADIGM"
            title={`${CURRENT.year}년을 읽는 10개 키워드`}
            desc="열 개의 머리글자를 이으면 하나의 단어(PARADIGM)가 됩니다."
          />

          <ol className="mt-10 grid gap-3 sm:grid-cols-2">
            {KEYWORDS.map((k, i) => (
              <li
                key={k.name}
                className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="pt-0.5 text-sm font-black text-slate-300">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <span
                    className="inline-block rounded px-2 py-0.5 text-xs font-bold text-white"
                    style={{ backgroundImage: CHIP_GRADIENT }}
                  >
                    {k.name}
                  </span>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-700" style={{ fontFamily: SERIF }}>
                    {k.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 2-4. 실행법 ── */}
      <section className="px-4 py-20" style={{ backgroundColor: '#d7e6ed' }}>
        <div className="mx-auto max-w-3xl text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/book/illust-web.png"
            alt=""
            width={146}
            height={110}
            className="mx-auto w-56 sm:w-64"
            style={{ maskImage: ILLUST_MASK, WebkitMaskImage: ILLUST_MASK }}
          />
          <h2 className="mt-8 text-2xl font-black sm:text-3xl" style={{ color: NAVY }}>
            0원으로, 오늘, 혼자 시작하는 실행법
          </h2>
          <p className="mt-4 leading-8 text-slate-700" style={{ fontFamily: SERIF }}>
            이 책은 장마다 바로 따라 할 수 있는 3단계 실행법을 담았습니다.
            <br />
            내 자리에 맞는 첫걸음을 골라 오늘 저녁 시작하시기 바랍니다.
          </p>
          <ul className="mt-8 flex flex-wrap justify-center gap-3">
            {READERS.map((r) => (
              <li
                key={r}
                className="rounded-full border bg-white px-5 py-2 text-sm font-bold"
                style={{ color: NAVY, borderColor: '#b9cfe0' }}
              >
                {r}
              </li>
            ))}
          </ul>

          <p className="mt-16 text-xl leading-relaxed text-slate-800 sm:text-2xl" style={{ fontFamily: SERIF }}>
            “더 크게 말하는 브랜드가 아니라
            <br />
            더 정확하게 설명하는 브랜드가 선택받습니다.”
          </p>
          <p className="mt-4 text-2xl font-black sm:text-3xl" style={{ color: NAVY }}>
            『{CURRENT.title}』
          </p>
          <div className="mt-8">
            <ExternalButton href={CURRENT.bookUrl}>책 구매하러 가기</ExternalButton>
          </div>
        </div>
      </section>

      {/* ── 4. 오디오북 · 숏폼 ── */}
      <section className="px-4 py-20" style={{ backgroundColor: '#dff0f7' }}>
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {[
            {
              id: 'audiobook',
              en: 'AUDIOBOOK',
              title: '오디오북',
              icon: Headphones,
              desc: '이동 중에도, 일하면서도. 팟빵에서 귀로 듣는 AI 미디어 커머스 트렌드.',
              href: AUDIOBOOK_URL,
              cta: '팟빵에서 듣기',
            },
            {
              id: 'shorts',
              en: 'SHORTS',
              title: '숏폼',
              icon: Clapperboard,
              desc: '핵심만 짧고 빠르게. 명지대학교 AI 이커머스학과 유튜브 숏폼으로 만나 보세요.',
              href: SHORTS_URL,
              cta: '유튜브 숏폼 보기',
            },
          ].map((m) => (
            <article
              key={m.id}
              id={m.id}
              className="flex scroll-mt-20 flex-col items-center rounded-3xl bg-white px-8 py-12 text-center shadow-sm"
            >
              <span
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-white"
                style={{ backgroundImage: CHIP_GRADIENT }}
              >
                <m.icon className="h-8 w-8" aria-hidden />
              </span>
              <p className="mt-5 text-xs font-bold tracking-[0.4em]">
                <GradientText>{m.en}</GradientText>
              </p>
              <h2 className="mt-1 text-2xl font-black" style={{ color: NAVY }}>
                {m.title}
              </h2>
              <p className="mt-3 flex-1 leading-7 text-slate-600" style={{ fontFamily: SERIF }}>
                {m.desc}
              </p>
              <div className="mt-6">
                <ExternalButton href={m.href}>{m.cta}</ExternalButton>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── 5. 시리즈 연표 ── */}
      <section className="px-4 py-20" style={{ backgroundColor: '#eef5f9' }}>
        <div className="mx-auto max-w-4xl">
          <SectionTitle
            en="ANNUAL SERIES"
            title="매년 이어지는 트렌드 발표"
            desc={
              <>
                {SERIES_NAME}는 해마다 새로운 키워드로 발표됩니다.
                <br />
                {CURRENT.year}년은 그 첫 번째 이야기입니다.
              </>
            }
          />
          <ol className="mt-10 grid gap-4 sm:grid-cols-3">
            {EDITIONS.map((e) => (
              <li key={e.year} className="rounded-2xl bg-white p-6 text-center shadow-sm ring-2 ring-[#6f8fdc]/40">
                <p className="text-xs font-bold text-slate-400">Vol.{e.vol}</p>
                <p className="mt-1 text-3xl font-black">
                  <GradientText>{e.year}</GradientText>
                </p>
                <p className="mt-3 text-base font-bold tabular-nums" style={{ color: NAVY }}>
                  {e.eventDate}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-600">{e.eventDesc}</p>
              </li>
            ))}
            {[1, 2].map((n) => (
              <li
                key={n}
                className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center text-slate-400"
              >
                <p className="text-xs font-bold">Vol.{CURRENT.vol + n}</p>
                <p className="mt-1 text-3xl font-black">{CURRENT.year + n}</p>
                <p className="mt-2 text-sm font-semibold">{n === 1 ? '준비 중' : '계속됩니다'}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 6. 참여 기관 · 전문가 모집 ── */}
      <section id="join" className="scroll-mt-16 px-4 py-20" style={{ backgroundColor: '#91c7df' }}>
        <div className="mx-auto max-w-4xl">
          <SectionTitle
            en="JOIN US"
            title={`${SERIES_NAME}를 함께 만들 기관과 전문가를 모집합니다`}
            desc={
              <>
                {SERIES_NAME}는 매년 현장의 데이터와 사례로 함께 조사하고 발간합니다.
                <br />
                다음 트렌드를 함께 읽고 기록할 기관과 전문가를 기다립니다.
              </>
            }
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {RECRUIT_TARGETS.map((t) => (
              <div key={t.title} className="rounded-3xl bg-white p-8 shadow-sm">
                <div className="flex items-center gap-3">
                  <t.icon className="h-6 w-6 text-[#6f8fdc]" aria-hidden />
                  <h3 className="text-xl font-black" style={{ color: NAVY }}>
                    {t.title}
                  </h3>
                </div>
                <ul className="mt-4 space-y-2 text-slate-700">
                  {t.items.map((it) => (
                    <li key={it} className="flex gap-2">
                      <span className="text-[#e5627f]" aria-hidden>•</span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl bg-white/60 p-8 text-center">
            <p className="text-sm font-bold text-slate-600">참여 방식</p>
            <ul className="mt-4 flex flex-wrap justify-center gap-3">
              {RECRUIT_ROLES.map((r) => (
                <li
                  key={r}
                  className="rounded-full bg-white px-5 py-2 text-sm font-bold shadow-sm"
                  style={{ color: NAVY }}
                >
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-slate-600">참여 문의는 아래 이메일로 보내 주세요.</p>
            <p className="mt-2 select-all text-lg font-bold" style={{ color: NAVY }}>
              {CONTACT_EMAIL}
            </p>
            <div className="mt-5">
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`[${SERIES_NAME}] 참여 문의`)}`}
                className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                style={{ backgroundColor: NAVY }}
              >
                <Mail className="h-4 w-4" aria-hidden />
                이메일로 참여 문의하기
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. 푸터 ── */}
      <footer className="px-4 py-14 text-white/75" style={{ backgroundColor: NAVY }}>
        <div className="mx-auto max-w-5xl">
          <p className="text-lg font-black text-white">{SERIES_NAME}</p>
          <dl className="mt-6 space-y-4 text-sm">
            {[
              { label: '주최', orgs: [HOST] },
              { label: '주관', orgs: ORGANIZERS },
              { label: '출판', orgs: [{ name: PUBLISHER, href: '' }] },
            ].map((row) => (
              <div key={row.label} className="flex gap-6">
                <dt className="w-10 shrink-0 leading-[30px] text-white/45">{row.label}</dt>
                <dd className="flex flex-wrap gap-x-8 gap-y-3">
                  {row.orgs.map((o) => (
                    <span key={o.name} className="flex min-h-[30px] items-center gap-3">
                      <span className="font-semibold text-white">{o.name}</span>
                      {o.href && (
                        <a
                          href={o.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-white/30 px-3 py-1 text-xs font-bold text-white transition hover:bg-white hover:text-[#1b2b69]"
                        >
                          바로가기
                          <ArrowUpRight className="h-3 w-3" aria-hidden />
                        </a>
                      )}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </footer>
    </main>
  )
}
