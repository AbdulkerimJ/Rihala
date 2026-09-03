import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupplierById, updateSupplier } from "../api";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { Can } from "../../../components/Can";
import { SupplierForm } from "../components/SupplierForm";
import { SupplierPaymentModal } from "../../supplier-payments/components/SupplierPaymentModal";
import { Tabs } from "../../../components/ui/Tabs";
import { getPurchases } from "../../purchases/api";
import { getSupplierPayments } from "../../supplier-payments/api";
import { getApiErrorMessage, unwrapEntityResponse, unwrapListResponse } from "../../../utils/apiResponse";
import { formatDateTime } from "../../../utils/formatters";
import { DetailSection } from "../../../components/ui/DetailSection";
import { ListGroup, ListItem } from "../../../components/ui/ListGroup";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { Phone, Wallet, TrendingUp, TrendingDown, ShoppingBag, FileText, CreditCard, Edit, Plus } from "lucide-react";
import { BackButton } from "../../../components/ui/BackButton";
import { usePermission } from "../../../hooks/usePermission";
import { createSupplierPayment } from "../../supplier-payments/api";
import toast from "react-hot-toast";

export const SupplierDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [isOpen, setIsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, financials
  
  const supplierQuery = useQuery({
    queryKey: ["suppliers", id],
    queryFn: () => getSupplierById(id),
    enabled: !!id,
  });

  const { data: purchasesData, isLoading: isPurchasesLoading } = useQuery({
    queryKey: ["purchases", "list", { supplier: id }],
    queryFn: () => getPurchases({ supplier: id, limit: 50 }),
    enabled: !!id && can("purchases.read"),
  });

  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["supplier-payments", "list", { supplier: id }],
    queryFn: () => getSupplierPayments({ supplier: id, limit: 50 }),
    enabled: !!id && can("supplierPayments.read"),
  });

  const updateMutation = useMutation({
    mutationFn: updateSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier updated successfully");
      setIsOpen(false);
    },
  });

  const paymentMutation = useMutation({
    mutationFn: createSupplierPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-payments"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers", id] });
      toast.success("Payment recorded successfully");
      setIsPaymentOpen(false);
    },
  });

  const supplier = unwrapEntityResponse(supplierQuery.data);
  const purchases = unwrapListResponse(purchasesData).items || [];
  const payments = unwrapListResponse(paymentsData).items || [];

  if (supplierQuery.isLoading) return <DetailSkeleton />;
  
  if (supplierQuery.isError || !supplier) {
    return <ErrorState description={getApiErrorMessage(supplierQuery.error, "Failed to load supplier details.")} />;
  }



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-primary font-display tracking-tight">{supplier.name}</h1>
              <StatusBadge status={supplier.status} />
            </div>
            <p className="text-sm text-secondary">Supplier details and contact information.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Can permission="supplierPayments.create">
            <Button variant="secondary" leftIcon={CreditCard} onClick={() => setIsPaymentOpen(true)}>Record Payment</Button>
          </Can>
          <Can permission="suppliers.update">
            <Button variant="outline" leftIcon={Edit} onClick={() => setIsOpen(true)}>Edit Supplier</Button>
          </Can>
        </div>
      </div>

      <Tabs 
        tabs={[
          { id: "overview", label: "Overview", icon: FileText },
          { id: "financials", label: "Financials", icon: Wallet }
        ]} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
      />

      {activeTab === "overview" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard 
              title="Phone" 
              value={supplier.phone || "Not specified"} 
              icon={Phone}
            />
            <SummaryCard 
              title="Current Balance" 
              value={<MoneyDisplay amount={Math.abs(supplier.balance ?? 0)} />} 
              subtitle={supplier.balance > 0 ? "You owe supplier" : supplier.balance < 0 ? "Supplier owes you" : "Settled"}
              icon={Wallet}
              iconVariant={supplier.balance > 0 ? "danger" : supplier.balance < 0 ? "success" : "default"}
              variant={supplier.balance > 0 ? "danger" : supplier.balance < 0 ? "success" : "default"}
              valueClassName={supplier.balance > 0 ? "text-danger" : supplier.balance < 0 ? "text-success" : ""}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <DetailSection title="Address & Notes">
                <div className="space-y-6">
                  <div>
                    <span className="text-sm font-medium text-secondary block mb-2">Address</span>
                    <p className="text-primary bg-main/50 p-4 rounded-lg whitespace-pre-wrap">
                      {supplier.address || "No address provided."}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-secondary block mb-2">Notes</span>
                    <p className="text-primary bg-main/50 p-4 rounded-lg whitespace-pre-wrap">
                      {supplier.notes || "No additional notes provided."}
                    </p>
                  </div>
                </div>
              </DetailSection>
            </div>

            <div className="space-y-6">
              <SystemInfoSection
                id={supplier._id}
                idLabel="Supplier ID"
                createdAt={supplier.createdAt}
                updatedAt={supplier.updatedAt}
              />
            </div>
          </div>
        </>
      )}

      {activeTab === "financials" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Can permission="purchases.read">
            <DetailSection title="Recent Purchases">
              {isPurchasesLoading ? (
                <DetailSkeleton />
              ) : purchases?.length > 0 ? (
                <ListGroup>
                  {purchases.map(row => (
                    <ListItem
                      key={row._id}
                      to={`/purchases/${row._id}`}
                      title={<span className="font-mono text-[10px] font-bold text-accent uppercase tracking-widest">{row.purchaseNumber || "-"}</span>}
                      subtitle={formatDateTime(row.date)}
                      right={
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs sm:text-sm font-bold text-primary tracking-tight shrink-0">
                            <MoneyDisplay amount={row.totalAmount} />
                          </span>
                          <StatusBadge status={row.paymentStatus} className="shrink-0" />
                        </div>
                      }
                    />
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-6 text-sm text-secondary flex flex-col items-center border border-dashed border-border/50 rounded-lg">
                  <ShoppingBag className="h-8 w-8 text-muted mb-2" />
                  No purchases recorded from this supplier.
                </div>
              )}
            </DetailSection>
          </Can>

          <Can permission="supplierPayments.read">
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
                  No payments have been recorded for this supplier.
                </div>
              )}
            </DetailSection>
          </Can>
        </div>
      )}

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
