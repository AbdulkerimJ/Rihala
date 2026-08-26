import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPurchaseById, updatePurchase } from "../api";
import { createSupplierPayment, getSupplierPayments } from "../../supplier-payments/api";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Modal } from "../../../components/ui/Modal";
import { DetailSection } from "../../../components/ui/DetailSection";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { DataTable } from "../../../components/ui/DataTable";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";
import { getApiErrorMessage, unwrapEntityResponse, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";
import { usePermission } from "../../../hooks/usePermission";
import { ShoppingBag, Calendar, Building2, ArrowLeft, Edit } from "lucide-react";
import toast from "react-hot-toast";
import { SupplierPaymentModal } from "../../supplier-payments/components/SupplierPaymentModal";
import { PurchaseForm } from "./PurchasesList";

export const PurchaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  const purchaseQuery = useQuery({
    queryKey: ["purchases", id],
    queryFn: () => getPurchaseById(id),
    enabled: !!id,
  });

  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["supplier-payments", { purchase: id }],
    queryFn: () => getSupplierPayments({ purchase: id, limit: 100 }),
    enabled: can("supplierPayments.read") && !!id,
  });
  
  const payments = unwrapListResponse(paymentsData).items || [];

  const createPaymentMutation = useMutation({
    mutationFn: createSupplierPayment,
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-payments"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast.success("Payment recorded successfully");
      setPaymentModalOpen(false);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to record payment"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updatePurchase({ id, data }),
    meta: { suppressToast: true },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] }); // Since total amount might change and affect supplier balance
      toast.success("Purchase updated successfully");
      setEditModalOpen(false);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update purchase"));
    },
  });

  const purchase = unwrapEntityResponse(purchaseQuery.data);

  if (purchaseQuery.isLoading) return <DetailSkeleton />;
  
  if (purchaseQuery.isError || !purchase) {
    return <ErrorState description={getApiErrorMessage(purchaseQuery.error, "Failed to load purchase details.")} />;
  }

  const itemColumns = [
    {
      header: "Material",
      accessor: (item) => (
        <div>
          <span className="font-medium text-primary">{item.materialName || item.material?.name || "Unknown Material"}</span>
          {item.unit && <span className="text-xs text-secondary block mt-0.5">Unit: {item.unit}</span>}
        </div>
      ),
    },
    {
      header: "Quantity",
      accessor: "quantity",
      className: "text-right",
      headerClassName: "text-right",
    },
    {
      header: "Unit Price",
      accessor: (item) => <MoneyDisplay amount={item.unitPrice} />,
      className: "text-right",
      headerClassName: "text-right",
    },
    {
      header: "Total",
      accessor: (item) => <MoneyDisplay amount={item.quantity * item.unitPrice} />,
      className: "font-semibold text-right",
      headerClassName: "text-right",
    },
  ];

  const paymentColumns = [
    { header: "Date", accessor: (row) => formatDate(row.date) },
    { header: "Reference", accessor: "paymentReference", className: "font-mono text-xs" },
    { 
      header: "Type", 
      accessor: (row) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${row.type === 'SPECIFIC' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
          {row.type}
        </span>
      ) 
    },
    { 
      header: "Applied Amount", 
      accessor: (row) => {
        const allocation = row.allocations?.find(a => a.purchase?._id === id || a.purchase === id);
        const applied = allocation ? allocation.amount : 0;
        return <MoneyDisplay amount={applied} variant="financeOut" />;
      },
      className: "text-right",
      headerClassName: "text-right",
    },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-surface text-secondary hover:text-primary hover:bg-main transition-colors shrink-0"
            title="Back"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-primary font-display tracking-tight">Purchase #{purchase.purchaseNumber}</h1>
              <StatusBadge status={purchase.paymentStatus} />
            </div>
            <p className="text-sm text-secondary">Purchase details and itemization.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Can permission="purchases.update">
            <Button variant="outline" onClick={() => setEditModalOpen(true)}>
              <Edit className="h-4 w-4 mr-2" /> Edit Purchase
            </Button>
          </Can>
          <Can permission="supplierPayments.create">
             {purchase.paymentStatus !== "PAID" && (
                <Button onClick={() => setPaymentModalOpen(true)}>Record Payment</Button>
             )}
          </Can>
        </div>
      </div>

      {/* Unified Overview Card */}
      <div className="bg-surface border border-border/50 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          
          {/* Left side: Basic Info */}
          <div className="space-y-4 flex-1">
            <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-2">Purchase Overview</h3>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-main flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="text-xs text-secondary block leading-none mb-1">Supplier</span>
                <span className="text-primary font-semibold text-sm leading-none">{purchase.supplier?.name || "Unknown"}</span>
                {purchase.supplier?.balance !== undefined && (
                   <span className="text-xs text-secondary block mt-1.5 flex gap-1 items-center">
                     Balance: <MoneyDisplay amount={purchase.supplier.balance} variant={purchase.supplier.balance > 0 ? "financeOut" : purchase.supplier.balance < 0 ? "financeIn" : "default"} />
                   </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-main flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="text-xs text-secondary block leading-none mb-1">Purchase Date</span>
                <span className="text-primary font-semibold text-sm leading-none">{formatDate(purchase.date)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-main flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="text-xs text-secondary block leading-none mb-1">Total Items</span>
                <span className="text-primary font-semibold text-sm leading-none">{purchase.items?.length || 0} items</span>
              </div>
            </div>
            {purchase.note && (
              <div className="pt-3 border-t border-border/50 mt-4">
                <span className="text-xs text-secondary block mb-1">Notes</span>
                <p className="text-sm text-primary">{purchase.note}</p>
              </div>
            )}
          </div>

          {/* Right side: Financials & Progress Bar */}
          <div className="flex-1 space-y-4 md:border-l md:border-border/50 md:pl-8 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2">
               <div className="text-secondary text-sm font-medium">Total Amount</div>
               <div className="text-2xl font-bold text-primary"><MoneyDisplay amount={purchase.totalAmount || 0} /></div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-finance-out font-semibold">Paid: <MoneyDisplay amount={purchase.allocatedAmount || 0} /></span>
                <span className={purchase.remainingAmount > 0 ? 'text-warning font-semibold' : 'text-success font-semibold'}>
                  Remaining: <MoneyDisplay amount={purchase.remainingAmount || 0} />
                </span>
              </div>
              {/* Progress Bar */}
              <div className="h-2.5 w-full bg-main rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-finance-out transition-all duration-500 rounded-full"
                  style={{ width: `${purchase.totalAmount > 0 ? Math.min(100, Math.round(((purchase.allocatedAmount || 0) / purchase.totalAmount) * 100)) : 0}%` }}
                />
              </div>
              <div className="text-right text-xs text-secondary font-medium">
                {purchase.totalAmount > 0 ? Math.min(100, Math.round(((purchase.allocatedAmount || 0) / purchase.totalAmount) * 100)) : 0}% Paid
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DetailSection title="Purchased Items">
            <DataTable
              columns={itemColumns}
              data={purchase.items}
              keyExtractor={(_, index) => index}
            />
            <div className="mt-4 flex justify-end items-center gap-4 pt-2">
              <span className="text-sm font-semibold text-primary">Grand Total:</span>
              <span className="text-lg font-bold text-finance-out">
                <MoneyDisplay amount={purchase.totalAmount} variant="financeOut" />
              </span>
            </div>
          </DetailSection>

          <Can permission="supplierPayments.read">
            <DetailSection title="Related Payments">
              <DataTable
                columns={paymentColumns}
                data={payments}
                keyExtractor={(row) => row._id}
                isLoading={isPaymentsLoading}
                emptyState={
                  <div className="text-center py-6 text-sm text-secondary">
                    No payments have been recorded for this purchase yet.
                  </div>
                }
              />
            </DetailSection>
          </Can>

          <SupplierPaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            preSelectedPurchase={purchase}
            preSelectedSupplier={purchase.supplier}
            onSubmit={(data) => createPaymentMutation.mutateAsync(data)}
          />
        </div>

        <div className="space-y-6">
          <SystemInfoSection
            id={purchase._id}
            idLabel="Purchase ID"
            createdAt={purchase.createdAt}
            extraItems={[
              { label: "Reference No", value: purchase.purchaseNumber || purchase.referenceNumber || "-" },
              { label: "Created By", value: purchase.createdBy?.name || purchase.createdByName || "Unknown User" },
            ]}
          />
        </div>
      </div>

      <Modal isOpen={isEditModalOpen} title="Edit Purchase" onClose={() => setEditModalOpen(false)}>
        {purchase && (
          <PurchaseForm
            initialData={{
              supplier: purchase.supplier?._id || purchase.supplier || "",
              purchaseDate: purchase.date ? new Date(purchase.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              notes: purchase.note || "",
              items: purchase.items?.map(i => ({
                material: i.material?._id || i.material || "",
                quantity: i.quantity,
                unitPrice: i.unitPrice
              })) || []
            }}
            onClose={() => setEditModalOpen(false)}
            onSubmit={(data) => updateMutation.mutateAsync(data)}
            isFullyPaid={purchase.paymentStatus === "PAID"}
          />
        )}
      </Modal>
    </div>
  );
};
