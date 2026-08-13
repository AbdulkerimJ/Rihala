import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { usePermission } from "../../../hooks/usePermission";
import { getContractorPayments, voidContractorPayment } from "../api";
import { getContracts } from "../../contracts/api";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import toast from "react-hot-toast";
import { getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";

export const ContractorPaymentsList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ contract: "", status: "", paymentMethod: "" });
  const [voidingPayment, setVoidingPayment] = useState(null);
  const [voidReason, setVoidReason] = useState("");

  const { data: contractsData } = useQuery({ 
    queryKey: ["contracts-list"], 
    queryFn: () => getContracts({ limit: 1000 }),
    enabled: can("contracts.read")
  });
  const contracts = unwrapListResponse(contractsData).items || [];

  const params = useMemo(() => ({
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "")),
    page,
    limit: 20
  }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["contractor-payments", params],
    queryFn: () => getContractorPayments(params),
    placeholderData: keepPreviousData,
    enabled: can("contractorPayments.read"),
  });

  const { items: payments, pagination } = unwrapListResponse(data);

  useEffect(() => {
    if (pagination && pagination.page < pagination.totalPages) {
      const nextParams = { ...params, page: page + 1 };
      queryClient.prefetchQuery({
        queryKey: ["contractor-payments", nextParams],
        queryFn: () => getContractorPayments(nextParams),
      });
    }
  }, [pagination, page, params, queryClient]);

  const voidMutation = useMutation({
    mutationFn: voidContractorPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractor-payments"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Payment voided successfully");
      setVoidingPayment(null);
      setVoidReason("");
    },
  });

  const columns = [
    { header: "Payment Ref", accessor: "paymentReference", className: "font-mono text-xs font-medium" },
    { header: "Contract No", accessor: (row) => row.contract?.contractNumber || "-", className: "font-medium text-secondary hidden sm:table-cell" },
    { header: "Amount", accessor: (row) => <MoneyDisplay amount={row.amount} className={row.status === 'voided' ? 'line-through opacity-50' : ''} /> },
    { header: "Date", accessor: (row) => formatDate(row.paymentDate), className: "text-secondary" },
    { header: "Method", accessor: (row) => <span className="capitalize">{row.paymentMethod?.replace('_', ' ')}</span>, className: "text-secondary hidden md:table-cell" },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          <Can permission="contractorPayments.void">
            {row.status !== 'voided' && (
              <Button
                variant="ghostDanger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setVoidingPayment(row);
                }}
              >
                Void
              </Button>
            )}
          </Can>
        </div>
      ) 
    }
  ];

  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load contractor payments.")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contractor Payments"
        description="View all payments made to contractors across all contracts."
      />

      <FilterBar 
        onClear={Object.values(filters).some(v => v !== "") ? () => { setFilters({ contract: "", status: "", paymentMethod: "" }); setPage(1); } : undefined}
      >
        <Select
          value={filters.contract}
          onChange={(e) => { setFilters(p => ({ ...p, contract: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "All Contracts" },
            ...contracts.map(c => ({ value: c._id, label: `${c.contractNumber} (${c.contractor?.name})` }))
          ]}
        />
        <Select
          value={filters.paymentMethod}
          onChange={(e) => { setFilters(p => ({ ...p, paymentMethod: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "All Methods" },
            { value: "CASH", label: "Cash" },
            { value: "BANK_TRANSFER", label: "Bank Transfer" },
            { value: "CHEQUE", label: "Cheque" },
            { value: "OTHER", label: "Other" },
          ]}
        />
        <Select
          value={filters.status}
          onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          options={[
            { value: "", label: "All Statuses" },
            { value: "active", label: "Active" },
            { value: "voided", label: "Voided" },
          ]}
        />
      </FilterBar>

      <DataTable 
        columns={columns}
        data={payments}
        keyExtractor={(row) => row._id}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={
          <EmptyState
            title="No payments found"
            description="Payments are recorded directly from the Contract detail page."
          />
        }
      />

      <ConfirmDialog
        isOpen={!!voidingPayment}
        title="Void Payment"
        message={`Are you sure you want to void this payment of ${voidingPayment?.amount} ETB? This action cannot be undone.`}
        confirmLabel="Void Payment"
        cancelLabel="Cancel"
        onConfirm={() => voidMutation.mutateAsync({ id: voidingPayment._id, voidReason })}
        onCancel={() => { setVoidingPayment(null); setVoidReason(""); }}
        isDestructive
        isLoading={voidMutation.isPending}
      >
        <div className="mt-4">
          <FormField label="Reason for voiding (required)">
            <Input
              type="text"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g. Bounced cheque, entry error"
              required
            />
          </FormField>
        </div>
      </ConfirmDialog>
    </div>
  );
};

