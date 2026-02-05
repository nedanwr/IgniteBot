import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";

import { env } from "~/env";

const client = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY
  }
});

/**
 * Extracts the S3 key from a public URL.
 * Expected URL format: https://public-domain.com/guilds/{guildId}/commands/{uuid}-{filename}
 */
function extractKeyFromUrl(url: string): string | null {
  try {
    const publicUrlBase = env.R2_PUBLIC_URL;
    if (url.startsWith(publicUrlBase)) {
      // Remove the base URL and leading slash
      return url.slice(publicUrlBase.length).replace(/^\//, "");
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid urls array" },
        { status: 400 }
      );
    }

    // Extract keys from URLs and filter out non-R2 URLs
    const keys = urls
      .map((url: string) => extractKeyFromUrl(url))
      .filter((key): key is string => key !== null);

    if (keys.length === 0) {
      // No valid R2 URLs to delete
      return NextResponse.json({ deleted: 0 });
    }

    // S3 DeleteObjects supports up to 1000 keys per request
    const command = new DeleteObjectsCommand({
      Bucket: env.R2_BUCKET_NAME,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: true
      }
    });

    await client.send(command);

    return NextResponse.json({ deleted: keys.length });
  } catch (error) {
    console.error("Delete files error:", error);
    return NextResponse.json(
      { error: "Failed to delete files" },
      { status: 500 }
    );
  }
}
