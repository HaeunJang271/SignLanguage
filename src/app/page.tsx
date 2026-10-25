import Link from "next/link";
import { BookOpen, Camera, ShieldAlert } from "lucide-react";
import { getCatalogStatus } from "@/lib/sign-data";

/**
 * Home page introducing SignBridge AI and the current MVP scope.
 */
export default function HomePage() {
  const catalog = getCatalogStatus();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-12 md:px-6 md:py-16">
      <section className="max-w-3xl space-y-6">
        <p className="text-sm font-medium tracking-wide text-teal-800">
          한국수어 학습 프로토타입
        </p>
        <h1 className="font-display text-4xl leading-tight text-slate-900 md:text-6xl">
          SignBridge AI
        </h1>
        <p className="text-lg leading-relaxed text-slate-600 md:text-xl">
          웹캠으로 수어 동작을 연습하면, 브라우저에서 손 랜드마크를 분석하고
          기준 동작과 비교할 수 있는 시각적 피드백을 제공합니다. 단순 번역기가
          아니라 학습과 교정 실험을 위한 플랫폼입니다.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/learn"
            className="inline-flex min-h-12 items-center rounded-xl bg-teal-700 px-5 text-base font-medium text-white hover:bg-teal-800"
          >
            학습 시작
          </Link>
          <Link
            href="/research"
            className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-5 text-base font-medium text-slate-800 hover:bg-slate-50"
          >
            손 추적 테스트
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-6">
          <div className="flex items-center gap-2 text-teal-800">
            <Camera className="h-5 w-5" aria-hidden="true" />
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="mt-3 text-lg font-semibold text-slate-900">
            현재 구현 범위
          </h2>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-600">
            <li>카메라 권한 안내 및 미리보기</li>
            <li>MediaPipe Hand Landmarker 손 관절 시각화</li>
            <li>학습 목록 / 연습 화면 골격</li>
            <li>랜드마크 정규화 및 동작 비교 인터페이스</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <ShieldAlert className="h-5 w-5 text-amber-800" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-semibold text-amber-950">콘텐츠 상태</h2>
          <p className="mt-4 text-sm leading-relaxed text-amber-950">
            {catalog.message}
          </p>
          <p className="mt-3 text-sm text-amber-900">
            검증된 항목: {catalog.verifiedSignCount} · 검토 대기:{" "}
            {catalog.pendingReviewCount}
          </p>
        </div>
      </section>
    </div>
  );
}
