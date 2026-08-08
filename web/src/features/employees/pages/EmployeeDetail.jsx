import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getEmployeeById } from "../api";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { DetailSection, DetailItem } from "../../../components/ui/DetailSection";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { getApiErrorMessage, unwrapEntityResponse } from "../../../utils/apiResponse";
import { formatDateTime, formatDate } from "../../../utils/formatters";
import { User, Briefcase, Calendar, Wallet } from "lucide-react";

export const EmployeeDetail = () => {
  const { id } = useParams();
  
  const employeeQuery = useQuery({
    queryKey: ["employees", id],
    queryFn: () => getEmployeeById(id),
    enabled: !!id,
  });

  const employee = unwrapEntityResponse(employeeQuery.data);

  if (employeeQuery.isLoading) return <LoadingSkeleton variant="default" rowCount={4} />;
  
  if (employeeQuery.isError || !employee) {
    return <ErrorState description={getApiErrorMessage(employeeQuery.error, "Failed to load employee details.")} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-primary font-display tracking-tight">{employee.name}</h1>
            <StatusBadge status={employee.status} />
          </div>
          <p className="text-sm text-secondary">{employee.position} • <span className="capitalize">{employee.employmentType}</span> Employee</p>
        </div>
        <Link
          to="/employees"
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-primary hover:bg-main transition-colors"
        >
          Back to employees
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Position" 
          value={employee.position || "Not specified"} 
          icon={Briefcase}
        />
        <SummaryCard 
          title="Hire Date" 
          value={formatDate(employee.hireDate)} 
          icon={Calendar}
        />
        <SummaryCard 
          title="Phone" 
          value={employee.phone || "Not specified"} 
          icon={User}
        />
        <SummaryCard 
          title={employee.employmentType === 'daily' ? "Daily Rate" : "Monthly Base Salary"}
          value={<MoneyDisplay amount={employee.employmentType === 'daily' ? employee.dailyRate : employee.baseSalary} />} 
          icon={Wallet}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Future expansion: Salary advances, attendance summary, recent payrolls could go here */}
          <DetailSection title="Payroll Summary">
            <div className="flex items-center justify-center p-8 border border-dashed border-border/50 rounded-lg">
              <p className="text-secondary text-sm">Detailed payroll history will appear here.</p>
            </div>
          </DetailSection>
        </div>

        <div className="space-y-6">
          <DetailSection title="System Information">
            <div className="space-y-1">
              <DetailItem label="Employee ID" value={<span className="font-mono text-xs">{employee._id}</span>} />
              <DetailItem label="Created On" value={formatDateTime(employee.createdAt)} />
              <DetailItem label="Last Updated" value={formatDateTime(employee.updatedAt)} />
            </div>
          </DetailSection>
        </div>
      </div>
    </div>
  );
};
