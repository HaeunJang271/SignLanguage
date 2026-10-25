/**
 * Learn-list card for a single sign or synthetic test entry.
 */

import Link from "next/link";
import type { SignEntry } from "@/types/sign";

type SignCardProps = {
  sign: SignEntry;
};

/**
 * Links to the practice page and surfaces verification/license status clearly.
 */
export function SignCard({ sign }: SignCardProps) {
  const badge = sign.isDevelopmentSample
    ? "로컬 샘플 · 검증 대기"
    : sign.isSyntheticTestData
    ? "개발용 테스트"
    : sign.verifiedByExpert
      ? "전문가 검증"
      : "검증 대기";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-semibold text-slate-900">{sign.label}</h3>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
          {badge}
        </span>
      </div>
      {sign.description && (
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {sign.description}
        </p>
      )}
      <dl className="mt-4 grid gap-1 text-xs text-slate-500">
        <div>
          <dt className="inline font-medium">라이선스: </dt>
          <dd className="inline">
            {sign.license ?? "확인 필요"} ({sign.licenseStatus})
          </dd>
        </div>
      </dl>
      <Link
        href={`/practice/${sign.id}`}
        className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-4 text-sm font-medium text-white transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
      >
        {sign.isDevelopmentSample
          ? "샘플 동작 보기"
          : sign.isSyntheticTestData
            ? "추적 테스트 열기"
            : "연습하기"}
      </Link>
    </article>
  );
}
