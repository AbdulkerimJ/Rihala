import React, { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Textarea } from "./Textarea";
import { FormField } from "./FormField";
import { AlertTriangle, Info } from "lucide-react";

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
  requireReason = false,
  isSubmitting = false,
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError("Please provide a reason.");
      return;
    }
    setError("");
    onConfirm(requireReason ? reason : undefined);
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    setReason("");
    setError("");
    onCancel();
  };

  const isDanger = variant === "danger";

  return (
      <Modal
        isOpen={isOpen}
        title={title}
        onClose={isSubmitting ? undefined : handleCancel}
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-4">
          <div className="flex gap-4">
            <div
              className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                isDanger
                  ? "bg-danger/10 text-danger"
                  : "bg-accent/10 text-accent"
              }`}
            >
              {isDanger ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <Info className="h-5 w-5" />
              )}
            </div>
            <div className="space-y-3 flex-1">
              <p className="text-sm text-secondary">{description}</p>
            {requireReason && (
              <FormField label="Reason" required error={error} className="mt-4">
                <Textarea
                  rows={3}
                  placeholder="Required explanation..."
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (e.target.value.trim()) setError("");
                  }}
                  error={error}
                />
              </FormField>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={isDanger ? "danger" : "primary"}
            onClick={handleConfirm}
            isLoading={isSubmitting}
            disabled={isSubmitting || (requireReason && !reason.trim())}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
