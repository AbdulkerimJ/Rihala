import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  CreditCard,
  Users,
  MoreHorizontal,
} from "lucide-react";
import { usePermission } from "../hooks/usePermission";

const BOTTOM_TABS = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    permission: "dashboard.read",
  },
  {
    label: "Operations",
    icon: Briefcase,
    path: "/attendances",
    // match any of these paths as "active"
    matchPaths: [
      "/attendances",
      "/overtimes",
      "/purchases",
      "/contracts",
      "/weekly-payrolls",
      "/orders",
      "/contract-completions",
    ],
    permission: "attendances.read",
  },
  {
    label: "Payments",
    icon: CreditCard,
    path: "/employee-payments",
    matchPaths: [
      "/employee-payments",
      "/contractor-payments",
      "/supplier-payments",
      "/customer-payments",
      "/expenses",
    ],
    permission: "employeePayments.read",
  },
  {
    label: "People",
    icon: Users,
    path: "/employees",
    matchPaths: [
      "/employees",
      "/employee-rates",
      "/contractors",
      "/customers",
    ],
    permission: "employees.read",
  },
];

export const BottomNav = ({ onMoreClick }) => {
  const { can } = usePermission();
  const location = useLocation();

  const isTabActive = (tab) => {
    const paths = tab.matchPaths || [tab.path];
    return paths.some((p) => location.pathname.startsWith(p));
  };

  const visibleTabs = BOTTOM_TABS.filter(
    (tab) => !tab.permission || can(tab.permission)
  );

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-main border-t border-border/80 shadow-2xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch justify-around h-16">
        {visibleTabs.map((tab) => {
          const active = isTabActive(tab);
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors duration-200 ${
                active
                  ? "text-accent"
                  : "text-secondary hover:text-primary active:text-primary"
              }`}
            >
              {/* Active indicator — top edge bar */}
              <span
                className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-accent transition-all duration-300 ${
                  active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                }`}
              />
              <tab.icon
                className={`h-5 w-5 transition-transform duration-200 ${
                  active ? "scale-110" : "scale-100"
                }`}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-semibold tracking-tight leading-none ${
                  active ? "text-accent" : "text-secondary"
                }`}
              >
                {tab.label}
              </span>
            </NavLink>
          );
        })}

        {/* More tab */}
        <button
          onClick={onMoreClick}
          className="relative flex flex-1 flex-col items-center justify-center gap-0.5 text-secondary hover:text-primary active:text-primary transition-colors duration-200"
        >
          <MoreHorizontal className="h-5 w-5" strokeWidth={2} />
          <span className="text-[10px] font-semibold tracking-tight leading-none">
            More
          </span>
        </button>
      </div>
    </nav>
  );
};
