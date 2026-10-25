import { describe, expect, it } from "vitest";
import {
  estimateHandSize,
  normalizeFrames,
  normalizeToWrist,
  validateLandmarks,
} from "@/lib/landmark-normalizer";
import type { HandLandmarkFrame, LandmarkPoint } from "@/types/landmark";

/** Builds a 21-point synthetic hand with a known wrist and middle MCP. */
function makeHand(scale = 0.1): LandmarkPoint[] {
  const points: LandmarkPoint[] = Array.from({ length: 21 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
  }));
  points[0] = { x: 0.4, y: 0.6, z: 0 };
  points[9] = { x: 0.4, y: 0.6 - scale, z: 0 };
  for (let i = 1; i < 21; i += 1) {
    if (i === 9) continue;
    points[i] = {
      x: 0.4 + i * 0.001,
      y: 0.6 - scale * 0.5,
      z: 0,
    };
  }
  return points;
}

describe("validateLandmarks", () => {
  it("accepts a valid 21-point hand", () => {
    const result = validateLandmarks(makeHand());
    expect(result.ok).toBe(true);
  });

  it("rejects wrong length arrays", () => {
    const result = validateLandmarks([{ x: 0, y: 0, z: 0 }]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("expected 21");
    }
  });

  it("rejects non-finite coordinates", () => {
    const hand = makeHand();
    hand[3] = { x: Number.NaN, y: 0, z: 0 };
    const result = validateLandmarks(hand);
    expect(result.ok).toBe(false);
  });
});

describe("normalizeToWrist", () => {
  it("places the wrist at the origin after normalization", () => {
    const result = normalizeToWrist(makeHand(0.2));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.landmarks[0].x).toBeCloseTo(0);
      expect(result.landmarks[0].y).toBeCloseTo(0);
      expect(result.landmarks[0].z).toBeCloseTo(0);
    }
  });

  it("scales so wrist-to-middle-MCP distance is approximately 1", () => {
    const result = normalizeToWrist(makeHand(0.25));
    expect(result.ok).toBe(true);
    if (result.ok) {
      const mcp = result.landmarks[9];
      const size = Math.hypot(mcp.x, mcp.y, mcp.z);
      expect(size).toBeCloseTo(1, 5);
    }
  });

  it("is invariant to translation and uniform scale", () => {
    const base = makeHand(0.2);
    const transformed = base.map((point) => ({
      x: point.x * 3 + 0.25,
      y: point.y * 3 - 0.1,
      z: point.z * 3 + 0.05,
    }));

    const normalizedBase = normalizeToWrist(base);
    const normalizedTransformed = normalizeToWrist(transformed);
    expect(normalizedBase.ok).toBe(true);
    expect(normalizedTransformed.ok).toBe(true);
    if (normalizedBase.ok && normalizedTransformed.ok) {
      normalizedBase.landmarks.forEach((point, index) => {
        expect(normalizedTransformed.landmarks[index].x).toBeCloseTo(point.x);
        expect(normalizedTransformed.landmarks[index].y).toBeCloseTo(point.y);
        expect(normalizedTransformed.landmarks[index].z).toBeCloseTo(point.z);
      });
    }
  });

  it("preserves frame metadata and skips frames that cannot be normalized", () => {
    const frames: HandLandmarkFrame[] = [
      {
        timestamp: 123,
        handedness: "Right",
        handednessScore: 0.9,
        landmarks: makeHand(),
      },
      { timestamp: 124, handedness: "Unknown", landmarks: [] },
    ];

    const normalized = normalizeFrames(frames);
    expect(normalized).toHaveLength(1);
    expect(normalized[0].timestamp).toBe(123);
    expect(normalized[0].handednessScore).toBe(0.9);
    expect(normalized[0].landmarks[0]).toEqual({ x: 0, y: 0, z: 0 });
  });
});

describe("estimateHandSize", () => {
  it("returns null for invalid input", () => {
    expect(estimateHandSize([])).toBeNull();
  });
});
