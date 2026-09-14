import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPurchaseById, updatePurchase } from "../api";
import { createSupplierPayment, getSupplierPayments } from "../../supplier-payments/api";
import { getApiErrorMessage, unwrapEntityResponse, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate, formatDateTime, getLocalISODate } from "../../../utils/formatters";
import { usePermission } from "../../../hooks/usePermission";
import { Edit, CreditCard, Calendar, ShoppingBag, Receipt, Building2 } from "lucide-react";
import toast from "react-hot-toast";

import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Can } from "../../../components/Can";
import { Button } from "../../../components/ui/Button";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { ListGroup, ListItem } from "../../../components/ui/ListGroup";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { Modal } from "../../../components/ui/Modal";
import { PageHeader } from "../../../components/ui/PageHeader";

import { SupplierPaymentModal } from "../../supplier-payments/components/SupplierPaymentModal";
import { PurchaseForm } from "../components/PurchaseForm";

export const PurchaseDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const purchaseQuery = useQuery({ 
    queryKey: ["purchases", id], 
    queryFn: () => getPurchaseById(id), 
    enabled: !!id 
  });
  
  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({ 
    queryKey: ["supplier-payments", { purchase: id }], 
    queryFn: () => getSupplierPayments({ purchase: id, limit: 100 }), 
    enabled: can("supplierPayments.read") && !!id 
  });
  
  const payments = unwrapListResponse(paymentsData).items || [];

  const createPaymentMutation = useMutation({
    mutationFn: createSupplierPayment,
    meta: { suppressToast: true },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["supplier-payments"] }); 
      queryClient.invalidateQueries({ queryKey: ["suppliers"] }); 
      queryClient.invalidateQueries({ queryKey: ["purchases"] }); 
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Payment recorded successfully"); 
      setPaymentModalOpen(false); 
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to record payment")),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updatePurchase({ id, data }),
    meta: { suppressToast: true },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["purchases"] }); 
      queryClient.invalidateQueries({ queryKey: ["suppliers"] }); 
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Purchase updated successfully"); 
      setEditModalOpen(false); 
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to update purchase")),
  });

  const purchase = unwrapEntityResponse(purchaseQuery.data);
  if (purchaseQuery.isLoading) return <DetailSkeleton />;
  if (purchaseQuery.isError || !purchase) return <ErrorState description={getApiErrorMessage(purchaseQuery.error, "Failed to load purchase details.")} />;

  const progress = purchase.totalAmount > 0 ? Math.round(((purchase.allocatedAmount || 0) / purchase.totalAmount) * 100) : 0;
  const progressVariant = purchase.paymentStatus === 'PAID' ? 'success' : purchase.paymentStatus === 'PARTIALLY_PAID' ? 'warning' : 'financeOut';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Purchase #${purchase.purchaseNumber}`}
        description="Purchase invoice and payment details."
        backTo="/purchases"
        backLabel="Back to purchases"
        titleCustom={
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary font-display tracking-tight">
              Purchase <span className="text-secondary/50">#</span>{purchase.purchaseNumber}
            </h1>
            <StatusBadge status={purchase.paymentStatus} />
          </div>
        }
        actions={
          <div className="flex items-center gap-3">
            <Can permission="supplierPayments.create">
              {purchase.paymentStatus !== "PAID" && (
                <Button variant="primary" leftIcon={CreditCard} onClick={() => setPaymentModalOpen(true)}>
                  Record Payment
                </Button>
              )}
            </Can>
            <Can permission="purchases.update">
              <Button variant="outline" leftIcon={Edit} onClick={() => setEditModalOpen(true)}>
                Edit Purchase
              </Button>
            </Can>
          </div>
        }
      />

      {/* Invoice Layout */}
      <div className="bg-surface border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        {/* Header Row */}
        <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6 border-b border-border/50 bg-main/30">
          <div className="space-y-3">
            <div>
              <div className="text-xs font-bold text-secondary uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Supplier</div>
              <div className="text-xl font-bold text-primary leading-none">{purchase.supplier?.name || "Unknown"}</div>
              {purchase.supplier?.balance !== undefined && (
                <div className="text-xs text-secondary mt-1 font-medium flex items-center gap-1">
                  Overall Balance: <MoneyDisplay amount={purchase.supplier.balance} variant={purchase.supplier.balance > 0 ? "financeOut" : purchase.supplier.balance < 0 ? "success" : "default"} />
                </div>
              )}
            </div>
            
            <div className="pt-2">
              <div className="text-xs font-bold text-secondary uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Invoice Date</div>
              <div className="text-sm font-semibold text-primary">{formatDate(purchase.date)}</div>
            </div>
          </div>
          
          <div className="text-left md:text-right flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Total Amount</div>
              <div className="text-4xl font-black text-finance-out tracking-tight">
                <MoneyDisplay amount={purchase.totalAmount || 0} variant="financeOut" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment Progress */}
        <div className="px-6 md:px-8 py-5 bg-surface border-b border-border/50">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-semibold text-primary flex items-center gap-2">
              Paid: <MoneyDisplay amount={purchase.allocatedAmount || 0} />
            </div>
            <div className="text-sm font-bold text-warning">
              {purchase.remainingAmount > 0 ? (
                <>Remaining: <MoneyDisplay amount={purchase.remainingAmount} variant="warning" /></>
              ) : (
                <span className="text-success flex items-center gap-1"><Receipt className="w-4 h-4" /> Fully Paid</span>
              )}
            </div>
          </div>
          <ProgressBar progress={progress} variant={progressVariant} size="lg" animated={purchase.paymentStatus !== 'PAID'} />
        </div>

        {/* Notes */}
        {purchase.note && (
          <div className="px-6 md:px-8 py-4 bg-accent/5 border-b border-border/50">
            <span className="text-xs font-bold text-accent uppercase tracking-wider block mb-1">Invoice Notes</span>
            <p className="text-sm text-primary">{purchase.note}</p>
          </div>
        )}

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 text-xs font-bold text-secondary uppercase tracking-wider bg-main/20">
                <th className="p-4 pl-6 md:pl-8 font-semibold w-full">Item Description</th>
                <th className="p-4 font-semibold whitespace-nowrap">Unit Price</th>
                <th className="p-4 font-semibold text-center">Qty</th>
                <th className="p-4 pr-6 md:pr-8 font-semibold text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20 bg-surface">
              {purchase.items?.map((item, index) => (
                <tr key={index} className="hover:bg-main/20 transition-colors">
                  <td className="p-4 pl-6 md:pl-8">
                    <div className="font-semibold text-primary">{item.materialName || item.material?.name || "Unknown Material"}</div>
                    {item.materialCategory && <div className="text-xs text-secondary mt-0.5">{item.materialCategory}</div>}
                  </td>
                  <td className="p-4 text-sm font-medium"><MoneyDisplay amount={item.unitPrice} /></td>
                  <td className="p-4 text-sm font-semibold text-center">
                    {item.quantity} <span className="text-xs font-normal text-secondary ml-0.5">{item.unit || "unit"}</span>
                  </td>
                  <td className="p-4 pr-6 md:pr-8 text-right text-sm font-bold text-primary">
                    <MoneyDisplay amount={item.quantity * item.unitPrice} />
                  </td>
                </tr>
              ))}
              <tr className="bg-main/30 border-t-2 border-border/50">
                <td colSpan="3" className="p-4 pl-6 md:pl-8 text-right text-sm font-bold text-secondary uppercase tracking-wider">Grand Total</td>
                <td className="p-4 pr-6 md:pr-8 text-right text-lg font-black text-finance-out">
                  <MoneyDisplay amount={purchase.totalAmount} variant="financeOut" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Two columns for related payments and system info */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Can permission="supplierPayments.read">
            <div>
              <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-3">Payments Applied to this Invoice</h3>
              {isPaymentsLoading ? <DetailSkeleton /> : payments?.length > 0 ? (
                <ListGroup>
                  {payments.map((row) => {
                    const allocation = row.allocations?.find(a => a.purchase?._id === id || a.purchase === id);
                    const applied = allocation ? allocation.amount : 0;
                    return (
                      <ListItem 
                        key={row._id}
                        title={<span className="font-mono text-[10px] font-bold text-primary tracking-widest">{row.paymentReference || "Payment"}</span>}
                        subtitle={`${formatDate(row.date)} • ${row.type}`}
                        right={
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-bold text-finance-out tracking-tight">
                              <MoneyDisplay amount={applied} variant="financeOut" />
                            </span>
                            <StatusBadge status={row.status} />
                          </div>
                        }
                      />
                    );
                  })}
                </ListGroup>
              ) : (
                <div className="text-center py-6 text-sm text-secondary border border-dashed border-border/50 rounded-lg bg-surface/30">
                  <Receipt className="h-6 w-6 text-muted mx-auto mb-2" />
                  No payments have been applied to this purchase yet.
                </div>
              )}
            </div>
          </Can>
        </div>

        <div>
          <SystemInfoSection 
            id={purchase._id} 
            idLabel="Purchase ID" 
            createdAt={purchase.createdAt}
            extraItems={[
              { label: "Reference No", value: purchase.purchaseNumber || purchase.referenceNumber || "-" }, 
              { label: "Created By", value: purchase.createdBy?.name || purchase.createdByName || "Unknown User" }
            ]}
          />
        </div>
      </div>

      <Modal isOpen={isEditModalOpen} title="Edit Purchase" onClose={() => setEditModalOpen(false)}>
        {purchase && (
          <PurchaseForm
            initialData={{ 
              supplier: purchase.supplier?._id || purchase.supplier || "", 
              purchaseDate: purchase.date ? getLocalISODate(purchase.date) : getLocalISODate(), 
              notes: purchase.note || "", 
              items: purchase.items?.map(i => ({ material: i.material?._id || i.material || "", quantity: i.quantity, unitPrice: i.unitPrice })) || [] 
            }}
            onClose={() => setEditModalOpen(false)}
            onSubmit={(data) => updateMutation.mutateAsync(data)}
            isFullyPaid={purchase.paymentStatus === "PAID"}
          />
        )}
      </Modal>
      
      <SupplierPaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)} 
        preSelectedPurchase={purchase} 
        preSelectedSupplier={purchase.supplier} 
        onSubmit={(data) => createPaymentMutation.mutateAsync(data)} 
      />
    </div>
  );
};
