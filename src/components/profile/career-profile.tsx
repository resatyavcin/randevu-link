"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Tooltip } from "radix-ui"
import { ArrowUpRight, BriefcaseBusiness, ChevronRight, Download, Mail, MapPin } from "lucide-react"
import { BookingDrawer } from "@/components/booking/booking-drawer"
import { ServiceCategory } from "@/components/booking/service-picker"
import { Button } from "@/components/ui/button"
import type { CareerRole, CareerSkill, WorkExperience } from "@/types/career"

function SkillBadges({ technologies }: { technologies: string[] }) {
  return <ul className="flex flex-wrap gap-2">
    {technologies.map((technology) => <li key={technology}>
      <Button asChild variant="outline" className="pointer-events-none rounded-full"><span>{technology}</span></Button>
    </li>)}
  </ul>
}

export function CareerSkills({ skills }: { skills: CareerSkill[] }) {
  const [open, setOpen] = useState(false)
  const featured = [...new Set(skills.flatMap((skill) => skill.technologies.slice(0, 2)))]

  return <section className="px-4 pt-5 pb-8" aria-labelledby="skills-heading">
    <h2 id="skills-heading" className="mb-4 text-sm font-semibold">Yetenekler</h2>
    <SkillBadges technologies={featured} />
    <Button type="button" variant="outline" className="mt-4 h-11 w-full rounded-xl" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
      Tüm yetenekler<ArrowUpRight aria-hidden className="size-4" />
    </Button>
    <BookingDrawer open={open} onOpenChange={setOpen} title="Yetenekler">
      <div className="mt-4 flex flex-col gap-2">
        {skills.map((skill) => <ServiceCategory key={skill.title} name={skill.title} count={skill.technologies.length}>
          <div className="px-3.5 py-3"><SkillBadges technologies={skill.technologies} /></div>
        </ServiceCategory>)}
      </div>
    </BookingDrawer>
  </section>
}

function CvDownload({ url }: { url?: string }) {
  const [hintOpen, setHintOpen] = useState(false)
  const [file, setFile] = useState<{ url: string; bytes: number | null; missing: boolean }>()

  useEffect(() => {
    if (!url) return
    const controller = new AbortController()
    async function inspectFile() {
      try {
        const response = await fetch(url!, { method: "HEAD", signal: controller.signal })
        if (!response.ok) throw new Error("CV unavailable")
        const length = response.headers.get("content-length")
        let bytes = length === null ? NaN : Number(length)
        if (!Number.isFinite(bytes) || bytes < 0) {
          const download = await fetch(url!, { signal: controller.signal })
          if (!download.ok) throw new Error("CV unavailable")
          bytes = (await download.blob()).size
        }
        if (!controller.signal.aborted) setFile({ url: url!, bytes, missing: false })
      } catch {
        if (!controller.signal.aborted) setFile({ url: url!, bytes: null, missing: true })
      }
    }
    void inspectFile()
    return () => controller.abort()
  }, [url])

  const current = file?.url === url ? file : undefined
  const available = !!url && !current?.missing
  const size = current?.bytes
  const sizeLabel = size == null ? null : size < 1024
    ? `${size} bayt`
    : `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(size / (size < 1024 * 1024 ? 1024 : 1024 * 1024))} ${size < 1024 * 1024 ? "KB" : "MB"}`
  const hint = !available ? "CV henüz yüklenmedi" : sizeLabel ? `Dosya boyutu: ${sizeLabel}` : "Dosya boyutu alınıyor…"

  return <Tooltip.Provider delayDuration={150}>
    <Tooltip.Root open={hintOpen} onOpenChange={setHintOpen}>
      <Tooltip.Trigger asChild>
        {available ? <Button asChild variant="outline" className="h-9 rounded-full"><a href={url} download><Download className="size-4" />CV indir</a></Button>
          : <Button aria-disabled="true" variant="outline" className="h-9 rounded-full text-muted-foreground" onClick={() => setHintOpen((value) => !value)}><Download className="size-4" />CV indir</Button>}
      </Tooltip.Trigger>
      <Tooltip.Portal><Tooltip.Content side="bottom" sideOffset={8} className="z-50 rounded-lg bg-black px-3 py-2 text-xs text-white shadow-md">{hint}<Tooltip.Arrow className="fill-black" /></Tooltip.Content></Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
}

