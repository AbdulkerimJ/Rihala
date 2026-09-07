import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupplierById, updateSupplier } from "../api";
import { getPurchases } from "../../purchases/api";
import { getSupplierPayments } from "../../supplier-payments/api";
import { getApiErrorMessage, unwrapEntityResponse, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDateTime } from "../../../utils/formatters";
import { Phone, Wallet, FileText, CreditCard, Edit, ShoppingBag, MapPin } from "lucide-react";
import { usePermission } from "../../../hooks/usePermission";
import { createSupplierPayment } from "../../supplier-payments/api";
import toast from "react-hot-toast";

import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Can } from "../../../components/Can";
import { Button } from "../../../components/ui/Button";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { ListGroup, ListItem } from "../../../components/ui/ListGroup";
import { Modal } from "../../../components/ui/Modal";
import { PageHeader } from "../../../components/ui/PageHeader";

import { SupplierForm } from "../components/SupplierForm";
import { SupplierPaymentModal } from "../../supplier-payments/components/SupplierPaymentModal";

export const SupplierDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [isOpen, setIsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const supplierQuery = useQuery({ 
    queryKey: ["suppliers", id], 
    queryFn: () => getSupplierById(id), 
    enabled: !!id 
  });
  
  const { data: purchasesData, isLoading: isPurchasesLoading } = useQuery({ 
    queryKey: ["purchases", "list", { supplier: id }], 
    queryFn: () => getPurchases({ supplier: id, limit: 50 }), 
    enabled: !!id && can("purchases.read") 
  });
  
  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({ 
    queryKey: ["supplier-payments", "list", { supplier: id }], 
    queryFn: () => getSupplierPayments({ supplier: id, limit: 50 }), 
    enabled: !!id && can("supplierPayments.read") 
  });

  const updateMutation = useMutation({ 
    mutationFn: updateSupplier, 
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["suppliers"] }); 
      toast.success("Supplier updated successfully"); 
      setIsOpen(false); 
    } 
  });
  
  const paymentMutation = useMutation({ 
    mutationFn: createSupplierPayment, 
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["supplier-payments"] }); 
      queryClient.invalidateQueries({ queryKey: ["suppliers", id] }); 
      toast.success("Payment recorded successfully"); 
      setIsPaymentOpen(false); 
    } 
  });

  const supplier = unwrapEntityResponse(supplierQuery.data);
  const purchases = unwrapListResponse(purchasesData).items || [];
  const payments = unwrapListResponse(paymentsData).items || [];

  if (supplierQuery.isLoading) return <DetailSkeleton />;
  if (supplierQuery.isError || !supplier) return <ErrorState description={getApiErrorMessage(supplierQuery.error, "Failed to load supplier details.")} />;

  const isOwed = supplier.balance > 0;
  const isOverpaid = supplier.balance < 0;
  const balanceColor = isOwed ? "text-danger" : isOverpaid ? "text-success" : "text-primary";
  const balanceBg = isOwed ? "bg-danger/5 border-danger/20" : isOverpaid ? "bg-success/5 border-success/20" : "bg-main/50 border-border/50";

  return (
    <div className="space-y-6">
      <PageHeader
        title={supplier.name}
        description={supplier.phone || "No phone provided"}
        backTo="/suppliers"
        backLabel="Back to suppliers"
        titleCustom={
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary font-display tracking-tight">{supplier.name}</h1>
            <StatusBadge status={supplier.status} />
          </div>
        }
        actions={
          <div className="flex items-center gap-3">
            <Can permission="supplierPayments.create">
              <Button variant="primary" leftIcon={CreditCard} onClick={() => setIsPaymentOpen(true)}>
                Record Payment
              </Button>
            </Can>
            <Can permission="suppliers.update">
              <Button variant="outline" leftIcon={Edit} onClick={() => setIsOpen(true)}>
                Edit Supplier
              </Button>
            </Can>
          </div>
        }
      />

      {/* Top Section: Balance Hero + Contact/Notes */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Balance Hero Card */}
        <div className={`lg:col-span-2 rounded-2xl border p-6 sm:p-8 flex flex-col justify-center items-center sm:items-start shadow-sm ${balanceBg}`}>
          <div className="flex items-center gap-2 mb-2 text-secondary">
            <Wallet className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-widest">Current Balance</span>
          </div>
          <div className={`text-4xl sm:text-5xl font-black tracking-tight ${balanceColor}`}>
            <MoneyDisplay amount={Math.abs(supplier.balance ?? 0)} />
          </div>
          <div className="mt-3">
            {isOwed && <span className="inline-block px-3 py-1 rounded-full bg-danger/10 text-danger text-sm font-semibold">We owe this supplier</span>}
            {isOverpaid && <span className="inline-block px-3 py-1 rounded-full bg-success/10 text-success text-sm font-semibold">Supplier is overpaid (Credit)</span>}
            {!isOwed && !isOverpaid && <span className="inline-block px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-semibold">Account settled completely</span>}
          </div>
        </div>

        {/* Address & Notes Sidebar */}
        <div className="bg-surface rounded-2xl border border-border/50 p-6 shadow-sm flex flex-col gap-6">
          <div>
            <span className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
              <MapPin className="w-4 h-4" /> Address
            </span>
            <p className="text-sm text-primary whitespace-pre-wrap leading-relaxed">
              {supplier.address || "No address provided."}
            </p>
          </div>
          <div className="pt-6 border-t border-border/50">
            <span className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
              <FileText className="w-4 h-4" /> Notes
            </span>
            <p className="text-sm text-primary whitespace-pre-wrap leading-relaxed">
              {supplier.notes || supplier.note || "No additional notes."}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Side-by-Side Financials */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Can permission="purchases.read">
          <div>
            <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-3">Recent Purchases</h3>
            {isPurchasesLoading ? <DetailSkeleton /> : purchases?.length > 0 ? (
              <ListGroup>
                {purchases.map(row => (
                  <ListItem 
                    key={row._id} 
                    to={`/purchases/${row._id}`}
                    title={<span className="font-mono text-[10px] font-bold text-accent uppercase tracking-widest">{row.purchaseNumber || "-"}</span>}
                    subtitle={formatDateTime(row.date)}
                    right={
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-finance-out tracking-tight shrink-0">
                          <MoneyDisplay amount={row.totalAmount} variant="financeOut" />
                        </span>
                        <StatusBadge status={row.paymentStatus} className="shrink-0" />
                      </div>
                    }
                  />
                ))}
              </ListGroup>
            ) : (
              <div className="text-center py-8 text-sm text-secondary flex flex-col items-center border border-dashed border-border/50 rounded-xl bg-surface/30">
                <ShoppingBag className="h-8 w-8 text-muted mb-3" />
                No purchases recorded from this supplier.
              </div>
            )}
          </div>
        </Can>

        <Can permission="supplierPayments.read">
          <div>
            <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-3">Payment History</h3>
            {isPaymentsLoading ? <DetailSkeleton /> : payments?.length > 0 ? (
              <ListGroup>
                {payments.map(row => (
                  <ListItem 
                    key={row._id}
                    title={<span className="font-mono text-[10px] font-bold text-primary tracking-widest">{row.paymentReference}</span>}
                    subtitle={formatDateTime(row.paymentDate)}
                    right={
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-sm font-bold tracking-tight shrink-0 ${row.status === 'voided' ? 'line-through opacity-50 text-secondary' : 'text-primary'}`}>
                          <MoneyDisplay amount={row.amount} />
                        </span>
                        <StatusBadge status={row.status} className="shrink-0" />
                      </div>
                    }
                  />
                ))}
              </ListGroup>
            ) : (
              <div className="text-center py-8 text-sm text-secondary flex flex-col items-center border border-dashed border-border/50 rounded-xl bg-surface/30">
                <CreditCard className="h-8 w-8 text-muted mb-3" />
                No payments have been recorded for this supplier.
              </div>
            )}
          </div>
        </Can>
      </div>

      {/* System Info */}
      <SystemInfoSection 
        id={supplier._id} 
        idLabel="Supplier ID" 
        createdAt={supplier.createdAt} 
        updatedAt={supplier.updatedAt} 
      />

      <Modal isOpen={isOpen} title="Edit Supplier" onClose={() => setIsOpen(false)}>
        <SupplierForm 
          initialData={supplier} 
          onClose={() => setIsOpen(false)} 
          onSubmit={(data) => updateMutation.mutateAsync({ id: supplier._id, data })} 
        />
      </Modal>

      <SupplierPaymentModal 
        isOpen={isPaymentOpen} 
        onClose={() => setIsPaymentOpen(false)} 
        onSubmit={paymentMutation.mutateAsync} 
        preSelectedSupplier={supplier} 
      />
    </div>
  );
};
