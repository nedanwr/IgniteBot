import type { Metadata } from "next";

import { Dashboard } from "./dashboard-page";

export const metadata: Metadata = {
  title: "Your Servers | Dashboard - Ignite"
};

export default function DashboardPage() {
  return <Dashboard />;
}
