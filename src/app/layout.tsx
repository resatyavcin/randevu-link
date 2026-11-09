import type { Metadata, Viewport } from "next"
import { Geist_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google"
import Script from "next/script"
import { SerwistProvider } from "@/presentation/components/providers/serwist-provider"
import { QueryProvider } from "@/presentation/components/providers/query-provider"
import { ThemeProvider } from "@/presentation/components/providers/theme-provider"
import { BookingAppearanceProvider } from "@/presentation/components/booking/booking-appearance"
import { HeaderThemeProvider } from "@/presentation/components/profile/header-theme-picker"
import { SocialLinksProvider } from "@/presentation/components/profile/social-links"
import { AppShell } from "@/presentation/components/layout/app-shell"
import { Toaster } from "@/presentation/components/ui/sonner"
import { BUSINESS_NAME } from "@/composition/config"
import "@/app/globals.css"

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
})

const APP_NAME = BUSINESS_NAME
const APP_DEFAULT_TITLE = BUSINESS_NAME
const APP_TITLE_TEMPLATE = `%s · ${BUSINESS_NAME}`
const APP_DESCRIPTION = `${BUSINESS_NAME} — randevu yönetimi`

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${geistMono.variable} ${jakarta.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <Script
          id="randevu-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("randevu-theme");var d=t!=="light";document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}})();`,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <QueryProvider>
        <ThemeProvider defaultTheme="dark">
          <BookingAppearanceProvider>
            <HeaderThemeProvider>
              <SocialLinksProvider>
                <SerwistProvider swUrl="/serwist/sw.js">
                  <AppShell>{children}</AppShell>
                </SerwistProvider>
              </SocialLinksProvider>
            </HeaderThemeProvider>
          </BookingAppearanceProvider>
          <Toaster />
        </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
