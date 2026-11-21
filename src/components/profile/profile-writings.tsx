"use client"

import { useState } from "react"
import { BookingDrawer } from "@/components/booking/booking-drawer"
import { ArticleClaps } from "@/components/profile/article-claps"
import { UserAvatar } from "@/components/ui/user-avatar"
import { useBookingAppearance } from "@/components/booking/booking-appearance"
import { BUSINESS } from "@/lib/business"

const title = "JavaScript’de eşitlik operatörleri"

export function ProfileWritings() {
  const [open, setOpen] = useState(false)
  const { logoSrc } = useBookingAppearance()

  return (
    <section className="px-4 py-6" aria-label="Yazılar">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="w-full rounded-sm py-2 text-left text-sm leading-6 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        {title}
      </button>
      <BookingDrawer open={open} onOpenChange={setOpen} title={title} expandOnScroll reading beforeTitle={
        <div className="mb-5 flex items-center gap-2.5">
          <UserAvatar src={logoSrc ?? BUSINESS.avatar} alt={BUSINESS.companyName} className="size-8" />
          <div>
            <p className="text-xs font-medium">{BUSINESS.companyName}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground"><time dateTime="2026-11-21">21 Kasım 2026</time></p>
          </div>
        </div>
      }>
        <article className="space-y-6 pt-6 pb-10 text-base leading-8 text-foreground/90 sm:text-lg sm:leading-9 [&_h3]:pt-5 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:leading-snug [&_h3]:tracking-tight [&_h3]:text-foreground sm:[&_h3]:text-2xl [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_ul]:list-disc [&_ul]:space-y-4 [&_ul]:pl-5 [&_li]:pl-1 [&_li::marker]:text-muted-foreground">
          <p>Günlük hayatta her zaman iki tercih arasında kalmışızdır. Çok basit bir örnek verelim: Bir validasyon yapmamız gerekiyor. Bu validasyona göre submit butonunun disable olup olmayacağı kararlaştırılacak. Validasyondan geçer ise active yoksa disable olacak. Bu çok küçük bir örnekti.</p>
          <p>Biz de eşitlik durumunu gözlemlemek için JavaScript üzerinde 2 operatör kullanırız.</p>
          <ul><li><code>==</code></li><li><code>===</code></li></ul>
          <h3>JavaScript’de ‘==’ ve ‘!=’ ne anlama gelir?</h3>
          <p>Dediğimiz üzere eşitlik kontrolü yapıyoruz. <code>==</code> bu aşamada eşitliği, <code>!=</code> eşitsizliği ifade eder. Abstract eşitliği kontrol ettiği için loose equality operator olarak da bilinir. Bu ifadeler tip olarak aynı olmadığında karşılaştırılan ifadeleri, karşılaştırmayı yapabilmek adına veri türlerini dönüştürme eğilimindedir.</p>
          <p>Örnek verelim:</p>
          <pre className="overflow-x-auto rounded-2xl border border-border bg-muted/60 p-5 text-sm leading-7 sm:p-6"><code>{"x == y // eşitliği ifade eder.\nx != y // eşitsizliği ifade eder."}</code></pre>
          <p>Ve her ikisi de primitive tip olan boolean tipini döndürür.</p>
          <h3>Genel Bakış (== ve !=)</h3>
          <ul>
            <li><code>==</code>, iki değer aynı veri türü ve aynı değere sahipse veya farklı veri türünde fakat herhangi biri diğer verinin veri türüne dönüştürülebilirse ve değerler eşitse <code>true</code> döndürür.</li>
            <li>Farklı değerlere sahipse <code>false</code> döndürür.</li>
            <li>Dönüştürülemiyorsa zaten <code>false</code> döner.</li>
            <li><code>!=</code>, iki değer aynı veri türü ve farklı değere sahipse veya farklı veri türünde fakat herhangi biri diğer verinin veri türüyle karşılaştırılamıyorsa <code>true</code> döner.</li>
            <li>İki değişken de aynı veri türünde ve aynı değere sahipse <code>false</code> döner.</li>
            <li>Her ikisi de farklı veri türünde ancak bunlardan biri diğerinin veri türüne dönüştürülebiliyorsa ve aynı değere sahipse <code>false</code> döndürür.</li>
          </ul>
        </article>
        <ArticleClaps articleId="javascript-esitlik-operatorleri" />
      </BookingDrawer>
    </section>
  )
}
