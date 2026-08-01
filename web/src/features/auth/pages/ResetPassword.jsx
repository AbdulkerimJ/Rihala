import React from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { resetPassword } from "../api";
import { Button } from "../../../components/ui/Button";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const ResetPassword = () => {
  const { token } = useParams();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const result = await resetPassword({
        token,
        newPassword: data.newPassword,
      });
      toast.success(result.message || "Password has been reset.");
      reset();
    } catch (error) {
      setError("root", {
        message: error.response?.data?.message || "Failed to reset password.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-primary">Reset Password</h2>
        <p className="mt-2 text-sm text-secondary">
          Choose a new password for your account.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-sm font-medium text-primary">
            New password
          </label>
          <input
            type="password"
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm bg-main text-primary ${errors.newPassword ? "border-danger focus:border-danger focus:ring-danger" : "border-border focus:border-brand focus:ring-brand"}`}
            {...register("newPassword")}
          />
          {errors.newPassword && (
            <p className="mt-2 text-sm text-danger">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-primary">
            Confirm password
          </label>
          <input
            type="password"
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm bg-main text-primary ${errors.confirmPassword ? "border-danger focus:border-danger focus:ring-danger" : "border-border focus:border-brand focus:ring-brand"}`}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-danger">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {errors.root && (
          <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {errors.root.message}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} fullWidth>
          {isSubmitting ? "Saving..." : "Reset password"}
        </Button>

        <p className="text-center text-sm text-secondary">
          <Link to="/login" className="text-brand hover:underline">
            Back to login
          </Link>
        </p>
      </form>
    </div>
  );
};
