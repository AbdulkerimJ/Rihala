import ValidationError from "../errors/ValidationError.js";

const isValidEthiopianPhone = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  const digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    return false;
  }

  if (digits.startsWith("251") && digits.length === 12) {
    return true;
  }

  if (digits.startsWith("09") && digits.length === 10) {
    return true;
  }

  if (digits.length === 9 && digits.startsWith("9")) {
    return true;
  }

  return false;
};

const normalizePhone = (value) => {
  if (!isValidEthiopianPhone(value)) {
    throw new ValidationError("Please enter a valid Ethiopian phone number.");
  }

  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (digits.startsWith("251") && digits.length === 12) {
    return `+${digits}`;
  }

  if (digits.startsWith("09") && digits.length === 10) {
    return `+251${digits.slice(1)}`;
  }

  if (digits.length === 9 && digits.startsWith("9")) {
    return `+251${digits}`;
  }

  throw new ValidationError("Please enter a valid Ethiopian phone number.");
};

export { normalizePhone, isValidEthiopianPhone };
