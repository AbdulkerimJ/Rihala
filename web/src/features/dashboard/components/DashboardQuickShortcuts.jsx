import React from "react";
import { ShoppingCart, CreditCard, Building2, Users, Plus } from "lucide-react";
import { usePermission } from "../../../hooks/usePermission";
import { QuickActionCard } from "../../../components/ui/QuickActionCard";

export const DashboardQuickShortcuts = () => {
  const { can } = usePermission();

  const quickActions = [
    {
      to: "/orders",
      icon: ShoppingCart,
      label: "New Order",
      variant: "brand",
      permission: "orders.read",
    },
    {
      to: "/payments?tab=customers",
      icon: CreditCard,
      label: "Receive Payment",
      variant: "success",
      permission: "customerPayments.read",
    },
    {
      to: "/purchases",
      icon: Building2,
      label: "New Purchase",
      variant: "accent",
      permission: "purchases.read",
    },
    {
      to: "/attendances",
      icon: Users,
      label: "Roll-Call",
      variant: "warning",
      permission: "attendances.read",
    },
  ];

  const availableQuickActions = quickActions.filter((action) =>
    can(action.permission)
  );

  if (availableQuickActions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base sm:text-lg font-bold tracking-tight text-primary">
          Quick Shortcuts
        </h3>
        <span className="text-[11px] font-medium text-muted">Instant Access</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {availableQuickActions.map((action) => (
          <QuickActionCard
            key={action.to}
            to={action.to}
            icon={action.icon}
            label={action.label}
            variant={action.variant}
          />
        ))}
      </div>
    </div>
  );
};
