import type { Metadata } from "next";
import Link from "next/link";
import { Noto_Sans_KR, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const bodyFont = Noto_Sans_KR({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const displayFont = Source_Serif_4({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SignBridge AI",
  description:
    "한국수어 학습자가 웹캠으로 동작을 연습하고, AI가 손 랜드마크를 분석해 시각적 피드백을 제공하는 학습 플랫폼",
};

/**
 * Root layout for SignBridge AI with Korean-friendly typography.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} min-h-full antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2"
          >
            본문으로 건너뛰기
          </a>
          <header className="border-b border-slate-200/80 bg-white/70 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
              <Link href="/" className="font-display text-xl text-slate-900">
                SignBridge AI
              </Link>
              <nav aria-label="주요 메뉴" className="flex gap-4 text-sm font-medium">
                <a href="/learn" className="text-slate-700 hover:text-teal-800">
                  학습
                </a>
                <a
                  href="/research"
                  className="text-slate-700 hover:text-teal-800"
                >
                  연구 테스트
                </a>
              </nav>
            </div>
          </header>
          <main id="main" className="flex-1">
            {children}
          </main>
          <footer className="border-t border-slate-200/80 bg-white/60">
            <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-500 md:px-6">
              원본 카메라 영상은 기본적으로 서버에 업로드되지 않습니다. 검증되지
              않은 한국수어 자료를 정답으로 표시하지 않습니다.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
