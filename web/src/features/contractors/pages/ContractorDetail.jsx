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
import { ContractorForm } from "./ContractorsList";
import { getApiErrorMessage, unwrapEntityResponse } from "../../../utils/apiResponse";
import { usePermission } from "../../../hooks/usePermission";
import { Phone, ArrowLeft, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import toast from "react-hot-toast";

export const ContractorDetail = () => {
  const { id } = useParams();
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);

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
          <Link
            to="/contractors"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-surface text-secondary hover:text-primary hover:bg-main transition-colors shrink-0"
            title="Back to contractors"
            aria-label="Back to contractors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
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

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
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
          subtitle="From all non-cancelled contracts"
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
          subtitle="Cash disbursed to contractor"
        />
        <SummaryCard
          title="Outstanding Balance"
          value={
            statsQuery.isLoading ? (
              <div className="h-6 w-24 bg-main animate-pulse rounded" />
            ) : (
              <MoneyDisplay
                amount={Math.abs(stats?.currentBalance ?? 0)}
                className={`text-xl font-bold ${!stats || stats.currentBalance <= 0 ? "text-success" : "text-danger"}`}
              />
            )
          }
          icon={Wallet}
          variant={!stats || stats.currentBalance <= 0 ? "success" : "danger"}
          iconVariant={!stats || stats.currentBalance <= 0 ? "success" : "danger"}
          subtitle={!stats || stats.currentBalance <= 0 ? "Fully settled" : "Owed to contractor"}
        />
      </div>

      {/* Info & System */}
      <div className="grid gap-6 lg:grid-cols-3">
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
