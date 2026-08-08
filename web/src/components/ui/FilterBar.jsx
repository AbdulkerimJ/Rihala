import React, { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Button } from "./Button";

export const FilterBar = ({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  children, // other filter inputs
  onClear,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-3 w-full">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-secondary" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border border-border bg-main py-2 pl-9 pr-3 text-sm text-primary placeholder-secondary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        {children && (
          <Button
            variant={isExpanded ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden"
          >
            <Filter className="h-4 w-4" />
          </Button>
        )}
      </div>

      {children && (
        <div
          className={`grid gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm transition-all duration-200 ${
            isExpanded ? "block" : "hidden lg:grid"
          } sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5`}
        >
          {children}
          {onClear && (
            <div className="flex items-end justify-start sm:col-span-2 lg:col-span-1">
              <Button variant="ghost" size="sm" onClick={onClear} className="h-[38px]">
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
