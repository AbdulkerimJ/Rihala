import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { UserPlus } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { Can } from "../../../components/Can";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { UserModal } from "../components/UserModal";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  restoreUser,
  getDeletedUsers,
} from "../api";
import { getApiErrorMessage } from "../../../utils/apiResponse";
import { formatDateTime } from "../../../utils/formatters";

const USERS_QUERY_KEY = "users";

export const UsersList = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);

  const usersQuery = useQuery({
    queryKey: [USERS_QUERY_KEY, showDeleted],
    queryFn: () => (showDeleted ? getDeletedUsers() : getUsers()),
  });

  const users = useMemo(() => {
    const payload = usersQuery.data;
    if (!payload?.data) return [];

    if (Array.isArray(payload.data)) {
      return payload.data;
    }
    
    if (Array.isArray(payload.data.data)) {
      return payload.data.data;
    }

    if (Array.isArray(payload.data.users)) {
      return payload.data.users;
    }

    return [];
  }, [usersQuery.data]);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("User invited successfully");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Failed to invite user")),
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("User updated successfully");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Failed to update user")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("User deleted successfully");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Failed to delete user")),
  });

  const activateMutation = useMutation({
    mutationFn: activateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("User activated successfully");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Failed to activate user")),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("User deactivated successfully");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Failed to deactivate user")),
  });

  const restoreMutation = useMutation({
    mutationFn: restoreUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("User restored successfully");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Failed to restore user")),
  });

  const handleSubmit = async (data) => {
    if (editingUser) {
      await updateMutation.mutateAsync({ id: editingUser._id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
  };

  const handleDelete = (id) => {
    setUserToDelete(id);
  };

  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      await deleteMutation.mutateAsync(userToDelete);
      setUserToDelete(null);
    }
  };

  if (usersQuery.isLoading) {
    return <LoadingSkeleton variant="users" rowCount={6} />;
  }

  if (usersQuery.isError) {
    return (
      <ErrorState
        description={getApiErrorMessage(
          usersQuery.error,
          "Failed to load users.",
        )}
        onRetry={refresh}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage invited users, active accounts, and role assignments."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowDeleted((value) => !value)}
            >
              {showDeleted ? "Show Existing Users" : "Show Deleted Users"}
            </Button>
            <Can permission="users.create">
              <Button
                onClick={() => {
                  setEditingUser(null);
                  setIsModalOpen(true);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" /> Invite User
              </Button>
            </Can>
          </>
        }
      />

      {users.length === 0 ? (
        <EmptyState
          title={showDeleted ? "No deleted users" : "No users found"}
          description={
            showDeleted
              ? "Deleted users will appear here."
              : "Invite a user to get started."
          }
          actionLabel={!showDeleted ? "Invite User" : null}
          onAction={!showDeleted ? () => setIsModalOpen(true) : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-main">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-main transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-primary">
                      <Link
                        className="hover:text-brand"
                        to={`/users/${user._id}`}
                      >
                        {user.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary">
                      {user.roles?.length
                        ? user.roles.map((role) => role.name || role).join(", ")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary">
                      {formatDateTime(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex justify-end gap-2">
                        {!user.deletedAt && (
                          <>
                            <Can permission="users.update">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setEditingUser(user);
                                  setIsModalOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                            </Can>
                            <Can permission="users.update">
                              {user.status === "inactive" ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => activateMutation.mutate(user._id)}
                                  disabled={activateMutation.isPending && activateMutation.variables === user._id}
                                >
                                  Activate
                                </Button>
                              ) : (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() =>
                                    deactivateMutation.mutate(user._id)
                                  }
                                  disabled={deactivateMutation.isPending && deactivateMutation.variables === user._id}
                                >
                                  Deactivate
                                </Button>
                              )}
                            </Can>
                          </>
                        )}
                        {user.deletedAt ? (
                          <Can permission="users.restore">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => restoreMutation.mutate(user._id)}
                              disabled={restoreMutation.isPending && restoreMutation.variables === user._id}
                            >
                              Restore
                            </Button>
                          </Can>
                        ) : (
                          <Can permission="users.delete">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(user._id)}
                            >
                              Delete
                            </Button>
                          </Can>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingUser}
      />
      <ConfirmDialog
        isOpen={!!userToDelete}
        title="Delete User"
        description="Are you sure you want to delete this user? They will immediately lose access to the system."
        confirmLabel="Delete"
        variant="danger"
        isSubmitting={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
};
