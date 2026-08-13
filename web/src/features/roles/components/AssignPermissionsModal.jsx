import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePermission } from "../../../hooks/usePermission";
import { useQuery } from "@tanstack/react-query";
import { 
  X, Check, Shield, Users, Key, Package, 
  ShoppingCart, ShoppingBag, Receipt, Truck, 
  Wallet, Landmark, Clock, CalendarDays, 
  Briefcase, LayoutDashboard, Settings, FileText,
  UserCog, HandCoins, Banknote
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { getPermissions } from "../../permissions/api";
import { Skeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { getApiErrorMessage } from "../../../utils/apiResponse";

const getModuleIcon = (moduleName) => {
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

export const AssignPermissionsModal = ({ isOpen, onClose, onSubmit, role, isSubmitting }) => {
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [submitError, setSubmitError] = useState(null);
  const { can } = usePermission();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["permissions"],
    queryFn: getPermissions,
    enabled: isOpen && can("permissions.read"),
  });

  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      if (role) {
        const initialIds = (role.permissions || []).map(p => typeof p === 'string' ? p : p._id);
        setSelectedPermissions(new Set(initialIds));
      }
    }
  }, [isOpen, role]);

  if (!isOpen) return null;

  const permissionsList = data?.data || [];

  // Group permissions by module (e.g. "users.create" -> "users")
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
    setSelectedPermissions(newSet);
  };

  const handleToggleGroup = (modulePerms, isAllSelected) => {
    const newSet = new Set(selectedPermissions);
    modulePerms.forEach(p => {
      if (isAllSelected) {
        newSet.delete(p._id);
      } else {
        newSet.add(p._id);
      }
    });
    setSelectedPermissions(newSet);
  };

  const handleSave = async () => {
    try {
      setSubmitError(null);
      await onSubmit({ permissions: Array.from(selectedPermissions) });
      onClose();
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl rounded-lg bg-surface shadow-2xl border border-border flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-6 py-4 bg-surface rounded-t-lg">
          <div>
            <h3 className="text-lg font-semibold text-primary">
              Manage Permissions
            </h3>
            <p className="text-sm text-secondary">
              Role: <span className="font-medium text-brand">{role?.name}</span>
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={isSubmitting ? undefined : onClose} disabled={isSubmitting}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState description="Failed to load permissions." />
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedPermissions).map(([module, perms]) => {
                const isAllSelected = perms.every(p => selectedPermissions.has(p._id));

                return (
                  <div key={module} className="bg-main/30 rounded-lg border border-border/50 p-4">
                    <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-2">
                      <div className="flex items-center gap-2">
                        {getModuleIcon(module)}
                        <h4 className="text-base font-medium text-primary capitalize">
                          {module.replace(/([a-z])([A-Z])/g, '$1 $2')}
                        </h4>
                      </div>
                      <Button
                        type="button"
                        variant="ghostPrimary"
                        size="none"
                        onClick={() => handleToggleGroup(perms, isAllSelected)}
                        className="text-xs font-medium hover:underline"
                      >
                        {isAllSelected ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                      {perms.map(perm => {
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
                            <div className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                              isSelected
                                ? "bg-brand border-brand text-white"
                                : "border-secondary/40 bg-surface"
                            }`}>
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-primary leading-none mb-1">{perm.name}</p>
                              {perm.description && (
                                <p className="text-xs text-secondary leading-tight">{perm.description}</p>
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
          )}

          {submitError && (
            <div className="mt-6 rounded-xl bg-danger/8 border border-danger/20 px-4 py-3 text-sm text-danger">
              {submitError}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-6 py-4 flex-shrink-0">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSubmitting || isLoading || isError}>
            {isSubmitting ? "Saving..." : "Save Permissions"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
