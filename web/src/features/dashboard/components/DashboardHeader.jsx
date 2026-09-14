import { TimeRangeTabs } from "../../../components/ui/TimeRangeTabs";

export const DashboardHeader = ({ timeRange, onTimeRangeChange }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
          Dashboard
        </h1>
        <p className="text-sm text-secondary mt-0.5">
          Overview of your workshop performance and finances.
        </p>
      </div>

      <div className="self-start sm:self-auto w-full sm:w-auto">
        <TimeRangeTabs timeRange={timeRange} onTimeRangeChange={onTimeRangeChange} />
      </div>
    </div>
  );
};