export function CareerHeading({ title, cvUrl, linkedinUrl, email }: { title: string; cvUrl?: string; linkedinUrl?: string; email?: string }) {
  return <div className="mb-2 flex flex-col items-center gap-3">
    <p className="text-sm font-medium text-muted-foreground">{title}</p>
    <div className="flex flex-wrap items-center justify-center gap-2">
      <CvDownload url={cvUrl} />
      {email && <Button asChild variant="outline" className="h-9 rounded-full"><a href={`mailto:${email}`} aria-label={`${email} adresine e-posta gönder`}><Mail aria-hidden="true" className="size-4" />E-posta</a></Button>}
      {linkedinUrl && <Button asChild className="h-9 rounded-full bg-[#0A66C2] text-white hover:bg-[#004182]"><a href={linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn<ArrowUpRight aria-hidden="true" className="size-3.5" /></a></Button>}
    </div>
  </div>
}

export function CareerEducation() {
  return <section className="px-4 pt-5 pb-8" aria-labelledby="education-heading">
    <h2 id="education-heading" className="mb-2 text-sm font-semibold">Eğitim</h2>
    <div className="flex items-center gap-3.5 py-4">
      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
        <Image src="/uni/1630499096294.jpeg" alt="" width={48} height={48} className="size-full object-contain" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">Bolu Abant İzzet Baysal Üniversitesi</span>
        <span className="mt-1 block text-sm leading-5 text-muted-foreground">Lisans, Bilgisayar Mühendisliği</span>
        <span className="mt-1.5 block text-xs leading-5 text-muted-foreground">2018 – 2022</span>
      </span>
    </div>
  </section>
}

function CompanyLogo({ experience }: { experience: WorkExperience }) {
  return <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white font-semibold text-black">
    {experience.logo ? <Image src={experience.logo} alt="" width={48} height={48} className="size-full object-contain" /> : experience.company.slice(0, 2).toLocaleUpperCase("tr")}
  </span>
}

export function CareerExperience({ experiences }: { experiences: WorkExperience[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = experiences.find((experience) => experience.id === activeId)

  return <section className="px-4 pt-5 pb-8" aria-labelledby="experience-heading">
    <h2 id="experience-heading" className="mb-2 text-sm font-semibold">Deneyim</h2>
    {experiences.length ? <ul>{experiences.map((experience, index) => <li key={experience.id} className={index < experiences.length - 1 ? "divider-dashed" : undefined}>
      <button type="button" onClick={() => setActiveId(experience.id)} aria-label={`${experience.company} deneyim detayları`} className="flex w-full items-center gap-3.5 rounded-lg py-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        <CompanyLogo experience={experience} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{experience.company}</span>
          <span className="mt-1 block text-sm leading-5 text-muted-foreground">{experience.role}</span>
          <span className="mt-1.5 block text-xs leading-5 text-muted-foreground">{experience.period}</span>
        </span>
        <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      </button>
    </li>)}</ul> : <div className="py-8 text-center"><BriefcaseBusiness aria-hidden className="mx-auto mb-3 size-5 text-muted-foreground" /><p className="text-sm text-muted-foreground">Deneyim bilgileri henüz eklenmedi.</p></div>}
    <BookingDrawer open={!!active} onOpenChange={(open) => { if (!open) setActiveId(null) }} title={active?.company ?? "Deneyim"}>
      {active && <div className="pb-2">
        <div className="flex items-center gap-3.5 py-5">
          <CompanyLogo experience={active} />
          <div className="min-w-0"><p className="text-sm leading-6">{active.summary}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{active.period}</p></div>
        </div>
        <div>{(active.roles?.length ? active.roles : [{ title: active.role, period: active.period, location: "", highlights: active.highlights, technologies: active.technologies }]).map((role) => <RoleDetails key={`${role.title}-${role.period}`} role={role} />)}</div>
      </div>}
    </BookingDrawer>
  </section>
}

function RoleDetails({ role }: { role: CareerRole }) {
  return <section className="border-t border-dashed border-border py-5">
    <h3 className="text-sm font-semibold">{role.title}</h3>
    <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{role.period}</p>
    {role.location && <p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground"><MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0" /><span>{role.location}</span></p>}
    {!!role.highlights.length && <ul className="mt-4 list-disc space-y-3 pl-4 marker:text-muted-foreground/50">{role.highlights.map((highlight) => <li key={highlight} className="pl-1 text-sm leading-6 text-muted-foreground">{highlight}</li>)}</ul>}
    {!!role.technologies.length && <p className="mt-4 text-xs leading-6 text-muted-foreground" aria-label="Kullandığım teknolojiler">{role.technologies.join(" · ")}</p>}
  </section>
}
