"use client";

import Link from "next/link";
import { Sparkles, LogOut, Menu } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

import { useCurrentUser } from "~/stores/current-user-store";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";

type HeaderProps = {
  onMenuToggle?: () => void;
  showBranding?: boolean;
  maxWidth?: boolean;
};

export function Header({
  onMenuToggle,
  showBranding = true,
  maxWidth = false
}: HeaderProps) {
  const { user, displayName, userInitials } = useCurrentUser();
  const { signOut } = useAuthActions();

  return (
    <header className="border-border/50 bg-background/80 relative z-40 border-b backdrop-blur-xl">
      <div
        className={`flex h-16 items-center justify-between px-6 ${maxWidth ? "mx-auto max-w-6xl" : ""}`}
      >
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle menu"
              className="text-muted-foreground size-9 lg:hidden"
              onClick={onMenuToggle}
            >
              <Menu className="size-5" />
            </Button>
          )}
          {showBranding && (
            <>
              <Link href="/">
                <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                  <Sparkles className="size-5" />
                </div>
              </Link>
              <span className="text-xl font-semibold tracking-tight">
                <span className="text-gradient">Ignite</span>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-muted-foreground text-sm">Welcome back,</span>
            <span className="font-medium">{displayName}</span>
          </div>
          <Avatar className="ring-border/50 hover:ring-primary/30 ring-2 transition-all">
            {user?.image && <AvatarImage src={user.image} alt={displayName} />}
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            className="text-muted-foreground size-9"
            onClick={() => void signOut()}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
