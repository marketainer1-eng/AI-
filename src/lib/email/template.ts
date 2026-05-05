/**
 * 자격증 이메일 HTML 템플릿
 */

interface CertEmailData {
  recipientName: string
  examTitle: string
  certificateNumber: string
  score: number
  issueDate: string
  appUrl: string
}

export function buildCertificateEmailHtml(data: CertEmailData): string {
  const { recipientName, examTitle, certificateNumber, score, issueDate, appUrl } = data

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>자격증 발급 안내</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f4f7fa; font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif; color: #1e293b; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #00BFA5 0%, #0097A7 100%); padding: 48px 40px 40px; text-align: center; }
    .header-badge { display: inline-block; background: rgba(255,255,255,0.2); color: #fff; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 6px 14px; border-radius: 20px; margin-bottom: 20px; }
    .header h1 { color: #fff; font-size: 28px; font-weight: 800; line-height: 1.3; margin-bottom: 8px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 15px; }
    .trophy { font-size: 56px; margin-bottom: 20px; display: block; }
    .body { padding: 40px; }
    .greeting { font-size: 17px; color: #334155; line-height: 1.7; margin-bottom: 32px; }
    .greeting strong { color: #00BFA5; font-weight: 700; }
    .cert-card { background: linear-gradient(135deg, #f0fdfa 0%, #e0f7f5 100%); border: 1.5px solid #99f6e4; border-radius: 12px; padding: 28px 32px; margin-bottom: 32px; }
    .cert-card-title { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #0097A7; margin-bottom: 16px; }
    .cert-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(0,191,165,0.15); }
    .cert-row:last-child { border-bottom: none; }
    .cert-label { font-size: 13px; color: #64748b; font-weight: 500; }
    .cert-value { font-size: 13px; color: #1e293b; font-weight: 700; text-align: right; }
    .cert-value.number { font-family: 'Courier New', monospace; color: #00BFA5; font-size: 14px; letter-spacing: 0.05em; }
    .cert-value.score { color: #059669; font-size: 16px; }
    .cta-section { text-align: center; margin-bottom: 36px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #00BFA5, #0097A7); color: #fff !important; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 700; letter-spacing: 0.02em; box-shadow: 0 4px 16px rgba(0,191,165,0.35); }
    .cta-sub { margin-top: 12px; font-size: 12px; color: #94a3b8; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 32px 0; }
    .info-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 18px 22px; margin-bottom: 28px; }
    .info-box p { font-size: 13px; color: #92400e; line-height: 1.6; }
    .info-box p strong { color: #78350f; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 28px 40px; text-align: center; }
    .footer p { font-size: 12px; color: #94a3b8; line-height: 1.8; }
    .footer a { color: #00BFA5; text-decoration: none; }
    .footer .org { font-weight: 700; color: #64748b; font-size: 13px; margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- 헤더 -->
    <div class="header">
      <span class="trophy">🏆</span>
      <div class="header-badge">Certificate Issued</div>
      <h1>자격증이 발급되었습니다!</h1>
      <p>합격을 진심으로 축하드립니다</p>
    </div>

    <!-- 본문 -->
    <div class="body">
      <p class="greeting">
        안녕하세요, <strong>${recipientName}</strong> 님!<br /><br />
        <strong>${examTitle}</strong> 시험에 합격하시어<br />
        자격증이 정식으로 발급되었습니다.<br />
        아래에서 자격증 정보를 확인하고 PDF를 다운로드하세요.
      </p>

      <!-- 자격증 정보 카드 -->
      <div class="cert-card">
        <div class="cert-card-title">🎖️ 자격증 발급 정보</div>
        <div class="cert-row">
          <span class="cert-label">수료자명</span>
          <span class="cert-value">${recipientName}</span>
        </div>
        <div class="cert-row">
          <span class="cert-label">자격증 과정</span>
          <span class="cert-value">${examTitle}</span>
        </div>
        <div class="cert-row">
          <span class="cert-label">자격증 번호</span>
          <span class="cert-value number">${certificateNumber}</span>
        </div>
        <div class="cert-row">
          <span class="cert-label">취득 점수</span>
          <span class="cert-value score">${score}점</span>
        </div>
        <div class="cert-row">
          <span class="cert-label">발급일</span>
          <span class="cert-value">${issueDate}</span>
        </div>
      </div>

      <!-- CTA 버튼 -->
      <div class="cta-section">
        <a href="${appUrl}/certificate" class="cta-btn">📥 자격증 PDF 다운로드</a>
        <p class="cta-sub">버튼을 클릭하면 자격증 페이지로 이동합니다</p>
      </div>

      <hr class="divider" />

      <!-- 안내 박스 -->
      <div class="info-box">
        <p>
          <strong>📌 안내사항</strong><br />
          자격증 PDF는 사이트에 로그인 후 <strong>자격증 메뉴</strong>에서 언제든지 다운로드하실 수 있습니다.<br />
          문의사항은 관리자에게 연락해 주세요.
        </p>
      </div>
    </div>

    <!-- 푸터 -->
    <div class="footer">
      <p class="org">AI 에이전트 협회 (KAIA)</p>
      <p>
        <a href="${appUrl}">홈페이지 방문</a> ·
        <a href="${appUrl}/certificate">자격증 다운로드</a>
      </p>
      <p style="margin-top:10px;">
        이 이메일은 자격증 발급 시스템에서 자동 발송되었습니다.<br />
        © 2026 AI 에이전트 협회. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`
}

export function buildCertificateEmailText(data: CertEmailData): string {
  const { recipientName, examTitle, certificateNumber, score, issueDate, appUrl } = data
  return `
${recipientName} 님, 자격증이 발급되었습니다! 🏆

${examTitle} 시험에 합격하시어 자격증이 정식 발급되었습니다.

━━━━━━━━━━━━━━━━━━━━━━━━
자격증 발급 정보
━━━━━━━━━━━━━━━━━━━━━━━━
수료자명    : ${recipientName}
자격증 과정 : ${examTitle}
자격증 번호 : ${certificateNumber}
취득 점수   : ${score}점
발급일      : ${issueDate}
━━━━━━━━━━━━━━━━━━━━━━━━

PDF 다운로드: ${appUrl}/certificate

감사합니다.
AI 에이전트 협회 (KAIA)
`.trim()
}
