import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,

  experimental: {},

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
          {
            key: "Permissions-Policy",
            value: [
              "camera=(self)",
              "microphone=(self)",
              // ❗ display-capture KALDIRILDI (WebView'u bozuyordu)
              "screen-wake-lock=(self)"
            ].join(", "),
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          }
        ],
      },
    ];
  },
};

export default nextConfig;
