/**
 * Landmark validation and wrist-relative normalization.
 * Does not invent confidence values or Korean Sign Language labels.
 */

import { LANDMARKS_PER_HAND } from "@/lib/mediapipe-config";
import { logger } from "@/lib/logger";
import type {
  LandmarkPoint,
  LandmarkValidationResult,
  HandLandmarkFrame,
} from "@/types/landmark";

const SCOPE = "landmark-normalizer";

/** Wrist landmark index in MediaPipe hand topology. */
export const WRIST_INDEX = 0;

/** Middle-finger MCP index used for hand-size scaling. */
export const MIDDLE_MCP_INDEX = 9;

/**
 * Validates that a landmark array has the expected length and finite coordinates.
 */
export function validateLandmarks(
  landmarks: unknown,
  expectedCount: number = LANDMARKS_PER_HAND,
): LandmarkValidationResult {
  if (!Array.isArray(landmarks)) {
    return { ok: false, reason: "landmarks must be an array" };
  }

  if (landmarks.length !== expectedCount) {
    return {
      ok: false,
      reason: `expected ${expectedCount} landmarks, received ${landmarks.length}`,
    };
  }

  const normalized: LandmarkPoint[] = [];
  for (let i = 0; i < landmarks.length; i += 1) {
    const point = landmarks[i];
    if (
      point === null ||
      typeof point !== "object" ||
      typeof (point as LandmarkPoint).x !== "number" ||
      typeof (point as LandmarkPoint).y !== "number" ||
      typeof (point as LandmarkPoint).z !== "number"
    ) {
      return { ok: false, reason: `landmark at index ${i} is malformed` };
    }

    const { x, y, z } = point as LandmarkPoint;
    if (![x, y, z].every((v) => Number.isFinite(v))) {
      return { ok: false, reason: `landmark at index ${i} has non-finite values` };
    }

    normalized.push({ x, y, z });
  }

  return { ok: true, landmarks: normalized };
}

/**
 * Computes Euclidean distance between two landmark points.
 */
export function landmarkDistance(a: LandmarkPoint, b: LandmarkPoint): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Estimates hand size as wrist-to-middle-MCP distance for scale normalization.
 */
export function estimateHandSize(landmarks: LandmarkPoint[]): number | null {
  const validation = validateLandmarks(landmarks);
  if (!validation.ok) {
    logger.warn(SCOPE, "hand size estimation skipped", { reason: validation.reason });
    return null;
  }

  const size = landmarkDistance(
    validation.landmarks[WRIST_INDEX],
    validation.landmarks[MIDDLE_MCP_INDEX],
  );

  if (size < 1e-6) {
    logger.warn(SCOPE, "hand size near zero; cannot scale");
    return null;
  }

  return size;
}

/**
 * Translates landmarks so the wrist is at the origin, then scales by hand size.
 * Output space: wrist_relative_normalized.
 */
export function normalizeToWrist(
  landmarks: LandmarkPoint[],
): LandmarkValidationResult {
  const validation = validateLandmarks(landmarks);
  if (!validation.ok) {
    return validation;
  }

  const handSize = estimateHandSize(validation.landmarks);
  if (handSize === null) {
    return { ok: false, reason: "unable to estimate hand size for normalization" };
  }

  const wrist = validation.landmarks[WRIST_INDEX];
  const result = validation.landmarks.map((point) => ({
    x: (point.x - wrist.x) / handSize,
    y: (point.y - wrist.y) / handSize,
    z: (point.z - wrist.z) / handSize,
  }));

  return { ok: true, landmarks: result };
}

/**
 * Normalizes every frame in a sequence; skips invalid frames with a warning.
 */
export function normalizeFrames(
  frames: HandLandmarkFrame[],
): HandLandmarkFrame[] {
  const output: HandLandmarkFrame[] = [];

  for (const frame of frames) {
    const normalized = normalizeToWrist(frame.landmarks);
    if (!normalized.ok) {
      logger.warn(SCOPE, "skipping invalid frame during normalizeFrames", {
        timestamp: frame.timestamp,
        reason: normalized.reason,
      });
      continue;
    }

    output.push({
      ...frame,
      landmarks: normalized.landmarks,
    });
  }

  return output;
}
