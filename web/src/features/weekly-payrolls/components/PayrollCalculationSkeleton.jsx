import { Skeleton } from "../../../components/ui/skeletons";

export const PayrollCalculationSkeleton = () => {
  return (
    <div className="space-y-4 pt-4 border-t border-border/50">
      <Skeleton className="h-5 w-40" />
      <div className="bg-main/50 rounded-lg p-4 space-y-3 border border-border/50">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-4" />
      </div>
    </div>
  );
};
