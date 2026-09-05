import { useState } from "react";
import { Link } from "react-router-dom";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { PasswordInput } from "../../../components/ui/PasswordInput";
import { FormRootError } from "../../../components/ui/FormRootError";
import { Button } from "../../../components/ui/Button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { LogIn } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { applyServerErrors } from "../../../utils/apiResponse";

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

        <FormField label="Password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            size="lg"
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isSubmitting}
            error={errors.password?.message}
            {...register("password")}
          />
        </FormField>

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Forgot your password?
          </Link>
        </div>

        {/* Server error */}
        <FormRootError error={errors.root} />

        {/* Submit */}
        <Button
          id="login-submit"
          type="submit"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          leftIcon={isSubmitting ? undefined : LogIn}
          className="rounded-xl"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
};
