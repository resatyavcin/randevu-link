import type { PlaceSearch } from "@/application/ports/place-search"

export const photonPlaceSearch: PlaceSearch = {
  async search(query, signal) {
    const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`, { signal })
    if (!response.ok) throw new Error("Konum araması başarısız")
    const data = await response.json() as { features: { geometry: { coordinates: number[] }; properties: Record<string, string> }[] }
    return data.features.flatMap(({ geometry, properties }) => {
      const [lng, lat] = geometry.coordinates
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return []
      const label = [...new Set([properties.name, properties.street, properties.housenumber, properties.district, properties.city, properties.country].filter(Boolean))].join(", ")
      return [{ lat, lng, label: label || `${lat}, ${lng}` }]
    })
  },
}
