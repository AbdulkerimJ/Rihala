import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { getContractors, createContractor, updateContractor, deleteContractor } from "../api";
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
import { Textarea } from "../../../components/ui/Textarea";
import { Select } from "../../../components/ui/Select";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { FormRootError } from "../../../components/ui/FormRootError";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { applyServerErrors, cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDateTime } from "../../../utils/formatters";
import { ACTIVE_INACTIVE_OPTIONS, STATUS_FILTER_OPTIONS } from "../../../constants/options";

const contractorSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  phone: z
    .string({ error: "Phone number is required." })
    .trim()
    .min(1, "Phone number is required.")
    .max(20, "Phone cannot exceed 20 characters"),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const ContractorForm = ({ initialData, onSubmit, onClose }) => {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(contractorSchema),
    defaultValues: initialData || {
      name: "",
      phone: "",
      notes: "",
      status: "active",
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
          error={errors.name?.message}
          placeholder="e.g. Ali Ahmed"
        />
      </FormField>

      <FormField label="Phone" required error={errors.phone?.message}>
        <Input
          {...register("phone")}
          error={errors.phone?.message}
          placeholder="e.g. 0911234567 or +251911234567"
        />
      </FormField>

      <FormField label="Notes" error={errors.notes?.message}>
        <Textarea
          {...register("notes")}
          rows={3}
          error={errors.notes?.message}
          placeholder="Optional notes"
        />
      </FormField>

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
          Save Contractor
        </Button>
      </div>
    </form>
  );
};

export const ContractorsList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState(null);
  const [deletingContractor, setDeletingContractor] = useState(null);

  const params = useMemo(() => cleanFilterParams(filters, { page, limit: 20 }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["contractors", params],
    queryFn: () => getContractors(params),
    placeholderData: keepPreviousData,
  });

  const { items: contractors, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["contractors"],
    queryFn: getContractors,
    pagination,
    params,
    page,
  });

  const createMutation = useMutation({
    mutationFn: createContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      toast.success("Contractor created successfully");
      setIsOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      toast.success("Contractor updated successfully");
      setIsOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      toast.success("Contractor deleted successfully");
      setDeletingContractor(null);
    },
    onError: () => {
      setDeletingContractor(null);
    },
  });

  const columns = [
    { header: "Name", accessor: "name", className: "font-medium" },
    { header: "Phone", accessor: (row) => row.phone || "-", className: "text-secondary" },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
    { header: "Created", accessor: (row) => formatDateTime(row.createdAt), className: "text-secondary hidden md:table-cell" },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          <Can permission="contractors.update">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setEditingContractor(row);
                setIsOpen(true);
              }}
            >
              Edit
            </Button>
          </Can>
          <Can permission="contractors.delete">
            <Button
              variant="ghostDanger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingContractor(row);
              }}
            >
              Delete
            </Button>
          </Can>
        </div>
      ) 
    }
  ];

  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load contractors.")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contractors"
        description="Manage independent contractors."
        actions={
          <Can permission="contractors.create">
            <Button onClick={() => { setEditingContractor(null); setIsOpen(true); }}>
              New Contractor
            </Button>
          </Can>
        }
      />

      <FilterBar 
        searchPlaceholder="Search contractors..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={(filters.search || filters.status !== "") ? () => { setFilters({ search: "", status: "" }); setPage(1); } : undefined}
      >
        <Select
          value={filters.status}
          onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          options={STATUS_FILTER_OPTIONS}
        />
      </FilterBar>

      <DataTable 
        columns={columns}
        data={contractors}
        keyExtractor={(row) => row._id}
        onRowClick={(row) => navigate(`/contractors/${row._id}`)}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        mobileRenderer={(row) => (
          <div className="flex flex-col gap-2.5 p-4" onClick={() => navigate(`/contractors/${row._id}`)}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-sm uppercase">
                  {row.name.charAt(0)}
                </div>
                <span className="font-semibold text-primary">{row.name}</span>
              </div>
              <StatusBadge status={row.status} />
            </div>
            
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">Phone</span>
                <span className="text-sm text-secondary font-medium">{row.phone || "No phone"}</span>
              </div>
            </div>
          </div>
        )}
        emptyState={
          <EmptyState
            title="No contractors found"
            description="Create a contractor to start assigning tasks."
            actionLabel={can("contractors.create") ? "New Contractor" : null}
            onAction={can("contractors.create") ? () => { setEditingContractor(null); setIsOpen(true); } : undefined}
          />
        }
      />

      <Modal
        isOpen={isOpen}
        title={editingContractor ? "Edit Contractor" : "New Contractor"}
        onClose={() => setIsOpen(false)}
      >
        <ContractorForm
          initialData={editingContractor}
          onClose={() => setIsOpen(false)}
          onSubmit={(data) =>
            editingContractor
              ? updateMutation.mutateAsync({ id: editingContractor._id, data })
              : createMutation.mutateAsync(data)
          }
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingContractor}
        title="Delete Contractor"
        description={`Are you sure you want to delete "${deletingContractor?.name}"? This action cannot be undone. You can only delete contractors that have no associated contracts.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => deleteMutation.mutateAsync(deletingContractor._id)}
        onCancel={() => setDeletingContractor(null)}
        variant="danger"
        isSubmitting={deleteMutation.isPending}
      />
    </div>
  );
};
