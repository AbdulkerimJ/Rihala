import { useState } from "react";
import { useParams } from "react-router-dom";
import { usePermission } from "../../../hooks/usePermission";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HardHat, Hammer, ClipboardCheck, FileText, Save, X, AlertCircle } from "lucide-react";
import { getContractById, cancelContract } from "../api";
import { recordCompletion, voidCompletion } from "../../contract-completions/api";
import { createContractorPayment, voidContractorPayment } from "../../contractor-payments/api";
import { useForm, Controller } from "react-hook-form";
import { FormRootError } from "../../../components/ui/FormRootError";
import { FormField } from "../../../components/ui/FormField";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import { CurrencyInput } from "../../../components/ui/CurrencyInput";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { BackButton } from "../../../components/ui/BackButton";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Badge } from "../../../components/ui/Badge";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { DetailSection, DetailItem } from "../../../components/ui/DetailSection";
import { Can } from "../../../components/Can";
import { ListGroup, ListItem } from "../../../components/ui/ListGroup";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { Modal } from "../../../components/ui/Modal";
import { VoidReasonDialog } from "../../../components/ui/VoidReasonDialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { formatDate, getLocalISODate } from "../../../utils/formatters";
import { applyServerErrors, getApiErrorMessage, unwrapEntityResponse } from "../../../utils/apiResponse";

// --- Forms ---
const completionSchema = z.object({
  quantity: z.coerce.number({ error: "Quantity is required" }).int("Quantity must be an integer").min(1, "Quantity must be at least 1"),
  recordedAt: z.string().min(1, "Date is required"),
  note: z.string().trim().optional().or(z.literal("")),
});

const CompletionForm = ({ contract, onSubmit, onClose }) => {
  const maxQty = Math.max(0, (contract.quantity || 0) - (contract.stats?.completedQuantity || 0));
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(completionSchema),
    defaultValues: { quantity: maxQty > 0 ? maxQty : 1, recordedAt: getLocalISODate(), note: "" }
  });

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />
      <div className="bg-blue-50/50 p-3 rounded-md mb-4 border border-blue-100">
        <p className="text-sm text-blue-800">Remaining to complete: <strong>{maxQty}</strong> units.</p>
      </div>
      <FormField label="Quantity Completed" required error={errors.quantity?.message}>
        <Input type="number" max={maxQty} {...register("quantity")} error={errors.quantity?.message} />
      </FormField>
      <FormField label="Completion Date" required error={errors.recordedAt?.message}>
        <Input type="date" {...register("recordedAt")} error={errors.recordedAt?.message} />
      </FormField>
      <FormField label="Note (Optional)" error={errors.note?.message}>
        <Textarea {...register("note")} rows={2} error={errors.note?.message} />
      </FormField>
      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} leftIcon={X}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} leftIcon={Save}>Record Completion</Button>
      </div>
    </form>
  );
};

const paymentSchema = z.object({
  amount: z.coerce.number({ error: "Amount is required" }).positive("Amount must be greater than 0"),
  paymentDate: z.string().min(1, "Date is required"),
  note: z.string().trim().optional().or(z.literal(""))
});

