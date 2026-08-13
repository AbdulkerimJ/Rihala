import React, { useEffect, useState } from "react";
import { usePermission } from "../../../hooks/usePermission";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Check } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { getRoles } from "../../roles/api";
import { Skeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { getApiErrorMessage } from "../../../utils/apiResponse";

export const AssignRolesModal = ({
  isOpen,
  onClose,
  onSubmit,
  user,
  isSubmitting,
}) => {
  const [selectedRoles, setSelectedRoles] = useState(new Set());
  const [submitError, setSubmitError] = useState(null);
  const { can } = usePermission();

  const { data: rolesData, isLoading, isError } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
    enabled: isOpen && can("roles.read"),
  });

  useEffect(() => {
    if (isOpen) {
      setSubmitError(null);
      if (user) {
        const initialIds = (user.roles || []).map((r) =>
          typeof r === "string" ? r : r._id
        );
        setSelectedRoles(new Set(initialIds));
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const rolesList = Array.isArray(rolesData?.data)
    ? rolesData.data
    : rolesData?.data?.roles || [];

  const handleToggle = (roleId) => {
    const newSet = new Set(selectedRoles);
    if (newSet.has(roleId)) {
      newSet.delete(roleId);
    } else {
      newSet.add(roleId);
    }
    setSelectedRoles(newSet);
  };

  const handleSave = async () => {
    try {
      setSubmitError(null);
      await onSubmit({ roles: Array.from(selectedRoles) });
      onClose();
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Assign Roles"
      onClose={isSubmitting ? undefined : onClose}
      maxWidth="max-w-lg"
    >
      <div className="p-6 space-y-6">
        <p className="text-sm text-secondary">
          User: <span className="font-medium text-brand">{user?.name}</span> ({user?.email})
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState description="Failed to load roles." />
        ) : rolesList.length === 0 ? (
          <p className="text-sm text-secondary italic text-center py-4">
            No roles available.
          </p>
        ) : (
          <div className="space-y-3">
            {rolesList.map((role) => {
              const isSelected = selectedRoles.has(role._id);

              return (
                <div
                  key={role._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleToggle(role._id)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      handleToggle(role._id);
                    }
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-colors select-none ${
                    isSelected
                      ? "bg-brand/10 border-brand/30"
                      : "bg-surface border-border hover:border-brand/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        isSelected
                          ? "bg-brand text-white"
                          : "bg-main text-secondary"
                      }`}
                    >
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary leading-none mb-1">
                        {role.name}
                      </p>
                      {role.permissions && (
                        <p className="text-xs text-secondary leading-tight">
                          {role.permissions.length} permission(s)
                        </p>
                      )}
                    </div>
                  </div>

                  <div
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                      isSelected
                        ? "bg-brand border-brand text-white"
                        : "border-secondary/40 bg-surface"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {submitError && (
          <div className="rounded-xl bg-danger/8 border border-danger/20 px-4 py-3 text-sm text-danger">
            {submitError}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            isLoading={isSubmitting}
            disabled={isSubmitting || isLoading || isError}
          >
            Save Roles
          </Button>
        </div>
      </div>
    </Modal>
  );
};
