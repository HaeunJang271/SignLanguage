"use client";

/**
 * Camera preview with optional landmark overlay and status messaging.
 */

import { useEffect, useState } from "react";
import { LandmarkCanvas } from "@/components/LandmarkCanvas";
import type { CameraStatus } from "@/hooks/useCamera";
import type { LandmarkerStatus } from "@/hooks/useHandLandmarker";
import type { HandLandmarkFrame } from "@/types/landmark";

type CameraPreviewProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraStatus: CameraStatus;
  landmarkerStatus: LandmarkerStatus;
  frames: HandLandmarkFrame[];
  cameraError: string | null;
  modelError: string | null;
};

/**
 * Renders the mirrored camera feed and landmark overlay with accessible status text.
 */
export function CameraPreview({
  videoRef,
  cameraStatus,
  landmarkerStatus,
  frames,
  cameraError,
  modelError,
}: CameraPreviewProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const updateSize = () => {
      setSize({
        width: video.videoWidth || video.clientWidth,
        height: video.videoHeight || video.clientHeight,
      });
    };

    video.addEventListener("loadedmetadata", updateSize);
    window.addEventListener("resize", updateSize);
    updateSize();

    return () => {
      video.removeEventListener("loadedmetadata", updateSize);
      window.removeEventListener("resize", updateSize);
    };
  }, [videoRef, cameraStatus]);

  const statusLabel = (() => {
    if (cameraError) return cameraError;
    if (modelError) return modelError;
    if (cameraStatus === "requesting") return "카메라 권한을 요청하는 중입니다.";
    if (cameraStatus === "denied") return "카메라 권한이 필요합니다.";
    if (cameraStatus === "unavailable") return "사용 가능한 카메라가 없습니다.";
    if (landmarkerStatus === "loading") return "손 추적 모델을 불러오는 중입니다.";
    if (landmarkerStatus === "no_hand") {
      return "손을 안정적으로 감지하지 못했습니다. 카메라 안에 손이 모두 들어오도록 해 주세요.";
    }
    if (landmarkerStatus === "detecting" && frames.length > 0) {
      return `손 ${frames.length}개 감지 중`;
    }
    if (cameraStatus === "ready") return "카메라 준비됨. 손 추적을 시작해 주세요.";
    return "카메라와 손 추적을 시작해 주세요.";
  })();

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900">
        <video
          ref={videoRef}
          className="h-full w-full scale-x-[-1] object-cover"
          playsInline
          muted
          aria-label="사용자 카메라 미리보기"
        />
        {cameraStatus === "ready" && size.width > 0 && (
          <LandmarkCanvas
            width={size.width}
            height={size.height}
            frames={frames}
            mirrored
          />
        )}
        {cameraStatus !== "ready" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 p-6 text-center text-slate-100">
            <p className="max-w-md text-base leading-relaxed">{statusLabel}</p>
          </div>
        )}
      </div>
      <p className="text-sm text-slate-600" role="status" aria-live="polite">
        {statusLabel}
      </p>
    </div>
  );
}
