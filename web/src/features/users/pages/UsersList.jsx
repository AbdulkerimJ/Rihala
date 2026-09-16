import { usePermission } from "../../../hooks/usePermission";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle, ShieldCheck, Edit, Trash2, RotateCcw, XCircle, Send, Plus } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
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
import { ErrorState } from "../../../components/ui/ErrorState";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Can } from "../../../components/Can";
import { FilterBar } from "../../../components/ui/FilterBar";
import { Select } from "../../../components/ui/Select";
import { DataTable } from "../../../components/ui/DataTable";
import { TableSkeleton } from "../../../components/ui/skeletons";
import { EmptyState } from "../../../components/ui/EmptyState";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { UserForm } from "../components/UserModal";
import { AssignRolesForm } from "../components/AssignRolesModal";

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
  const [filters, setFilters] = useState({ search: "", status: "active" });
  const showDeleted = filters.status === "deleted";
  const [resendData, setResendData] = useState(null);

  const usersQuery = useQuery({
    queryKey: [USERS_QUERY_KEY, showDeleted],
    queryFn: () => (showDeleted ? getDeletedUsers() : getUsers()),
    placeholderData: keepPreviousData,
  });

  const users = useMemo(() => {
    const payload = usersQuery.data;
    if (!payload?.data) return [];

    let list = [];
    if (Array.isArray(payload.data)) {
      list = payload.data;
    } else if (Array.isArray(payload.data.data)) {
      list = payload.data.data;
    } else if (Array.isArray(payload.data.users)) {
      list = payload.data.users;
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    }

    return list;
  }, [usersQuery.data, filters.search]);

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

  const columns = [
    {
      header: "Name",
      accessor: "name",
      className: "font-medium text-primary",
    },
    {
      header: "Email",
      accessor: "email",
      className: "text-secondary",
    },
    {
      header: "Status",
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Roles",
      accessor: (row) =>
        row.roles?.length
          ? row.roles.map((role) => role.name || role).join(", ")
          : "-",
      className: "text-secondary hidden sm:table-cell",
    },
    {
      header: "Created",
      accessor: (row) => formatDateTime(row.createdAt),
      className: "text-secondary hidden md:table-cell",
    },
    {
      header: "Actions",
      isActions: true,
      accessor: (user) => (
        <div
          className="flex justify-end gap-1.5"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {!user.deletedAt && (
            <>
              <Can permission="users.assign-role">
                <Button
                  variant="ghost"
                  size="icon"
                  leftIcon={ShieldCheck}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setRolesUser(user);
                    setIsRolesModalOpen(true);
                  }}
                  title="Assign Roles"
                />
              </Can>
              <Can permission="users.update">
                <Button
                  variant="ghost"
                  size="icon"
                  leftIcon={Edit}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditingUser(user);
                    setIsModalOpen(true);
                  }}
                  title="Edit"
                />
                {user.status === "invited" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    leftIcon={Send}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      resendMutation.mutate(user._id);
                    }}
                    disabled={
                      resendMutation.isPending &&
                      resendMutation.variables === user._id
                    }
                    title="Re-invite"
                  />
                )}
              </Can>
              <Can permission="users.update">
                {user.status === "inactive" ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    leftIcon={CheckCircle}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      activateMutation.mutate(user._id);
                    }}
                    disabled={
                      activateMutation.isPending &&
                      activateMutation.variables === user._id
                    }
                    title="Activate"
                  />
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    leftIcon={XCircle}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deactivateMutation.mutate(user._id);
                    }}
                    disabled={
                      deactivateMutation.isPending &&
                      deactivateMutation.variables === user._id
                    }
                    title="Deactivate"
                  />
                )}
              </Can>
            </>
          )}
          {user.deletedAt ? (
            <Can permission="users.restore">
              <Button
                variant="ghost"
                size="icon"
                leftIcon={RotateCcw}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  restoreMutation.mutate(user._id);
                }}
                disabled={
                  restoreMutation.isPending &&
                  restoreMutation.variables === user._id
                }
                title="Restore"
              />
            </Can>
          ) : (
            <Can permission="users.delete">
              <Button
                variant="danger-ghost"
                size="icon"
                leftIcon={Trash2}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(user._id);
                }}
                title="Delete"
              />
            </Can>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage invited users, active accounts, and role assignments."
        actions={
          <>
            <Can permission="users.create">
              <Button
                variant="primary"
                leftIcon={Plus}
                onClick={() => {
                  setEditingUser(null);
                  setIsModalOpen(true);
                }}
              >
                Invite User
              </Button>
            </Can>
          </>
        }
      />

      <FilterBar 
        filters={filters}
        searchPlaceholder="Search by name or email..."
        searchValue={filters.search}
        onSearchChange={(val) => setFilters(p => ({ ...p, search: val }))}
        onClear={filters.search !== "" || filters.status !== "active" ? () => setFilters({ search: "", status: "active" }) : undefined}
      >
        <Select
          value={filters.status}
          onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))}
          options={[
            { value: "active", label: "Existing Users" },
            { value: "deleted", label: "Deleted Users" }
          ]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        data={users}
        keyExtractor={(user) => user._id}
        onRowClick={(user) => navigate(`/users/${user._id}`)}
        mobileRow={(user) => ({
          to: `/users/${user._id}`,
          title: user.name,
          subtitle: `${user.email}${user.roles?.length ? ` • ${user.roles.map((role) => role.name || role).join(", ")}` : ""}`,
          right: <StatusBadge status={user.status} />,
          actions: (
            <>
              {!user.deletedAt && (
                <>
                  <Can permission="users.assign-role">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={ShieldCheck}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setRolesUser(user);
                        setIsRolesModalOpen(true);
                      }}
                    >
                      Assign Roles
                    </Button>
                  </Can>
                  <Can permission="users.update">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={Edit}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingUser(user);
                        setIsModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    {user.status === "invited" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={Send}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          resendMutation.mutate(user._id);
                        }}
                        disabled={
                          resendMutation.isPending &&
                          resendMutation.variables === user._id
                        }
                      >
                        Re-invite
                      </Button>
                    )}
                  </Can>
                  <Can permission="users.update">
                    {user.status === "inactive" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={CheckCircle}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          activateMutation.mutate(user._id);
                        }}
                        disabled={
                          activateMutation.isPending &&
                          activateMutation.variables === user._id
                        }
                      >
                        Activate
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={XCircle}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deactivateMutation.mutate(user._id);
                        }}
                        disabled={
                          deactivateMutation.isPending &&
                          deactivateMutation.variables === user._id
                        }
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
                    variant="ghost"
                    size="sm"
                    leftIcon={RotateCcw}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      restoreMutation.mutate(user._id);
                    }}
                    disabled={
                      restoreMutation.isPending &&
                      restoreMutation.variables === user._id
                    }
                  >
                    Restore
                  </Button>
                </Can>
              ) : (
                <Can permission="users.delete">
                  <Button
                    variant="danger-ghost"
                    size="sm"
                    leftIcon={Trash2}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(user._id);
                    }}
                  >
                    Delete
                  </Button>
                </Can>
              )}
            </>
          ),
        })}
        isLoading={usersQuery.isLoading}
        isFetching={usersQuery.isFetching}
        emptyState={
          <EmptyState
            title={showDeleted ? "No deleted users" : "No users found"}
            description={
              showDeleted
                ? "Deleted users will appear here."
                : "Invite a user to get started."
            }
            actionLabel={
              !showDeleted && can("users.create") ? "Invite User" : null
            }
            onAction={
              !showDeleted && can("users.create")
                ? () => setIsModalOpen(true)
                : undefined
            }
          />
        }
      />

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
