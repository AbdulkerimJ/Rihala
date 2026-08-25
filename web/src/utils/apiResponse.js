export const unwrapListResponse = (payload) => {
  const data = payload?.data;

  if (Array.isArray(data)) {
    return {
      items: data,
      pagination: payload?.pagination ?? null,
      raw: payload,
    };
  }

  if (Array.isArray(data?.data)) {
    return {
      items: data.data,
      pagination: data.pagination ?? payload?.pagination ?? null,
      raw: data,
    };
  }

  return {
    items: Array.isArray(payload?.items) ? payload.items : [],
    pagination: payload?.pagination ?? null,
    raw: payload,
  };
};

export const unwrapEntityResponse = (payload) => {
  const data = payload?.data;
  if (!data || typeof data !== "object") return data ?? null;

  const keys = Object.keys(data);
  // If the wrapper contains exactly one key (e.g. { contractor: {...} }) 
  // and the value is a nested object (the actual Mongoose document), unwrap it.
  if (keys.length === 1 && typeof data[keys[0]] === "object" && !Array.isArray(data[keys[0]]) && data[keys[0]] !== null) {
    return data[keys[0]];
  }

  return data;
};

export const getApiErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again.",
) => {
  // Handle Axios timeout errors
  if (
    error?.code === "ECONNABORTED" ||
    (typeof error?.message === "string" && error.message.toLowerCase().includes("timeout"))
  ) {
    return "Request timed out. Please check your internet connection and try again.";
  }

  // Handle network disconnection or server unreachable
  if (
    error?.code === "ERR_NETWORK" ||
    error?.message === "Network Error"
  ) {
    return "Unable to connect to the server. Please check your internet connection.";
  }

  const message = error?.response?.data?.message || error?.message || fallback;

  // Format Mongoose validation errors nicely
  if (typeof message === 'string' && message.includes("validation failed:")) {
    const parts = message.split("validation failed:");
    if (parts.length > 1) {
      const title = parts[0].trim() + " Validation Failed";
      const errorsString = parts[1];
      
      const errors = errorsString.split(',').map(err => {
        const errParts = err.split(':');
        // Get the last part (the actual message) to remove the field name prefix
        return errParts.length > 1 ? errParts.slice(1).join(':').trim() : err.trim();
      });
      
      return `${title}:\n\n` + errors.map(err => `• ${err}`).join('\n');
    }
  }

  return message;
};

export const getApiFieldErrors = (error) => {
  return error?.response?.data?.errors || [];
};

export const applyServerErrors = (setError, error) => {
  const fieldErrors = getApiFieldErrors(error);
  
  if (fieldErrors && fieldErrors.length > 0) {
    fieldErrors.forEach((err) => {
      if (err.field === "general") {
        setError("root", { message: err.message });
      } else {
        setError(err.field, { message: err.message });
      }
    });
  } else {
    setError("root", { message: getApiErrorMessage(error) });
  }
};

export const handleMutationError = (error, setError) => {
  const status = error?.response?.status;

  if (!status || status >= 500) {
    throw error;
  }

  if (status === 401 || status === 403) {
    throw error;
  }

  applyServerErrors(setError, error);
};

export const cleanFilterParams = (filters = {}, extra = {}) => {
  const cleaned = Object.fromEntries(
    Object.entries(filters).filter(
      ([, v]) => v !== "" && v !== undefined && v !== null
    )
  );
  return { ...cleaned, ...extra };
};


