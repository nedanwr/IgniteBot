import { NextRequest, NextResponse } from "next/server";

const MAX_JSON_BODY_SIZE = 100 * 1024; // 100KB

export function checkBodySize(request: NextRequest): NextResponse | null {
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_JSON_BODY_SIZE) {
    return NextResponse.json(
      { error: "Request body too large" },
      { status: 413 }
    );
  }
  return null;
}
