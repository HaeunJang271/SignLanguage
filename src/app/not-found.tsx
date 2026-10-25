import Link from "next/link";

/**
 * Fallback page when a practice id or route does not exist.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-16">
      <h1 className="font-display text-3xl text-slate-900">페이지를 찾을 수 없습니다</h1>
      <p className="text-slate-600">
        요청한 학습 항목이 없거나 주소가 올바르지 않습니다.
      </p>
      <Link href="/learn" className="font-medium text-teal-800 underline-offset-4 hover:underline">
        학습 목록으로 이동
      </Link>
    </div>
  );
}
