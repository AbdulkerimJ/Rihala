import { HardHat } from "lucide-react";
import { Can } from "../../../components/Can";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ListGroup, ListItem } from "../../../components/ui/ListGroup";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { formatDate } from "../../../utils/formatters";

export const ContractorContractsTab = ({ contracts = [], isLoading = false }) => {
  return (
    <Can permission="contracts.read">
      <div>
        <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-3">
          Assigned Contracts
        </h3>
        {isLoading ? (
          <DetailSkeleton />
        ) : contracts?.length > 0 ? (
          <ListGroup>
            {contracts.map((row) => {
              const completedQty =
                row.stats?.completedQuantity ??
                (row.status === "COMPLETED" ? row.quantity : 0);
              const totalQty = row.quantity || 0;
              const progress =
                totalQty > 0
                  ? Math.min(100, Math.round((completedQty / totalQty) * 100))
                  : 0;
              const isFullyCompleted = row.status === "COMPLETED" || progress >= 100;
              const isOverdue = row.stats?.isOverdue && row.status === "ACTIVE";
              const isPartiallyDone = progress > 0 && !isFullyCompleted;

              const variant = isFullyCompleted
                ? "success"
                : isOverdue
                ? "danger"
                : isPartiallyDone
                ? "warning"
                : "brand";

              return (
                <ListItem
                  key={row._id}
                  to={`/contracts/${row._id}`}
                  title={
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-accent uppercase tracking-widest bg-accent/10 px-1.5 py-0.5 rounded">
                        #{row.contractNumber || "-"}
                      </span>
                      <span className="text-primary font-medium">{row.taskName}</span>
                    </div>
                  }
                  subtitle={
                    <div className="flex flex-col mt-1">
                      <span className="text-sm text-secondary">
                        {row.taskTypeName} • {row.quantity} units @ <MoneyDisplay amount={row.unitPrice} />
                      </span>
                      <span className="text-xs text-muted mt-0.5">
                        Dated {formatDate(row.contractDate)}
                      </span>
                    </div>
                  }
                  right={
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-xs sm:text-sm font-bold text-finance-out">
                          <MoneyDisplay amount={row.quantity * row.unitPrice || 0} />
                        </span>
                        <StatusBadge status={row.status} className="shrink-0 text-[10px] sm:text-xs py-0.5 px-1.5" />
                      </div>
                      {totalQty > 0 && (
                        <div
                          className="w-16 sm:w-28 mt-0.5"
                          title={`${progress}% completed (${completedQty} / ${totalQty} units)${
                            isOverdue ? " - Overdue" : ""
                          }`}
                        >
                          <ProgressBar
                            progress={row.status === "CANCELLED" ? 0 : progress}
                            variant={row.status === "CANCELLED" ? "default" : variant}
                            size="sm"
                            animated={row.status === "ACTIVE" && isPartiallyDone}
                          />
                        </div>
                      )}
                    </div>
                  }
                />
              );
            })}
          </ListGroup>
        ) : (
          <div className="text-center py-6 text-sm text-secondary flex flex-col items-center border border-dashed border-border/50 rounded-lg">
            <HardHat className="h-8 w-8 text-muted mb-2" />
            No contracts assigned to this contractor.
          </div>
        )}
      </div>
    </Can>
  );
};
