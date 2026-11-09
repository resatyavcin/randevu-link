import type { Business } from "@/domain/models/business"

export function findBusinessBySlug(businesses: readonly Business[], slug: string): Business | null {
  return businesses.find((b) => b.slug === slug) ?? null;
}

export function filterBusinesses(businesses: readonly Business[], query: string): Business[] {
  const q = query.trim().toLocaleLowerCase("tr-TR");
  if (!q) return [...businesses];
  return businesses.filter((b) => {
    const haystack =
      `${b.companyName} ${b.location} ${b.slug}`.toLocaleLowerCase("tr-TR");
    return haystack.includes(q);
  });
}
