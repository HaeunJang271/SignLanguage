import { describe, expect, it } from "vitest";
import {
  alignByTruncation,
  compareMotion,
  meanLandmarkDistance,
} from "@/lib/motion-comparator";
import type {
  HandLandmarkFrame,
  LandmarkPoint,
  LandmarkSequence,
} from "@/types/landmark";

function makeHand(offsetX = 0): LandmarkPoint[] {
  const points: LandmarkPoint[] = Array.from({ length: 21 }, (_, i) => ({
    x: 0.4 + offsetX + i * 0.001,
    y: 0.5,
    z: 0,
  }));
  points[0] = { x: 0.4 + offsetX, y: 0.6, z: 0 };
  points[9] = { x: 0.4 + offsetX, y: 0.5, z: 0 };
  return points;
}

function frame(timestamp: number, offsetX = 0): HandLandmarkFrame {
  return {
    timestamp,
    handedness: "Right",
    landmarks: makeHand(offsetX),
  };
}

function sequence(frames: HandLandmarkFrame[]): LandmarkSequence {
  return {
    frames,
    coordinateSystem: {
      space: "mediapipe_normalized_image",
      description: "test",
    },
  };
}

describe("meanLandmarkDistance", () => {
  it("returns 0 for identical hands", () => {
    const hand = makeHand();
    expect(meanLandmarkDistance(hand, hand)).toBeCloseTo(0);
  });

  it("returns null for invalid arrays", () => {
    expect(meanLandmarkDistance([], makeHand())).toBeNull();
  });
});

describe("alignByTruncation", () => {
  it("truncates to the shorter sequence", () => {
    const aligned = alignByTruncation(
      [frame(1), frame(2), frame(3)],
      [frame(10), frame(20)],
    );
    expect(aligned?.reference).toHaveLength(2);
    expect(aligned?.learner).toHaveLength(2);
  });

  it("returns null when either side is empty", () => {
    expect(alignByTruncation([], [frame(1)])).toBeNull();
  });
});

describe("compareMotion", () => {
  it("reports insufficient_data when reference is missing", () => {
    const result = compareMotion(null, sequence([frame(1)]));
    expect(result.status).toBe("insufficient_data");
  });

  it("compares measurable features without inventing accuracy scores", () => {
    const result = compareMotion(
      sequence([frame(1, 0), frame(2, 0)]),
      sequence([frame(1, 0.05), frame(2, 0.05)]),
    );
    expect(result.status).toBe("compared");
    if (result.status === "compared") {
      expect(result.differences.length).toBeGreaterThan(0);
      expect(result.notes.some((n) => n.includes("정확성을 확정할 수 없습니다"))).toBe(
        true,
      );
      expect(
        Object.prototype.hasOwnProperty.call(result, "accuracyScore"),
      ).toBe(false);
      expect(result.differences.map(({ feature }) => feature)).toEqual(
        expect.arrayContaining([
          "wrist_position",
          "hand_span",
          "finger_joint_positions",
        ]),
      );
      expect(result.notes[0]).toContain("프레임별 차이");
      expect(result.notes[0]).not.toContain("궤적");
    }
  });

  it("reports insufficient data when the learner sequence is empty", () => {
    const result = compareMotion(sequence([frame(1)]), sequence([]));
    expect(result.status).toBe("insufficient_data");
  });

  it("reports invalid input when every frame has invalid landmarks", () => {
    const invalidFrame = { ...frame(1), landmarks: [] };
    const result = compareMotion(
      sequence([invalidFrame]),
      sequence([invalidFrame]),
    );
    expect(result.status).toBe("invalid_input");
  });
});
