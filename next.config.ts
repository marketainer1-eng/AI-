import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    "3000-ispoti26qvqybc903yixo-b9b802c4.sandbox.novita.ai",
    "3000-ispoti26qvqybc903yixo-3844e1b6.sandbox.novita.ai",
  ],
  async redirects() {
    return [
      // GEO 과정 정적 랜딩페이지(public/geo/) 단축 진입 경로.
      // index.html 로 리다이렉트해 상대 자산 경로(css/, js/)가 그대로 유지됨.
      {
        source: "/geo",
        destination: "/geo/index.html",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
