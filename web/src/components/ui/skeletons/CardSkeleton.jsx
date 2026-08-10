import React from "react";
import { Skeleton } from "./Skeleton";
import { Card, CardHeader, CardContent } from "../Card";

export const CardSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-12" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
           <Skeleton className="h-4 w-1/4" />
           <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="flex justify-between items-center">
           <Skeleton className="h-4 w-1/2" />
           <Skeleton className="h-4 w-1/6" />
        </div>
        <div className="pt-2">
           <Skeleton className="h-8 w-full rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
};
