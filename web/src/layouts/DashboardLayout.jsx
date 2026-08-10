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
  LineChart,
  Settings,
  UserSquare2
} from "lucide-react";

import { NavGroup } from "./NavGroup";
import { SidebarBrand } from "./SidebarBrand";

export const DashboardLayout = () => {
  const { currentUser, logout } = useAuth();
  const { can } = usePermission();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

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
      "/attendances": "Attendance",
      "/overtimes": "Overtime",
      "/weekly-payrolls": "Weekly Payroll",
      "/supplier-payments": "Supplier Payments",
      "/customer-payments": "Customer Payments",
    };

    const matchedEntry = Object.entries(sectionMap).find(([path]) =>
      location.pathname.startsWith(path),
    );

    return matchedEntry?.[1] || "Dashboard";
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navGroups = [
    {
      title: "Overview",
      isFlat: true,
      items: [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      ]
    },
    {
      title: "Sales",
      icon: LineChart,
      items: [
        { name: "Customers", path: "/customers", icon: Contact, permission: "customers.read" },
        { name: "Orders", path: "/orders", icon: ShoppingCart, permission: "orders.read" },
        { name: "Payments", path: "/customer-payments", icon: CreditCard, permission: "customerPayments.read" },
      ]
    },
    {
      title: "Purchasing",
      icon: Briefcase,
      items: [
        { name: "Suppliers", path: "/suppliers", icon: Contact, permission: "suppliers.read" },
        { name: "Materials", path: "/materials", icon: Package, permission: "materials.read" },
        { name: "Purchases", path: "/purchases", icon: ClipboardList, permission: "purchases.read" },
        { name: "Payments", path: "/supplier-payments", icon: Wallet, permission: "supplierPayments.read" },
      ]
    },
    {
      title: "Employees",
      icon: Users,
      items: [
        { name: "Employees", path: "/employees", icon: UserSquare2, permission: "employees.read" },
        { name: "Attendance", path: "/attendances", icon: CalendarDays, permission: "attendances.read" },
        { name: "Overtime", path: "/overtimes", icon: Clock, permission: "overtimes.read" },
        { name: "Weekly Payroll", path: "/weekly-payrolls", icon: Receipt, permission: "weeklyPayrolls.read" },
        { name: "Payments", path: "/employee-payments", icon: CreditCard, permission: "employeePayments.read" },
      ]
    },
    {
      title: "Administration",
      icon: Settings,
      items: [
        { name: "Expenses", path: "/expenses", icon: Wallet, permission: "expenses.read" },
        { name: "Users", path: "/users", icon: Users, permission: "users.read" },
        { name: "Roles", path: "/roles", icon: ShieldCheck, permission: "roles.read" },
        { name: "Permissions", path: "/permissions", icon: Key, permission: "permissions.read" },
      ]
    }
  ];

  return (
    <div className="flex h-screen text-primary relative z-0 bg-surface">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[260px] transform flex-col bg-surface transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Area */}
        <SidebarBrand setSidebarOpen={setSidebarOpen} />

        {/* Navigation Area */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-1 px-4 py-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
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

        {/* Footer Area */}
        <div className="mt-auto p-4">
          <Button
            variant="ghostDanger"
            onClick={handleLogout}
            size="none"
            className="flex w-full items-center justify-start px-3 py-2.5 text-sm font-medium transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden bg-surface">
        {/* Header */}
        <Header
          sectionTitle={sectionTitle}
          currentUser={currentUser}
          onMobileMenuToggle={() => setSidebarOpen(true)}
        />

        {/* Main section */}
        <main className="flex-1 overflow-y-auto bg-main rounded-xl sm:rounded-t-2xl sm:rounded-b-none relative p-4 sm:p-6 lg:p-8 mx-3 sm:mx-0">
          {/* Ambient Glows inside the main part */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-xl sm:rounded-t-2xl sm:rounded-b-none">
            <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-accent/5 blur-[100px] dark:bg-accent/5" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-500/5 blur-[100px] dark:bg-purple-500/5" />
          </div>

          <div className="relative z-10">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};
