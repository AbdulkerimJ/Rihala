import React, { useMemo, useState } from "react";
import { CreditCard } from "lucide-react";
import { usePermission } from "../../../hooks/usePermission";
import { useDebounce } from "../../../hooks/useDebounce";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createCustomerPayment, getCustomerPayments } from "../api";
import { getCustomers } from "../../customers/api";

import toast from "react-hot-toast";
import { cleanFilterParams, unwrapListResponse, getApiErrorMessage } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";
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
import { CustomerPaymentModal } from "../components/CustomerPaymentModal";
import { PaymentDetailsModal } from "../../../components/ui/PaymentDetailsModal";

export const CustomerPaymentsList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [filters, setFilters] = useState({ search: "", customer: "", status: "", from: "", to: "", sort: "-paymentDate" }); 
  const debouncedSearch = useDebounce(filters.search, 300);
  const [isOpen, setIsOpen] = useState(false);

  React.useEffect(() => {
    if (searchParams.get("action") === "new" && can("customerPayments.create")) {
      setIsOpen(true);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete("action");
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams, can]);

  const { data: customersData } = useQuery({ 
    queryKey: ["customers", "list"], 
    queryFn: () => getCustomers({ limit: 1000 }),
    enabled: can("customers.read")
  });
  const customers = unwrapListResponse(customersData).items || [];

  const params = useMemo(() => cleanFilterParams({ ...filters, search: debouncedSearch }, { page, limit: 20 }), [filters, debouncedSearch, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["customer-payments", params],
    queryFn: () => getCustomerPayments(params),
    placeholderData: keepPreviousData,
    enabled: can("customerPayments.read"),
  });
  const { items: payments, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["customer-payments"],
    queryFn: getCustomerPayments,
    pagination,
    params,
    page,
  });

  const createMutation = useMutation({
    mutationFn: createCustomerPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-payments"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] }); // Balance changed
      queryClient.invalidateQueries({ queryKey: ["orders"] }); // Paid amount changed
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Payment recorded successfully");
      setIsOpen(false);
    },
  });

  const columns = [
    { header: "Order #", accessor: (row) => <span className="font-mono text-xs font-medium text-primary">{row.orderNumber || (row.order?.orderNumber) || "-"}</span> },
    { header: "Customer", accessor: (row) => row.customerName || row.order?.customerName || row.order?.customer?.name || row.customer?.name || "Unknown", className: "font-medium text-primary" },
    { header: "Date", accessor: (row) => formatDate(row.paymentDate), className: "text-secondary font-medium" },
    { header: "Amount", accessor: (row) => <MoneyDisplay amount={row.amount} className={row.status === 'voided' ? 'line-through opacity-50' : ''} /> },
    { 
      header: "Status", 
      accessor: (row) => <StatusBadge status={row.status} />
    }
  ];

  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load payments.")} />;

  const hasActiveFilters = Object.values(filters).some(val => val !== "" && val !== "-paymentDate");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Payments"
        description="Record and track payments received from customers."
        actions={
          <Can permission="customerPayments.create">
            <Button leftIcon={CreditCard} onClick={() => setIsOpen(true)}>Receive Payment</Button>
          </Can>
        }
      />

      <FilterBar 
        filters={filters}
        searchPlaceholder="Search by receipt or ref..."
        searchValue={filters.search}
        onSearchChange={(val) => { setFilters(p => ({ ...p, search: val })); setPage(1); }}
        onClear={hasActiveFilters ? () => { setFilters({ search: "", customer: "", status: "", from: "", to: "", sort: "-paymentDate" }); setPage(1); } : undefined}
      >
        <Select
          value={filters.customer}
          onChange={(e) => { setFilters(p => ({ ...p, customer: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "All Customers" },
            ...customers.map(c => ({ value: c._id, label: c.name }))
          ]}
        />
        <Select
          value={filters.status}
          onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "Active" },
            { value: "voided", label: "Voided" },
            { value: "all", label: "All Statuses" },
          ]}
        />
        <Select
          value={filters.sort}
          onChange={(e) => { setFilters(p => ({ ...p, sort: e.target.value })); setPage(1); }}
          options={[
            { value: "-createdAt", label: "Created (Newest)" },
            { value: "createdAt", label: "Created (Oldest)" },
            { value: "-paymentDate", label: "Payment Date (Newest)" },
            { value: "paymentDate", label: "Payment Date (Oldest)" },
            { value: "-amount", label: "Amount (High to Low)" },
            { value: "amount", label: "Amount (Low to High)" },
          ]}
        />
        <Input
          type="date"
          value={filters.from || ""}
          onChange={(e) => { setFilters(p => ({ ...p, from: e.target.value })); setPage(1); }}
          placeholder="From Date"
        />
        <Input
          type="date"
          value={filters.to || ""}
          onChange={(e) => { setFilters(p => ({ ...p, to: e.target.value })); setPage(1); }}
          placeholder="To Date"
        />
      </FilterBar>

      <DataTable 
        columns={columns}
        data={payments}
        keyExtractor={(row) => row._id}
        onRowClick={(row) => setSelectedPayment(row)}
        mobileRow={(row) => ({
          title: row.customerName || row.order?.customerName || row.order?.customer?.name || row.customer?.name || "Unknown",
          subtitle: `${row.orderNumber || row.order?.orderNumber ? `Order #${row.orderNumber || row.order?.orderNumber}` : "Receipt"} • ${formatDate(row.paymentDate)}`,
          right: (
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-bold text-finance-in ${row.status === 'voided' ? 'line-through opacity-50 text-secondary' : ''}`}>
                +<MoneyDisplay amount={row.amount} className="text-inherit font-bold" />
              </span>
              <StatusBadge status={row.status} />
            </div>
          )
        })}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={
          <EmptyState
            title="No payments found"
            description="Record a payment received from a customer."
            actionLabel={can("customerPayments.create") ? "Receive Payment" : null}
            actionIcon={CreditCard}
            onAction={can("customerPayments.create") ? () => setIsOpen(true) : undefined}
          />
        }
      />

      <CustomerPaymentModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={(data) => createMutation.mutateAsync(data)}
      />

      <PaymentDetailsModal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        payment={selectedPayment}
        type="customer"
      />
    </div>
  );
};

