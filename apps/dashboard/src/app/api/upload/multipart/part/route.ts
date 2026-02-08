import { NextRequest, NextResponse } from "next/server";
import { S3Client, UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "~/env";

const client = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY
  }
});

export async function POST(request: NextRequest) {
  try {
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

    const uploadUrl = await getSignedUrl(client, command, {
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
