import { Link, Outlet } from "react-router-dom";

export function MainLayout() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold tracking-wide">
            Rihala
          </Link>
          <nav className="text-sm text-slate-600">Workspace foundation</nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
