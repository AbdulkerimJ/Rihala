import React, { useMemo, useState } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createAttendance, getAttendances, updateAttendance } from "../api";
import { getEmployees } from "../../employees/api";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";

import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { FormRootError } from "../../../components/ui/FormRootError";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { applyServerErrors, cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";

import { isWorkday } from "../../../utils/validation";

const ATTENDANCE_STATUSES = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "PERMISSION", label: "Permission / Excused" },
];

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
      const payload = {
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
    <form className="space-y-4 p-6" onSubmit={handleSubmit(handleFormSubmit)}>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Morning Status" required error={errors.morningStatus?.message}>
          <Select
            {...register("morningStatus")}
            options={ATTENDANCE_STATUSES}
            error={errors.morningStatus?.message}
          />
        </FormField>

        <FormField label="Afternoon Status" required error={errors.afternoonStatus?.message}>
          <Select
            {...register("afternoonStatus")}
            options={ATTENDANCE_STATUSES}
            error={errors.afternoonStatus?.message}
          />
        </FormField>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting}>Save Record</Button>
      </div>
    </form>
  );
};

export const AttendancesList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", employee: "", status: "", from: "", to: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const { data: employeesData } = useQuery({ 
    queryKey: ["employees", "list"], 
    queryFn: () => getEmployees({ limit: 1000 }),
    enabled: can("employees.read")
  });
  const employees = unwrapListResponse(employeesData).items || [];

  const params = useMemo(() => cleanFilterParams(filters, { page, limit: 20 }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["attendances", params],
    queryFn: () => getAttendances(params),
    placeholderData: keepPreviousData,
    enabled: can("attendances.read"),
  });
  const { items: attendances, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["attendances"],
    queryFn: getAttendances,
    pagination,
    params,
    page,
  });

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

  const columns = [
    { header: "Date", accessor: (row) => formatDate(row.workDate || row.date), className: "font-medium" },
    { header: "Employee", accessor: (row) => row.employee?.name || "Unknown", className: "font-medium" },
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
        </div>
      ) 
    }
  ];

  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load attendance records.")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Track daily employee attendance and leave."
        actions={
          <Can permission="attendances.create">
            <Button onClick={() => { setEditingRecord(null); setIsOpen(true); }}>Record Attendance</Button>
          </Can>
        }
      />

      <FilterBar 
        searchPlaceholder="Search notes..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={Object.values(filters).some(Boolean) ? () => { setFilters({ search: "", employee: "", status: "", from: "", to: "" }); setPage(1); } : undefined}
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
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={
          <EmptyState
            title="No records found"
            description="Record employee attendance."
            actionLabel={can("attendances.create") ? "Record Attendance" : null}
            onAction={can("attendances.create") ? () => {  setEditingRecord(null); setIsOpen(true); } : undefined}
          />
        }
      />

      <Modal isOpen={isOpen} title={editingRecord ? "Edit Record" : "Record Attendance"} onClose={() => setIsOpen(false)}>
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
    </div>
  );
};

