import React from "react";
import { ChevronLeft, ChevronRight, CheckCheck, Calendar, RotateCcw } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Can } from "../../../components/Can";

export const RollCallHeader = ({
  rollCallDate,
  onDateChange,
  isWorkdayValid,
  onMarkAllPresent,
  isMarkingAll,
  hasEmployees,
}) => {
  const todayStr = new Date().toISOString().split("T")[0];

  const handleStepDate = (days) => {
    const current = new Date(rollCallDate);
    current.setDate(current.getDate() + days);
    
    // If stepped onto Sunday (day 0), step one more day
    if (current.getDay() === 0) {
      current.setDate(current.getDate() + (days > 0 ? 1 : -1));
    }
    
    onDateChange(current.toISOString().split("T")[0]);
  };

  const formattedDateString = new Date(rollCallDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-surface border border-border/80 shadow-xs">
      
      {/* Left: Title & Selected Day info */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-primary">
            Daily Roll-Call
          </h2>
          {rollCallDate === todayStr && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
              Today
            </span>
          )}
        </div>
        <p className="text-xs text-secondary font-medium">
          {formattedDateString}
        </p>
      </div>

      {/* Right: Date Picker & Actions */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        
        {/* Date Stepper & Picker */}
        <div className="flex items-center rounded-lg border border-border bg-main/60 p-0.5">
          <button
            type="button"
            onClick={() => handleStepDate(-1)}
            title="Previous Day"
            className="p-1.5 text-secondary hover:text-primary rounded-md hover:bg-surface transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <Input
            type="date"
            value={rollCallDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="h-8 border-0 bg-transparent text-xs font-semibold focus:ring-0 px-2"
          />

          <button
            type="button"
            onClick={() => handleStepDate(1)}
            title="Next Day"
            className="p-1.5 text-secondary hover:text-primary rounded-md hover:bg-surface transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {rollCallDate !== todayStr && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onDateChange(todayStr)}
            leftIcon={RotateCcw}
            className="text-xs h-9"
          >
            Today
          </Button>
        )}

        {/* Mark All Present Bulk Action */}
        <Can permission="attendances.create">
          <Button
            size="sm"
            variant="primary"
            onClick={onMarkAllPresent}
            isLoading={isMarkingAll}
            disabled={!isWorkdayValid || !hasEmployees || isMarkingAll}
            leftIcon={CheckCheck}
            className="text-xs h-9 shadow-xs"
          >
            Mark All Present
          </Button>
        </Can>
      </div>
    </div>
  );
};
