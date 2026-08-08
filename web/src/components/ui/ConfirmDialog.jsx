import React, { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
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
    setReason("");
    setError("");
    onCancel();
  };

  const isDanger = variant === "danger";

  return (
    <Modal isOpen={isOpen} title={title} onClose={handleCancel}>
      <div className="p-6 space-y-4">
        <div className="flex gap-4">
          <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${isDanger ? 'bg-danger/10 text-danger' : 'bg-accent/10 text-accent'}`}>
            {isDanger ? <AlertTriangle className="h-5 w-5" /> : <Info className="h-5 w-5" />}
          </div>
          <div className="space-y-3">
            <p className="text-sm text-secondary">{description}</p>
            {requireReason && (
              <div className="space-y-2 mt-4">
                <label className="block text-sm font-medium text-primary">
                  Reason <span className="text-danger">*</span>
                </label>
                <textarea
                  className="w-full rounded-md border border-border bg-main px-3 py-2 text-sm text-primary placeholder-secondary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  rows={3}
                  placeholder="Required explanation..."
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (e.target.value.trim()) setError("");
                  }}
                />
                {error && <p className="text-xs text-danger">{error}</p>}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={handleCancel} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
          <Button 
            variant={isDanger ? "danger" : "primary"} 
            onClick={handleConfirm} 
            disabled={isSubmitting || (requireReason && !reason.trim())}
          >
            {isSubmitting ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
