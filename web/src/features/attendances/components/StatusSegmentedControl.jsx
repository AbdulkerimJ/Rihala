import { ATTENDANCE_STATUSES } from "../constants";

export const StatusSegmentedControl = ({
  value,
  onChange,
  label,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col gap-1 w-full min-w-0">
      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
        {label}
      </span>
      <div className="flex bg-main rounded-lg p-1 border border-border/60 gap-0.5">
        {ATTENDANCE_STATUSES.map((status) => {
          const isSelected = value === status.value;
          return (
            <button
              key={status.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(status.value)}
              className={`
                flex-1 flex justify-center items-center py-1 sm:py-1.5 px-1 rounded-md text-[10px] sm:text-[11px] font-bold transition-all duration-150 truncate
                ${
                  isSelected
                    ? `${status.color} shadow-xs font-black`
                    : "text-secondary hover:text-primary hover:bg-surface disabled:opacity-50"
                }
              `}
            >
              {status.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
