import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getContractorById, getContractorStats, updateContractor } from "../api";
import { getApiErrorMessage, unwrapEntityResponse, unwrapListResponse } from "../../../utils/apiResponse";
import { usePermission } from "../../../hooks/usePermission";
import { formatDate, formatDateTime } from "../../../utils/formatters";
import { TrendingUp, TrendingDown, Wallet, FileText, ClipboardList, HardHat } from "lucide-react";
import { getContracts } from "../../contracts/api";
import { getContractorPayments } from "../../contractor-payments/api";
import { DetailSkeleton, InlineSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { BackButton } from "../../../components/ui/BackButton";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Can } from "../../../components/Can";
import { Button } from "../../../components/ui/Button";
import { Tabs } from "../../../components/ui/Tabs";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { DetailSection } from "../../../components/ui/DetailSection";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { ListGroup, ListItem } from "../../../components/ui/ListGroup";
import { Modal } from "../../../components/ui/Modal";
import { ContractorForm } from "../components/ContractorForm";
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
              <InlineSkeleton className="h-6 w-24 mt-1" />
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
              <InlineSkeleton className="h-6 w-24 mt-1" />
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
              <InlineSkeleton className="h-6 w-24 mt-1" />
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
              <InlineSkeleton className="h-6 w-24 mt-1" />
            ) : (
              <MoneyDisplay
                amount={stats?.currentBalance ?? 0}
                className={`text-xl font-bold ${!stats || stats.currentBalance <= 0 ? "text-success" : "text-danger"}`}
              />
            )
          }
          icon={Wallet}
          variant={!stats || stats.currentBalance <= 0 ? "success" : "danger"}
          iconVariant={!stats || stats.currentBalance <= 0 ? "success" : "danger"}
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
            {isContractsLoading ? (
              <DetailSkeleton />
            ) : contracts?.length > 0 ? (
              <ListGroup>
                {contracts.map(row => (
                  <ListItem
                    key={row._id}
                    to={`/contracts/${row._id}`}
                    title={
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-accent uppercase tracking-widest bg-accent/10 px-1.5 py-0.5 rounded">
                          #{row.contractNumber || "-"}
                        </span>
                        <span className="text-primary font-medium">{row.taskName}</span>
                      </div>
                    }
                    subtitle={
                      <div className="flex flex-col mt-1">
                        <span className="text-sm text-secondary">
                          {row.taskTypeName} • {row.quantity} units @ <MoneyDisplay amount={row.unitPrice} />
                        </span>
                        <span className="text-xs text-muted mt-0.5">
                          Dated {formatDate(row.contractDate)}
                        </span>
                      </div>
                    }
                    right={
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-finance-out">
                          <MoneyDisplay amount={row.quantity * row.unitPrice || 0} />
                        </span>
                        <StatusBadge status={row.status} className="shrink-0" />
                      </div>
                    }
                  />
                ))}
              </ListGroup>
            ) : (
              <div className="text-center py-6 text-sm text-secondary flex flex-col items-center border border-dashed border-border/50 rounded-lg">
                <HardHat className="h-8 w-8 text-muted mb-2" />
                No contracts assigned to this contractor.
              </div>
            )}
          </DetailSection>
        </Can>
      )}

      {activeTab === "financials" && (
        <Can permission="contractorPayments.read">
          <DetailSection title="Payment History">
            {isPaymentsLoading ? (
              <DetailSkeleton />
            ) : payments?.length > 0 ? (
              <ListGroup>
                {payments.map(row => (
                  <ListItem
                    key={row._id}
                    title={<span className="font-mono text-[10px] font-bold text-primary tracking-widest">{row.paymentReference}</span>}
                    subtitle={formatDateTime(row.paymentDate)}
                    right={
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs sm:text-sm font-bold tracking-tight shrink-0 ${row.status === 'voided' ? 'line-through opacity-50 text-secondary' : 'text-primary'}`}>
                          <MoneyDisplay amount={row.amount} />
                        </span>
                        <StatusBadge status={row.status} className="shrink-0" />
                      </div>
                    }
                  />
                ))}
              </ListGroup>
            ) : (
              <div className="text-center py-6 text-sm text-secondary flex flex-col items-center border border-dashed border-border/50 rounded-lg">
                <FileText className="h-8 w-8 text-muted mb-2" />
                No payments have been recorded for this contractor.
              </div>
            )}
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
