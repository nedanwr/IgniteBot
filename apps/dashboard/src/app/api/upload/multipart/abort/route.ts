import { NextRequest, NextResponse } from "next/server";
import { S3Client, AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";

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
    if (!(await isAuthenticatedNextjs())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { uploadId, key } = body;

    // Validate
    if (!uploadId || !key) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const command = new AbortMultipartUploadCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      UploadId: uploadId
    });

    await client.send(command);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Multipart abort error:", error);
    // Still return success - abort is best-effort cleanup
    return NextResponse.json({ success: true });
  }
}