const PaymentForm = ({ contract, onSubmit, onClose }) => {
  const { register, control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: contract.stats.payableAmount, paymentDate: getLocalISODate(), note: "" }
  });

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  };

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(handleFormSubmit)}>
      <FormRootError error={errors.root} />
      <div className="bg-blue-50/50 p-3 rounded-md mb-4 border border-blue-100">
        <p className="text-sm text-blue-800">Max payable amount: <strong><MoneyDisplay amount={contract.stats.payableAmount} /></strong></p>
      </div>
      <FormField label="Amount (ETB)" required error={errors.amount?.message}>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <CurrencyInput
              {...field}
              max={contract.stats.payableAmount}
              placeholder="0"
              error={errors.amount?.message}
            />
          )}
        />
      </FormField>
      <FormField label="Payment Date" required error={errors.paymentDate?.message}>
        <Input type="date" {...register("paymentDate")} error={errors.paymentDate?.message} />
      </FormField>
      <FormField label="Note (Optional)" error={errors.note?.message}>
        <Textarea {...register("note")} rows={2} error={errors.note?.message} />
      </FormField>
      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} leftIcon={X}>Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} leftIcon={Save}>Record Payment</Button>
      </div>
    </form>
  );
};

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
      setVoidReason("");
    },
  });

  const voidPaymentMutation = useMutation({
    mutationFn: ({ id, voidReason }) => voidContractorPayment({ id, voidReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      toast.success("Payment voided");
      setVoidingPayment(null);
      setVoidReason("");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (reason) => cancelContract({ id, cancelReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      toast.success("Contract cancelled");
      setCancelModalOpen(false);
      setCancelReason("");
    },
  });

  if (contractQuery.isLoading) return <DetailSkeleton />;
  if (contractQuery.isError || !contract) return <ErrorState description={getApiErrorMessage(contractQuery.error, "Failed to load contract details.")} />;

  const stats = contract.stats;
  const isOverdue = stats.isOverdue && contract.status === "ACTIVE";

  // Tables


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-primary font-display tracking-tight">Contract {contract.contractNumber}</h1>
              <StatusBadge status={contract.status} />
              {isOverdue && <StatusBadge label="Overdue" className="bg-danger/10 text-danger border border-danger/20" />}
              <Badge variant="default" className="font-medium bg-secondary/10">
                {contract.taskTypeName}
              </Badge>
            </div>
            <p className="text-sm text-secondary">Manage contract progress and financial standing.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Contractor" value={contract.contractor?.name} icon={HardHat} />
        <SummaryCard title="Task" value={contract.task?.name} icon={Hammer} />
        <SummaryCard title="Total Quantity" value={`${contract.quantity} units`} icon={ClipboardCheck} />
        <SummaryCard title="Total Value" value={<MoneyDisplay amount={contract.quantity * contract.unitPrice} variant="accent" />} icon={FileText} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Workflow */}
        <div className="lg:col-span-2 space-y-6">
          <DetailSection title="Contract Stats & Financials">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-main/50 rounded-lg">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-secondary mb-1 truncate">Completed Qty</p>
                <p className="text-base sm:text-lg font-semibold text-primary break-words">{stats.completedQuantity} <span className="text-xs font-normal text-secondary">/ {contract.quantity}</span></p>
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-secondary mb-1 truncate">Work Value</p>
                <p className="text-base sm:text-lg font-semibold text-primary break-words tabular-nums"><MoneyDisplay amount={stats.completedWorkValue} /></p>
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-secondary mb-1 truncate">Total Paid</p>
                <p className="text-base sm:text-lg font-semibold text-primary break-words tabular-nums"><MoneyDisplay amount={stats.totalPaid} /></p>
              </div>
              <div className="bg-accent/10 -m-2 p-2 rounded-md border border-accent/20 min-w-0">
                <p className="text-xs sm:text-sm text-accent mb-1 font-medium truncate">Payable Amount</p>
                <p className="text-base sm:text-lg font-bold text-accent break-words tabular-nums"><MoneyDisplay amount={stats.payableAmount} /></p>
              </div>
            </div>
            
            {/* Action Buttons */}
            {(contract.status === "ACTIVE" || contract.status === "COMPLETED") && (
              <div className="flex flex-wrap gap-3 mt-6">
                {contract.status === "ACTIVE" && (
                  <Can permission="contractCompletions.create">
                    <Button onClick={() => setCompletionModalOpen(true)} disabled={stats.completedQuantity >= contract.quantity}>
                      Record Completion
                    </Button>
                  </Can>
                )}
                <Can permission="contractorPayments.create">
                  <Button onClick={() => setPaymentModalOpen(true)} disabled={stats.payableAmount <= 0}>
                    Record Payment
                  </Button>
                </Can>
                {contract.status === "ACTIVE" && (
                  <Can permission="contracts.cancel">
                    <Button variant="danger-ghost" onClick={() => setCancelModalOpen(true)}>
                      Cancel Contract
                    </Button>
                  </Can>
                )}
              </div>
            )}
          </DetailSection>

          <DetailSection title="Completions Log">
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
                        {row.status === 'active' && contract.status === 'ACTIVE' && (
                          <Button variant="danger-ghost" size="sm" onClick={() => setVoidingCompletion(row)}>Void</Button>
                        )}
                      </Can>
                    }
                  />
                ))}
              </ListGroup>
            ) : (
              <div className="text-sm text-secondary p-4 text-center border border-dashed border-border/50 rounded-lg">No completions recorded yet.</div>
            )}
          </DetailSection>

          <DetailSection title="Payments Log">
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
              <div className="text-sm text-secondary p-4 text-center border border-dashed border-border/50 rounded-lg">No payments recorded yet.</div>
            )}
          </DetailSection>
        </div>

        {/* Right Column - System Info */}
        <div className="space-y-6">
          <DetailSection title="Contract Information">
            <div className="space-y-3">
              <DetailItem label="Contract Date" value={formatDate(contract.contractDate)} />
              <DetailItem label="Expected Completion" value={contract.expectedCompletionDate ? formatDate(contract.expectedCompletionDate) : "-"} />
              <DetailItem label="Unit Price" value={<MoneyDisplay amount={contract.unitPrice} />} />
              <DetailItem label="Notes" value={contract.note || "No additional notes."} />
              
              {contract.status === "CANCELLED" && (
                <div className="mt-4 p-3 bg-danger/10 border border-danger/20 rounded-md">
                  <p className="text-sm font-medium text-danger mb-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Cancel Reason</p>
                  <p className="text-sm text-danger">{contract.cancelReason}</p>
                </div>
              )}
            </div>
          </DetailSection>

          <SystemInfoSection
            id={contract._id}
            createdAt={contract.createdAt}
            updatedAt={contract.updatedAt}
          />
        </div>
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

