import { Skeleton } from "../../../components/ui/skeletons";

export const PermissionsSelectorSkeleton = ({ count = 4 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
};
