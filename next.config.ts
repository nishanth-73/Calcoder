import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net; frame-src https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com; connect-src 'self' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
