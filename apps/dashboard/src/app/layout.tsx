import type { Metadata, Viewport } from "next";
import { DM_Sans, Instrument_Sans } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";

import { AppConvexProvider } from "~/integrations/convex/provider";
import { Toaster } from "~/components/ui/sonner";
import "~/styles/globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000"
};

export const metadata: Metadata = {
  title: {
    default: "Ignite",
    template: "%s | Ignite"
  },
  description: "Manage your Discord servers with Ignite"
};

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body"
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-heading"
});

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html
        lang="en"
        className={`${dmSans.variable} ${instrumentSans.variable}`}
      >
        <body>
          <AppConvexProvider>{children}</AppConvexProvider>
          <Toaster position="bottom-right" richColors closeButton />
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
