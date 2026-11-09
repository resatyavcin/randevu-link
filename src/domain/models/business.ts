export type Business = {
  companyName: string;
  location: string;
  /** Maps pin is intentionally a generic city-center, not the shop address. */
  mapsDestination: string;
  verified: boolean;
  initials: string;
  slug: string;
  avatar?: string;
  /** Cover photos shown in the header banner. Empty → theme gradient. */
  coverPhotos?: string[];
};
