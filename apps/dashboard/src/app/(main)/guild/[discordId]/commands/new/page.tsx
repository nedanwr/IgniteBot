import type { Metadata } from "next";

import { NewCommandPage } from "./new-command-page";

export const metadata: Metadata = {
  title: "New Command - Ignite"
};

export default async function Page({
  params
}: {
  params: Promise<{ discordId: string }>;
}) {
  const { discordId } = await params;

  return <NewCommandPage discordId={discordId} />;
}
