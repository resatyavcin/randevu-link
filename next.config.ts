import { withSerwist } from "@serwist/turbopack"
import type { NextConfig } from "next"

const appointmentStatusRedirects = [
  ["yeni", "pending"],
  ["onaylandi", "confirmed"],
  ["tamamlandi", "completed"],
  ["iptal", "cancelled"],
  ["odendi", "paid"],
  ["odenmemis", "unpaid"],
  ["aktif", "active"],
] as const

function appointmentFilterRedirects(source: string) {
  return appointmentStatusRedirects.map(([from, to]) => ({
    source,
    has: [{ type: "query" as const, key: "durum", value: from }],
    destination: `/appointments?status=${to}`,
    permanent: false,
  }))
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      ...appointmentFilterRedirects("/randevular"),
      ...appointmentFilterRedirects("/dashboard/randevular"),
      {
        source: "/dashboard",
        destination: "/appointments",
        permanent: false,
      },
      {
        source: "/dashboard/randevular",
        destination: "/appointments",
        permanent: false,
      },
      {
        source: "/dashboard/randevu-linki",
        destination: "/booking-link",
        permanent: false,
      },
      {
        source: "/dashboard/ayarlar",
        destination: "/appointments",
        permanent: false,
      },
      {
        source: "/dashboard/ayarlar/profil",
        destination: "/appointments",
        permanent: false,
      },
      {
        source: "/dashboard/staff",
        destination: "/personel",
        permanent: false,
      },
      {
        source: "/dashboard/:path*",
        destination: "/:path*",
        permanent: false,
      },
      {
        source: "/randevular",
        destination: "/appointments",
        permanent: false,
      },
      {
        source: "/randevu-linki",
        destination: "/booking-link",
        permanent: false,
      },
      {
        source: "/ayarlar/profil",
        destination: "/appointments",
        permanent: false,
      },
      {
        source: "/ayarlar",
        destination: "/appointments",
        permanent: false,
      },
      {
        source: "/settings",
        destination: "/appointments",
        permanent: false,
      },
      {
        source: "/settings/:path*",
        destination: "/appointments",
        permanent: false,
      },
      {
        source: "/ara",
        destination: "/search",
        permanent: false,
      },
      {
        source: "/ara/:path*",
        destination: "/search/:path*",
        permanent: false,
      },
      {
        source: "/booking/:slug",
        destination: "/booking",
        permanent: false,
      },
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
