/**
 * Displays a verified reference video or an explicit unavailable state.
 */

import type { SignEntry } from "@/types/sign";
import { DatasetSamplePreview } from "@/components/DatasetSamplePreview";

type ReferencePlayerProps = {
  sign: SignEntry;
};

/**
 * Renders reference media only when a licensed URL exists; otherwise states the gap.
 */
export function ReferencePlayer({ sign }: ReferencePlayerProps) {
  if (sign.isDevelopmentSample) {
    return <DatasetSamplePreview />;
  }

  if (sign.isSyntheticTestData) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
        <p className="text-sm font-medium">개발용 테스트 모드</p>
        <p className="mt-2 text-sm leading-relaxed">
          이 항목은 한국수어 기준 영상이 아닙니다. 손 랜드마크 추출과 UI 동작을
          검증하기 위한 합성/테스트 항목입니다.
        </p>
      </div>
    );
  }

  if (!sign.referenceVideoUrl) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-700">
        <p className="text-sm font-medium">기준 수어 영상 미연결</p>
        <p className="mt-2 text-sm leading-relaxed">
          검증된 기준 영상이 아직 연결되어 있지 않습니다. 가짜 시범 영상을
          표시하지 않습니다. 출처와 라이선스가 확인된 자료가 준비되면 이 영역에
          표시됩니다.
        </p>
        {sign.sourceUrl && (
          <p className="mt-3 text-sm">
            예정 출처:{" "}
            <a
              href={sign.sourceUrl}
              className="underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              {sign.sourceUrl}
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <video
        className="aspect-video w-full rounded-2xl bg-slate-900"
        controls
        playsInline
        src={sign.referenceVideoUrl}
      >
        브라우저가 영상 재생을 지원하지 않습니다.
      </video>
      <p className="text-xs text-slate-500">
        라이선스: {sign.license ?? "확인 필요"} · 전문가 검증:{" "}
        {sign.verifiedByExpert ? "예" : "아니오"}
      </p>
    </div>
  );
}
