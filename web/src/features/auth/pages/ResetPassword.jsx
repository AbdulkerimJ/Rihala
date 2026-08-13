import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Lock, Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react";
import { resetPassword } from "../api";
import { useAuth } from "../../../hooks/useAuth";
import { applyServerErrors } from "../../../utils/apiResponse";

const schema = z
  .object({
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const inputBase =
  "block w-full rounded-xl border bg-main px-4 py-2.5 text-sm text-primary placeholder:text-muted transition-all duration-150 focus:outline-none focus:ring-2 disabled:opacity-50";
const inputNormal = "border-border focus:border-accent focus:ring-accent/20";
const inputError  = "border-danger focus:border-danger focus:ring-danger/20";

const PasswordInput = ({ placeholder, hasError, showState, onToggle, registration }) => (
  <div className="relative">
    <input
      type={showState ? "text" : "password"}
      placeholder={placeholder}
      className={`${inputBase} pr-11 ${hasError ? inputError : inputNormal}`}
      {...registration}
    />
    <button
      type="button"
      tabIndex={-1}
      onClick={onToggle}
      className="absolute inset-y-0 right-3.5 flex items-center text-muted hover:text-primary transition-colors"
    >
      {showState ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  </div>
);

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const result = await resetPassword({ token, newPassword: data.newPassword });
      if (result?.data?.accessToken) {
        toast.success(result.message || "Password has been reset.");
        await loginWithToken(result.data.accessToken);
        navigate("/");
      } else {
        toast.success(result.message || "Password has been reset.");
        reset();
      }
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Icon + Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
          <Lock className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Reset your password</h2>
          <p className="mt-1 text-sm text-secondary">Choose a strong new password for your account.</p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {/* New password */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-primary">New password</label>
          <PasswordInput
            placeholder="At least 6 characters"
            hasError={!!errors.newPassword}
            showState={showNew}
            onToggle={() => setShowNew((p) => !p)}
            registration={register("newPassword")}
          />
          {errors.newPassword && (
            <p className="flex items-center gap-1 text-xs text-danger">
              <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-danger" />
              {errors.newPassword.message}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-primary">Confirm password</label>
          <PasswordInput
            placeholder="Repeat your password"
            hasError={!!errors.confirmPassword}
            showState={showConfirm}
            onToggle={() => setShowConfirm((p) => !p)}
            registration={register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="flex items-center gap-1 text-xs text-danger">
              <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-danger" />
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Server error */}
        {errors.root && (
          <div className="rounded-xl bg-danger/8 border border-danger/20 px-4 py-3 text-sm text-danger">
            {errors.root.message}
          </div>
        )}

        <button
          id="reset-password-submit"
          type="submit"
          disabled={isSubmitting}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving…
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Reset password
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
