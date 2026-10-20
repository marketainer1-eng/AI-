import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI 미디어 커머스 트렌드 2027 | 책 소개',
  description:
    'AI가 먼저 읽고 판단하는 시대에, 내 브랜드는 어떻게 선택받을 것인가? 2027년을 읽는 10개 키워드, AI PARADIGM.',
}

// ── 책 정보 ──────────────────────────────────────────────────
const BOOK_TITLE = 'AI 미디어 커머스 트렌드 2027'
const AUTHORS = ['고아라', '김창준', '장도균', '정유진', '백종우', '배정진']
const PUBLISHER = '나비의활주로'

const BUY_URL = 'https://product.kyobobook.co.kr/detail/S000221698428'

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

function BuyButton({ dark = false }: { dark?: boolean }) {
  return (
    <a
      href={BUY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-base font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg ${
        dark ? 'bg-white' : 'text-white'
      }`}
      style={dark ? { color: NAVY } : { backgroundColor: NAVY }}
    >
      책 구매하러 가기
      <span aria-hidden>→</span>
    </a>
  )
}

export default function BookPage() {
  return (
    <main className="min-h-screen break-keep bg-white text-slate-800" style={{ colorScheme: 'light' }}>
      {/* ── 상단 고정 바 ── */}
      <nav
        className="sticky top-0 z-30 border-b border-white/10 backdrop-blur"
        style={{ backgroundColor: 'rgba(27, 43, 105, 0.92)' }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <span className="truncate text-sm font-bold text-white">{BOOK_TITLE}</span>
          <div className="flex shrink-0 items-center gap-4 text-sm text-white/80">
            <a href="#intro" className="hidden hover:text-white sm:inline">책 소개</a>
            <a href="#keywords" className="hidden hover:text-white sm:inline">10개 키워드</a>
            <a
              href={BUY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white px-4 py-1.5 font-bold"
              style={{ color: NAVY }}
            >
              구매하기
            </a>
          </div>
        </div>
      </nav>

      {/* ── 1. 헤더 ── */}
      <header className="px-4 pb-12 pt-14 text-center sm:pt-20" style={{ backgroundColor: NAVY }}>
        <p className="text-lg leading-relaxed text-white/90 sm:text-2xl" style={{ fontFamily: SERIF }}>
          AI가 먼저 읽고 판단하는 시대에,
          <br />
          내 브랜드는 어떻게 선택받을 것인가?
        </p>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
          <GradientText>{BOOK_TITLE}</GradientText>
        </h1>
      </header>

      {/* ── 2. 표지 + 핵심 포인트 ── */}
      <section className="px-4 pb-16 pt-14" style={{ backgroundColor: '#91c7df' }}>
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[1fr_1.1fr]">
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/book/cover.png"
              alt={`${BOOK_TITLE} 표지`}
              width={206}
              height={296}
              className="w-64 drop-shadow-2xl transition duration-500 hover:-translate-y-2 sm:w-80"
            />
          </div>

          <div className="text-center md:text-left">
            <p className="text-sm font-semibold text-[#1b2b69]/70">{PUBLISHER}</p>
            <h2 className="mt-1 text-3xl font-black" style={{ color: NAVY }}>
              {BOOK_TITLE}
            </h2>
            <p className="mt-3 text-sm text-slate-700">
              {AUTHORS.join(' · ')} 지음
            </p>
            <dl className="mt-5 inline-grid grid-cols-2 gap-x-8 gap-y-1 rounded-2xl bg-white/50 px-6 py-4 text-left text-sm">
              <dt className="text-slate-500">쪽수</dt>
              <dd className="font-semibold">520쪽</dd>
              <dt className="text-slate-500">정가</dt>
              <dd className="font-semibold">28,000원</dd>
            </dl>
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
              <BuyButton />
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

      {/* ── 3. 다리오 아모데이 인용 + 소개글 ── */}
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
              바로 이 시점에 출간되는 『{BOOK_TITLE}』은 이 질문에 답하기 위해 미래를 관통하는
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

      {/* ── 4. AI가 먼저 고르는 시대 + 통계 ── */}
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

      {/* ── 5. 10개 키워드 ── */}
      <section id="keywords" className="scroll-mt-16 px-4 py-20" style={{ backgroundColor: '#eef5f9' }}>
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-sm font-bold tracking-[0.4em]">
              <GradientText>AI PARADIGM</GradientText>
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl" style={{ color: NAVY }}>
              2027년을 읽는 10개 키워드
            </h2>
            <p className="mt-4 leading-8 text-slate-700" style={{ fontFamily: SERIF }}>
              열 개의 머리글자를 이으면 하나의 단어(PARADIGM)가 됩니다.
            </p>
          </div>

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

      {/* ── 6. 실행법 ── */}
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
        </div>
      </section>

      {/* ── 7. 마무리 + 구매 ── */}
      <section id="buy" className="scroll-mt-16 px-4 py-20 text-center" style={{ backgroundColor: '#9ccfe2' }}>
        <p className="text-xl leading-relaxed text-slate-800 sm:text-2xl" style={{ fontFamily: SERIF }}>
          “더 크게 말하는 브랜드가 아니라
          <br />
          더 정확하게 설명하는 브랜드가 선택받습니다.”
        </p>
        <p className="mt-4 text-2xl font-black sm:text-3xl" style={{ color: NAVY }}>
          『{BOOK_TITLE}』
        </p>

        <div className="mx-auto mt-12 max-w-xl rounded-3xl bg-white/60 p-8 shadow-sm">
          <p className="text-sm text-slate-600">
            {AUTHORS.join(' · ')} 지음 | 520쪽 | 28,000원
          </p>
          <p className="mt-1 text-xs text-slate-500">교보문고에서 바로 구매하실 수 있습니다.</p>
          <div className="mt-6">
            <BuyButton />
          </div>
        </div>

        <p className="mt-12 text-lg font-bold text-slate-800">{PUBLISHER}</p>
      </section>

      {/* ── 8. 원본 상세 이미지 ── */}
      <section className="px-4 py-12" style={{ backgroundColor: NAVY }}>
        <details className="mx-auto max-w-md text-center">
          <summary className="cursor-pointer list-none text-sm font-bold text-white/80 hover:text-white">
            상세페이지 원본 이미지 보기 ▾
          </summary>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/book/landing-original.jpg"
            alt={`${BOOK_TITLE} 상세페이지`}
            width={366}
            height={2000}
            loading="lazy"
            className="mx-auto mt-6 w-full max-w-[366px] rounded-lg"
          />
        </details>
        <div className="mt-10 text-center">
          <BuyButton dark />
        </div>
      </section>
    </main>
  )
}
