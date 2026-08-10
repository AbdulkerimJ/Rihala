import React from "react";
import { Skeleton } from "./Skeleton";

export const InlineSkeleton = ({ className, width = "w-16" }) => {
  return (
    <Skeleton className={`h-4 inline-block align-middle rounded ${width} ${className || ""}`} />
  );
};
