import { GuildShell } from "./guild-shell";

export default async function GuildLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ discordId: string }>;
}) {
  const { discordId } = await params;

  return <GuildShell discordId={discordId}>{children}</GuildShell>;
}
