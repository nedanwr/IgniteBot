import { NextRequest, NextResponse } from "next/server";
import { UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";

import { env } from "~/env";
import { s3 } from "~/lib/s3";
import { checkBodySize } from "~/lib/api";

export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthenticatedNextjs())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tooLarge = checkBodySize(request);
    if (tooLarge) return tooLarge;
    const body = await request.json();
    const { uploadId, key, partNumber } = body;

    // Validate
    if (!uploadId || !key || !partNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (typeof partNumber !== "number" || partNumber < 1 || partNumber > 10000) {
      return NextResponse.json(
        { error: "Invalid part number. Must be between 1 and 10000" },
        { status: 400 }
      );
    }

    const command = new UploadPartCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 300 // 5 minutes
    });

    return NextResponse.json({ uploadUrl });
  } catch (error) {
    console.error("Multipart part presign error:", error);
    return NextResponse.json(
      { error: "Failed to generate part upload URL" },
      { status: 500 }
    );
  }
}
