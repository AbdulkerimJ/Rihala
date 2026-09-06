import { useMemo, useState } from "react";
import { Plus, Edit, Trash2, UserPlus } from "lucide-react";
import { usePermission } from "../../../hooks/usePermission";
import { useDebounce } from "../../../hooks/useDebounce";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createEmployee, getEmployees, updateEmployee, deleteEmployee } from "../api";

import toast from "react-hot-toast";
import { getApiErrorMessage, unwrapListResponse, cleanFilterParams } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";
import { STATUS_FILTER_OPTIONS } from "../../../constants/options";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Can } from "../../../components/Can";
import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Tabs } from "../../../components/ui/Tabs";
import { FilterBar } from "../../../components/ui/FilterBar";
import { Select } from "../../../components/ui/Select";
import { DataTable } from "../../../components/ui/DataTable";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Modal } from "../../../components/ui/Modal";
import { EmployeeForm } from "../components/EmployeeForm";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
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
                e.preventDefault(); e.stopPropagation();
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
                e.preventDefault(); e.stopPropagation();
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
            <Button leftIcon={Plus} onClick={() => { setEditingEmployee(null); setIsOpen(true); }}>
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
        mobileRow={(row) => ({
          to: `/employees/${row._id}`,
          title: row.name,
          subtitle: `${row.phone || "-"} • Since ${formatDate(row.employmentStartDate)}`,
          right: <StatusBadge status={row.status} />,
          actions: (
            <>
              <Can permission="employees.update">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={Edit}
                  onClick={(e) => {
                    e.preventDefault();
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
                  variant="danger-ghost"
                  size="sm"
                  leftIcon={Trash2}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeletingEmployee(row);
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
            title="No employees found"
            description="Get started by adding your first employee."
            actionLabel={can("employees.create") ? "Add Employee" : null}
            actionIcon={UserPlus}
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
