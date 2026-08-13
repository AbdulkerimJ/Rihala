import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { validateInvitation, acceptInvitation } from "../api";
import { useAuth } from "../../../hooks/useAuth";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import { applyServerErrors, getApiErrorMessage } from "../../../utils/apiResponse";

const schema = z
  .object({
    code: z.string().regex(/^\d{4}$/, "Verification code must be 4 digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const inputBase =
  "block w-full rounded-xl border bg-main px-4 py-2.5 text-sm text-primary placeholder:text-muted transition-all duration-150 focus:outline-none focus:ring-2";
const inputNormal = "border-border focus:border-accent focus:ring-accent/20";
const inputError  = "border-danger focus:border-danger focus:ring-danger/20";

const FieldError = ({ message }) =>
  message ? (
    <p className="flex items-center gap-1 text-xs text-danger">
      <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-danger" />
      {message}
    </p>
  ) : null;

export const AcceptInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [tokenState, setTokenState] = useState("validating");
  const [tokenError, setTokenError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { loginWithToken } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!token) {
      setTokenState("invalid");
      setTokenError("No invitation token provided.");
      return;
    }
    validateInvitation(token)
      .then(() => setTokenState("valid"))
      .catch((err) => {
        setTokenState("invalid");
        setTokenError(
          getApiErrorMessage(err, "This invitation link is invalid or has expired.")
        );
      });
  }, [token]);

  const onSubmit = async (data) => {
    try {
      const response = await acceptInvitation({
        token,
        code: data.code,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      if (response?.data?.accessToken) {
        await loginWithToken(response.data.accessToken);
        navigate("/");
      } else {
        setSuccess(true);
      }
    } catch (err) {
      applyServerErrors(setError, err);
    }
  };

  /* ── Success ─────────────────────────────────────────────────────────── */
  if (success) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">You're all set!</h2>
          <p className="mt-1.5 text-sm text-secondary">Your account is now active and ready to use.</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <div>
            <p className="text-base font-semibold text-primary">Password created successfully</p>
            <p className="mt-1 text-sm text-secondary">
              You can now log in with your email and the password you just set.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2"
        >
          Go to login
        </button>
      </div>
    );
  }

  /* ── Validating ─────────────────────────────────────────────────────── */
  if (tokenState === "validating") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm text-secondary">Validating your invitation link…</p>
      </div>
    );
  }

  /* ── Invalid token ─────────────────────────────────────────────────── */
  if (tokenState === "invalid") {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Invalid invitation</h2>
          <p className="mt-1.5 text-sm text-secondary">This link cannot be used.</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
            <AlertCircle className="h-8 w-8 text-danger" />
          </div>
          <p className="text-sm text-secondary leading-relaxed">{tokenError}</p>
        </div>
        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    );
  }

  /* ── Set Password form ─────────────────────────────────────────────── */
  return (
    <div className="space-y-8">
      {/* Icon + Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
          <ShieldCheck className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Create your password</h2>
          <p className="mt-1 text-sm text-secondary">
            You've been invited to join. Set a password to activate your account.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Verification code */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-primary">
            Verification code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <KeyRound className="h-4 w-4 text-muted" />
            </div>
            <input
              {...register("code")}
              inputMode="numeric"
              maxLength={4}
              placeholder="4-digit code"
              className={`${inputBase} pl-11 tracking-widest font-mono ${errors.code ? inputError : inputNormal}`}
            />
          </div>
          <FieldError message={errors.code?.message} />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-primary">Password</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="At least 6 characters"
              className={`${inputBase} pr-11 ${errors.password ? inputError : inputNormal}`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((p) => !p)}
              className="absolute inset-y-0 right-3.5 flex items-center text-muted hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FieldError message={errors.password?.message} />
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-primary">Confirm password</label>
          <div className="relative">
            <input
              {...register("confirmPassword")}
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              className={`${inputBase} pr-11 ${errors.confirmPassword ? inputError : inputNormal}`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirm((p) => !p)}
              className="absolute inset-y-0 right-3.5 flex items-center text-muted hover:text-primary transition-colors"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FieldError message={errors.confirmPassword?.message} />
        </div>

        {/* Server error */}
        {errors.root && (
          <div className="rounded-xl bg-danger/8 border border-danger/20 px-4 py-3 text-sm text-danger">
            {errors.root.message}
          </div>
        )}

        <button
          id="accept-invitation-submit"
          type="submit"
          disabled={isSubmitting}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Activating account…
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Set password & activate account
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-accent hover:text-accent-hover transition-colors">
          Log in
        </Link>
      </p>
    </div>
  );
};
