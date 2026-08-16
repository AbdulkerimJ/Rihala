import React, { useMemo, useState } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createSupplier, getSuppliers, updateSupplier } from "../api";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";

import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { FormRootError } from "../../../components/ui/FormRootError";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { applyServerErrors, cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDateTime } from "../../../utils/formatters";
import { ethiopianPhone } from "../../../utils/validation";
import { ACTIVE_INACTIVE_OPTIONS, STATUS_FILTER_OPTIONS } from "../../../constants/options";

const supplierSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  phone: ethiopianPhone,
  address: z.string().trim().max(255, "Address cannot exceed 255 characters").optional().or(z.literal("")),
  notes: z.string().trim().max(1000, "Notes cannot exceed 1000 characters").optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const SupplierForm = ({ initialData, onSubmit, onClose }) => {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: initialData || {
      name: "",
      phone: "",
      address: "",
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
        <Input {...register("name")} error={errors.name?.message} />
      </FormField>

      <FormField label="Phone" required error={errors.phone?.message}>
        <Input {...register("phone")} error={errors.phone?.message} placeholder="e.g. 0911234567 or +251911234567" />
      </FormField>

      <FormField label="Address" error={errors.address?.message}>
        <Input {...register("address")} error={errors.address?.message} />
      </FormField>

      <FormField label="Notes" error={errors.notes?.message}>
        <Textarea {...register("notes")} rows={2} error={errors.notes?.message} />
      </FormField>

      <FormField label="Status" error={errors.status?.message}>
        <Select
          {...register("status")}
          options={ACTIVE_INACTIVE_OPTIONS}
          error={errors.status?.message}
        />
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting}>Save Supplier</Button>
      </div>
    </form>
  );
};

export const SuppliersList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const params = useMemo(() => cleanFilterParams(filters, { page, limit: 20 }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["suppliers", params],
    queryFn: () => getSuppliers(params),
    placeholderData: keepPreviousData,
    enabled: can("suppliers.read"),
  });
  const { items: suppliers, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
    pagination,
    params,
    page,
  });

  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier created successfully");
      setIsOpen(false);
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: updateSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier updated successfully");
      setIsOpen(false);
    },
  });

  const columns = [
    { header: "Name", accessor: "name", className: "font-medium" },
    { header: "Phone", accessor: "phone", className: "text-secondary" },
    { 
      header: "Balance", 
      accessor: (row) => {
        const bal = row.balance || 0;
        const variant = bal > 0 ? "financeOut" : bal < 0 ? "financeIn" : "default";
        return <MoneyDisplay amount={bal} variant={variant} />;
      }
    },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
    { header: "Created", accessor: (row) => formatDateTime(row.createdAt), className: "text-secondary hidden lg:table-cell", hiddenOnMobile: true },
  ];

  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load suppliers.")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage workshop suppliers and material vendors."
        actions={
          <Can permission="suppliers.create">
            <Button onClick={() => { setEditingSupplier(null); setIsOpen(true); }}>New Supplier</Button>
          </Can>
        }
      />

      <FilterBar 
        searchPlaceholder="Search suppliers..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={filters.search || filters.status ? () => { setFilters({ search: "", status: "" }); setPage(1); } : undefined}
      >
        <Select
          value={filters.status}
          onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          options={STATUS_FILTER_OPTIONS}
        />
      </FilterBar>

      <DataTable 
        columns={columns}
        data={suppliers}
        keyExtractor={(row) => row._id}
        onRowClick={(row) => navigate(`/suppliers/${row._id}`)}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={
          <EmptyState
            title="No suppliers found"
            description="Add your first supplier to start managing material purchases."
            actionLabel={can("suppliers.create") ? "New Supplier" : null}
            onAction={can("suppliers.create") ? () => {  setEditingSupplier(null); setIsOpen(true); } : undefined}
          />
        }
      />

      <Modal isOpen={isOpen} title={editingSupplier ? "Edit Supplier" : "New Supplier"} onClose={() => setIsOpen(false)}>
        <SupplierForm
          initialData={editingSupplier}
          onClose={() => setIsOpen(false)}
          onSubmit={(data) => editingSupplier ? updateMutation.mutateAsync({ id: editingSupplier._id, data }) : createMutation.mutateAsync(data)}
        />
      </Modal>
    </div>
  );
};

