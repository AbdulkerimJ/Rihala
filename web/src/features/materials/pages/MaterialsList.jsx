import React, { useMemo, useState } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
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
import { FormRootError } from "../../../components/ui/FormRootError";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { applyServerErrors, cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { ACTIVE_INACTIVE_OPTIONS, STATUS_FILTER_OPTIONS } from "../../../constants/options";

const CATEGORIES = [
  "MDF",
  "Wood",
  "Fabric",
  "Nails",
  "Paint",
  "Adhesives",
  "Hardware",
  "Chemicals",
  "Other",
];

const UNITS = [
  { value: "piece", label: "Piece" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "meter", label: "Meter (m)" },
  { value: "liter", label: "Liter (l)" },
  { value: "roll", label: "Roll" },
];

const materialSchema = z.object({
  name: z
    .string({ error: "Material name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: "Category is required" }),
  }),
  unit: z.enum(["piece", "kg", "meter", "liter", "roll"], {
    errorMap: () => ({ message: "Unit of measurement is required" }),
  }),
  status: z.enum(["active", "inactive"]).default("active"),
});

const MaterialForm = ({ initialData, onSubmit, onClose }) => {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(materialSchema),
    defaultValues: initialData || {
      name: "",
      category: "Wood",
      unit: "piece",
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
      <FormField label="Material Name" required error={errors.name?.message}>
        <Input {...register("name")} error={errors.name?.message} placeholder="e.g. Oak Timber" />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Category" required error={errors.category?.message}>
          <Select
            {...register("category")}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            error={errors.category?.message}
          />
        </FormField>
        
        <FormField label="Unit of Measurement" required error={errors.unit?.message}>
          <Select
            {...register("unit")}
            options={UNITS}
            error={errors.unit?.message}
          />
        </FormField>
      </div>

      <FormField label="Status" error={errors.status?.message}>
        <Select
          {...register("status")}
          error={errors.status?.message}
          options={ACTIVE_INACTIVE_OPTIONS}
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

  const params = useMemo(() => cleanFilterParams(filters, { page, limit: 20 }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["materials", params],
    queryFn: () => getMaterials(params),
    placeholderData: keepPreviousData,
  });
  const { items: materials, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["materials"],
    queryFn: getMaterials,
    pagination,
    params,
    page,
  });

  // Extract unique categories for filter
  const categoriesQuery = useQuery({
    queryKey: ["materials", "categories"],
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
