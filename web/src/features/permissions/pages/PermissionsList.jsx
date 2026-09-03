import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePermission } from "../../../hooks/usePermission";
import { useDebounce } from "../../../hooks/useDebounce";
import { getPermissions } from "../api";
import { Key } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { FilterBar } from "../../../components/ui/FilterBar";
import { DataTable } from "../../../components/ui/DataTable";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";

export const PermissionsList = () => {
  const { can } = usePermission();
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["permissions"],
    queryFn: getPermissions,
    enabled: can("permissions.read"),
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

  const columns = [
    {
      header: "Permission Node",
      accessor: (row) => (
        <div className="flex items-center">
          <Key className="w-4 h-4 text-muted mr-2" />
          <span className="text-sm font-medium text-primary font-mono bg-main px-2 py-1 rounded">
            {row.name}
          </span>
        </div>
      ),
    },
    {
      header: "Description",
      accessor: (row) => row.description || "No description available",
      className: "text-secondary",
    },
  ];

  if (isError) return <ErrorState description={error?.message || "Failed to load permissions."} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Permissions"
        description="View system permission keys and descriptions."
      />

      <FilterBar 
        filters={{ search }}
        searchPlaceholder="Search permissions..."
        searchValue={search}
        onSearchChange={setSearch}
        onClear={search ? () => setSearch("") : undefined}
      />

      <DataTable 
        columns={columns}
        data={filteredPermissions}
        keyExtractor={(row) => row._id || row.name}
        isLoading={isLoading}
        isFetching={isFetching}
        mobileRow={(row) => ({
          title: <span className="font-mono">{row.name}</span>,
          subtitle: row.description || "No description available",
        })}
        emptyState={
          <EmptyState
            title="No permissions found"
            description="No permissions match your search filter."
          />
        }
      />
    </div>
  );
};

