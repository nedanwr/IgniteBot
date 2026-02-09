import type { Metadata } from "next";

import { GuildPage } from "./guild-page";

export const metadata: Metadata = {
  title: "Overview"
};

export default async function Page({
  params
}: {
  params: Promise<{ discordId: string }>;
}) {
  const { discordId } = await params;

  return <GuildPage discordId={discordId} />;
}
