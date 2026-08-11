import React, { useMemo, useState, useEffect } from "react";
import { usePermission } from "../../../hooks/usePermission";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";

const attendanceSchema = z.object({
  employee: z.string().min(1, "Employee is required"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["present", "absent", "half_day", "leave"]).default("present"),
  notes: z.string().optional(),
});

const AttendanceForm = ({ initialData, onSubmit, onClose }) => {
  const { data: employeesData } = useQuery({ queryKey: ["employees-list"], queryFn: () => getEmployees({ limit: 1000 }) });
  const employees = unwrapListResponse(employeesData).items || [];
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(attendanceSchema),
    defaultValues: initialData ? {
      ...initialData,
      date: initialData.date ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      employee: initialData.employee?._id || initialData.employee,
    } : {
      employee: "",
      date: new Date().toISOString().split("T")[0],
      status: "present",
      notes: "",
    },
  });

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Employee" required error={errors.employee?.message}>
        <select {...register("employee")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent">
          <option value="">Select an employee</option>
          {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
        </select>
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Date" required error={errors.date?.message}>
          <input type="date" {...register("date")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </FormField>

        <FormField label="Status" error={errors.status?.message}>
          <select {...register("status")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent">
            <option value="present">Present</option>
            <option value="half_day">Half Day</option>
            <option value="absent">Absent</option>
            <option value="leave">On Leave</option>
          </select>
        </FormField>
      </div>

      <FormField label="Notes" error={errors.notes?.message}>
        <textarea {...register("notes")} rows={2} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Processing..." : "Save Record"}</Button>
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

  const { data: employeesData } = useQuery({ queryKey: ["employees-list"], queryFn: () => getEmployees({ limit: 1000 }) });
  const employees = unwrapListResponse(employeesData).items || [];

  const params = useMemo(() => ({
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    page,
    limit: 20
  }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["attendances", params],
    queryFn: () => getAttendances(params),
    placeholderData: keepPreviousData,
  });
  const { items: attendances, pagination } = unwrapListResponse(data);

  useEffect(() => {
    if (pagination && pagination.page < pagination.totalPages) {
      const nextParams = { ...params, page: page + 1 };
      queryClient.prefetchQuery({
        queryKey: ["attendances", nextParams],
        queryFn: () => getAttendances(nextParams),
      });
    }
  }, [pagination, page, params, queryClient]);

  const createMutation = useMutation({
    mutationFn: createAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success("Attendance recorded successfully");
      setIsOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success("Attendance updated successfully");
      setIsOpen(false);
    },
  });

  const columns = [
    { header: "Date", accessor: (row) => formatDate(row.date), className: "font-medium" },
    { header: "Employee", accessor: (row) => row.employee?.name || "Unknown", className: "font-medium" },
    { 
      header: "Status", 
      accessor: (row) => (
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium 
          ${row.status === 'present' ? 'bg-success/10 text-success' : 
            row.status === 'absent' ? 'bg-danger/10 text-danger' : 
            row.status === 'half_day' ? 'bg-warning/10 text-warning' : 'bg-secondary/10 text-secondary'}`}>
          {row.status?.replace('_', ' ') || "—"}
        </span>
      )
    },
    { header: "Notes", accessor: "notes", className: "text-secondary hidden md:table-cell" },
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
        <select
          value={filters.employee}
          onChange={(e) => { setFilters(p => ({ ...p, employee: e.target.value })); setPage(1); }}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All Employees</option>
          {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
        </select>
        <select
          value={filters.status}
          onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All Statuses</option>
          <option value="present">Present</option>
          <option value="half_day">Half Day</option>
          <option value="absent">Absent</option>
          <option value="leave">On Leave</option>
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => { setFilters(p => ({ ...p, from: e.target.value })); setPage(1); }}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => { setFilters(p => ({ ...p, to: e.target.value })); setPage(1); }}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
          onSubmit={(data) => editingRecord ? updateMutation.mutateAsync({ id: editingRecord._id, data }) : createMutation.mutateAsync(data)}
        />
      </Modal>
    </div>
  );
};
