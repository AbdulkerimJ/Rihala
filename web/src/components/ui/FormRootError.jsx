import { AlertCircle } from "lucide-react";
/**
 * Reusable form root error display banner.
 * Accepts string or Error/FieldState object: error="msg" or error={errors.root}
 */
export const FormRootError = ({ error, className = "" }) => {
  const message = typeof error === "string" ? error : error?.message;
  if (!message) return null;

  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl bg-danger/10 border border-danger/20 p-3.5 text-sm text-danger ${className}`}
    >
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <span className="leading-snug">{message}</span>
    </div>
  );
};
