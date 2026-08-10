import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ErrorBoundary } from '../components/ErrorBoundary';

/* ── Brand wordmark ──────────────────────────────────────────────────────── */
const Wordmark = () => (
  <div className="flex flex-col items-center text-center" style={{ gap: '10px' }}>

    {/* Main title — Cinzel serif for a regal, monumental feel */}
    <span
      className="text-primary uppercase leading-none"
      style={{
        fontFamily: "'Cinzel', serif",
        fontSize: '2.2rem',
        fontWeight: 700,
        letterSpacing: '0.22em',
      }}
    >
      Rihala
    </span>

    {/* Divider line */}
    <div
      className="h-px w-full"
      style={{
        background: 'linear-gradient(to right, transparent, rgb(var(--color-accent) / 0.5) 50%, transparent)',
      }}
    />

    {/* Subtitle */}
    <span
      className="font-medium text-secondary uppercase"
      style={{ fontSize: '0.58rem', letterSpacing: '0.38em' }}
    >
      Arabian Mejlis
    </span>

  </div>
);


export const AuthLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-main">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-xs font-medium text-secondary">Loading Rihala...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-main flex flex-col selection:bg-accent/20 selection:text-accent">
      {/* Top bar */}
      <div className="flex items-center justify-end px-6 pt-5">
        <ThemeToggle />
      </div>

      {/* Centered form */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <div className="mb-10 flex justify-center">
            <Wordmark />
          </div>

          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 pb-6 text-center text-xs text-muted font-medium">
        © {new Date().getFullYear()} Rihala Systems. All rights reserved.
      </footer>
    </div>
  );
};
