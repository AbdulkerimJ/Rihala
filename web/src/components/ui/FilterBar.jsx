import React, { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";

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
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            leftIcon={Search}
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
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                leftIcon={X}
                className="h-[38px]"
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
