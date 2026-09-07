import { FileText } from "lucide-react";
import { Can } from "../../../components/Can";
import { DetailSkeleton } from "../../../components/ui/skeletons";
import { ListGroup, ListItem } from "../../../components/ui/ListGroup";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { formatDateTime } from "../../../utils/formatters";

export const ContractorPaymentsTab = ({ payments = [], isLoading = false }) => {
  return (
    <Can permission="contractorPayments.read">
      <div>
        <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-3">
          Payment History
        </h3>
        {isLoading ? (
          <DetailSkeleton />
        ) : payments?.length > 0 ? (
          <ListGroup>
            {payments.map((row) => (
              <ListItem
                key={row._id}
                title={
                  <span className="font-mono text-[10px] font-bold text-primary tracking-widest">
                    {row.paymentReference}
                  </span>
                }
                subtitle={formatDateTime(row.paymentDate)}
                right={
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs sm:text-sm font-bold tracking-tight shrink-0 ${
                        row.status === "voided"
                          ? "line-through opacity-50 text-secondary"
                          : "text-primary"
                      }`}
                    >
                      <MoneyDisplay amount={row.amount} />
                    </span>
                    <StatusBadge status={row.status} className="shrink-0" />
                  </div>
                }
              />
            ))}
          </ListGroup>
        ) : (
          <div className="text-center py-6 text-sm text-secondary flex flex-col items-center border border-dashed border-border/50 rounded-lg">
            <FileText className="h-8 w-8 text-muted mb-2" />
            No payments have been recorded for this contractor.
          </div>
        )}
      </div>
    </Can>
  );
};
