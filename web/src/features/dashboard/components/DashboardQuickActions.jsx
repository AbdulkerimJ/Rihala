import { Link } from "react-router-dom";
import { ShoppingCart, CreditCard, Building2, Users } from "lucide-react";
import { usePermission } from "../../../hooks/usePermission";

export const DashboardQuickActions = () => {
  const { can } = usePermission();

  const actions = [
    {
      to: "/orders?action=new",
      icon: ShoppingCart,
      label: "New Order",
      variant: "text-brand bg-brand/10",
      permission: "orders.read",
    },
    {
      to: "/payments?tab=customers&action=new",
      icon: CreditCard,
      label: "Receive Payment",
      variant: "text-finance-in bg-finance-in/10",
      permission: "customerPayments.read",
    },
    {
      to: "/purchases?action=new",
      icon: Building2,
      label: "New Purchase",
      variant: "text-accent bg-accent/10",
      permission: "purchases.read",
    },
    {
      to: "/weekly-payrolls?action=new",
      icon: Users,
      label: "Weekly Payroll",
      variant: "text-warning bg-warning/10",
      permission: "weeklyPayrolls.read",
    },
  ];

  const availableActions = actions.filter((a) => can(a.permission));

  if (availableActions.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-3">
      <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">
        Quick Shortcuts
      </h3>

      <div className="grid grid-cols-2 gap-2.5">
        {availableActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.to}
              to={action.to}
              className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/70 hover:border-border hover:bg-main/50 transition-colors text-xs font-semibold text-primary"
            >
              <div className={`p-1.5 rounded-md ${action.variant} shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="truncate">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
