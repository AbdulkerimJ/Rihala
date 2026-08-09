import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Mail } from "lucide-react";
import { forgotPassword } from "../api";
import { Button } from "../../../components/ui/Button";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
});

export const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      const result = await forgotPassword(data);
      toast.success(
        result.message || "If the account exists, a reset link was sent.",
      );
      setSubmitted(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send reset link.",
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center mb-8 gap-3 text-center">
        <div className="h-14 w-14 rounded-2xl bg-brand/10 flex items-center justify-center">
          <Mail className="h-7 w-7 text-brand" />
        </div>
        <h2 className="text-2xl font-bold text-primary">
          Forgot Password
        </h2>
        <p className="text-sm text-secondary">
          We’ll send instructions to your email address.
        </p>
      </div>

      {!submitted ? (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-primary"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm bg-main text-primary ${errors.email ? "border-danger focus:border-danger focus:ring-danger" : "border-border focus:border-brand focus:ring-brand"}`}
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-2 text-sm text-danger">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} fullWidth>
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>

          <p className="text-center text-sm text-secondary">
            <Link to="/login" className="text-brand hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      ) : (
        <div className="rounded-2xl border border-border bg-main p-6 text-center">
          <p className="text-sm text-secondary">
            If an account with that email exists, password reset instructions
            were sent.
          </p>
          <Link
            to="/login"
            className="mt-4 inline-block text-sm text-brand hover:underline"
          >
            Back to login
          </Link>
        </div>
      )}
    </div>
  );
};
