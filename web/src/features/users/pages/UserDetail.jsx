import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserById, updateUser } from "../api";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";
import { ShieldCheck } from "lucide-react";
import { AssignRolesModal } from "../components/AssignRolesModal";
import toast from "react-hot-toast";
import { formatDateTime } from "../../../utils/formatters";
import {
  getApiErrorMessage,
  unwrapEntityResponse,
} from "../../../utils/apiResponse";

import { usePermission } from "../../../hooks/usePermission";

export const UserDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users", id],
    queryFn: () => getUserById(id),
    enabled: !!id && can("users.read"),
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Roles updated successfully");
    },
  });

  const handleAssignRolesSubmit = async (formData) => {
    await updateMutation.mutateAsync({ id, data: formData });
  };

  const user = unwrapEntityResponse(data);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (isError || !user) {
    return (
      <ErrorState
        description={getApiErrorMessage(error, "Failed to load user details.")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.name}
        description="User details and account status."
        actions={
          <Can permission="users.assign-role">
            <Button onClick={() => setIsRolesModalOpen(true)}>
              <ShieldCheck className="mr-2 h-4 w-4" /> Assign Roles
            </Button>
          </Can>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="text-sm text-secondary">Email</div>
          <div className="mt-2 text-base text-primary">{user.email}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="text-sm text-secondary">Status</div>
          <div className="mt-2">
            <StatusBadge status={user.status} />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="text-sm text-secondary">Roles</div>
          <div className="mt-2 text-base font-medium text-primary">
            {user.roles?.length
              ? user.roles.map((role) => role.name || role).join(", ")
              : "-"}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="text-sm text-secondary">Created</div>
          <div className="mt-2 text-base text-primary">
            {formatDateTime(user.createdAt)}
          </div>
        </div>
      </div>

      <AssignRolesModal
        isOpen={isRolesModalOpen}
        onClose={() => setIsRolesModalOpen(false)}
        onSubmit={handleAssignRolesSubmit}
        user={user}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
};
