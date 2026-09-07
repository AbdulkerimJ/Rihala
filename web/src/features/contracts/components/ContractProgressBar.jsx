import { ProgressBar } from "../../../components/ui/ProgressBar";
import { MoneyDisplay } from "../../../components/ui/MoneyDisplay";

export const ContractProgressBar = ({ contract }) => {
  const stats = contract.stats || {};
  const completedQty = stats.completedQuantity || 0;
  const totalQty = contract.quantity || 0;
  const progress = totalQty > 0 ? Math.min(100, Math.round((completedQty / totalQty) * 100)) : 0;
  
  // Determine variant based on progress and overdue status
  let variant = "brand"; // default in-progress blue
  if (progress >= 100) {
    variant = "success";
  } else if (contract.status === "ACTIVE" && stats.isOverdue) {
    variant = "danger";
  }

  return (
    <div className="bg-surface border border-border/50 rounded-xl p-6 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row justify-between gap-8">
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-secondary text-sm font-medium mb-1">Contract Progress</div>
              <div className="text-2xl font-bold text-primary">
                {completedQty} <span className="text-base text-secondary font-medium">/ {totalQty} units</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-primary">{progress}%</div>
            </div>
          </div>
          <ProgressBar progress={progress} variant={variant} size="sm" animated={progress < 100 && contract.status === "ACTIVE"} />
        </div>
        
        <div className="flex-1 space-y-4 md:border-l md:border-border/50 md:pl-8 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs sm:text-sm text-secondary mb-1">Earned Value</p>
              <p className="text-lg font-semibold text-primary"><MoneyDisplay amount={stats.completedWorkValue} /></p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-secondary mb-1">Total Paid</p>
              <p className="text-lg font-semibold text-finance-in"><MoneyDisplay amount={stats.totalPaid} /></p>
            </div>
          </div>
          <div className="pt-3 border-t border-border/50 flex justify-between items-center">
            <span className="text-sm font-medium text-accent">Payable Amount</span>
            <span className="text-lg font-bold text-accent"><MoneyDisplay amount={stats.payableAmount} /></span>
          </div>
        </div>
      </div>
    </div>
  );
};
