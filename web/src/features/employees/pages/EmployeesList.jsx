import React, { useMemo, useState } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { usePermission } from "../../../hooks/usePermission";
import { useDebounce } from "../../../hooks/useDebounce";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createEmployee, getEmployees, updateEmployee, deleteEmployee } from "../api";
import { EmployeeForm } from "../components/EmployeeForm";
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



export const EmployeesList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "" }); 
  const debouncedSearch = useDebounce(filters.search, 300);
  const [isOpen, setIsOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(null);

  const params = useMemo(() => cleanFilterParams({ ...filters, search: debouncedSearch }, { page, limit: 20 }), [filters, debouncedSearch, page]);

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

  const getInitials = (name) => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
  };

  const mobileRenderer = (row) => (
    <div className="p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-accent to-accent/60 text-white font-bold text-lg shadow-sm shrink-0">
            {getInitials(row.name)}
          </div>
          <div>
            <h4 className="font-bold text-primary leading-tight text-base">{row.name}</h4>
            <span className="text-sm text-secondary mt-0.5 inline-flex items-center gap-1">
               {row.phone || "No phone"}
            </span>
          </div>
        </div>
        <StatusBadge status={row.status} />
      </div>
      
      <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/50">
        <div className="text-xs text-secondary font-medium">
          Started: <span className="text-primary font-semibold">{formatDate(row.employmentStartDate)}</span>
        </div>
        <div className="flex gap-1">
          <Can permission="employees.update">
            <Button
              variant="ghost"
              size="icon"
              leftIcon={Edit}
              onClick={(e) => {
                e.stopPropagation();
                setEditingEmployee(row);
                setIsOpen(true);
              }}
            />
          </Can>
          <Can permission="employees.delete">
            <Button
              variant="danger-ghost"
              size="icon"
              leftIcon={Trash2}
              onClick={(e) => {
                e.stopPropagation();
                setDeletingEmployee(row);
              }}
            />
          </Can>
        </div>
      </div>
    </div>
  );

  const columns = [
    { header: "Name", accessor: "name", className: "font-bold text-primary" },
    { header: "Phone", accessor: "phone", className: "text-secondary font-medium" },
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
        <div className="flex gap-1 justify-end">
          <Can permission="employees.update">
            <Button
              variant="ghost"
              size="icon"
              leftIcon={Edit}
              onClick={(e) => {
                e.stopPropagation();
                setEditingEmployee(row);
                setIsOpen(true);
              }}
            />
          </Can>
          <Can permission="employees.delete">
            <Button
              variant="danger-ghost"
              size="icon"
              leftIcon={Trash2}
              onClick={(e) => {
                e.stopPropagation();
                setDeletingEmployee(row);
              }}
            />
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
            <Button variant="primary" leftIcon={Plus} onClick={() => { setEditingEmployee(null); setIsOpen(true); }}>
              Add Employee
            </Button>
          </Can>
        }
      />

      <FilterBar 
        filters={filters}
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
        mobileRenderer={mobileRenderer}
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
