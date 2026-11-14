import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import Script from "next/script"
import { SerwistProvider } from "@/components/providers/serwist-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { BookingAppearanceProvider } from "@/components/booking/booking-appearance"
import { SocialLinksProvider } from "@/components/profile/social-links"
import { AppShell } from "@/components/layout/app-shell"
import { Toaster } from "@/components/ui/sonner"
import { BUSINESS_NAME } from "@/lib/config"
import "@/app/globals.css"

const geistMono = localFont({
  src: "../../public/fonts/geist-mono.ttf",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
})

const jakarta = localFont({
  src: "../../public/fonts/plus-jakarta-sans.ttf",
  variable: "--font-jakarta",
  weight: "200 800",
  display: "swap",
})

const inter = localFont({
  src: "../../public/fonts/inter.ttf",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
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
        <ThemeProvider defaultTheme="dark">
          <BookingAppearanceProvider>
            <SocialLinksProvider>
              <SerwistProvider swUrl="/serwist/sw.js">
                <AppShell>{children}</AppShell>
              </SerwistProvider>
            </SocialLinksProvider>
          </BookingAppearanceProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
