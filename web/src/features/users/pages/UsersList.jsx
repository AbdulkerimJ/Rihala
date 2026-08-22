import { usePermission } from "../../../hooks/usePermission";
import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { UserPlus, CheckCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { Can } from "../../../components/Can";
import { TableSkeleton } from "../../../components/ui/skeletons";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { UserForm } from "../components/UserModal";
import { AssignRolesForm } from "../components/AssignRolesModal";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  restoreUser,
  getDeletedUsers,
  resendInvitation,
} from "../api";
import { getApiErrorMessage } from "../../../utils/apiResponse";
import { formatDateTime } from "../../../utils/formatters";

const USERS_QUERY_KEY = "users";

export const UsersList = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { can } = usePermission();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [rolesUser, setRolesUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [resendData, setResendData] = useState(null);

  const usersQuery = useQuery({
    queryKey: [USERS_QUERY_KEY, showDeleted],
    queryFn: () => (showDeleted ? getDeletedUsers() : getUsers()),
    placeholderData: keepPreviousData,
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
    meta: { suppressToast: true },
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("User updated successfully");
    },
    meta: { suppressToast: true },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("User deleted successfully");
      setUserToDelete(null);
    },
  });

  const activateMutation = useMutation({
    mutationFn: activateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("User activated successfully");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("User deactivated successfully");
    },
  });

  const restoreMutation = useMutation({
    mutationFn: restoreUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      toast.success("User restored successfully");
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendInvitation,
    onSuccess: (data) => {
      setResendData({
        email: data.data.user.email,
        code: data.data.invitationCode,
      });
      toast.success(data.message || "Invitation resent.");
    },
  });

  const handleSubmit = async (data) => {
    let response;
    if (editingUser) {
      response = await updateMutation.mutateAsync({ id: editingUser._id, data });
    } else {
      response = await createMutation.mutateAsync(data);
    }
    queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    return response;
  };

  const handleAssignRolesSubmit = async (data) => {
    if (rolesUser) {
      await updateMutation.mutateAsync({ id: rolesUser._id, data });
    }
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
              disabled={usersQuery.isFetching}
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

      {usersQuery.isLoading ? (
        <TableSkeleton columns={6} rows={6} />
      ) : users.length === 0 ? (
        <EmptyState
          title={showDeleted ? "No deleted users" : "No users found"}
          description={
            showDeleted
              ? "Deleted users will appear here."
              : "Invite a user to get started."
          }
          actionLabel={!showDeleted && can("users.create") ? "Invite User" : null}
          onAction={!showDeleted && can("users.create") ? () => setIsModalOpen(true) : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-main">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                    Roles
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-secondary">
                    Created
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    onClick={() => navigate(`/users/${user._id}`)}
                    className="hover:bg-main transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-2 text-xs font-medium text-primary">
                      <span className="hover:text-brand font-medium text-primary">
                        {user.name}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-secondary">
                      {user.email}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-4 py-2 text-xs text-secondary">
                      {user.roles?.length
                        ? user.roles.map((role) => role.name || role).join(", ")
                        : "-"}
                    </td>
                    <td className="px-4 py-2 text-xs text-secondary">
                      {formatDateTime(user.createdAt)}
                    </td>
                    <td
                      className="px-4 py-2 text-right text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1.5">
                        {!user.deletedAt && (
                          <>
                            <Can permission="users.assign-role">
                              <Button
                                variant="secondary"
                                size="xs"
                                onClick={() => {
                                  setRolesUser(user);
                                  setIsRolesModalOpen(true);
                                }}
                                title="Assign Roles"
                              >
                                <ShieldCheck className="h-3 w-3" />
                                Assign Roles
                              </Button>
                            </Can>
                            <Can permission="users.update">
                              <Button
                                variant="secondary"
                                size="xs"
                                onClick={() => {
                                  setEditingUser(user);
                                  setIsModalOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                              {user.status === "invited" && (
                                <Button
                                  variant="secondary"
                                  size="xs"
                                  onClick={() => resendMutation.mutate(user._id)}
                                  disabled={resendMutation.isPending && resendMutation.variables === user._id}
                                >
                                  Re-invite
                                </Button>
                              )}
                            </Can>
                            <Can permission="users.update">
                              {user.status === "inactive" ? (
                                <Button
                                  variant="secondary"
                                  size="xs"
                                  onClick={() => activateMutation.mutate(user._id)}
                                  disabled={activateMutation.isPending && activateMutation.variables === user._id}
                                >
                                  Activate
                                </Button>
                              ) : (
                                <Button
                                  variant="secondary"
                                  size="xs"
                                  onClick={() => deactivateMutation.mutate(user._id)}
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
                              size="xs"
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
                              size="xs"
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

      <Modal
        isOpen={isModalOpen}
        title={editingUser ? "Edit User" : "Invite New User"}
        onClose={() => setIsModalOpen(false)}
        maxWidth="max-w-md"
      >
        <UserForm
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          initialData={editingUser}
        />
      </Modal>
      <Modal
        isOpen={isRolesModalOpen}
        title="Assign Roles"
        onClose={() => setIsRolesModalOpen(false)}
        maxWidth="max-w-lg"
      >
        <AssignRolesForm
          onClose={() => setIsRolesModalOpen(false)}
          onSubmit={handleAssignRolesSubmit}
          user={rolesUser}
          isSubmitting={updateMutation.isPending}
        />
      </Modal>
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
      {resendData && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-md rounded-lg bg-surface shadow-2xl border border-border p-8 flex flex-col items-center text-center gap-4">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold text-primary">
              User Reinvited!
            </h3>
            <p className="text-sm text-secondary">
              An invitation email has been resent to{" "}
              <span className="font-medium text-primary">{resendData.email}</span>.
            </p>
            {resendData.code && (
              <div className="mt-4 w-full rounded-md border border-border bg-main p-4">
                <p className="text-sm font-medium text-primary mb-2">
                  Secure Verification Code
                </p>
                <div className="text-2xl font-mono font-bold tracking-widest text-brand">
                  {resendData.code}
                </div>
                <p className="mt-2 text-xs text-secondary">
                  Please securely communicate this new code to the user.
                </p>
              </div>
            )}
            <Button
              onClick={() => setResendData(null)}
              fullWidth
              className="mt-2"
            >
              Done
            </Button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
