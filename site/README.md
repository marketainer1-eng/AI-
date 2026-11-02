# AI 활용 교육 사이트 (정적 HTML)

Next.js 시험 앱과 별개인 단일 페이지 정적 사이트입니다.

- `index.html` — 페이지 본문·스타일·스크립트 (여기를 수정)
- `assets/` — 이미지 (도서 표지, 히어로 배경)
- `build-single.mjs` — 이미지를 모두 내장한 단일 파일 `dist/index.html` 생성

```bash
node site/build-single.mjs
```

로컬 미리보기: `site/index.html`을 브라우저로 열면 됩니다.
