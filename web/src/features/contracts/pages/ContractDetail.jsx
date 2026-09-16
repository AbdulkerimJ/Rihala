import { useState } from "react";
import { useParams } from "react-router-dom";
import { usePermission } from "../../../hooks/usePermission";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HardHat, Hammer, ClipboardCheck, FileText, CheckCircle, CreditCard, Ban, AlertCircle } from "lucide-react";

import { getContractById, cancelContract } from "../api";
import { recordCompletion, voidCompletion } from "../../contract-completions/api";
import { createContractorPayment, voidContractorPayment } from "../../contractor-payments/api";

import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Badge } from "../../../components/ui/Badge";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { InfoBlock, InfoRow } from "../../../components/ui/InfoBlock";
import { Can } from "../../../components/Can";
import { ListGroup, ListItem } from "../../../components/ui/ListGroup";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { Modal } from "../../../components/ui/Modal";
import { VoidReasonDialog } from "../../../components/ui/VoidReasonDialog";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import toast from "react-hot-toast";
import { formatDate } from "../../../utils/formatters";
import { getApiErrorMessage, unwrapEntityResponse } from "../../../utils/apiResponse";

import { CompletionForm } from "../components/CompletionForm";
import { PaymentForm } from "../components/PaymentForm";
import { ContractProgressBar } from "../components/ContractProgressBar";

