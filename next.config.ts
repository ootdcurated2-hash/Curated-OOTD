import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents and partialPrefetching removed — these experimental flags
  // cause strict prerender errors with Date.now(), new Date(), cookies(), etc.
  // and are not needed for production stability.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Mencegah Clickjacking (tidak bisa di-embed di iframe situs berbahaya)
          { key: "X-Frame-Options", value: "DENY" },
          // Mencegah MIME sniffing exploit
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Proteksi XSS filter pada browser lama
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Kebijakan Referrer yang aman
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Menutup akses ke hardware sensitif yang tidak dibutuhkan
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
