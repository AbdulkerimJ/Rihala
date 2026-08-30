import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Clock, History, Calendar, Plus, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import {
  createAttendance,
  getAttendances,
  updateAttendance,
  deleteAttendance,
} from "../api";
import { getEmployees } from "../../employees/api";

import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { Select } from "../../../components/ui/Select";
import { Input } from "../../../components/ui/Input";
import { StatusBadge } from "../../../components/ui/StatusBadge";

import { RollCallHeader } from "../components/RollCallHeader";
import { RollCallSummaryStats } from "../components/RollCallSummaryStats";
import { RollCallCard } from "../components/RollCallCard";
import { AttendanceFormModal } from "../components/AttendanceFormModal";

import { cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";
import { isWorkday } from "../../../utils/validation";

export const AttendancesList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();

  // Mode: "today" (Roll-Call) | "history"
  const [viewMode, setViewMode] = useState("today");

  // Roll-Call Date logic
  const todayStr = new Date().toISOString().split("T")[0];
  const [rollCallDate, setRollCallDate] = useState(todayStr);
  const isValidRollCallDate = isWorkday(rollCallDate);

  // History Filter & Pagination State
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    employee: "",
    from: "",
    to: "",
  });
  const [isOpen, setIsOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingAttendance, setDeletingAttendance] = useState(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Fetch active employees
  const { data: employeesData } = useQuery({
    queryKey: ["employees", "list"],
    queryFn: () => getEmployees({ limit: 1000, status: "active" }),
    enabled: can("employees.read"),
  });
  const employees = unwrapListResponse(employeesData).items || [];

  // Fetch roll-call attendances for selected date
  const { data: rollCallAttendancesData, isLoading: isLoadingRollCall } = useQuery({
    queryKey: ["attendances", "rollcall", rollCallDate],
    queryFn: () =>
      getAttendances({ from: rollCallDate, to: rollCallDate, limit: 1000 }),
    enabled: can("attendances.read") && viewMode === "today",
  });
  const rollCallAttendances = unwrapListResponse(rollCallAttendancesData).items || [];

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
    enabled: can("attendances.read") && viewMode === "history",
  });
  const { items: historyAttendances, pagination } = unwrapListResponse(historyData);

  usePrefetchNextPage({
    queryKey: ["attendances"],
    queryFn: getAttendances,
    pagination,
    params: historyParams,
    page,
    enabled: viewMode === "history",
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createAttendance,
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success("Attendance record created successfully");
      setIsOpen(false);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to create attendance")),
  });

  const updateMutation = useMutation({
    mutationFn: updateAttendance,
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success("Attendance record updated successfully");
      setIsOpen(false);
    },
    onError: (err) =>
      toast.error(getApiErrorMessage(err, "Failed to update attendance")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success("Attendance record deleted successfully");
      setDeletingAttendance(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to delete attendance"));
    },
  });

  // Bulk "Mark All Present" Action
  const handleMarkAllPresent = async () => {
    if (!isValidRollCallDate) {
      toast.error("Cannot record attendance for Sundays.");
      return;
    }

    setIsMarkingAll(true);
    try {
      const promises = employees.map((emp) => {
        const existing = rollCallAttendances.find(
          (a) => a.employee?._id === emp._id || a.employee === emp._id
        );

        if (existing) {
          if (
            existing.morningStatus === "PRESENT" &&
            existing.afternoonStatus === "PRESENT"
          ) {
            return Promise.resolve();
          }
          return updateAttendance({
            id: existing._id,
            data: { morningStatus: "PRESENT", afternoonStatus: "PRESENT" },
          });
        }

        return createAttendance({
          employee: emp._id,
          workDate: new Date(rollCallDate).toISOString(),
          morningStatus: "PRESENT",
          afternoonStatus: "PRESENT",
        });
      });

      await Promise.all(promises);
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success("All active employees marked as Present!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to mark all present"));
    } finally {
      setIsMarkingAll(false);
    }
  };

  // History Table Columns
  const historyColumns = [
    {
      header: "Date",
      accessor: (row) => formatDate(row.workDate || row.date),
      className: "font-semibold text-primary",
    },
    {
      header: "Employee",
      accessor: (row) => row.employee?.name || "Unknown",
      className: "font-bold text-primary",
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
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditingRecord(row);
                setIsOpen(true);
              }}
            >
              Edit
            </Button>
          </Can>
          <Can permission="attendances.delete">
            <Button
              variant="danger-ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingAttendance(row);
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

  const hasActiveHistoryFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-6 lg:space-y-8 animate-[fadeSlideUp_0.3s_ease_both] pb-8">
      
      {/* ── Page Header ── */}
      <PageHeader
        title="Attendance"
        description="Daily employee roll-call and historical work logs."
        actions={
          <Can permission="attendances.create">
            <Button
              onClick={() => {
                setEditingRecord(null);
                setIsOpen(true);
              }}
              leftIcon={Plus}
              className="shadow-xs"
            >
              Manual Entry
            </Button>
          </Can>
        }
      />

      {/* ── Mode Switcher Tabs ── */}
      <div className="flex bg-main p-1 rounded-xl border border-border max-w-xs w-full">
        <button
          type="button"
          onClick={() => setViewMode("today")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-150 ${
            viewMode === "today"
              ? "bg-surface text-primary shadow-xs"
              : "text-secondary hover:text-primary"
          }`}
        >
          <Clock className="h-4 w-4" /> Roll-Call
        </button>
        <button
          type="button"
          onClick={() => setViewMode("history")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-150 ${
            viewMode === "history"
              ? "bg-surface text-primary shadow-xs"
              : "text-secondary hover:text-primary"
          }`}
        >
          <History className="h-4 w-4" /> History
        </button>
      </div>

      {/* ── ROLL-CALL MODE ── */}
      {viewMode === "today" && (
        <div className="space-y-5">
          {/* Header Controls */}
          <RollCallHeader
            rollCallDate={rollCallDate}
            onDateChange={setRollCallDate}
            isWorkdayValid={isValidRollCallDate}
            onMarkAllPresent={handleMarkAllPresent}
            isMarkingAll={isMarkingAll}
            hasEmployees={employees.length > 0}
          />

          {!isValidRollCallDate ? (
            /* Sunday / Rest Day State */
            <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-border bg-surface/50 shadow-xs space-y-3">
              <Calendar className="h-10 w-10 mx-auto text-secondary" />
              <h3 className="text-base font-bold text-primary">
                Sunday is a Workshop Rest Day
              </h3>
              <p className="text-xs sm:text-sm text-secondary max-w-md mx-auto">
                Attendance records are only maintained for workdays (Monday through Saturday).
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const prev = new Date(rollCallDate);
                  prev.setDate(prev.getDate() - 1);
                  setRollCallDate(prev.toISOString().split("T")[0]);
                }}
              >
                View Saturday Attendance
              </Button>
            </div>
          ) : (
            <>
              {/* Daily Summary Pulse */}
              <RollCallSummaryStats
                employees={employees}
                todayAttendances={rollCallAttendances}
              />

              {/* Employee Roll-Call Grid */}
              {isLoadingRollCall ? (
                <div className="flex flex-col items-center justify-center p-12 gap-2 text-secondary">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  <span className="text-xs font-medium">Loading active staff...</span>
                </div>
              ) : employees.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  {employees.map((employee) => {
                    const record = rollCallAttendances.find(
                      (a) =>
                        a.employee?._id === employee._id ||
                        a.employee === employee._id
                    );
                    return (
                      <RollCallCard
                        key={employee._id}
                        employee={employee}
                        existingRecord={record}
                        workDate={rollCallDate}
                        isWorkdayValid={isValidRollCallDate}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No Active Employees"
                  description="You need active employees registered to take daily attendance."
                />
              )}
            </>
          )}
        </div>
      )}

      {/* ── HISTORY MODE ── */}
      {viewMode === "history" && (
        <div className="space-y-5">
          {isHistoryError ? (
            <ErrorState
              description={getApiErrorMessage(
                historyError,
                "Failed to load attendance records."
              )}
            />
          ) : (
            <>
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
                        setFilters({
                          search: "",
                          employee: "",
                          from: "",
                          to: "",
                        });
                        setPage(1);
                      }
                    : undefined
                }
                activeFilterCount={
                  [filters.employee, filters.from, filters.to].filter(Boolean)
                    .length
                }
              >
                <Select
                  value={filters.employee}
                  onChange={(e) => {
                    setFilters((p) => ({ ...p, employee: e.target.value }));
                    setPage(1);
                  }}
                  options={[
                    { value: "", label: "All Employees" },
                    ...employees.map((e) => ({ value: e._id, label: e.name })),
                  ]}
                />
                <Input
                  type="date"
                  value={filters.from}
                  onChange={(e) => {
                    setFilters((p) => ({ ...p, from: e.target.value }));
                    setPage(1);
                  }}
                />
                <Input
                  type="date"
                  value={filters.to}
                  onChange={(e) => {
                    setFilters((p) => ({ ...p, to: e.target.value }));
                    setPage(1);
                  }}
                />
              </FilterBar>

              <DataTable
                columns={historyColumns}
                data={historyAttendances}
                keyExtractor={(row) => row._id}
                pagination={{ ...pagination, page }}
                onPageChange={setPage}
                isLoading={isLoadingHistory}
                isFetching={isHistoryFetching}
                emptyState={
                  <EmptyState
                    title="No records found"
                    description="Record employee attendance using the Roll-Call view or Manual Entry."
                    actionLabel={
                      can("attendances.create") ? "Manual Entry" : null
                    }
                    onAction={
                      can("attendances.create")
                        ? () => {
                            setEditingRecord(null);
                            setIsOpen(true);
                          }
                        : undefined
                    }
                  />
                }
              />
            </>
          )}
        </div>
      )}

      {/* ── Manual Entry / Edit Modal ── */}
      <AttendanceFormModal
        isOpen={isOpen}
        initialData={editingRecord}
        onClose={() => setIsOpen(false)}
        onSubmit={async (data) => {
          if (editingRecord) {
            return updateMutation.mutateAsync({
              id: editingRecord._id,
              data: {
                morningStatus: data.morningStatus,
                afternoonStatus: data.afternoonStatus,
              },
            });
          }
          return createMutation.mutateAsync(data);
        }}
      />

      {/* ── Delete Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={!!deletingAttendance}
        title="Delete Attendance Record"
        description="Are you sure you want to delete this attendance record? This action cannot be undone."
        onConfirm={() => deleteMutation.mutate(deletingAttendance._id)}
        onCancel={() => setDeletingAttendance(null)}
        isSubmitting={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};
