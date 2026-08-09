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
        className={`w-full pl-10 pr-4 py-2 text-xs bg-main/60 border border-border/80 rounded-md text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent hover:border-accent/40 transition-all`}
        {...props}
      />
    </div>
  );
};
