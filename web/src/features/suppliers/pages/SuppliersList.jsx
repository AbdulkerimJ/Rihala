import React, { useMemo, useState, useEffect } from "react";
import { usePermission } from "../../../hooks/usePermission";
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
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDateTime } from "../../../utils/formatters";

const supplierSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contactPerson: z.string().optional(),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

const SupplierForm = ({ initialData, onSubmit, onClose }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: initialData || {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      taxId: "",
      notes: "",
      status: "active",
    },
  });

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Company Name" required error={errors.name?.message}>
        <Input {...register("name")} error={errors.name?.message} />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Contact Person" error={errors.contactPerson?.message}>
          <Input {...register("contactPerson")} error={errors.contactPerson?.message} />
        </FormField>
        
        <FormField label="Phone" required error={errors.phone?.message}>
          <Input {...register("phone")} error={errors.phone?.message} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Email" error={errors.email?.message}>
          <Input {...register("email")} type="email" error={errors.email?.message} />
        </FormField>
        
        <FormField label="Tax ID / TIN" error={errors.taxId?.message}>
          <Input {...register("taxId")} error={errors.taxId?.message} />
        </FormField>
      </div>

      <FormField label="Address" error={errors.address?.message}>
        <Input {...register("address")} error={errors.address?.message} />
      </FormField>

      <FormField label="Notes" error={errors.notes?.message}>
        <Textarea {...register("notes")} rows={2} error={errors.notes?.message} />
      </FormField>

      <FormField label="Status" error={errors.status?.message}>
        <Select
          {...register("status")}
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
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

  const params = useMemo(() => ({
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    page,
    limit: 20
  }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["suppliers", params],
    queryFn: () => getSuppliers(params),
    placeholderData: keepPreviousData,
    enabled: can("suppliers.read"),
  });
  const { items: suppliers, pagination } = unwrapListResponse(data);

  useEffect(() => {
    if (pagination && pagination.page < pagination.totalPages) {
      const nextParams = { ...params, page: page + 1 };
      queryClient.prefetchQuery({
        queryKey: ["suppliers", nextParams],
        queryFn: () => getSuppliers(nextParams),
      });
    }
  }, [pagination, page, params, queryClient]);

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
    { header: "Contact", accessor: (row) => row.contactPerson || "-", className: "text-secondary hidden md:table-cell", hiddenOnMobile: true },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
    { header: "Created", accessor: (row) => formatDateTime(row.createdAt), className: "text-secondary hidden lg:table-cell", hiddenOnMobile: true },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/suppliers/${row._id}`); }}>
            View
          </Button>
          <Can permission="suppliers.update">
            <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setEditingSupplier(row); setIsOpen(true); }}>
              Edit
            </Button>
          </Can>
        </div>
      ) 
    }
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
          options={[
            { value: "", label: "All Statuses" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
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