export const ContractDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { can } = usePermission();

  // Modals state
  const [isCompletionModalOpen, setCompletionModalOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isCancelModalOpen, setCancelModalOpen] = useState(false);
  const [voidingCompletion, setVoidingCompletion] = useState(null);
  const [voidingPayment, setVoidingPayment] = useState(null);

  const contractQuery = useQuery({
    queryKey: ["contracts", id],
    queryFn: () => getContractById(id),
    enabled: can("contracts.read") && !!id,
  });

  const contract = unwrapEntityResponse(contractQuery.data);

  // Mutations
  const recordCompletionMutation = useMutation({
    mutationFn: (data) => recordCompletion({ contract: id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      toast.success("Completion recorded");
      setCompletionModalOpen(false);
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data) => createContractorPayment({ contract: id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      queryClient.invalidateQueries({ queryKey: ["contractor-payments"] });
      toast.success("Payment recorded");
      setPaymentModalOpen(false);
    },
  });

  const voidCompletionMutation = useMutation({
    mutationFn: ({ id, voidReason }) => voidCompletion({ id, voidReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      toast.success("Completion voided");
      setVoidingCompletion(null);
    },
  });

  const voidPaymentMutation = useMutation({
    mutationFn: ({ id, voidReason }) => voidContractorPayment({ id, voidReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      toast.success("Payment voided");
      setVoidingPayment(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (reason) => cancelContract({ id, cancelReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      toast.success("Contract cancelled");
      setCancelModalOpen(false);
    },
  });

  if (contractQuery.isLoading) return <DetailSkeleton />;
  if (contractQuery.isError || !contract) return <ErrorState description={getApiErrorMessage(contractQuery.error, "Failed to load contract details.")} />;

  const stats = contract.stats;
  const isOverdue = stats.isOverdue && contract.status === "ACTIVE";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Contract ${contract.contractNumber}`}
        description={`Contract for ${contract.contractor?.name} on task ${contract.task?.name}.`}
        backTo="/contracts"
        backLabel="Back to contracts"
        titleCustom={
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary font-display tracking-tight">Contract {contract.contractNumber}</h1>
            <StatusBadge status={contract.status} />
            {isOverdue && <StatusBadge label="Overdue" className="bg-danger/10 text-danger border border-danger/20" showDot={false} />}
            <Badge variant="default" className="font-medium bg-secondary/10">
              {contract.taskTypeName}
            </Badge>
          </div>
        }
        actions={
          (contract.status === "ACTIVE" || contract.status === "COMPLETED") && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {contract.status === "ACTIVE" && (
                <Can permission="contractCompletions.create">
                  <Button 
                    variant="outline" 
                    leftIcon={CheckCircle} 
                    onClick={() => setCompletionModalOpen(true)} 
                    disabled={stats.completedQuantity >= contract.quantity}
                  >
                    Record Completion
                  </Button>
                </Can>
              )}
              <Can permission="contractorPayments.create">
                <Button 
                  variant="primary" 
                  leftIcon={CreditCard} 
                  onClick={() => setPaymentModalOpen(true)} 
                  disabled={stats.payableAmount <= 0}
                >
                  Record Payment
                </Button>
              </Can>
              {contract.status === "ACTIVE" && (
                <Can permission="contracts.cancel">
                  <Button 
                    variant="danger-ghost" 
                    leftIcon={Ban}
                    onClick={() => setCancelModalOpen(true)}
                  >
                    Cancel
                  </Button>
                </Can>
              )}
            </div>
          )
        }
      />

      <ContractProgressBar contract={contract} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-3">Completions Log</h3>
          {contract.completions?.length > 0 ? (
            <ListGroup>
              {contract.completions.map(row => (
                <ListItem
                  key={row._id}
                  title={formatDate(row.recordedAt)}
                  subtitle={`Quantity: ${row.quantity}`}
                  right={
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={row.status} className="shrink-0" />
                    </div>
                  }
                  actions={
                    <Can permission="contractCompletions.void">
                      {row.status?.toUpperCase() === 'ACTIVE' && contract.status === 'ACTIVE' && (
                        <Button variant="danger-ghost" size="sm" onClick={() => setVoidingCompletion(row)}>Void</Button>
                      )}
                    </Can>
                  }
                />
              ))}
            </ListGroup>
          ) : (
            <div className="text-sm text-secondary p-8 text-center border border-dashed border-border/50 rounded-lg">No completions recorded yet.</div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-3">Payments Log</h3>
          {contract.payments?.length > 0 ? (
            <ListGroup>
              {contract.payments.map(row => (
                <ListItem
                  key={row._id}
                  title={<span className="font-mono text-[10px] font-bold text-primary tracking-widest">{row.paymentReference}</span>}
                  subtitle={formatDate(row.paymentDate)}
                  right={
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs sm:text-sm font-bold tracking-tight shrink-0 ${row.status === 'voided' ? 'line-through opacity-50 text-secondary' : 'text-primary'}`}>
                        <MoneyDisplay amount={row.amount} />
                      </span>
                      <StatusBadge status={row.status} className="shrink-0" />
                    </div>
                  }
                  actions={
                    <Can permission="contractorPayments.void">
                      {row.status === 'active' && (
                        <Button variant="danger-ghost" size="sm" onClick={() => setVoidingPayment(row)}>Void</Button>
                      )}
                    </Can>
                  }
                />
              ))}
            </ListGroup>
          ) : (
            <div className="text-sm text-secondary p-8 text-center border border-dashed border-border/50 rounded-lg">No payments recorded yet.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <InfoBlock title="Contract Information">
          <InfoRow label="Contractor" value={contract.contractor?.name} />
          <InfoRow label="Task" value={contract.task?.name} />
          <InfoRow label="Contract Date" value={formatDate(contract.contractDate)} />
          <InfoRow label="Expected Completion" value={contract.expectedCompletionDate ? formatDate(contract.expectedCompletionDate) : "-"} />
          <InfoRow label="Unit Price" value={<MoneyDisplay amount={contract.unitPrice} />} />
          <InfoRow label="Total Value" value={<MoneyDisplay amount={contract.quantity * contract.unitPrice} />} />
          <InfoRow label="Notes" value={contract.note || "No additional notes."} />
          
          {contract.status === "CANCELLED" && (
            <div className="mt-4 p-3 bg-danger/10 border border-danger/20 rounded-md">
              <p className="text-sm font-medium text-danger mb-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Cancel Reason</p>
              <p className="text-sm text-danger">{contract.cancellationReason || contract.cancelReason}</p>
            </div>
          )}
        </InfoBlock>

        <SystemInfoSection
          id={contract._id}
          createdAt={contract.createdAt}
          updatedAt={contract.updatedAt}
        />
      </div>

      {/* Modals */}
      <Modal isOpen={isCompletionModalOpen} title="Record Task Completion" onClose={() => setCompletionModalOpen(false)}>
        <CompletionForm contract={contract} onClose={() => setCompletionModalOpen(false)} onSubmit={(data) => recordCompletionMutation.mutateAsync(data)} />
      </Modal>

      <Modal isOpen={isPaymentModalOpen} title="Record Payment" onClose={() => setPaymentModalOpen(false)}>
        <PaymentForm contract={contract} onClose={() => setPaymentModalOpen(false)} onSubmit={(data) => recordPaymentMutation.mutateAsync(data)} />
      </Modal>

      <VoidReasonDialog
        isOpen={isCancelModalOpen}
        title="Cancel Contract"
        description="Are you sure you want to cancel this contract? You can only cancel if there are no unpaid completed tasks and the contractor hasn't been overpaid. This action cannot be undone."
        confirmLabel="Cancel Contract"
        placeholder="Reason for contract cancellation..."
        isSubmitting={cancelMutation.isPending}
        onConfirm={(reason) => cancelMutation.mutateAsync(reason)}
        onCancel={() => setCancelModalOpen(false)}
      />

      <VoidReasonDialog
        isOpen={!!voidingCompletion}
        title="Void Completion"
        description="Are you sure you want to void this completion? This will decrease the total completed work value."
        confirmLabel="Void Completion"
        isSubmitting={voidCompletionMutation.isPending}
        onConfirm={(reason) => voidCompletionMutation.mutateAsync({ id: voidingCompletion._id, voidReason: reason })}
        onCancel={() => setVoidingCompletion(null)}
      />

      <VoidReasonDialog
        isOpen={!!voidingPayment}
        title="Void Payment"
        description="Are you sure you want to void this payment? This will increase the payable amount."
        confirmLabel="Void Payment"
        isSubmitting={voidPaymentMutation.isPending}
        onConfirm={(reason) => voidPaymentMutation.mutateAsync({ id: voidingPayment._id, voidReason: reason })}
        onCancel={() => setVoidingPayment(null)}
      />
    </div>
  );
};
