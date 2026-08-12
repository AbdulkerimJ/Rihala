import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getContractById, cancelContract } from "../api";
import { recordCompletion, voidCompletion } from "../../contract-completions/api";
import { createContractorPayment, voidContractorPayment } from "../../contractor-payments/api";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { DetailSection, DetailItem } from "../../../components/ui/DetailSection";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { DataTable } from "../../../components/ui/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { FormField } from "../../../components/ui/FormField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { formatDate, formatDateTime } from "../../../utils/formatters";
import { getApiErrorMessage, unwrapEntityResponse } from "../../../utils/apiResponse";
import { Can } from "../../../components/Can";
import { usePermission } from "../../../hooks/usePermission";
import { HardHat, Hammer, ClipboardCheck, AlertCircle, FileText } from "lucide-react";

// --- Forms ---
const completionSchema = z.object({
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  recordedAt: z.string().min(1, "Date is required"),
});

const CompletionForm = ({ contract, onSubmit, onClose }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(completionSchema),
    defaultValues: { quantity: 1, recordedAt: new Date().toISOString().split("T")[0] }
  });
  const maxQty = contract.quantity - contract.stats.completedQuantity;

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="bg-blue-50/50 p-3 rounded-md mb-4 border border-blue-100">
        <p className="text-sm text-blue-800">Remaining to complete: <strong>{maxQty}</strong> units.</p>
      </div>
      <FormField label="Quantity Completed" required error={errors.quantity?.message}>
        <input type="number" max={maxQty} {...register("quantity")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
      </FormField>
      <FormField label="Completion Date" required error={errors.recordedAt?.message}>
        <input type="date" {...register("recordedAt")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
      </FormField>
      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Record Completion"}</Button>
      </div>
    </form>
  );
};

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentDate: z.string().min(1, "Date is required"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "OTHER"]).default("CASH"),
  note: z.string().optional()
});

