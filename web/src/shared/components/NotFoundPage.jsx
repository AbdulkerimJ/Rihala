import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 text-ink">
      <div className="max-w-md text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">404</p>
        <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm text-slate-600">
          The requested screen is not available yet.
        </p>
        <Link
          className="mt-6 inline-flex rounded-full bg-ink px-4 py-2 text-sm text-white"
          to="/"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
