import { useEffect, useState } from "react";
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
        visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      } sm:flex sm:items-center sm:justify-center sm:p-4`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* Modal Container */}
      <div
        className={`
          absolute inset-x-0 bottom-0 sm:relative sm:inset-auto sm:bottom-auto
          flex flex-col
          bg-surface sm:rounded-xl rounded-t-2xl shadow-2xl border border-border/50
          max-h-[90dvh] sm:max-h-[90vh]
          w-full ${maxWidth}
          transition-transform duration-300 sm:duration-200 ease-out
          ${visible ? "translate-y-0 sm:scale-100 sm:opacity-100" : "translate-y-full sm:translate-y-0 sm:scale-95 sm:opacity-0"}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle pill (Mobile only) */}
        <div className="flex sm:hidden justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {title && (
          <div className="flex items-center justify-between border-b border-border px-5 py-3 sm:py-4 sm:px-6 shrink-0 bg-surface sm:rounded-t-xl rounded-t-2xl">
            <h3
              id="modal-title"
              className="text-lg sm:text-xl font-bold tracking-tight text-primary font-display"
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

        <div className="overflow-y-auto flex-1 pb-safe sm:pb-0">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
