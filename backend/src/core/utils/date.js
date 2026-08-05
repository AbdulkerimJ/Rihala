/**
 * Normalize a date value to midnight (local timezone), stripping the time
 * component so the value represents a date-only concept.
 *
 * Returns null if the input is falsy or not a valid date.
 */
const normalizeDateValue = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  parsedDate.setHours(0, 0, 0, 0);
  return parsedDate;
};

export { normalizeDateValue };
