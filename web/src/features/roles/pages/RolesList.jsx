import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { getRoles, createRole, updateRole, deleteRole } from "../api";
import { Can } from "../../../components/Can";
import { Edit2, Trash2, Key } from "lucide-react";
import toast from "react-hot-toast";
import { RoleForm } from "../components/RoleModal";
import { AssignPermissionsForm } from "../components/AssignPermissionsModal";
import { TableSkeleton } from "../../../components/ui/skeletons";
import { EmptyState } from "../../../components/ui/EmptyState";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { getApiErrorMessage } from "../../../utils/apiResponse";

export const RolesList = () => {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [permissionsRole, setPermissionsRole] = useState(null);

  const [roleToDelete, setRoleToDelete] = useState(null);
  const queryClient = useQueryClient();
  const limit = 10;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["roles", { page, limit }],
    queryFn: () => getRoles({ page, limit }),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries(["roles"]);
      toast.success("Role created successfully");
    },
    meta: { suppressToast: true },
  });

  const updateMutation = useMutation({
    mutationFn: updateRole,
    onSuccess: () => {
      queryClient.invalidateQueries(["roles"]);
      toast.success("Role updated successfully");
    },
    meta: { suppressToast: true },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries(["roles"]);
      toast.success("Role deleted successfully");
    },
  });

  const handleOpenModal = (role = null) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data) => {
    if (editingRole) {
      await updateMutation.mutateAsync({ id: editingRole._id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handlePermissionsSubmit = async (data) => {
    if (permissionsRole) {
      await updateMutation.mutateAsync({ id: permissionsRole._id, data });
    }
  };

  const handleDeleteConfirm = async () => {
    if (roleToDelete) {
      await deleteMutation.mutateAsync(roleToDelete);
      setRoleToDelete(null);
    }
  };

  const roles = Array.isArray(data?.data) ? data.data : data?.data?.roles || [];
  const total = data?.data?.total || roles.length;
  const totalPages = Math.ceil(total / limit) || 1;

  useEffect(() => {
    if (page < totalPages) {
      queryClient.prefetchQuery({
        queryKey: ["roles", { page: page + 1, limit }],
        queryFn: () => getRoles({ page: page + 1, limit }),
      });
    }
  }, [page, totalPages, limit, queryClient]);



  if (isError) {
    return (
      <ErrorState
        description={getApiErrorMessage(error, "Failed to load roles.")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Create roles and manage their permissions."
        actions={
          <Can permission="roles.create">
            <Button onClick={() => handleOpenModal()}>Create Role</Button>
          </Can>
        }
      />

      {isLoading ? (
        <TableSkeleton columns={3} rows={6} />
      ) : (
        <div className="bg-surface shadow rounded-lg overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-main">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider"
                >
                  Role Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider"
                >
                  Permissions Count
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {roles.map((role) => (
                <tr key={role._id} className="hover:bg-main transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-primary">
                      {role.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-brand/10 text-brand">
                      {role.permissions?.length || 0} permissions
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-3">
                      <Can permission="roles.assign-permission">
                        <Button
                          variant="ghostPrimary"
                          size="icon"
                          onClick={() => {
                            setPermissionsRole(role);
                            setIsPermissionsModalOpen(true);
                          }}
                          title="Manage Permissions"
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                      </Can>
                      <Can permission="roles.update">
                        <Button
                          variant="ghostPrimary"
                          size="icon"
                          onClick={() => handleOpenModal(role)}
                          title="Edit Role"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </Can>
                      <Can permission="roles.delete">
                        <Button
                          variant="ghostDanger"
                          size="icon"
                          onClick={() => setRoleToDelete(role._id)}
                          title="Delete Role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </Can>
                    </div>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td
                    colSpan="3"
                    className="px-6 py-10 text-center text-sm text-secondary"
                  >
                    No roles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
      <Modal
        isOpen={isModalOpen}
        title={editingRole ? "Edit Role" : "Create New Role"}
        onClose={() => setIsModalOpen(false)}
        maxWidth="max-w-md"
      >
        <RoleForm
          initialData={editingRole}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>
      <Modal
        isOpen={isPermissionsModalOpen}
        title="Manage Permissions"
        onClose={() => setIsPermissionsModalOpen(false)}
        maxWidth="max-w-4xl"
      >
        <AssignPermissionsForm
          role={permissionsRole}
          onClose={() => setIsPermissionsModalOpen(false)}
          onSubmit={handlePermissionsSubmit}
          isSubmitting={updateMutation.isPending}
        />
      </Modal>
      <ConfirmDialog
        isOpen={!!roleToDelete}
        title="Delete Role"
        description="Are you sure you want to delete this role? This action cannot be undone and may affect users currently assigned to this role."
        confirmLabel="Delete"
        variant="danger"
        isSubmitting={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setRoleToDelete(null)}
      />
    </div>
  );
};
