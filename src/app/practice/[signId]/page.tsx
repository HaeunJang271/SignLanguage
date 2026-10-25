import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PracticeSession } from "@/components/PracticeSession";
import { getSignById } from "@/lib/sign-data";

type PracticePageProps = {
  params: Promise<{ signId: string }>;
};

/**
 * Resolves the sign id and renders the practice session.
 */
async function PracticeContent({ params }: PracticePageProps) {
  const { signId } = await params;
  const sign = getSignById(signId);

  if (!sign) {
    notFound();
  }

  return <PracticeSession sign={sign} showResearchStats />;
}

/**
 * Practice page for a catalog entry or synthetic hand-tracking test.
 */
export default function PracticePage({ params }: PracticePageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 text-slate-600">
          연습 화면을 준비하는 중…
        </div>
      }
    >
      <PracticeContent params={params} />
    </Suspense>
  );
}
