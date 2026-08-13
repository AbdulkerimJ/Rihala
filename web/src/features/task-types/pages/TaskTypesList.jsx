import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { usePermission } from "../../../hooks/usePermission";
import { getTaskTypes, createTaskType, updateTaskType, deleteTaskType } from "../api";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { FormField } from "../../../components/ui/FormField";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDateTime } from "../../../utils/formatters";

const taskTypeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  isActive: z.boolean().default(true),
});

const TaskTypeForm = ({ initialData, onSubmit, onClose }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(taskTypeSchema),
    defaultValues: initialData || {
      name: "",
      isActive: true,
    },
  });

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Name" required error={errors.name?.message}>
        <input
          {...register("name")}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="e.g. Painting, Finishing"
        />
      </FormField>

      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id="isActive"
          {...register("isActive")}
          className="h-4 w-4 rounded border-border text-accent focus:ring-accent bg-main"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-primary">
          Active
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Task Type"}
        </Button>
      </div>
    </form>
  );
};

export const TaskTypesList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", isActive: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [editingTaskType, setEditingTaskType] = useState(null);
  const [deletingTaskType, setDeletingTaskType] = useState(null);

  const params = useMemo(() => ({
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "")),
    page,
    limit: 20
  }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["task-types", params],
    queryFn: () => getTaskTypes(params),
    placeholderData: keepPreviousData,
  });

  const { items: taskTypes, pagination } = unwrapListResponse(data);

  useEffect(() => {
    if (pagination && pagination.page < pagination.totalPages) {
      const nextParams = { ...params, page: page + 1 };
      queryClient.prefetchQuery({
        queryKey: ["task-types", nextParams],
        queryFn: () => getTaskTypes(nextParams),
      });
    }
  }, [pagination, page, params, queryClient]);

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
        <div className="flex justify-end gap-2">
          <Can permission="taskTypes.update">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditingTaskType(row);
                setIsOpen(true);
              }}
            >
              Edit
            </Button>
          </Can>
          <Can permission="taskTypes.delete">
            <Button
              variant="ghostDanger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingTaskType(row);
              }}
            >
              Delete
            </Button>
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
            <Button onClick={() => { setEditingTaskType(null); setIsOpen(true); }}>
              New Task Type
            </Button>
          </Can>
        }
      />

      <FilterBar 
        searchPlaceholder="Search task types..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={(filters.search || filters.isActive !== "") ? () => { setFilters({ search: "", isActive: "" }); setPage(1); } : undefined}
      >
        <select
          value={filters.isActive}
          onChange={(e) => { setFilters(p => ({ ...p, isActive: e.target.value })); setPage(1); }}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
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
            description="Create a task type to start categorizing tasks."
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
        message={`Are you sure you want to delete "${deletingTaskType?.name}"? This action cannot be undone. You can only delete task types that are not in use by any tasks.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteMutation.mutateAsync(deletingTaskType._id)}
        onCancel={() => setDeletingTaskType(null)}
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
