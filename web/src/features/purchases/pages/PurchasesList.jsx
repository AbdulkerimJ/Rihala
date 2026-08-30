import React, { useMemo, useState } from "react";

import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPurchase, getPurchases } from "../api";
import { getSuppliers, createSupplier } from "../../suppliers/api";
import { PurchaseForm } from "../components/PurchaseForm";
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
            <Button variant="primary" leftIcon={Plus} onClick={() => setIsOpen(true)}>Record Purchase</Button>
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
