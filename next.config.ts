import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,

  // 🔥 runtime hatasını önlemek için boş bırakıyoruz
  experimental: {},

  // 🔥 Build sırasında TS ve ESLint hatalarını yok say
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Kamera + mikrofon + ekran paylaşımı
          {
            key: "Permissions-Policy",
            value:
              "camera=(self *), microphone=(self *), display-capture=(self *);",
          },

          // Android WebView için MUTLAKA OLMASI GEREK
          {
            key: "X-Requested-With",
            value: "",
          },

          // WebRTC + WebView güvenli çalışması için
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },

          // iframe + YouTube embed fix
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },

          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
