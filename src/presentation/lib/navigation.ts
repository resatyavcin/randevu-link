import { BUSINESS_MAPS_DESTINATION as defaultMapsDestination } from "@/composition/config"

export function getBookingPath() {
  return "/booking";
}

export function getBookingUrl() {
  if (typeof window === "undefined") return getBookingPath();
  return `${window.location.origin}${getBookingPath()}`;
}

export function getStaffPath() {
  return "/staff"
}

export function getStaffUrl() {
  if (typeof window === "undefined") return getStaffPath()
  return `${window.location.origin}${getStaffPath()}`
}

export function getDirectionsUrl(
  query: string = defaultMapsDestination,
) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}
