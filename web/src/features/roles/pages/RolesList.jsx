import React, { useState, useEffect, useMemo } from "react"; 
import { useDebounce } from "../../../hooks/useDebounce";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { getRoles, createRole, updateRole, deleteRole } from "../api";
import { getPermissions } from "../../permissions/api";
import { Can } from "../../../components/Can";
import { usePermission } from "../../../hooks/usePermission";
import { Plus, Edit2, Trash2, Key, Search, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { RoleForm } from "../components/RoleModal";
import { AssignPermissionsForm } from "../components/AssignPermissionsModal";
import { EmptyState } from "../../../components/ui/EmptyState";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { getApiErrorMessage } from "../../../utils/apiResponse";
import { Tabs } from "../../../components/ui/Tabs";
import { FilterBar } from "../../../components/ui/FilterBar";
import { DataTable } from "../../../components/ui/DataTable";

export const RolesList = () => {
  const { can } = usePermission();
  const queryClient = useQueryClient();

  // Tab State
  const [activeTab, setActiveTab] = useState("roles");

  // Roles State
  const [rolesPage, setRolesPage] = useState(1);
  const [rolesSearch, setRolesSearch] = useState("");
  const debouncedRolesSearch = useDebounce(rolesSearch, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [permissionsRole, setPermissionsRole] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const limit = 10;

  // Permissions State
  const [permissionsSearch, setPermissionsSearch] = useState("");

  // Queries
  const { data: rolesData, isLoading: rolesLoading, isError: rolesError, error: rolesErrorData } = useQuery({
    queryKey: ["roles", { page: rolesPage, limit, search: debouncedRolesSearch }],
    queryFn: () => getRoles({ page: rolesPage, limit, search: debouncedRolesSearch }),
    placeholderData: keepPreviousData,
  });

  const { data: permissionsData, isLoading: permissionsLoading, isFetching: permissionsFetching } = useQuery({
    queryKey: ["permissions"],
    queryFn: getPermissions,
    enabled: can("permissions.read") && activeTab === "permissions",
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role created successfully");
      setIsModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role updated successfully");
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Role deleted successfully");
      setRoleToDelete(null);
    },
  });

  // Handlers
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
      setIsPermissionsModalOpen(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (roleToDelete) {
      await deleteMutation.mutateAsync(roleToDelete);
    }
  };

  // Data processing
  const roles = Array.isArray(rolesData?.data) ? rolesData.data : rolesData?.data?.roles || [];
  const rolesTotal = rolesData?.data?.total || roles.length;
  const rolesTotalPages = Math.ceil(rolesTotal / limit) || 1;

  const permissions = Array.isArray(permissionsData?.data) ? permissionsData.data : permissionsData?.data?.permissions || [];
  const filteredPermissions = useMemo(() => {
    if (!permissionsSearch.trim()) return permissions;
    const lower = permissionsSearch.toLowerCase();
    return permissions.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      (p.description && p.description.toLowerCase().includes(lower))
    );
  }, [permissions, permissionsSearch]);

  // Prefetch next page
  useEffect(() => {
    if (rolesPage < rolesTotalPages) {
      queryClient.prefetchQuery({
        queryKey: ["roles", { page: rolesPage + 1, limit, search: debouncedRolesSearch }],
        queryFn: () => getRoles({ page: rolesPage + 1, limit, search: debouncedRolesSearch }),
      });
    }
  }, [rolesPage, rolesTotalPages, limit, debouncedRolesSearch, queryClient]);

  // Columns definition
  const roleColumns = [
    { 
      header: "Role Name", 
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand" />
          <span className="font-semibold">{row.name}</span>
        </div>
      ) 
    },
    { 
      header: "Permissions Count", 
      accessor: (row) => (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-brand/10 text-brand inline-flex items-center gap-1">
          {row.permissions?.length || 0} assigned
        </span>
      ) 
    },
    {
      header: "Actions",
      isActions: true,
      accessor: (row) => (
        <div className="flex justify-end gap-1">
          <Can permission="roles.assign-permission">
            <Button
              variant="ghost"
              size="icon"
              leftIcon={Key}
              onClick={(e) => { e.stopPropagation(); setPermissionsRole(row); setIsPermissionsModalOpen(true); }}
              title="Manage Permissions"
            />
          </Can>
          <Can permission="roles.update">
            <Button
              variant="ghost"
              size="icon"
              leftIcon={Edit2}
              onClick={(e) => { e.stopPropagation(); setEditingRole(row); setIsModalOpen(true); }}
              title="Edit Role"
            />
          </Can>
          <Can permission="roles.delete">
            <Button
              variant="danger-ghost"
              size="icon"
              leftIcon={Trash2}
              onClick={(e) => { e.stopPropagation(); setRoleToDelete(row._id); }}
              title="Delete Role"
            />
          </Can>
        </div>
      )
    }
  ];

  const permissionColumns = [
    {
      header: "Permission Node",
      accessor: (row) => (
        <div className="flex items-center">
          <Key className="w-4 h-4 text-muted mr-2" />
          <span className="text-sm font-medium text-primary font-mono bg-main px-2 py-1 rounded border border-border/50 shadow-sm">
            {row.name}
          </span>
        </div>
      ),
    },
    {
      header: "Description",
      accessor: (row) => row.description || <span className="italic text-muted">No description available</span>,
      className: "text-secondary",
    },
  ];

  if (rolesError) return <ErrorState description={getApiErrorMessage(rolesErrorData, "Failed to load roles.")} />;

  const tabs = [
    { id: "roles", label: "Roles" },
    { id: "permissions", label: "System Permissions" }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Manage system access levels and explore available permissions."
        actions={
          activeTab === "roles" && (
            <Can permission="roles.create">
              <Button leftIcon={Plus} onClick={() => { setEditingRole(null); setIsModalOpen(true); }}>
                Create Role
              </Button>
            </Can>
          )
        }
      />

      <div className="flex-1 min-w-0 overflow-x-auto hide-scrollbar pb-1">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === "roles" && (
        <>
          <FilterBar 
            filters={{ search: rolesSearch }}
            searchPlaceholder="Search roles by name..."
            searchValue={rolesSearch}
            onSearchChange={(val) => { setRolesSearch(val); setRolesPage(1); }}
            onClear={rolesSearch ? () => { setRolesSearch(""); setRolesPage(1); } : undefined}
          />
          <DataTable 
            columns={roleColumns}
            data={roles}
            keyExtractor={r => r._id}
            isLoading={rolesLoading}
            pagination={{ page: rolesPage, totalPages: rolesTotalPages }}
            onPageChange={setRolesPage}
            mobileRow={(row) => ({
              title: <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand" />{row.name}</div>,
              subtitle: `${row.permissions?.length || 0} permissions assigned`,
              actions: (
                <>
                  <Can permission="roles.assign-permission">
                    <Button variant="ghost" size="sm" leftIcon={Key} onClick={(e) => { e.stopPropagation(); setPermissionsRole(row); setIsPermissionsModalOpen(true); }}>
                      Permissions
                    </Button>
                  </Can>
                  <Can permission="roles.update">
                    <Button variant="ghost" size="sm" leftIcon={Edit2} onClick={(e) => { e.stopPropagation(); setEditingRole(row); setIsModalOpen(true); }}>
                      Edit
                    </Button>
                  </Can>
                  <Can permission="roles.delete">
                    <Button variant="danger-ghost" size="sm" leftIcon={Trash2} onClick={(e) => { e.stopPropagation(); setRoleToDelete(row._id); }}>
                      Delete
                    </Button>
                  </Can>
                </>
              )
            })}
            emptyState={<EmptyState title="No roles found" description="Get started by creating a new role." actionLabel={can("roles.create") ? "Create Role" : null} onAction={can("roles.create") ? () => { setEditingRole(null); setIsModalOpen(true); } : undefined} />}
          />
        </>
      )}

      {activeTab === "permissions" && (
        <>
          <FilterBar 
            filters={{ search: permissionsSearch }}
            searchPlaceholder="Search permission nodes or descriptions..."
            searchValue={permissionsSearch}
            onSearchChange={setPermissionsSearch}
            onClear={permissionsSearch ? () => setPermissionsSearch("") : undefined}
          />
          <DataTable 
            columns={permissionColumns}
            data={filteredPermissions}
            keyExtractor={p => p.name}
            isLoading={permissionsLoading}
            isFetching={permissionsFetching}
            mobileRow={(row) => ({
              title: <span className="font-mono bg-main px-1.5 py-0.5 rounded border border-border/50 text-xs shadow-sm">{row.name}</span>,
              subtitle: row.description || "No description",
            })}
            emptyState={<EmptyState title="No permissions found" description="Try adjusting your search query." />}
          />
        </>
      )}

      {/* Modals */}
      <Modal
        isOpen={isModalOpen}
        title={editingRole ? "Edit Role" : "Create New Role"}
        onClose={() => setIsModalOpen(false)}
        maxWidth="max-w-4xl"
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
