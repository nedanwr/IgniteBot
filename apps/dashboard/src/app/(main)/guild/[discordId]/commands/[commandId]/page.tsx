import type { Metadata } from "next";

import { EditCommandPage } from "./edit-command-page";

export const metadata: Metadata = {
  title: "Edit Command"
};

export default async function Page({
  params
}: {
  params: Promise<{ discordId: string; commandId: string }>;
}) {
  const { discordId, commandId } = await params;

  return <EditCommandPage discordId={discordId} commandId={commandId} />;
}
