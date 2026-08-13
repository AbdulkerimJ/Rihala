import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Mail, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { forgotPassword } from "../api";
import { getApiErrorMessage } from "../../../utils/apiResponse";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
});

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
        <FormField label="Email address" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            size="lg"
            autoComplete="email"
            placeholder="you@example.com"
            disabled={isSubmitting}
            error={errors.email?.message}
            {...register("email")}
          />
        </FormField>

        <Button
          id="forgot-password-submit"
          type="submit"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          leftIcon={isSubmitting ? undefined : Send}
          className="rounded-xl"
        >
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
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
