import type { Metadata } from "next";

import { CommandsPage } from "./commands-page";

export const metadata: Metadata = {
  title: "Commands"
};

export default async function Page({
  params
}: {
  params: Promise<{ discordId: string }>;
}) {
  const { discordId } = await params;

  return <CommandsPage discordId={discordId} />;
}
