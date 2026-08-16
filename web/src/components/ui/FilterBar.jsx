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
    <div className="flex flex-col lg:flex-row items-start lg:items-stretch gap-2 w-full">
      <div className="flex items-center gap-2 w-full lg:w-1/4 shrink-0">
        <div className="flex-1">
          <Input
            type="text"
            rightIcon={Search}
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
            className="lg:hidden shrink-0"
          >
            <Filter className="h-4 w-4" />
          </Button>
        )}
      </div>

      {children && (
        <div
          className={`grid gap-2 flex-1 w-full ${
            isExpanded ? "grid" : "hidden lg:grid"
          } grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}
        >
          {children}
          {onClear && (
            <div className="flex items-end justify-start">
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
