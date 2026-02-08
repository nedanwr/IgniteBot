import { notFound } from "next/navigation";

import { GuildShell } from "./guild-shell";

const SNOWFLAKE_RE = /^\d{17,20}$/;

export default async function GuildLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ discordId: string }>;
}) {
  const { discordId } = await params;

  if (!SNOWFLAKE_RE.test(discordId)) {
    notFound();
  }

  return <GuildShell discordId={discordId}>{children}</GuildShell>;
}
