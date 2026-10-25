import { SignCard } from "@/components/SignCard";
import { getCatalogStatus, getLearnListEntries } from "@/lib/sign-data";

/**
 * Learning catalog page separating verified signs from synthetic test entries.
 */
export default function LearnPage() {
  const catalog = getCatalogStatus();
  const { verified, syntheticTests, developmentSamples } = getLearnListEntries();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
      <header className="max-w-3xl space-y-3">
        <h1 className="font-display text-3xl text-slate-900 md:text-4xl">
          학습 단어 목록
        </h1>
        <p className="text-base leading-relaxed text-slate-600">
          {catalog.message}
        </p>
      </header>

      <section className="mt-10 space-y-4" aria-labelledby="verified-heading">
        <h2 id="verified-heading" className="text-xl font-semibold text-slate-900">
          검증된 학습 자료
        </h2>
        {verified.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            전문가 검증과 라이선스가 확인된 한국수어 항목이 아직 없습니다. 임의의
            수어 동작을 정답 데이터로 등록하지 않습니다.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {verified.map((sign) => (
              <SignCard key={sign.id} sign={sign} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 space-y-4" aria-labelledby="sample-heading">
        <h2 id="sample-heading" className="text-xl font-semibold text-slate-900">
          로컬 데이터 샘플
        </h2>
        <p className="text-sm text-slate-600">
          사용자가 제공한 개발용 샘플입니다. 단어명과 전문가 검증이 확인되지 않아 실제 학습 콘텐츠로 분류하지 않습니다.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {developmentSamples.map((sign) => (
            <SignCard key={sign.id} sign={sign} />
          ))}
        </div>
      </section>

      <section className="mt-12 space-y-4" aria-labelledby="test-heading">
        <h2 id="test-heading" className="text-xl font-semibold text-slate-900">
          개발용 테스트 모드
        </h2>
        <p className="text-sm text-slate-600">
          아래 항목은 실제 한국수어 학습 콘텐츠가 아닙니다. 카메라와 손 추적
          파이프라인을 확인하기 위한 테스트 진입점입니다.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {syntheticTests.map((sign) => (
            <SignCard key={sign.id} sign={sign} />
          ))}
        </div>
      </section>
    </div>
  );
}
