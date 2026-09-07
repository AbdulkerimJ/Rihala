import { InfoBlock, InfoRow } from "../../../components/ui/InfoBlock";
import { SystemInfoSection } from "../../../components/ui/SystemInfoSection";
import { Badge } from "../../../components/ui/Badge";

export const ContractorOverviewTab = ({ contractor }) => {
  if (!contractor) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <InfoBlock title="Contractor Information">
          <InfoRow label="Phone Number" value={contractor.phone || "Not specified"} />
          <InfoRow
            label="Status"
            value={
              <Badge variant={contractor.status === "active" ? "success" : "outline"}>
                {contractor.status === "active" ? "Active" : "Inactive"}
              </Badge>
            }
          />
        </InfoBlock>
      </div>

      <div className="space-y-6">
        <SystemInfoSection
          id={contractor._id}
          idLabel="Contractor ID"
          createdAt={contractor.createdAt}
          updatedAt={contractor.updatedAt}
        />
      </div>
    </div>
  );
};
