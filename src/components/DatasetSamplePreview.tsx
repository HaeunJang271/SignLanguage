"use client";

import { useEffect, useRef, useState } from "react";
import { HAND_CONNECTIONS } from "@/lib/hand-connections";
import type { SampleLandmarkManifest } from "@/types/sample";

/** Plays the local AI Hub sample with its supplied 2D hand keypoints. */
export function DatasetSamplePreview() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sample, setSample] = useState<SampleLandmarkManifest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/dev-sample/landmarks.json", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("샘플 데이터를 찾을 수 없습니다.");
        return (await response.json()) as SampleLandmarkManifest;
      })
      .then((data) => {
        if (active) setSample(data);
      })
      .catch(() => {
        if (active) {
          setError(
            "로컬 샘플 파일이 없습니다. scripts/import-aihub-sample.py 실행 후 개발 서버를 새로고침해 주세요.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!sample) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!video || !canvas || !context) return;

    let animationFrame = 0;
    const draw = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        context.clearRect(0, 0, canvas.width, canvas.height);
        const frameIndex = Math.min(
          sample.frameCount - 1,
          Math.max(0, Math.floor(video.currentTime * sample.fps)),
        );
        const frame = sample.frames[frameIndex];

        for (const points of Object.values(frame?.hands ?? {})) {
          if (!points) continue;
          context.strokeStyle = "rgba(13, 148, 136, 0.95)";
          context.lineWidth = Math.max(2, canvas.width / 640);
          for (const [start, end] of HAND_CONNECTIONS) {
            const a = points[start];
            const b = points[end];
            if (
              !a ||
              !b ||
              (a.score !== undefined && a.score <= 0) ||
              (b.score !== undefined && b.score <= 0)
            ) continue;
            context.beginPath();
            context.moveTo(a.x * canvas.width, a.y * canvas.height);
            context.lineTo(b.x * canvas.width, b.y * canvas.height);
            context.stroke();
          }
          context.fillStyle = "rgba(15, 23, 42, 0.95)";
          for (const point of points) {
            if (point.score !== undefined && point.score <= 0) continue;
            context.beginPath();
            context.arc(
              point.x * canvas.width,
              point.y * canvas.height,
              Math.max(2, canvas.width / 320),
              0,
              Math.PI * 2,
            );
            context.fill();
          }
        }
      }
      if (!video.paused && !video.ended) {
        animationFrame = requestAnimationFrame(draw);
      }
    };
    const startDrawing = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(draw);
    };
    const drawCurrentFrame = () => {
      cancelAnimationFrame(animationFrame);
      draw();
    };

    video.addEventListener("play", startDrawing);
    video.addEventListener("loadedmetadata", drawCurrentFrame);
    video.addEventListener("seeked", drawCurrentFrame);
    video.addEventListener("timeupdate", drawCurrentFrame);
    drawCurrentFrame();
    return () => {
      cancelAnimationFrame(animationFrame);
      video.removeEventListener("play", startDrawing);
      video.removeEventListener("loadedmetadata", drawCurrentFrame);
      video.removeEventListener("seeked", drawCurrentFrame);
      video.removeEventListener("timeupdate", drawCurrentFrame);
    };
  }, [sample]);

  return (
    <div className="space-y-3">
      <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
        사용자 제공 AI Hub 샘플 · WORD1501의 한국어 단어명은 아직 연결되지 않았습니다.
        오버레이는 원본 2D 키포인트이며 전문가 검증이나 학습 정답을 뜻하지 않습니다.
      </p>
      {error ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700" role="status">
          {error}
        </p>
      ) : (
        <>
          <div
            className="relative mx-auto w-full overflow-hidden rounded-2xl bg-slate-900"
            style={{ aspectRatio: sample ? `${sample.width} / ${sample.height}` : "16 / 9" }}
          >
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-contain"
              src="/api/dev-sample/reference.mp4"
              controls
              playsInline
              preload="metadata"
              aria-label="AI Hub 개발용 수어 샘플 영상"
            />
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              aria-hidden="true"
            />
          </div>
          {sample && (
            <p className="text-xs text-slate-500">
              {sample.width}×{sample.height} · {sample.fps} fps · {sample.frameCount} 프레임 · 2D 손 키포인트
            </p>
          )}
        </>
      )}
    </div>
  );
}
