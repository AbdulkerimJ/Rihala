import React, { useState } from "react";
import { TableSkeleton } from "./skeletons";
import { LoadingBar } from "./LoadingBar";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { ListGroup, ListItem, ListGroupSkeleton } from "./ListGroup";
import { Modal } from "./Modal";
import { MobileActionPopup } from "./MobileActionPopup";
import { usePermission } from "../../hooks/usePermission";

const getVisibleActionsCount = (actionsNode, can) => {
  if (!actionsNode) return 0;
  let count = 0;
  React.Children.forEach(actionsNode.props?.children || actionsNode, (child) => {
    if (!child) return;
    if (child.props && 'permission' in child.props) {
      if (can(child.props.permission)) count++;
    } else if (child.type === React.Fragment) {
      count += getVisibleActionsCount(child, can);
    } else {
      count++;
    }
  });
  return count;
};

const getResponsiveClasses = (className) => {
  if (!className) return "";
  return className
    .split(" ")
    .filter((c) => c === "hidden" || c.includes("table-cell") || c.includes("block"))
    .join(" ");
};

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
  mobileRow,
}) => {
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const { can } = usePermission();

  if (isLoading) {
    return (
      <div className="w-full">
        {mobileRow ? (
          <>
            <div className="block md:hidden">
              <ListGroupSkeleton count={pagination?.limit || 5} />
            </div>
            <div className="hidden md:block">
              <TableSkeleton columns={columns.length} rows={pagination?.limit || 5} />
            </div>
          </>
        ) : (
          <TableSkeleton columns={columns.length} rows={pagination?.limit || 5} />
        )}
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

      {/* ── Mobile View (ListGroup) ── */}
      {mobileRow && (
        <div className="block md:hidden mb-4">
          <ListGroup>
            {data.map((row) => {
              const mobile = mobileRow(row);
              const rowId = keyExtractor(row);
              const visibleCount = getVisibleActionsCount(mobile.actions, can);
              const isDropdownOpen = openDropdownId === rowId;

              return (
                <div key={rowId} className="flex flex-col bg-surface relative">
                  <ListItem
                    to={mobile.to}
                    onClick={mobile.onClick || (mobile.to ? undefined : (onRowClick ? () => onRowClick(row) : undefined))}
                    title={mobile.title}
                    subtitle={mobile.subtitle}
                    right={
                      (mobile.right || (mobile.actions && visibleCount > 0)) ? (
                        <div className="flex items-center gap-2 shrink-0">
                          {mobile.right}
                          
                          {mobile.actions && visibleCount === 1 && (
                            <div className="flex items-center gap-1 scale-90 origin-right">
                              {mobile.actions}
                            </div>
                          )}

                          {mobile.actions && visibleCount > 1 && (
                            <div className="relative flex items-center shrink-0">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOpenDropdownId(isDropdownOpen ? null : rowId);
                                }}
                                className="p-1.5 -mr-1.5 text-secondary hover:text-primary transition-colors rounded-md active:bg-main"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              
                              {isDropdownOpen && (
                                <MobileActionPopup 
                                  actions={mobile.actions} 
                                  onClose={() => setOpenDropdownId(null)} 
                                />
                              )}
                            </div>
                          )}
                        </div>
                      ) : null
                    }
                    showChevron={Boolean(mobile.to || mobile.onClick || onRowClick)}
                    size="sm"
                  />
                </div>
              );
            })}
          </ListGroup>
        </div>
      )}

      {/* ── Table View (Responsive) ── */}
      <div className={`w-full overflow-x-auto rounded-xl border border-border bg-surface shadow-sm ${mobileRow ? "hidden md:block" : ""}`}>
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-main/50">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-secondary ${
                    col.isActions ? "text-right" : "text-left"
                  } ${getResponsiveClasses(col.className)} ${col.headerClassName || ""}`}
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
        <div className="mt-4 flex items-center justify-end gap-4 text-sm text-secondary px-1">
          <span className="text-xs text-secondary">
            Page <span className="font-bold text-primary">{pagination.page}</span> of{" "}
            <span className="font-bold text-primary">{pagination.totalPages || 1}</span>
            {pagination.total !== undefined && (
              <span className="ml-1 text-muted">({pagination.total} total items)</span>
            )}
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

