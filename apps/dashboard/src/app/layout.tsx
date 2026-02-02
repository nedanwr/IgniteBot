import { DM_Sans, Instrument_Sans } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";

import { AppConvexProvider } from "~/integrations/convex/provider";
import "~/styles/globals.css";

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
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
