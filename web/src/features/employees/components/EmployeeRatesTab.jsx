import { useMemo, useState } from "react";
import { Save, X, Plus, Edit, Trash2 } from "lucide-react";
import { usePermission } from "../../../hooks/usePermission";
import { useDebounce } from "../../../hooks/useDebounce";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { employeeRatesApi } from "../../employee-rates/api";
import { getEmployees, createEmployee } from "../api";
import { EmployeeForm } from "./EmployeeForm";
import { useForm, Controller } from "react-hook-form";
import { FormRootError } from "../../../components/ui/FormRootError";
import { CreatableSelect } from "../../../components/ui/CreatableSelect";
import { FormField } from "../../../components/ui/FormField";
import { CurrencyInput } from "../../../components/ui/CurrencyInput";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { Can } from "../../../components/Can";
import { ErrorState } from "../../../components/ui/ErrorState";
import { FilterBar } from "../../../components/ui/FilterBar";
import { Select } from "../../../components/ui/Select";
import { DataTable } from "../../../components/ui/DataTable";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { applyServerErrors, cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate, formatCurrency, getLocalISODate } from "../../../utils/formatters";

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
  
  const { register, control, handleSubmit, setError, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(employeeRateSchema),
    defaultValues: initialData ? {
      employee: initialData.employee?._id || initialData.employee,
      dailyRate: initialData.dailyRate,
      effectiveDate: initialData.effectiveDate ? getLocalISODate(initialData.effectiveDate) : getLocalISODate(),
      note: initialData.note || "",
    } : {
      employee: "",
      dailyRate: "",
      effectiveDate: getLocalISODate(),
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
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} leftIcon={X}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} leftIcon={Save}>Save Rate</Button>
      </div>
    </form>
  );
};

export const EmployeeRatesTab = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", employee: "" }); 
  const debouncedSearch = useDebounce(filters.search, 300);
  const [isOpen, setIsOpen] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [deletingRate, setDeletingRate] = useState(null);

  const { data: employeesData } = useQuery({ 
    queryKey: ["employees", "list"], 
    queryFn: () => getEmployees({ limit: 1000 }),
    enabled: can("employees.read")
  });
  const employees = unwrapListResponse(employeesData).items || [];

  const params = useMemo(() => cleanFilterParams({ ...filters, search: debouncedSearch }, { page, limit: 20 }), [filters, debouncedSearch, page]);

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
              variant="ghost"
              size="icon"
              leftIcon={Edit}
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                setEditingRate(row);
                setIsOpen(true);
              }}
            />
          </Can>
          <Can permission="employeeRates.delete">
            <Button
              variant="danger-ghost"
              size="icon"
              leftIcon={Trash2}
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingRate(row);
              }}
            />
          </Can>
        </div>
      ),
    },
  ];

  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load employee rates.")} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
        <div className="flex-1 w-full min-w-0">
          <FilterBar 
            filters={filters}
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
        </div>
        <Can permission="employeeRates.create">
          <Button onClick={() => { setEditingRate(null); setIsOpen(true); }} leftIcon={Plus} className="shrink-0 w-full sm:w-auto">
            Set Rate
          </Button>
        </Can>
      </div>

      <DataTable 
        columns={columns}
        data={employeeRates}
        keyExtractor={(row) => row._id}
        mobileRow={(row) => ({
          title: row.employee?.name || "Unknown",
          subtitle: `Effective ${formatDate(row.effectiveDate)} ${row.note ? `• ${row.note}` : ""}`,
          right: (
            <span className="text-xs font-bold tracking-tight text-primary">
              <MoneyDisplay amount={row.dailyRate} />
            </span>
          ),
          actions: (
            <>
              <Can permission="employeeRates.update">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={Edit}
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
                  variant="danger-ghost"
                  size="sm"
                  leftIcon={Trash2}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingRate(row);
                  }}
                >
                  Delete
                </Button>
              </Can>
            </>
          )
        })}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
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

