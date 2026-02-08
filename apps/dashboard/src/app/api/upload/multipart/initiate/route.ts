import { NextRequest, NextResponse } from "next/server";
import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";

import { env } from "~/env";
import { s3 } from "~/lib/s3";
import { checkBodySize } from "~/lib/api";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthenticatedNextjs())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tooLarge = checkBodySize(request);
    if (tooLarge) return tooLarge;
    const body = await request.json();
    const { filename, contentType, size, guildId } = body;

    // Validate
    if (!filename || !contentType || !size || !guildId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!/^\d+$/.test(guildId)) {
      return NextResponse.json(
        { error: "Invalid guild ID" },
        { status: 400 }
      );
    }

    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Sanitize filename: strip path separators, limit length
    const sanitizedFilename = filename
      .replace(/[/\\]/g, "")
      .replace(/\.\./g, "")
      .slice(0, 255);

    // Generate unique key
    const key = `guilds/${guildId}/commands/${crypto.randomUUID()}-${sanitizedFilename}`;

    const command = new CreateMultipartUploadCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType
    });

    const response = await s3.send(command);

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
