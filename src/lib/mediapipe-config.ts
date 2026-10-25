/**
 * Official MediaPipe Hand Landmarker asset paths.
 * WASM path is pinned to the installed @mediapipe/tasks-vision version.
 */

export const MEDIAPIPE_PACKAGE_VERSION = "1.1.1";

/** jsDelivr WASM root matching the installed npm package. */
export const MEDIAPIPE_WASM_PATH = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_PACKAGE_VERSION}/wasm`;

/**
 * Official Google-hosted Hand Landmarker model (float16).
 * Source: Google AI Edge / MediaPipe model storage.
 */
export const HAND_LANDMARKER_MODEL_PATH =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

/** Expected landmark count per hand from MediaPipe Hand Landmarker. */
export const LANDMARKS_PER_HAND = 21;
