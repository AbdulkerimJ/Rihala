import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, CalendarDays, ShoppingCart, ClipboardList, MoreHorizontal,  } from "lucide-react";
import { usePermission } from "../hooks/usePermission";

// 4 pinned individual-page tabs. Keep to ≤4 so the "More" slot always fits.
// matchPaths: additional routes that should light this tab up as active.
const PINNED_TABS = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    matchPaths: ["/dashboard", "/analytics"],
    permission: "dashboard.read",
  },
  {
    label: "Attendance",
    icon: CalendarDays,
    path: "/attendances",
    permission: "attendances.read",
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    path: "/orders",
    permission: "orders.read",
  },
  {
    label: "Purchases",
    icon: ClipboardList,
    path: "/purchases",
    permission: "purchases.read",
  },
];

export const BottomNav = ({ onMoreClick }) => {
  const { can } = usePermission();
  const location = useLocation();

  const isTabActive = (tab) => {
    const paths = tab.matchPaths || [tab.path];
    return paths.some((p) => location.pathname.startsWith(p));
  };

  const visibleTabs = PINNED_TABS.filter(
    (tab) => !tab.permission || can(tab.permission)
  );

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-main border-t border-border/80 shadow-2xl pb-safe"
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
