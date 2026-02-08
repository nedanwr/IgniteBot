import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { isAuthenticatedNextjs } from "@convex-dev/auth/nextjs/server";

import { env } from "~/env";
import { s3 } from "~/lib/s3";
import { checkBodySize } from "~/lib/api";

// Only allow keys matching the expected guild commands path
const VALID_KEY_PATTERN =
  /^guilds\/\d+\/commands\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-.+$/;

/**
 * Extracts the S3 key from a public URL.
 * Expected URL format: https://public-domain.com/guilds/{guildId}/commands/{uuid}-{filename}
 * Returns null if the key doesn't match the expected pattern.
 */
function extractKeyFromUrl(url: string): string | null {
  try {
    const publicUrlBase = env.R2_PUBLIC_URL;
    if (!url.startsWith(publicUrlBase)) {
      return null;
    }
    const key = url.slice(publicUrlBase.length).replace(/^\//, "");
    if (!VALID_KEY_PATTERN.test(key)) {
      return null;
    }
    return key;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthenticatedNextjs())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tooLarge = checkBodySize(request);
    if (tooLarge) return tooLarge;
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

    await s3.send(command);

    return NextResponse.json({ deleted: keys.length });
  } catch (error) {
    console.error("Delete files error:", error);
    return NextResponse.json(
      { error: "Failed to delete files" },
      { status: 500 }
    );
  }
}
