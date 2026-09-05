import { Skeleton } from "../../../components/ui/skeletons";

export const AssignRolesSkeleton = ({ count = 4 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </div>
  );
};
