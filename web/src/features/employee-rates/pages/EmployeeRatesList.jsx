import React, { useMemo, useState } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { employeeRatesApi } from "../api";
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
import { CurrencyInput } from "../../../components/ui/CurrencyInput";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { FormRootError } from "../../../components/ui/FormRootError";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { applyServerErrors, cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate, formatCurrency } from "../../../utils/formatters";

const employeeRateSchema = z.object({
  employee: z.string().min(1, "Employee is required"),
  dailyRate: z.coerce.number({ error: "Daily rate is required" }).positive("Daily rate must be greater than 0"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  note: z.string().trim().optional(),
});

const EmployeeRateForm = ({ initialData, onSubmit, onClose }) => {
  const { can } = usePermission();
  const { data: employeesData } = useQuery({ 
    queryKey: ["employees", "list"], 
    queryFn: () => getEmployees({ limit: 1000, status: "active" }),
    enabled: can("employees.read")
  });
  const employees = unwrapListResponse(employeesData).items || [];
  
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(employeeRateSchema),
    defaultValues: initialData ? {
      employee: initialData.employee?._id || initialData.employee,
      dailyRate: initialData.dailyRate,
      effectiveDate: initialData.effectiveDate ? new Date(initialData.effectiveDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      note: initialData.note || "",
    } : {
      employee: "",
      dailyRate: "",
      effectiveDate: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  const handleFormSubmit = async (data) => {
    try {
      const payload = initialData ? {
        dailyRate: data.dailyRate,
        note: data.note || undefined,
      } : {
        employee: data.employee,
        dailyRate: data.dailyRate,
        effectiveDate: new Date(data.effectiveDate).toISOString(),
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
      <FormField label="Employee" required error={errors.employee?.message}>
        <Select
          {...register("employee")}
          placeholder="Select an employee"
          options={employees.map(e => ({ value: e._id, label: e.name }))}
          error={errors.employee?.message}
          disabled={!!initialData}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Daily Rate (ETB)" required error={errors.dailyRate?.message}>
          <Controller
            name="dailyRate"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                placeholder="0.00"
                error={errors.dailyRate?.message}
                {...field}
              />
            )}
          />
        </FormField>

        <FormField label="Effective Date" required error={errors.effectiveDate?.message}>
          <Input 
            type="date" 
            {...register("effectiveDate")} 
            error={errors.effectiveDate?.message} 
          />
        </FormField>
      </div>

      <FormField label="Note" error={errors.note?.message}>
        <Textarea 
          placeholder="Optional notes about this rate..."
          {...register("note")} 
          error={errors.note?.message} 
        />
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting}>Save Rate</Button>
      </div>
    </form>
  );
};

export const EmployeeRatesList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", employee: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [deletingRate, setDeletingRate] = useState(null);

  const { data: employeesData } = useQuery({ 
    queryKey: ["employees", "list"], 
    queryFn: () => getEmployees({ limit: 1000 }),
    enabled: can("employees.read")
  });
  const employees = unwrapListResponse(employeesData).items || [];

  const params = useMemo(() => cleanFilterParams(filters, { page, limit: 20 }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["employeeRates", params],
    queryFn: () => employeeRatesApi.getAll(params),
    placeholderData: keepPreviousData,
    enabled: can("employeeRates.read"),
  });
  const { items: employeeRates, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["employeeRates"],
    queryFn: employeeRatesApi.getAll,
    pagination,
    params,
    page,
  });

  const createMutation = useMutation({
    mutationFn: employeeRatesApi.create,
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeRates"] });
      queryClient.invalidateQueries({ queryKey: ["weeklyPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-calculation"] });
      toast.success("Employee rate set successfully");
      setIsOpen(false);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to set employee rate."));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => employeeRatesApi.update(id, data),
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeRates"] });
      queryClient.invalidateQueries({ queryKey: ["weeklyPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-calculation"] });
      toast.success("Employee rate updated successfully");
      setIsOpen(false);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to update employee rate."));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => employeeRatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeRates"] });
      queryClient.invalidateQueries({ queryKey: ["weeklyPayrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-calculation"] });
      toast.success("Employee rate deleted successfully");
      setDeletingRate(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to delete employee rate."));
    },
  });

  const columns = [
    { header: "Employee", accessor: (row) => row.employee?.name || "Unknown", className: "font-medium" },
    { header: "Daily Rate", accessor: (row) => <MoneyDisplay amount={row.dailyRate} /> },
    { header: "Effective Date", accessor: (row) => formatDate(row.effectiveDate) },
    { header: "Note", accessor: (row) => row.note || <span className="text-muted italic">None</span> },
    {
      header: "Actions",
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          <Can permission="employeeRates.update">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditingRate(row);
                setIsOpen(true);
              }}
            >
              Edit
            </Button>
          </Can>
          <Can permission="employeeRates.delete">
            <Button
              variant="ghostDanger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingRate(row);
              }}
            >
              Delete
            </Button>
          </Can>
        </div>
      ),
    },
  ];

  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load employee rates.")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Rates"
        description="Manage daily wage rates for employees."
        actions={
          <Can permission="employeeRates.create">
            <Button onClick={() => { setEditingRate(null); setIsOpen(true); }}>Set Rate</Button>
          </Can>
        }
      />

      <FilterBar 
        searchPlaceholder="Search notes..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={Object.values(filters).some(Boolean) ? () => { setFilters({ search: "", employee: "" }); setPage(1); } : undefined}
      >
        <Select
          value={filters.employee}
          onChange={(e) => { setFilters(p => ({ ...p, employee: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "All Employees" },
            ...employees.map(e => ({ value: e._id, label: e.name }))
          ]}
        />
      </FilterBar>

      <DataTable 
        columns={columns}
        data={employeeRates}
        keyExtractor={(row) => row._id}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        mobileRenderer={(row) => (
          <div className="flex flex-col gap-2.5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-sm uppercase">
                  {(row.employee?.name || "U").charAt(0)}
                </div>
                <span className="font-semibold text-primary">{row.employee?.name || "Unknown"}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">Effective Date</span>
                <span className="text-sm text-secondary font-medium">{formatDate(row.effectiveDate)}</span>
              </div>
              
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">Daily Rate</span>
                <MoneyDisplay amount={row.dailyRate} className="text-sm font-bold text-primary" />
              </div>
            </div>
            
            {row.note && (
              <p className="text-xs text-secondary mt-1">{row.note}</p>
            )}
            
            <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-border/20">
              <Can permission="employeeRates.update">
                <Button variant="secondary" size="sm" onClick={() => { setEditingRate(row); setIsOpen(true); }}>
                  Edit
                </Button>
              </Can>
              <Can permission="employeeRates.delete">
                <Button variant="ghostDanger" size="sm" onClick={() => setDeletingRate(row)}>
                  Delete
                </Button>
              </Can>
            </div>
          </div>
        )}
        emptyState={
          <EmptyState
            title="No rates found"
            description="Set a daily rate for an employee."
            actionLabel={can("employeeRates.create") ? "Set Rate" : null}
            onAction={can("employeeRates.create") ? () => { setEditingRate(null); setIsOpen(true); } : undefined}
          />
        }
      />

      <Modal isOpen={isOpen} title={editingRate ? "Edit Employee Rate" : "Set Employee Rate"} onClose={() => setIsOpen(false)}>
        <EmployeeRateForm
          initialData={editingRate}
          onClose={() => setIsOpen(false)}
          onSubmit={(data) => {
            if (editingRate) {
              return updateMutation.mutateAsync({ id: editingRate._id, data: { dailyRate: data.dailyRate, effectiveDate: data.effectiveDate, note: data.note } });
            }
            return createMutation.mutateAsync(data);
          }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingRate}
        title="Delete Employee Rate"
        description={
          deletingRate
            ? `Are you sure you want to delete the daily rate of ${formatCurrency(deletingRate.dailyRate)} for "${deletingRate.employee?.name || "this employee"}" (effective ${formatDate(deletingRate.effectiveDate)})? Future payroll calculations will fall back to the previous applicable rate.`
            : ""
        }
        confirmLabel="Delete Rate"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => deleteMutation.mutateAsync(deletingRate._id)}
        onCancel={() => setDeletingRate(null)}
        isSubmitting={deleteMutation.isPending}
      />
    </div>
  );
};

