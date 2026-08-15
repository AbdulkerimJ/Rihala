import React from "react";
import { ConfirmDialog } from "./ConfirmDialog";

/**
 * Reusable modal dialog for entering a void or cancellation reason.
 */
export const VoidReasonDialog = ({
  isOpen,
  title = "Void Record",
  message,
  description = "Are you sure you want to void this item? This action cannot be undone.",
  confirmLabel = "Void Payment",
  cancelLabel = "Cancel",
  isLoading = false,
  isSubmitting = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={title}
      description={message || description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      variant="danger"
      requireReason={true}
      isSubmitting={isLoading || isSubmitting}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

