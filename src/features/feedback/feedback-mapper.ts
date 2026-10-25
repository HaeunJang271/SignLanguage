/**
 * Maps verified error labels to feedback templates.
 * Without expert labels this module only exposes placeholders.
 */

import { logger } from "@/lib/logger";

const SCOPE = "feedback-mapper";

/** Expert-verified error label identifiers; empty until labels exist. */
export type VerifiedErrorLabel = never;

type FeedbackTemplate = {
  label: string;
  message: string;
};

const TEMPLATES: Record<string, FeedbackTemplate> = {};

/**
 * Returns a feedback message for a verified error label.
 * Throws if the label is not registered — unverified labels must not be invented.
 */
export function mapErrorToFeedback(label: string): FeedbackTemplate {
  const template = TEMPLATES[label];
  if (!template) {
    logger.warn(SCOPE, "unregistered error label requested", { label });
    throw new Error(
      `전문가 검증 라벨이 등록되지 않았습니다: ${label}. 임의 교정 문구를 생성하지 않습니다.`,
    );
  }
  return template;
}

/**
 * Lists currently registered verified feedback templates.
 */
export function listRegisteredFeedbackLabels(): string[] {
  return Object.keys(TEMPLATES);
}
