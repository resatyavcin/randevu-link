import type { MetadataRoute } from "next"
import { BUSINESS_NAME } from "@/composition/config"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BUSINESS_NAME,
    short_name: BUSINESS_NAME,
    description: `${BUSINESS_NAME} — randevu yönetimi`,
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#121212",
    theme_color: "#121212",
    icons: [{ src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  }
}
