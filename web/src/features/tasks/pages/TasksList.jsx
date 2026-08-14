import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { getTasks, createTask, updateTask, deleteTask } from "../api";
import { getTaskTypes } from "../../task-types/api";
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
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { FormRootError } from "../../../components/ui/FormRootError";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { applyServerErrors, cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";

const taskSchema = z.object({
  name: z
    .string({ error: "Task name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  taskType: z.string().min(1, "Task Type is required"),
  defaultUnitPrice: z.coerce.number({ error: "Default unit price is required" }).positive("Unit price must be positive"),
  isActive: z.boolean().default(true),
});

const TaskForm = ({ initialData, onSubmit, onClose }) => {
  const { can } = usePermission();
  const { data: taskTypesData } = useQuery({ 
    queryKey: ["task-types-list"], 
    queryFn: () => getTaskTypes({ limit: 1000, isActive: true }),
    enabled: can("taskTypes.read")
  });
  const taskTypes = unwrapListResponse(taskTypesData).items || [];

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: initialData ? {
      ...initialData,
      taskType: initialData.taskType?._id || initialData.taskType,
    } : {
      name: "",
      taskType: "",
      defaultUnitPrice: "",
      isActive: true,
    },
  });

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />
      <FormField label="Name" required error={errors.name?.message}>
        <Input
          {...register("name")}
          placeholder="e.g. Paint 1 Door"
          error={errors.name?.message}
        />
      </FormField>

      <FormField label="Task Type" required error={errors.taskType?.message}>
        <Select
          {...register("taskType")}
          placeholder="Select a task type"
          options={taskTypes.map(tt => ({ value: tt._id, label: tt.name }))}
          error={errors.taskType?.message}
        />
      </FormField>

      <FormField label="Default Unit Price (ETB)" required error={errors.defaultUnitPrice?.message}>
        <Input
          type="number"
          step="0.01"
          {...register("defaultUnitPrice")}
          placeholder="e.g. 500"
          error={errors.defaultUnitPrice?.message}
        />
      </FormField>

      <div className="pt-2">
        <Checkbox
          id="isActive"
          label="Active"
          {...register("isActive")}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Save Task
        </Button>
      </div>
    </form>
  );
};

export const TasksList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", isActive: "", taskType: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  const { data: taskTypesData } = useQuery({ 
    queryKey: ["task-types-list"], 
    queryFn: () => getTaskTypes({ limit: 1000 }),
    enabled: can("taskTypes.read")
  });
  const taskTypes = unwrapListResponse(taskTypesData).items || [];

  const params = useMemo(() => cleanFilterParams(filters, { page, limit: 20 }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["tasks", params],
    queryFn: () => getTasks(params),
    placeholderData: keepPreviousData,
    enabled: can("tasks.read"),
  });

  const { items: tasks, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["tasks"],
    queryFn: getTasks,
    pagination,
    params,
    page,
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created successfully");
      setIsOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated successfully");
      setIsOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted successfully");
      setDeletingTask(null);
    },
    onError: () => {
      setDeletingTask(null);
    },
  });

  const columns = [
    { header: "Name", accessor: "name", className: "font-medium" },
    { header: "Task Type", accessor: (row) => row.taskType?.name || "-", className: "text-secondary" },
    { header: "Default Price", accessor: (row) => <MoneyDisplay amount={row.defaultUnitPrice} /> },
    { 
      header: "Status", 
      accessor: (row) => <StatusBadge status={row.isActive ? "active" : "inactive"} /> 
    },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          <Can permission="tasks.update">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditingTask(row);
                setIsOpen(true);
              }}
            >
              Edit
            </Button>
          </Can>
          <Can permission="tasks.delete">
            <Button
              variant="ghostDanger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingTask(row);
              }}
            >
              Delete
            </Button>
          </Can>
        </div>
      ) 
    }
  ];

  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load tasks.")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Manage task definitions and unit prices."
        actions={
          <Can permission="tasks.create">
            <Button onClick={() => { setEditingTask(null); setIsOpen(true); }}>
              New Task
            </Button>
          </Can>
        }
      />

      <FilterBar 
        searchPlaceholder="Search tasks..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={Object.values(filters).some(v => v !== "") ? () => { setFilters({ search: "", isActive: "", taskType: "" }); setPage(1); } : undefined}
      >
        <Select
          value={filters.taskType}
          onChange={(e) => { setFilters(p => ({ ...p, taskType: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "All Task Types" },
            ...taskTypes.map(tt => ({ value: tt._id, label: tt.name }))
          ]}
        />
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
        data={tasks}
        keyExtractor={(row) => row._id}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={
          <EmptyState
            title="No tasks found"
            description="Create a task definition to start assigning work to contractors."
            actionLabel={can("tasks.create") ? "New Task" : null}
            onAction={can("tasks.create") ? () => { setEditingTask(null); setIsOpen(true); } : undefined}
          />
        }
      />

      <Modal
        isOpen={isOpen}
        title={editingTask ? "Edit Task" : "New Task"}
        onClose={() => setIsOpen(false)}
      >
        <TaskForm
          initialData={editingTask}
          onClose={() => setIsOpen(false)}
          onSubmit={(data) =>
            editingTask
              ? updateMutation.mutateAsync({ id: editingTask._id, data })
              : createMutation.mutateAsync(data)
          }
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.name}"? This action cannot be undone. You can only delete tasks that are not associated with any contracts.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteMutation.mutateAsync(deletingTask._id)}
        onCancel={() => setDeletingTask(null)}
        isDestructive
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

