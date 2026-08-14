import React, { useState, useEffect } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { FormField } from "./FormField";
import { Input } from "./Input";

/**
 * Reusable modal dialog for entering a void or cancellation reason.
 */
export const VoidReasonDialog = ({
  isOpen,
  title = "Void Record",
  message = "Are you sure you want to void this item? This action cannot be undone.",
  confirmLabel = "Void Record",
  placeholder = "Reason for voiding...",
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError("");
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("Reason is required.");
      return;
    }
    await onConfirm(reason.trim());
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      cancelLabel="Cancel"
      onConfirm={handleConfirm}
      onCancel={onCancel}
      isDestructive
      isLoading={isLoading}
    >
      <div className="mt-4">
        <FormField label="Reason (required)" error={error}>
          <Input
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError("");
            }}
            placeholder={placeholder}
            error={error}
          />
        </FormField>
      </div>
    </ConfirmDialog>
  );
};
