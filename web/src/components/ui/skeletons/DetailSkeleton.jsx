import { Skeleton } from "./Skeleton";
import { Card, CardContent } from "../Card";
export const DetailSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header section skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main detail area */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-6 w-1/3 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-5 w-3/4" />
                 </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-5 w-1/2" />
                 </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-5 w-2/3" />
                 </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-5 w-1/3" />
                 </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
             <CardContent className="pt-6 space-y-4">
               <Skeleton className="h-6 w-1/4 mb-4" />
               <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
               </div>
             </CardContent>
          </Card>
        </div>

        {/* Sidebar area */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-6 w-1/2 mb-4" />
              <div className="space-y-3">
                 <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                 </div>
                 <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                 </div>
                 <div className="pt-2 border-t border-border flex justify-between">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-5 w-1/3" />
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
