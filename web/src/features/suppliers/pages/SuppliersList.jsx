import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createSupplier, getSuppliers, updateSupplier } from "../api";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { FormField } from "../../../components/ui/FormField";
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
        <input {...register("name")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Contact Person" error={errors.contactPerson?.message}>
          <input {...register("contactPerson")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </FormField>
        
        <FormField label="Phone" required error={errors.phone?.message}>
          <input {...register("phone")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Email" error={errors.email?.message}>
          <input {...register("email")} type="email" className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </FormField>
        
        <FormField label="Tax ID / TIN" error={errors.taxId?.message}>
          <input {...register("taxId")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </FormField>
      </div>

      <FormField label="Address" error={errors.address?.message}>
        <input {...register("address")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
      </FormField>

      <FormField label="Notes" error={errors.notes?.message}>
        <textarea {...register("notes")} rows={2} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
      </FormField>

      <FormField label="Status" error={errors.status?.message}>
        <select {...register("status")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Supplier"}</Button>
      </div>
    </form>
  );
};

export const SuppliersList = () => {
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

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["suppliers", params],
    queryFn: () => getSuppliers(params),
  });
  const { items: suppliers, pagination } = unwrapListResponse(data);

  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier created successfully");
      setIsOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to create supplier")),
  });
  
  const updateMutation = useMutation({
    mutationFn: updateSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier updated successfully");
      setIsOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to update supplier")),
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

  if (isLoading) return <LoadingSkeleton variant="default" rowCount={6} showSearch />;
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
        <select
          value={filters.status}
          onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </FilterBar>

      <DataTable 
        columns={columns}
        data={suppliers}
        keyExtractor={(row) => row._id}
        onRowClick={(row) => navigate(`/suppliers/${row._id}`)}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        emptyState={
          <EmptyState
            title="No suppliers found"
            description="Add your first supplier to start managing material purchases."
            actionLabel="New Supplier"
            onAction={() => { setEditingSupplier(null); setIsOpen(true); }}
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
