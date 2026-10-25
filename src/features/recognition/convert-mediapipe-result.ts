/**
 * Converts MediaPipe HandLandmarkerResult into app domain types.
 */

import { LANDMARKS_PER_HAND } from "@/lib/mediapipe-config";
import { logger } from "@/lib/logger";
import type { HandLandmarkFrame, Handedness } from "@/types/landmark";

const SCOPE = "convert-mediapipe-result";

type MediaPipeLandmark = { x: number; y: number; z: number };
type MediaPipeCategory = { categoryName?: string; score?: number };

/** Minimal shape needed from MediaPipe HandLandmarkerResult. */
export type MediaPipeHandResult = {
  landmarks: MediaPipeLandmark[][];
  handedness?: MediaPipeCategory[][];
  handednesses?: MediaPipeCategory[][];
};

/**
 * Maps a MediaPipe category name to the app Handedness union.
 */
function toHandedness(name: string | undefined): Handedness {
  if (name === "Left" || name === "Right") {
    return name;
  }
  return "Unknown";
}

/**
 * Converts one MediaPipe detection result into HandLandmarkFrame entries.
 */
export function convertMediaPipeResult(
  result: MediaPipeHandResult,
  timestamp: number,
): HandLandmarkFrame[] {
  const frames: HandLandmarkFrame[] = [];
  const handednessGroups = result.handedness ?? result.handednesses ?? [];

  for (let i = 0; i < result.landmarks.length; i += 1) {
    const landmarks = result.landmarks[i];
    if (landmarks.length !== LANDMARKS_PER_HAND) {
      logger.warn(SCOPE, "unexpected landmark count; skipping hand", {
        index: i,
        count: landmarks.length,
      });
      continue;
    }

    const category = handednessGroups[i]?.[0];
    const frame: HandLandmarkFrame = {
      timestamp,
      handedness: toHandedness(category?.categoryName),
      landmarks: landmarks.map((p) => ({ x: p.x, y: p.y, z: p.z })),
    };

    if (typeof category?.score === "number" && Number.isFinite(category.score)) {
      frame.handednessScore = category.score;
    }

    frames.push(frame);
  }

  return frames;
}
