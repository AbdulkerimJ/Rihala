import React, { useMemo, useState, useEffect } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createMaterial, getMaterials, updateMaterial } from "../api";
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
import { Textarea } from "../../../components/ui/Textarea";
import { Select } from "../../../components/ui/Select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";

const materialSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  category: z.string().optional(),
  unit: z.string().min(1, "Unit of measurement is required"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

const MaterialForm = ({ initialData, onSubmit, onClose }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(materialSchema),
    defaultValues: initialData || {
      name: "",
      category: "",
      unit: "pcs",
      description: "",
      status: "active",
    },
  });

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Material Name" required error={errors.name?.message}>
        <Input {...register("name")} error={errors.name?.message} />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Category" error={errors.category?.message}>
          <Input {...register("category")} placeholder="e.g. Wood, Fabric, Hardware" error={errors.category?.message} />
        </FormField>
        
        <FormField label="Unit of Measurement" required error={errors.unit?.message}>
          <Select
            {...register("unit")}
            error={errors.unit?.message}
            options={[
              { value: "pcs", label: "Pieces (pcs)" },
              { value: "m", label: "Meters (m)" },
              { value: "kg", label: "Kilograms (kg)" },
              { value: "liters", label: "Liters (l)" },
              { value: "rolls", label: "Rolls" },
              { value: "sets", label: "Sets" },
            ]}
          />
        </FormField>
      </div>

      <FormField label="Description" error={errors.description?.message}>
        <Textarea {...register("description")} rows={2} error={errors.description?.message} />
      </FormField>

      <FormField label="Status" error={errors.status?.message}>
        <Select
          {...register("status")}
          error={errors.status?.message}
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting}>Save Material</Button>
      </div>
    </form>
  );
};

export const MaterialsList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "", category: "" });
  const [isOpen, setIsOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  const params = useMemo(() => ({
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    page,
    limit: 20
  }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["materials", params],
    queryFn: () => getMaterials(params),
    placeholderData: keepPreviousData,
  });
  const { items: materials, pagination } = unwrapListResponse(data);

  useEffect(() => {
    if (pagination && pagination.page < pagination.totalPages) {
      const nextParams = { ...params, page: page + 1 };
      queryClient.prefetchQuery({
        queryKey: ["materials", nextParams],
        queryFn: () => getMaterials(nextParams),
      });
    }
  }, [pagination, page, params, queryClient]);

  // Extract unique categories for filter
  const categoriesQuery = useQuery({
    queryKey: ["materials-categories"],
    queryFn: () => getMaterials({ limit: 1000 }),
  });
  const uniqueCategories = useMemo(() => {
    const all = unwrapListResponse(categoriesQuery.data).items || [];
    return [...new Set(all.map(m => m.category).filter(Boolean))].sort();
  }, [categoriesQuery.data]);

  const createMutation = useMutation({
    mutationFn: createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Material created successfully");
      setIsOpen(false);
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: updateMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Material updated successfully");
      setIsOpen(false);
    },
  });

  const columns = [
    { header: "Name", accessor: "name", className: "font-medium" },
    { header: "Category", accessor: (row) => row.category || "-", className: "text-secondary hidden sm:table-cell", hiddenOnMobile: true },
    { header: "Unit", accessor: "unit", className: "text-secondary" },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <Can permission="materials.update">
          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setEditingMaterial(row); setIsOpen(true); }}>
            Edit
          </Button>
        </Can>
      ) 
    }
  ];

  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load materials.")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Materials"
        description="Manage the catalogue of materials used in furniture production."
        actions={
          <Can permission="materials.create">
            <Button onClick={() => { setEditingMaterial(null); setIsOpen(true); }}>New Material</Button>
          </Can>
        }
      />

      <FilterBar 
        searchPlaceholder="Search materials..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={filters.search || filters.status || filters.category ? () => { setFilters({ search: "", status: "", category: "" }); setPage(1); } : undefined}
      >
        <Select
          value={filters.category}
          onChange={(e) => { setFilters(p => ({ ...p, category: e.target.value })); setPage(1); }}
          placeholder="All Categories"
          options={uniqueCategories.map(cat => ({ value: cat, label: cat }))}
        />
        <Select
          value={filters.status}
          onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          placeholder="All Statuses"
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </FilterBar>

      <DataTable 
        columns={columns}
        data={materials}
        keyExtractor={(row) => row._id}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={
          <EmptyState
            title="No materials found"
            description="Add your first material to the catalogue."
            actionLabel={can("materials.create") ? "New Material" : null}
            onAction={can("materials.create") ? () => {  setEditingMaterial(null); setIsOpen(true); } : undefined}
          />
        }
      />

      <Modal isOpen={isOpen} title={editingMaterial ? "Edit Material" : "New Material"} onClose={() => setIsOpen(false)}>
        <MaterialForm
          initialData={editingMaterial}
          onClose={() => setIsOpen(false)}
          onSubmit={(data) => editingMaterial ? updateMutation.mutateAsync({ id: editingMaterial._id, data }) : createMutation.mutateAsync(data)}
        />
      </Modal>
    </div>
  );
};
