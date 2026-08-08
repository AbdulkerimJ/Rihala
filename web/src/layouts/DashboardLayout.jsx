import React, { useMemo, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Can } from "../components/Can";
import { Button } from "../components/ui/Button";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { Header } from "../components/Header";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Key,
  Receipt,
  Contact,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Package,
  ShoppingCart,
  CreditCard,
  Briefcase,
  Clock,
  CalendarDays,
  Wallet,
} from "lucide-react";

export const DashboardLayout = () => {
  const { currentUser, logout } = useAuth();
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
      title: "Main",
      items: [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      ]
    },
    {
      title: "Sales",
      items: [
        { name: "Customers", path: "/customers", icon: Contact, permission: "customers.read" },
        { name: "Orders", path: "/orders", icon: ShoppingCart, permission: "orders.read" },
        { name: "Payments", path: "/customer-payments", icon: CreditCard, permission: "customerPayments.read" },
      ]
    },
    {
      title: "Supply Chain",
      items: [
        { name: "Suppliers", path: "/suppliers", icon: Briefcase, permission: "suppliers.read" },
        { name: "Materials", path: "/materials", icon: Package, permission: "materials.read" },
        { name: "Purchases", path: "/purchases", icon: ClipboardList, permission: "purchases.read" },
        { name: "Supplier Payments", path: "/supplier-payments", icon: Wallet, permission: "supplierPayments.read" },
      ]
    },
    {
      title: "HR & Payroll",
      items: [
        { name: "Employees", path: "/employees", icon: Users, permission: "employees.read" },
        { name: "Attendance", path: "/attendances", icon: CalendarDays, permission: "attendances.read" },
        { name: "Overtime", path: "/overtimes", icon: Clock, permission: "overtimes.read" },
        { name: "Weekly Payroll", path: "/weekly-payrolls", icon: Receipt, permission: "weeklyPayrolls.read" },
        { name: "Employee Payments", path: "/employee-payments", icon: CreditCard, permission: "employeePayments.read" },
      ]
    },
    {
      title: "Admin",
      items: [
        { name: "Expenses", path: "/expenses", icon: Wallet, permission: "expenses.read" },
        { name: "Users", path: "/users", icon: Users, permission: "users.read" },
        { name: "Roles", path: "/roles", icon: ShieldCheck, permission: "roles.read" },
        { name: "Permissions", path: "/permissions", icon: Key, permission: "permissions.read" },
      ]
    }
  ];

  const renderNavLinks = () => {
    return navGroups.map((group, groupIndex) => {
      // Filter items based on permissions
      // (Simplified: we'll just render Can wrappers, if a group is empty it might show a title, but we can live with that for now)
      
      return (
        <div key={groupIndex} className="mb-6 last:mb-0">
          <h3 className="px-3 mb-2 text-xs font-semibold tracking-wider text-muted uppercase">
            {group.title}
          </h3>
          <div className="space-y-1">
            {group.items.map((item) => {
              const link = (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-brand/10 text-brand shadow-none border border-transparent"
                        : "text-secondary hover:bg-black/5 hover:text-primary border border-transparent dark:hover:bg-white/5"
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                  {item.name}
                </NavLink>
              );

              if (item.permission) {
                return (
                  <Can key={item.name} permission={item.permission}>
                    {link}
                  </Can>
                );
              }
              return link;
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex h-screen bg-main text-primary">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 transform flex-col border-r border-border bg-surface transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex flex-col justify-center">
            <span className="block text-2xl font-bold tracking-tight text-primary font-display leading-none">
              Rihala
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-secondary hover:bg-black/5 hover:text-primary dark:hover:bg-white/5"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">{renderNavLinks()}</nav>
        <div className="mt-auto px-3 pb-4 pt-2">
          <Button
            variant="ghostDanger"
            onClick={handleLogout}
            size="none"
            className="flex w-full items-center justify-start rounded-lg px-3 py-2 text-sm font-medium text-secondary hover:bg-danger/10 hover:text-danger transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header
          sectionTitle={sectionTitle}
          currentUser={currentUser}
          onMobileMenuToggle={() => setSidebarOpen(true)}
        />

        {/* Main section */}
        <main className="flex-1 overflow-y-auto bg-main p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
