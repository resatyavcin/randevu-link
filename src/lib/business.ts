import {
  BUSINESS_AVATAR,
  BUSINESS_COMPANY_NAME,
  BUSINESS_COVER_PHOTOS,
  BUSINESS_INITIALS,
  BUSINESS_LOCATION,
  BUSINESS_MAPS_DESTINATION,
  BUSINESS_SLUG,
  BUSINESS_VERIFIED,
} from "@/lib/config";

import type { Business } from "@/types/business"
export type { Business } from "@/types/business"
export { getBookingPath, getBookingUrl, getDirectionsUrl } from "@/lib/navigation"

export const BUSINESS: Business = {
  companyName: BUSINESS_COMPANY_NAME,
  location: BUSINESS_LOCATION,
  mapsDestination: BUSINESS_MAPS_DESTINATION,
  verified: BUSINESS_VERIFIED,
  initials: BUSINESS_INITIALS,
  slug: BUSINESS_SLUG,
  avatar: BUSINESS_AVATAR,
  coverPhotos: BUSINESS_COVER_PHOTOS,
};

