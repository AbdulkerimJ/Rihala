import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { usePermission } from "../../../hooks/usePermission";
import { getContracts, createContract } from "../api";
import { getContractors } from "../../contractors/api";
import { getTasks } from "../../tasks/api";
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
import { Textarea } from "../../../components/ui/Textarea";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";

const contractSchema = z.object({
  contractor: z.string().min(1, "Contractor is required"),
  task: z.string().min(1, "Task is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unitPrice: z.coerce.number().positive("Unit price must be positive"),
  contractDate: z.string().min(1, "Contract date is required"),
  expectedCompletionDate: z.string().optional(),
  note: z.string().optional(),
});

const ContractForm = ({ onSubmit, onClose }) => {
  const { can } = usePermission();
  const { data: contractorsData } = useQuery({ 
    queryKey: ["contractors-list"], 
    queryFn: () => getContractors({ limit: 1000, status: "active" }),
    enabled: can("contractors.read")
  });
  const contractors = unwrapListResponse(contractorsData).items || [];

  const { data: tasksData } = useQuery({ 
    queryKey: ["tasks-list"], 
    queryFn: () => getTasks({ limit: 1000, isActive: true }),
    enabled: can("tasks.read")
  });
  const tasks = unwrapListResponse(tasksData).items || [];

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      contractor: "",
      task: "",
      quantity: 1,
      unitPrice: "",
      contractDate: new Date().toISOString().split("T")[0],
      expectedCompletionDate: "",
      note: "",
    },
  });

  const selectedTaskId = watch("task");

  useEffect(() => {
    if (selectedTaskId) {
      const selectedTask = tasks.find(t => t._id === selectedTaskId);
      if (selectedTask) {
        setValue("unitPrice", selectedTask.defaultUnitPrice);
      }
    }
  }, [selectedTaskId, tasks, setValue]);

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Contractor" required error={errors.contractor?.message}>
        <Select
          {...register("contractor")}
          placeholder="Select a contractor"
          options={contractors.map(c => ({ value: c._id, label: c.name }))}
          error={errors.contractor?.message}
        />
      </FormField>

      <FormField label="Task" required error={errors.task?.message}>
        <Select
          {...register("task")}
          placeholder="Select a task"
          options={tasks.map(t => ({ value: t._id, label: `${t.name} (Default: ${t.defaultUnitPrice} ETB)` }))}
          error={errors.task?.message}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Quantity" required error={errors.quantity?.message}>
          <Input
            type="number"
            {...register("quantity")}
            error={errors.quantity?.message}
          />
        </FormField>
        <FormField label="Unit Price (ETB)" required error={errors.unitPrice?.message}>
          <Input
            type="number"
            step="0.01"
            {...register("unitPrice")}
            error={errors.unitPrice?.message}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Contract Date" required error={errors.contractDate?.message}>
          <Input
            type="date"
            {...register("contractDate")}
            error={errors.contractDate?.message}
          />
        </FormField>
        <FormField label="Expected Completion" error={errors.expectedCompletionDate?.message}>
          <Input
            type="date"
            {...register("expectedCompletionDate")}
            error={errors.expectedCompletionDate?.message}
          />
        </FormField>
      </div>

      <FormField label="Note (Optional)" error={errors.note?.message}>
        <Textarea
          {...register("note")}
          rows={2}
          error={errors.note?.message}
        />
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Create Contract
        </Button>
      </div>
    </form>
  );
};

export const ContractsList = () => {
  const { can } = usePermission();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "", contractor: "", task: "" });
  const [isOpen, setIsOpen] = useState(false);

  const { data: contractorsData } = useQuery({ 
    queryKey: ["contractors-list"], 
    queryFn: () => getContractors({ limit: 1000 }),
    enabled: can("contractors.read")
  });
  const contractors = unwrapListResponse(contractorsData).items || [];

  const { data: tasksData } = useQuery({ 
    queryKey: ["tasks-list"], 
    queryFn: () => getTasks({ limit: 1000 }),
    enabled: can("tasks.read")
  });
  const tasks = unwrapListResponse(tasksData).items || [];

  const params = useMemo(() => ({
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "")),
    page,
    limit: 20
  }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["contracts", params],
    queryFn: () => getContracts(params),
    placeholderData: keepPreviousData,
    enabled: can("contracts.read"),
  });

  const { items: contracts, pagination } = unwrapListResponse(data);

  useEffect(() => {
    if (pagination && pagination.page < pagination.totalPages) {
      const nextParams = { ...params, page: page + 1 };
      queryClient.prefetchQuery({
        queryKey: ["contracts", nextParams],
        queryFn: () => getContracts(nextParams),
      });
    }
  }, [pagination, page, params, queryClient]);

  const createMutation = useMutation({
    mutationFn: createContract,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Contract created successfully");
      setIsOpen(false);
      navigate(`/contracts/${data.data.contract._id}`);
    },
  });

  const columns = [
    { header: "Contract No", accessor: "contractNumber", className: "font-mono font-medium text-xs" },
    { header: "Contractor", accessor: (row) => row.contractor?.name || "-", className: "font-medium" },
    { header: "Task", accessor: (row) => row.task?.name || "-", className: "text-secondary hidden sm:table-cell" },
    { header: "Date", accessor: (row) => formatDate(row.contractDate), className: "text-secondary" },
    { header: "Value", accessor: (row) => <MoneyDisplay amount={row.quantity * row.unitPrice} />, className: "font-medium" },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> }
  ];

  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load contracts.")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contracts"
        description="Manage work contracts and monitor their progress."
        actions={
          <Can permission="contracts.create">
            <Button onClick={() => setIsOpen(true)}>
              New Contract
            </Button>
          </Can>
        }
      />

      <FilterBar 
        searchPlaceholder="Search by contract no..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={Object.values(filters).some(v => v !== "") ? () => { setFilters({ search: "", status: "", contractor: "", task: "" }); setPage(1); } : undefined}
      >
        <Select
          value={filters.contractor}
          onChange={(e) => { setFilters(p => ({ ...p, contractor: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "All Contractors" },
            ...contractors.map(c => ({ value: c._id, label: c.name }))
          ]}
        />
        <Select
          value={filters.task}
          onChange={(e) => { setFilters(p => ({ ...p, task: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "All Tasks" },
            ...tasks.map(t => ({ value: t._id, label: t.name }))
          ]}
        />
        <Select
          value={filters.status}
          onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "All Statuses" },
            { value: "ACTIVE", label: "Active" },
            { value: "COMPLETED", label: "Completed" },
            { value: "CANCELLED", label: "Cancelled" },
          ]}
        />
      </FilterBar>

      <DataTable 
        columns={columns}
        data={contracts}
        keyExtractor={(row) => row._id}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        onRowClick={(row) => navigate(`/contracts/${row._id}`)}
        emptyState={
          <EmptyState
            title="No contracts found"
            description="Create a contract to assign a task to a contractor."
            actionLabel={can("contracts.create") ? "New Contract" : null}
            onAction={can("contracts.create") ? () => setIsOpen(true) : undefined}
          />
        }
      />

      <Modal
        isOpen={isOpen}
        title="New Contract"
        onClose={() => setIsOpen(false)}
      >
        <ContractForm
          onClose={() => setIsOpen(false)}
          onSubmit={(data) => createMutation.mutateAsync(data)}
        />
      </Modal>
    </div>
  );
};

