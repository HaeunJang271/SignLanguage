/**
 * Presents measured analysis states without inventing accuracy scores.
 */

import type { MotionComparisonResult } from "@/types/landmark";
import type { LandmarkerStatus } from "@/hooks/useHandLandmarker";

type FeedbackPanelProps = {
  landmarkerStatus: LandmarkerStatus;
  comparison: MotionComparisonResult | null;
};

/**
 * Shows tracking and comparison feedback using only measured or known states.
 */
export function FeedbackPanel({
  landmarkerStatus,
  comparison,
}: FeedbackPanelProps) {
  const messages: string[] = [];

  if (landmarkerStatus === "no_hand") {
    messages.push(
      "손을 안정적으로 감지하지 못했습니다. 카메라 안에 손이 모두 들어오도록 해 주세요.",
    );
  }

  if (comparison?.status === "insufficient_data") {
    messages.push(comparison.reason);
  }

  if (comparison?.status === "invalid_input") {
    messages.push(comparison.reason);
  }

  if (comparison?.status === "compared") {
    messages.push(...comparison.notes);
    for (const diff of comparison.differences) {
      messages.push(
        `${diff.feature}: 평균 절대 거리 ${diff.meanAbsoluteDistance.toFixed(4)} (표본 ${diff.sampleCount})`,
      );
    }
  }

  if (messages.length === 0) {
    messages.push(
      "기준 동작과 비교할 수 있는 데이터가 아직 없습니다. 손 추적이 되면 감지 상태만 표시합니다.",
    );
  }

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5"
      aria-labelledby="feedback-heading"
    >
      <h2 id="feedback-heading" className="text-lg font-semibold text-slate-900">
        분석 피드백
      </h2>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-slate-500">
        원본 카메라 영상은 서버로 전송되지 않습니다. 근거 없는 정확도 점수는
        표시하지 않습니다.
      </p>
    </section>
  );
}
