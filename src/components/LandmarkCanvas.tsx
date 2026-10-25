"use client";

/**
 * Draws hand joints and connections over a camera preview.
 */

import { useEffect, useRef } from "react";
import { HAND_CONNECTIONS } from "@/lib/hand-connections";
import type { HandLandmarkFrame } from "@/types/landmark";

type LandmarkCanvasProps = {
  width: number;
  height: number;
  frames: HandLandmarkFrame[];
  mirrored?: boolean;
};

/**
 * Canvas overlay that renders MediaPipe hand landmarks for the current frame.
 */
export function LandmarkCanvas({
  width,
  height,
  frames,
  mirrored = true,
}: LandmarkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, width, height);
    if (frames.length === 0) {
      return;
    }

    ctx.save();
    if (mirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    for (const hand of frames) {
      ctx.strokeStyle = "rgba(15, 118, 110, 0.9)";
      ctx.lineWidth = 3;
      for (const [start, end] of HAND_CONNECTIONS) {
        const a = hand.landmarks[start];
        const b = hand.landmarks[end];
        if (!a || !b) {
          continue;
        }
        ctx.beginPath();
        ctx.moveTo(a.x * width, a.y * height);
        ctx.lineTo(b.x * width, b.y * height);
        ctx.stroke();
      }

      for (const point of hand.landmarks) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.beginPath();
        ctx.arc(point.x * width, point.y * height, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }, [frames, height, mirrored, width]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
