import React, { useMemo, useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePermission } from "../hooks/usePermission";
import { Button } from "../components/ui/Button";
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
  X,
  Package,
  ShoppingCart,
  CreditCard,
  Briefcase,
  Clock,
  CalendarDays,
  Wallet,
  ChevronRight,
  ChevronDown,
  LineChart,
  Settings,
  UserSquare2
} from "lucide-react";

// NavGroup component for collapsible sections
const NavGroup = ({ group, isSidebarOpen, setSidebarOpen, pathname, can }) => {
  // Check if any item in this group is accessible
  const accessibleItems = group.items.filter(item => !item.permission || can(item.permission));
  
  // If no items are accessible, hide the entire group
  if (accessibleItems.length === 0) return null;

  // Check if any child is currently active
  const isActiveGroup = accessibleItems.some(item => pathname.startsWith(item.path));
  
  // Local state for expanded/collapsed, defaults to true if active or defaultExpanded
  const [isExpanded, setIsExpanded] = useState(isActiveGroup || group.defaultExpanded);

  // Auto-expand if a child becomes active
  useEffect(() => {
    if (isActiveGroup) setIsExpanded(true);
  }, [isActiveGroup]);

  // Flat group (like Dashboard)
  if (!group.title || group.isFlat) {
    return (
      <div className="mb-4">
        {accessibleItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-accent/10 text-accent font-semibold"
                  : "text-primary/90 hover:bg-brand/5 hover:text-brand"
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${pathname.startsWith(item.path) ? "text-accent" : "text-primary/50 group-hover:text-brand"}`} />
            {item.name}
          </NavLink>
        ))}
      </div>
    );
  }

  // Hierarchical group
  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
          isActiveGroup
            ? "text-primary bg-brand/5 font-semibold"
            : "text-secondary hover:bg-brand/5 hover:text-brand"
        }`}
      >
        <div className="flex items-center">
          {group.icon && <group.icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActiveGroup ? "text-accent" : "text-secondary group-hover:text-brand"}`} />}
          <span>{group.title}</span>
        </div>
        {isExpanded ? (
          <ChevronDown className={`h-4 w-4 transition-colors ${isActiveGroup ? "text-accent opacity-100" : "opacity-70 group-hover:text-brand"}`} />
        ) : (
          <ChevronRight className={`h-4 w-4 transition-colors ${isActiveGroup ? "text-accent opacity-100" : "opacity-40 group-hover:text-brand"}`} />
        )}
      </button>

      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pl-6 space-y-1 relative before:absolute before:left-[19px] before:top-1 before:bottom-2 before:w-[1px] before:bg-border/60">
          {accessibleItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "text-accent bg-accent/10 font-semibold relative before:absolute before:left-[-12.5px] before:top-1/2 before:-translate-y-1/2 before:w-[5px] before:h-[5px] before:rounded-full before:bg-accent"
                    : "text-primary/90 hover:text-brand hover:bg-brand/5"
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className={`mr-2.5 h-4 w-4 flex-shrink-0 transition-colors ${pathname.startsWith(item.path) ? "text-accent" : "text-primary/50 group-hover:text-brand/80"}`} />
              {item.name}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

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
    <div className="flex h-screen bg-main text-primary">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[260px] transform flex-col border-r border-border bg-surface transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Area */}
        <div className="flex flex-col pt-7 pb-6 px-6 border-b border-border/80 bg-surface">
          <div className="flex items-center justify-between">
            <span className="block text-[28px] font-bold tracking-tight text-primary font-display leading-none">
              Rihala
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-secondary hover:bg-accent/10 hover:text-accent -mr-2"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <span className="text-[11px] font-semibold tracking-widest uppercase text-accent mt-1.5">
            Workshop Management
          </span>
        </div>

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
        <div className="mt-auto p-4 border-t border-border/50">
          <Button
            variant="ghostDanger"
            onClick={handleLogout}
            size="none"
            className="flex w-full items-center justify-start rounded-lg px-3 py-2.5 text-sm font-medium text-secondary hover:bg-danger/10 hover:text-danger transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign out
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
