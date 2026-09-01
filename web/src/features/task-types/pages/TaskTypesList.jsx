import React, { useState, useMemo } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { usePermission } from "../../../hooks/usePermission";
import { useDebounce } from "../../../hooks/useDebounce";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { getTaskTypes, createTaskType, updateTaskType, deleteTaskType } from "../api";
import { TaskTypeForm } from "../components/TaskTypeForm";
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
import { Checkbox } from "../../../components/ui/Checkbox";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { FormRootError } from "../../../components/ui/FormRootError";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { applyServerErrors, cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDateTime } from "../../../utils/formatters";



export const TaskTypesList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", isActive: "" }); 
  const debouncedSearch = useDebounce(filters.search, 300);
  const [isOpen, setIsOpen] = useState(false);
  const [editingTaskType, setEditingTaskType] = useState(null);
  const [deletingTaskType, setDeletingTaskType] = useState(null);

  const params = useMemo(() => cleanFilterParams({ ...filters, search: debouncedSearch }, { page, limit: 20 }), [filters, debouncedSearch, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["task-types", params],
    queryFn: () => getTaskTypes(params),
    placeholderData: keepPreviousData,
    enabled: can("taskTypes.read"),
  });

  const { items: taskTypes, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["task-types"],
    queryFn: getTaskTypes,
    pagination,
    params,
    page,
  });

  const createMutation = useMutation({
    mutationFn: createTaskType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-types"] });
      toast.success("Task Type created successfully");
      setIsOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTaskType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-types"] });
      toast.success("Task Type updated successfully");
      setIsOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTaskType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-types"] });
      toast.success("Task Type deleted successfully");
      setDeletingTaskType(null);
    },
    onError: () => {
      setDeletingTaskType(null);
    },
  });

  const columns = [
    { header: "Name", accessor: "name", className: "font-medium" },
    { 
      header: "Status", 
      accessor: (row) => <StatusBadge status={row.isActive ? "active" : "inactive"} /> 
    },
    { header: "Created", accessor: (row) => formatDateTime(row.createdAt), className: "text-secondary hidden md:table-cell" },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end gap-1">
          <Can permission="taskTypes.update">
            <Button
              variant="ghost"
              size="icon"
              leftIcon={Edit}
              onClick={(e) => {
                e.stopPropagation();
                setEditingTaskType(row);
                setIsOpen(true);
              }}
              title="Edit"
            />
          </Can>
          <Can permission="taskTypes.delete">
            <Button
              variant="danger-ghost"
              size="icon"
              leftIcon={Trash2}
              onClick={(e) => {
                e.stopPropagation();
                setDeletingTaskType(row);
              }}
              title="Delete"
            />
          </Can>
        </div>
      ) 
    }
  ];

  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load task types.")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Types"
        description="Manage the configurable categories of work."
        actions={
          <Can permission="taskTypes.create">
            <Button variant="primary" leftIcon={Plus} onClick={() => { setEditingTaskType(null); setIsOpen(true); }}>
              New Task Type
            </Button>
          </Can>
        }
      />

      <FilterBar 
        filters={filters}
        searchPlaceholder="Search task types..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={(filters.search || filters.isActive !== "") ? () => { setFilters({ search: "", isActive: "" }); setPage(1); } : undefined}
      >
        <Select
          value={filters.isActive}
          onChange={(e) => { setFilters(p => ({ ...p, isActive: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "All Statuses" },
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ]}
        />
      </FilterBar>

      <DataTable 
        columns={columns}
        data={taskTypes}
        keyExtractor={(row) => row._id}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={
          <EmptyState
            title="No task types found"
            description="Create task types to organize and categorize your workshop tasks, such as production, finishing, painting, or other types you define."
            actionLabel={can("taskTypes.create") ? "New Task Type" : null}
            onAction={can("taskTypes.create") ? () => { setEditingTaskType(null); setIsOpen(true); } : undefined}
          />
        }
      />

      <Modal
        isOpen={isOpen}
        title={editingTaskType ? "Edit Task Type" : "New Task Type"}
        onClose={() => setIsOpen(false)}
      >
        <TaskTypeForm
          initialData={editingTaskType}
          onClose={() => setIsOpen(false)}
          onSubmit={(data) =>
            editingTaskType
              ? updateMutation.mutateAsync({ id: editingTaskType._id, data })
              : createMutation.mutateAsync(data)
          }
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingTaskType}
        title="Delete Task Type"
        description={`Are you sure you want to delete "${deletingTaskType?.name}"? This action cannot be undone. You can only delete task types that are not in use by any tasks.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteMutation.mutateAsync(deletingTaskType._id)}
        onCancel={() => setDeletingTaskType(null)}
        variant="danger"
        isSubmitting={deleteMutation.isPending}
      />
    </div>
  );
};

