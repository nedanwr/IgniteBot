import type { Metadata } from "next";

import { AuditLogPage } from "./audit-log-page";

export const metadata: Metadata = {
  title: "Audit Log"
};

export default async function Page({
  params
}: {
  params: Promise<{ discordId: string }>;
}) {
  const { discordId } = await params;

  return <AuditLogPage discordId={discordId} />;
}
