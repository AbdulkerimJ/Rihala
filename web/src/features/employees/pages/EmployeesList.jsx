import React, { useMemo, useState } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createEmployee, getEmployees, updateEmployee, deleteEmployee } from "../api";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";

import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { FormRootError } from "../../../components/ui/FormRootError";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { getApiErrorMessage, unwrapListResponse, applyServerErrors, cleanFilterParams } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";
import { ethiopianPhone } from "../../../utils/validation";
import { ACTIVE_INACTIVE_OPTIONS, STATUS_FILTER_OPTIONS } from "../../../constants/options";

const employeeSchema = z
  .object({
    name: z
      .string({ error: "Employee name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters"),
    phone: ethiopianPhone,
    employmentStartDate: z.string().min(1, "Employment start date is required"),
    employmentEndDate: z.string().optional().or(z.literal("")),
    status: z.enum(["active", "inactive"]).default("active"),
  })
  .refine(
    (data) => {
      if (!data.employmentEndDate || !data.employmentStartDate) return true;
      return new Date(data.employmentEndDate) >= new Date(data.employmentStartDate);
    },
    {
      message: "Employment end date cannot be before start date",
      path: ["employmentEndDate"],
    }
  );

const EmployeeForm = ({ initialData, onSubmit, onClose }) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: initialData
      ? {
          name: initialData.name || "",
          phone: initialData.phone || "",
          employmentStartDate: initialData.employmentStartDate
            ? new Date(initialData.employmentStartDate).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          employmentEndDate: initialData.employmentEndDate
            ? new Date(initialData.employmentEndDate).toISOString().split("T")[0]
            : "",
          status: initialData.status || "active",
        }
      : {
          name: "",
          phone: "",
          employmentStartDate: new Date().toISOString().split("T")[0],
          employmentEndDate: "",
          status: "active",
        },
  });

  const handleFormSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        employmentEndDate: data.employmentEndDate ? data.employmentEndDate : undefined,
      };
      await onSubmit(payload);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />

      <FormField label="Full Name" required error={errors.name?.message}>
        <Input {...register("name")} error={errors.name?.message} placeholder="e.g. Abebe Bikila" />
      </FormField>

      <FormField label="Phone Number" required error={errors.phone?.message}>
        <Input {...register("phone")} error={errors.phone?.message} placeholder="e.g. 0911234567 or +251911234567" />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Employment Start Date" required error={errors.employmentStartDate?.message}>
          <Input type="date" {...register("employmentStartDate")} error={errors.employmentStartDate?.message} />
        </FormField>

        <FormField label="Employment End Date (Optional)" error={errors.employmentEndDate?.message}>
          <Input type="date" {...register("employmentEndDate")} error={errors.employmentEndDate?.message} />
        </FormField>
      </div>

      <FormField label="Status" error={errors.status?.message}>
        <Select
          {...register("status")}
          error={errors.status?.message}
          options={ACTIVE_INACTIVE_OPTIONS}
        />
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Save Employee
        </Button>
      </div>
    </form>
  );
};

export const EmployeesList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(null);

  const params = useMemo(() => cleanFilterParams(filters, { page, limit: 20 }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["employees", params],
    queryFn: () => getEmployees(params),
    placeholderData: keepPreviousData,
  });
  const { items: employees, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["employees"],
    queryFn: getEmployees,
    pagination,
    params,
    page,
  });

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

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee deleted successfully");
      setDeletingEmployee(null);
    },
    onError: () => {
      setDeletingEmployee(null);
    },
  });

  const columns = [
    { header: "Name", accessor: "name", className: "font-medium" },
    { header: "Phone", accessor: "phone", className: "text-secondary" },
    {
      header: "Start Date",
      accessor: (row) => formatDate(row.employmentStartDate),
      className: "text-secondary hidden sm:table-cell",
    },
    {
      header: "End Date",
      accessor: (row) => (row.employmentEndDate ? formatDate(row.employmentEndDate) : "-"),
      className: "text-secondary hidden md:table-cell",
    },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
    {
      header: "Actions",
      isActions: true,
      accessor: (row) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/employees/${row._id}`);
            }}
          >
            View
          </Button>
          <Can permission="employees.update">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditingEmployee(row);
                setIsOpen(true);
              }}
            >
              Edit
            </Button>
          </Can>
          <Can permission="employees.delete">
            <Button
              variant="ghostDanger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingEmployee(row);
              }}
            >
              Delete
            </Button>
          </Can>
        </div>
      ),
    },
  ];

  if (isError)
    return <ErrorState description={getApiErrorMessage(error, "Failed to load employees.")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage workshop staff, contact info, and employment periods."
        actions={
          <Can permission="employees.create">
            <Button onClick={() => { setEditingEmployee(null); setIsOpen(true); }}>
              Add Employee
            </Button>
          </Can>
        }
      />

      <FilterBar
        searchPlaceholder="Search employees..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters((p) => ({ ...p, search: val })); setPage(1); }}
        onClear={filters.search || filters.status ? () => { setFilters({ search: "", status: "" }); setPage(1); } : undefined}
      >
        <Select
          value={filters.status}
          onChange={(e) => { setFilters((p) => ({ ...p, status: e.target.value })); setPage(1); }}
          options={STATUS_FILTER_OPTIONS}
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

      <ConfirmDialog
        isOpen={!!deletingEmployee}
        title="Delete Employee"
        description={`Are you sure you want to delete "${deletingEmployee?.name}"? This action cannot be undone. You can only delete employees with no outstanding balance.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteMutation.mutateAsync(deletingEmployee._id)}
        onCancel={() => setDeletingEmployee(null)}
        variant="danger"
        isSubmitting={deleteMutation.isPending}
      />
    </div>
  );
};
