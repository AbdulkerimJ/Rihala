import { formatDateTime } from "../../utils/formatters";

/**
 * Reusable system information footer for detail pages.
 */
export const SystemInfoSection = ({
  id,
  idLabel = "ID",
  createdAt,
  updatedAt,
  extraItems = [],
  className = "",
}) => {
  return (
    <div className={`mt-8 pt-6 border-t border-border/40 ${className}`}>
      <h4 className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">System Information</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {id && (
          <div>
            <span className="text-xs text-secondary block mb-0.5">{idLabel}</span>
            <span className="font-mono text-xs text-muted break-all">{id}</span>
          </div>
        )}
        {extraItems.map((item, index) => (
          <div key={index}>
            <span className="text-xs text-secondary block mb-0.5">{item.label}</span>
            <span className="text-xs text-muted font-medium">{item.value}</span>
          </div>
        ))}
        {createdAt && (
          <div>
            <span className="text-xs text-secondary block mb-0.5">Created On</span>
            <span className="text-xs text-muted">{formatDateTime(createdAt)}</span>
          </div>
        )}
        {updatedAt && (
          <div>
            <span className="text-xs text-secondary block mb-0.5">Last Updated</span>
            <span className="text-xs text-muted">{formatDateTime(updatedAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
