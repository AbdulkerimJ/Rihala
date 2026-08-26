import React, { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { usePermission } from "../hooks/usePermission";

export const MobileDrawer = ({ isOpen, onClose, navGroups }) => {
  const { can } = usePermission();
  const location = useLocation();

  // Close drawer when navigating
  useEffect(() => {
    onClose();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent body scroll when open
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

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 lg:hidden flex flex-col bg-main rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out max-h-[88dvh] ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-border/80" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 shrink-0">
          <h2 className="text-base font-bold text-primary tracking-tight">
            All Sections
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav content — scrollable */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 pb-safe space-y-6">
          {navGroups.map((group, idx) => {
            const accessibleItems = group.items.filter(
              (item) => !item.permission || can(item.permission)
            );
            if (accessibleItems.length === 0) return null;

            const GroupIcon = group.icon;

            return (
              <div key={idx}>
                {/* Group header */}
                {group.title && !group.isFlat ? (
                  <div className="flex items-center gap-2.5 mb-3 px-0.5">
                    <div className="flex-1 h-px bg-border/60" />
                    <div className="flex items-center gap-1.5">
                      {GroupIcon && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-accent/10">
                          <GroupIcon className="h-3 w-3 text-accent" />
                        </div>
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest text-secondary">
                        {group.title}
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-border/60" />
                  </div>
                ) : null}

                {/* Items — flat (Main) section gets larger 2-col tiles */}
                {group.isFlat ? (
                  <div className="grid grid-cols-2 gap-2">
                    {accessibleItems.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = location.pathname.startsWith(item.path);
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-3 rounded-xl px-4 py-3.5 transition-colors duration-150 border ${
                            isActive
                              ? "bg-accent/10 text-accent border-accent/25 shadow-sm"
                              : "bg-surface text-secondary hover:bg-main hover:text-primary border-border/60"
                          }`}
                        >
                          <ItemIcon
                            className={`h-5 w-5 shrink-0 ${isActive ? "text-accent" : "text-secondary"}`}
                            strokeWidth={isActive ? 2.5 : 2}
                          />
                          <span className={`text-sm font-bold leading-tight ${isActive ? "text-accent" : "text-secondary"}`}>
                            {item.name}
                          </span>
                        </NavLink>
                      );
                    })}
                  </div>
                ) : (
                  /* Regular groups — 3-column icon tiles */
                  <div className="grid grid-cols-3 gap-2">
                    {accessibleItems.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = location.pathname.startsWith(item.path);
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-3 text-center transition-colors duration-150 min-h-[68px] border ${
                            isActive
                              ? "bg-accent/10 text-accent border-accent/20 shadow-sm"
                              : "bg-surface text-secondary hover:bg-main hover:text-primary border-border/50"
                          }`}
                        >
                          <ItemIcon
                            className={`h-5 w-5 shrink-0 ${isActive ? "text-accent" : "text-secondary"}`}
                            strokeWidth={isActive ? 2.5 : 2}
                          />
                          <span
                            className={`text-[10px] font-semibold leading-tight text-center line-clamp-2 ${
                              isActive ? "text-accent" : "text-secondary"
                            }`}
                          >
                            {item.name}
                          </span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Bottom safe area spacer */}
          <div className="h-6" />
        </nav>
      </div>
    </>,
    document.body
  );
};
