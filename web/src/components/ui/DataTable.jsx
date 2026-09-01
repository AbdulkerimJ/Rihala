import React from "react";
import { TableSkeleton } from "./skeletons";
import { LoadingBar } from "./LoadingBar";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const DataTable = ({
  columns,
  data,
  keyExtractor,
  onRowClick,
  pagination,
  onPageChange,
  emptyState,
  isLoading,
  isFetching,
  mobileStyle = "card",
}) => {
  if (isLoading) {
    return (
      <div className="w-full">
        <TableSkeleton columns={columns.length} rows={pagination?.limit || 5} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return emptyState || (
      <div className="p-8 text-center text-secondary">
        No data available.
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <LoadingBar isLoading={isFetching && !isLoading} />

      {/* ── Table View (Responsive) ── */}
      <div className="w-full overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-main/50">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`px-5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-secondary ${
                    col.headerClassName || ""
                  }`}
                >
                  {col.header}
                </th>
              ))}
              {onRowClick && (
                <th className="px-5 py-2.5 w-10"></th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick && onRowClick(row)}
                className={`group transition-all duration-200 ${
                  onRowClick ? "cursor-pointer hover:bg-accent/5 hover:shadow-[inset_4px_0_0_0_var(--color-accent)]" : ""
                }`}
              >
                {columns.map((col, colIndex) => {
                  const content =
                    typeof col.accessor === "function"
                      ? col.accessor(row)
                      : row[col.accessor];
                  return (
                    <td
                      key={colIndex}
                      className={`px-5 py-0.5 text-sm ${
                        col.className || "text-primary"
                      }`}
                    >
                      {content}
                    </td>
                  );
                })}
                {onRowClick && (
                  <td className="px-5 py-0.5 text-right w-10">
                    <ChevronRight className="h-4 w-4 text-secondary/30 group-hover:text-accent group-hover:translate-x-1 transition-all inline-block" />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {pagination && (
        <div className="mt-4 flex items-center justify-between text-sm text-secondary px-1">
          <span className="text-xs text-secondary">
            Page <span className="font-bold text-primary">{pagination.page}</span> of{" "}
            <span className="font-bold text-primary">{pagination.totalPages || 1}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-secondary hover:text-primary hover:bg-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() =>
                onPageChange(
                  pagination.totalPages
                    ? Math.min(pagination.totalPages, pagination.page + 1)
                    : pagination.page + 1,
                )
              }
              disabled={
                pagination.totalPages ? pagination.page >= pagination.totalPages : false
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-secondary hover:text-primary hover:bg-main disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
