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
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

const schema = z
  .object({
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [showNew, setShowNew] = useState(false);
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
        <FormField label="New password" error={errors.newPassword?.message}>
          <div className="relative">
            <Input
              type={showNew ? "text" : "password"}
              size="lg"
              placeholder="At least 6 characters"
              error={errors.newPassword?.message}
              {...register("newPassword")}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowNew((p) => !p)}
              className="absolute inset-y-0 right-3.5 flex items-center text-muted hover:text-primary transition-colors"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        {/* Confirm password */}
        <FormField label="Confirm password" error={errors.confirmPassword?.message}>
          <div className="relative">
            <Input
              type={showConfirm ? "text" : "password"}
              size="lg"
              placeholder="Repeat your password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
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
        </FormField>

        {/* Server error */}
        {errors.root && (
          <div className="rounded-xl bg-danger/8 border border-danger/20 px-4 py-3 text-sm text-danger">
            {errors.root.message}
          </div>
        )}

        <Button
          id="reset-password-submit"
          type="submit"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          leftIcon={isSubmitting ? undefined : ShieldCheck}
          className="rounded-xl"
        >
          {isSubmitting ? "Saving…" : "Reset password"}
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
