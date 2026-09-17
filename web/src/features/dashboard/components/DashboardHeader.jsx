import { TimeRangeTabs } from "../../../components/ui/TimeRangeTabs";

export const DashboardHeader = ({ timeRange, onTimeRangeChange }) => {
  return (
    <div className="flex flex-row items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-primary leading-tight">
          Dashboard
        </h1>
        <p className="hidden sm:block text-sm text-secondary mt-0.5">
          Overview of your workshop performance and finances.
        </p>
      </div>

      <div className="shrink-0">
        <TimeRangeTabs timeRange={timeRange} onTimeRangeChange={onTimeRangeChange} />
      </div>
    </div>
  );
};
