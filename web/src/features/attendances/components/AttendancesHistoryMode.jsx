import React, { useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { X, Edit } from "lucide-react";

import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { getAttendances } from "../api";

import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import { FilterBar } from "../../../components/ui/FilterBar";
import { DataTable } from "../../../components/ui/DataTable";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";

import { cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";

export const AttendancesHistoryMode = ({ onEdit, onDelete }) => {
  const { can } = usePermission();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    employee: "",
    from: "",
    to: "",
  });

  const hasActiveHistoryFilters = Object.values(filters).some(Boolean);

  // Fetch history attendances
  const historyParams = useMemo(
    () => cleanFilterParams(filters, { page, limit: 20 }),
    [filters, page]
  );
  
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    isError: isHistoryError,
    error: historyError,
    isFetching: isHistoryFetching,
  } = useQuery({
    queryKey: ["attendances", historyParams],
    queryFn: () => getAttendances(historyParams),
    placeholderData: keepPreviousData,
    enabled: can("attendances.read"),
  });
  
  const { items: historyAttendances, pagination } = unwrapListResponse(historyData);

  usePrefetchNextPage({
    queryKey: ["attendances"],
    queryFn: getAttendances,
    pagination,
    params: historyParams,
    page,
  });

  const historyColumns = [
    {
      header: "Date",
      accessor: (row) => formatDate(row.workDate || row.date),
      className: "font-semibold text-primary",
    },
    {
      header: "Employee",
      accessor: (row) => row.employee?.name || "Unknown",
      className: "text-primary",
    },
    {
      header: "Morning",
      accessor: (row) => <StatusBadge status={row.morningStatus} />,
    },
    {
      header: "Afternoon",
      accessor: (row) => <StatusBadge status={row.afternoonStatus} />,
    },
    {
      header: "Actions",
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end gap-1.5">
          <Can permission="attendances.update">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row);
              }}
            >
              <span className="sr-only">Edit</span>
              <Edit className="h-4 w-4 text-primary" />
            </Button>
          </Can>
          <Can permission="attendances.delete">
            <Button
              variant="danger-ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row);
              }}
            >
              <span className="sr-only">Delete</span>
              <X className="h-4 w-4 text-danger" />
            </Button>
          </Can>
        </div>
      ),
    },
  ];

  if (isHistoryError) {
    return (
      <ErrorState
        description={getApiErrorMessage(
          historyError,
          "Failed to load attendance records."
        )}
      />
    );
  }

  return (
    <div className="space-y-5">
      <FilterBar
        searchPlaceholder="Search notes..."
        searchValue={filters.search}
        onSearchChange={(val) => {
          setFilters((p) => ({ ...p, search: val }));
          setPage(1);
        }}
        onClear={
          hasActiveHistoryFilters
            ? () => {
                setFilters({ search: "", employee: "", from: "", to: "" });
                setPage(1);
              }
            : undefined
        }
      />

      <DataTable
        data={historyAttendances}
        columns={historyColumns}
        isLoading={isLoadingHistory}
        isFetching={isHistoryFetching}
        keyExtractor={(row) => row._id}
        mobileRow={(row) => ({
          title: row.employee?.name || "Unknown",
          subtitle: formatDate(row.workDate || row.date),
          right: (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-secondary">AM:</span> <StatusBadge status={row.morningStatus} className="scale-90 origin-right" />
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-secondary">PM:</span> <StatusBadge status={row.afternoonStatus} className="scale-90 origin-right" />
              </div>
            </div>
          ),
          actions: (
            <>
              <Can permission="attendances.update">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={Edit}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(row);
                  }}
                >
                  Edit
                </Button>
              </Can>
              <Can permission="attendances.delete">
                <Button
                  variant="danger-ghost"
                  size="sm"
                  leftIcon={Trash2}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(row);
                  }}
                >
                  Delete
                </Button>
              </Can>
            </>
          )
        })}
        emptyState={
          <EmptyState
            title="No Attendance History"
            description={
              hasActiveHistoryFilters
                ? "No records found matching your filters. Try adjusting them."
                : "No attendance records have been created yet."
            }
          />
        }
        pagination={{
          page: pagination?.page || 1,
          totalPages: pagination?.totalPages || 1,
        }}
        onPageChange={setPage}
      />
    </div>
  );
};
