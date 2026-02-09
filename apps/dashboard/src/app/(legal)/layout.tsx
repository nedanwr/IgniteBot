import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function LegalLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grain relative min-h-screen">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-primary/5 absolute -top-1/2 left-1/2 size-[800px] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="bg-primary/3 absolute right-0 -bottom-1/2 size-[600px] rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
            <Sparkles className="size-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Ignite</span>
        </Link>
      </header>

      {/* Content */}
      <main className="animate-fade-up relative z-10 mx-auto max-w-3xl px-6 py-16">
        {children}
      </main>

      {/* Footer accent */}
      <div className="via-primary/20 pointer-events-none fixed right-0 bottom-0 left-0 h-px bg-linear-to-r from-transparent to-transparent" />
    </div>
  );
}
