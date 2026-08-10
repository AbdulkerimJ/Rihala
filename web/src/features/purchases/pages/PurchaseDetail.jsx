import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPurchaseById } from "../api";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { DetailSection, DetailItem } from "../../../components/ui/DetailSection";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { getApiErrorMessage, unwrapEntityResponse } from "../../../utils/apiResponse";
import { formatDateTime, formatDate } from "../../../utils/formatters";
import { ShoppingBag, Wallet, Calendar, Building2 } from "lucide-react";

export const PurchaseDetail = () => {
  const { id } = useParams();
  
  const purchaseQuery = useQuery({
    queryKey: ["purchases", id],
    queryFn: () => getPurchaseById(id),
    enabled: !!id,
  });

  const purchase = unwrapEntityResponse(purchaseQuery.data);

  if (purchaseQuery.isLoading) return <DetailSkeleton />;
  
  if (purchaseQuery.isError || !purchase) {
    return <ErrorState description={getApiErrorMessage(purchaseQuery.error, "Failed to load purchase details.")} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-primary font-display tracking-tight">Purchase #{purchase.purchaseNumber}</h1>
          </div>
          <p className="text-sm text-secondary">Purchase details and itemization.</p>
        </div>
        <Link
          to="/purchases"
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-primary hover:bg-main transition-colors"
        >
          Back to purchases
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Supplier" 
          value={purchase.supplier?.name || "Unknown"} 
          icon={Building2}
        />
        <SummaryCard 
          title="Total Amount" 
          value={<MoneyDisplay amount={purchase.totalAmount} variant="accent" />} 
          icon={Wallet}
        />
        <SummaryCard 
          title="Purchase Date" 
          value={formatDate(purchase.purchaseDate)} 
          icon={Calendar}
        />
        <SummaryCard 
          title="Items" 
          value={`${purchase.items?.length || 0} items`} 
          icon={ShoppingBag}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DetailSection title="Purchased Items" className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-main/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-secondary">Material</th>
                    <th className="px-6 py-3 text-right text-xs uppercase tracking-wider text-secondary">Quantity</th>
                    <th className="px-6 py-3 text-right text-xs uppercase tracking-wider text-secondary">Unit Price</th>
                    <th className="px-6 py-3 text-right text-xs uppercase tracking-wider text-secondary">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {purchase.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm text-primary font-medium">
                        {item.material?.name || "Unknown Material"}
                        {item.material?.unit && <span className="text-xs text-secondary block mt-0.5">Unit: {item.material.unit}</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-primary text-right">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm text-primary text-right"><MoneyDisplay amount={item.unitPrice} /></td>
                      <td className="px-6 py-4 text-sm font-semibold text-primary text-right">
                        <MoneyDisplay amount={item.quantity * item.unitPrice} />
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-main/30 border-t-2 border-border">
                    <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-primary text-right">Grand Total:</td>
                    <td className="px-6 py-4 text-sm font-bold text-accent text-right">
                      <MoneyDisplay amount={purchase.totalAmount} variant="accent" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </DetailSection>
          
          {purchase.notes && (
            <DetailSection title="Notes">
              <p className="text-primary bg-main/50 p-4 rounded-lg">
                {purchase.notes}
              </p>
            </DetailSection>
          )}
        </div>

        <div className="space-y-6">
          <DetailSection title="Reference Information">
            <div className="space-y-1">
              <DetailItem label="Purchase ID" value={<span className="font-mono text-xs">{purchase._id}</span>} />
              <DetailItem label="Reference No" value={purchase.referenceNumber || "-"} />
              <DetailItem label="Created By" value={purchase.createdBy?.name || "Unknown User"} />
              <DetailItem label="Created On" value={formatDateTime(purchase.createdAt)} />
            </div>
          </DetailSection>
        </div>
      </div>
    </div>
  );
};
