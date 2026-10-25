"use client";

/**
 * Client practice session: camera consent, MediaPipe tracking, feedback.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CameraPreview } from "@/components/CameraPreview";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { ReferencePlayer } from "@/components/ReferencePlayer";
import { useCamera } from "@/hooks/useCamera";
import { useHandLandmarker } from "@/hooks/useHandLandmarker";
import { compareMotion } from "@/lib/motion-comparator";
import { compareSampleMotion } from "@/lib/sample-motion-comparator";
import type { MotionComparisonResult } from "@/types/landmark";
import type {
  SampleLandmarkManifest,
  SampleMotionComparisonResult,
  SampleMotionFrame,
} from "@/types/sample";
import type { SignEntry } from "@/types/sign";

type PracticeSessionProps = {
  sign: SignEntry;
  showResearchStats?: boolean;
};

/**
 * Orchestrates camera, landmarker, and comparison UI for one sign entry.
 */
export function PracticeSession({
  sign,
  showResearchStats = false,
}: PracticeSessionProps) {
  const camera = useCamera();
  const landmarker = useHandLandmarker();
  const [consentGiven, setConsentGiven] = useState(false);
  const [comparison, setComparison] = useState<MotionComparisonResult | null>(
    null,
  );
  const [sampleManifest, setSampleManifest] =
    useState<SampleLandmarkManifest | null>(null);
  const [sampleDataError, setSampleDataError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordedFramesRef = useRef<SampleMotionFrame[]>([]);
  const [recordedFrames, setRecordedFrames] = useState<SampleMotionFrame[]>([]);
  const [sampleComparison, setSampleComparison] =
    useState<SampleMotionComparisonResult | null>(null);

  useEffect(() => {
    if (!sign.isDevelopmentSample) return;
    let active = true;
    void fetch("/api/dev-sample/landmarks.json", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("샘플 데이터를 불러오지 못했습니다.");
        return (await response.json()) as SampleLandmarkManifest;
      })
      .then((manifest) => {
        if (active) setSampleManifest(manifest);
      })
      .catch(() => {
        if (active) setSampleDataError("로컬 기준 키포인트를 불러오지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, [sign.isDevelopmentSample]);

  useEffect(() => {
    if (!isRecording) return;
    const hands: SampleMotionFrame["hands"] = {};
    for (const frame of landmarker.frames) {
      if (frame.handedness === "Unknown" || frame.landmarks.length !== 21) continue;
      hands[frame.handedness] = frame.landmarks.map(({ x, y }) => ({ x, y }));
    }
    if (Object.keys(hands).length === 0) return;

    const timestampMs = landmarker.frames[0].timestamp;
    if (recordedFramesRef.current.at(-1)?.timestampMs === timestampMs) return;
    const next = [
      ...recordedFramesRef.current,
      { timestampMs, hands },
    ];
    recordedFramesRef.current = next;
    setRecordedFrames(next);
    if (next.length >= 600) setIsRecording(false);
  }, [isRecording, landmarker.frames]);

  useEffect(() => {
    if (camera.status !== "ready") {
      return;
    }
    void landmarker.initialize();
    // initialize is stable enough for this mount path; avoid re-init loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera.status]);

  useEffect(() => {
    if (
      camera.status === "ready" &&
      landmarker.status === "ready" &&
      camera.videoRef.current
    ) {
      landmarker.startDetection(camera.videoRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera.status, landmarker.status]);

  useEffect(() => {
    return () => {
      landmarker.stopDetection();
      camera.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const learnerSequence = useMemo(
    () => ({
      frames: landmarker.frames,
      coordinateSystem: {
        space: "mediapipe_normalized_image" as const,
        description:
          "MediaPipe image-normalized coordinates (x,y in [0,1], z relative to wrist).",
      },
    }),
    [landmarker.frames],
  );

  /** Runs comparison against missing reference data to surface honest status. */
  const runComparison = () => {
    const result = compareMotion(null, learnerSequence);
    setComparison(result);
  };

  const startSampleRecording = () => {
    recordedFramesRef.current = [];
    setRecordedFrames([]);
    setSampleComparison(null);
    setSampleDataError(null);
    setIsRecording(true);
  };

  const runSampleComparison = () => {
    if (!sampleManifest) {
      setSampleDataError("기준 샘플을 사용할 수 없습니다.");
      return;
    }
    setSampleComparison(
      compareSampleMotion(sampleManifest.frames, recordedFramesRef.current),
    );
  };

  /** Starts camera only after the user acknowledges the purpose notice. */
  const handleStartCamera = async () => {
    setConsentGiven(true);
    await camera.start();
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <header className="space-y-3">
        <p className="text-sm font-medium text-teal-800">
          {sign.isDevelopmentSample
            ? "로컬 데이터 샘플 · 개발용"
            : sign.isSyntheticTestData
              ? "개발용 테스트 모드"
              : "학습 연습"}
        </p>
        <h1 className="font-display text-3xl text-slate-900 md:text-4xl">
          {sign.label}
        </h1>
        {sign.description && (
          <p className="max-w-3xl text-base leading-relaxed text-slate-600">
            {sign.description}
          </p>
        )}
        <Link
          href="/learn"
          className="inline-flex text-sm font-medium text-teal-800 underline-offset-4 hover:underline"
        >
          학습 목록으로 돌아가기
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">기준 자료</h2>
          <ReferencePlayer sign={sign} />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">내 카메라</h2>
          {!consentGiven && camera.status === "idle" && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">
              <p>
                카메라는 브라우저에서 손 동작을 분석하기 위해서만 사용합니다.
                원본 영상은 기본적으로 서버로 전송하거나 저장하지 않습니다.
              </p>
              <button
                type="button"
                onClick={() => void handleStartCamera()}
                className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-4 font-medium text-white hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              >
                이해하고 카메라 시작
              </button>
            </div>
          )}
          {(consentGiven || camera.status !== "idle") && (
            <>
              <CameraPreview
                videoRef={camera.videoRef}
                cameraStatus={camera.status}
                landmarkerStatus={landmarker.status}
                frames={landmarker.frames}
                cameraError={camera.errorMessage}
                modelError={landmarker.errorMessage}
              />
              <div className="flex flex-wrap gap-3">
                {camera.status !== "ready" && camera.status !== "requesting" && (
                  <button
                    type="button"
                    onClick={() => void camera.start()}
                    className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-4 text-sm font-medium text-white hover:bg-teal-800"
                  >
                    카메라 다시 시도
                  </button>
                )}
                {sign.isDevelopmentSample ? (
                  <>
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startSampleRecording}
                        disabled={camera.status !== "ready" || landmarker.status !== "detecting"}
                        className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        2D 비교용 촬영 시작
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsRecording(false)}
                        className="inline-flex min-h-11 items-center rounded-xl bg-amber-700 px-4 text-sm font-medium text-white hover:bg-amber-800"
                      >
                        촬영 마침 ({recordedFrames.length} 프레임)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={runSampleComparison}
                      disabled={isRecording || recordedFrames.length === 0 || !sampleManifest}
                      className="inline-flex min-h-11 items-center rounded-xl border border-teal-700 bg-white px-4 text-sm font-medium text-teal-800 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      샘플과 DTW 비교
                    </button>
                    <p className="w-full text-sm leading-relaxed text-slate-600">
                      2D 손 좌표의 실험용 DTW 거리입니다. 정답 여부나 숙련도를 판정하지 않으며, 촬영 거리와 화면 내 위치 차이를 보정하지 않습니다.
                    </p>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={runComparison}
                    className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  >
                    기준 동작과 비교 시도
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    landmarker.stopDetection();
                    camera.stop();
                    setIsRecording(false);
                    setConsentGiven(false);
                    setComparison(null);
                  }}
                  className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  카메라 중지
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      <FeedbackPanel
        landmarkerStatus={landmarker.status}
        comparison={comparison}
      />

      {sign.isDevelopmentSample && (
        <section
          className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
          aria-labelledby="sample-comparison-heading"
        >
          <h2 id="sample-comparison-heading" className="text-lg font-semibold text-amber-950">
            개발용 2D 동작 비교
          </h2>
          {sampleDataError && (
            <p className="mt-3 text-sm text-amber-950" role="status">
              {sampleDataError}
            </p>
          )}
          {isRecording && (
            <p className="mt-3 text-sm text-amber-950" role="status" aria-live="polite">
              브라우저 메모리에만 촬영 중입니다. 최대 20초까지 기록합니다.
            </p>
          )}
          {recordedFrames.length > 0 && !isRecording && (
            <p className="mt-3 text-sm text-amber-950">
              촬영 프레임: {recordedFrames.length} · 비교 후 데이터는 페이지 메모리에서만 유지됩니다.
            </p>
          )}
          {sampleComparison?.status === "insufficient_data" && (
            <p className="mt-3 text-sm text-amber-950" role="status">
              {sampleComparison.reason}
            </p>
          )}
          {sampleComparison?.status === "compared" && (
            <>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {sampleComparison.hands.map((hand) => (
                  <div key={hand.handedness} className="rounded-xl bg-white/80 p-4">
                    <dt className="text-sm font-medium text-slate-700">
                      {hand.handedness === "Left" ? "왼손" : "오른손"} 평균 2D 거리
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold text-slate-900">
                      {hand.meanPointDistance.toFixed(4)}
                    </dd>
                    <dd className="mt-1 text-xs text-slate-600">
                      DTW 정렬 {hand.alignmentLength}쌍 · 샘플 {hand.referenceFrameCount}프레임 · 촬영 {hand.learnerFrameCount}프레임
                    </dd>
                  </div>
                ))}
              </dl>
              <ul className="mt-4 space-y-1 text-sm leading-relaxed text-amber-950">
                {sampleComparison.notes.map((note) => <li key={note}>{note}</li>)}
              </ul>
            </>
          )}
        </section>
      )}

      {showResearchStats && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">연구용 측정</h2>
          <dl className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <div>처리 프레임: {landmarker.stats.frameCount}</div>
            <div>손 감지 성공: {landmarker.stats.successCount}</div>
            <div>손 미감지: {landmarker.stats.noHandCount}</div>
            <div>
              최근 분석 시간:{" "}
              {landmarker.stats.lastLatencyMs === null
                ? "—"
                : `${landmarker.stats.lastLatencyMs.toFixed(1)} ms`}
            </div>
            <div>추적 상태: {landmarker.status}</div>
            <div>카메라 상태: {camera.status}</div>
          </dl>
        </section>
      )}
    </div>
  );
}
