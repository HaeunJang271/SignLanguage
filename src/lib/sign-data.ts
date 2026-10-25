/**
 * Sign catalog data separated from UI code.
 * Verified Korean Sign Language content is empty until licensed sources exist.
 */

import type { CatalogStatus, SignEntry } from "@/types/sign";

/**
 * Production learning catalog.
 * Do not add unverified Korean Sign Language entries here.
 */
export const SIGN_CATALOG: SignEntry[] = [];

/**
 * Synthetic fixtures for pipeline / UI tests only.
 * These are NOT Korean Sign Language reference performances.
 */
export const SYNTHETIC_TEST_ENTRIES: SignEntry[] = [
  {
    id: "dev-hand-tracking",
    label: "개발용 손 추적 테스트",
    description:
      "한국수어 표현이 아닙니다. MediaPipe 손 랜드마크 추출과 UI를 검증하기 위한 테스트 항목입니다.",
    difficulty: "beginner",
    licenseStatus: "unknown",
    verifiedByExpert: false,
    isSyntheticTestData: true,
  },
];

/** User-supplied local-only sample; its word gloss and expert review are unknown. */
export const DEVELOPMENT_SAMPLE_ENTRIES: SignEntry[] = [
  {
    id: "dev-aihub-word1501",
    label: "AI Hub 샘플 WORD1501",
    description:
      "사용자가 제공한 로컬 개발 샘플입니다. 단어명 매핑과 전문가 검증은 확인되지 않았으며 학습 정답으로 사용하지 않습니다.",
    sourceUrl:
      "https://aihub.or.kr/aihubdata/data/view.do?aihubDataSe=data&currMenu=&dataSetSn=103&topMenu=",
    license: "사용자 확인: 로컬 개발용만",
    licenseStatus: "needs_review",
    verifiedByExpert: false,
    isDevelopmentSample: true,
  },
];

/**
 * Returns catalog readiness summary for UI banners.
 */
export function getCatalogStatus(): CatalogStatus {
  const verified = SIGN_CATALOG.filter(
    (entry) => entry.verifiedByExpert && entry.licenseStatus === "confirmed",
  );

  const pending = SIGN_CATALOG.filter(
    (entry) => !entry.verifiedByExpert || entry.licenseStatus !== "confirmed",
  );

  return {
    verifiedSignCount: verified.length,
    pendingReviewCount: pending.length,
    message:
      verified.length === 0
        ? "전문가 검증과 이용 권한이 확인된 한국수어 학습 자료가 아직 연결되어 있지 않습니다. 개발용 테스트 모드만 사용할 수 있습니다."
        : `${verified.length}개의 검증된 학습 항목이 준비되어 있습니다.`,
  };
}

/**
 * Finds a catalog or synthetic test entry by id.
 */
export function getSignById(signId: string): SignEntry | undefined {
  return (
    SIGN_CATALOG.find((entry) => entry.id === signId) ??
    SYNTHETIC_TEST_ENTRIES.find((entry) => entry.id === signId) ??
    (process.env.NODE_ENV === "development"
      ? DEVELOPMENT_SAMPLE_ENTRIES.find((entry) => entry.id === signId)
      : undefined)
  );
}

/**
 * Returns entries shown on the learn list page.
 * Verified catalog first; synthetic items are labeled separately in the UI.
 */
export function getLearnListEntries(): {
  verified: SignEntry[];
  syntheticTests: SignEntry[];
  developmentSamples: SignEntry[];
} {
  return {
    verified: SIGN_CATALOG.filter(
      (entry) => entry.verifiedByExpert && entry.licenseStatus === "confirmed",
    ),
    syntheticTests: SYNTHETIC_TEST_ENTRIES,
    developmentSamples:
      process.env.NODE_ENV === "development" ? DEVELOPMENT_SAMPLE_ENTRIES : [],
  };
}
