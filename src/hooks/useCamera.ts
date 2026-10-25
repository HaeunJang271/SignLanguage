"use client";

/**
 * Camera stream lifecycle for practice and research screens.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@/lib/logger";

const SCOPE = "useCamera";

export type CameraStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "denied"
  | "unavailable"
  | "error";

export type UseCameraResult = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  errorMessage: string | null;
  start: () => Promise<void>;
  stop: () => void;
};

/**
 * Requests a user-facing camera stream and cleans up tracks on unmount.
 */
export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /** Stops all tracks and clears the video element source. */
  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus("idle");
    logger.info(SCOPE, "camera stopped");
  }, []);

  /** Requests camera permission and attaches the stream to the video element. */
  const start = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      setErrorMessage("이 브라우저는 카메라 API를 지원하지 않습니다.");
      logger.error(SCOPE, "getUserMedia unavailable");
      return;
    }

    setStatus("requesting");
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus("ready");
      logger.info(SCOPE, "camera ready");
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "UnknownError";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setStatus("denied");
        setErrorMessage(
          "카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라를 허용한 뒤 다시 시도해 주세요.",
        );
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setStatus("unavailable");
        setErrorMessage("연결된 카메라를 찾지 못했습니다.");
      } else {
        setStatus("error");
        setErrorMessage("카메라를 시작하는 중 오류가 발생했습니다.");
      }
      logger.error(SCOPE, "camera start failed", {
        name,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  return { videoRef, status, errorMessage, start, stop };
}
