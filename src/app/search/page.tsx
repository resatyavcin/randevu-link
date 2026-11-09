import type { Metadata } from "next"
import SearchPageClient from "@/presentation/views/search/search-client"
import { BUSINESS_NAME } from "@/composition/config"

export const metadata: Metadata = {
  title: "İşletme ara",
  description: `${BUSINESS_NAME} üzerinde işletme ara.`,
}

export default function SearchPage() {
  return <SearchPageClient />
}
