import React from "react";

export const LoadingBar = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="absolute top-0 left-0 w-full h-0.5 bg-accent/10 overflow-hidden z-10 rounded-t-xl">
      <div className="h-full bg-accent w-1/2 rounded-full animate-sweep"></div>
    </div>
  );
};
