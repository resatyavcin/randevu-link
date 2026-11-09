import {
  BUSINESS_AVATAR,
  BUSINESS_COMPANY_NAME,
  BUSINESS_COVER_PHOTOS,
  BUSINESS_INITIALS,
  BUSINESS_LOCATION,
  BUSINESS_MAPS_DESTINATION,
  BUSINESS_SLUG,
  BUSINESS_VERIFIED,
} from "@/infrastructure/config/env";

import type { Business } from "@/domain/models/business"
import { findBusinessBySlug, filterBusinesses } from "@/domain/services/business-directory"
export type { Business } from "@/domain/models/business"
export { getBookingPath, getBookingUrl, getStaffPath, getStaffUrl, getDirectionsUrl } from "@/presentation/lib/navigation"

export const MOCK_BUSINESS: Business = {
  companyName: BUSINESS_COMPANY_NAME,
  location: BUSINESS_LOCATION,
  mapsDestination: BUSINESS_MAPS_DESTINATION,
  verified: BUSINESS_VERIFIED,
  initials: BUSINESS_INITIALS,
  slug: BUSINESS_SLUG,
  avatar: BUSINESS_AVATAR,
  coverPhotos: BUSINESS_COVER_PHOTOS,
};

/** Known public businesses (mock). Unknown slugs → 404. */
export const BUSINESSES: Business[] = [MOCK_BUSINESS];

export function getBusinessBySlug(slug: string): Business | null {
  return findBusinessBySlug(BUSINESSES, slug)
}

export function searchBusinesses(query: string): Business[] {
  return filterBusinesses(BUSINESSES, query)
}
