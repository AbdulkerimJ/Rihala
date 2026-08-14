import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getEmployeeById } from "../api";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { DetailSection } from "../../../components/ui/DetailSection";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { getApiErrorMessage, unwrapEntityResponse } from "../../../utils/apiResponse";
import { formatDate } from "../../../utils/formatters";
import { User, Briefcase, Calendar, Wallet, ArrowLeft } from "lucide-react";

export const EmployeeDetail = () => {
  const { id } = useParams();
  
  const employeeQuery = useQuery({
    queryKey: ["employees", id],
    queryFn: () => getEmployeeById(id),
    enabled: !!id,
  });

  const employee = unwrapEntityResponse(employeeQuery.data);

  if (employeeQuery.isLoading) return <DetailSkeleton />;
  
  if (employeeQuery.isError || !employee) {
    return <ErrorState description={getApiErrorMessage(employeeQuery.error, "Failed to load employee details.")} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/employees"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-surface text-secondary hover:text-primary hover:bg-main transition-colors shrink-0"
            title="Back to employees"
            aria-label="Back to employees"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-primary font-display tracking-tight">{employee.name}</h1>
              <StatusBadge status={employee.status} />
            </div>
            <p className="text-sm text-secondary">{employee.phone || "No phone provided"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard 
          title="Phone" 
          value={employee.phone || "Not specified"} 
          icon={User}
        />
        <SummaryCard 
          title="Employment Start" 
          value={formatDate(employee.employmentStartDate)} 
          icon={Calendar}
        />
        <SummaryCard 
          title="Employment End" 
          value={employee.employmentEndDate ? formatDate(employee.employmentEndDate) : "Ongoing"} 
          icon={Briefcase}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DetailSection title="Employment Status">
            <p className="text-primary bg-main/50 p-4 rounded-lg">
              Staff member is currently marked as <strong className="capitalize">{employee.status}</strong>.
            </p>
          </DetailSection>
        </div>

        <div className="space-y-6">
          <SystemInfoSection
            id={employee._id}
            idLabel="Employee ID"
            createdAt={employee.createdAt}
            updatedAt={employee.updatedAt}
          />
        </div>
      </div>
    </div>
  );
};
