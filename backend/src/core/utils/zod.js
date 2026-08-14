import { z } from "zod";

export const emptyToUndefined = (schema) =>
  z.preprocess((val) => (val === "" || val === null ? undefined : val), schema);
