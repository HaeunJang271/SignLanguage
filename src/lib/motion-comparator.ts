/**
 * Compares learner and reference landmark sequences by measurable features.
 * Does not classify Korean Sign Language correctness or invent accuracy scores.
 */

import {
  estimateHandSize,
  landmarkDistance,
  normalizeToWrist,
  validateLandmarks,
  WRIST_INDEX,
} from "@/lib/landmark-normalizer";
import { logger } from "@/lib/logger";
import type {
  FeatureDifference,
  HandLandmarkFrame,
  LandmarkPoint,
  LandmarkSequence,
  MotionComparisonResult,
} from "@/types/landmark";

const SCOPE = "motion-comparator";

/**
 * Mean absolute per-landmark distance between two equal-length landmark sets.
 */
export function meanLandmarkDistance(
  a: LandmarkPoint[],
  b: LandmarkPoint[],
): number | null {
  const left = validateLandmarks(a);
  const right = validateLandmarks(b);
  if (!left.ok || !right.ok) {
    return null;
  }

  let total = 0;
  for (let i = 0; i < left.landmarks.length; i += 1) {
    total += landmarkDistance(left.landmarks[i], right.landmarks[i]);
  }
  return total / left.landmarks.length;
}

/**
 * Aligns two sequences by truncating to the shorter length (frame-index alignment).
 * Full DTW alignment belongs in a separate motion_aligner module.
 */
export function alignByTruncation(
  reference: HandLandmarkFrame[],
  learner: HandLandmarkFrame[],
): { reference: HandLandmarkFrame[]; learner: HandLandmarkFrame[] } | null {
  if (reference.length === 0 || learner.length === 0) {
    return null;
  }

  const length = Math.min(reference.length, learner.length);
  return {
    reference: reference.slice(0, length),
    learner: learner.slice(0, length),
  };
}

/**
 * Builds measurable feature differences for aligned, normalized frame pairs.
 */
function buildFeatureDifferences(
  reference: HandLandmarkFrame[],
  learner: HandLandmarkFrame[],
): FeatureDifference[] {
  const jointDistances: number[] = [];
  const wristDistances: number[] = [];
  const spanDeltas: number[] = [];

  for (let i = 0; i < reference.length; i += 1) {
    const refNorm = normalizeToWrist(reference[i].landmarks);
    const learnNorm = normalizeToWrist(learner[i].landmarks);
    if (!refNorm.ok || !learnNorm.ok) {
      continue;
    }

    const joint = meanLandmarkDistance(refNorm.landmarks, learnNorm.landmarks);
    if (joint !== null) {
      jointDistances.push(joint);
    }

    wristDistances.push(
      landmarkDistance(
        reference[i].landmarks[WRIST_INDEX],
        learner[i].landmarks[WRIST_INDEX],
      ),
    );

    const refSpan = estimateHandSize(reference[i].landmarks);
    const learnSpan = estimateHandSize(learner[i].landmarks);
    if (refSpan !== null && learnSpan !== null) {
      spanDeltas.push(Math.abs(refSpan - learnSpan));
    }
  }

  const differences: FeatureDifference[] = [];

  if (wristDistances.length > 0) {
    differences.push({
      feature: "wrist_position",
      meanAbsoluteDistance:
        wristDistances.reduce((s, v) => s + v, 0) / wristDistances.length,
      sampleCount: wristDistances.length,
    });
  }

  if (spanDeltas.length > 0) {
    differences.push({
      feature: "hand_span",
      meanAbsoluteDistance:
        spanDeltas.reduce((s, v) => s + v, 0) / spanDeltas.length,
      sampleCount: spanDeltas.length,
    });
  }

  if (jointDistances.length > 0) {
    differences.push({
      feature: "finger_joint_positions",
      meanAbsoluteDistance:
        jointDistances.reduce((s, v) => s + v, 0) / jointDistances.length,
      sampleCount: jointDistances.length,
    });
  }

  return differences;
}

/**
 * Compares a learner sequence against a reference sequence.
 * Returns insufficient_data when reference landmarks are missing.
 */
export function compareMotion(
  reference: LandmarkSequence | null,
  learner: LandmarkSequence,
): MotionComparisonResult {
  try {
    if (reference === null || reference.frames.length === 0) {
      return {
        status: "insufficient_data",
        reason: "기준 동작과 비교할 수 있는 데이터가 아직 없습니다.",
      };
    }

    if (learner.frames.length === 0) {
      return {
        status: "insufficient_data",
        reason: "학습자 동작 프레임이 없어 비교할 수 없습니다.",
      };
    }

    const aligned = alignByTruncation(reference.frames, learner.frames);
    if (aligned === null) {
      return {
        status: "insufficient_data",
        reason: "정렬할 프레임이 부족합니다.",
      };
    }

    const differences = buildFeatureDifferences(
      aligned.reference,
      aligned.learner,
    );

    if (differences.length === 0) {
      return {
        status: "invalid_input",
        reason: "정규화에 실패한 프레임만 있어 특징 차이를 계산하지 못했습니다.",
      };
    }

    logger.info(SCOPE, "motion comparison completed", {
      framePairs: aligned.reference.length,
      featureCount: differences.length,
    });

    return {
      status: "compared",
      differences,
      notes: [
        "현재 분석에서는 손목 위치, 손 크기, 손가락 관절 위치의 프레임별 차이를 비교했습니다.",
        "분석 결과만으로 수어 표현의 정확성을 확정할 수 없습니다.",
        "프레임 인덱스 절단 정렬을 사용했습니다. DTW 정렬은 별도 모듈에서 실험합니다.",
      ],
    };
  } catch (error) {
    logger.error(SCOPE, "motion comparison failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
