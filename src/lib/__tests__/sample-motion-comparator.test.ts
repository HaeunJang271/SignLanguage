import { describe, expect, it } from "vitest";
import { compareSampleMotion } from "@/lib/sample-motion-comparator";
import type { SampleMotionFrame, SamplePoint2D } from "@/types/sample";

function hand(offset = 0): SamplePoint2D[] {
  return Array.from({ length: 21 }, (_, index) => ({
    x: 0.2 + offset + index * 0.001,
    y: 0.3 + index * 0.002,
  }));
}

function frame(timestampMs: number, offset = 0): SampleMotionFrame {
  return { timestampMs, hands: { Right: hand(offset) } };
}

describe("compareSampleMotion", () => {
  it("returns zero distance for identical sequences", () => {
    const result = compareSampleMotion([frame(0), frame(33)], [frame(0), frame(33)]);
    expect(result.status).toBe("compared");
    if (result.status === "compared") {
      expect(result.hands[0].meanPointDistance).toBeCloseTo(0);
      expect(result.hands[0].alignmentLength).toBe(2);
    }
  });

  it("aligns sequences with different timing using DTW", () => {
    const result = compareSampleMotion(
      [frame(0), frame(33), frame(66)],
      [frame(0), frame(16), frame(32), frame(48), frame(64)],
    );
    expect(result.status).toBe("compared");
    if (result.status === "compared") {
      expect(result.hands[0].meanPointDistance).toBeCloseTo(0);
      expect(result.hands[0].alignmentLength).toBeGreaterThan(3);
    }
  });

  it("rejects low-confidence keypoint frames", () => {
    const lowConfidence = hand();
    lowConfidence[5] = { ...lowConfidence[5], score: 0.1 };
    const result = compareSampleMotion(
      [{ timestampMs: 0, hands: { Right: lowConfidence } }],
      [frame(0)],
    );
    expect(result.status).toBe("insufficient_data");
  });

  it("does not compare hands with different handedness labels", () => {
    const left: SampleMotionFrame = { timestampMs: 0, hands: { Left: hand() } };
    expect(compareSampleMotion([frame(0)], [left]).status).toBe("insufficient_data");
  });
});
