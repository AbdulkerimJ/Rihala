import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { applyServerErrors } from "../../../utils/apiResponse";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

/* ─── Reusable styled field ─────────────────────────────────────────────── */
const Field = ({ label, error, children }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-primary">{label}</label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs text-danger">
        <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-danger" />
        {error}
      </p>
    )}
  </div>
);

/* ─── Input base styles ──────────────────────────────────────────────────── */
const inputBase =
  "block w-full rounded-xl border bg-main px-4 py-2.5 text-sm text-primary placeholder:text-muted transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";
const inputNormal = "border-border focus:border-accent focus:ring-accent/20";
const inputError  = "border-danger focus:border-danger focus:ring-danger/20";

export const Login = () => {
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await login(data);
      toast.success("Successfully logged in!");
    } catch (error) {
      applyServerErrors(setError, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">
          Welcome back
        </h2>
        <p className="mt-1.5 text-sm text-secondary">
          Sign in to your Rihala account to continue.
        </p>
      </div>

      {/* Form */}
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <Field label="Email address" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            disabled={isSubmitting}
            className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
            {...register("email")}
          />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={isSubmitting}
              className={`${inputBase} pr-11 ${errors.password ? inputError : inputNormal}`}
              {...register("password")}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((p) => !p)}
              className="absolute inset-y-0 right-3.5 flex items-center text-muted hover:text-primary transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </Field>

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Forgot your password?
          </Link>
        </div>

        {/* Server error */}
        {errors.root && (
          <div className="rounded-xl bg-danger/8 border border-danger/20 px-4 py-3 text-sm text-danger">
            {errors.root.message}
          </div>
        )}

        {/* Submit */}
        <button
          id="login-submit"
          type="submit"
          disabled={isSubmitting}
          className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Signing in…
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              Sign in
            </>
          )}
        </button>
      </form>
    </div>
  );
};
