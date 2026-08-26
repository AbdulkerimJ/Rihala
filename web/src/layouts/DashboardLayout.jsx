import React, { useMemo, useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePermission } from "../hooks/usePermission";
import { Button } from "../components/ui/Button";
import { Header } from "../components/Header";
import { ErrorBoundary } from "../components/ErrorBoundary";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Key,
  Receipt,
  Contact,
  ClipboardList,
  LogOut,
  Package,
  ShoppingCart,
  CreditCard,
  Briefcase,
  Clock,
  CalendarDays,
  Wallet,
  Settings,
  UserSquare2,
  BarChart2,
  FileText,
  ClipboardCheck,
  Hammer,
  ListTree,
  Banknote,
  HandCoins,
  Building2,
  BadgeDollarSign,
  HardHat,
  Store,
} from "lucide-react";

import { NavGroup } from "./NavGroup";
import { SidebarBrand } from "./SidebarBrand";
import { BottomNav } from "./BottomNav";
import { MobileDrawer } from "./MobileDrawer";

export const DashboardLayout = () => {
  const { currentUser, logout } = useAuth();
  const { can } = usePermission();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const sectionTitle = useMemo(() => {
    const sectionMap = {
      "/dashboard": "Dashboard",
      "/users": "Users",
      "/roles": "Roles",
      "/permissions": "Permissions",
      "/expenses": "Expenses",
      "/customers": "Customers",
      "/orders": "Orders",
      "/suppliers": "Suppliers",
      "/materials": "Materials",
      "/purchases": "Purchases",
      "/employee-payments": "Employee Payments",
      "/employees": "Employees",
      "/employee-rates": "Employee Rates",
      "/attendances": "Attendance",
      "/overtimes": "Overtime",
      "/weekly-payrolls": "Weekly Payroll",
      "/supplier-payments": "Supplier Payments",
      "/customer-payments": "Customer Payments",
      "/task-types": "Task Types",
      "/tasks": "Tasks",
      "/contractors": "Contractors",
      "/contracts": "Contracts",
      "/contractor-payments": "Contractor Payments",
      "/analytics": "Analytics",
    };

    const matchedEntry = Object.entries(sectionMap).find(([path]) =>
      location.pathname.startsWith(path),
    );

    return matchedEntry?.[1] || "Dashboard";
  }, [location.pathname]);


  const navGroups = [
    {
      title: "Main",
      isFlat: true,
      items: [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, permission: "dashboard.read" },
        { name: "Analytics", path: "/analytics", icon: BarChart2, permission: "dashboard.read" },
      ]
    },
    {
      title: "Operations",
      icon: Briefcase,
      defaultExpanded: true,
      items: [
        { name: "Attendance", path: "/attendances", icon: CalendarDays, permission: "attendances.read" },
        { name: "Overtime", path: "/overtimes", icon: Clock, permission: "overtimes.read" },
        { name: "Purchases", path: "/purchases", icon: ClipboardList, permission: "purchases.read" },
        { name: "Contracts", path: "/contracts", icon: FileText, permission: "contracts.read" },
        { name: "Weekly Payroll", path: "/weekly-payrolls", icon: Receipt, permission: "weeklyPayrolls.read" },
        { name: "Orders", path: "/orders", icon: ShoppingCart, permission: "orders.read" },
        { name: "Tasks", path: "/tasks", icon: Hammer, permission: "tasks.read" },
        { name: "Task Types", path: "/task-types", icon: ListTree, permission: "taskTypes.read" },
      ]
    },
    {
      title: "Payments",
      icon: CreditCard,
      items: [
        { name: "Employee Payments", path: "/employee-payments", icon: UserSquare2, permission: "employeePayments.read" },
        { name: "Contractor Payments", path: "/contractor-payments", icon: HardHat, permission: "contractorPayments.read" },
        { name: "Supplier Payments", path: "/supplier-payments", icon: Building2, permission: "supplierPayments.read" },
        { name: "Customer Payments", path: "/customer-payments", icon: Store, permission: "customerPayments.read" },
        { name: "Expenses", path: "/expenses", icon: Receipt, permission: "expenses.read" },
      ]
    },
    {
      title: "Inventory",
      icon: Package,
      items: [
        { name: "Materials", path: "/materials", icon: Package, permission: "materials.read" },
        { name: "Suppliers", path: "/suppliers", icon: Building2, permission: "suppliers.read" },
      ]
    },
    {
      title: "People",
      icon: Users,
      items: [
        { name: "Employees", path: "/employees", icon: UserSquare2, permission: "employees.read" },
        { name: "Employee Rates", path: "/employee-rates", icon: BadgeDollarSign, permission: "employeeRates.read" },
        { name: "Contractors", path: "/contractors", icon: HardHat, permission: "contractors.read" },
        { name: "Customers", path: "/customers", icon: Store, permission: "customers.read" },
      ]
    },
    {
      title: "Administration",
      icon: Settings,
      items: [
        { name: "Users", path: "/users", icon: Users, permission: "users.read" },
        { name: "Roles", path: "/roles", icon: ShieldCheck, permission: "roles.read" },
        { name: "Permissions", path: "/permissions", icon: Key, permission: "permissions.read" },
      ]
    }
  ];

  return (
    <div className="flex h-screen text-primary relative z-0 bg-main">
      {/* Desktop sidebar backdrop (mobile uses MobileDrawer instead) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Desktop Sidebar — hidden on mobile, shown on lg+ */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[260px] transform flex-col bg-main transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } hidden lg:flex`}
      >
        {/* Brand Area */}
        <SidebarBrand setSidebarOpen={setSidebarOpen} />

        {/* Navigation Area */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {navGroups.map((group, idx) => (
            <NavGroup 
              key={idx} 
              group={group} 
              isSidebarOpen={isSidebarOpen} 
              setSidebarOpen={setSidebarOpen} 
              pathname={location.pathname}
              can={can} 
            />
          ))}
        </nav>

      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-main">
        {/* Header */}
        <Header
          sectionTitle={sectionTitle}
          currentUser={currentUser}
          onMobileMenuToggle={() => setSidebarOpen(true)}
        />

        {/* Main section — pb-20 on mobile to clear the bottom nav */}
        <main className="flex-1 overflow-y-auto bg-surface rounded-tl-2xl sm:rounded-tl-3xl p-4 sm:p-6 lg:p-8 border-t border-l border-border/70 shadow-xs relative pb-20 lg:pb-8">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Navigation — only on < lg */}
      <BottomNav onMoreClick={() => setDrawerOpen(true)} />

      {/* Mobile Drawer — slide-up "More" sheet */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        navGroups={navGroups}
      />
    </div>
  );
};
