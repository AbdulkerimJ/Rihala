import { HardHat, Edit, Calendar, ClipboardList } from "lucide-react";
import { EntityHeader } from "../../../components/ui/EntityHeader";
import { Button } from "../../../components/ui/Button";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { Can } from "../../../components/Can";
import { formatDate } from "../../../utils/formatters";

export const ContractorHeader = ({
  contractor,
  stats,
  isStatsLoading,
  contractsCount = 0,
  activeContractsCount = 0,
  onEditClick,
  onViewContracts,
}) => {
  const isOwed = stats && stats.currentBalance > 0;
  const completionPercent =
    stats?.totalContractValue && stats.totalContractValue > 0
      ? Math.min(
          100,
          Math.round(
            ((stats.totalCompletedWorkValue || 0) / stats.totalContractValue) * 100
          )
        )
      : null;

  return (
    <EntityHeader
      parentTo="/contractors"
      parentLabel="Contractors"
      title={contractor.name}
      theme="amber"
      typeLabel="Contractor"
      typeIcon={HardHat}
      status={contractor.status}
      phone={contractor.phone}
      metaItems={[
        {
          icon: ClipboardList,
          label: (
            <span>
              {contractsCount} {contractsCount === 1 ? "Contract" : "Contracts"}
              {activeContractsCount > 0 && (
                <span className="ml-1 text-[11px] font-semibold text-accent">
                  ({activeContractsCount} active)
                </span>
              )}
            </span>
          ),
          onClick: onViewContracts,
          title: "View assigned contracts",
        },
        {
          icon: Calendar,
          label: `Joined ${formatDate(contractor.createdAt)}`,
          className: "hidden sm:inline-flex text-muted",
        },
      ]}
      actions={
        <Can permission="contractors.update">
          <Button
            variant="outline"
            size="sm"
            leftIcon={Edit}
            onClick={onEditClick}
            className="shadow-xs hover:border-accent/40 h-8 px-3 text-xs whitespace-nowrap"
          >
            Edit Profile
          </Button>
        </Can>
      }
      metrics={[
        {
          label: "Total Contract Value",
          value: <MoneyDisplay amount={stats?.totalContractValue ?? 0} />,
          subtitle: "Total committed",
          isLoading: isStatsLoading,
        },
        {
          label: "Completed Work",
          value: <MoneyDisplay amount={stats?.totalCompletedWorkValue ?? 0} />,
          subtitle:
            completionPercent !== null
              ? `${completionPercent}% of contract`
              : "Earned so far",
          isLoading: isStatsLoading,
        },
        {
          label: "Total Paid",
          value: <MoneyDisplay amount={stats?.totalPaid ?? 0} />,
          subtitle: "Disbursed to date",
          isLoading: isStatsLoading,
        },
        {
          label: "Owed Balance",
          value: (
            <MoneyDisplay
              amount={stats?.currentBalance ?? 0}
            />
          ),
          isLoading: isStatsLoading,
          statusDot: {
            color: isOwed ? "danger" : "success",
            text: isOwed ? "Remaining to pay" : "Fully settled",
            pulse: isOwed,
          },
        },
      ]}
    />
  );
};

