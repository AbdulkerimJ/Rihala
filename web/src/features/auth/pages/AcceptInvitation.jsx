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
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

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

export const AcceptInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [tokenState, setTokenState] = useState("validating"); // 'validating' | 'valid' | 'invalid'
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

  // Validate token on mount
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
          err?.response?.data?.message ||
            "This invitation link is invalid or has expired.",
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
      const message =
        err?.response?.data?.message ||
        "Something went wrong. Please try again.";
      setError("root", { message });
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center text-center gap-5">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-primary">
          Password Set Successfully!
        </h1>
        <p className="text-secondary text-sm">
          Your account is now active. You can log in with your email and the
          password you just created.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-hover transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // ── Validating / Loading state ────────────────────────────────────────────
  if (tokenState === "validating") {
    return (
      <div className="flex flex-col items-center gap-3 text-secondary py-10">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-sm">Validating your invitation link...</p>
      </div>
    );
  }

  // ── Invalid token state ───────────────────────────────────────────────────
  if (tokenState === "invalid") {
    return (
      <div className="flex flex-col items-center text-center gap-5">
        <div className="h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-danger" />
        </div>
        <h1 className="text-2xl font-bold text-primary">
          Invalid Invitation
        </h1>
        <p className="text-secondary text-sm">{tokenError}</p>
        <Link to="/login" className="text-sm text-brand hover:underline">
          Back to Login
        </Link>
      </div>
    );
  }

  // ── Set Password form ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="h-14 w-14 rounded-2xl bg-brand/10 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-brand" />
          </div>
          <h1 className="text-2xl font-bold text-primary">
            Create Your Password
          </h1>
          <p className="text-sm text-secondary text-center">
            You've been invited to join. Set a password to activate your
            account.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              Verification Code
            </label>
            <input
              {...register("code")}
              inputMode="numeric"
              maxLength={4}
              placeholder="4-digit code"
              className="block w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-main text-primary"
            />
            {errors.code && (
              <p className="mt-1 text-xs text-danger">{errors.code.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              Password
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                className="block w-full rounded-lg border border-border px-3 py-2.5 pr-10 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-main text-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-primary"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-danger">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-primary">
              Confirm Password
            </label>
            <div className="relative">
              <input
                {...register("confirmPassword")}
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your password"
                className="block w-full rounded-lg border border-border px-3 py-2.5 pr-10 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand bg-main text-primary"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-primary"
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-danger">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Root / Server Error */}
          {errors.root && (
            <div className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2 text-sm text-danger">
              {errors.root.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50 transition-colors"
          >
            {isSubmitting
              ? "Activating Account..."
              : "Set Password & Activate Account"}
          </button>
        </form>

      <p className="mt-6 text-center text-xs text-muted">
        Already have an account?{" "}
        <Link to="/login" className="text-brand hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
};