const PaymentForm = ({ contract, onSubmit, onClose }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: contract.stats.payableAmount, paymentDate: new Date().toISOString().split("T")[0], paymentMethod: "CASH", note: "" }
  });

  return (
    <form className="space-y-4 p-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="bg-blue-50/50 p-3 rounded-md mb-4 border border-blue-100">
        <p className="text-sm text-blue-800">Max payable amount: <strong><MoneyDisplay amount={contract.stats.payableAmount} /></strong></p>
      </div>
      <FormField label="Amount (ETB)" required error={errors.amount?.message}>
        <input type="number" step="0.01" max={contract.stats.payableAmount} {...register("amount")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
      </FormField>
      <FormField label="Payment Date" required error={errors.paymentDate?.message}>
        <input type="date" {...register("paymentDate")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
      </FormField>
      <FormField label="Payment Method" required error={errors.paymentMethod?.message}>
        <select {...register("paymentMethod")} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent">
          <option value="CASH">Cash</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="CHEQUE">Cheque</option>
          <option value="OTHER">Other</option>
        </select>
      </FormField>
      <FormField label="Note (Optional)" error={errors.note?.message}>
        <textarea {...register("note")} rows={2} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
      </FormField>
      <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Record Payment"}</Button>
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
  const [voidReason, setVoidReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const contractQuery = useQuery({
    queryKey: ["contracts", id],
    queryFn: () => getContractById(id),
    enabled: !!id,
  });

  const contract = unwrapEntityResponse(contractQuery.data);

  // Mutations
  const recordCompletionMutation = useMutation({
    mutationFn: (data) => recordCompletion({ contract: id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts", id] });
      toast.success("Completion recorded");
      setCompletionModalOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to record completion."))
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (data) => createContractorPayment({ contract: id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts", id] });
      toast.success("Payment recorded");
      setPaymentModalOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to record payment."))
  });

  const voidCompletionMutation = useMutation({
    mutationFn: ({ id, voidReason }) => voidCompletion({ id, voidReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts", id] });
      toast.success("Completion voided");
      setVoidingCompletion(null);
      setVoidReason("");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to void completion."))
  });

  const voidPaymentMutation = useMutation({
    mutationFn: ({ id, voidReason }) => voidContractorPayment({ id, voidReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts", id] });
      toast.success("Payment voided");
      setVoidingPayment(null);
      setVoidReason("");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to void payment."))
  });

  const cancelMutation = useMutation({
    mutationFn: (reason) => cancelContract({ id, cancelReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts", id] });
      toast.success("Contract cancelled");
      setCancelModalOpen(false);
      setCancelReason("");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to cancel contract."))
  });

  if (contractQuery.isLoading) return <DetailSkeleton />;
  if (contractQuery.isError || !contract) return <ErrorState description={getApiErrorMessage(contractQuery.error, "Failed to load contract details.")} />;

  const stats = contract.stats;
  const isOverdue = stats.isOverdue && contract.status === "ACTIVE";

  // Tables
  const completionsColumns = [
    { header: "Date", accessor: (row) => formatDate(row.recordedAt), className: "text-secondary" },
    { header: "Quantity", accessor: "quantity" },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <Can permission="contractCompletions.void">
          {row.status === 'active' && contract.status === 'ACTIVE' && (
            <Button variant="ghostDanger" size="sm" onClick={() => setVoidingCompletion(row)}>Void</Button>
          )}
        </Can>
      ) 
    }
  ];

  const paymentsColumns = [
    { header: "Ref", accessor: "paymentReference", className: "font-mono text-xs" },
    { header: "Date", accessor: (row) => formatDate(row.paymentDate), className: "text-secondary" },
    { header: "Amount", accessor: (row) => <MoneyDisplay amount={row.amount} className={row.status === 'voided' ? 'line-through opacity-50' : ''} /> },
    { header: "Method", accessor: (row) => <span className="capitalize">{row.paymentMethod?.replace('_', ' ')}</span> },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
    { 
      header: "Actions", 
      isActions: true,
      accessor: (row) => (
        <Can permission="contractorPayments.void">
          {row.status === 'active' && (
            <Button variant="ghostDanger" size="sm" onClick={() => setVoidingPayment(row)}>Void</Button>
          )}
        </Can>
      ) 
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-primary font-display tracking-tight">Contract {contract.contractNumber}</h1>
            <StatusBadge status={contract.status} />
            {isOverdue && <StatusBadge label="Overdue" className="bg-danger/10 text-danger border border-danger/20" />}
          </div>
          <p className="text-sm text-secondary">Manage contract progress and financial standing.</p>
        </div>
        <Link to="/contracts" className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-primary hover:bg-main transition-colors">
          Back to contracts
        </Link>
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
              <div>
                <p className="text-sm text-secondary mb-1">Completed Qty</p>
                <p className="text-lg font-semibold text-primary">{stats.completedQuantity} <span className="text-xs font-normal text-secondary">/ {contract.quantity}</span></p>
              </div>
              <div>
                <p className="text-sm text-secondary mb-1">Work Value</p>
                <p className="text-lg font-semibold text-primary"><MoneyDisplay amount={stats.completedWorkValue} /></p>
              </div>
              <div>
                <p className="text-sm text-secondary mb-1">Total Paid</p>
                <p className="text-lg font-semibold text-primary"><MoneyDisplay amount={stats.totalPaid} /></p>
              </div>
              <div className="bg-accent/10 -m-2 p-2 rounded-md border border-accent/20">
                <p className="text-sm text-accent mb-1 font-medium">Payable Amount</p>
                <p className="text-lg font-bold text-accent"><MoneyDisplay amount={stats.payableAmount} /></p>
              </div>
            </div>
            
            {/* Action Buttons */}
            {contract.status === "ACTIVE" && (
              <div className="flex flex-wrap gap-3 mt-6">
                <Can permission="contractCompletions.create">
                  <Button onClick={() => setCompletionModalOpen(true)} disabled={stats.completedQuantity >= contract.quantity}>
                    Record Completion
                  </Button>
                </Can>
                <Can permission="contractorPayments.create">
                  <Button variant="secondary" onClick={() => setPaymentModalOpen(true)} disabled={stats.payableAmount <= 0}>
                    Record Payment
                  </Button>
                </Can>
                <Can permission="contracts.cancel">
                  <Button variant="ghostDanger" onClick={() => setCancelModalOpen(true)}>
                    Cancel Contract
                  </Button>
                </Can>
              </div>
            )}
          </DetailSection>

          <DetailSection title="Completions Log">
            <DataTable 
              columns={completionsColumns} 
              data={contract.completions || []} 
              keyExtractor={(row) => row._id} 
              emptyState={<div className="text-sm text-secondary p-4 text-center">No completions recorded yet.</div>}
            />
          </DetailSection>

          <DetailSection title="Payments Log">
            <DataTable 
              columns={paymentsColumns} 
              data={contract.payments || []} 
              keyExtractor={(row) => row._id} 
              emptyState={<div className="text-sm text-secondary p-4 text-center">No payments recorded yet.</div>}
            />
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

          <DetailSection title="System Information">
            <div className="space-y-1">
              <DetailItem label="Internal ID" value={<span className="font-mono text-xs">{contract._id}</span>} />
              <DetailItem label="Created By" value={contract.createdBy?.name || "-"} />
              <DetailItem label="Created On" value={formatDateTime(contract.createdAt)} />
              <DetailItem label="Last Updated" value={formatDateTime(contract.updatedAt)} />
            </div>
          </DetailSection>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isCompletionModalOpen} title="Record Task Completion" onClose={() => setCompletionModalOpen(false)}>
        <CompletionForm contract={contract} onClose={() => setCompletionModalOpen(false)} onSubmit={(data) => recordCompletionMutation.mutateAsync(data)} />
      </Modal>

      <Modal isOpen={isPaymentModalOpen} title="Record Payment" onClose={() => setPaymentModalOpen(false)}>
        <PaymentForm contract={contract} onClose={() => setPaymentModalOpen(false)} onSubmit={(data) => recordPaymentMutation.mutateAsync(data)} />
      </Modal>

      <ConfirmDialog
        isOpen={isCancelModalOpen}
        title="Cancel Contract"
        message="Are you sure you want to cancel this contract? You can only cancel if there are no unpaid completed tasks and the contractor hasn't been overpaid. This action cannot be undone."
        confirmLabel="Cancel Contract"
        cancelLabel="Keep Active"
        onConfirm={() => cancelMutation.mutateAsync(cancelReason)}
        onCancel={() => { setCancelModalOpen(false); setCancelReason(""); }}
        isDestructive
        isLoading={cancelMutation.isPending}
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-secondary mb-1">Reason for cancellation (required)</label>
          <input type="text" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger" required />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={!!voidingCompletion}
        title="Void Completion"
        message="Are you sure you want to void this completion? This will decrease the total completed work value."
        confirmLabel="Void Completion"
        cancelLabel="Cancel"
        onConfirm={() => voidCompletionMutation.mutateAsync({ id: voidingCompletion._id, voidReason })}
        onCancel={() => { setVoidingCompletion(null); setVoidReason(""); }}
        isDestructive
        isLoading={voidCompletionMutation.isPending}
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-secondary mb-1">Reason (required)</label>
          <input type="text" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger" required />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={!!voidingPayment}
        title="Void Payment"
        message="Are you sure you want to void this payment? This will increase the payable amount."
        confirmLabel="Void Payment"
        cancelLabel="Cancel"
        onConfirm={() => voidPaymentMutation.mutateAsync({ id: voidingPayment._id, voidReason })}
        onCancel={() => { setVoidingPayment(null); setVoidReason(""); }}
        isDestructive
        isLoading={voidPaymentMutation.isPending}
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-secondary mb-1">Reason (required)</label>
          <input type="text" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} className="w-full rounded-md border border-border bg-main px-3 py-2 text-primary focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger" required />
        </div>
      </ConfirmDialog>
    </div>
  );
};
