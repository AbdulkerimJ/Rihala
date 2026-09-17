import React from "react";

export const TimeRangeTabs = ({ timeRange, onTimeRangeChange }) => {
  const options = [
    { key: "this_month", label: "This Month" },
    { key: "this_year", label: "This Year" },
    { key: "all_time", label: "All Time" },
  ];

  return (
    <div className="inline-flex items-center p-0.5 sm:p-1 rounded-lg sm:rounded-xl bg-main border border-border shadow-xs shrink-0">
      {options.map((option) => {
        const isSelected = timeRange === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onTimeRangeChange(option.key)}
            className={`px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-sm font-semibold rounded-md sm:rounded-lg transition-all whitespace-nowrap ${
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
