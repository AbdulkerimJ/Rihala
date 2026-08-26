import React, { useMemo, useState } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createAttendance, getAttendances, updateAttendance, deleteAttendance } from "../api";
import { getEmployees } from "../../employees/api";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";

import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { FormRootError } from "../../../components/ui/FormRootError";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { applyServerErrors, cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";
import { isWorkday } from "../../../utils/validation";
import { Loader2, Check, Clock, User, X } from "lucide-react";

// --- Types & Constants ---

const ATTENDANCE_STATUSES = [
  { value: "PRESENT", label: "Present", color: "bg-success text-white", border: "border-success", text: "text-success" },
  { value: "ABSENT", label: "Absent", color: "bg-danger text-white", border: "border-danger", text: "text-danger" },
  { value: "PERMISSION", label: "Excused", color: "bg-warning text-white", border: "border-warning", text: "text-warning" },
];

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

const attendanceSchema = z.object({
  employee: z.string().min(1, "Employee is required"),
  workDate: z
    .string()
    .min(1, "Work date is required")
    .refine((date) => isWorkday(date), {
      message: "Attendance can only be recorded for Monday through Saturday",
    }),
  morningStatus: z.enum(["PRESENT", "ABSENT", "PERMISSION"], {
    errorMap: () => ({ message: "Morning status is required" }),
  }),
  afternoonStatus: z.enum(["PRESENT", "ABSENT", "PERMISSION"], {
    errorMap: () => ({ message: "Afternoon status is required" }),
  }),
});

// --- Components ---

// Manual Form (for History mode)
const AttendanceForm = ({ initialData, onSubmit, onClose }) => {
  const { can } = usePermission();
  const { data: employeesData } = useQuery({ 
    queryKey: ["employees", "list"], 
    queryFn: () => getEmployees({ limit: 1000, status: "active" }),
    enabled: can("employees.read")
  });
  const employees = unwrapListResponse(employeesData).items || [];
  
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(attendanceSchema),
    defaultValues: initialData ? {
      employee: initialData.employee?._id || initialData.employee,
      workDate: initialData.workDate ? new Date(initialData.workDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      morningStatus: initialData.morningStatus || "PRESENT",
      afternoonStatus: initialData.afternoonStatus || "PRESENT",
    } : {
      employee: "",
      workDate: new Date().toISOString().split("T")[0],
      morningStatus: "PRESENT",
      afternoonStatus: "PRESENT",
    },
  });

  const handleFormSubmit = async (data) => {
    try {
      const payload = initialData ? {
        morningStatus: data.morningStatus,
        afternoonStatus: data.afternoonStatus,
      } : {
        employee: data.employee,
        workDate: new Date(data.workDate).toISOString(),
        morningStatus: data.morningStatus,
        afternoonStatus: data.afternoonStatus,
      };
      await onSubmit(payload);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <form className="space-y-5 p-5 sm:p-6" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />
      <FormField label="Employee" required error={errors.employee?.message}>
        <Select
          {...register("employee")}
          placeholder="Select an employee"
          options={employees.map(e => ({ value: e._id, label: e.name }))}
          error={errors.employee?.message}
          disabled={!!initialData}
        />
      </FormField>

      <FormField label="Work Date" required error={errors.workDate?.message}>
        <Input type="date" {...register("workDate")} error={errors.workDate?.message} disabled={!!initialData} />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FormField label="Morning Status" required error={errors.morningStatus?.message}>
          <Select
            {...register("morningStatus")}
            options={ATTENDANCE_STATUSES.map(s => ({ value: s.value, label: s.label }))}
            error={errors.morningStatus?.message}
          />
        </FormField>

        <FormField label="Afternoon Status" required error={errors.afternoonStatus?.message}>
          <Select
            {...register("afternoonStatus")}
            options={ATTENDANCE_STATUSES.map(s => ({ value: s.value, label: s.label }))}
            error={errors.afternoonStatus?.message}
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-3 pt-5 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting}>Save Record</Button>
      </div>
    </form>
  );
};

