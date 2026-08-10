import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getSupplierById } from "../api";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { DetailSection, DetailItem } from "../../../components/ui/DetailSection";
import { getApiErrorMessage, unwrapEntityResponse } from "../../../utils/apiResponse";
import { formatDateTime } from "../../../utils/formatters";
import { Briefcase, Phone, Mail, FileText } from "lucide-react";

export const SupplierDetail = () => {
  const { id } = useParams();
  
  const supplierQuery = useQuery({
    queryKey: ["suppliers", id],
    queryFn: () => getSupplierById(id),
    enabled: !!id,
  });

  const supplier = unwrapEntityResponse(supplierQuery.data);

  if (supplierQuery.isLoading) return <DetailSkeleton />;
  
  if (supplierQuery.isError || !supplier) {
    return <ErrorState description={getApiErrorMessage(supplierQuery.error, "Failed to load supplier details.")} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-primary font-display tracking-tight">{supplier.name}</h1>
            <StatusBadge status={supplier.status} />
          </div>
          <p className="text-sm text-secondary">Supplier details and contact information.</p>
        </div>
        <Link
          to="/suppliers"
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-primary hover:bg-main transition-colors"
        >
          Back to suppliers
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Contact Person" 
          value={supplier.contactPerson || "Not specified"} 
          icon={Briefcase}
        />
        <SummaryCard 
          title="Phone" 
          value={supplier.phone || "Not specified"} 
          icon={Phone}
        />
        <SummaryCard 
          title="Email" 
          value={supplier.email || "Not specified"} 
          icon={Mail}
        />
        <SummaryCard 
          title="Tax ID" 
          value={supplier.taxId || "Not specified"} 
          icon={FileText}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DetailSection title="Address & Notes">
            <div className="mb-6">
              <span className="text-sm font-medium text-secondary block mb-2">Address</span>
              <p className="text-primary bg-main/50 p-4 rounded-lg">
                {supplier.address || "No address provided."}
              </p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-secondary block mb-2">Notes</span>
              <p className="text-primary bg-main/50 p-4 rounded-lg">
                {supplier.notes || "No additional notes provided."}
              </p>
            </div>
          </DetailSection>
        </div>

        <div className="space-y-6">
          <DetailSection title="System Information">
            <div className="space-y-1">
              <DetailItem label="Supplier ID" value={<span className="font-mono text-xs">{supplier._id}</span>} />
              <DetailItem label="Created On" value={formatDateTime(supplier.createdAt)} />
              <DetailItem label="Last Updated" value={formatDateTime(supplier.updatedAt)} />
            </div>
          </DetailSection>
        </div>
      </div>
    </div>
  );
};
