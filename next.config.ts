import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    "3000-ispoti26qvqybc903yixo-b9b802c4.sandbox.novita.ai",
    "3000-ispoti26qvqybc903yixo-3844e1b6.sandbox.novita.ai",
  ],
};

export default nextConfig;
