import React, { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { usePermission } from "../../../hooks/usePermission";
import { Tabs } from "../../../components/ui/Tabs";
import { ShoppingCart, Truck, Package } from "lucide-react";

import { PurchasesList } from "../../purchases/pages/PurchasesList";
import { SuppliersList } from "../../suppliers/pages/SuppliersList";
import { MaterialsList } from "../../materials/pages/MaterialsList";

export const Purchasing = () => {
  const { can } = usePermission();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Define all available tabs, filtering them by permissions
  const availableTabs = useMemo(() => {
    const tabs = [];
    if (can("purchases.read")) {
      tabs.push({ id: "purchases", label: "Purchases", icon: ShoppingCart });
    }
    if (can("suppliers.read")) {
      tabs.push({ id: "suppliers", label: "Suppliers", icon: Truck });
    }
    if (can("materials.read")) {
      tabs.push({ id: "materials", label: "Materials Catalog", icon: Package });
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
    return <div className="p-8 text-center text-secondary">You do not have permission to view any purchasing modules.</div>;
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
        {activeTabId === "purchases" && <PurchasesList />}
        {activeTabId === "suppliers" && <SuppliersList />}
        {activeTabId === "materials" && <MaterialsList />}
      </div>
    </div>
  );
};
