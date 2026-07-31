import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPermissions } from "../api";
import { Key } from "lucide-react";
import { LoadingSkeleton } from "../../../components/ui/LoadingSkeleton";

export const PermissionsList = () => {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["permissions"],
    queryFn: getPermissions,
  });

  const permissions = Array.isArray(data?.data)
    ? data.data
    : data?.data?.permissions || [];

  const filteredPermissions = useMemo(() => {
    if (!search.trim()) return permissions;
    const lowerSearch = search.toLowerCase();
    return permissions.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerSearch) ||
        (p.description && p.description.toLowerCase().includes(lowerSearch)),
    );
  }, [permissions, search]);

  if (isLoading) {
    return <LoadingSkeleton columnCount={2} rowCount={8} showSearch />;
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-red-500">
        Failed to load permissions.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-primary">
          System Permissions
        </h1>
      </div>

      <div className="bg-surface shadow rounded-lg overflow-hidden border border-border">
        <div className="p-4 border-b border-border">
          <input
            type="text"
            placeholder="Search permissions..."
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
                  Permission Node
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider"
                >
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {filteredPermissions.map((permission) => (
                <tr
                  key={permission._id}
                  className="hover:bg-main transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Key className="w-4 h-4 text-muted mr-2" />
                      <span className="text-sm font-medium text-primary font-mono bg-main px-2 py-1 rounded">
                        {permission.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-secondary">
                      {permission.description || "No description available"}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPermissions.length === 0 && (
                <tr>
                  <td
                    colSpan="2"
                    className="px-6 py-10 text-center text-sm text-secondary"
                  >
                    No permissions found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
