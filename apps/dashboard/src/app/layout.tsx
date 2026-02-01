import type { Metadata } from "next";

import "~/styles/globals.css";

export const metadata: Metadata = {
  title: "Ignite Dashboard",
  description: "Manage your Discord servers with Ignite"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
