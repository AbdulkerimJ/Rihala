import { usePermission } from "../../../hooks/usePermission";
import { useDebounce } from "../../../hooks/useDebounce";
import { Plus } from "lucide-react";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Can } from "../../../components/Can";
import { createOrder, getOrders, updateOrder } from "../api";
import { getCustomers } from "../../customers/api";
import { getAllowedOrderTransitions, ORDER_STATUS_LABELS } from "../constants";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";

import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Badge } from "../../../components/ui/Badge";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Select } from "../../../components/ui/Select";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { FormRootError } from "../../../components/ui/FormRootError";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { formatDate } from "../../../utils/formatters";
import {
  applyServerErrors,
  cleanFilterParams,
  getApiErrorMessage,
  unwrapListResponse,
} from "../../../utils/apiResponse";

import { OrderForm } from "../components/OrderForm";

export const OrdersList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    customer: "",
    from: "",
    to: "",
    sort: "-expectedCompletionDate",
  }); 
  const [searchParams, setSearchParams] = useSearchParams();
  const debouncedSearch = useDebounce(filters.search, 300);
  const [isOpen, setIsOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  React.useEffect(() => {
    if (searchParams.get("action") === "new" && can("orders.create")) {
      setEditingOrder(null);
      setIsOpen(true);
      // Remove the query param so it doesn't re-trigger on refresh
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete("action");
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams, can]);

  const params = useMemo(() => cleanFilterParams({ ...filters, search: debouncedSearch }, { page, limit: 20 }), [filters, debouncedSearch, page]);

  const ordersQuery = useQuery({
    queryKey: ["orders", params],
    queryFn: () => getOrders(params),
    placeholderData: keepPreviousData,
  });

  const customersQuery = useQuery({
    queryKey: ["customers", "for-orders"],
    queryFn: () => getCustomers({ page: 1, limit: 200 }),
    enabled: can("customers.read")
  });

  const { items: orders, pagination } = unwrapListResponse(ordersQuery.data);
  const customers = unwrapListResponse(customersQuery.data).items || [];

  usePrefetchNextPage({
    queryKey: ["orders"],
    queryFn: getOrders,
    pagination,
    params,
    page,
  });

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Order created successfully");
      setIsOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Order updated successfully");
      setIsOpen(false);
    },
  });

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "",
      customer: "",
      from: "",
      to: "",
      sort: "-expectedCompletionDate",
    });
    setPage(1);
  };

  const columns = [
    {
      header: "Order #",
      accessor: (row) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {row.orderNumber || "-"}
        </span>
      ),
      className: "w-28",
    },
    { header: "Customer", accessor: (row) => row.customer?.name || "-", className: "font-medium" },
    { header: "Description", accessor: (row) => <div className="max-w-[200px] truncate">{row.description || row.items?.[0]?.description || "-"}</div>, className: "text-secondary hidden sm:table-cell" },
    { header: "Amount", accessor: (row) => <MoneyDisplay amount={row.agreedAmount} /> },
    { 
      header: "Payment", 
      accessor: (row) => {
        const isFullyPaid = (row.totalPaid || 0) >= row.agreedAmount;
        const isPartiallyPaid = (row.totalPaid || 0) > 0 && (row.totalPaid || 0) < row.agreedAmount;
        
        const variant = isFullyPaid ? "financeIn" : isPartiallyPaid ? "warning" : "danger";
        const label = isFullyPaid ? "Paid" : isPartiallyPaid ? "Partial" : "Unpaid";

        return (
          <Badge variant={variant} className="uppercase tracking-wider text-[10px]">
            {label}
          </Badge>
        );
      },
      className: "hidden md:table-cell"
    },
    { header: "Expected", accessor: (row) => formatDate(row.expectedCompletionDate), className: "text-secondary hidden md:table-cell" },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> }
  ];

  if (ordersQuery.isError)
    return (
      <ErrorState
        description={getApiErrorMessage(
          ordersQuery.error,
          "Failed to load orders.",
        )}
      />
    );

  const hasActiveFilters = Object.values(filters).some(val => val !== "" && val !== "-expectedCompletionDate");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Track agreed furniture orders and progress through the workshop."
        actions={
          <Can permission="orders.create">
            <Button leftIcon={Plus}
              onClick={() => {
                setEditingOrder(null);
                setIsOpen(true);
              }}
            >
              New Order
            </Button>
          </Can>
        }
      />

      <FilterBar 
        filters={filters}
        searchPlaceholder="Search description..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={hasActiveFilters ? handleClearFilters : undefined}
      >
        <Select
          value={filters.status}
          onChange={(e) => { setFilters((p) => ({ ...p, status: e.target.value })); setPage(1); }}
          placeholder="All statuses"
          options={Object.entries(ORDER_STATUS_LABELS).map(([val, label]) => ({ value: val, label }))}
        />

        <Select
          value={filters.customer}
          onChange={(e) => { setFilters((p) => ({ ...p, customer: e.target.value })); setPage(1); }}
          placeholder="All customers"
          options={customers.map((c) => ({ value: c._id, label: c.name }))}
        />

        <Select
          value={filters.sort}
          onChange={(e) => { setFilters((p) => ({ ...p, sort: e.target.value })); setPage(1); }}
          options={[
            { value: "-expectedCompletionDate", label: "Expected completion (Newest)" },
            { value: "expectedCompletionDate", label: "Expected completion (Oldest)" },
            { value: "-createdAt", label: "Created (Newest)" },
            { value: "createdAt", label: "Created (Oldest)" },
            { value: "-agreedAmount", label: "Amount (High to Low)" },
            { value: "agreedAmount", label: "Amount (Low to High)" },
          ]}
        />
      </FilterBar>

      <DataTable 
        columns={columns}
        data={orders}
        keyExtractor={(row) => row._id}
        onRowClick={(row) => navigate(`/orders/${row._id}`)}
        mobileRow={(row) => ({
          title: (
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-[10px] font-bold text-secondary uppercase tracking-widest shrink-0">
                {row.orderNumber}
              </span>
              <span className="truncate">{row.description || row.items?.[0]?.description || "-"}</span>
            </span>
          ),
          subtitle: `${row.customer?.name || "-"} • Due ${formatDate(row.expectedCompletionDate)}`,
          right: (
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={row.status} className="shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-primary tracking-tight shrink-0">
                <MoneyDisplay amount={row.agreedAmount} />
              </span>
            </div>
          )
        })}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={ordersQuery.isLoading}
        isFetching={ordersQuery.isFetching}
        emptyState={
          <EmptyState
            title="No orders found"
            description="Create the first order for a customer."
            actionLabel={can("orders.create") ? "New Order" : null}
            onAction={can("orders.create") ? () => {  setEditingOrder(null); setIsOpen(true); } : undefined}
          />
        }
      />

      <Modal
        isOpen={isOpen}
        title={editingOrder ? "Edit Order" : "New Order"}
        onClose={() => setIsOpen(false)}
      >
        <OrderForm
          initialData={editingOrder}
          customers={customers}
          onClose={() => setIsOpen(false)}
          onSubmit={(data) =>
            editingOrder
              ? updateMutation.mutateAsync({ id: editingOrder._id, data })
              : createMutation.mutateAsync(data)
          }
        />
      </Modal>
    </div>
  );
};
