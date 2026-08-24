import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { usePermission } from "../../../hooks/usePermission";
import { usePrefetchNextPage } from "../../../hooks/usePrefetchNextPage";
import { getCompletions, voidCompletion } from "../api";
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
import toast from "react-hot-toast";
import { cleanFilterParams, getApiErrorMessage, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDateTime } from "../../../utils/formatters";

export const ContractCompletionsList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ contract: "", status: "" });
  const [voidingCompletion, setVoidingCompletion] = useState(null);

  const { data: contractsData } = useQuery({ 
    queryKey: ["contracts", "list"], 
    queryFn: () => getContracts({ limit: 1000 }),
    enabled: can("contracts.read")
  });
  const contracts = unwrapListResponse(contractsData).items || [];

  const params = useMemo(() => cleanFilterParams(filters, { page, limit: 20 }), [filters, page]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["contract-completions", params],
    queryFn: () => getCompletions(params),
    placeholderData: keepPreviousData,
    enabled: can("contractCompletions.read"),
  });

  const { items: completions, pagination } = unwrapListResponse(data);

  usePrefetchNextPage({
    queryKey: ["contract-completions"],
    queryFn: getCompletions,
    pagination,
    params,
    page,
  });

  const voidMutation = useMutation({
    mutationFn: voidCompletion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-completions"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Completion voided successfully");
      setVoidingCompletion(null);
    },
  });

  const columns = [
    { header: "Contract No", accessor: (row) => row.contract?.contractNumber || "-", className: "font-medium" },
    { header: "Quantity Completed", accessor: "quantity", className: "text-secondary" },
    { header: "Recorded By", accessor: (row) => row.createdBy?.name || "-", className: "text-secondary hidden sm:table-cell" },
    { header: "Recorded At", accessor: (row) => formatDateTime(row.recordedAt), className: "text-secondary" },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          <Can permission="contractCompletions.void">
            {row.status !== 'voided' && (
              <Button
                variant="ghostDanger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setVoidingCompletion(row);
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

  if (isError) return <ErrorState description={getApiErrorMessage(error, "Failed to load contract completions.")} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contract Completions"
        description="View all recorded task completions across contracts."
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
        data={completions}
        keyExtractor={(row) => row._id}
        pagination={{ ...pagination, page }}
        onPageChange={setPage}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyState={
          <EmptyState
            title="No completions found"
            description="Completions are recorded directly from the Contract detail page."
          />
        }
      />

      <VoidReasonDialog
        isOpen={!!voidingCompletion}
        title="Void Completion"
        description={`Are you sure you want to void this completion of ${voidingCompletion?.quantity} units? This action cannot be undone.`}
        confirmLabel="Void Completion"
        isSubmitting={voidMutation.isPending}
        onConfirm={(reason) => voidMutation.mutateAsync({ id: voidingCompletion._id, voidReason: reason })}
        onCancel={() => setVoidingCompletion(null)}
      />
    </div>
  );
};


