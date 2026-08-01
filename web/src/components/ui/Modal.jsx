import React from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

export const Modal = ({
  isOpen = false,
  title,
  children,
  onClose,
  className = "",
  maxWidth = "max-w-2xl",
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} rounded-2xl border border-border bg-surface shadow-2xl ${className}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <h3 className="text-lg font-semibold text-primary">{title}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
};
