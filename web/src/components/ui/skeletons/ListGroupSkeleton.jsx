import { Skeleton } from "./Skeleton";

/**
 * ListGroupSkeleton - Loading skeleton placeholder for list groups
 */
export const ListGroupSkeleton = ({ count = 3, className = "" }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="px-3 py-2.5 rounded-xl border border-border bg-surface shadow-xs space-y-1.5"
        >
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-2.5 w-1/3" />
        </div>
      ))}
    </div>
  );
};
