import React, { useMemo, useState } from "react";

import { usePermission } from "../../../hooks/usePermission";
import { useDebounce } from "../../../hooks/useDebounce";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPurchase, getPurchases } from "../api";
import { getSuppliers } from "../../suppliers/api";

import { z } from "zod";
import toast from "react-hot-toast";
import { cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";
import { Plus } from "lucide-react";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { ErrorState } from "../../../components/ui/ErrorState";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Can } from "../../../components/Can";
import { Button } from "../../../components/ui/Button";
import { FilterBar } from "../../../components/ui/FilterBar";
import { Select } from "../../../components/ui/Select";
import { Input } from "../../../components/ui/Input";
import { DataTable } from "../../../components/ui/DataTable";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Modal } from "../../../components/ui/Modal";
import { PurchaseForm } from "../components/PurchaseForm";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", supplier: "", paymentStatus: "", from: "", to: "" }); 
  const debouncedSearch = useDebounce(filters.search, 300);
  const [isOpen, setIsOpen] = useState(false);

  React.useEffect(() => {
    if (searchParams.get("action") === "new" && can("purchases.create")) {
      setIsOpen(true);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete("action");
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams, can]);

  const { data: suppliersData } = useQuery({ 
    queryKey: ["suppliers", "list"], 
    queryFn: () => getSuppliers({ limit: 1000 }),
    enabled: can("suppliers.read")
  });
  const suppliers = unwrapListResponse(suppliersData).items || [];

  const params = useMemo(() => cleanFilterParams({ ...filters, search: debouncedSearch }, { page, limit: 20 }), [filters, debouncedSearch, page]);

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
        filters={filters}
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
        mobileRow={(row) => ({
          title: (
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-[10px] font-bold text-secondary uppercase tracking-widest shrink-0">
                {row.purchaseNumber || "-"}
              </span>
              <span className="truncate">{row.supplier?.name || "Unknown"}</span>
            </span>
          ),
          subtitle: `${formatDate(row.date)} • ${row.items?.length || 0} items`,
          right: (
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={row.paymentStatus} className="shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-finance-out tracking-tight shrink-0">
                <MoneyDisplay amount={row.totalAmount} />
              </span>
            </div>
          )
        })}
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
