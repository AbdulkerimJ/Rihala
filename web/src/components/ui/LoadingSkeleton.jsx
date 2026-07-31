import React from "react";

const SearchSkeleton = () => (
  <div className="bg-surface p-4 border-b border-border">
    <div className="h-10 w-full max-w-xs rounded-full bg-slate-200/70 animate-pulse" />
  </div>
);

const TableHeaderSkeleton = ({ count }) => (
  <thead className="bg-main">
    <tr>
      {Array.from({ length: count }, (_, index) => (
        <th
          key={index}
          className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider"
        >
          <div className="h-3 w-24 rounded-full bg-slate-200/70 animate-pulse" />
        </th>
      ))}
    </tr>
  </thead>
);

const TableRowSkeleton = ({ cellCount }) => (
  <tr className="hover:bg-main transition-colors">
    {Array.from({ length: cellCount }, (_, index) => (
      <td key={index} className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 w-full rounded bg-slate-200/70 animate-pulse" />
      </td>
    ))}
  </tr>
);

const UserRowSkeleton = () => (
  <tr className="hover:bg-main transition-colors">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-200/70 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-slate-200/70 animate-pulse" />
          <div className="h-3 w-24 rounded bg-slate-200/70 animate-pulse" />
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 w-40 rounded bg-slate-200/70 animate-pulse" />
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-6 w-20 rounded-full bg-slate-200/70 animate-pulse" />
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right">
      <div className="flex justify-end gap-2">
        <div className="h-8 w-8 rounded bg-slate-200/70 animate-pulse" />
        <div className="h-8 w-8 rounded bg-slate-200/70 animate-pulse" />
      </div>
    </td>
  </tr>
);

const RoleRowSkeleton = () => (
  <tr className="hover:bg-main transition-colors">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 w-28 rounded bg-slate-200/70 animate-pulse" />
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-full max-w-xs rounded bg-slate-200/70 animate-pulse" />
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-6 w-20 rounded-full bg-slate-200/70 animate-pulse" />
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right">
      <div className="flex justify-end gap-2">
        <div className="h-8 w-8 rounded bg-slate-200/70 animate-pulse" />
      </div>
    </td>
  </tr>
);

const PermissionRowSkeleton = () => (
  <tr className="hover:bg-main transition-colors">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 w-32 rounded bg-slate-200/70 animate-pulse" />
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-full rounded bg-slate-200/70 animate-pulse" />
    </td>
  </tr>
);

export const LoadingSkeleton = ({
  variant = "default",
  rowCount = 5,
  showSearch = false,
}) => {
  const rows = Array.from({ length: rowCount }, (_, index) => index);

  const renderContent = () => {
    switch (variant) {
      case "users":
        return (
          <>
            <div className="bg-surface p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-3">
                <div className="h-7 w-40 rounded-full bg-slate-200/70 animate-pulse" />
                <div className="h-4 w-56 rounded-full bg-slate-200/70 animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-28 rounded-full bg-slate-200/70 animate-pulse" />
                <div className="h-10 w-10 rounded-full bg-slate-200/70 animate-pulse" />
              </div>
            </div>
            <div className="bg-surface shadow rounded-lg overflow-hidden border border-border">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <TableHeaderSkeleton count={4} />
                  <tbody className="bg-surface divide-y divide-border">
                    {rows.map((row) => (
                      <UserRowSkeleton key={row} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      case "roles":
        return (
          <>
            <div className="bg-surface p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-3">
                <div className="h-7 w-44 rounded-full bg-slate-200/70 animate-pulse" />
                <div className="h-4 w-60 rounded-full bg-slate-200/70 animate-pulse" />
              </div>
              <div className="h-10 w-32 rounded-full bg-slate-200/70 animate-pulse" />
            </div>
            <div className="bg-surface shadow rounded-lg overflow-hidden border border-border">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <TableHeaderSkeleton count={4} />
                  <tbody className="bg-surface divide-y divide-border">
                    {rows.map((row) => (
                      <RoleRowSkeleton key={row} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      case "permissions":
        return (
          <>
            {showSearch && <SearchSkeleton />}
            <div className="bg-surface shadow rounded-lg overflow-hidden border border-border">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <TableHeaderSkeleton count={2} />
                  <tbody className="bg-surface divide-y divide-border">
                    {rows.map((row) => (
                      <PermissionRowSkeleton key={row} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      default:
        return (
          <>
            {showSearch && <SearchSkeleton />}
            <div className="bg-surface shadow rounded-lg overflow-hidden border border-border">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <TableHeaderSkeleton count={4} />
                  <tbody className="bg-surface divide-y divide-border">
                    {rows.map((row) => (
                      <TableRowSkeleton key={row} cellCount={4} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
    }
  };

  return <div className="space-y-4">{renderContent()}</div>;
};
