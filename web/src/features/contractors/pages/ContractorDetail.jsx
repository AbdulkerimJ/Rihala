import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getContractorById, getContractorStats, updateContractor } from "../api";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { DetailSection } from "../../../components/ui/DetailSection";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { Can } from "../../../components/Can";
import { ContractorForm } from "../components/ContractorForm";
import { getApiErrorMessage, unwrapEntityResponse, unwrapListResponse } from "../../../utils/apiResponse";
import { usePermission } from "../../../hooks/usePermission";
import { DataTable } from "../../../components/ui/DataTable";
import { formatDate, formatDateTime } from "../../../utils/formatters";
import { Phone, TrendingUp, TrendingDown, Wallet, HardHat, FileText, ClipboardList } from "lucide-react";
import { BackButton } from "../../../components/ui/BackButton";
import { Tabs } from "../../../components/ui/Tabs";
import { getContracts } from "../../contracts/api";
import { getContractorPayments } from "../../contractor-payments/api";
import toast from "react-hot-toast";

export const ContractorDetail = () => {
  const { id } = useParams();
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const contractorQuery = useQuery({
    queryKey: ["contractors", id],
    queryFn: () => getContractorById(id),
    enabled: !!id,
  });

  const statsQuery = useQuery({
    queryKey: ["contractors", id, "stats"],
    queryFn: () => getContractorStats(id),
    enabled: !!id && can("contractors.read"),
  });

  const { data: contractsData, isLoading: isContractsLoading } = useQuery({
    queryKey: ["contracts", "list", { contractor: id }],
    queryFn: () => getContracts({ contractor: id, limit: 50 }),
    enabled: !!id && can("contracts.read"),
  });

  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["contractor-payments", "list", { contractor: id }],
    queryFn: () => getContractorPayments({ contractor: id, limit: 50 }),
    enabled: !!id && can("contractorPayments.read"),
  });

  const updateMutation = useMutation({
    mutationFn: updateContractor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      toast.success("Contractor updated successfully");
      setIsEditOpen(false);
    },
  });

  const contractor = unwrapEntityResponse(contractorQuery.data);
  const stats = statsQuery.data?.data ?? null;
  const contracts = unwrapListResponse(contractsData).items || [];
  const payments = unwrapListResponse(paymentsData).items || [];

  if (contractorQuery.isLoading) return <DetailSkeleton />;

  if (contractorQuery.isError || !contractor) {
    return (
      <ErrorState
        description={getApiErrorMessage(
          contractorQuery.error,
          "Failed to load contractor details."
        )}
      />
    );
  }

  const contractColumns = [
    { 
      header: "Contract No", 
      accessor: (row) => (
        <Link to={`/contracts/${row._id}`} className="font-mono text-xs text-accent hover:underline">
          {row.contractNumber || "-"}
        </Link>
      ) 
    },
    { header: "Date", accessor: (row) => formatDate(row.contractDate), className: "text-secondary" },
    { header: "Value", accessor: (row) => <MoneyDisplay amount={row.quantity * row.unitPrice || 0} /> },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> }
  ];

  const paymentColumns = [
    { 
      header: "Ref No", 
      accessor: (row) => (
        <span className="font-mono text-xs font-semibold text-primary">{row.paymentReference}</span>
      ) 
    },
    { header: "Date", accessor: (row) => formatDateTime(row.paymentDate), className: "text-secondary" },
    { header: "Amount", accessor: (row) => <MoneyDisplay amount={row.amount} className={row.status === 'voided' ? 'line-through opacity-50' : ''} /> },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> }
  ];

  const balanceColor =
    !stats
      ? "bg-main/50 border-border/50"
      : stats.currentBalance <= 0
      ? "bg-success/10 border-success/30"
      : "bg-danger/10 border-danger/30";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-primary font-display tracking-tight">
                {contractor.name}
              </h1>
              <StatusBadge status={contractor.status} />
            </div>
            <p className="text-sm text-secondary">{contractor.phone || "No phone provided"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Can permission="contractors.update">
            <Button onClick={() => setIsEditOpen(true)}>Edit Contractor</Button>
          </Can>
        </div>
      </div>

      {/* Tabs */}
      <Tabs 
        tabs={[
          { id: "overview", label: "Overview", icon: FileText },
          { id: "contracts", label: "Contracts", icon: ClipboardList },
          { id: "financials", label: "Financials", icon: Wallet }
        ]} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      {activeTab === "overview" && (
      <>
        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
        <SummaryCard
          title="Total Contract Value"
          value={
            statsQuery.isLoading ? (
              <div className="h-6 w-24 bg-main animate-pulse rounded" />
            ) : (
              <MoneyDisplay amount={stats?.totalContractValue ?? 0} className="text-xl font-bold text-primary" />
            )
          }
          icon={TrendingUp}
          variant="blue"
          iconVariant="blue"
          subtitle="Total expected value"
        />
        <SummaryCard
          title="Completed Work"
          value={
            statsQuery.isLoading ? (
              <div className="h-6 w-24 bg-main animate-pulse rounded" />
            ) : (
              <MoneyDisplay amount={stats?.totalCompletedWorkValue ?? 0} className="text-xl font-bold text-primary" />
            )
          }
          icon={TrendingUp}
          variant="brand"
          iconVariant="brand"
          subtitle="Earned so far"
        />
        <SummaryCard
          title="Total Paid"
          value={
            statsQuery.isLoading ? (
              <div className="h-6 w-24 bg-main animate-pulse rounded" />
            ) : (
              <MoneyDisplay amount={stats?.totalPaid ?? 0} className="text-xl font-bold text-primary" />
            )
          }
          icon={TrendingDown}
          variant="default"
          subtitle="Amount already paid"
        />
        <SummaryCard
          title="Owed Balance"
          value={
            statsQuery.isLoading ? (
              <div className="h-6 w-24 bg-main animate-pulse rounded" />
            ) : (
              <MoneyDisplay
                amount={Math.max(stats?.currentBalance ?? 0, 0)}
                className={`text-xl font-bold ${!stats || stats.currentBalance <= 0 ? "text-success" : "text-danger"}`}
              />
            )
          }
          icon={Wallet}
          variant={!stats || stats.currentBalance <= 0 ? "success" : "danger"}
          iconVariant={!stats || stats.currentBalance <= 0 ? "success" : "danger"}
          subtitle={!stats || stats.currentBalance <= 0 ? "Fully paid off" : "Amount left to pay"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        <div className="lg:col-span-2 space-y-6">
          <DetailSection title="Contact & Notes">
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-secondary block mb-2">Phone</span>
                <p className="text-primary bg-main/50 p-3 rounded-lg">{contractor.phone}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-secondary block mb-2">Notes</span>
                <p className="text-primary bg-main/50 p-4 rounded-lg whitespace-pre-wrap">
                  {contractor.notes || "No notes provided."}
                </p>
              </div>
            </div>
          </DetailSection>
        </div>

        <div className="space-y-6">
          <SystemInfoSection
            id={contractor._id}
            idLabel="Contractor ID"
            createdAt={contractor.createdAt}
            updatedAt={contractor.updatedAt}
          />
        </div>
      </div>
      </>
      )}

      {activeTab === "contracts" && (
        <Can permission="contracts.read">
          <DetailSection title="Assigned Contracts">
            <DataTable
              columns={contractColumns}
              data={contracts}
              keyExtractor={(row) => row._id}
              isLoading={isContractsLoading}
              emptyState={
                <div className="text-center py-6 text-sm text-secondary flex flex-col items-center">
                  <HardHat className="h-8 w-8 text-muted mb-2" />
                  No contracts assigned to this contractor.
                </div>
              }
            />
          </DetailSection>
        </Can>
      )}

      {activeTab === "financials" && (
        <Can permission="contractorPayments.read">
          <DetailSection title="Payment History">
            <DataTable
              columns={paymentColumns}
              data={payments}
              keyExtractor={(row) => row._id}
              isLoading={isPaymentsLoading}
              emptyState={
                <div className="text-center py-6 text-sm text-secondary flex flex-col items-center">
                  <FileText className="h-8 w-8 text-muted mb-2" />
                  No payments have been recorded for this contractor.
                </div>
              }
            />
          </DetailSection>
        </Can>
      )}

      <Modal
        isOpen={isEditOpen}
        title="Edit Contractor"
        onClose={() => setIsEditOpen(false)}
      >
        <ContractorForm
          initialData={contractor}
          onClose={() => setIsEditOpen(false)}
          onSubmit={(data) =>
            updateMutation.mutateAsync({ id: contractor._id, data })
          }
        />
      </Modal>
    </div>
  );
};
