import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const ASSETS = {
  "landmarks.json": { file: "landmarks.json", type: "application/json; charset=utf-8" },
  "reference.mp4": { file: "reference.mp4", type: "video/mp4" },
} as const;

type RouteProps = { params: Promise<{ asset: string }> };

/** Serves the user-provided sample only from a local development server. */
export async function GET(request: Request, { params }: RouteProps) {
  const hostname = new URL(request.url).hostname.replace(/^\[|\]$/g, "");
  if (
    process.env.NODE_ENV !== "development" ||
    !["localhost", "127.0.0.1", "::1"].includes(hostname)
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const { asset } = await params;
  if (!Object.hasOwn(ASSETS, asset)) {
    return new NextResponse(null, { status: 404 });
  }

  const selected = ASSETS[asset as keyof typeof ASSETS];
  const filePath = path.join(
    process.cwd(),
    "data",
    "private",
    "aihub-sample",
    selected.file,
  );

  try {
    const contents = await readFile(filePath);
    return new NextResponse(contents, {
      headers: {
        "Content-Type": selected.type,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "개발용 샘플을 찾을 수 없습니다. import 스크립트를 실행해 주세요." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
}
