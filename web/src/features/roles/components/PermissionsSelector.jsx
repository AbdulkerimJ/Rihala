import { useQuery } from "@tanstack/react-query";
import { usePermission } from "../../../hooks/usePermission";
import { getPermissions } from "../../permissions/api";
import { Shield, Users, Key, Package, ShoppingCart, ShoppingBag, 
  Receipt, Truck, Wallet, Landmark, Clock, CalendarDays, Briefcase, 
  LayoutDashboard, Settings, FileText, UserCog, HandCoins, Banknote, Check
} from "lucide-react";
import { Skeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { Button } from "../../../components/ui/Button";

export const getModuleIcon = (moduleName) => {
  const icons = {
    users: UserCog,
    roles: Key,
    permissions: Shield,
    customers: Users,
    employees: Briefcase,
    suppliers: Truck,
    materials: Package,
    orders: ShoppingCart,
    purchases: ShoppingBag,
    expenses: Receipt,
    overtimes: Clock,
    attendances: CalendarDays,
    weeklypayrolls: Banknote,
    customerpayments: HandCoins,
    supplierpayments: Landmark,
    employeepayments: Wallet,
    employeerates: Briefcase,
    dashboard: LayoutDashboard,
    settings: Settings,
  };

  const Icon = icons[moduleName.toLowerCase()] || FileText;
  return <Icon className="w-5 h-5 text-brand" />;
};

export const PermissionsSelector = ({ selectedPermissions, onChange }) => {
  const { can } = usePermission();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["permissions"],
    queryFn: getPermissions,
    enabled: can("permissions.read"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState description="Failed to load permissions." />;
  }

  const permissionsList = data?.data || [];

  // Group permissions by module
  const groupedPermissions = permissionsList.reduce((acc, perm) => {
    const [module] = perm.name.split(".");
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {});

  const handleToggle = (id) => {
    const newSet = new Set(selectedPermissions);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    onChange(newSet);
  };

  const handleToggleGroup = (modulePerms, isAllSelected) => {
    const newSet = new Set(selectedPermissions);
    modulePerms.forEach((p) => {
      if (isAllSelected) {
        newSet.delete(p._id);
      } else {
        newSet.add(p._id);
      }
    });
    onChange(newSet);
  };

  return (
    <div className="space-y-8">
      {Object.entries(groupedPermissions).map(([module, perms]) => {
        const isAllSelected = perms.every((p) => selectedPermissions.has(p._id));

        return (
          <div
            key={module}
            className="bg-main/30 rounded-lg border border-border/50 p-4"
          >
            <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-2">
              <div className="flex items-center gap-2">
                {getModuleIcon(module)}
                <h4 className="text-base font-medium text-primary capitalize">
                  {module.replace(/([a-z])([A-Z])/g, "$1 $2")}
                </h4>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="none"
                onClick={() => handleToggleGroup(perms, isAllSelected)}
                className="text-xs font-medium hover:underline"
              >
                {isAllSelected ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {perms.map((perm) => {
                const isSelected = selectedPermissions.has(perm._id);
                return (
                  <div
                    key={perm._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleToggle(perm._id)}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        handleToggle(perm._id);
                      }
                    }}
                    className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors select-none ${
                      isSelected
                        ? "bg-brand/10 border-brand/30"
                        : "bg-surface border-border hover:border-brand/30"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                        isSelected
                          ? "bg-brand border-brand text-white"
                          : "border-secondary/40 bg-surface"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary leading-none mb-1 truncate">
                        {perm.name.split(".")[1] || perm.name}
                      </p>
                      {perm.description && (
                        <p className="text-xs text-secondary leading-tight">
                          {perm.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
