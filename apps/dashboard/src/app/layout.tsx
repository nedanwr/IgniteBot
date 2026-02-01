import type { Metadata } from "next";
import { DM_Sans, Instrument_Sans } from "next/font/google";

import "~/styles/globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body"
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-heading"
});

export const metadata: Metadata = {
  title: "Ignite Dashboard",
  description: "Manage your Discord servers with Ignite"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${instrumentSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
