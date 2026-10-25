/**
 * Hand landmark and motion comparison domain types.
 * Coordinates follow MediaPipe normalized image space unless noted.
 */

/** A single 3D landmark point. */
export type LandmarkPoint = {
  x: number;
  y: number;
  z: number;
};

/** Handedness label from MediaPipe or conversion layer. */
export type Handedness = "Left" | "Right" | "Unknown";

/**
 * One detected hand in a single video frame.
 * Coordinates: x,y in [0,1] relative to frame width/height; z is depth relative to wrist.
 */
export type HandLandmarkFrame = {
  timestamp: number;
  handedness: Handedness;
  landmarks: LandmarkPoint[];
  /** MediaPipe handedness category score when available; never invented. */
  handednessScore?: number;
};

/** Coordinate system metadata for recorded sequences. */
export type CoordinateSystem = {
  space: "mediapipe_normalized_image" | "wrist_relative_normalized";
  description: string;
};

/** A time-ordered sequence of hand landmark frames. */
export type LandmarkSequence = {
  frames: HandLandmarkFrame[];
  coordinateSystem: CoordinateSystem;
};

/** Result of validating raw landmark input. */
export type LandmarkValidationResult =
  | { ok: true; landmarks: LandmarkPoint[] }
  | { ok: false; reason: string };

/** Feature categories that can be measured without expert labels. */
export type MeasurableFeature =
  | "wrist_position"
  | "hand_span"
  | "finger_joint_positions"
  | "trajectory";

/** Per-feature numeric difference; not a correctness score. */
export type FeatureDifference = {
  feature: MeasurableFeature;
  /** Mean absolute distance in the active coordinate system. */
  meanAbsoluteDistance: number;
  sampleCount: number;
};

/** Comparison outcome; never claims Korean Sign Language correctness. */
export type MotionComparisonResult =
  | {
      status: "compared";
      differences: FeatureDifference[];
      notes: string[];
    }
  | {
      status: "insufficient_data";
      reason: string;
    }
  | {
      status: "invalid_input";
      reason: string;
    };
