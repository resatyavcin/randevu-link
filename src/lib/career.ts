import type { CareerSkill, WorkExperience } from "@/types/career"

export const CAREER_DESCRIPTION = "Fikirleri çalışan ürünlere, tekrar eden işleri akıllı iş akışlarına dönüştürüyorum. Backend’den arayüze uzanan yazılım geliştirme deneyimimle, işin ihtiyacını anlayan ve günlük kullanımı kolaylaştıran çözümler üretiyorum."

export const CAREER_SKILLS: CareerSkill[] = [
  {
    title: "Backend & mikroservisler",
    description: "İş süreçlerini destekleyen, ölçeklenebilir servisler ve entegrasyonlar geliştiriyorum.",
    technologies: ["Spring", "Mikroservis mimarisi", "Sistem entegrasyonu"],
  },
  {
    title: "Arayüz geliştirme",
    description: "Karmaşık operasyonları sadeleştiren, ekiplerin işini kolaylaştıran yönetim arayüzleri tasarlayıp geliştiriyorum.",
    technologies: ["React", "Back-office uygulamaları", "CRM"],
  },
  {
    title: "Yapay zekâ & otomasyon",
    description: "Yazılım ekiplerinin tekrar eden işlerini azaltan yapay zekâ destekli geliştirme akışlarına katkı sağlıyorum.",
    technologies: ["n8n", "Agentic AI", "Jira Automation"],
  },
]

// Experience details supplied by the profile owner from their LinkedIn profile.
export const CAREER_EXPERIENCES: WorkExperience[] = [
  {
    id: "tom",
    company: "TOM",
    logo: "/companies/technologyofmoney_logo.jpeg",
    role: "Software Developer III",
    period: "Temmuz 2023 – Devam ediyor",
    summary: "Tam zamanlı · 3 farklı rolde yazılım geliştirme deneyimi",
    highlights: [],
    technologies: [],
    roles: [
      {
        title: "Software Developer III",
        period: "Temmuz 2026 – Devam ediyor",
        location: "Üsküdar, İstanbul · Uzaktan",
        highlights: [
          "Backend ekiplerinin yazılım geliştirme süreçlerini destekleyen, n8n tabanlı yapay zekâ otomasyonlarına katkı sağlıyorum.",
          "Jira görevlerinin işlenmesi, sorunların çözülmesi, kod geliştirme ve Pull Request oluşturma adımlarını otomatikleştiren yapay zekâ iş akışları üzerinde çalışıyorum.",
          "Geliştirme verimliliğini, kod kalitesini ve otomasyonu artırmak amacıyla otonom yapay zekâ ajanlarının yazılım geliştirme yaşam döngüsüne entegrasyonuna katkı sağlıyorum.",
        ],
        technologies: ["n8n", "Jira Automation", "Agentic AI"],
      },
      {
        title: "Software Developer II",
        period: "Ocak 2025 – Temmuz 2026",
        location: "Üsküdar, İstanbul",
        highlights: [
          "Spring ile ölçeklenebilir mikroservis mimarileri ve React ile özel back-office uygulamaları geliştirdim.",
          "Kampanya ve CRM sistemlerine katkı sağladım; dijital imza süreçleri dahil kullanıcı sözleşmesi iş akışlarını yönettim.",
        ],
        technologies: ["Spring", "Spring Framework", "React"],
      },
      {
        title: "Software Developer",
        period: "Temmuz 2023 – Ocak 2025",
        location: "Altunizade, İstanbul",
        highlights: [],
        technologies: [],
      },
    ],
  },
  {
    id: "id3",
    company: "ID3",
    logo: "/companies/information_design_three_logo.jpeg",
    role: "Software Developer",
    period: "Ekim 2022 – Temmuz 2023",
    summary: "Tam zamanlı · Esenler, İstanbul",
    highlights: [],
    technologies: [],
  },
  {
    id: "vodafone",
    company: "Vodafone",
    logo: "/companies/vodafone_logo.jpeg",
    role: "Software Developer – Marketplace Digital Growth",
    period: "Haziran 2022 – Ekim 2022",
    summary: "Tam zamanlı · Maslak, İstanbul · Hibrit",
    highlights: [],
    technologies: [],
  },
]
