import type { Metadata } from "next";

import { SettingsPage } from "./settings-page";

export const metadata: Metadata = {
  title: "Server Settings - Ignite"
};

export default async function Page({
  params
}: {
  params: Promise<{ discordId: string }>;
}) {
  const { discordId } = await params;

  return <SettingsPage discordId={discordId} />;
}
