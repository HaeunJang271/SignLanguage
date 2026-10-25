/** Two-dimensional keypoints imported from the local OpenPose sample. */
export type SamplePoint2D = {
  x: number;
  y: number;
  /** Source keypoint score, when present. Never inferred from MediaPipe. */
  score?: number;
};

export type SampleHandSide = "Left" | "Right";

/** One sample or learner frame, with one 21-point hand per side at most. */
export type SampleMotionFrame = {
  timestampMs: number;
  hands: Partial<Record<SampleHandSide, SamplePoint2D[]>>;
};

export type SampleLandmarkManifest = {
  schemaVersion: number;
  sourceDataset: string;
  sourceUrl: string;
  datasetId: string;
  displayLabel: string;
  reviewStatus: string;
  licenseStatus: string;
  coordinateSystem: string;
  width: number;
  height: number;
  fps: number;
  frameCount: number;
  frames: SampleMotionFrame[];
};

export type SampleMotionComparisonResult =
  | {
      status: "compared";
      hands: Array<{
        handedness: SampleHandSide;
        meanPointDistance: number;
        alignmentLength: number;
        referenceFrameCount: number;
        learnerFrameCount: number;
      }>;
      notes: string[];
    }
  | { status: "insufficient_data"; reason: string };
