import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-foreground mb-2 text-4xl font-bold">404</h1>
        <p className="text-muted-foreground mb-6">
          This page could not be found.
        </p>
        <Link
          href="/"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
