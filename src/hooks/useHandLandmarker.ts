"use client";

/**
 * MediaPipe Hand Landmarker lifecycle separated from React render paths.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  HAND_LANDMARKER_MODEL_PATH,
  MEDIAPIPE_WASM_PATH,
} from "@/lib/mediapipe-config";
import { logger } from "@/lib/logger";
import { convertMediaPipeResult } from "@/features/recognition/convert-mediapipe-result";
import type { HandLandmarkFrame } from "@/types/landmark";

const SCOPE = "useHandLandmarker";

export type LandmarkerStatus =
  | "idle"
  | "loading"
  | "ready"
  | "detecting"
  | "no_hand"
  | "model_error"
  | "analysis_error";

export type DetectionStats = {
  lastLatencyMs: number | null;
  frameCount: number;
  successCount: number;
  noHandCount: number;
};

type HandLandmarkerInstance = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestamp: number,
  ) => {
    landmarks: { x: number; y: number; z: number }[][];
    handedness?: { categoryName?: string; score?: number }[][];
  };
  close: () => void;
};

export type UseHandLandmarkerResult = {
  status: LandmarkerStatus;
  frames: HandLandmarkFrame[];
  stats: DetectionStats;
  errorMessage: string | null;
  initialize: () => Promise<void>;
  startDetection: (video: HTMLVideoElement) => void;
  stopDetection: () => void;
};

/**
 * Loads Hand Landmarker and runs video-frame detection via requestAnimationFrame.
 */
export function useHandLandmarker(): UseHandLandmarkerResult {
  const landmarkerRef = useRef<HandLandmarkerInstance | null>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const lastVideoTimeRef = useRef(-1);

  const [status, setStatus] = useState<LandmarkerStatus>("idle");
  const [frames, setFrames] = useState<HandLandmarkFrame[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<DetectionStats>({
    lastLatencyMs: null,
    frameCount: 0,
    successCount: 0,
    noHandCount: 0,
  });

  /** Cancels the animation loop without disposing the model. */
  const stopDetection = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastVideoTimeRef.current = -1;
    logger.info(SCOPE, "detection loop stopped");
  }, []);

  /** Initializes WASM runtime and Hand Landmarker from official assets. */
  const initialize = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(
        MEDIAPIPE_WASM_PATH,
      );

      const create = async (delegate: "GPU" | "CPU") =>
        vision.HandLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: HAND_LANDMARKER_MODEL_PATH,
            delegate,
          },
          runningMode: "VIDEO",
          numHands: 2,
        });

      let landmarker: HandLandmarkerInstance;
      try {
        landmarker = await create("GPU");
      } catch (gpuError) {
        logger.warn(SCOPE, "GPU delegate failed; retrying with CPU", {
          error:
            gpuError instanceof Error ? gpuError.message : String(gpuError),
        });
        landmarker = await create("CPU");
      }

      landmarkerRef.current?.close();
      landmarkerRef.current = landmarker;
      setStatus("ready");
      logger.info(SCOPE, "Hand Landmarker ready", {
        wasm: MEDIAPIPE_WASM_PATH,
        model: HAND_LANDMARKER_MODEL_PATH,
      });
    } catch (error) {
      setStatus("model_error");
      setErrorMessage(
        "MediaPipe 손 랜드마크 모델을 불러오지 못했습니다. 네트워크와 모델 경로를 확인해 주세요.",
      );
      logger.error(SCOPE, "model initialization failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, []);

  /** Starts a single rAF loop that analyzes new video frames. */
  const startDetection = useCallback(
    (video: HTMLVideoElement) => {
      if (!landmarkerRef.current) {
        setErrorMessage("모델이 준비되지 않았습니다. 먼저 초기화해 주세요.");
        setStatus("model_error");
        return;
      }

      stopDetection();
      runningRef.current = true;
      setStatus("detecting");

      const tick = () => {
        if (!runningRef.current || !landmarkerRef.current) {
          return;
        }

        if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          const timestamp = performance.now();
          const started = performance.now();

          try {
            const result = landmarkerRef.current.detectForVideo(video, timestamp);
            const latency = performance.now() - started;
            const converted = convertMediaPipeResult(result, timestamp);

            setStats((prev) => ({
              lastLatencyMs: latency,
              frameCount: prev.frameCount + 1,
              successCount: prev.successCount + (converted.length > 0 ? 1 : 0),
              noHandCount: prev.noHandCount + (converted.length === 0 ? 1 : 0),
            }));

            if (converted.length === 0) {
              setFrames([]);
              setStatus("no_hand");
            } else {
              setFrames(converted);
              setStatus("detecting");
            }
          } catch (error) {
            setStatus("analysis_error");
            setErrorMessage("프레임 분석 중 오류가 발생했습니다.");
            logger.error(SCOPE, "detectForVideo failed", {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
      logger.info(SCOPE, "detection loop started");
    },
    [stopDetection],
  );

  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      try {
        landmarkerRef.current?.close();
      } catch (error) {
        logger.error(SCOPE, "landmarker close failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      landmarkerRef.current = null;
    };
  }, []);

  return {
    status,
    frames,
    stats,
    errorMessage,
    initialize,
    startDetection,
    stopDetection,
  };
}
