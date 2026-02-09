"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "~/components/ui/button";

export function AuthForm() {
  const { signIn } = useAuthActions();
  const [loading, setLoading] = useState(false);

  return (
    <div className="grain flex min-h-screen items-center justify-center">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-primary/5 absolute -top-1/2 left-1/2 size-[800px] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="bg-primary/3 absolute right-0 -bottom-1/2 size-[600px] rounded-full blur-3xl" />
      </div>

      <div className="animate-fade-up relative z-10 mx-auto max-w-md px-6 text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="bg-primary/10 text-primary glow-amber-subtle flex size-16 items-center justify-center rounded-2xl">
            <Sparkles className="size-8" />
          </div>
        </div>

        <h1 className="mb-3 text-4xl font-semibold tracking-tight">
          Welcome to <span className="text-gradient">Ignite</span>
        </h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Sign in with Discord to manage your servers and configure the bot.
        </p>

        <Button
          size="lg"
          disabled={loading}
          className="gap-2 bg-[#5865F2] text-white hover:bg-[#4752C4]"
          onClick={() => {
            setLoading(true);
            void signIn("discord", { redirectTo: "/" });
          }}
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          )}
          {loading ? "Redirecting..." : "Continue with Discord"}
        </Button>

        <p className="text-muted-foreground mt-6 text-sm">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      {/* Footer accent */}
      <div className="via-primary/20 pointer-events-none fixed right-0 bottom-0 left-0 h-px bg-linear-to-r from-transparent to-transparent" />
    </div>
  );
}
