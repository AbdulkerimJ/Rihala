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

  if (data?.user) {
    return data.user;
  }

  if (data?.role) {
    return data.role;
  }

  return data ?? null;
};

export const getApiErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again.",
) => {
  return error?.response?.data?.message || error?.message || fallback;
};

export const getApiFieldErrors = (error) => {
  return error?.response?.data?.errors || [];
};
