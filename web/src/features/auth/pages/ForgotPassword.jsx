import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Mail, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { forgotPassword } from "../api";
import { getApiErrorMessage } from "../../../utils/apiResponse";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
});

const inputBase =
  "block w-full rounded-xl border bg-main px-4 py-2.5 text-sm text-primary placeholder:text-muted transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50";
const inputNormal = "border-border focus:border-accent focus:ring-accent/20";
const inputError  = "border-danger focus:border-danger focus:ring-danger/20";

export const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const result = await forgotPassword(data);
      toast.success(result.message || "If the account exists, a reset link was sent.");
      setSubmitted(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to send reset link."));
    }
  };

  /* ── Success state ─────────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Check your inbox</h2>
          <p className="mt-1.5 text-sm text-secondary">
            Password reset instructions have been sent.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Email sent</p>
            <p className="mt-1 text-xs text-secondary leading-relaxed">
              If an account with <span className="font-medium text-primary">{getValues("email")}</span> exists,
              you'll receive a reset link shortly.
            </p>
          </div>
          <p className="text-xs text-muted">Didn't receive it? Check your spam folder.</p>
        </div>

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    );
  }

  /* ── Form ─────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-8">
      {/* Icon + Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
          <Mail className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Forgot password?</h2>
          <p className="mt-1 text-sm text-secondary">
            No worries — we'll send you reset instructions.
          </p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-primary">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
            {...register("email")}
          />
          {errors.email && (
            <p className="flex items-center gap-1 text-xs text-danger">
              <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-danger" />
              {errors.email.message}
            </p>
          )}
        </div>

        <button
          id="forgot-password-submit"
          type="submit"
          disabled={isSubmitting}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              Send reset link
            </>
          )}
        </button>
      </form>

      <Link
        to="/login"
        className="flex items-center justify-center gap-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>
    </div>
  );
};
