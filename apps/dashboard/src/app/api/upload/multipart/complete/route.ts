import { NextRequest, NextResponse } from "next/server";
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";

import { env } from "~/env";
import { s3 } from "~/lib/s3";
import { checkBodySize } from "~/lib/api";

type Part = {
  ETag: string;
  PartNumber: number;
};

export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthenticatedNextjs())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tooLarge = checkBodySize(request);
    if (tooLarge) return tooLarge;
    const body = await request.json();
    const { uploadId, key, parts } = body;

    // Validate
    if (!uploadId || !key || !parts) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!Array.isArray(parts) || parts.length === 0) {
      return NextResponse.json(
        { error: "Parts must be a non-empty array" },
        { status: 400 }
      );
    }

    // Sort parts by part number (required by S3)
    const sortedParts = [...parts].sort(
      (a: Part, b: Part) => a.PartNumber - b.PartNumber
    );

    const command = new CompleteMultipartUploadCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: sortedParts
      }
    });

    await s3.send(command);

    return NextResponse.json({
      publicUrl: `${env.R2_PUBLIC_URL}/${key}`
    });
  } catch (error) {
    console.error("Multipart complete error:", error);
    return NextResponse.json(
      { error: "Failed to complete multipart upload" },
      { status: 500 }
    );
  }
}
