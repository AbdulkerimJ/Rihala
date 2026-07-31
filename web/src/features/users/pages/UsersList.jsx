import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, createUser, updateUser, deleteUser } from "../api";
import { useAuth } from "../../../hooks/useAuth";
import { Can } from "../../../components/Can";
import { Edit2, Trash2, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { UserModal } from "../components/UserModal";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";

export const UsersList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const queryClient = useQueryClient();
  const limit = 10;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["users", { page, limit, search }],
    queryFn: () => getUsers({ page, limit, search }),
    keepPreviousData: true,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      toast.success("User created successfully");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to create user"),
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      toast.success("User updated successfully");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to update user"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      toast.success("User deleted successfully");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to delete user"),
  });

  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data) => {
    if (editingUser) {
      await updateMutation.mutateAsync({ id: editingUser._id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  // Since backend currently returns an array directly under data.data (no pagination meta),
  // we handle it defensively.
  const users = Array.isArray(data?.data) ? data.data : data?.data?.users || [];
  const total = data?.data?.total || users.length;
  const totalPages = Math.ceil(total / limit) || 1;

  if (isLoading) {
    return <LoadingSkeleton columnCount={4} rowCount={6} showSearch />;
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-red-500">Failed to load users.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-primary">
          Users Management
        </h1>
        <Can permission="users.create">
          <button
            onClick={() => handleOpenModal()}
            className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Add New User
          </button>
        </Can>
      </div>

      <div className="bg-surface shadow rounded-lg overflow-hidden border border-border">
        <div className="p-4 border-b border-border">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs px-4 py-2 border border-border rounded-md focus:ring-brand focus:border-brand bg-main text-primary sm:text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-main">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider"
                >
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-main transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold uppercase">
                        {user.name?.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-primary capitalize">
                          {user.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-3">
                      <Can permission="users.assign-role">
                        <button
                          className="text-brand hover:text-brand-hover"
                          title="Manage Roles"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      </Can>
                      <Can permission="users.update">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="text-accent hover:text-accent-hover"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </Can>
                      <Can permission="users.delete">
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="text-danger hover:text-danger-hover"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Can>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-10 text-center text-sm text-secondary"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div className="bg-surface px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPage((old) => Math.max(old - 1, 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-primary bg-surface hover:bg-main disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setPage((old) => (old < totalPages ? old + 1 : old))
              }
              disabled={page === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-primary bg-surface hover:bg-main disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-secondary">
                Showing page{" "}
                <span className="font-medium text-primary">{page}</span> of{" "}
                <span className="font-medium text-primary">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setPage((old) => Math.max(old - 1, 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border bg-surface text-sm font-medium text-primary hover:bg-main disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage((old) => (old < totalPages ? old + 1 : old))
                  }
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border bg-surface text-sm font-medium text-primary hover:bg-main disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingUser}
      />
    </div>
  );
};
