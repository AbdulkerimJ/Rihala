import React, { useMemo, useState } from "react";
import { Save, X, Plus } from "lucide-react";
import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createOvertime, getOvertimes, updateOvertime, deleteOvertime } from "../api";
import { getEmployees, createEmployee } from "../../employees/api";
import { EmployeeForm } from "../../employees/components/EmployeeForm";
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
import { CreatableSelect } from "../../../components/ui/CreatableSelect";
import { Textarea } from "../../../components/ui/Textarea";
import { FormRootError } from "../../../components/ui/FormRootError";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { applyServerErrors, cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";

const OVERTIME_DURATIONS = [
  { value: "HALF_DAY", label: "Half Day" },
  { value: "FULL_DAY", label: "Full Day" },
];

const overtimeSchema = z.object({
  employee: z.string().min(1, "Employee is required"),
  workDate: z.string().min(1, "Work date is required"),
  duration: z.enum(["HALF_DAY", "FULL_DAY"], {
    errorMap: () => ({ message: "Duration is required" }),
  }),
  note: z.string().trim().optional().or(z.literal("")),
});

const OvertimeForm = ({ initialData, onSubmit, onClose }) => {
  const { can } = usePermission();
  const { data: employeesData } = useQuery({ 
    queryKey: ["employees", "list"], 
    queryFn: () => getEmployees({ limit: 1000, status: "active" }),
    enabled: can("employees.read")
  });
  const employees = unwrapListResponse(employeesData).items || [];
  
  const { register, handleSubmit, setError, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(overtimeSchema),
    defaultValues: initialData ? {
      employee: initialData.employee?._id || initialData.employee,
      workDate: initialData.workDate ? new Date(initialData.workDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      duration: initialData.duration || "HALF_DAY",
      note: initialData.note || "",
    } : {
      employee: "",
      workDate: new Date().toISOString().split("T")[0],
      duration: "HALF_DAY",
      note: "",
    },
  });

  const handleFormSubmit = async (data) => {
    try {
      const payload = initialData ? {
        duration: data.duration,
        note: data.note || undefined,
      } : {
        employee: data.employee,
        workDate: new Date(data.workDate).toISOString(),
        duration: data.duration,
        note: data.note || undefined,
      };
      await onSubmit(payload);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />
      <CreatableSelect
        label="Employee"
        required
        name="employee"
        register={register}
        setValue={setValue}
        error={errors.employee?.message}
        options={employees.map(e => ({ value: e._id, label: e.name }))}
        placeholder="Select an employee"
        disabled={!!initialData}
        createTitle="New Employee"
        FormComponent={EmployeeForm}
        createMutationFn={createEmployee}
        queryKey={["employees"]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Work Date" required error={errors.workDate?.message}>
          <Input type="date" {...register("workDate")} error={errors.workDate?.message} disabled={!!initialData} />
        </FormField>

        <FormField label="Duration" required error={errors.duration?.message}>
          <Select
            {...register("duration")}
            options={OVERTIME_DURATIONS}
            error={errors.duration?.message}
          />
        </FormField>
      </div>

      <FormField label="Notes (Optional)" error={errors.note?.message}>
        <Textarea {...register("note")} rows={2} error={errors.note?.message} placeholder="Optional notes" />
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} leftIcon={X}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} leftIcon={Save}>Save Record</Button>
      </div>
    </form>
  );
};

export const OvertimesList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", employee: "", from: "", to: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const { data: employeesData } = useQuery({ 
    queryKey: ["employees", "list"], 
    queryFn: () => getEmployees({ limit: 1000 }),
    enabled: can("employees.read")
  });
  const employees = unwrapListResponse(employeesData).items || [];

  const params = useMemo(() => cleanFilterParams(filters, { page, limit: 20 }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["overtimes", params],
    queryFn: () => getOvertimes(params),
    placeholderData: keepPreviousData,
    enabled: can("overtimes.read"),
  });
  const { items: overtimes, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["overtimes"],
    queryFn: getOvertimes,
    pagination,
    params,
    page,
  });

  const createMutation = useMutation({
    mutationFn: createOvertime,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtimes"] });
      queryClient.invalidateQueries({ queryKey: ["weeklyPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-calculation"] });
      toast.success("Overtime recorded successfully");
      setIsOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateOvertime,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtimes"] });
      queryClient.invalidateQueries({ queryKey: ["weeklyPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-calculation"] });
      toast.success("Overtime updated successfully");
      setIsOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOvertime,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtimes"] });
      queryClient.invalidateQueries({ queryKey: ["weeklyPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-calculation"] });
      toast.success("Overtime deleted successfully");
      setRecordToDelete(null);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete overtime."));
      setRecordToDelete(null);
    },
  });

  const columns = [
    { header: "Date", accessor: (row) => formatDate(row.workDate || row.date), className: "font-medium" },
    { header: "Employee", accessor: (row) => row.employee?.name || "Unknown", className: "font-medium" },
    { 
      header: "Duration", 
      accessor: (row) => row.duration === 'FULL_DAY' ? 'Full Day' : 'Half Day' 
    },
    { header: "Notes", accessor: (row) => row.note || row.notes || "-", className: "text-secondary hidden md:table-cell" },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          <Can permission="overtimes.update">
            <Button variant="ghost" size="icon" leftIcon={Edit} onClick={(e) => { e.stopPropagation(); setEditingRecord(row); setIsOpen(true); }} title="Edit" />
          </Can>
          <Can permission="overtimes.delete">
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setRecordToDelete(row);
              }}
            >
              Delete
            </Button>
          </Can>
        </div>
      ) 
    }
  ];

  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load overtime records.")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overtime"
        description="Track additional hours worked by employees."
        actions={
          <Can permission="overtimes.create">
            <Button onClick={() => { setEditingRecord(null); setIsOpen(true); }}>Record Overtime</Button>
          </Can>
        }
      />

      <FilterBar 
        searchPlaceholder="Search notes..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={Object.values(filters).some(Boolean) ? () => { setFilters({ search: "", employee: "", from: "", to: "" }); setPage(1); } : undefined}
      >
        <Select
          value={filters.employee}
          onChange={(e) => { setFilters(p => ({ ...p, employee: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "All Employees" },
            ...employees.map(e => ({ value: e._id, label: e.name }))
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
        data={overtimes}
        keyExtractor={(row) => row._id}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={
          <EmptyState
            title="No records found"
            description="Record employee overtime."
            actionLabel={can("overtimes.create") ? "Record Overtime" : null}
            onAction={can("overtimes.create") ? () => {  setEditingRecord(null); setIsOpen(true); } : undefined}
          />
        }
      />

      <Modal isOpen={isOpen} title={editingRecord ? "Edit Overtime" : "Record Overtime"} onClose={() => setIsOpen(false)}>
        <OvertimeForm
          initialData={editingRecord}
          onClose={() => setIsOpen(false)}
          onSubmit={(data) => editingRecord ? updateMutation.mutateAsync({ id: editingRecord._id, data }) : createMutation.mutateAsync(data)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!recordToDelete}
        title="Delete Overtime"
        description={`Are you sure you want to delete the overtime for ${recordToDelete?.employee?.name} on ${recordToDelete ? formatDate(recordToDelete.workDate) : ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        isSubmitting={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(recordToDelete._id)}
        onCancel={() => setRecordToDelete(null)}
      />
    </div>
  );
};

