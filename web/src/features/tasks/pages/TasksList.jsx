import { useState, useMemo } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { usePermission } from "../../../hooks/usePermission";
import { useDebounce } from "../../../hooks/useDebounce";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { getTasks, createTask, updateTask, deleteTask } from "../api";
import { getTaskTypes, createTaskType, updateTaskType, deleteTaskType } from "../../task-types/api";
import toast from "react-hot-toast";
import { cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";
import { ErrorState } from "../../../components/ui/ErrorState";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Tabs } from "../../../components/ui/Tabs";
import { FilterBar } from "../../../components/ui/FilterBar";
import { Select } from "../../../components/ui/Select";
import { DataTable } from "../../../components/ui/DataTable";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { TaskForm } from "../components/TaskForm";
import { TaskTypeForm } from "../../task-types/components/TaskTypeForm";



export const TasksList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", isActive: "", taskType: "" }); 
  const debouncedSearch = useDebounce(filters.search, 300);
  
  // Task State
  const [isOpen, setIsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);

  // Task Type State
  const [isTaskTypeModalOpen, setIsTaskTypeModalOpen] = useState(false);
  const [editingTaskType, setEditingTaskType] = useState(null);
  const [deletingTaskType, setDeletingTaskType] = useState(null);

  const { data: taskTypesData } = useQuery({ 
    queryKey: ["task-types", "list"], 
    queryFn: () => getTaskTypes({ limit: 1000 }),
    enabled: can("taskTypes.read")
  });
  const taskTypes = unwrapListResponse(taskTypesData).items || [];

  const params = useMemo(() => cleanFilterParams({ ...filters, search: debouncedSearch }, { page, limit: 20 }), [filters, debouncedSearch, page]);

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

  const createTaskTypeMutation = useMutation({
    mutationFn: createTaskType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-types"] });
      toast.success("Task Type created successfully");
      setIsTaskTypeModalOpen(false);
    },
  });

  const updateTaskTypeMutation = useMutation({
    mutationFn: updateTaskType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-types"] });
      toast.success("Task Type updated successfully");
      setIsTaskTypeModalOpen(false);
    },
  });

  const deleteTaskTypeMutation = useMutation({
    mutationFn: deleteTaskType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-types"] });
      toast.success("Task Type deleted successfully");
      
      // If we deleted the currently selected filter, reset it
      if (filters.taskType === deletingTaskType?._id) {
        setFilters(p => ({ ...p, taskType: "" }));
        setPage(1);
      }
      setDeletingTaskType(null);
    },
    onError: () => setDeletingTaskType(null),
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
        <div className="flex justify-end gap-1">
          <Can permission="tasks.update">
            <Button
              variant="ghost"
              size="icon"
              leftIcon={Edit}
              onClick={(e) => {
                e.stopPropagation();
                setEditingTask(row);
                setIsOpen(true);
              }}
              title="Edit"
            />
          </Can>
          <Can permission="tasks.delete">
            <Button
              variant="danger-ghost"
              size="icon"
              leftIcon={Trash2}
              onClick={(e) => {
                e.stopPropagation();
                setDeletingTask(row);
              }}
              title="Delete"
            />
          </Can>
        </div>
      ) 
    }
  ];

  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load tasks.")} />;

  const taskTabs = [
    { id: "", label: "All Tasks" },
    ...taskTypes.map(tt => ({ id: tt._id, label: tt.name }))
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Manage task definitions and unit prices."
        actions={
          <Can permission="tasks.create">
            <Button onClick={() => { setEditingTask(null); setIsOpen(true); }} leftIcon={Plus}>
              New Task
            </Button>
          </Can>
        }
      />

      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 overflow-x-auto hide-scrollbar pb-1">
          <Tabs 
            tabs={taskTabs} 
            activeTab={filters.taskType} 
            onChange={(id) => { setFilters(p => ({ ...p, taskType: id })); setPage(1); }} 
          />
        </div>
        <Can permission="taskTypes.create">
          <Button variant="ghost" size="sm" leftIcon={Plus} onClick={() => { setEditingTaskType(null); setIsTaskTypeModalOpen(true); }} className="shrink-0 text-secondary hover:text-primary mb-1" title="Add Type">
            <span className="hidden sm:inline-block">Add Type</span>
          </Button>
        </Can>
      </div>

      <FilterBar 
        filters={filters}
        searchPlaceholder="Search tasks..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={Object.values(filters).some(v => v !== "") ? () => { setFilters({ search: "", isActive: "", taskType: "" }); setPage(1); } : undefined}
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
            data={tasks}
            keyExtractor={(row) => row._id}
            mobileRow={(row) => ({
              title: row.name,
              subtitle: row.taskType?.name || "-",
              right: (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold tracking-tight text-primary">
                    <MoneyDisplay amount={row.defaultUnitPrice} />
                  </span>
                  <StatusBadge status={row.isActive ? "active" : "inactive"} className="shrink-0" />
                </div>
              ),
              actions: (
                <>
                  <Can permission="tasks.update">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={Edit}
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
                      variant="danger-ghost"
                      size="sm"
                      leftIcon={Trash2}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingTask(row);
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
                title="No tasks found"
                description={filters.taskType ? "No tasks found for this task type." : "Create a task definition to start assigning work to contractors."}
                actionLabel={can("tasks.create") ? "New Task" : null}
                onAction={can("tasks.create") ? () => { setEditingTask(null); setIsOpen(true); } : undefined}
              />
            }
          />


      {/* Task Modal */}
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
        description={`Are you sure you want to delete "${deletingTask?.name}"? This action cannot be undone. You can only delete tasks that are not associated with any contracts.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteMutation.mutateAsync(deletingTask._id)}
        onCancel={() => setDeletingTask(null)}
        variant="danger"
        isSubmitting={deleteMutation.isPending}
      />

      {/* Task Type Modal */}
      <Modal
        isOpen={isTaskTypeModalOpen}
        title={editingTaskType ? "Edit Task Type" : "New Task Type"}
        onClose={() => setIsTaskTypeModalOpen(false)}
      >
        <TaskTypeForm
          initialData={editingTaskType}
          onClose={() => setIsTaskTypeModalOpen(false)}
          onSubmit={(data) =>
            editingTaskType
              ? updateTaskTypeMutation.mutateAsync({ id: editingTaskType._id, data })
              : createTaskTypeMutation.mutateAsync(data)
          }
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingTaskType}
        title="Delete Task Type"
        description={`Are you sure you want to delete "${deletingTaskType?.name}"? This action cannot be undone. You can only delete task types that are not associated with any tasks.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteTaskTypeMutation.mutateAsync(deletingTaskType._id)}
        onCancel={() => setDeletingTaskType(null)}
        variant="danger"
        isSubmitting={deleteTaskTypeMutation.isPending}
      />
    </div>
  );
};

