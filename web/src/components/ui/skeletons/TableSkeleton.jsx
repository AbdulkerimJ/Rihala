import React from "react";
import { Skeleton } from "./Skeleton";

export const TableSkeleton = ({ columns = 4, rows = 5 }) => {
  const rowArray = Array.from({ length: rows }, (_, i) => i);
  const colArray = Array.from({ length: columns }, (_, i) => i);

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-hidden rounded-xl border border-border bg-surface shadow-sm w-full">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-main/50">
            <tr>
              {colArray.map((_, colIndex) => (
                <th
                  key={colIndex}
                  className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider"
                >
                  <Skeleton className="h-4 w-24 rounded-full" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {rowArray.map((_, rowIndex) => (
              <tr key={rowIndex} className="transition-colors hover:bg-main/50">
                {colArray.map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 text-sm">
                    {/* Make the last column (actions usually) smaller and right aligned if needed, but a standard line works too */}
                    {colIndex === columns - 1 ? (
                      <div className="flex justify-end">
                        <Skeleton className="h-8 w-16" />
                      </div>
                    ) : (
                      <Skeleton className={`h-4 ${colIndex === 0 ? "w-3/4" : "w-1/2"}`} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 lg:hidden w-full">
        {rowArray.map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <div className="space-y-3">
              {colArray.map((_, colIndex) => {
                if (colIndex === columns - 1) {
                  return (
                    <div key={colIndex} className="pt-2 border-t border-border mt-2 flex justify-end">
                      <Skeleton className="h-8 w-20" />
                    </div>
                  );
                }
                return (
                  <div key={colIndex} className="flex justify-between items-center gap-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className={`h-4 ${colIndex === 0 ? "w-32" : "w-24"}`} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
