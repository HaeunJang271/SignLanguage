/**
 * Sign catalog entry types for SignBridge AI learning content.
 */

export type SignDifficulty = "beginner" | "intermediate" | "advanced";

/** License review status; unverified content must not be treated as ready. */
export type LicenseStatus = "confirmed" | "needs_review" | "unknown";

/**
 * A Korean Sign Language learning item.
 * Reference media and landmarks are optional until licensed, verified sources exist.
 */
export type SignEntry = {
  id: string;
  label: string;
  description?: string;
  difficulty?: SignDifficulty;
  referenceVideoUrl?: string;
  sourceUrl?: string;
  license?: string;
  licenseStatus: LicenseStatus;
  verifiedByExpert: boolean;
  referenceLandmarksUrl?: string;
  /** True only for synthetic fixtures used in UI/pipeline tests. */
  isSyntheticTestData?: boolean;
  /** User-supplied data shown only through a local development endpoint. */
  isDevelopmentSample?: boolean;
};

/** High-level content readiness for the catalog. */
export type CatalogStatus = {
  verifiedSignCount: number;
  pendingReviewCount: number;
  message: string;
};
