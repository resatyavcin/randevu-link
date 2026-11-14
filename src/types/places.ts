export type MapPoint = { lat: number; lng: number }
export type PlaceResult = MapPoint & { label: string }
export interface PlaceSearch {
  search(query: string, signal?: AbortSignal): Promise<PlaceResult[]>
}
