import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createCustomerPayment, getCustomerPayments, voidCustomerPayment } from "../api";
import { getCustomers } from "../../customers/api";
import { getOrders } from "../../orders/api";
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
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { VoidReasonDialog } from "../../../components/ui/VoidReasonDialog";
import { FormRootError } from "../../../components/ui/FormRootError";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { CurrencyInput } from "../../../components/ui/CurrencyInput";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { applyServerErrors, cleanFilterParams, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";

import { CustomerPaymentModal } from "../components/CustomerPaymentModal";
export const CustomerPaymentsList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", customer: "", status: "", from: "", to: "", sort: "-paymentDate" });
  const [isOpen, setIsOpen] = useState(false);

  const { data: customersData } = useQuery({ 
    queryKey: ["customers", "list"], 
    queryFn: () => getCustomers({ limit: 1000 }),
    enabled: can("customers.read")
  });
  const customers = unwrapListResponse(customersData).items || [];

  const params = useMemo(() => cleanFilterParams(filters, { page, limit: 20 }), [filters, page]);

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
      toast.success("Payment recorded successfully");
      setIsOpen(false);
    },
  });

  const columns = [
    { header: "Order #", accessor: (row) => <span className="font-mono text-xs font-semibold text-primary">{row.orderNumber || (row.order?.orderNumber) || "-"}</span> },
    { header: "Customer", accessor: (row) => row.customerName || row.order?.customerName || row.order?.customer?.name || row.customer?.name || "Unknown", className: "font-bold text-primary" },
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
            <Button leftIcon={Plus} onClick={() => setIsOpen(true)}>Receive Payment</Button>
          </Can>
        }
      />

      <FilterBar 
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
            { value: "", label: "All Statuses" },
            { value: "valid", label: "Valid" },
            { value: "voided", label: "Voided" },
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
      </FilterBar>

      <DataTable 
        columns={columns}
        data={payments}
        keyExtractor={(row) => row._id}
        onRowClick={(row) => navigate(`/customer-payments/${row._id}`)}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={
          <EmptyState
            title="No payments found"
            description="Record a payment received from a customer."
            actionLabel={can("customerPayments.create") ? "Receive Payment" : null}
            onAction={can("customerPayments.create") ? () => setIsOpen(true) : undefined}
          />
        }
      />

      <CustomerPaymentModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={(data) => createMutation.mutateAsync(data)}
      />
    </div>
  );
};

