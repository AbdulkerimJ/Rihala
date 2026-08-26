import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./Button";

export const Modal = ({
  isOpen = false,
  title,
  children,
  onClose,
  className = "",
  maxWidth = "max-w-2xl",
  closeOnBackdropClick = true,
  showCloseButton = true,
}) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      // Tiny delay so the CSS transition fires on mount
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) {
    return null;
  }

  const handleBackdropClick = () => {
    if (closeOnBackdropClick && onClose) {
      onClose();
    }
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* ── MOBILE: bottom sheet ── */}
      <div
        className={`
          sm:hidden
          absolute inset-x-0 bottom-0 z-10
          flex flex-col
          bg-surface rounded-t-2xl shadow-2xl border border-border/50
          max-h-[90dvh]
          transition-transform duration-300 ease-out
          ${visible ? "translate-y-0" : "translate-y-full"}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle pill */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {title && (
          <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0 bg-surface">
            <h3
              id="modal-title"
              className="text-lg font-bold tracking-tight text-primary font-display"
            >
              {title}
            </h3>
            {showCloseButton && onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}

        <div className="overflow-y-auto flex-1" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {children}
        </div>
      </div>

      {/* ── DESKTOP: centered dialog ── */}
      <div
        className={`
          hidden sm:flex
          absolute inset-0 items-center justify-center p-4 overflow-y-auto
        `}
        onClick={handleBackdropClick}
      >
        <div
          className={`
            w-full ${maxWidth}
            rounded-xl border border-border bg-surface shadow-2xl
            overflow-hidden max-h-[90vh] flex flex-col
            transition-all duration-200
            ${visible ? "scale-100 opacity-100" : "scale-95 opacity-0"}
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6 bg-surface shrink-0">
              <h3
                id="modal-title"
                className="text-xl font-bold tracking-tight text-primary font-display"
              >
                {title}
              </h3>
              {showCloseButton && onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          )}
          <div className="overflow-y-auto flex-1">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
};
