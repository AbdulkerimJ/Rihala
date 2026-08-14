import React from "react";
import { DetailSection, DetailItem } from "./DetailSection";
import { formatDateTime } from "../../utils/formatters";

/**
 * Reusable system information card for detail pages.
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
    <DetailSection title="System Information" className={className}>
      <div className="space-y-1">
        {id && (
          <DetailItem
            label={idLabel}
            value={<span className="font-mono text-xs">{id}</span>}
          />
        )}
        {extraItems.map((item, index) => (
          <DetailItem key={index} label={item.label} value={item.value} />
        ))}
        {createdAt && (
          <DetailItem label="Created On" value={formatDateTime(createdAt)} />
        )}
        {updatedAt && (
          <DetailItem label="Last Updated" value={formatDateTime(updatedAt)} />
        )}
      </div>
    </DetailSection>
  );
};
