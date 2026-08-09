import React, { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createEmployee, getEmployees, updateEmployee } from "../api";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { FormField } from "../../../components/ui/FormField";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";

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
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
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

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Full Name" required error={errors.name?.message}>
        <input {...register("name")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Position" required error={errors.position?.message}>
          <input {...register("position")} placeholder="e.g. Carpenter, Painter" className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </FormField>
        
        <FormField label="Phone" error={errors.phone?.message}>
          <input {...register("phone")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Employment Type" required error={errors.employmentType?.message}>
          <select {...register("employmentType")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent">
            <option value="permanent">Permanent</option>
            <option value="contract">Contract</option>
            <option value="daily">Daily Wage</option>
          </select>
        </FormField>
        
        <FormField label="Hire Date" required error={errors.hireDate?.message}>
          <input type="date" {...register("hireDate")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Monthly Base Salary" error={errors.baseSalary?.message}>
          <input type="number" step="0.01" {...register("baseSalary")} disabled={empType === "daily"} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50" />
        </FormField>

        <FormField label="Daily Rate (if applicable)" error={errors.dailyRate?.message}>
          <input type="number" step="0.01" {...register("dailyRate")} disabled={empType !== "daily"} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50" />
        </FormField>
      </div>

      <FormField label="Status" error={errors.status?.message}>
        <select {...register("status")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent">
          <option value="active">Active</option>
          <option value="on_leave">On Leave</option>
          <option value="inactive">Inactive</option>
        </select>
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Employee"}</Button>
      </div>
    </form>
  );
};

export const EmployeesList = () => {
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

  const { data, isLoading, isError, error } = useQuery({
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
  });
  
  const updateMutation = useMutation({
    mutationFn: updateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee updated successfully");
      setIsOpen(false);
    },
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

  if (isLoading) return <LoadingSkeleton variant="default" rowCount={6} showSearch />;
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
        <select
          value={filters.employmentType}
          onChange={(e) => { setFilters(p => ({ ...p, employmentType: e.target.value })); setPage(1); }}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All Types</option>
          <option value="permanent">Permanent</option>
          <option value="contract">Contract</option>
          <option value="daily">Daily Wage</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="on_leave">On Leave</option>
          <option value="inactive">Inactive</option>
        </select>
      </FilterBar>

      <DataTable 
        columns={columns}
        data={employees}
        keyExtractor={(row) => row._id}
        onRowClick={(row) => navigate(`/employees/${row._id}`)}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            title="No employees found"
            description="Add your first employee to the system."
            actionLabel="Add Employee"
            onAction={() => { setEditingEmployee(null); setIsOpen(true); }}
          />
        }
      />

      <Modal isOpen={isOpen} title={editingEmployee ? "Edit Employee" : "New Employee"} onClose={() => setIsOpen(false)}>
        <EmployeeForm
          initialData={editingEmployee}
          onClose={() => setIsOpen(false)}
          onSubmit={(data) => editingEmployee ? updateMutation.mutateAsync({ id: editingEmployee._id, data }) : createMutation.mutateAsync(data)}
        />
      </Modal>
    </div>
  );
};
