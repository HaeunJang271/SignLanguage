/** Exploratory 2D DTW comparison for user-provided development samples. */

import type {
  SampleHandSide,
  SampleMotionComparisonResult,
  SampleMotionFrame,
  SamplePoint2D,
} from "@/types/sample";

const LANDMARK_COUNT = 21;
const MIN_KEYPOINT_SCORE = 0.2;
const SIDES: SampleHandSide[] = ["Left", "Right"];

function isUsableHand(points: SamplePoint2D[] | undefined): points is SamplePoint2D[] {
  return (
    Array.isArray(points) &&
    points.length === LANDMARK_COUNT &&
    points.every(
      (point) =>
        Number.isFinite(point.x) &&
        Number.isFinite(point.y) &&
        (point.score === undefined ||
          (Number.isFinite(point.score) && point.score >= MIN_KEYPOINT_SCORE)),
    )
  );
}

function handSequence(
  frames: SampleMotionFrame[],
  side: SampleHandSide,
): SamplePoint2D[][] {
  return frames
    .filter((frame) => Number.isFinite(frame.timestampMs))
    .map((frame) => frame.hands[side])
    .filter(isUsableHand);
}

function frameDistance(left: SamplePoint2D[], right: SamplePoint2D[]): number {
  let total = 0;
  for (let index = 0; index < LANDMARK_COUNT; index += 1) {
    total += Math.hypot(
      left[index].x - right[index].x,
      left[index].y - right[index].y,
    );
  }
  return total / LANDMARK_COUNT;
}

/** Returns accumulated DTW cost and the number of matched frame pairs. */
function dtwDistance(
  reference: SamplePoint2D[][],
  learner: SamplePoint2D[][],
): { meanDistance: number; alignmentLength: number } {
  const rows = reference.length;
  const columns = learner.length;
  const costs = Array.from({ length: rows + 1 }, () =>
    Array<number>(columns + 1).fill(Number.POSITIVE_INFINITY),
  );
  const lengths = Array.from({ length: rows + 1 }, () =>
    Array<number>(columns + 1).fill(0),
  );
  costs[0][0] = 0;

  for (let row = 1; row <= rows; row += 1) {
    for (let column = 1; column <= columns; column += 1) {
      const previous = [
        [costs[row - 1][column - 1], lengths[row - 1][column - 1]],
        [costs[row - 1][column], lengths[row - 1][column]],
        [costs[row][column - 1], lengths[row][column - 1]],
      ].reduce((best, candidate) =>
        candidate[0] < best[0] ? candidate : best,
      );
      costs[row][column] = previous[0] + frameDistance(reference[row - 1], learner[column - 1]);
      lengths[row][column] = previous[1] + 1;
    }
  }

  return {
    meanDistance: costs[rows][columns] / lengths[rows][columns],
    alignmentLength: lengths[rows][columns],
  };
}

/** Compares matching left/right 2D hand sequences with classic DTW. */
export function compareSampleMotion(
  reference: SampleMotionFrame[],
  learner: SampleMotionFrame[],
): SampleMotionComparisonResult {
  if (reference.length === 0 || learner.length === 0) {
    return {
      status: "insufficient_data",
      reason: "기준 또는 촬영 시퀀스에 프레임이 없습니다.",
    };
  }

  const hands = SIDES.flatMap((handedness) => {
    const referenceSequence = handSequence(reference, handedness);
    const learnerSequence = handSequence(learner, handedness);
    if (referenceSequence.length === 0 || learnerSequence.length === 0) {
      return [];
    }
    const result = dtwDistance(referenceSequence, learnerSequence);
    return [
      {
        handedness,
        meanPointDistance: result.meanDistance,
        alignmentLength: result.alignmentLength,
        referenceFrameCount: referenceSequence.length,
        learnerFrameCount: learnerSequence.length,
      },
    ];
  });

  if (hands.length === 0) {
    return {
      status: "insufficient_data",
      reason: "양쪽 시퀀스에서 대응되는 21점 손 키포인트를 찾지 못했습니다.",
    };
  }

  return {
    status: "compared",
    hands,
    notes: [
      "이 실험 결과는 2D 손 관절 좌표의 DTW 거리이며 정답 여부나 숙련도를 나타내지 않습니다.",
      "영상 크기와 촬영 위치 차이를 별도로 보정하지 않았고, 얼굴·몸짓 등 비수지 요소는 분석하지 않았습니다.",
    ],
  };
}
