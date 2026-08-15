import {
  Clock,
  Hammer,
  PackageCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";

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

export const ORDER_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    variant: "amber",
    iconVariant: "amber",
    textClass: "text-status-pending",
    bgLight: "bg-status-pending/10",
    borderClass: "border-status-pending/20",
    icon: Clock,
    subtitle: "Awaiting start of workshop production",
    stepIndex: 0,
  },
  in_progress: {
    label: "In Progress",
    variant: "blue",
    iconVariant: "blue",
    textClass: "text-status-processing",
    bgLight: "bg-status-processing/10",
    borderClass: "border-status-processing/20",
    icon: Hammer,
    subtitle: "Crafting and building in workshop",
    stepIndex: 1,
  },
  ready: {
    label: "Ready",
    variant: "purple",
    iconVariant: "purple",
    textClass: "text-status-shipped",
    bgLight: "bg-status-shipped/10",
    borderClass: "border-status-shipped/20",
    icon: PackageCheck,
    subtitle: "Finished & ready for pickup/delivery",
    stepIndex: 2,
  },
  completed: {
    label: "Completed",
    variant: "emerald",
    iconVariant: "emerald",
    textClass: "text-status-delivered",
    bgLight: "bg-status-delivered/10",
    borderClass: "border-status-delivered/20",
    icon: CheckCircle2,
    subtitle: "Delivered to customer & completed",
    stepIndex: 3,
  },
  cancelled: {
    label: "Cancelled",
    variant: "rose",
    iconVariant: "rose",
    textClass: "text-status-cancelled",
    bgLight: "bg-status-cancelled/10",
    borderClass: "border-status-cancelled/20",
    icon: XCircle,
    subtitle: "Order has been cancelled",
    stepIndex: -1,
  },
};

export const ORDER_LIFECYCLE_STEPS = [
  { key: "pending", label: "Pending", icon: Clock, color: "amber" },
  { key: "in_progress", label: "In Progress", icon: Hammer, color: "blue" },
  { key: "ready", label: "Ready", icon: PackageCheck, color: "purple" },
  { key: "completed", label: "Completed", icon: CheckCircle2, color: "emerald" },
];

