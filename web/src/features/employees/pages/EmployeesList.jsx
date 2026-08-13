import React, { useMemo, useState, useEffect } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createEmployee, getEmployees, updateEmployee } from "../api";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";

import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { getApiErrorMessage, unwrapListResponse, applyServerErrors } from "../../../utils/apiResponse";

const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  position: z.string().min(1, "Position is required"),
  baseSalary: z.coerce.number().nonnegative().optional(),
  dailyRate: z.coerce.number().nonnegative().optional(),
  employmentType: z.enum(["permanent", "contract", "daily"]),
  hireDate: z.string().min(1, "Hire date is required"),
  status: z.enum(["active", "inactive", "on_leave"]).default("active"),
});

const EmployeeForm = ({ initialData, onSubmit, onClose }) => {
  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: initialData ? {
      ...initialData,
      hireDate: initialData.hireDate ? new Date(initialData.hireDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    } : {
      name: "",
      phone: "",
      position: "",
      baseSalary: 0,
      dailyRate: 0,
      employmentType: "permanent",
      hireDate: new Date().toISOString().split("T")[0],
      status: "active",
    },
  });

  const empType = watch("employmentType");

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormField label="Full Name" required error={errors.name?.message}>
        <Input {...register("name")} error={errors.name?.message} />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Position" required error={errors.position?.message}>
          <Input {...register("position")} placeholder="e.g. Carpenter, Painter" error={errors.position?.message} />
        </FormField>
        
        <FormField label="Phone" error={errors.phone?.message}>
          <Input {...register("phone")} error={errors.phone?.message} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Employment Type" required error={errors.employmentType?.message}>
          <Select
            {...register("employmentType")}
            error={errors.employmentType?.message}
            options={[
              { value: "permanent", label: "Permanent" },
              { value: "contract", label: "Contract" },
              { value: "daily", label: "Daily Wage" },
            ]}
          />
        </FormField>
        
        <FormField label="Hire Date" required error={errors.hireDate?.message}>
          <Input type="date" {...register("hireDate")} error={errors.hireDate?.message} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Monthly Base Salary" error={errors.baseSalary?.message}>
          <Input type="number" step="0.01" {...register("baseSalary")} disabled={empType === "daily"} error={errors.baseSalary?.message} />
        </FormField>

        <FormField label="Daily Rate (if applicable)" error={errors.dailyRate?.message}>
          <Input type="number" step="0.01" {...register("dailyRate")} disabled={empType !== "daily"} error={errors.dailyRate?.message} />
        </FormField>
      </div>

      <FormField label="Status" error={errors.status?.message}>
        <Select
          {...register("status")}
          error={errors.status?.message}
          options={[
            { value: "active", label: "Active" },
            { value: "on_leave", label: "On Leave" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </FormField>

      {errors.root && (
        <div className="rounded-xl bg-danger/8 border border-danger/20 px-4 py-3 text-sm text-danger">
          {errors.root.message}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting}>Save Employee</Button>
      </div>
    </form>
  );
};

export const EmployeesList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "", employmentType: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const params = useMemo(() => ({
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    page,
    limit: 20
  }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["employees", params],
    queryFn: () => getEmployees(params),
    placeholderData: keepPreviousData,
  });
  const { items: employees, pagination } = unwrapListResponse(data);

  useEffect(() => {
    if (pagination && pagination.page < pagination.totalPages) {
      const nextParams = { ...params, page: page + 1 };
      queryClient.prefetchQuery({
        queryKey: ["employees", nextParams],
        queryFn: () => getEmployees(nextParams),
      });
    }
  }, [pagination, page, params, queryClient]);

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee created successfully");
      setIsOpen(false);
    },
    meta: { suppressToast: true },
  });
  
  const updateMutation = useMutation({
    mutationFn: updateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee updated successfully");
      setIsOpen(false);
    },
    meta: { suppressToast: true },
  });

  const columns = [
    { header: "Name", accessor: "name", className: "font-medium" },
    { header: "Position", accessor: "position", className: "text-secondary" },
    { header: "Type", accessor: (row) => <span className="capitalize">{row.employmentType}</span>, className: "text-secondary hidden sm:table-cell", hiddenOnMobile: true },
    { 
      header: "Salary/Rate", 
      accessor: (row) => row.employmentType === 'daily' 
        ? <><MoneyDisplay amount={row.dailyRate} /> / day</> 
        : <><MoneyDisplay amount={row.baseSalary} /> / mo</>, 
      className: "hidden md:table-cell", 
      hiddenOnMobile: true 
    },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/employees/${row._id}`); }}>
            View
          </Button>
          <Can permission="employees.update">
            <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setEditingEmployee(row); setIsOpen(true); }}>
              Edit
            </Button>
          </Can>
        </div>
      ) 
    }
  ];

  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load employees.")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage workshop staff, positions, and base salaries."
        actions={
          <Can permission="employees.create">
            <Button onClick={() => { setEditingEmployee(null); setIsOpen(true); }}>Add Employee</Button>
          </Can>
        }
      />

      <FilterBar 
        searchPlaceholder="Search employees..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={filters.search || filters.status || filters.employmentType ? () => { setFilters({ search: "", status: "", employmentType: "" }); setPage(1); } : undefined}
      >
        <Select
          value={filters.employmentType}
          onChange={(e) => { setFilters(p => ({ ...p, employmentType: e.target.value })); setPage(1); }}
          placeholder="All Types"
          options={[
            { value: "permanent", label: "Permanent" },
            { value: "contract", label: "Contract" },
            { value: "daily", label: "Daily Wage" },
          ]}
        />
        <Select
          value={filters.status}
          onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          placeholder="All Statuses"
          options={[
            { value: "active", label: "Active" },
            { value: "on_leave", label: "On Leave" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </FilterBar>

      <DataTable 
        columns={columns}
        data={employees}
        keyExtractor={(row) => row._id}
        onRowClick={(row) => navigate(`/employees/${row._id}`)}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={
          <EmptyState
            title="No employees found"
            description="Add your first employee to the system."
            actionLabel={can("employees.create") ? "Add Employee" : null}
            onAction={can("employees.create") ? () => {  setEditingEmployee(null); setIsOpen(true); } : undefined}
          />
        }
      />

      <Modal isOpen={isOpen} title={editingEmployee ? "Edit Employee" : "New Employee"} onClose={() => setIsOpen(false)}>
        <EmployeeForm
          initialData={editingEmployee}
          onClose={() => setIsOpen(false)}
          onSubmit={async (data) => {
            if (editingEmployee) {
              await updateMutation.mutateAsync({ id: editingEmployee._id, data });
            } else {
              await createMutation.mutateAsync(data);
            }
          }}
        />
      </Modal>
    </div>
  );
};
