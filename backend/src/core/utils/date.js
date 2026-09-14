/**
 * Normalize a date value to midnight (local timezone), stripping the time
 * component so the value represents a date-only concept. Midnight is set in
 * UTC so day-of-week calculations are timezone-independent regardless of
 * where the server is deployed.
 *
 * Returns null if the input is falsy or not a valid date.
 */
const normalizeDateValue = (value) => {
  if (!value) {
    return null;
  }

  // Convert the string date to date
  const parsedDate = new Date(value);

  // We want the calendar date this represents in the local timezone,
  // represented as a UTC midnight.
  const utcDate = new Date(
    Date.UTC(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate()
    )
  );

  return utcDate;
};

/**
 * Returns true if the date falls on a workday (Monday–Saturday), using UTC
 * day-of-week so the result is independent of server timezone.
 */
const isWorkday = (date) => {
  const day = date.getUTCDay();
  return day >= 1 && day <= 6;
};

/**
 * Returns true if the normalized date is strictly in the future compared to today.
 */
const isFutureDate = (date) => {
  const today = normalizeDateValue(new Date());
  const normalizedDate = normalizeDateValue(date);
  return normalizedDate && today && normalizedDate > today;
};

export { normalizeDateValue, isWorkday, isFutureDate };
