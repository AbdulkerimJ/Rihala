import ValidationError from "../errors/ValidationError.js";

const validate = (
  schema,
  message = "Please correct the highlighted fields.",
  source = "body",
) => {
  return (req, res, next) => {
    const payload = req[source];
    const result = schema.safeParse(payload);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => {
        if (issue.code === "unrecognized_keys") {
          return {
            field: issue.keys.join(", "),
            message: `You cannot update ${issue.keys.join(", ")}.`,
          };
        }

        return {
          field:
            issue.path.length > 0
              ? issue.path.join(".")
              : "general",
          message: issue.message,
        };
      });

      return next(new ValidationError(message, errors));
    }

    if (source === "body") {
      req.validatedBody = result.data;
    } else if (source === "params") {
      req.validatedParams = result.data;
    } else if (source === "query") {
      req.validatedQuery = result.data;
    } else {
      req.validatedData = result.data;
    }

    next();
  };
};

export default validate;