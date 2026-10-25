import { PracticeSession } from "@/components/PracticeSession";
import { SYNTHETIC_TEST_ENTRIES } from "@/lib/sign-data";

/**
 * Research test screen for landmark extraction metrics without claiming sign accuracy.
 */
export default function ResearchPage() {
  const sign = SYNTHETIC_TEST_ENTRIES[0];

  return (
    <div>
      <div className="mx-auto max-w-6xl px-4 pt-8 md:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-700">
          이 화면은 랜드마크 추출 성공률, 프레임 처리 시간, 초기화 실패를
          관찰하기 위한 연구용 테스트입니다. 한국수어 정답 여부를 판정하지
          않습니다.
        </div>
      </div>
      <PracticeSession sign={sign} showResearchStats />
    </div>
  );
}
