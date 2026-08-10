import React from "react";
import { Button } from "./Button";
import { TableSkeleton } from "./skeletons";
import { Loader2 } from "lucide-react";

export const DataTable = ({
  columns,
  data,
  keyExtractor,
  onRowClick,
  mobileRenderer,
  pagination,
  onPageChange,
  emptyState,
  isLoading,
  isFetching,
}) => {
  if (isLoading) {
    return (
      <div className="w-full">
        {/* We can import TableSkeleton directly or build it. Wait, I should import it at the top! */}
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
      {isFetching && !isLoading && (
        <div className="absolute top-0 left-0 w-full h-1 bg-brand/20 overflow-hidden z-10 rounded-t-xl">
          <div className="h-full bg-brand animate-pulse w-full"></div>
        </div>
      )}

      {/* Desktop Table View (hidden on small screens) */}
      <div className="hidden lg:block overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-main/50">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-secondary ${
                    col.headerClassName || ""
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors hover:bg-main/50 ${
                  onRowClick ? "cursor-pointer" : ""
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
                      className={`px-6 py-4 text-sm ${
                        col.className || "text-primary"
                      }`}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (hidden on large screens) */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {data.map((row) => (
          <div
            key={keyExtractor(row)}
            onClick={() => onRowClick && onRowClick(row)}
            className={`rounded-xl border border-border bg-surface p-4 shadow-sm transition-colors hover:bg-main/50 ${
              onRowClick ? "cursor-pointer" : ""
            }`}
          >
            {mobileRenderer ? (
              mobileRenderer(row)
            ) : (
              <div className="space-y-3">
                {columns.map((col, index) => {
                  if (col.hiddenOnMobile) return null;
                  const content =
                    typeof col.accessor === "function"
                      ? col.accessor(row)
                      : row[col.accessor];
                  
                  // If it's an actions column, render it differently
                  if (col.header === "Actions" || col.isActions) {
                    return (
                      <div key={index} className="pt-2 border-t border-border mt-2 flex justify-end">
                        {content}
                      </div>
                    );
                  }

                  return (
                    <div key={index} className="flex justify-between items-center gap-2">
                      <span className="text-xs font-medium text-secondary">{col.header}</span>
                      <div className="text-sm text-primary text-right">{content}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="mt-4 flex items-center justify-between text-sm text-secondary px-2">
          <div>
            Page {pagination.page} of {pagination.totalPages || 1}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
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
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
