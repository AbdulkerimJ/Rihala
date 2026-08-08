import React from "react";
import { Search } from "lucide-react";

export const SearchInput = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  shortcut = null,
  ...props
}) => {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search className="absolute left-3 h-4 w-4 text-secondary pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full pl-9 ${shortcut ? "pr-10" : "pr-3"} py-1.5 text-xs bg-main/60 border border-border/80 rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent hover:border-accent/40 transition-all shadow-inner`}
        {...props}
      />
      {shortcut && (
        <kbd className="absolute right-2.5 hidden sm:inline-flex items-center gap-0.5 rounded border border-border/80 bg-surface px-1.5 py-0.5 text-[10px] font-medium text-secondary shadow-xs pointer-events-none">
          {shortcut}
        </kbd>
      )}
    </div>
  );
};
