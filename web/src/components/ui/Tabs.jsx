import React from "react";

/**
 * A modern, reusable Tabs component.
 */
export const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  variant = "underline",
  fullWidth = false,
  className = "",
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "pills":
        return "flex space-x-1 p-1 bg-surface border border-border/50 rounded-xl overflow-x-auto hide-scrollbar";
      case "segmented":
        return "flex p-1 bg-surface-hover/50 rounded-lg w-full overflow-x-auto hide-scrollbar";
      case "underline":
      default:
        return "flex space-x-6 border-b border-border/50 overflow-x-auto hide-scrollbar";
    }
  };

  const getTabStyles = (isActive, isDisabled) => {
    const base = "relative flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-200 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0";
    
    if (isDisabled) {
      return `${base} opacity-50 cursor-not-allowed`;
    }

    switch (variant) {
      case "pills":
        return `${base} px-4 py-2 rounded-lg text-sm font-medium ${
          isActive
            ? "bg-main text-primary shadow-sm ring-1 ring-border/50"
            : "text-secondary hover:text-primary hover:bg-main/50"
        }`;
      case "segmented":
        return `${base} flex-1 px-3 py-1.5 rounded-md text-sm font-medium ${
          isActive
            ? "bg-main text-primary shadow-sm"
            : "text-secondary hover:text-primary"
        }`;
      case "underline":
      default:
        return `${base} pb-3 text-sm font-medium border-b-2 ${
          isActive
            ? "border-accent text-accent"
            : "border-transparent text-secondary hover:text-primary hover:border-border"
        }`;
    }
  };

  return (
    <div className={`${getVariantStyles()} ${className} ${fullWidth ? "w-full" : ""}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange?.(tab.id)}
            className={`${getTabStyles(isActive, tab.disabled)} ${fullWidth && variant !== "segmented" ? "flex-1" : ""}`}
          >
            {Icon && (
              <Icon 
                className={`h-4 w-4 transition-colors ${isActive ? "text-accent" : "text-secondary"}`} 
              />
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span 
                className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full ${
                  isActive 
                    ? "bg-accent/10 text-accent" 
                    : "bg-surface-hover text-secondary border border-border"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
