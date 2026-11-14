import { BUSINESS_MAPS_DESTINATION as defaultMapsDestination } from "@/lib/config"

export function getBookingPath() {
  return "/booking";
}

export function getBookingUrl() {
  if (typeof window === "undefined") return getBookingPath();
  return `${window.location.origin}${getBookingPath()}`;
}

export function getDirectionsUrl(
  query: string = defaultMapsDestination,
) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}
