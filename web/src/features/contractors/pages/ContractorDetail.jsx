import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getContractorById, getContractorStats, updateContractor } from "../api";
import { getApiErrorMessage, unwrapEntityResponse, unwrapListResponse } from "../../../utils/apiResponse";
import { usePermission } from "../../../hooks/usePermission";
import { ClipboardList, Wallet } from "lucide-react";
import { getContracts } from "../../contracts/api";
import { getContractorPayments } from "../../contractor-payments/api";

import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Tabs } from "../../../components/ui/Tabs";
import { Modal } from "../../../components/ui/Modal";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { ContractorForm } from "../components/ContractorForm";
import { ContractorHeader } from "../components/ContractorHeader";
import { ContractorContractsTab } from "../components/ContractorContractsTab";
import { ContractorPaymentsTab } from "../components/ContractorPaymentsTab";
import toast from "react-hot-toast";

export const ContractorDetail = () => {
  const { id } = useParams();
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("contracts");

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

  const activeContractsCount = contracts.filter((c) => c.status === "ACTIVE").length;

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

  return (
    <div className="space-y-4 animate-[fadeSlideUp_0.3s_ease_both]">
      {/* ── Executive Header ── */}
      <ContractorHeader
        contractor={contractor}
        stats={stats}
        isStatsLoading={statsQuery.isLoading}
        contractsCount={contracts.length}
        activeContractsCount={activeContractsCount}
        onEditClick={() => setIsEditOpen(true)}
        onViewContracts={() => setActiveTab("contracts")}
      />

      {/* ── Tabs Navigation ── */}
      <Tabs
        tabs={[
          { id: "contracts", label: "Contracts", icon: ClipboardList },
          { id: "financials", label: "Payment History", icon: Wallet },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ── Tab Views ── */}
      {activeTab === "contracts" && (
        <ContractorContractsTab
          contracts={contracts}
          isLoading={isContractsLoading}
        />
      )}

      {activeTab === "financials" && (
        <ContractorPaymentsTab
          payments={payments}
          isLoading={isPaymentsLoading}
        />
      )}

      {/* ── System Information at Bottom ── */}
      <SystemInfoSection
        id={contractor._id}
        idLabel="Contractor ID"
        createdAt={contractor.createdAt}
        updatedAt={contractor.updatedAt}
      />

      {/* ── Edit Modal ── */}
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
