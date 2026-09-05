import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { usePermission } from "../../../hooks/usePermission";
import { Receipt, HandCoins, Banknote, BadgeDollarSign, CreditCard } from "lucide-react";
import { Tabs } from "../../../components/ui/Tabs";
import { ExpensesList } from "../../expenses/pages/ExpensesList";
import { SupplierPaymentsList } from "../../supplier-payments/pages/SupplierPaymentsList";
import { EmployeePaymentsList } from "../../employee-payments/pages/EmployeePaymentsList";
import { ContractorPaymentsList } from "../../contractor-payments/pages/ContractorPaymentsList";
import { CustomerPaymentsList } from "../../customer-payments/pages/CustomerPaymentsList";
export const Finance = () => {
  const { can } = usePermission();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Define all available tabs, filtering them by permissions
  const availableTabs = useMemo(() => {
    const tabs = [];
    if (can("supplierPayments.read")) {
      tabs.push({ id: "suppliers", label: "Supplier Payments", icon: HandCoins });
    }
    if (can("employeePayments.read")) {
      tabs.push({ id: "employees", label: "Employee Payments", icon: Banknote });
    }
    if (can("contractorPayments.read")) {
      tabs.push({ id: "contractors", label: "Contractor Payments", icon: BadgeDollarSign });
    }
    if (can("expenses.read")) {
      tabs.push({ id: "expenses", label: "Expenses", icon: Receipt });
    }
    if (can("customerPayments.read")) {
      tabs.push({ id: "customers", label: "Customer Payments", icon: CreditCard });
    }
    
    return tabs;
  }, [can]);

  // Determine current active tab
  const activeTabId = searchParams.get("tab") || (availableTabs.length > 0 ? availableTabs[0].id : "");

  // Update URL if the current tab is invalid or not set
  useEffect(() => {
    if (availableTabs.length > 0) {
      if (!searchParams.get("tab") || !availableTabs.find((t) => t.id === searchParams.get("tab"))) {
        setSearchParams({ tab: availableTabs[0].id }, { replace: true });
      }
    }
  }, [availableTabs, searchParams, setSearchParams]);

  if (availableTabs.length === 0) {
    return <div className="p-8 text-center text-secondary">You do not have permission to view any finance modules.</div>;
  }

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <Tabs 
          tabs={availableTabs} 
          activeTab={activeTabId} 
          onChange={handleTabChange}
        />
      </div>

      <div className="flex-1 min-h-0">
        {activeTabId === "expenses" && <ExpensesList />}
        {activeTabId === "suppliers" && <SupplierPaymentsList />}
        {activeTabId === "employees" && <EmployeePaymentsList />}
        {activeTabId === "contractors" && <ContractorPaymentsList />}
        {activeTabId === "customers" && <CustomerPaymentsList />}
      </div>
    </div>
  );
};