// Segmented Pill Control for Morning/Afternoon
const StatusSegmentedControl = ({ value, onChange, label, disabled }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">{label}</span>
      <div className="flex bg-main rounded-lg p-1 border border-border/60">
        {ATTENDANCE_STATUSES.map((status) => {
          const isSelected = value === status.value;
          return (
            <button
              key={status.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(status.value)}
              className={`
                flex-1 flex justify-center items-center py-1.5 rounded-md text-[11px] font-bold transition-all duration-200
                ${isSelected 
                  ? `${status.color} shadow-sm` 
                  : "text-secondary hover:text-primary hover:bg-surface disabled:opacity-50"
                }
              `}
            >
              {status.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Roll-call Card for an Employee
const RollCallCard = ({ employee, existingRecord, workDate, isWorkdayValid }) => {
  const queryClient = useQueryClient();
  
  // Local state for optimistic UI before saving
  const [morning, setMorning] = useState(existingRecord?.morningStatus || "PRESENT");
  const [afternoon, setAfternoon] = useState(existingRecord?.afternoonStatus || "PRESENT");
  
  const hasChanged = !existingRecord || morning !== existingRecord.morningStatus || afternoon !== existingRecord.afternoonStatus;

  const createMutation = useMutation({
    mutationFn: createAttendance,
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success(`Recorded attendance for ${employee.name}`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to record attendance"))
  });

  const updateMutation = useMutation({
    mutationFn: updateAttendance,
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success(`Updated attendance for ${employee.name}`);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to update attendance"))
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    if (!isWorkdayValid) {
      toast.error("Cannot record attendance for Sundays.");
      return;
    }
    
    if (existingRecord) {
      updateMutation.mutate({
        id: existingRecord._id,
        data: { morningStatus: morning, afternoonStatus: afternoon }
      });
    } else {
      createMutation.mutate({
        employee: employee._id,
        workDate: new Date(workDate).toISOString(),
        morningStatus: morning,
        afternoonStatus: afternoon
      });
    }
  };

  return (
    <div className={`p-4 sm:p-5 rounded-xl border bg-surface shadow-sm transition-all duration-300 ${existingRecord ? "border-success/30" : "border-border"}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-brand to-brand/60 text-white font-bold text-sm shadow-sm shrink-0">
            {getInitials(employee.name)}
          </div>
          <div>
            <h4 className="font-bold text-primary leading-tight">{employee.name}</h4>
            <span className="text-xs text-secondary mt-0.5 inline-block">{employee.phone || "No phone"}</span>
          </div>
        </div>
        {existingRecord && !hasChanged && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded-full border border-success/20">
            <Check className="h-3 w-3" /> SAVED
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatusSegmentedControl 
          label="Morning" 
          value={morning} 
          onChange={setMorning} 
          disabled={isPending}
        />
        <StatusSegmentedControl 
          label="Afternoon" 
          value={afternoon} 
          onChange={setAfternoon} 
          disabled={isPending}
        />
      </div>

      <div className="flex justify-end border-t border-border/50 pt-3">
        <Button 
          size="sm" 
          variant={existingRecord && !hasChanged ? "secondary" : "primary"}
          onClick={handleSave}
          isLoading={isPending}
          disabled={!hasChanged || !isWorkdayValid}
          className="w-full sm:w-auto"
        >
          {existingRecord ? (hasChanged ? "Update Record" : "Up to date") : "Save Record"}
        </Button>
      </div>
    </div>
  );
};

// --- Main Page Component ---

export const AttendancesList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  
  // Modes: 'today' | 'history'
  const [viewMode, setViewMode] = useState("today");
  
  // Today's date logic
  const todayStr = new Date().toISOString().split("T")[0];
  const [rollCallDate, setRollCallDate] = useState(todayStr);
  const isValidRollCallDate = isWorkday(rollCallDate);
  
  // History Mode State
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", employee: "", status: "", from: "", to: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingAttendance, setDeletingAttendance] = useState(null);

  // Fetch employees for both modes
  const { data: employeesData } = useQuery({ 
    queryKey: ["employees", "list"], 
    queryFn: () => getEmployees({ limit: 1000, status: "active" }),
    enabled: can("employees.read")
  });
  const employees = unwrapListResponse(employeesData).items || [];

  // Fetch today's attendances for roll-call mode
  const { data: todayAttendancesData, isLoading: isLoadingToday } = useQuery({
    queryKey: ["attendances", "rollcall", rollCallDate],
    queryFn: () => getAttendances({ from: rollCallDate, to: rollCallDate, limit: 1000 }),
    enabled: can("attendances.read") && viewMode === "today",
  });
  const todayAttendances = unwrapListResponse(todayAttendancesData).items || [];

  // Fetch history attendances
  const params = useMemo(() => cleanFilterParams(filters, { page, limit: 20 }), [filters, page]);
  const { data: historyData, isLoading: isLoadingHistory, isError, error, isFetching } = useQuery({
    queryKey: ["attendances", params],
    queryFn: () => getAttendances(params),
    placeholderData: keepPreviousData,
    enabled: can("attendances.read") && viewMode === "history",
  });
  const { items: attendances, pagination } = unwrapListResponse(historyData);

  usePrefetchNextPage({
    queryKey: ["attendances"],
    queryFn: getAttendances,
    pagination,
    params,
    page,
    enabled: viewMode === "history"
  });

  // Mutations (for History mode edits/deletes)
  const createMutation = useMutation({
    mutationFn: createAttendance,
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success("Attendance recorded successfully");
      setIsOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAttendance,
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success("Attendance updated successfully");
      setIsOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success("Attendance deleted successfully");
      setDeletingAttendance(null);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete attendance"));
    }
  });

  // Columns for History view
  const columns = [
    { header: "Date", accessor: (row) => formatDate(row.workDate || row.date), className: "font-medium" },
    { header: "Employee", accessor: (row) => row.employee?.name || "Unknown", className: "font-bold" },
    { 
      header: "Morning", 
      accessor: (row) => <StatusBadge status={row.morningStatus} />
    },
    { 
      header: "Afternoon", 
      accessor: (row) => <StatusBadge status={row.afternoonStatus} />
    },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          <Can permission="attendances.update">
            <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setEditingRecord(row); setIsOpen(true); }}>
              Edit
            </Button>
          </Can>
          <Can permission="attendances.delete">
            <Button variant="ghostDanger" size="icon" onClick={(e) => { e.stopPropagation(); setDeletingAttendance(row); }}>
              <span className="sr-only">Delete</span>
              <X className="h-4 w-4 text-danger" />
            </Button>
          </Can>
        </div>
      ) 
    }
  ];

  if (isError && viewMode === "history") {
    return <ErrorState description={getApiErrorMessage(error, "Failed to load attendance records.")} />;
  }

  return (
    <div className="space-y-6 lg:space-y-8 animate-[fadeSlideUp_0.3s_ease_both]">
      <PageHeader
        title="Attendance"
        description="Daily roll-call and historical attendance records."
        actions={
          <Can permission="attendances.create">
            <Button 
              onClick={() => { setEditingRecord(null); setIsOpen(true); }}
              className="hidden sm:flex"
            >
              Manual Entry
            </Button>
          </Can>
        }
      />

      {/* Mode Switcher Tabs */}
      <div className="flex bg-main p-1 rounded-xl border border-border/70 max-w-sm w-full">
        <button
          onClick={() => setViewMode("today")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
            viewMode === "today" ? "bg-surface text-primary shadow-sm" : "text-secondary hover:text-primary"
          }`}
        >
          <Clock className="h-4 w-4" /> Roll-Call
        </button>
        <button
          onClick={() => setViewMode("history")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
            viewMode === "history" ? "bg-surface text-primary shadow-sm" : "text-secondary hover:text-primary"
          }`}
        >
          <User className="h-4 w-4" /> History
        </button>
      </div>

      {/* --- TODAY / ROLL-CALL VIEW --- */}
      {viewMode === "today" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-border/70">
            <div>
              <h2 className="text-lg font-bold text-primary">Daily Roll-Call</h2>
              <p className="text-sm text-secondary">Record attendance for all active employees.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-secondary shrink-0">Date:</label>
              <Input 
                type="date" 
                value={rollCallDate} 
                onChange={(e) => setRollCallDate(e.target.value)} 
                className="w-auto h-11"
              />
            </div>
          </div>

          {!isValidRollCallDate && (
            <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-medium">
              Sundays are not valid workdays. Please select a Monday through Saturday.
            </div>
          )}

          {isLoadingToday ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.length > 0 ? (
                employees.map(employee => {
                  const record = todayAttendances.find(a => a.employee?._id === employee._id || a.employee === employee._id);
                  return (
                    <RollCallCard 
                      key={employee._id} 
                      employee={employee} 
                      existingRecord={record} 
                      workDate={rollCallDate}
                      isWorkdayValid={isValidRollCallDate}
                    />
                  );
                })
              ) : (
                <div className="col-span-full">
                  <EmptyState 
                    title="No Active Employees" 
                    description="You need active employees to take attendance." 
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- HISTORY VIEW --- */}
      {viewMode === "history" && (
        <div className="space-y-5">
          <FilterBar 
            searchPlaceholder="Search notes..."
            searchValue={filters.search}
            onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
            onClear={Object.values(filters).some(Boolean) ? () => { setFilters({ search: "", employee: "", status: "", from: "", to: "" }); setPage(1); } : undefined}
            activeFilterCount={[filters.employee, filters.status, filters.from, filters.to].filter(Boolean).length}
          >
            <Select
              value={filters.employee}
              onChange={(e) => { setFilters(p => ({ ...p, employee: e.target.value })); setPage(1); }}
              options={[
                { value: "", label: "All Employees" },
                ...employees.map(e => ({ value: e._id, label: e.name }))
              ]}
            />
            <Select
              value={filters.status}
              onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
              options={[
                { value: "", label: "All Statuses" },
                { value: "present", label: "Present" },
                { value: "half_day", label: "Half Day" },
                { value: "absent", label: "Absent" },
                { value: "leave", label: "On Leave" },
              ]}
            />
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => { setFilters(p => ({ ...p, from: e.target.value })); setPage(1); }}
            />
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => { setFilters(p => ({ ...p, to: e.target.value })); setPage(1); }}
            />
          </FilterBar>

          <DataTable 
            columns={columns}
            data={attendances}
            keyExtractor={(row) => row._id}
            pagination={{ ...pagination, page }}
            onPageChange={setPage}
            isLoading={isLoadingHistory}
            isFetching={isFetching}
            emptyState={
              <EmptyState
                title="No records found"
                description="Record employee attendance using the Roll-Call or Manual Entry."
                actionLabel={can("attendances.create") ? "Manual Entry" : null}
                onAction={can("attendances.create") ? () => {  setEditingRecord(null); setIsOpen(true); } : undefined}
              />
            }
          />
        </div>
      )}

      {/* Manual Entry / Edit Modal */}
      <Modal isOpen={isOpen} title={editingRecord ? "Edit Attendance" : "Manual Attendance Entry"} onClose={() => setIsOpen(false)}>
        <AttendanceForm
          initialData={editingRecord}
          onClose={() => setIsOpen(false)}
          onSubmit={(data) => {
            if (editingRecord) {
              return updateMutation.mutateAsync({ 
                id: editingRecord._id, 
                data: {
                  morningStatus: data.morningStatus,
                  afternoonStatus: data.afternoonStatus,
                } 
              });
            }
            return createMutation.mutateAsync(data);
          }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingAttendance}
        title="Delete Attendance"
        description="Are you sure you want to delete this attendance record? This action cannot be undone."
        onConfirm={() => deleteMutation.mutate(deletingAttendance._id)}
        onCancel={() => setDeletingAttendance(null)}
        isSubmitting={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
};
