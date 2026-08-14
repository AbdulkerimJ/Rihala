import { z } from "zod";

export const isValidEthiopianPhone = (value) => {
  if (typeof value !== "string") return false;
  const digits = value.trim().replace(/\D/g, "");
  if (!digits) return false;
  if (digits.startsWith("251") && digits.length === 12) return true;
  if (digits.startsWith("09") && digits.length === 10) return true;
  if (digits.length === 9 && digits.startsWith("9")) return true;
  return false;
};

export const ethiopianPhone = z
  .string({ error: "Phone number is required." })
  .trim()
  .min(1, "Phone number is required.")
  .refine((val) => isValidEthiopianPhone(val), {
    message: "Please enter a valid Ethiopian phone number (e.g. 0911234567 or +251911234567)",
  });

export const optionalEthiopianPhone = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((val) => !val || isValidEthiopianPhone(val), {
    message: "Please enter a valid Ethiopian phone number (e.g. 0911234567 or +251911234567)",
  });

export const optionalEmail = z
  .string()
  .trim()
  .email("Please enter a valid email address.")
  .optional()
  .or(z.literal(""));

export const positiveNumber = (label = "This field") =>
  z.coerce
    .number({ error: `${label} is required.` })
    .positive(`${label} must be greater than 0.`);

export const nonNegativeNumber = (label = "This field") =>
  z.coerce
    .number({ error: `${label} is required.` })
    .min(0, `${label} cannot be negative.`);

export const requiredString = (label = "This field", minLength = 1) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(minLength, `${label} must be at least ${minLength} character${minLength > 1 ? "s" : ""}.`);

export const isWorkday = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  const day = date.getDay(); // 0 is Sunday, 6 is Saturday
  return day >= 1 && day <= 6;
};
