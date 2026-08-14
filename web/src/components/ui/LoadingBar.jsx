import React from "react";

export const LoadingBar = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="absolute top-0 left-0 w-full h-1 bg-accent/20 overflow-hidden z-10 rounded-t-xl">
      <div className="h-full bg-accent animate-pulse w-full"></div>
    </div>
  );
};
