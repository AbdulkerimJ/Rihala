export const ORDER_STATUS_LABELS = {
  pending: "Pending",
  in_progress: "In Progress",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_TRANSITIONS = {
  pending: ["in_progress", "cancelled"],
  in_progress: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
};

export const getAllowedOrderTransitions = (status) =>
  ORDER_STATUS_TRANSITIONS[status] || [];
