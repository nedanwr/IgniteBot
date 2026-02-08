import { NextRequest, NextResponse } from "next/server";
import { S3Client, CreateMultipartUploadCommand } from "@aws-sdk/client-s3";

import { env } from "~/env";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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
    const { filename, contentType, guildId } = body;

    // Validate
    if (!filename || !contentType || !guildId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Generate unique key
    const key = `guilds/${guildId}/commands/${crypto.randomUUID()}-${filename}`;

    const command = new CreateMultipartUploadCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType
    });

    const response = await client.send(command);

    return NextResponse.json({
      uploadId: response.UploadId,
      key
    });
  } catch (error) {
    console.error("Multipart initiate error:", error);
    return NextResponse.json(
      { error: "Failed to initiate multipart upload" },
      { status: 500 }
    );
  }
}
