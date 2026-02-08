import { NextRequest, NextResponse } from "next/server";
import { S3Client, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";

import { env } from "~/env";

const client = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY
  }
});

type Part = {
  ETag: string;
  PartNumber: number;
};

export async function POST(request: NextRequest) {
  try {
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

    await client.send(command);

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
