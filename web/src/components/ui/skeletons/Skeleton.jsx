import React from "react";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-slate-200 dark:bg-slate-800 ${className || ""}`}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/15" />
    </div>
  );
}
