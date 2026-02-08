import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";

import { env } from "~/env";
import { s3 } from "~/lib/s3";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 2.5 * 1024 * 1024; // 2.5MB

export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthenticatedNextjs())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2.5MB for direct uploads" },
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

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ContentLength: size
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 300 // 5 minutes
    });

    return NextResponse.json({
      uploadUrl,
      publicUrl: `${env.R2_PUBLIC_URL}/${key}`
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
