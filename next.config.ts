import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,

  experimental: {
    runtime: "nodejs",
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // SADECE kamera ve mikrofon izni (YouTube'a zarar vermez)
          {
            key: "Permissions-Policy",
            value:
              "camera=(self *), microphone=(self *), display-capture=(self *);",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
