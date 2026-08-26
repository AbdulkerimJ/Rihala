import React, { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";

export const FilterBar = ({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  children, // other filter inputs
  onClear,
  activeFilterCount = 0, // how many non-search filters are active
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Row 1: search + filter toggle button */}
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 relative">
          <Input
            type="text"
            rightIcon={Search}
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filter toggle — only on mobile when there are filter children */}
        {children && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              lg:hidden relative flex items-center justify-center h-10 w-10 rounded-lg border transition-colors shrink-0
              ${isExpanded
                ? "bg-accent text-white border-accent"
                : "bg-surface text-secondary border-border hover:text-primary hover:border-border/80"
              }
            `}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {/* Badge: active filter count */}
            {activeFilterCount > 0 && !isExpanded && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white text-[9px] font-bold ring-2 ring-surface">
                {activeFilterCount > 9 ? "9+" : activeFilterCount}
              </span>
            )}
          </button>
        )}

        {/* On desktop, also show clear button inline if active */}
        {onClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            leftIcon={X}
            className="hidden lg:inline-flex h-10"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Row 2: filter inputs — always visible on desktop, toggleable on mobile */}
      {children && (
        <div
          className={`grid gap-2 w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
            isExpanded ? "grid" : "hidden lg:grid"
          }`}
        >
          {children}
          {/* Clear on mobile inside the expanded panel */}
          {onClear && (
            <div className="flex items-center lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { onClear(); setIsExpanded(false); }}
                leftIcon={X}
                className="h-10 w-full"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
