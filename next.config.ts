import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,

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
          // Kamera ve mikrofon
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), display-capture=(self)",
          },

          // YouTube embed fix
          {
            key: "Content-Security-Policy",
            value:
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://*.youtube.com https://*.google.com 'self'; child-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; img-src * blob: data: https:; media-src * blob: data: https:;",
          },

          // Firebase Storage resimleri için
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },

          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
