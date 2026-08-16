import React, { useMemo, useState } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPurchase, getPurchases } from "../api";
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
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { FormRootError } from "../../../components/ui/FormRootError";
import { CurrencyInput } from "../../../components/ui/CurrencyInput";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { applyServerErrors, cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";
import { Plus, Trash2 } from "lucide-react";

const purchaseItemSchema = z.object({
  material: z.string().min(1, "Material is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unitPrice: z.coerce.number().nonnegative("Unit price cannot be negative"),
});

const purchaseSchema = z.object({
  supplier: z.string().min(1, "Supplier is required"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
});

export const PurchaseForm = ({ initialData, onSubmit, onClose, isFullyPaid }) => {
  const { can } = usePermission();
  const { data: suppliersData } = useQuery({ 
    queryKey: ["suppliers", "list", { status: "active" }], 
    queryFn: () => getSuppliers({ limit: 1000, status: "active" }),
    enabled: can("suppliers.read")
  });
  const { data: materialsData } = useQuery({ 
    queryKey: ["materials", "list", { status: "active" }], 
    queryFn: () => getMaterials({ limit: 1000, status: "active" }),
    enabled: can("materials.read")
  });
  
  const suppliers = unwrapListResponse(suppliersData).items || [];
  const materials = unwrapListResponse(materialsData).items || [];

  const { register, control, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: initialData || {
      supplier: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      notes: "",
      items: [{ material: "", quantity: "", unitPrice: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const watchSupplier = watch("supplier");
  const selectedSupplierObj = React.useMemo(() => {
    return suppliers.find((s) => s._id === watchSupplier);
  }, [suppliers, watchSupplier]);

  const totalAmount = watchItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);

  const handleFormSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        date: new Date(data.purchaseDate).toISOString(),
        note: data.notes,
      };
      delete payload.purchaseDate;
      delete payload.notes;
      
      if (isFullyPaid) {
        delete payload.items;
      }

      await onSubmit(payload);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <form className="space-y-4 p-6 overflow-y-auto max-h-[80vh]" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Supplier" required error={errors.supplier?.message}>
          <Select
            {...register("supplier")}
            placeholder="Select a supplier"
            options={suppliers.map(s => ({ value: s._id, label: s.name }))}
            error={errors.supplier?.message}
            disabled={!!initialData}
          />
          {selectedSupplierObj && (
            <p className="text-xs text-secondary mt-1 flex gap-1 items-center">
              Current Balance: 
              <MoneyDisplay 
                amount={selectedSupplierObj.balance || 0} 
                variant={(selectedSupplierObj.balance || 0) > 0 ? "financeOut" : (selectedSupplierObj.balance || 0) < 0 ? "financeIn" : "default"} 
              />
            </p>
          )}
        </FormField>
        
        <FormField label="Purchase Date" required error={errors.purchaseDate?.message}>
          <Input type="date" {...register("purchaseDate")} error={errors.purchaseDate?.message} />
        </FormField>
      </div>

      <div className="pt-4 border-t border-border/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-primary">Purchase Items {isFullyPaid && <span className="text-xs font-normal text-warning ml-2">(Locked - Fully Paid)</span>}</h3>
          {!isFullyPaid && (
            <Button type="button" variant="secondary" size="sm" onClick={() => append({ material: "", quantity: "", unitPrice: "" })}>
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          )}
        </div>
        
        {errors.items?.root && <p className="text-xs text-danger mb-2">{errors.items.root.message}</p>}

        <div className="space-y-3">
          {fields.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-start bg-main/50 p-3 rounded-lg border border-border/50">
              <div className="col-span-12 sm:col-span-5">
                <FormField label="Material" error={errors.items?.[index]?.material?.message}>
                  <Select
                    {...register(`items.${index}.material`)}
                    placeholder="Select material"
                    options={materials.map(m => ({ value: m._id, label: `${m.name} (${m.unit})` }))}
                    error={errors.items?.[index]?.material?.message}
                    disabled={isFullyPaid}
                  />
                </FormField>
              </div>
              <div className="col-span-6 sm:col-span-3">
                <FormField label="Quantity" error={errors.items?.[index]?.quantity?.message}>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Qty"
                    {...register(`items.${index}.quantity`)}
                    error={errors.items?.[index]?.quantity?.message}
                    disabled={isFullyPaid}
                  />
                </FormField>
              </div>
              <div className="col-span-5 sm:col-span-3">
                <FormField label="Unit Price (ETB)" error={errors.items?.[index]?.unitPrice?.message}>
                  <Controller
                    name={`items.${index}.unitPrice`}
                    control={control}
                    render={({ field }) => (
                      <CurrencyInput
                        {...field}
                        placeholder="Unit Price"
                        error={errors.items?.[index]?.unitPrice?.message}
                        disabled={isFullyPaid}
                      />
                    )}
                  />
                </FormField>
              </div>
              <div className="col-span-1 flex justify-end pt-2">
                {fields.length > 1 && !isFullyPaid && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-secondary hover:text-danger p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end items-center gap-2 mt-4 pt-3 border-t border-border/50">
          <span className="text-sm font-medium text-secondary">Total:</span>
          <span className="text-lg font-bold text-accent"><MoneyDisplay amount={totalAmount} /></span>
        </div>
      </div>

      <FormField label="Notes" error={errors.notes?.message}>
        <Textarea {...register("notes")} rows={2} error={errors.notes?.message} placeholder="Optional purchase notes" />
      </FormField>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting}>Save Purchase</Button>
      </div>
    </form>
  );
};

export const PurchasesList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", supplier: "", paymentStatus: "", from: "", to: "" });
  const [isOpen, setIsOpen] = useState(false);

  const { data: suppliersData } = useQuery({ 
    queryKey: ["suppliers", "list"], 
    queryFn: () => getSuppliers({ limit: 1000 }),
    enabled: can("suppliers.read")
  });
  const suppliers = unwrapListResponse(suppliersData).items || [];

  const params = useMemo(() => cleanFilterParams(filters, { page, limit: 20 }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["purchases", params],
    queryFn: () => getPurchases(params),
    placeholderData: keepPreviousData,
    enabled: can("purchases.read"),
  });
  const { items: purchases, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["purchases"],
    queryFn: getPurchases,
    pagination,
    params,
    page,
  });

  const createMutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] }); // Purchase changes supplier balance
      toast.success("Purchase recorded successfully");
      setIsOpen(false);
    },
  });

  const columns = [
    { header: "Purchase Number", accessor: (row) => row.purchaseNumber || "-", className: "font-mono font-medium text-xs" },
    { header: "Supplier", accessor: (row) => row.supplier?.name || "Unknown", className: "font-medium" },
    { header: "Date", accessor: (row) => formatDate(row.date), className: "text-secondary hidden sm:table-cell" },
    { header: "Total Amount", accessor: (row) => <MoneyDisplay amount={row.totalAmount} variant="financeOut" /> },
    { header: "Status", accessor: (row) => <StatusBadge status={row.paymentStatus} /> },
    { 
      header: "Items", 
      accessor: (row) => {
        if (!row.items?.length) return "-";
        const names = row.items.map(item => item.materialName).filter(Boolean);
        if (names.length <= 3) return names.join(", ");
        return `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
      }, 
      className: "text-secondary hidden md:table-cell", 
      hiddenOnMobile: true 
    },
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
        onClear={filters.search || filters.supplier || filters.paymentStatus || filters.from || filters.to ? () => { setFilters({ search: "", supplier: "", paymentStatus: "", from: "", to: "" }); setPage(1); } : undefined}
      >
        <Select
          value={filters.supplier}
          onChange={(e) => { setFilters(p => ({ ...p, supplier: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "All Suppliers" },
            ...suppliers.map(s => ({ value: s._id, label: s.name }))
          ]}
        />
        <Select
          value={filters.paymentStatus}
          onChange={(e) => { setFilters(p => ({ ...p, paymentStatus: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "All Statuses" },
            { value: "UNPAID", label: "Unpaid" },
            { value: "PARTIALLY_PAID", label: "Partially Paid" },
            { value: "PAID", label: "Paid" },
          ]}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-secondary font-medium">From:</span>
          <Input
            type="date"
            value={filters.from}
            onChange={(e) => { setFilters(p => ({ ...p, from: e.target.value })); setPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-secondary font-medium">To:</span>
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => { setFilters(p => ({ ...p, to: e.target.value })); setPage(1); }}
          />
        </div>
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

