import React, { useMemo, useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePermission } from "../hooks/usePermission";
import { Button } from "../components/ui/Button";
import { Header } from "../components/Header";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { LayoutDashboard, Users, ShieldCheck, Key, Receipt, Contact, ClipboardList, Package, ShoppingCart, CreditCard, Briefcase, Clock, CalendarDays, Wallet, Settings, UserSquare2, BarChart2, FileText, ClipboardCheck, Hammer, ListTree, Banknote, HandCoins, Building2, BadgeDollarSign, HardHat, Store, PanelLeftClose,  } from "lucide-react";

import { NavGroup } from "./NavGroup";
import { SidebarBrand } from "./SidebarBrand";
import { BottomNav } from "./BottomNav";
import { MobileDrawer } from "./MobileDrawer";

export const DashboardLayout = () => {
  const { currentUser, logout } = useAuth();
  const { can } = usePermission();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  // ── Collapsible desktop sidebar ─────────────────────────────────────────────
  // Persisted to localStorage so preference survives page refreshes.
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem("sidebar-collapsed") === "true"
  );

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  const sectionTitle = useMemo(() => {
    const sectionMap = {
      "/dashboard": "Dashboard",
      "/users": "Users",
      "/roles": "Roles",
      "/permissions": "Permissions",
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
      "/payments": "Payments",
      "/task-types": "Task Types",
      "/tasks": "Tasks",
      "/contractors": "Contractors",
      "/contracts": "Contracts",
      "/contract-completions": "Contract Completions",
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
        { name: "Completions", path: "/contract-completions", icon: ClipboardCheck, permission: "contractCompletions.read" },
      ]
    },
    {
      title: "People",
      icon: Users,
      items: [
        { name: "Employees", path: "/employees", icon: UserSquare2, permission: "employees.read" },
        { name: "Contractors", path: "/contractors", icon: HardHat, permission: "contractors.read" },
        { name: "Customers", path: "/customers", icon: Store, permission: "customers.read" },
      ]
    },
    {
      title: "Payments",
      icon: Wallet,
      items: [
        { name: "Payments", path: "/payments", icon: Wallet },
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
      title: "Administration",
      icon: Settings,
      items: [
        { name: "Tasks", path: "/tasks", icon: Hammer, permission: "tasks.read" },
        { name: "Task Types", path: "/task-types", icon: ListTree, permission: "taskTypes.read" },
        { name: "Users", path: "/users", icon: Users, permission: "users.read" },
        { name: "Roles", path: "/roles", icon: ShieldCheck, permission: "roles.read" },
        { name: "Permissions", path: "/permissions", icon: Key, permission: "permissions.read" },
      ]
    }
  ];

  return (
    <div className="flex h-screen text-primary relative z-0 bg-main">

      {/* Desktop Sidebar — hidden on mobile, shown on lg+ */}
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col bg-main lg:static transition-[width] duration-300 ease-in-out ${
          isCollapsed ? "w-16" : "w-[260px]"
        }`}
      >
        {/* Brand Area */}
        <SidebarBrand isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />

        {/* Navigation Area */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent transition-all duration-300 ${
          isCollapsed ? "px-1" : "px-3"
        }`}>
          {navGroups.map((group, idx) => (
            <NavGroup 
              key={idx} 
              group={group} 
              isSidebarOpen={false}
              setSidebarOpen={() => {}}
              pathname={location.pathname}
              can={can}
              isCollapsed={isCollapsed}
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
