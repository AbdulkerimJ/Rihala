import React, { useMemo, useState, useEffect } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPurchase, getPurchases, updatePurchase } from "../api";
import { getSuppliers } from "../../suppliers/api";
import { getMaterials } from "../../materials/api";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";

import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { FormField } from "../../../components/ui/FormField";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDateTime, formatDate } from "../../../utils/formatters";
import { Plus, Trash2 } from "lucide-react";

const purchaseItemSchema = z.object({
  material: z.string().min(1, "Material is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unitPrice: z.coerce.number().nonnegative("Unit price cannot be negative"),
});

const purchaseSchema = z.object({
  supplier: z.string().min(1, "Supplier is required"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
});

const PurchaseForm = ({ initialData, onSubmit, onClose }) => {
  const { data: suppliersData } = useQuery({ queryKey: ["suppliers-list"], queryFn: () => getSuppliers({ limit: 1000 }) });
  const { data: materialsData } = useQuery({ queryKey: ["materials-list"], queryFn: () => getMaterials({ limit: 1000 }) });
  
  const suppliers = unwrapListResponse(suppliersData).items || [];
  const materials = unwrapListResponse(materialsData).items || [];

  const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: initialData || {
      supplier: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      referenceNumber: "",
      notes: "",
      items: [{ material: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const totalAmount = watchItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);

  return (
    <form className="space-y-4 p-6 overflow-y-auto max-h-[80vh]" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Supplier" required error={errors.supplier?.message}>
          <select {...register("supplier")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent">
            <option value="">Select a supplier</option>
            {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </FormField>
        
        <FormField label="Purchase Date" required error={errors.purchaseDate?.message}>
          <input type="date" {...register("purchaseDate")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Reference Number" error={errors.referenceNumber?.message}>
          <input {...register("referenceNumber")} placeholder="e.g. INV-12345" className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        </FormField>
      </div>

      <div className="pt-4 border-t border-border/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-primary">Purchase Items</h3>
          <Button type="button" variant="secondary" size="sm" onClick={() => append({ material: "", quantity: 1, unitPrice: 0 })}>
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        </div>
        
        {errors.items?.root && <p className="text-xs text-danger mb-2">{errors.items.root.message}</p>}

        <div className="space-y-3">
          {fields.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-start bg-main/50 p-3 rounded-lg border border-border/50">
              <div className="col-span-12 sm:col-span-5">
                <FormField error={errors.items?.[index]?.material?.message}>
                  <select {...register(`items.${index}.material`)} className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent">
                    <option value="">Select material</option>
                    {materials.map(m => <option key={m._id} value={m._id}>{m.name} ({m.unit})</option>)}
                  </select>
                </FormField>
              </div>
              <div className="col-span-5 sm:col-span-2">
                <FormField error={errors.items?.[index]?.quantity?.message}>
                  <input type="number" step="0.01" placeholder="Qty" {...register(`items.${index}.quantity`)} className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
                </FormField>
              </div>
              <div className="col-span-5 sm:col-span-3">
                <FormField error={errors.items?.[index]?.unitPrice?.message}>
                  <input type="number" step="0.01" placeholder="Price" {...register(`items.${index}.unitPrice`)} className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
                </FormField>
              </div>
              <div className="col-span-2 sm:col-span-2 flex justify-end">
                <Button type="button" variant="ghostDanger" size="icon" onClick={() => remove(index)} disabled={fields.length === 1} className="h-[34px] w-[34px]">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4 px-2">
          <div className="text-sm text-secondary">Total Amount: <span className="text-lg font-bold text-primary ml-2"><MoneyDisplay amount={totalAmount} /></span></div>
        </div>
      </div>

      <FormField label="Notes" error={errors.notes?.message}>
        <textarea {...register("notes")} rows={2} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Purchase"}</Button>
      </div>
    </form>
  );
};

export const PurchasesList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", supplier: "", from: "", to: "" });
  const [isOpen, setIsOpen] = useState(false);

  const { data: suppliersData } = useQuery({ queryKey: ["suppliers-list"], queryFn: () => getSuppliers({ limit: 1000 }) });
  const suppliers = unwrapListResponse(suppliersData).items || [];

  const params = useMemo(() => ({
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    page,
    limit: 20
  }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["purchases", params],
    queryFn: () => getPurchases(params),
    placeholderData: keepPreviousData,
  });
  const { items: purchases, pagination } = unwrapListResponse(data);

  useEffect(() => {
    if (pagination && pagination.page < pagination.totalPages) {
      const nextParams = { ...params, page: page + 1 };
      queryClient.prefetchQuery({
        queryKey: ["purchases", nextParams],
        queryFn: () => getPurchases(nextParams),
      });
    }
  }, [pagination, page, params, queryClient]);

  const createMutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast.success("Purchase recorded successfully");
      setIsOpen(false);
    },
  });

  const columns = [
    { header: "Purchase Number", accessor: (row) => row.purchaseNumber || "-", className: "font-mono font-medium text-xs" },
    { header: "Supplier", accessor: (row) => row.supplier?.name || "Unknown", className: "font-medium" },
    { header: "Date", accessor: (row) => formatDate(row.purchaseDate), className: "text-secondary hidden sm:table-cell" },
    { header: "Total Amount", accessor: (row) => <MoneyDisplay amount={row.totalAmount} variant="accent" /> },
    { header: "Items", accessor: (row) => `${row.items?.length || 0} items`, className: "text-secondary hidden md:table-cell", hiddenOnMobile: true },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/purchases/${row._id}`); }}>
          View Details
        </Button>
      ) 
    }
  ];


  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load purchases.")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchases"
        description="Record and track material purchases from suppliers."
        actions={
          <Can permission="purchases.create">
            <Button onClick={() => setIsOpen(true)}>Record Purchase</Button>
          </Can>
        }
      />

      <FilterBar 
        searchPlaceholder="Search by number or reference..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={filters.search || filters.supplier || filters.from || filters.to ? () => { setFilters({ search: "", supplier: "", from: "", to: "" }); setPage(1); } : undefined}
      >
        <select
          value={filters.supplier}
          onChange={(e) => { setFilters(p => ({ ...p, supplier: e.target.value })); setPage(1); }}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All Suppliers</option>
          {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => { setFilters(p => ({ ...p, from: e.target.value })); setPage(1); }}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => { setFilters(p => ({ ...p, to: e.target.value })); setPage(1); }}
          className="w-full rounded-md border border-border bg-main px-3 py-2 text-sm text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </FilterBar>

      <DataTable 
        columns={columns}
        data={purchases}
        keyExtractor={(row) => row._id}
        onRowClick={(row) => navigate(`/purchases/${row._id}`)}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={
          <EmptyState
            title="No purchases found"
            description="Record your first material purchase."
            actionLabel={can("purchases.create") ? "Record Purchase" : null}
            onAction={can("purchases.create") ? () => setIsOpen(true) : undefined}
          />
        }
      />

      <Modal isOpen={isOpen} title="Record Purchase" onClose={() => setIsOpen(false)}>
        <PurchaseForm
          onClose={() => setIsOpen(false)}
          onSubmit={(data) => createMutation.mutateAsync(data)}
        />
      </Modal>
    </div>
  );
};
