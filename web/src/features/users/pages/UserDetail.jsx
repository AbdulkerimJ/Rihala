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
import { ShieldCheck, Mail, Key, Calendar, Activity } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import { SummaryCard } from "../../../components/ui/SummaryCard";
import { AssignRolesForm } from "../components/AssignRolesModal";
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
        backTo="/users"
        backLabel="Back to users"
        actions={
          <Can permission="users.assign-role">
            <Button onClick={() => setIsRolesModalOpen(true)}>
              <ShieldCheck className="mr-2 h-4 w-4" /> Assign Roles
            </Button>
          </Can>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Email"
          value={user.email}
          icon={Mail}
        />
        <SummaryCard
          title="Status"
          value={<StatusBadge status={user.status} />}
          icon={Activity}
        />
        <SummaryCard
          title="Roles"
          value={
            user.roles?.length
              ? user.roles.map((role) => role.name || role).join(", ")
              : "None"
          }
          icon={Key}
        />
        <SummaryCard
          title="Created"
          value={formatDateTime(user.createdAt)}
          icon={Calendar}
        />
      </div>

      <Modal
        isOpen={isRolesModalOpen}
        title="Assign Roles"
        onClose={() => setIsRolesModalOpen(false)}
        maxWidth="max-w-lg"
      >
        <AssignRolesForm
          onClose={() => setIsRolesModalOpen(false)}
          onSubmit={handleAssignRolesSubmit}
          user={user}
          isSubmitting={updateMutation.isPending}
        />
      </Modal>
    </div>
  );
};
