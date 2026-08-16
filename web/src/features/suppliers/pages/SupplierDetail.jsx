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
import { SupplierForm } from "./SuppliersList";
import { getApiErrorMessage, unwrapEntityResponse } from "../../../utils/apiResponse";
import { formatDateTime } from "../../../utils/formatters";
import { DetailSection } from "../../../components/ui/DetailSection";
import { Phone, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export const SupplierDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  
  const supplierQuery = useQuery({
    queryKey: ["suppliers", id],
    queryFn: () => getSupplierById(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: updateSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier updated successfully");
      setIsOpen(false);
    },
  });

  const supplier = unwrapEntityResponse(supplierQuery.data);

  if (supplierQuery.isLoading) return <DetailSkeleton />;
  
  if (supplierQuery.isError || !supplier) {
    return <ErrorState description={getApiErrorMessage(supplierQuery.error, "Failed to load supplier details.")} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/suppliers"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-surface text-secondary hover:text-primary hover:bg-main transition-colors shrink-0"
            title="Back to suppliers"
            aria-label="Back to suppliers"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-primary font-display tracking-tight">{supplier.name}</h1>
              <StatusBadge status={supplier.status} />
            </div>
            <p className="text-sm text-secondary">Supplier details and contact information.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Can permission="suppliers.update">
            <Button onClick={() => setIsOpen(true)}>Edit Supplier</Button>
          </Can>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Phone" 
          value={supplier.phone || "Not specified"} 
          icon={Phone}
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

      <Modal isOpen={isOpen} title="Edit Supplier" onClose={() => setIsOpen(false)}>
        <SupplierForm
          initialData={supplier}
          onClose={() => setIsOpen(false)}
          onSubmit={(data) => updateMutation.mutateAsync({ id: supplier._id, data })}
        />
      </Modal>
    </div>
  );
};
