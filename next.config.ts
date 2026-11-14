import { withSerwist } from "@serwist/turbopack"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      { source: "/randevu-linki", destination: "/booking-link", permanent: false },
      { source: "/dashboard/randevu-linki", destination: "/booking-link", permanent: false },
      { source: "/booking/:slug", destination: "/booking", permanent: false },
    ]
  },
  async headers() {
    return [
      {
        source: "/serwist/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate, max-age=0",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
    ]
  },
}

export default withSerwist(nextConfig)
