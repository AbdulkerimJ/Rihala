import React from "react";

export const TimeRangeTabs = ({ timeRange, onTimeRangeChange }) => {
  const options = [
    { key: "this_month", label: "This Month" },
    { key: "this_year", label: "This Year" },
    { key: "all_time", label: "All Time" },
  ];

  return (
    <div className="inline-flex items-center p-1 rounded-xl bg-main border border-border shadow-xs shrink-0 w-full sm:w-auto overflow-x-auto">
      {options.map((option) => {
        const isSelected = timeRange === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onTimeRangeChange(option.key)}
            className={`flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
              isSelected
                ? "bg-surface text-primary shadow-xs"
                : "text-secondary hover:text-primary hover:bg-surface/50"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
