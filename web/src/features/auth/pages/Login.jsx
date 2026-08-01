import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../../hooks/useAuth";
import { Button } from "../../../components/ui/Button";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const Login = () => {
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await login(data);
      toast.success("Successfully logged in!");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to login. Please check your credentials.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">
          Sign in to Rihala
        </h2>
        <p className="mt-2 text-center text-sm text-secondary">
          Workshop Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-primary"
            >
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`block w-full appearance-none rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm bg-main text-primary ${
                  errors.email
                    ? "border-danger focus:border-danger focus:ring-danger"
                    : "border-border focus:border-brand focus:ring-brand"
                }`}
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-danger">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-primary"
            >
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={`block w-full appearance-none rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm bg-main text-primary ${
                  errors.password
                    ? "border-danger focus:border-danger focus:ring-danger"
                    : "border-border focus:border-brand focus:ring-brand"
                }`}
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-danger">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isSubmitting}
              fullWidth
              className="mt-2"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </div>

          <div className="text-center text-sm text-secondary">
            Forgot your password?{" "}
            <Link to="/forgot-password" className="text-brand hover:underline">
              Reset it here
            </Link>
          </div>
        </form>
      </div>
    </>
  );
};
