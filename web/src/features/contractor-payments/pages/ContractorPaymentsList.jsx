import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { getContractorPayments, voidContractorPayment } from "../api";
import { getContracts } from "../../contracts/api";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { DataTable } from "../../../components/ui/DataTable";
import { FilterBar } from "../../../components/ui/FilterBar";
import { Select } from "../../../components/ui/Select";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { VoidReasonDialog } from "../../../components/ui/VoidReasonDialog";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import toast from "react-hot-toast";
import { cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";

export const ContractorPaymentsList = () => {
  const navigate = useNavigate();
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ contract: "", status: "" });
  const [voidingPayment, setVoidingPayment] = useState(null);

  const { data: contractsData } = useQuery({ 
    queryKey: ["contracts", "list"], 
    queryFn: () => getContracts({ limit: 1000 }),
    enabled: can("contracts.read")
  });
  const contracts = unwrapListResponse(contractsData).items || [];

  const params = useMemo(() => cleanFilterParams(filters, { page, limit: 20 }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["contractor-payments", params],
    queryFn: () => getContractorPayments(params),
    placeholderData: keepPreviousData,
    enabled: can("contractorPayments.read"),
  });

  const { items: payments, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["contractor-payments"],
    queryFn: getContractorPayments,
    pagination,
    params,
    page,
  });

  const voidMutation = useMutation({
    mutationFn: voidContractorPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractor-payments"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Payment voided successfully");
      setVoidingPayment(null);
    },
  });

  const columns = [
    { header: "Payment Ref", accessor: "paymentReference", className: "font-mono text-xs font-medium" },
    { header: "Contract No", accessor: (row) => row.contract?.contractNumber || "-", className: "font-medium text-secondary hidden sm:table-cell" },
    { header: "Amount", accessor: (row) => <MoneyDisplay amount={row.amount} className={row.status === 'voided' ? 'line-through opacity-50' : ''} /> },
    { header: "Date", accessor: (row) => formatDate(row.paymentDate), className: "text-secondary" },
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
        actionLabel={can("contracts.read") ? "Go to Contracts" : null}
        onAction={() => navigate("/contracts")}
      />

      <FilterBar 
        onClear={Object.values(filters).some(v => v !== "") ? () => { setFilters({ contract: "", status: "" }); setPage(1); } : undefined}
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
        mobileRenderer={(row) => (
          <div className="flex flex-col gap-2.5 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs font-semibold text-primary/70">Ref: {row.paymentReference || "-"}</span>
              <StatusBadge status={row.status} />
            </div>
            
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">Contract No</span>
                <span className="text-sm font-medium text-primary">{row.contract?.contractNumber || "-"}</span>
              </div>
              
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">Date & Amount</span>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-secondary font-medium">{formatDate(row.paymentDate)}</span>
                  <MoneyDisplay amount={row.amount} className={`text-sm font-bold ${row.status === 'voided' ? 'line-through opacity-50' : ''}`} />
                </div>
              </div>
            </div>
            
            {row.status !== 'voided' && can("contractorPayments.void") && (
              <div className="flex justify-end mt-2 pt-2 border-t border-border/20">
                <Button
                  variant="ghostDanger"
                  size="sm"
                  onClick={() => setVoidingPayment(row)}
                >
                  Void
                </Button>
              </div>
            )}
          </div>
        )}
        emptyState={
          <EmptyState
            title="No payments found"
            description="Payments are recorded directly from the Contract detail page to ensure accurate accounting."
            actionLabel={can("contracts.read") ? "Go to Contracts" : null}
            onAction={() => navigate("/contracts")}
          />
        }
      />

      <VoidReasonDialog
        isOpen={!!voidingPayment}
        title="Void Payment"
        description={`Are you sure you want to void this payment of ${voidingPayment?.amount} ETB? This action cannot be undone.`}
        confirmLabel="Void Payment"
        isSubmitting={voidMutation.isPending}
        onConfirm={(reason) => voidMutation.mutateAsync({ id: voidingPayment._id, voidReason: reason })}
        onCancel={() => setVoidingPayment(null)}
      />
    </div>
  );
};

