export type CareerSkill = {
  title: string
  description: string
  technologies: string[]
}

export type CareerRole = {
  title: string
  period: string
  location: string
  highlights: string[]
  technologies: string[]
}

export type WorkExperience = {
  id: string
  company: string
  logo?: string
  role: string
  period: string
  summary: string
  highlights: string[]
  technologies: string[]
  roles?: CareerRole[]
}
